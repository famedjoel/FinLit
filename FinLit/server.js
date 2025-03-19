import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import User from "./models/User.js";
import bcrypt from "bcryptjs";
import connectDB from "./config/db.js"; // Import DB connection

dotenv.config();
connectDB(); // Call function to connect to SQLite

const app = express();
// eslint-disable-next-line no-undef
const PORT = process.env.PORT || 7900;

// Define custom CORS options that allow all origins
const corsOptions = {
  origin: '*', // Allow all origins
  credentials: true, // Allow cookies if needed
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json()); // Parses JSON requests

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} from ${req.ip}`);
  next();
});

// Sign-up Route
app.post("/signup", async (req, res) => {
  try {
    console.log("Signup request body:", req.body);
    const { username, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already in use" });

    // Create new user with initial course data
    const initialCourses = [
      { courseId: "course1", title: "Beginner Finance", progress: 0 },
      { courseId: "course2", title: "Investment Basics", progress: 0 },
      { courseId: "course3", title: "Advanced Trading", progress: 0 }
    ];

    // eslint-disable-next-line no-unused-vars
    const newUser = await User.create({ 
      username, 
      email, 
      password,
      courseProgress: initialCourses,
      recentActivity: [{
        type: 'account',
        title: 'Account Creation',
        action: 'created',
        timestamp: new Date()
      }]
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Login Route
// Fixed Login Route in server.js
app.post("/login", async (req, res) => {
  try {
    console.log("Login request body:", req.body);
    const { email, password } = req.body;

    // Find user by email - using correct syntax for your adapter
    const user = await User.findOne({ email: email });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    // Add login activity
    const activities = user.recentActivity || [];
    activities.unshift({
      type: 'account',
      title: 'Login',
      action: 'logged in',
      timestamp: new Date()
    });

    // Keep only the 10 most recent activities
    const updatedActivities = activities.slice(0, 10);
    
    user.recentActivity = updatedActivities;
    await user.save();

    // Login successful
    res.status(200).json({ 
      message: "Login successful", 
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email,
        avatar: user.avatar 
      } 
    });
  } catch (error) {
    console.error("Login error:", error);
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

// Get User Dashboard Data
app.get("/dashboard/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Calculate overall progress
    const courseProgress = user.courseProgress || [];
    let totalProgress = 0;
    if (courseProgress.length > 0) {
      totalProgress = courseProgress.reduce((sum, course) => sum + course.progress, 0) / courseProgress.length;
    }

    // Update the overallProgress field
    user.overallProgress = Math.round(totalProgress);
    await user.save();

    // Prepare dashboard data
    const dashboardData = {
      username: user.username,
      overallProgress: user.overallProgress,
      coursesCompleted: user.totalCoursesCompleted,
      courseProgress: courseProgress,
      recentActivity: (user.recentActivity || []).slice(0, 5), // Get 5 most recent activities
      gameProgress: user.gameProgress || []
    };

    res.json(dashboardData);
  } catch (error) {
    console.error("Dashboard data error:", error);
    res.status(500).json({ message: "Error fetching dashboard data", error: error.message });
  }
});

// Track Course Progress
app.post("/progress/course", async (req, res) => {
  try {
    const { userId, courseId, title, progress } = req.body;
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Get current course progress
    const courseProgress = user.courseProgress || [];
    
    // Find if course already exists in user progress
    const courseIndex = courseProgress.findIndex(c => c.courseId === courseId);
    
    // Update or add course progress
    if (courseIndex >= 0) {
      courseProgress[courseIndex].progress = progress;
      courseProgress[courseIndex].lastAccessed = new Date();
      
      // Check if course was just completed
      if (progress >= 100 && !courseProgress[courseIndex].completed) {
        courseProgress[courseIndex].completed = true;
        user.totalCoursesCompleted += 1;
        
        // Add completion activity
        const activities = user.recentActivity || [];
        activities.unshift({
          type: 'course',
          title: title,
          action: 'completed',
          timestamp: new Date()
        });
        
        // Keep only the 10 most recent activities
        if (activities.length > 10) {
          activities.length = 10;
        }
        
        user.recentActivity = activities;
      }
    } else {
      // Add new course to progress
      courseProgress.push({
        courseId,
        title,
        progress,
        lastAccessed: new Date(),
        completed: progress >= 100
      });
      
      // Add started course activity
      const activities = user.recentActivity || [];
      activities.unshift({
        type: 'course',
        title: title,
        action: 'started',
        timestamp: new Date()
      });
      
      // Keep only the 10 most recent activities
      if (activities.length > 10) {
        activities.length = 10;
      }
      
      user.recentActivity = activities;
    }
    
    // Update user's course progress
    user.courseProgress = courseProgress;
    
    // Calculate overall progress
    const totalProgress = courseProgress.reduce((sum, course) => sum + course.progress, 0) / courseProgress.length;
    user.overallProgress = Math.round(totalProgress);
    
    await user.save();
    
    res.json({ message: "Course progress updated", progress });
  } catch (error) {
    console.error("Course progress error:", error);
    res.status(500).json({ message: "Error updating course progress", error: error.message });
  }
});

// Track Game Activity
app.post("/progress/game", async (req, res) => {
  try {
    const { userId, gameId, title, score } = req.body;
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    // Get current game progress
    const gameProgress = user.gameProgress || [];
    
    // Find if game already exists in user progress
    const gameIndex = gameProgress.findIndex(g => g.gameId === gameId);
    
    // Update or add game progress
    if (gameIndex >= 0) {
      // Update high score if new score is higher
      if (score > gameProgress[gameIndex].highScore) {
        gameProgress[gameIndex].highScore = score;
      }
      gameProgress[gameIndex].timesPlayed += 1;
      gameProgress[gameIndex].lastPlayed = new Date();
    } else {
      // Add new game to progress
      gameProgress.push({
        gameId,
        title,
        highScore: score,
        timesPlayed: 1,
        lastPlayed: new Date()
      });
    }
    
    // Update user's game progress
    user.gameProgress = gameProgress;
    
    // Add game activity
    const activities = user.recentActivity || [];
    activities.unshift({
      type: 'game',
      title: title,
      action: 'played',
      timestamp: new Date()
    });
    
    // Keep only the 10 most recent activities
    if (activities.length > 10) {
      activities.length = 10;
    }
    
    user.recentActivity = activities;
    
    await user.save();
    
    res.json({ message: "Game progress updated" });
  } catch (error) {
    console.error("Game progress error:", error);
    res.status(500).json({ message: "Error updating game progress", error: error.message });
  }
});

// Basic health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "Server is running" });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`For other devices on your network, try: http://<your-ip-address>:${PORT}`);
});