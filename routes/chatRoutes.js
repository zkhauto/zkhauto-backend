import express from 'express';
import ChatLog from '../models/ChatLog.js';
import Car from '../models/Car.js';

const router = express.Router();

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
      else if (lowerMessage.includes('help') || lowerMessage.includes('assist')) {
        response.reply = `I can help you with:\n
- Finding cars by price range\n
- Showing newest/latest cars\n
- Information about specific car models\n
- General car inquiries\n
Just ask me anything about our car inventory!`;
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
      else if (/^\d{4}$/.test(message)) {
        const year = parseInt(message);
        const cars = await Car.find({ year: year, status: 'available' });
        if (cars.length > 0) {
          response.reply = `Here are our cars from ${year}:\n${cars.map(car => 
            `${car.brand} ${car.model} - $${car.price.toLocaleString()}`
          ).join('\n')}`;
        } else {
          response.reply = `I'm sorry, we don't have any cars from ${year} in stock at the moment.`;
        }
      }
      else if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
        response.reply = "You're welcome! Is there anything else I can help you with?";
      }
      else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
        response.reply = "Hello! How can I help you find your perfect car today?";
      }
      else if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye')) {
        response.reply = "Goodbye! Feel free to come back if you need any help finding a car.";
      }
      else if (lowerMessage === 'yes' || lowerMessage === 'yeah' || lowerMessage === 'okay' || lowerMessage === 'ok') {
        response.reply = "Great! What would you like to know about our cars? I can help you with prices, models, features, or any other specific details.";
      }
      else if (lowerMessage === 'great' || lowerMessage === 'awesome' || lowerMessage === 'perfect' || lowerMessage === 'excellent') {
        response.reply = "I'm glad you're satisfied! Would you like to know more about our cars? I can show you our latest models, prices, or any specific features you're interested in.";
      }
      else {
        // Default response for unrecognized queries
        response.reply = `I understand you're asking about "${message}". I can help you find cars based on:\n
- Price range\n
- Make and model\n
- Year\n
- Fuel type\n
- Features\n
What specific information are you looking for?`;
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
router.get('/logs', async (req, res) => {
  try {
    const logs = await ChatLog.find().sort({ timestamp: -1 });
    res.status(200).json(logs);
  } catch (error) {
    console.error('Error fetching chat logs:', error);
    res.status(500).json({ message: 'Failed to fetch chat logs.' });
  }
});

export default router; 