import express from 'express';
import AdminChat from '../models/AdminChat.js';
import User from '../models/User.js';
import Message from '../models/Message.js';

const router = express.Router();

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ message: 'Access denied. Admin only.' });
};

// Apply isAdmin middleware to all routes
router.use(isAdmin);

// Send a message
router.post('/send', async (req, res) => {
  try {
    const { receiverId, message } = req.body;
    const senderId = req.user._id;

    const chatMessage = new AdminChat({
      sender: 'admin',
      senderId,
      receiverId,
      message
    });

    await chatMessage.save();
    
    // Emit the message to connected clients
    req.app.get('io').emit('newMessage', chatMessage);

    res.status(201).json(chatMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Error sending message' });
  }
});

// Get chat history between admin and user
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user._id;

    const messages = await AdminChat.find({
      $or: [
        { senderId: adminId, receiverId: userId },
        { senderId: userId, receiverId: adminId }
      ]
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ message: 'Error fetching chat history' });
  }
});

// Get all conversations for admin
router.get('/conversations', async (req, res) => {
  try {
    const conversations = await AdminChat.aggregate([
      {
        $match: {
          $or: [
            { senderId: req.user._id },
            { receiverId: req.user._id }
          ]
        }
      },
      {
        $group: {
          _id: {
            $cond: {
              if: { $eq: ['$senderId', req.user._id] },
              then: '$receiverId',
              else: '$senderId'
            }
          },
          lastMessage: { $last: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [
                  { $eq: ['$receiverId', req.user._id] },
                  { $eq: ['$status', 'sent'] }
                ]},
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          userId: '$_id',
          userName: '$user.displayName',
          userEmail: '$user.email',
          lastMessage: 1,
          unreadCount: 1,
          timestamp: '$lastMessage.timestamp'
        }
      },
      {
        $sort: { timestamp: -1 }
      }
    ]);

    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Error fetching conversations' });
  }
});

// Mark messages as read
router.put('/read/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user._id;

    await AdminChat.updateMany(
      {
        senderId: userId,
        receiverId: adminId,
        status: 'sent'
      },
      { $set: { status: 'read' } }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Error marking messages as read' });
  }
});

// Delete a single message
router.delete('/message/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await AdminChat.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if the admin has permission to delete this message
    if (message.receiverId.toString() !== req.user._id.toString() && 
        message.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    await AdminChat.findByIdAndDelete(messageId);
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Error deleting message' });
  }
});

// Delete entire conversation with a user
router.delete('/conversation/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user._id;

    // Delete all messages between the admin and the user
    const result = await AdminChat.deleteMany({
      $or: [
        { senderId: userId, receiverId: adminId },
        { senderId: adminId, receiverId: userId }
      ]
    });

    res.json({ 
      message: 'Conversation deleted successfully',
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ message: 'Error deleting conversation' });
  }
});

// Delete a single message (admin only)
router.delete('/delete-message/:messageId', isAdmin, async (req, res) => {
  try {
    const messageId = req.params.messageId;
    const deletedMessage = await Message.findByIdAndDelete(messageId);
    
    if (!deletedMessage) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    res.status(200).json({ 
      message: 'Message deleted successfully',
      deletedMessage
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ 
      message: 'Error deleting message',
      error: error.message 
    });
  }
});

// Delete entire conversation (admin only)
router.delete('/delete-conversation/:userId', isAdmin, async (req, res) => {
  try {
    const userId = req.params.userId;
    const adminId = req.user._id;
    
    const result = await Message.deleteMany({
      $or: [
        { senderId: userId, receiverId: adminId },
        { senderId: adminId, receiverId: userId }
      ]
    });
    
    res.status(200).json({ 
      message: 'Conversation deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ 
      message: 'Error deleting conversation',
      error: error.message 
    });
  }
});

export default router; 