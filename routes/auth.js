import express from "express";
import passport from "../config/passport.js";

const router = express.Router();

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

// Logout route
router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: "Error logging out" });
    }
    res.redirect(process.env.FRONTEND_URL || "http://localhost:3000");
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
