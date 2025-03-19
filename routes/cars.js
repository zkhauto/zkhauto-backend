const express = require('express');
const router = express.Router();
const Car = require('../models/Car');
const mongoose = require('mongoose');
const cors = require('cors');

// Enable CORS for all routes
router.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Get single car by ID
router.get("/:id", async (req, res) => {
  try {
    console.log("Fetching car by ID:", req.params.id);
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid car ID format" });
    }

    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }

    // Convert to plain object to include getters
    const carData = car.toObject({ getters: true });
    
    // Log detailed image information
    console.log("Found car:", {
      id: carData._id,
      brand: carData.brand,
      model: carData.model,
      images: carData.images?.map(img => ({
        url: img.url,
        exists: img.exists,
        isValid: Boolean(img.url)
      }))
    });

    // Ensure images array exists
    if (!carData.images) {
      carData.images = [];
    }

    // Filter out invalid images and ensure proper URL format
    carData.images = carData.images
      .filter(img => img && img.url)
      .map(img => ({
        ...img,
        exists: Boolean(img.url),
        url: img.url.startsWith('http') ? img.url : `https://storage.googleapis.com/zkhauto_bucket/car-images/${carData.brand.toLowerCase()}/${carData.brand.toLowerCase()}-${carData.model.toLowerCase().replace(/\s+/g, '-')}-${carData.images.indexOf(img) + 1}.jpg`
      }));

    res.json(carData);
  } catch (error) {
    console.error("Error fetching car:", error);
    res.status(500).json({ 
      message: "Failed to fetch car", 
      error: error.message 
    });
  }
});

// Get all cars
router.get("/", async (req, res) => {
  try {
    console.log("Fetching all cars");
    const cars = await Car.find({}).lean({ getters: true });
    
    // Process each car's images
    const processedCars = cars.map(car => {
      // Ensure images array exists
      if (!car.images) {
        car.images = [];
      }

      // Filter out invalid images and ensure proper URL format
      car.images = car.images
        .filter(img => img && img.url)
        .map(img => ({
          ...img,
          exists: Boolean(img.url),
          url: img.url.startsWith('http') ? img.url : `https://storage.googleapis.com/zkhauto_bucket/car-images/${car.brand.toLowerCase()}/${car.brand.toLowerCase()}-${car.model.toLowerCase().replace(/\s+/g, '-')}-${car.images.indexOf(img) + 1}.jpg`
        }));

      return car;
    });
    
    // Log processed cars
    console.log(`Found ${processedCars.length} cars`);
    processedCars.forEach(car => {
      console.log(`Car ${car._id} images:`, {
        brand: car.brand,
        model: car.model,
        images: car.images?.map(img => ({
          url: img.url,
          exists: img.exists,
          isValid: Boolean(img.url)
        }))
      });
    });
    
    res.json(processedCars);
  } catch (error) {
    console.error("Error fetching cars:", error);
    res.status(500).json({ 
      message: "Failed to fetch cars", 
      error: error.message 
    });
  }
});

// Update car
router.put("/:id", async (req, res) => {
  try {
    console.log("Updating car:", req.params.id);
    console.log("Update data:", req.body);

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid car ID format" });
    }

    // Check if car exists
    const existingCar = await Car.findById(req.params.id);
    if (!existingCar) {
      return res.status(404).json({ message: "Car not found" });
    }

    // Update the car with validation
    const updatedCar = await Car.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      {
        new: true, // Return updated document
        runValidators: true, // Run schema validations
        context: 'query' // Ensure validators have proper context
      }
    );

    console.log("Updated car:", updatedCar);
    res.json(updatedCar);

  } catch (error) {
    console.error("Error updating car:", error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: validationErrors 
      });
    }

    // Handle other errors
    res.status(500).json({ 
      message: "Failed to update car", 
      error: error.message 
    });
  }
});

// Bulk delete cars
router.delete("/bulk-delete", async (req, res) => {
  try {
    const { carIds } = req.body;
    console.log('Received request to delete cars:', carIds);

    if (!Array.isArray(carIds) || carIds.length === 0) {
      return res.status(400).json({ message: "No car IDs provided" });
    }

    // Validate all IDs are valid MongoDB ObjectIds
    const validIds = carIds.every(id => mongoose.Types.ObjectId.isValid(id));
    if (!validIds) {
      return res.status(400).json({ message: "Invalid car ID format" });
    }

    console.log(`Attempting to delete ${carIds.length} cars`);

    const result = await Car.deleteMany({ _id: { $in: carIds } });

    console.log('Delete result:', result);

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "No cars found to delete" });
    }

    res.json({ 
      message: `Successfully deleted ${result.deletedCount} cars`,
      deletedCount: result.deletedCount 
    });

  } catch (error) {
    console.error("Error in bulk delete:", error);
    res.status(500).json({ 
      message: "Failed to delete cars", 
      error: error.message 
    });
  }
}); 