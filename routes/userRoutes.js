import express from "express";
import passport from "../config/passport.js";
import User from "../models/User.js";

const router = express.Router();

//get all users
router.get("/", async (req, res) => {
  const users = await User.find();
  res.status(200).json(users);
});

// Route to start Google OAuth authentication
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Callback route for Google OAuth
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect(process.env.FRONTEND_URL || "http://localhost:3000/dashboard");
  }
);

// sign up using email and password
router.post("/signup", async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        message: "Missing required fields",
        required: ["email", "password", "firstName", "lastName"],
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Create new user
    const newUser = await User.create({
      email,
      password,
      firstName,
      lastName,
      displayName: `${firstName} ${lastName}`,
      role: "user",
    });

    // Return success response
    res.status(201).json({
      message: "User created successfully",
      user: {
        id: newUser._id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        displayName: newUser.displayName,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      message: "Error creating user",
      error: error.message,
      details: error.errors,
    });
  }
});

//update user to admin
router.put("/update", async (req, res) => {
  const { email, role } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.role = role;
    await user.save();
    res.status(200).json({ message: `User role updated to ${role}` });
  } catch (error) {
    console.error("Update user role error:", error);
    res
      .status(500)
      .json({ message: "Error updating user role", error: error.message });
  }
});

//update password or insert new password
router.put("/update-password", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.password = password;
    await user.save();
    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Update password error:", error);
    res
      .status(500)
      .json({ message: "Error updating password", error: error.message });
  }
});
//usage example: http://localhost:5000/users/update-password
//body: { email: "test@test.com", password: "newpassword" }

// delete user
router.delete("/delete", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    await user.deleteOne();
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res
      .status(500)
      .json({ message: "Error deleting user", error: error.message });
  }
});

// login using email and password
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        message: "Missing required fields",
        required: ["email", "password"],
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Log in the user (create session)
    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({ message: "Error logging in" });
      }

      // Return user info
      return res.json({
        message: "Login successful",
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          displayName: user.displayName,
          role: user.role,
        },
      });
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
});

// Logout route
router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: "Error logging out" });
    }
    res.status(200).json({ message: "Logged out successfully" });
  });
});

// Get current user
router.get("/current-user", (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  res.json(req.user);
});

export default router;
