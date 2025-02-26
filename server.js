import dotenv from "dotenv";
dotenv.config(); // Load .env variables before anything else

import express from "express";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import authRoutes from "./routes/auth.js";

const app = express();

app.use(cors());
app.use(express.json());

// Set up express-session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || "defaultsecret",
  resave: false,
  saveUninitialized: false,
}));

// Initialize Passport and its session handling
app.use(passport.initialize());
app.use(passport.session());

// Passport session setup.
// In production, you might only store a user ID in the session.
passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((user, done) => {
  done(null, user);
});

// Mount authentication routes
app.use("/auth", authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
