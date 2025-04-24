import dotenv from "dotenv";
dotenv.config(); // Load .env variables before anything else

import MongoStore from "connect-mongo";
import cors from "cors";
import express from "express";
import session from "express-session";
import connectDB from "./config/db.js";
import passport from "./config/passport.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import carRoutes from "./routes/carRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

const app = express();

// Connect to MongoDB
connectDB();

// Configure CORS
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  })
);

// Additional CORS headers
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin);
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  next();
});

app.use(express.json());

// Set up express-session middleware with MongoDB store
app.use(
  session({
    secret: process.env.SESSION_SECRET || "defaultsecret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      ttl: 24 * 60 * 60, // Session TTL (1 day)
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // Cookie TTL (1 day)
    },
  })
);

// Initialize Passport and its session handling
app.use(passport.initialize());
app.use(passport.session());

// Middleware to protect routes
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

const isAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === "admin") {
    return next();
  }
  res.status(403).json({ message: "Forbidden" });
};

// Mount authentication routes
app.use("/users", userRoutes);

// Mount booking routes
app.use("/api", bookingRoutes);

// Mount car routes
app.use("/api", carRoutes);

//mount contact use routes
app.use("/api", contactRoutes);

// Mount chat routes
app.use("/api", chatRoutes);

// Protected route example
app.get("/api/profile", isAuthenticated, (req, res) => {
  res.json(req.user);
});

// Admin route example
app.get("/api/admin", isAdmin, (req, res) => {
  res.json({ message: "Welcome to admin panel" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please free the port or use a different port.`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});
