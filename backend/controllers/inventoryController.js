import Inventory from '../models/Inventory.js';
import InventoryLog from '../models/InventoryLog.js';
import SupplyRequest from '../models/SupplyRequest.js';
import Task from '../models/Task.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Supplier from '../models/Supplier.js';
import SupplierOrder from '../models/SupplierOrder.js';
import { sendRealTimeNotification } from '../socket.js';
import { sendSupplierOrderEmail } from '../utils/emailService.js';
import PDFDocument from 'pdfkit';

// --- INVENTORY MANAGEMENT ---

// GET /api/inventory
export const getInventory = async (req, res) => {
  const { search, category, status } = req.query;
  try {
    const filter = {};
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    if (category) {
      filter.category = category;
    }

    const items = await Inventory.find(filter).sort({ name: 1 });

    // Client-side mapping or server-side mapping of stock status
    const processedItems = items.map(item => {
      const isCritical = item.quantity <= 0.2 * item.minimumThreshold || item.quantity === 0;
      const isLow = item.quantity < item.minimumThreshold;
      let calculatedStatus = 'FULL';
      if (isCritical) {
        calculatedStatus = 'CRITICAL';
      } else if (isLow) {
        calculatedStatus = 'Low Stock';
      }

      return {
        ...item.toObject(),
        status: calculatedStatus
      };
    });

    // Apply status filter if provided
    if (status) {
      const filtered = processedItems.filter(item => item.status.toLowerCase() === status.toLowerCase());
      return res.json(filtered);
    }

    res.json(processedItems);
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving inventory', error: error.message });
  }
};

// POST /api/inventory
export const addInventoryItem = async (req, res) => {
  const { name, category, quantity, minimumThreshold, unit, price, description } = req.body;
  try {
    const itemExists = await Inventory.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
    if (itemExists) {
      return res.status(400).json({ message: 'Inventory item with this name already exists' });
    }

    const newItem = await Inventory.create({
      name,
      category,
      quantity,
      minimumThreshold,
      unit,
      price,
      description
    });

    // Create a restocking log for the initial quantity if it is > 0
    if (quantity > 0) {
      await InventoryLog.create({
        item: newItem._id,
        type: 'restock',
        quantity,
        user: req.user.id,
        notes: 'Initial stock addition'
      });
    }

    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ message: 'Server error adding inventory item', error: error.message });
  }
};

// PUT /api/inventory/:id
export const updateInventoryItem = async (req, res) => {
  const { id } = req.params;
  const { name, category, minimumThreshold, unit, price, description } = req.body;
  try {
    const item = await Inventory.findById(id);
    if (!item) return res.status(404).json({ message: 'Inventory item not found' });

    if (name) item.name = name;
    if (category) item.category = category;
    if (minimumThreshold !== undefined) item.minimumThreshold = minimumThreshold;
    if (unit) item.unit = unit;
    if (price !== undefined) item.price = price;
    if (description !== undefined) item.description = description;

    const updatedItem = await item.save();
    res.json(updatedItem);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating inventory item', error: error.message });
  }
};

// DELETE /api/inventory/:id
export const deleteInventoryItem = async (req, res) => {
  const { id } = req.params;
  try {
    const item = await Inventory.findById(id);
    if (!item) return res.status(404).json({ message: 'Inventory item not found' });

    await item.deleteOne();
    res.json({ message: 'Inventory item removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting inventory item', error: error.message });
  }
};

// POST /api/inventory/:id/restock
export const restockItem = async (req, res) => {
  const { id } = req.params;
  const { quantity, notes } = req.body;
  try {
    const item = await Inventory.findById(id);
    if (!item) return res.status(404).json({ message: 'Inventory item not found' });

    item.quantity += Number(quantity);
    await item.save();

    // Log the transaction
    await InventoryLog.create({
      item: item._id,
      type: 'restock',
      quantity,
      user: req.user.id,
      notes: notes || 'Manual restocking'
    });

    res.json({ message: 'Item restocked successfully', item });
  } catch (error) {
    res.status(500).json({ message: 'Server error restocking item', error: error.message });
  }
};

