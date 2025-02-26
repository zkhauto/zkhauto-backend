import dotenv from "dotenv";
dotenv.config(); // Load .env variables before anything else

import express from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

const router = express.Router();

// For testing purposes—ensure these values are loaded correctly.
console.log("Google Client ID:", process.env.GOOGLE_CLIENT_ID);
console.log("Google Client Secret:", process.env.GOOGLE_CLIENT_SECRET);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID, 
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback", // This URL must be added to your Google Cloud Console
    },
    async (accessToken, refreshToken, profile, done) => {
      // Here, you would typically find or create a user in your database.
      // For simplicity, we just pass the profile along.
      return done(null, profile);
    }
  )
);

// Route to start Google OAuth authentication
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Callback route for Google OAuth to redirect to after login
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    // Successful authentication.
    // You can set up additional logic here (e.g., creating a token or redirecting to a dashboard).
    res.redirect("http://localhost:3000/dashboard");
  }
);

export default router;
