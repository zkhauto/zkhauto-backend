import express from 'express';
import OpenAI from 'openai';
import ChatLog from '../models/ChatLog.js';
import Car from '../models/Car.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const router = express.Router();

// Initialize OpenAI with API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Debug: Log the API key (remove in production)
console.log("🔑 OpenAI API Key loaded:", process.env.OPENAI_API_KEY ? "Yes" : "No");

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
      else if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
        response.reply = "You're welcome! Feel free to ask if you need any more information about our cars.";
      }
      else if (lowerMessage === 'ok' || lowerMessage === 'okay') {
        response.reply = "Great! Is there anything specific you'd like to know about our cars?";
      }
      else {
        // For general queries, show available cars
        const cars = await Car.find({ status: 'available' }).limit(5);
        if (cars.length > 0) {
          response.reply = `Here are some of our available cars:\n${cars.map(car => 
            `${car.brand} ${car.model} (${car.year}) - $${car.price.toLocaleString()}`
          ).join('\n')}\n\nYou can ask me about specific cars, prices, or features!`;
        } else {
          response.reply = "I'm sorry, we don't have any cars available at the moment.";
        }
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

export default router; 