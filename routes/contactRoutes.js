import express from "express";
// import nodemailer from "nodemailer";
import Message from "../models/Message.js";

const router = express.Router();

// Submit a new message
router.post("/submit", async (req, res) => {
  const { fullName, email, phone, carModel, preferredDate, topic, message } =
    req.body;

  // Validate input
  if (!fullName || !email || !message || !topic) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    // Save message to database
    const newMessage = new Message({
      fullName,
      email,
      phone,
      carModel,
      preferredDate,
      topic,
      message,
    });
    await newMessage.save();

    // Send email notification to admin
    // const transporter = nodemailer.createTransport({
    //   service: "gmail",
    //   auth: {
    //     user: process.env.EMAIL_USER,
    //     pass: process.env.EMAIL_PASS,
    //   },
    // });

    // const mailOptions = {
    //   from: process.env.EMAIL_USER,
    //   to: process.env.ADMIN_EMAIL,
    //   subject: "New Contact Form Submission",
    //   text: `
    //     Name: ${fullName}
    //     Email: ${email}
    //     Phone: ${phone}
    //     Car Model: ${carModel}
    //     Preferred Date: ${preferredDate}
    //     Topic: ${topic}
    //     Message: ${message}
    //   `,
    // };

    // await transporter.sendMail(mailOptions);

    res.status(201).json({ message: "Message sent successfully!" });
  } catch (error) {
    console.error("Error saving message or sending email:", error);
    res.status(500).json({ message: "Failed to send message." });
  }
});

// Get all messages (for admin dashboard)
router.get("/messages", async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Failed to fetch messages." });
  }
});

router.delete("/delete/:id", async (req, res) => {
  try {
    const message = await Message.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Message deleted successfully!" });
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ message: "Failed to delete message." });
  }
});

export default router;