// POST /api/inventory/:id/use
export const recordUsage = async (req, res) => {
  const { id } = req.params;
  const { quantity, notes } = req.body;
  try {
    const item = await Inventory.findById(id);
    if (!item) return res.status(404).json({ message: 'Inventory item not found' });

    if (item.quantity < quantity) {
      return res.status(400).json({ message: `Insufficient stock. Current stock is ${item.quantity} ${item.unit}.` });
    }

    item.quantity -= Number(quantity);
    await item.save();

    // Log the transaction
    await InventoryLog.create({
      item: item._id,
      type: 'usage',
      quantity,
      user: req.user.id,
      notes: notes || 'Manual usage entry'
    });

    // Check for Low Stock / Critical Alerts
    const isCritical = item.quantity <= 0.2 * item.minimumThreshold || item.quantity === 0;
    const isLow = item.quantity < item.minimumThreshold;

    if (isLow) {
      const alertType = isCritical ? 'CRITICAL' : 'Low Stock';
      const notifMessage = `Inventory alert: ${item.name} quantity has dropped to ${item.quantity} ${item.unit} (Minimum threshold: ${item.minimumThreshold}).`;
      
      const newNotif = await Notification.create({
        title: `${alertType} Warning: ${item.name}`,
        message: notifMessage,
        type: 'low_stock',
        recipientRole: 'assistant'
      });

      // Emit real-time notification to assistants
      sendRealTimeNotification(newNotif);
    }

    res.json({ message: 'Usage recorded successfully', item });
  } catch (error) {
    res.status(500).json({ message: 'Server error recording usage', error: error.message });
  }
};

// GET /api/inventory/logs
export const getInventoryLogs = async (req, res) => {
  try {
    const logs = await InventoryLog.find({})
      .populate('item', 'name category unit')
      .populate('user', 'fullName email role')
      .sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching inventory logs', error: error.message });
  }
};

