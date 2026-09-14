import mongoose from 'mongoose';
import User from '../models/User.js';
import Patient from '../models/Patient.js';
import Admin from '../models/Admin.js';
import Message from '../models/Message.js';
import { getIO } from '../socket.js';

export const getContacts = async (req, res) => {
  const currentUserId = req.user.id;
  const currentUserRole = req.user.role;

  try {
    let contacts = [];

    if (currentUserRole === 'patient') {
      // Patients can message doctors (dentist), assistants, and admins
      const staff = await User.find({}, 'fullName email role phoneNumber');
      const admins = await Admin.find({}, 'fullName email role');
      
      contacts = [
        ...staff.map(s => ({ id: s._id.toString(), name: s.fullName, email: s.email, role: s.role, model: 'User' })),
        ...admins.map(a => ({ id: a._id.toString(), name: a.fullName, email: a.email, role: a.role, model: 'Admin' }))
      ];
    } else {
      // Dentist, Assistant, or Admin can message patients, and other staff/admins
      const patients = await Patient.find({}, 'name email phoneNumber homeAddress');
      const staff = await User.find({ _id: { $ne: currentUserId } }, 'fullName email role phoneNumber');
      const admins = await Admin.find({ _id: { $ne: currentUserId } }, 'fullName email role');

      contacts = [
        ...patients.map(p => ({ id: p._id.toString(), name: p.name, email: p.email, role: 'patient', model: 'Patient' })),
        ...staff.map(s => ({ id: s._id.toString(), name: s.fullName, email: s.email, role: s.role, model: 'User' })),
        ...admins.map(a => ({ id: a._id.toString(), name: a.fullName, email: a.email, role: a.role, model: 'Admin' }))
      ];
    }

    const userObjectId = new mongoose.Types.ObjectId(currentUserId);

    // 1. Compute unread message counts from each sender to currentUserId
    const unreadAgg = await Message.aggregate([
      {
        $match: {
          receiverId: userObjectId,
          read: false
        }
      },
      {
        $group: {
          _id: '$senderId',
          count: { $sum: 1 }
        }
      }
    ]);
    const unreadMap = new Map();
    unreadAgg.forEach(item => {
      unreadMap.set(item._id.toString(), item.count);
    });

    // 2. Compute latest message for each conversation involving currentUserId
    const latestAgg = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: userObjectId },
            { receiverId: userObjectId }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $addFields: {
          otherPartyId: {
            $cond: {
              if: { $eq: ['$senderId', userObjectId] },
              then: '$receiverId',
              else: '$senderId'
            }
          }
        }
      },
      {
        $group: {
          _id: '$otherPartyId',
          lastMessage: { $first: '$$ROOT' }
        }
      }
    ]);

    const lastMessageMap = new Map();
    latestAgg.forEach(item => {
      lastMessageMap.set(item._id.toString(), {
        _id: item.lastMessage._id,
        message: item.lastMessage.message,
        senderId: item.lastMessage.senderId.toString(),
        receiverId: item.lastMessage.receiverId.toString(),
        createdAt: item.lastMessage.createdAt,
        read: item.lastMessage.read || false
      });
    });

    // 3. Attach metadata to contacts
    const enhancedContacts = contacts.map(c => {
      const contactId = c.id.toString();
      const lastMsg = lastMessageMap.get(contactId) || null;
      const unread = unreadMap.get(contactId) || 0;
      return {
        ...c,
        id: contactId,
        lastMessage: lastMsg,
        unreadCount: unread
      };
    });

    // 4. Sort contacts: conversations with newest message first (pop to top)
    enhancedContacts.sort((a, b) => {
      if (a.lastMessage && b.lastMessage) {
        return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime();
      }
      if (a.lastMessage && !b.lastMessage) return -1;
      if (!a.lastMessage && b.lastMessage) return 1;
      return a.name.localeCompare(b.name);
    });

    res.json(enhancedContacts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching contacts", error: error.message });
  }
};

export const getChatHistory = async (req, res) => {
  const currentUserId = req.user.id;
  const { otherUserId } = req.params;

  try {
    // Automatically mark unread messages sent by otherUserId to currentUserId as read
    const updateResult = await Message.updateMany(
      {
        senderId: otherUserId,
        receiverId: currentUserId,
        read: false
      },
      {
        $set: { read: true, readAt: new Date() }
      }
    );

    // Notify otherUserId via socket that messages have been read
    if (updateResult.modifiedCount > 0) {
      try {
        const io = getIO();
        io.to(otherUserId).emit('messagesRead', {
          readerId: currentUserId,
          conversationWith: currentUserId
        });
      } catch (socketErr) {
        // Socket might not be initialized or user is offline
      }
    }

    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: currentUserId }
      ]
    })
    .sort({ createdAt: 1 })
    .populate([
      { path: 'senderId', select: 'fullName name email role' },
      { path: 'receiverId', select: 'fullName name email role' }
    ]);

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Error fetching chat history", error: error.message });
  }
};

export const markMessagesRead = async (req, res) => {
  const currentUserId = req.user.id;
  const { otherUserId } = req.params;

  try {
    const updateResult = await Message.updateMany(
      {
        senderId: otherUserId,
        receiverId: currentUserId,
        read: false
      },
      {
        $set: { read: true, readAt: new Date() }
      }
    );

    if (updateResult.modifiedCount > 0) {
      try {
        const io = getIO();
        io.to(otherUserId).emit('messagesRead', {
          readerId: currentUserId,
          conversationWith: currentUserId
        });
      } catch (socketErr) {
        // offline or socket uninitialized
      }
    }

    res.json({ success: true, updatedCount: updateResult.modifiedCount });
  } catch (error) {
    res.status(500).json({ message: "Error marking messages as read", error: error.message });
  }
};

export const sendMessageRest = async (req, res) => {
  const senderId = req.user.id;
  const { receiverId, receiverModel, message } = req.body;

  // Determine sender model
  let senderModel = 'User';
  if (req.user.role === 'patient') {
    senderModel = 'Patient';
  } else if (req.user.role === 'system_admin' || req.user.role === 'admin') {
    senderModel = 'Admin';
  }

  try {
    const newMessage = await Message.create({
      senderId,
      senderModel,
      receiverId,
      receiverModel,
      message,
      read: false
    });

    const populatedMessage = await Message.findById(newMessage._id).populate([
      { path: 'senderId', select: 'fullName name email role' },
      { path: 'receiverId', select: 'fullName name email role' }
    ]);

    // Emit via Socket.io if initialized
    try {
      const io = getIO();
      io.to(receiverId).emit('newMessage', populatedMessage);
      io.to(senderId).emit('newMessage', populatedMessage);
    } catch (socketErr) {
      console.log("Socket server error (message sent via HTTP only):", socketErr.message);
    }

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: "Error sending message", error: error.message });
  }
};
