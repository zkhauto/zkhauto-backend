import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import { OpenAI } from "openai";
import { uploadImageToGCS } from "../middleware/imageUpload.js";
import Car from "../models/Car.js";
import { ImageAnnotatorClient } from '@google-cloud/vision';

// Load environment variables
dotenv.config();

const router = express.Router();

// Initialize OpenAI with API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Google Cloud Vision client
const visionClient = new ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

// Debug: Log the API key (remove in production)
console.log(
  "🔑 OpenAI API Key loaded in carRoutes:",
  process.env.OPENAI_API_KEY ? "Yes" : "No"
);

// Configure multer for file uploads (using memory storage as imageUpload expects buffer)
const upload = multer({ storage: multer.memoryStorage() });

// GET route to fetch all cars
router.get("/cars", async (req, res) => {
  try {
    console.log("Fetching all cars...");
    const { sortBy, sortOrder = 'asc', driveTrain, minMileage, maxMileage } = req.query;
    
    let query = {};
    if (driveTrain) {
      query.driveTrain = driveTrain.toUpperCase();
    }

    // Add mileage range filtering
    if (minMileage || maxMileage) {
      query.mileage = {};
      if (minMileage) {
        query.mileage.$gte = parseInt(minMileage);
      }
      if (maxMileage) {
        query.mileage.$lte = parseInt(maxMileage);
      }
    }

    let sortOptions = {};
    if (sortBy) {
      // Validate sortBy field exists in Car model
      const validSortFields = ["price", "year", "mileage", "createdAt"];
      if (validSortFields.includes(sortBy)) {
        sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;
      }
    }

    const cars = await Car.find(query).sort(sortOptions);
    console.log(`Found ${cars.length} cars`);
    console.log(
      "Car brands:",
      cars.map((car) => car.brand)
    );
    res.status(200).json(cars);
  } catch (error) {
    console.error("Error fetching cars:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch cars", message: error.message });
  }
});

// fetch only sold cars
router.get("/cars/sold", async (req, res) => {
  try {
    console.log("Fetching sold cars...");
    const cars = await Car.find({ status: "sold" });
    console.log(`Found ${cars.length} sold cars`);
    res.status(200).json(cars);
  } catch (error) {
    console.error("Error fetching sold cars:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch sold cars", message: error.message });
  }
});

// POST route to add a new car - use multer middleware here
router.post("/cars", upload.array("images", 3), async (req, res) => {
  try {
    const carData = { ...req.body };
    let uploadedImageUrls = [];

    // Check req.files (provided by multer) instead of req.body.images
    if (req.files && req.files.length > 0) {
      console.log(`Received ${req.files.length} files to upload.`);
      uploadedImageUrls = await Promise.all(
        req.files.map(async (file) => {
          // Pass the file object from multer to the upload function
          console.log(`Uploading file: ${file.originalname}`);
          const uploadedUrl = await uploadImageToGCS(file);
          console.log(`Uploaded ${file.originalname} to ${uploadedUrl}`);
          return uploadedUrl;
        })
      );
      carData.images = uploadedImageUrls;
    } else {
      // Set default image URLs if no images are provided
      console.log("No files received, setting default images.");
      carData.images = ["url_to_exterior2.jpg", "url_to_interior2.jpg"];
    }

    // Convert numeric fields from string if necessary (multer might stringify them)
    carData.year = parseInt(carData.year);
    carData.price = parseFloat(carData.price);
    carData.mileage = parseInt(carData.mileage);
    carData.engineCylinders = parseInt(carData.engineCylinders);
    carData.engineHorsepower = parseInt(carData.engineHorsepower);
    carData.rating = parseFloat(carData.rating);
    // Ensure features is an array
    if (carData.features && typeof carData.features === "string") {
      try {
        carData.features = JSON.parse(carData.features);
      } catch (e) {
        // Handle case where features might be sent differently
        carData.features = carData.features.split(",").map((f) => f.trim());
      }
    } else if (!carData.features) {
      carData.features = [];
    }

    console.log("Processed car data before saving:", carData);
    const car = new Car(carData);
    const savedCar = await car.save();
    console.log("Car saved successfully:", savedCar._id);
    res.status(201).json(savedCar);
  } catch (error) {
    console.error("Failed to add car:", error);
    res
      .status(500)
      .json({ error: "Failed to add car", message: error.message });
  }
});

