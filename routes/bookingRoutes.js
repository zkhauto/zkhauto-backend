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
router.post("/test-drives", async (req, res) => {
  try {
    const { name, email, phone, date, time, carModel, notes } = req.body;
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
  } catch (error) {
    res.status(500).json({ message: "Error booking test drive" });
  }
});

export default router;
