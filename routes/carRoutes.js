import express from "express";
import Car from "../models/Car.js";
import mongoose from "mongoose";
import multer from "multer";
import { uploadImageToGCS } from "../middleware/imageUpload.js";

const router = express.Router();

// Configure multer for file uploads (using memory storage as imageUpload expects buffer)
const upload = multer({ storage: multer.memoryStorage() });

// GET route to fetch all cars
router.get("/cars", async (req, res) => {
  try {
    console.log("Fetching all cars...");
    const cars = await Car.find({});
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

// PUT route to update car details
router.put("/cars/:id", async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }

    // Update the number of images if specified
    if (req.body.numberOfImages) {
      const numberOfImages = req.body.numberOfImages;
      car.images = Array.from({ length: numberOfImages }, () => ({
        url: "",
        exists: true,
      }));
    }

    // Update other fields
    Object.keys(req.body).forEach((key) => {
      if (key !== "numberOfImages" && key !== "images") {
        car[key] = req.body[key];
      }
    });

    const updatedCar = await car.save();
    res.status(200).json(updatedCar);
  } catch (error) {
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

export default router;