// GET /api/inventory/report
export const getInventoryStatusReport = async (req, res) => {
  try {
    const items = await Inventory.find({});
    
    let totalItems = items.length;
    let lowStockCount = 0;
    let criticalStockCount = 0;
    let totalValue = 0;

    const itemsSummary = items.map(item => {
      const isCritical = item.quantity <= 0.2 * item.minimumThreshold || item.quantity === 0;
      const isLow = item.quantity < item.minimumThreshold;
      let status = 'FULL';
      
      if (isCritical) {
        criticalStockCount++;
        status = 'CRITICAL';
      } else if (isLow) {
        lowStockCount++;
        status = 'LOW STOCK';
      }

      totalValue += (item.quantity * (item.price || 0));

      return {
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        minimumThreshold: item.minimumThreshold,
        unit: item.unit,
        price: item.price || 0,
        value: item.quantity * (item.price || 0),
        status
      };
    });

    res.json({
      totalItems,
      lowStockCount,
      criticalStockCount,
      totalValue,
      items: itemsSummary
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error compiling inventory report', error: error.message });
  }
};

// GET /api/inventory/report/pdf
export const getInventoryReportPdf = async (req, res) => {
  try {
    const items = await Inventory.find({});
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=inventory_report.pdf');

    doc.pipe(res);

    // Header
    doc.fillColor('#0ea5e9').fontSize(24).text('DentPlus', { align: 'center' });
    doc.moveDown(0.5);
    doc.fillColor('#475569').fontSize(14).text('Inventory Status Report', { align: 'center' });
    doc.moveDown(1);

    doc.fillColor('#64748b').fontSize(10).text(`Generated Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
    doc.moveDown(1.5);

    // Summary Card Stats
    let totalValue = 0;
    let lowCount = 0;
    let criticalCount = 0;

    items.forEach(item => {
      const isCritical = item.quantity <= 0.2 * item.minimumThreshold || item.quantity === 0;
      const isLow = item.quantity < item.minimumThreshold;
      if (isCritical) criticalCount++;
      else if (isLow) lowCount++;
      totalValue += item.quantity * (item.price || 0);
    });

    doc.fillColor('#0f172a').fontSize(12).text('Inventory Summary:', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#334155');
    doc.text(`Total Items Tracked: ${items.length}`);
    doc.text(`Low Stock Items: ${lowCount}`);
    doc.text(`Critical Stock Items: ${criticalCount}`);
    doc.text(`Total Estimated Inventory Value: Rs. ${totalValue.toLocaleString()}`);
    doc.moveDown(2);

    // Table Header
    const startX = 50;
    let currentY = doc.y;

    doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold');
    doc.text('Item Name', startX, currentY, { width: 180 });
    doc.text('Category', startX + 180, currentY, { width: 80 });
    doc.text('Stock Level', startX + 260, currentY, { width: 80, align: 'right' });
    doc.text('Min Limit', startX + 340, currentY, { width: 60, align: 'right' });
    doc.text('Status', startX + 410, currentY, { width: 80, align: 'right' });

    currentY += 15;
    doc.strokeColor('#cbd5e1').lineWidth(1.5).moveTo(startX, currentY).lineTo(startX + 500, currentY).stroke();
    currentY += 8;

    doc.font('Helvetica').fillColor('#334155');

    // Populate rows
    items.forEach(item => {
      // Check if page needs break
      if (currentY > doc.page.height - 80) {
        doc.addPage();
        currentY = 50;
        
        // Re-draw headers on new page
        doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold');
        doc.text('Item Name', startX, currentY, { width: 180 });
        doc.text('Category', startX + 180, currentY, { width: 80 });
        doc.text('Stock Level', startX + 260, currentY, { width: 80, align: 'right' });
        doc.text('Min Limit', startX + 340, currentY, { width: 60, align: 'right' });
        doc.text('Status', startX + 410, currentY, { width: 80, align: 'right' });

        currentY += 15;
        doc.strokeColor('#cbd5e1').lineWidth(1.5).moveTo(startX, currentY).lineTo(startX + 500, currentY).stroke();
        currentY += 8;
        doc.font('Helvetica').fillColor('#334155');
      }

      const isCritical = item.quantity <= 0.2 * item.minimumThreshold || item.quantity === 0;
      const isLow = item.quantity < item.minimumThreshold;
      let statusText = 'FULL';
      let rowColor = '#334155';

      if (isCritical) {
        statusText = 'CRITICAL';
        rowColor = '#e11d48'; // red
      } else if (isLow) {
        statusText = 'LOW STOCK';
        rowColor = '#d97706'; // yellow/orange
      }

      doc.fillColor(rowColor);
      doc.text(item.name, startX, currentY, { width: 180 });
      doc.text(item.category, startX + 180, currentY, { width: 80 });
      doc.text(`${item.quantity} ${item.unit}`, startX + 260, currentY, { width: 80, align: 'right' });
      doc.text(`${item.minimumThreshold}`, startX + 340, currentY, { width: 60, align: 'right' });
      doc.text(statusText, startX + 410, currentY, { width: 80, align: 'right' });

      currentY += 20;
    });

    // Table cells leave the cursor at the last column, so pin the footer to the full page width
    const footerWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    let footerY = currentY + 30;
    if (footerY > doc.page.height - doc.page.margins.bottom - 20) {
      doc.addPage();
      footerY = doc.page.margins.top;
    }
    doc.fillColor('#64748b').fontSize(8).text(
      'End of Inventory Report. Official DentPlus documentation.',
      doc.page.margins.left,
      footerY,
      { width: footerWidth, align: 'center' }
    );

    doc.end();
  } catch (error) {
    console.error('Error generating PDF report:', error);
    res.status(500).json({ message: 'Server error generating PDF report', error: error.message });
  }
};


// --- SUPPLY REQUESTS ---

// POST /api/inventory/requests
export const createSupplyRequest = async (req, res) => {
  const { itemName, quantity, unit, notes } = req.body;
  try {
    if (req.user.role !== 'dentist') {
      return res.status(403).json({ message: 'Only dentists can request supplies' });
    }

    const newRequest = await SupplyRequest.create({
      dentist: req.user.id,
      itemName,
      quantity,
      unit: unit || 'units',
      notes: notes || ''
    });

    const populatedRequest = await SupplyRequest.findById(newRequest._id).populate('dentist', 'fullName email');

    // Notify assistants of the new request
    const newNotif = await Notification.create({
      title: 'New Supply Request',
      message: `Dr. ${req.user.fullName || 'Dentist'} requested ${quantity} ${unit || 'units'} of ${itemName}.`,
      type: 'general',
      recipientRole: 'assistant'
    });

    sendRealTimeNotification(newNotif);

    res.status(201).json(populatedRequest);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating supply request', error: error.message });
  }
};

// GET /api/inventory/requests
export const getSupplyRequests = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'dentist') {
      filter.dentist = req.user.id;
    }

    const requests = await SupplyRequest.find(filter)
      .populate('dentist', 'fullName email phoneNumber')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving supply requests', error: error.message });
  }
};

// PUT /api/inventory/requests/:id
export const updateSupplyRequestStatus = async (req, res) => {
  const { id } = req.params;
  const { status, adminNotes } = req.body; // status = 'Approved' | 'Rejected' | 'Fulfilled'
  try {
    const request = await SupplyRequest.findById(id).populate('dentist', 'fullName email');
    if (!request) return res.status(404).json({ message: 'Supply request not found' });

    request.status = status;
    if (adminNotes) request.adminNotes = adminNotes;
    await request.save();

    // If status is Fulfilled, automatically deduct the quantity from Inventory
    if (status === 'Fulfilled') {
      // Find matching inventory item (case-insensitive)
      const inventoryItem = await Inventory.findOne({ name: { $regex: `^${request.itemName}$`, $options: 'i' } });
      if (inventoryItem) {
        if (inventoryItem.quantity >= request.quantity) {
          inventoryItem.quantity -= request.quantity;
          await inventoryItem.save();

          // Log the usage
          await InventoryLog.create({
            item: inventoryItem._id,
            type: 'usage',
            quantity: request.quantity,
            user: req.user.id,
            notes: `Fulfillment of supply request from Dr. ${request.dentist?.fullName || 'Dentist'}`
          });

          // Check if quantity fell below threshold
          const isCritical = inventoryItem.quantity <= 0.2 * inventoryItem.minimumThreshold || inventoryItem.quantity === 0;
          const isLow = inventoryItem.quantity < inventoryItem.minimumThreshold;

          if (isLow) {
            const alertType = isCritical ? 'CRITICAL' : 'Low Stock';
            const alertNotif = await Notification.create({
              title: `${alertType} Warning: ${inventoryItem.name}`,
              message: `Inventory alert: ${inventoryItem.name} quantity fell to ${inventoryItem.quantity} ${inventoryItem.unit} after request fulfillment.`,
              type: 'low_stock',
              recipientRole: 'assistant'
            });
            sendRealTimeNotification(alertNotif);
          }
        }
      }
    }

    // Create Notification for the requesting dentist
    const dentistNotif = await Notification.create({
      dentist: request.dentist?._id,
      title: `Supply Request ${status}`,
      message: `Your request for ${request.quantity} ${request.unit} of ${request.itemName} has been ${status.toLowerCase()}. ${adminNotes ? 'Reason: ' + adminNotes : ''}`,
      type: 'general'
    });

    sendRealTimeNotification(dentistNotif);

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating supply request status', error: error.message });
  }
};


// --- TASKS ---

// POST /api/inventory/tasks
export const createTask = async (req, res) => {
  const { title, description, assignedTo, dueDate } = req.body;
  try {
    const newTask = await Task.create({
      title,
      description,
      assignedTo,
      assignedBy: req.user.id,
      dueDate
    });

    const populatedTask = await Task.findById(newTask._id)
      .populate('assignedTo', 'fullName email')
      .populate('assignedBy', 'fullName email');

    // Create notification for the assistant
    const taskNotif = await Notification.create({
      recipientId: assignedTo,
      title: 'New Task Assigned',
      message: `You have been assigned a new task: "${title}". Due date: ${dueDate ? new Date(dueDate).toLocaleDateString() : 'None'}.`,
      type: 'task'
    });

    sendRealTimeNotification(taskNotif);

    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating task', error: error.message });
  }
};

// GET /api/inventory/tasks
export const getTasks = async (req, res) => {
  try {
    let filter = {};
    // Assistants only see tasks assigned to them, Dentists/Admin see all
    if (req.user.role === 'assistant') {
      filter.assignedTo = req.user.id;
    }

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'fullName email')
      .populate('assignedBy', 'fullName email')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving tasks', error: error.message });
  }
};

// PUT /api/inventory/tasks/:id
export const updateTaskStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // status = 'Pending' | 'In Progress' | 'Completed'
  try {
    const task = await Task.findById(id)
      .populate('assignedTo', 'fullName email')
      .populate('assignedBy', 'fullName email');
      
    if (!task) return res.status(404).json({ message: 'Task not found' });

    task.status = status;
    await task.save();

    // Notify dentist/admin who assigned the task that it was completed
    if (status === 'Completed') {
      const completionNotif = await Notification.create({
        recipientId: task.assignedBy._id,
        title: 'Task Completed',
        message: `Task "${task.title}" has been marked as Completed by ${task.assignedTo?.fullName || 'Assistant'}.`,
        type: 'task'
      });
      sendRealTimeNotification(completionNotif);
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating task status', error: error.message });
  }
};


// --- ASSISTANT NOTIFICATIONS ---

// GET /api/inventory/notifications
export const getAssistantNotifications = async (req, res) => {
  try {
    // Return notifications targetted at assistant, or role specific, or general unassigned, sorted by newest
    const notifications = await Notification.find({
      $or: [
        { recipientRole: 'assistant' },
        { recipientId: req.user.id }
      ]
    }).sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching assistant notifications', error: error.message });
  }
};

// PUT /api/inventory/notifications/read
export const markAssistantNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        $or: [
          { recipientRole: 'assistant' },
          { recipientId: req.user.id }
        ]
      },
      { read: true }
    );
    res.json({ message: 'Assistant notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error marking assistant notifications as read', error: error.message });
  }
};


// --- LOW STOCK & PROCUREMENT ---

// GET /api/inventory/low-stock
export const getLowStockItems = async (req, res) => {
  try {
    const items = await Inventory.find({}).sort({ quantity: 1 });

    const lowStockItems = items
      .filter(item => item.quantity < item.minimumThreshold)
      .map(item => {
        const isCritical = item.quantity <= 0.2 * item.minimumThreshold || item.quantity === 0;
        const deficit = Math.max(0, item.minimumThreshold - item.quantity);
        const suggestedReorder = Math.max(item.minimumThreshold, (item.minimumThreshold * 2) - item.quantity);

        return {
          ...item.toObject(),
          deficit,
          suggestedReorder,
          status: isCritical ? 'CRITICAL' : 'Low Stock'
        };
      });

    res.json(lowStockItems);
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving low stock items', error: error.message });
  }
};


// --- SUPPLIER DIRECTORY ---

// GET /api/inventory/suppliers
export const getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find({}).sort({ name: 1 });
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving suppliers', error: error.message });
  }
};

// POST /api/inventory/suppliers
export const createSupplier = async (req, res) => {
  const { name, contactPerson, email, phone, address, categories, notes } = req.body;
  try {
    if (!name || !email) {
      return res.status(400).json({ message: 'Supplier name and email are required.' });
    }

    const existing = await Supplier.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'A supplier with this email already exists.' });
    }

    const supplier = await Supplier.create({
      name: name.trim(),
      contactPerson: contactPerson || '',
      email: email.trim().toLowerCase(),
      phone: phone || '',
      address: address || '',
      categories: Array.isArray(categories) && categories.length > 0 ? categories : ['Supply'],
      notes: notes || ''
    });

    res.status(201).json(supplier);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating supplier', error: error.message });
  }
};

// PUT /api/inventory/suppliers/:id
export const updateSupplier = async (req, res) => {
  const { id } = req.params;
  const { name, contactPerson, email, phone, address, categories, notes } = req.body;
  try {
    const supplier = await Supplier.findById(id);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    if (name) supplier.name = name.trim();
    if (contactPerson !== undefined) supplier.contactPerson = contactPerson;
    if (email) supplier.email = email.trim().toLowerCase();
    if (phone !== undefined) supplier.phone = phone;
    if (address !== undefined) supplier.address = address;
    if (categories) supplier.categories = categories;
    if (notes !== undefined) supplier.notes = notes;

    const updated = await supplier.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating supplier', error: error.message });
  }
};

// DELETE /api/inventory/suppliers/:id
export const deleteSupplier = async (req, res) => {
  const { id } = req.params;
  try {
    const supplier = await Supplier.findById(id);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    await supplier.deleteOne();
    res.json({ message: 'Supplier removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting supplier', error: error.message });
  }
};


// --- SUPPLIER ORDERS (WITH 5-DAY DELIVERY EMAIL) ---

// GET /api/inventory/supplier-orders
export const getSupplierOrders = async (req, res) => {
  try {
    const orders = await SupplierOrder.find({})
      .populate('inventoryItem', 'name category quantity minimumThreshold unit')
      .populate('supplier', 'name email phone')
      .populate('requestedBy', 'fullName email')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving supplier orders', error: error.message });
  }
};

// POST /api/inventory/supplier-orders
export const createSupplierOrder = async (req, res) => {
  const {
    inventoryItemId,
    itemName,
    category,
    quantity,
    unit,
    supplierId,
    supplierName,
    supplierEmail,
    notes
  } = req.body;

  try {
    if (!itemName || !quantity || !supplierEmail || !supplierName) {
      return res.status(400).json({
        message: 'Item name, quantity, supplier name, and supplier email are required.'
      });
    }

    // Set delivery deadline strictly to 5 days from order date
    const orderDate = req.body.orderDate ? new Date(req.body.orderDate) : new Date();
    const expectedDeliveryDate = new Date(orderDate.getTime() + (5 * 24 * 60 * 60 * 1000));

    const newOrder = await SupplierOrder.create({
      inventoryItem: inventoryItemId || null,
      itemName: itemName.trim(),
      category: category || 'Supply',
      quantity: Number(quantity),
      unit: unit || 'units',
      supplier: supplierId || null,
      supplierName: supplierName.trim(),
      supplierEmail: supplierEmail.trim().toLowerCase(),
      requestedBy: req.user?.id || null,
      orderDate,
      expectedDeliveryDate,
      deliveryDeadlineDays: 5,
      status: req.body.status || 'Requested',
      notes: notes || ''
    });

    const populatedOrder = await SupplierOrder.findById(newOrder._id)
      .populate('inventoryItem', 'name category unit')
      .populate('requestedBy', 'fullName email');

    if (req.body.sendEmail !== false) {
      // Send formal procurement email to supplier requesting delivery within 5 days
      const staffName = req.user?.fullName || 'Clinic Assistant';
      await sendSupplierOrderEmail({
        supplierEmail: supplierEmail.trim().toLowerCase(),
        supplierName: supplierName.trim(),
        itemName: itemName.trim(),
        quantity: Number(quantity),
        unit: unit || 'units',
        orderDate,
        expectedDeliveryDate,
        notes: notes || '',
        requestedByName: staffName
      });
    }

    // Create a notification for staff and broadcast via socket
    const orderNotif = await Notification.create({
      title: `Supplier Order Sent: ${itemName}`,
      message: `Procurement order for ${quantity} ${unit || 'units'} sent to ${supplierName}. Expected delivery within 5 days (${expectedDeliveryDate.toLocaleDateString()}).`,
      type: 'general',
      recipientRole: 'assistant'
    });
    sendRealTimeNotification(orderNotif);

    res.status(201).json(populatedOrder);
  } catch (error) {
    console.error('Create supplier order error:', error);
    res.status(500).json({ message: 'Server error creating supplier order', error: error.message });
  }
};

// PUT /api/inventory/supplier-orders/:id/receive
export const receiveSupplierOrder = async (req, res) => {
  const { id } = req.params;
  try {
    const order = await SupplierOrder.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Supplier order not found' });
    }

    if (order.status === 'Delivered') {
      return res.status(400).json({ message: 'Order has already been received and restocked.' });
    }

    order.status = 'Delivered';
    order.receivedDate = new Date();
    await order.save();

    // Restock the inventory item
    let inventoryItem = null;
    if (order.inventoryItem) {
      inventoryItem = await Inventory.findById(order.inventoryItem);
    }
    if (!inventoryItem) {
      inventoryItem = await Inventory.findOne({ name: { $regex: `^${order.itemName}$`, $options: 'i' } });
    }

    if (inventoryItem) {
      inventoryItem.quantity += Number(order.quantity);
      await inventoryItem.save();

      // Log the restocking transaction
      await InventoryLog.create({
        item: inventoryItem._id,
        type: 'restock',
        quantity: order.quantity,
        user: req.user?.id || null,
        notes: `Shipment received from supplier: ${order.supplierName} (Order #${order._id.toString().slice(-6)})`
      });
    }

    // Emit notification to staff
    const receiveNotif = await Notification.create({
      title: `Shipment Received: ${order.itemName}`,
      message: `Successfully received ${order.quantity} ${order.unit} from ${order.supplierName}. Inventory restocked automatically.`,
      type: 'general',
      recipientRole: 'assistant'
    });
    sendRealTimeNotification(receiveNotif);

    res.json({
      message: 'Order marked as delivered and inventory restocked successfully',
      order,
      inventoryItem
    });
  } catch (error) {
    console.error('Receive supplier order error:', error);
    res.status(500).json({ message: 'Server error processing received order', error: error.message });
  }
};

