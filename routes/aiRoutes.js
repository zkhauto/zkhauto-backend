import express from 'express';
import { isAuthenticated, isAdmin } from '../middleware/auth.js';
import AIPrediction from '../models/AIPrediction.js';
import Car from '../models/Car.js';

const router = express.Router();

// Get all AI predictions with sales data
router.get('/predictions', isAuthenticated, async (req, res) => {
  try {
    // Get all cars with their status
    const cars = await Car.find({}, 'brand model year price status createdAt');
    
    // Calculate demand based on sales and time on market
    const demandAnalysis = cars.reduce((acc, car) => {
      const key = `${car.brand} ${car.model}`;
      if (!acc[key]) {
        acc[key] = {
          model: key,
          total: 0,
          sold: 0,
          available: 0,
          daysOnMarket: 0,
          demandScore: 0
        };
      }
      
      acc[key].total++;
      if (car.status === 'sold') {
        acc[key].sold++;
      } else if (car.status === 'available') {
        acc[key].available++;
        const daysOnMarket = Math.floor((Date.now() - car.createdAt) / (1000 * 60 * 60 * 24));
        acc[key].daysOnMarket += daysOnMarket;
      }
      
      // Calculate demand score (higher score = higher demand)
      acc[key].demandScore = (acc[key].sold / acc[key].total) * 100;
      if (acc[key].available > 0) {
        acc[key].demandScore -= (acc[key].daysOnMarket / (acc[key].available * 30)) * 20;
      }
      
      return acc;
    }, {});

    // Get AI predictions
    const predictions = await AIPrediction.find()
      .populate('carId', 'brand model year price')
      .sort({ createdAt: -1 });

    // Combine predictions with demand analysis
    const combinedData = Object.values(demandAnalysis).map(item => ({
      model: item.model,
      value: item.demandScore,
      confidence: item.demandScore,
      sales: item.sold,
      available: item.available,
      daysOnMarket: item.daysOnMarket
    }));

    res.json(combinedData);
  } catch (error) {
    console.error('Error fetching AI predictions:', error);
    res.status(500).json({ message: 'Error fetching AI predictions' });
  }
});

// Get image analysis results with damage predictions
router.get('/image-analysis', isAuthenticated, async (req, res) => {
  try {
    const analysis = await AIPrediction.find()
      .populate('carId', 'brand model year price images condition')
      .sort({ createdAt: -1 });

    // Enhance analysis with condition-based predictions
    const enhancedAnalysis = analysis.map(item => {
      const conditionFactors = {
        'New': 1.0,
        'Used': 0.8
      };

      const conditionMultiplier = conditionFactors[item.carId.condition] || 0.8;
      
      return {
        ...item.toObject(),
        predictedValue: item.carId.price * conditionMultiplier,
        damageScore: item.defaults.reduce((score, defect) => {
          const severityFactors = {
            'None': 0,
            'Minor': 0.1,
            'Moderate': 0.3,
            'Major': 0.5
          };
          return score + (severityFactors[defect.severity] * defect.confidence / 100);
        }, 0)
      };
    });

    res.json(enhancedAnalysis);
  } catch (error) {
    console.error('Error fetching image analysis:', error);
    res.status(500).json({ message: 'Error fetching image analysis' });
  }
});

// Create new AI prediction
router.post('/analyze-image', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { carId, imageUrl } = req.body;
    
    // Find the car
    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    // TODO: Implement actual AI image analysis here
    // For now, we'll use mock data
    const defaults = [
      {
        type: "Paint",
        severity: "Minor",
        description: "Small scratch on rear bumper",
        confidence: 85
      },
      {
        type: "Tire",
        severity: "None",
        description: "Good condition",
        confidence: 92
      },
      {
        type: "Interior",
        severity: "Minor",
        description: "Slight wear on driver seat",
        confidence: 88
      }
    ];

    const prediction = new AIPrediction({
      carId,
      model: `${car.brand} ${car.model}`,
      confidence: 95,
      status: "pending",
      imageUrl,
      defaults
    });

    await prediction.save();
    res.status(201).json(prediction);
  } catch (error) {
    console.error('Error creating AI prediction:', error);
    res.status(500).json({ message: 'Error creating AI prediction' });
  }
});

// Update prediction status
router.patch('/predictions/:id/status', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const prediction = await AIPrediction.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!prediction) {
      return res.status(404).json({ message: 'Prediction not found' });
    }
    
    res.json(prediction);
  } catch (error) {
    console.error('Error updating prediction status:', error);
    res.status(500).json({ message: 'Error updating prediction status' });
  }
});

export default router; 