// Bulk DELETE route to remove multiple cars - MUST come before the dynamic route
router.delete("/cars/bulk-delete", async (req, res) => {
  try {
    console.log("Received bulk delete request:", req.body);

    const { carIds } = req.body;
    if (!Array.isArray(carIds) || carIds.length === 0) {
      console.log("Invalid or empty carIds array:", carIds);
      return res.status(400).json({ message: "No car IDs provided" });
    }

    console.log("Attempting to delete cars with IDs:", carIds);

    // Validate all IDs are valid ObjectIds
    const validIds = carIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length !== carIds.length) {
      return res.status(400).json({
        message: "Invalid car IDs provided",
        invalidIds: carIds.filter((id) => !mongoose.Types.ObjectId.isValid(id)),
      });
    }

    // Delete multiple cars
    const result = await Car.deleteMany({ _id: { $in: validIds } });

    console.log("Bulk delete result:", result);

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "No cars found to delete" });
    }

    res.status(200).json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} cars`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Bulk delete error:", error);
    res.status(500).json({
      error: "Failed to delete cars",
      message: error.message,
      details: error.stack,
    });
  }
});

// Dynamic routes below - these should come after specific routes

// GET route to fetch car details by ID
router.get("/cars/:id", async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }
    res.status(200).json(car);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch car details", message: error.message });
  }
});

// PUT route to update car details - use multer middleware
router.put("/cars/:id", upload.array("images", 3), async (req, res) => {
  try {
    const carId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(carId)) {
      return res.status(400).json({ message: "Invalid Car ID" });
    }

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }

    const updateData = { ...req.body };

    // Handle image retention and uploads
    let finalImageList = [];
    const existingImages = car.images || [];

    // Parse retained images if provided
    let retainedImages = [];
    if (updateData.retainedImages) {
      try {
        retainedImages = JSON.parse(updateData.retainedImages);
        console.log(`Car ${carId} - Retained images:`, retainedImages);
        // Add retained images to final list
        finalImageList = [...retainedImages];
      } catch (e) {
        console.error("Error parsing retainedImages JSON:", e);
      }
      // Remove retainedImages from updateData as it's not a schema field
      delete updateData.retainedImages;
    } else {
      // If no retainedImages specified, keep all existing images
      finalImageList = [...existingImages];
    }

    // Handle potential new image uploads
    if (req.files && req.files.length > 0) {
      console.log(
        `Received ${req.files.length} new files to update for car ${carId}.`
      );

      const uploadedImageUrls = await Promise.all(
        req.files.map(async (file) => {
          console.log(`Uploading new file: ${file.originalname}`);
          const uploadedUrl = await uploadImageToGCS(file);
          console.log(`Uploaded ${file.originalname} to ${uploadedUrl}`);
          return uploadedUrl;
        })
      );

      // Add new images to final list
      finalImageList = [...finalImageList, ...uploadedImageUrls];
      console.log(`Car ${carId} - Final image list:`, finalImageList);
    }

    // Set the final image list in updateData
    updateData.images = finalImageList;

    // Convert numeric fields and handle features array
    if (updateData.year) updateData.year = parseInt(updateData.year);
    if (updateData.price) updateData.price = parseFloat(updateData.price);
    if (updateData.mileage) updateData.mileage = parseInt(updateData.mileage);
    if (updateData.engineCylinders)
      updateData.engineCylinders = parseInt(updateData.engineCylinders);
    if (updateData.engineHorsepower)
      updateData.engineHorsepower = parseInt(updateData.engineHorsepower);
    if (updateData.rating) updateData.rating = parseFloat(updateData.rating);

    // Ensure features is an array
    if (updateData.features && typeof updateData.features === "string") {
      try {
        updateData.features = JSON.parse(updateData.features);
      } catch (e) {
        console.warn(
          "Could not parse features JSON string, attempting split:",
          updateData.features
        );
        // Fallback if features are sent differently (e.g., comma-separated)
        updateData.features = updateData.features
          .split(",")
          .map((f) => f.trim());
      }
    } else if (!updateData.features) {
      // If features field is missing in update, keep existing or set to empty array
      // To clear features, frontend should send an empty array string '[]'
      // We avoid deleting it entirely unless explicitly empty
      if (updateData.features === undefined) {
        delete updateData.features; // Don't modify if not sent
      }
    } // If features is already an array (e.g., from JSON payload), do nothing

    console.log(`Updating car ${carId} with data:`, updateData);

    // Update the car document
    const updatedCar = await Car.findByIdAndUpdate(
      carId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedCar) {
      // This case might be redundant due to the initial findById check, but good practice
      return res
        .status(404)
        .json({ message: "Car not found after update attempt." });
    }

    console.log(`Car ${carId} updated successfully.`);
    res.status(200).json(updatedCar);
  } catch (error) {
    console.error(`Failed to update car ${req.params.id}:`, error);
    res
      .status(500)
      .json({ error: "Failed to update car", message: error.message });
  }
});

// DELETE route to remove a car
router.delete("/cars/:id", async (req, res) => {
  try {
    const car = await Car.findByIdAndDelete(req.params.id);
    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }
    res.status(200).json({ message: "Car deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to delete car", message: error.message });
  }
});

// Smart search endpoint
router.post("/smart-search", async (req, res) => {
  try {
    const { query } = req.body;

    // Parse the query using OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "Convert car search queries into JSON filters. Only include fields that are explicitly mentioned in the query.",
        },
        { role: "user", content: query },
      ],
      functions: [
        {
          name: "filterCars",
          parameters: {
            type: "object",
            properties: {
              brand: { type: "string" },
              model: { type: "string" },
              year: {
                type: "object",
                properties: {
                  min: { type: "number" },
                  max: { type: "number" },
                },
              },
              price: {
                type: "object",
                properties: {
                  min: { type: "number" },
                  max: { type: "number" },
                },
              },
              type: { type: "string" },
              fuel: { type: "string" },
              mileage: {
                type: "object",
                properties: {
                  max: { type: "number" },
                },
              },
              condition: { type: "string" },
            },
          },
        },
      ],
      function_call: { name: "filterCars" },
    });

    const filters = JSON.parse(
      response.choices[0].message.function_call.arguments
    );

    // Build MongoDB query from filters
    const mongoQuery = {};

    if (filters.brand) mongoQuery.brand = new RegExp(filters.brand, "i");
    if (filters.model) mongoQuery.model = new RegExp(filters.model, "i");
    if (filters.type) mongoQuery.type = new RegExp(filters.type, "i");
    if (filters.fuel) mongoQuery.fuel = new RegExp(filters.fuel, "i");
    if (filters.condition)
      mongoQuery.condition = new RegExp(filters.condition, "i");

    if (filters.year) {
      if (filters.year.min)
        mongoQuery.year = { ...mongoQuery.year, $gte: filters.year.min };
      if (filters.year.max)
        mongoQuery.year = { ...mongoQuery.year, $lte: filters.year.max };
    }

    if (filters.price) {
      if (filters.price.min)
        mongoQuery.price = { ...mongoQuery.price, $gte: filters.price.min };
      if (filters.price.max)
        mongoQuery.price = { ...mongoQuery.price, $lte: filters.price.max };
    }

    if (filters.mileage?.max) {
      mongoQuery.mileage = { $lte: filters.mileage.max };
    }

    // Add status filter to only show available cars
    mongoQuery.status = "available";

    // Execute the query
    const cars = await Car.find(mongoQuery);

    res.json({
      success: true,
      count: cars.length,
      filters,
      cars,
    });
  } catch (error) {
    console.error("Smart search error:", error);
    res.status(500).json({
      success: false,
      message: "Error processing search query",
      error: error.message,
    });
  }
});

// POST route to get AI prediction for car price and condition
router.post("/cars/predict", async (req, res) => {
  try {
    const carData = req.body;
    
    // Create a prompt for the AI
    const prompt = `Given the following car specifications:
Brand: ${carData.brand}
Model: ${carData.model}
Year: ${carData.year}
Type: ${carData.type}
Fuel: ${carData.fuel}
Mileage: ${carData.mileage}
Color: ${carData.color}
Engine Size: ${carData.engineSize}
Engine Cylinders: ${carData.engineCylinders}
Engine Horsepower: ${carData.engineHorsepower}
Transmission: ${carData.transmission}
Drive Train: ${carData.driveTrain}
Condition: ${carData.condition}
Features: ${carData.features.join(', ')}

Please provide:
1. A reasonable market price estimate in USD
2. A condition assessment (Excellent, Good, Fair, Poor) based on the provided information

Format your response as a JSON object with 'predictedPrice' and 'predictedCondition' fields.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a car valuation expert. Provide accurate price estimates and condition assessments based on car specifications."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 150
    });

    // Parse the AI response
    const response = JSON.parse(completion.choices[0].message.content);
    
    res.status(200).json({
      predictedPrice: response.predictedPrice,
      predictedCondition: response.predictedCondition
    });
  } catch (error) {
    console.error("Failed to get AI prediction:", error);
    res.status(500).json({ 
      error: "Failed to get AI prediction", 
      message: error.message 
    });
  }
});

// Get monthly sales data
router.get("/cars/sales/monthly", async (req, res) => {
  try {
    console.log("Fetching monthly sales data...");
    
    const monthlySales = await Car.aggregate([
      {
        $match: {
          status: "sold"
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$updatedAt" },
            month: { $month: "$updatedAt" }
          },
          totalSales: { $sum: "$price" },
          count: { $sum: 1 }
        }
      },
      {
        $sort: {
          "_id.year": -1,
          "_id.month": -1
        }
      },
      {
        $limit: 12 // Get last 12 months
      }
    ]);

    console.log(`Found ${monthlySales.length} months of sales data`);
    res.status(200).json(monthlySales);
  } catch (error) {
    console.error("Error fetching monthly sales:", error);
    res.status(500).json({ error: "Failed to fetch monthly sales", message: error.message });
  }
});

