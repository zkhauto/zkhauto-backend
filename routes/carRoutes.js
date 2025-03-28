import express from "express";
import Car from "../models/Car.js";
import mongoose from "mongoose";

const router = express.Router();

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

// POST route to add a new car
router.post("/cars", async (req, res) => {
  try {
    const carData = { ...req.body };

    // If no images provided, set default image URLs
    if (!carData.images || !carData.images.length) {
      carData.images = ["url_to_exterior2.jpg", "url_to_interior2.jpg"];
    }

    const car = new Car(carData);
    const savedCar = await car.save();
    res.status(201).json(savedCar);
  } catch (error) {
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
