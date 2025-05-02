import express from "express";
import Booking from "../models/Booking.js";
const router = express.Router();

// POST route to handle booking form submission
// router.post("/book", async (req, res) => {
//   const { name, email, carModel, testDriveDate } = req.body;
//   console.log("gfd", req.body);
//   try {
//     const newBooking = new Booking({
//       name,
//       email,
//       carModel,
//       testDriveDate,
//     });

//     await newBooking.save();

//     res.status(201).json({ message: "Booking successful!" });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ error: "Failed to create booking", message: error.message });
//   }
// });
router.post("/test-drive", async (req, res) => {
  try {
    const { name, email, phone, date, time, carModel, notes } = req.body;

    const existingBooking = await Booking.findOne({
      carModel,
      date,
      time,
      status: { $in: ["pending", "approved"] },
    });
    if (existingBooking) {
      return res.status(400).json({ message: "Test drive already booked" });
    } else {
      const testDrive = new Booking({
        name,
        email,
        phone,
        date,
        time,
        carModel,
        notes,
      });
      await testDrive.save();
      res.status(201).json(testDrive);
    }
  } catch (error) {
    res.status(500).json({ message: "Error booking test drive" });
  }
});

router.get("/test-drives", async (req, res) => {
  try {
    const testDrives = await Booking.find();
    res.status(200).json(testDrives);
  } catch (error) {
    res.status(500).json({ message: "Error fetching test drives" });
  }
});

// get approved test drives for a specific car model
router.get("/test-drives/approve", async (req, res) => {
  try {
    const testDrives = await Booking.find({
      status: "approved",
    });
    res.status(200).json(testDrives);
  } catch (error) {
    res.status(500).json({ message: "Error fetching test drives" });
  }
});

// router.get("/test-drives/:email", async (req, res) => {
//   try {
//     const { email } = req.params;
//     const testDrive = await Booking.findById(email);
//     res.status(200).json(testDrive);
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching test drive" });
//   }
// });

// Update test drive status (for admin)
router.put("/test-drives/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("id", id);
    const { status } = req.body;
    console.log("status", status);
    const updatedTestDrive = await Booking.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    res.status(200).json(updatedTestDrive);
  } catch (error) {
    res.status(500).json({ message: "Error updating test drive status" });
  }
});

// Delete a test drive (for admin)
router.delete("/test-drives/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("id", id);
    await Booking.findByIdAndDelete(id);
    res.status(200).json({ message: "Test drive deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting test drive" });
  }
});

export default router;