// Helper function to analyze car image for damage
async function analyzeCarImage(imageUrl) {
  try {
    console.log('Analyzing image:', imageUrl);

    // Perform multiple types of analysis in parallel
    const [objectDetection, labelDetection, webDetection] = await Promise.all([
      visionClient.objectLocalization(imageUrl),
      visionClient.labelDetection(imageUrl),
      visionClient.webDetection(imageUrl)
    ]);

    console.log('Analysis completed, processing results...');

    // Extract results with null checks
    const objects = objectDetection[0]?.localizedObjectAnnotations || [];
    const labels = labelDetection[0]?.labelAnnotations || [];
    const webEntities = webDetection[0]?.webDetection?.webEntities || [];

    // Log detection results
    console.log('Detected objects:', objects.map(obj => obj.name));
    console.log('Detected labels:', labels.map(label => label.description));

    // Enhanced damage indicators with car-specific terms
    const damageIndicators = {
      scratches: ['scratch', 'scratches', 'paint damage', 'paint chip', 'scuff', 'scrape'],
      dents: ['dent', 'dents', 'body damage', 'body work', 'impact damage', 'collision damage'],
      rust: ['rust', 'corrosion', 'oxidation', 'rust spots', 'rust damage'],
      cracks: ['crack', 'cracks', 'broken', 'damaged', 'fracture', 'split'],
      paint: ['paint fade', 'paint peeling', 'paint bubble', 'paint oxidation', 'clear coat damage'],
      glass: ['windshield crack', 'window damage', 'glass chip', 'glass crack'],
      mechanical: ['leak', 'fluid leak', 'engine damage', 'mechanical damage'],
      other: ['damage', 'repair', 'accident', 'collision', 'wear', 'deterioration']
    };

    // Car parts for location reference
    const carParts = {
      front: ['bumper', 'hood', 'grille', 'headlight', 'front fender'],
      side: ['door', 'side panel', 'mirror', 'window', 'wheel', 'tire'],
      rear: ['trunk', 'taillight', 'rear bumper', 'exhaust', 'back'],
      top: ['roof', 'sunroof', 'windshield', 'antenna']
    };

    const detectedIssues = [];
    let damageScore = 0;

    // Process objects with enhanced logging
    objects.forEach(object => {
      const objectName = object.name.toLowerCase();
      console.log(`Processing object: ${objectName} (confidence: ${object.score})`);

      // Check for damage indicators
      for (const [type, indicators] of Object.entries(damageIndicators)) {
        if (indicators.some(indicator => objectName.includes(indicator))) {
          const confidence = object.score * 100;
          const severity = confidence > 80 ? 'High' : confidence > 50 ? 'Medium' : 'Low';
          
          // Determine location based on car parts
          let location = object.name;
          for (const [area, parts] of Object.entries(carParts)) {
            if (parts.some(part => objectName.includes(part))) {
              location = `${area} ${object.name}`;
              break;
            }
          }

          detectedIssues.push({
            type: type.charAt(0).toUpperCase() + type.slice(1),
            confidence: confidence.toFixed(2),
            severity,
            location,
            boundingPoly: object.boundingPoly
          });

          damageScore += confidence * (severity === 'High' ? 1 : severity === 'Medium' ? 0.7 : 0.4);
        }
      }
    });

    // Process labels for additional context
    labels.forEach(label => {
      const labelName = label.description.toLowerCase();
      console.log(`Processing label: ${labelName} (confidence: ${label.score})`);

      for (const [type, indicators] of Object.entries(damageIndicators)) {
        if (indicators.some(indicator => labelName.includes(indicator))) {
          const confidence = label.score * 100;
          if (!detectedIssues.some(issue => issue.type.toLowerCase() === type)) {
            detectedIssues.push({
              type: type.charAt(0).toUpperCase() + type.slice(1),
              confidence: confidence.toFixed(2),
              severity: confidence > 80 ? 'High' : confidence > 50 ? 'Medium' : 'Low',
              location: 'Various',
              context: 'Detected through image analysis'
            });
          }
        }
      }
    });

    // Process web entities for additional context
    webEntities.forEach(entity => {
      const entityName = entity.description?.toLowerCase() || '';
      console.log(`Processing web entity: ${entityName} (score: ${entity.score})`);
    });

    // Normalize damage score to 0-100 range
    damageScore = Math.min(100, damageScore);

    // Enhanced condition assessment
    let overallCondition;
    if (damageScore < 10) {
      overallCondition = 'Excellent - Like New';
    } else if (damageScore < 30) {
      overallCondition = 'Very Good - Minor Wear';
    } else if (damageScore < 50) {
      overallCondition = 'Good - Normal Wear';
    } else if (damageScore < 70) {
      overallCondition = 'Fair - Some Damage';
    } else if (damageScore < 90) {
      overallCondition = 'Poor - Significant Damage';
    } else {
      overallCondition = 'Severe - Major Damage';
    }

    // Generate detailed recommended actions
    const recommendedActions = [];
    if (detectedIssues.length > 0) {
      const highPriorityIssues = detectedIssues.filter(issue => issue.severity === 'High');
      const mediumPriorityIssues = detectedIssues.filter(issue => issue.severity === 'Medium');
      
      highPriorityIssues.forEach(issue => {
        recommendedActions.push(`URGENT: Repair ${issue.type.toLowerCase()} on ${issue.location}`);
      });
      
      mediumPriorityIssues.forEach(issue => {
        recommendedActions.push(`Schedule repair for ${issue.type.toLowerCase()} on ${issue.location}`);
      });

      if (damageScore > 50) {
        recommendedActions.push('Recommend professional inspection for comprehensive damage assessment');
      }
    } else {
      recommendedActions.push('Vehicle appears to be in good condition. Regular maintenance recommended.');
      recommendedActions.push('Consider periodic inspections to maintain vehicle condition.');
    }

    const result = {
      damageScore: damageScore.toFixed(2),
      detectedIssues,
      overallCondition,
      recommendedActions,
      analysisDetails: {
        objectsDetected: objects.length,
        labelsDetected: labels.length,
        webEntities: webEntities.length,
        detectedObjects: objects.map(obj => ({
          name: obj.name,
          confidence: (obj.score * 100).toFixed(2)
        })),
        detectedLabels: labels.map(label => ({
          description: label.description,
          confidence: (label.score * 100).toFixed(2)
        }))
      }
    };

    console.log('Analysis result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Error analyzing car image:', error);
    throw error;
  }
}

// POST route to analyze car image for damage detection
router.post("/cars/analyze-image", async (req, res) => {
  try {
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ error: "Image URL is required" });
    }

    // Analyze the image using Google Cloud Vision API
    const analysisResults = await analyzeCarImage(imageUrl);

    res.status(200).json(analysisResults);
  } catch (error) {
    console.error("Error analyzing image:", error);
    res.status(500).json({ 
      error: "Failed to analyze image", 
      message: error.message,
      details: error.stack 
    });
  }
});

export default router;
