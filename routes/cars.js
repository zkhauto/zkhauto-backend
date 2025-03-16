// Update car
router.put("/cars/:id", async (req, res) => {
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