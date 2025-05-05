import express from 'express';
import OpenAI from 'openai';
import ChatLog from '../models/ChatLog.js';
import Car from '../models/Car.js';
import dotenv from 'dotenv';
import Chat from '../models/Chat.js';
import User from '../models/User.js';
import AdminChat from '../models/AdminChat.js';

// Load environment variables
dotenv.config();

const router = express.Router();

// Initialize OpenAI with API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Debug: Log the API key (remove in production)
console.log("🔑 OpenAI API Key loaded:", process.env.OPENAI_API_KEY ? "Yes" : "No");

// Test route for AI chat (no authentication required)
router.post('/test', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    let response = { reply: '' };
    const lowerMessage = message.toLowerCase();

    try {
      // First, try to handle specific car-related queries directly
      if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
        const cars = await Car.find({ status: 'available' }).sort({ price: 1 }).limit(5);
        if (cars.length > 0) {
          response.reply = `Here are some of our most affordable cars:\n${cars.map(car => 
            `${car.brand} ${car.model} (${car.year}) - $${car.price.toLocaleString()}`
          ).join('\n')}`;
        } else {
          response.reply = "I'm sorry, we don't have any cars available at the moment.";
        }
      }
      else if (lowerMessage.includes('new') || lowerMessage.includes('latest')) {
        const cars = await Car.find().sort({ year: -1 }).limit(5);
        if (cars.length > 0) {
          response.reply = `Here are our newest cars:\n${cars.map(car => 
            `${car.brand} ${car.model} (${car.year})${car.status === 'sold' ? ' - SOLD' : ''}`
          ).join('\n')}`;
        } else {
          response.reply = "I'm sorry, we don't have any cars available at the moment.";
        }
      }
      else if (lowerMessage.includes('electric') || lowerMessage.includes('ev')) {
        const electricCars = await Car.find({ fuel: 'Electric', status: 'available' });
        if (electricCars.length > 0) {
          response.reply = `We have ${electricCars.length} electric vehicles available:\n${electricCars.map(car => 
            `${car.brand} ${car.model} (${car.year}) - $${car.price.toLocaleString()}`
          ).join('\n')}`;
        } else {
          response.reply = "I'm sorry, we don't have any electric vehicles in stock at the moment.";
        }
      }
      else {
        // For general queries, use OpenAI
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `You are a helpful car dealership assistant. You have access to our car inventory and can help customers with:
              1. Finding cars by price, brand, model, or features
              2. Comparing different cars
              3. Explaining car features and specifications
              4. Answering general questions about cars and the dealership
              
              Keep your responses friendly, professional, and focused on helping customers find the right car.
              If you don't know something, be honest and suggest they contact our sales team.`
            },
            {
              role: "user",
              content: message
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        });
        response.reply = completion.choices[0].message.content;
      }
    } catch (dbError) {
      console.error('Database error:', dbError);
      response.reply = "I'm having trouble accessing our car database at the moment. Please try again later or contact our support team.";
    }

    res.status(200).json(response);
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      message: 'Failed to process chat message.',
      reply: "I'm sorry, I'm having trouble processing your request right now. Please try again later."
    });
  }
});

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
};

// Apply isAuthenticated middleware to all routes
router.use(isAuthenticated);

// Simple chat response handler
router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    let response = { reply: '' };
    const lowerMessage = message.toLowerCase();

    try {
      // First, try to handle specific car-related queries directly
      if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
        const cars = await Car.find({ status: 'available' }).sort({ price: 1 }).limit(5);
        if (cars.length > 0) {
          response.reply = `Here are some of our most affordable cars:\n${cars.map(car => 
            `${car.brand} ${car.model} (${car.year}) - $${car.price.toLocaleString()}`
          ).join('\n')}`;
        } else {
          response.reply = "I'm sorry, we don't have any cars available at the moment.";
        }
      }
      else if (lowerMessage.includes('new') || lowerMessage.includes('latest')) {
        const cars = await Car.find().sort({ year: -1 }).limit(5);
        if (cars.length > 0) {
          response.reply = `Here are our newest cars:\n${cars.map(car => 
            `${car.brand} ${car.model} (${car.year})${car.status === 'sold' ? ' - SOLD' : ''}`
          ).join('\n')}`;
        } else {
          response.reply = "I'm sorry, we don't have any cars available at the moment.";
        }
      }
      else if (lowerMessage.includes('electric') || lowerMessage.includes('ev')) {
        const electricCars = await Car.find({ fuel: 'Electric', status: 'available' });
        if (electricCars.length > 0) {
          response.reply = `We have ${electricCars.length} electric vehicles available:\n${electricCars.map(car => 
            `${car.brand} ${car.model} (${car.year}) - $${car.price.toLocaleString()}`
          ).join('\n')}`;
        } else {
          response.reply = "I'm sorry, we don't have any electric vehicles in stock at the moment.";
        }
      }
      else {
        // For general queries, use OpenAI
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `You are a helpful car dealership assistant. You have access to our car inventory and can help customers with:
              1. Finding cars by price, brand, model, or features
              2. Comparing different cars
              3. Explaining car features and specifications
              4. Answering general questions about cars and the dealership
              
              Keep your responses friendly, professional, and focused on helping customers find the right car.
              If you don't know something, be honest and suggest they contact our sales team.`
            },
            {
              role: "user",
              content: message
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        });

        response.reply = completion.choices[0].message.content;
      }
    } catch (dbError) {
      console.error('Database error:', dbError);
      response.reply = "I'm having trouble accessing our car database at the moment. Please try again later or contact our support team.";
    }

    // Log the chat interaction
    try {
      const chatLog = new ChatLog({
        user: req.user?.email || 'anonymous',
        message,
        response: response.reply,
        timestamp: new Date()
      });
      await chatLog.save();
    } catch (logError) {
      console.error('Error saving chat log:', logError);
      // Continue with the response even if logging fails
    }

    res.status(200).json(response);
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      message: 'Failed to process chat message.',
      reply: "I'm sorry, I'm having trouble processing your request right now. Please try again later."
    });
  }
});

