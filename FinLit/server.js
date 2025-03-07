import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";
import bcrypt from "bcryptjs";
import connectDB from "./config/db.js"; // Import DB connection
// import path from "path"; // Import path for file paths

dotenv.config();
connectDB(); // Call function to connect to MongoDB

const app = express();
// eslint-disable-next-line no-undef
const PORT = process.env.PORT || 5900;

// Define custom CORS options
const corsOptions = {
  origin: ["http://localhost:5173"], // Allow frontend requests
  credentials: true, // Allow cookies if needed
};

// Database Connection
// eslint-disable-next-line no-undef
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.log("MongoDB connection error:", err));


// Middleware
app.use(cors(corsOptions));
app.use(express.json()); // Parses JSON requests

// Sign-up Route
app.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already in use" });

    // Create new user
    const newUser = new User({ username, email, password });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});


// Login Route
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    // Login successful
    res.status(200).json({ message: "Login successful", user: { id: user._id, username: user.username, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

app.put("/profile", async (req, res) => {
  try {
    const { userId, username, avatar } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { username, avatar },
      { new: true }
    );

    res.json({ message: "Profile updated", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Error updating profile", error: error.message });
  }
});

// Get User Profile (for loading in navbar/dashboard)
app.get("/profile/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile", error: error.message });
  }
});


// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
