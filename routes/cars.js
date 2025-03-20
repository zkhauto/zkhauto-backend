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
        urlValid: Boolean(img.url && img.url.startsWith('https://storage.googleapis.com/zkhauto_bucket/'))
      }))
    });

    // Ensure images array exists and has proper structure
    if (!carData.images || !Array.isArray(carData.images)) {
      carData.images = [];
    }

    // For each image, verify the URL is valid
    carData.images = carData.images.map(img => ({
      ...img,
      exists: img.exists && Boolean(img.url && img.url.startsWith('https://storage.googleapis.com/zkhauto_bucket/')),
      url: img.url && img.url.startsWith('https://storage.googleapis.com/zkhauto_bucket/') ? img.url : null
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
      if (!car.images || !Array.isArray(car.images)) {
        car.images = [];
      }

      // Verify each image URL
      car.images = car.images.map(img => ({
        ...img,
        exists: img.exists && Boolean(img.url && img.url.startsWith('https://storage.googleapis.com/zkhauto_bucket/')),
        url: img.url && img.url.startsWith('https://storage.googleapis.com/zkhauto_bucket/') ? img.url : null
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
          urlValid: Boolean(img.url && img.url.startsWith('https://storage.googleapis.com/zkhauto_bucket/'))
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

// Create new car
router.post("/", async (req, res) => {
  try {
    console.log("Creating new car:", req.body);

    // Validate required fields
    const requiredFields = [
      "brand", "model", "year", "price", "type", "fuel", "mileage",
      "color", "engineSize", "engineCylinders", "engineHorsepower",
      "engineTransmission", "driveTrain", "description", "condition"
    ];

    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: "Missing required fields",
        fields: missingFields
      });
    }

    // Handle image URLs
    let images = [];
    if (req.body.images && Array.isArray(req.body.images)) {
      // If images array is provided
      console.log("Processing images array:", req.body.images);
      images = req.body.images
        .filter(img => img && img.url && img.url.trim() !== "" && img.url.startsWith('https://storage.googleapis.com/zkhauto_bucket/'))
        .map(img => ({
          url: img.url,
          exists: true
        }));
    } else if (req.body.image && req.body.image.trim() !== "" && req.body.image.startsWith('https://storage.googleapis.com/zkhauto_bucket/')) {
      // If a single image URL is provided
      console.log("Processing single image:", req.body.image);
      images = [{
        url: req.body.image,
        exists: true
      }];
    }

    // Log the processed images
    console.log("Processed images:", images);

    // Create new car with validated data
    const carData = {
      ...req.body,
      images: images,
      rating: req.body.rating || 0
    };

    // Log the final car data
    console.log("Creating car with data:", {
      ...carData,
      images: carData.images.map(img => ({
        url: img.url,
        exists: img.exists
      }))
    });

    const car = new Car(carData);
    await car.save();

    console.log("Created new car:", {
      id: car._id,
      brand: car.brand,
      model: car.model,
      images: car.images.map(img => ({
        url: img.url,
        exists: img.exists
      }))
    });

    res.status(201).json(car);
  } catch (error) {
    console.error("Error creating car:", error);
    
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
      message: "Failed to create car", 
      error: error.message 
    });
  }
}); 