// Get chat logs
router.get('/chat/logs', async (req, res) => {
  try {
    const logs = await ChatLog.find().sort({ createdAt: -1 });
    res.status(200).json(logs);
  } catch (error) {
    console.error('Error fetching chat logs:', error);
    res.status(500).json({ message: 'Error fetching chat logs', error: error.message });
  }
});

// Get all chat logs
router.get('/logs', async (req, res) => {
  try {
    const logs = await ChatLog.find().sort({ timestamp: -1 });
    res.json(logs);
  } catch (error) {
    console.error('Error fetching chat logs:', error);
    res.status(500).json({ message: 'Error fetching chat logs' });
  }
});

// Delete a single chat log
router.delete('/logs/:id', async (req, res) => {
  try {
    const log = await ChatLog.findByIdAndDelete(req.params.id);
    if (!log) {
      return res.status(404).json({ message: 'Chat log not found' });
    }
    res.json({ message: 'Chat log deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat log:', error);
    res.status(500).json({ message: 'Error deleting chat log' });
  }
});

// Delete multiple chat logs
router.delete('/logs', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Invalid or empty array of IDs' });
    }
    const result = await ChatLog.deleteMany({ _id: { $in: ids } });
    res.json({ message: `${result.deletedCount} chat logs deleted successfully` });
  } catch (error) {
    console.error('Error deleting chat logs:', error);
    res.status(500).json({ message: 'Error deleting chat logs' });
  }
});

// Send a message
router.post('/send', async (req, res) => {
  try {
    const { message, adminEmail } = req.body;
    const senderId = req.user._id;

    let targetAdmins;
    if (adminEmail) {
      // If specific admin email is provided, send only to that admin
      const admin = await User.findOne({ email: adminEmail, role: 'admin' });
      if (!admin) {
        return res.status(404).json({ message: 'Specified admin not found' });
      }
      targetAdmins = [admin];
    } else {
      // Otherwise, send to all admins
      targetAdmins = await User.find({ role: 'admin' });
      if (!targetAdmins || targetAdmins.length === 0) {
        return res.status(404).json({ message: 'No admin available' });
      }
    }

    // Send message to target admins
    const chatMessages = await Promise.all(targetAdmins.map(async (admin) => {
      const chatMessage = new AdminChat({
        sender: 'user',
        senderId,
        receiverId: admin._id,
        message
      });
      await chatMessage.save();
      return chatMessage;
    }));

    // Emit the messages to connected clients
    const io = req.app.get('io');
    chatMessages.forEach(msg => {
      io.to(msg.receiverId.toString()).emit('newMessage', msg);
    });

    res.status(201).json(chatMessages[0]); // Return the first message for backward compatibility
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Error sending message' });
  }
});

// Get chat history
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get messages between this user and all admins
    const messages = await AdminChat.find({
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ]
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ message: 'Error fetching chat history' });
  }
});

// Mark messages as read
router.put('/read/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      return res.status(404).json({ message: 'No admin available' });
    }

    await Chat.updateMany(
      {
        senderId: admin._id,
        receiverId: userId,
        status: 'sent'
      },
      { status: 'read' }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Error marking messages as read' });
  }
});

// Get chat history between specific user and admin
router.get('/history/:userId/:adminId', async (req, res) => {
  try {
    const { userId, adminId } = req.params;
    
    // Verify that the specified admin exists
    const admin = await User.findOne({ _id: adminId, role: 'admin' });
    if (!admin) {
      return res.status(404).json({ message: 'Specified admin not found' });
    }

    // Get messages between this user and the specified admin
    const messages = await Chat.find({
      $or: [
        { senderId: userId, receiverId: adminId },
        { senderId: adminId, receiverId: userId }
      ]
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ message: 'Error fetching chat history' });
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

    // Users can only delete their own messages
    if (message.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    await AdminChat.findByIdAndDelete(messageId);
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Error deleting message' });
  }
});

// Delete all messages sent by the user
router.delete('/messages', async (req, res) => {
  try {
    const userId = req.user._id;

    // Delete all messages sent by this user
    const result = await AdminChat.deleteMany({
      senderId: userId
    });

    res.json({ 
      message: 'Messages deleted successfully',
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Error deleting messages:', error);
    res.status(500).json({ message: 'Error deleting messages' });
  }
});

export default router; 