import { Server } from 'socket.io';
import Message from './models/Message.js';

let io;
const userSockets = new Map(); // userId -> socket.id

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    socket.on('register', (data) => {
      // support both raw userId string and object { userId, role }
      const userId = typeof data === 'object' && data !== null ? data.userId : data;
      const role = typeof data === 'object' && data !== null ? data.role : null;

      if (userId) {
        userSockets.set(userId, socket.id);
        socket.join(userId);
        console.log(`👤 User registered: ${userId} to socket ${socket.id}`);
      }
      if (role) {
        socket.join(role);
        console.log(`👤 Socket ${socket.id} joined role room: ${role}`);
      }
    });

    socket.on('sendMessage', async (data) => {
      const { senderId, senderModel, receiverId, receiverModel, message } = data;
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

        // Send to receiver room/socket
        io.to(receiverId).emit('newMessage', populatedMessage);
        // Echo to sender
        io.to(senderId).emit('newMessage', populatedMessage);
      } catch (err) {
        console.error('❌ Error sending message:', err);
      }
    });

    socket.on('markRead', async (data) => {
      const { senderId, readerId } = data;
      if (!senderId || !readerId) return;
      try {
        await Message.updateMany(
          {
            senderId,
            receiverId: readerId,
            read: false
          },
          {
            $set: { read: true, readAt: new Date() }
          }
        );

        io.to(senderId).emit('messagesRead', {
          readerId,
          conversationWith: readerId
        });
      } catch (err) {
        console.error('❌ Error in markRead socket handler:', err);
      }
    });

    socket.on('disconnect', () => {
      for (const [userId, socketId] of userSockets.entries()) {
        if (socketId === socket.id) {
          userSockets.delete(userId);
          console.log(`🔌 User disconnected: ${userId}`);
          break;
        }
      }
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

/**
 * Sends a real-time notification to the target recipient(s) over sockets.
 */
export const sendRealTimeNotification = (notification) => {
  try {
    if (!io) {
      console.warn("Socket.io not initialized. Skipping real-time emission.");
      return;
    }
    
    // Format JSON representation for client consumption
    const payload = typeof notification.toJSON === 'function' ? notification.toJSON() : notification;

    if (payload.recipientId) {
      io.to(payload.recipientId.toString()).emit('newNotification', payload);
    }
    if (payload.dentist) {
      io.to(payload.dentist.toString()).emit('newNotification', payload);
    }
    if (payload.recipientRole) {
      io.to(payload.recipientRole).emit('newNotification', payload);
    }
  } catch (err) {
    console.error('❌ Error sending real-time notification:', err);
  }
};

