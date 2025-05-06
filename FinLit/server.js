/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import User from "./models/User.js";
import TriviaQuestion from "./models/TriviaQuestion.js";
import bcrypt from "bcryptjs";
import connectDB from "./config/db.js";
import populateCourseData from './scripts/populate-course-data.js';
import { updateTriviaQuestions } from './config/dbInit.js';
import { initCourseTables } from './config/dbInitCourses.js';
import { initSampleCourseData } from './config/sampleCoursesData.js';
import { setupCourseRoutes } from './routes/courseRoutes.js';
import { initMultiplayerTables } from './config/dbInitMultiplayer.js';
import challengeRoutes from './routes/challengeRoutes.js';
import { addQuizSettingsColumn } from './migrations.js';
import Achievement from './models/Achievement.js';
import Reward from './models/Reward.js';
import UserStats from './models/UserStats.js';
import { initAchievementsSystem } from './config/dbInitAchievements.js';
const API_BASE_URL = `http://localhost:${process.env.PORT || 7900}`;
import Challenge from './models/Challenge.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 7900;

// Define custom CORS options that allow all origins
const corsOptions = {
  origin: '*', 
  credentials: true, 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};


// Middleware
app.use(cors(corsOptions));
app.use(express.json({limit: '50mb'}));

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
    const { userId, username, avatar, financialGoals } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        username, 
        avatar,
        financialGoals 
      },
      { new: true }
    );

    res.json({ message: "Profile updated", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Error updating profile", error: error.message });
  }
});

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

// Calculate overall progress and completed courses
const courseProgress = user.courseProgress || [];
let totalProgress = 0;
let completedCount = 0;

if (courseProgress.length > 0) {
  totalProgress = courseProgress.reduce((sum, course) => sum + course.progress, 0) / courseProgress.length;
  completedCount = courseProgress.filter(course => course.completed === true).length;
}

// Update the user data
user.overallProgress = Math.round(totalProgress);
user.totalCoursesCompleted = completedCount;
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
// Updated game progress tracking endpoint in server.js
app.post("/progress/game", async (req, res) => {
  try {
    const { userId, gameId, title, score, metadata } = req.body;
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    // Get current game progress
    const gameProgress = user.gameProgress || [];
    
    // Find if game already exists in user progress
    const gameIndex = gameProgress.findIndex(g => g.gameId === gameId);
    
    // Parse metadata if it's a string
    let parsedMetadata = {};
    if (typeof metadata === 'string') {
      try {
        parsedMetadata = JSON.parse(metadata);
      } catch (e) {
        console.error('Error parsing metadata:', e);
      }
    } else {
      parsedMetadata = metadata || {};
    }
    
    // Update or add game progress
    if (gameIndex >= 0) {
      // Update high score if new score is higher
      if (score > gameProgress[gameIndex].highScore) {
        gameProgress[gameIndex].highScore = score;
      }
      gameProgress[gameIndex].timesPlayed += 1;
      gameProgress[gameIndex].lastPlayed = new Date();
      
      // Update metadata to include the latest game stats
      gameProgress[gameIndex].metadata = parsedMetadata;
      
      // Update game title if specified
      if (title) {
        gameProgress[gameIndex].title = title;
      }
    } else {
      // Add new game to progress
      gameProgress.push({
        gameId,
        title: title || gameId,
        highScore: score,
        timesPlayed: 1,
        lastPlayed: new Date(),
        metadata: parsedMetadata
      });
    }
    
    // Update user's game progress
    user.gameProgress = gameProgress;
    
    // Add game activity with more details
    const activities = user.recentActivity || [];
    
    let activityTitle = title || "Battle of Budgets";
    if (parsedMetadata.winner) {
      activityTitle += ` - ${parsedMetadata.winner === "player" ? "Won" : parsedMetadata.winner === "ai" ? "Lost" : "Draw"}`;
    }
    
    activities.unshift({
      type: 'game',
      title: activityTitle,
      action: 'played',
      timestamp: new Date(),
      score: score,
      gameId: gameId,
      metadata: {
        gameId,
        winner: parsedMetadata.winner,
        aiPersonality: parsedMetadata.aiPersonality
      }
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



// Get trivia questions with optional difficulty, category, and types filters
app.get("/trivia/questions", async (req, res) => {
  try {
    const { difficulty, category, limit = 5, types } = req.query;
    
    console.log("Query params:", { difficulty, category, limit, types });
    
    // Parse the types parameter if provided
    let questionTypes = null;
    if (types) {
      questionTypes = types.split(',').filter(type => type.trim() !== '');
      console.log("Filtering by question types:", questionTypes);
    }
    
    // Use the updated method that supports question types
    const questions = await TriviaQuestion.getByFilters(
      difficulty, 
      category, 
      questionTypes,
      Number(limit)
    );
    
    console.log(`Returning ${questions.length} questions`);
    
    res.json(questions);
  } catch (error) {
    console.error("Error fetching trivia questions:", error);
    res.status(500).json({ message: "Error fetching questions", error: error.message });
  }
});

// Get all available categories
app.get("/trivia/categories", async (req, res) => {
  try {
    const categories = await TriviaQuestion.getCategories();
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Error fetching categories", error: error.message });
  }
});

// Get all trivia questions (admin endpoint)
app.get("/admin/trivia/questions", async (req, res) => {
  try {
    // Get all questions, including inactive ones
    const questions = await TriviaQuestion.getAll();
    res.json(questions);
  } catch (error) {
    console.error("Error fetching all trivia questions:", error);
    res.status(500).json({ message: "Error fetching questions", error: error.message });
  }
});

// Get a specific trivia question by ID (admin endpoint)
app.get("/admin/trivia/questions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const question = await TriviaQuestion.findById(id);
    
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }
    
    res.json(question);
  } catch (error) {
    console.error(`Error fetching trivia question with ID ${req.params.id}:`, error);
    res.status(500).json({ message: "Error fetching question", error: error.message });
  }
});

// Add a new trivia question with category
app.post("/admin/trivia/questions", async (req, res) => {
  try {
    const { question, options, correctAnswer, explanation, difficulty, category } = req.body;
    
    // Validate required fields
    if (!question || !options || correctAnswer === undefined || !explanation || !difficulty) {
      return res.status(400).json({ message: "All fields are required" });
    }
    
    const newQuestion = await TriviaQuestion.create({
      question,
      options,
      correctAnswer,
      explanation,
      difficulty,
      category: category || 'general'
    });
    
    res.status(201).json({ message: "Question added successfully", question: newQuestion });
  } catch (error) {
    console.error("Error adding trivia question:", error);
    res.status(500).json({ message: "Error adding question", error: error.message });
  }
});

// Update a trivia question
app.put("/admin/trivia/questions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const updatedQuestion = await TriviaQuestion.update(id, updates);
    
    if (!updatedQuestion) {
      return res.status(404).json({ message: "Question not found" });
    }
    
    res.json({ message: "Question updated successfully", question: updatedQuestion });
  } catch (error) {
    console.error("Error updating trivia question:", error);
    res.status(500).json({ message: "Error updating question", error: error.message });
  }
});

// Delete a trivia question
app.delete("/admin/trivia/questions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;
    
    let result;
    if (permanent === 'true') {
      result = await TriviaQuestion.hardDelete(id);
    } else {
      result = await TriviaQuestion.delete(id);
    }
    
    if (!result) {
      return res.status(404).json({ message: "Question not found" });
    }
    
    res.json({ message: "Question deleted successfully" });
  } catch (error) {
    console.error("Error deleting trivia question:", error);
    res.status(500).json({ message: "Error deleting question", error: error.message });
  }
});

// Bulk insert trivia questions
app.post("/admin/trivia/questions/bulk", async (req, res) => {
  try {
    const { questions } = req.body;
    
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: "Questions array is required" });
    }
    
    await TriviaQuestion.bulkInsert(questions);
    
    res.status(201).json({ message: `${questions.length} questions added successfully` });
  } catch (error) {
    console.error("Error in bulk insert of trivia questions:", error);
    res.status(500).json({ message: "Error adding questions", error: error.message });
  }
});

// Achievements routes
app.get("/achievements", async (req, res) => {
  try {
    const achievements = await Achievement.getAll();
    res.json(achievements);
  } catch (error) {
    console.error("Error fetching achievements:", error);
    res.status(500).json({ message: "Error fetching achievements", error: error.message });
  }
});

app.get("/achievements/user/:userId", async (req, res) => {
  try {
    const userAchievements = await Achievement.getUserAchievements(req.params.userId);
    res.json(userAchievements);
  } catch (error) {
    console.error("Error fetching user achievements:", error);
    res.status(500).json({ message: "Error fetching user achievements", error: error.message });
  }
});

app.get("/achievements/new/:userId", async (req, res) => {
  try {
    const newAchievements = await Achievement.getNewlyCompletedAchievements(req.params.userId);
    res.json(newAchievements);
  } catch (error) {
    console.error("Error fetching new achievements:", error);
    res.status(500).json({ message: "Error fetching new achievements", error: error.message });
  }
});

// Rewards routes
app.get("/rewards", async (req, res) => {
  try {
    const rewards = await Reward.getAll();
    res.json(rewards);
  } catch (error) {
    console.error("Error fetching rewards:", error);
    res.status(500).json({ message: "Error fetching rewards", error: error.message });
  }
});

app.get("/rewards/user/:userId", async (req, res) => {
  try {
    const userRewards = await Reward.getUserRewards(req.params.userId);
    res.json(userRewards);
  } catch (error) {
    console.error("Error fetching user rewards:", error);
    res.status(500).json({ message: "Error fetching user rewards", error: error.message });
  }
});

app.get("/rewards/equipped/:userId", async (req, res) => {
  try {
    const equippedRewards = await Reward.getEquippedRewards(req.params.userId);
    res.json(equippedRewards);
  } catch (error) {
    console.error("Error fetching equipped rewards:", error);
    res.status(500).json({ message: "Error fetching equipped rewards", error: error.message });
  }
});

app.post("/rewards/purchase", async (req, res) => {
  try {
    const { userId, rewardId } = req.body;
    
    if (!userId || !rewardId) {
      return res.status(400).json({ message: "User ID and reward ID are required" });
    }
    
    const result = await Reward.purchaseReward(userId, rewardId);
    
    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }
    
    res.json({ message: "Reward purchased successfully", reward: result.reward });
  } catch (error) {
    console.error("Error purchasing reward:", error);
    res.status(500).json({ message: "Error purchasing reward", error: error.message });
  }
});

app.post("/rewards/equip", async (req, res) => {
  try {
    const { userId, rewardId, equipped } = req.body;
    
    if (!userId || !rewardId) {
      return res.status(400).json({ message: "User ID and reward ID are required" });
    }
    
    const result = await Reward.toggleEquipStatus(userId, rewardId, equipped !== false);
    
    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }
    
    res.json({ message: equipped !== false ? "Reward equipped" : "Reward unequipped" });
  } catch (error) {
    console.error("Error toggling reward equipped status:", error);
    res.status(500).json({ message: "Error updating reward status", error: error.message });
  }
});

// User stats routes
app.get("/stats/progress/:userId", async (req, res) => {
  try {
    const stats = await UserStats.getForUser(req.params.userId);
    
    const achievements = await Achievement.getUserAchievements(req.params.userId);
    
    // Calculate completion percentages for each category
    const categories = [...new Set(achievements.map(a => a.category))];
    const categoryProgress = {};
    
    categories.forEach(category => {
      const categoryAchievements = achievements.filter(a => a.category === category);
      const completed = categoryAchievements.filter(a => a.completed).length;
      const total = categoryAchievements.length;
      
      categoryProgress[category] = {
        completed,
        total,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0
      };
    });
    
    // Get total stats
    const totalCompleted = achievements.filter(a => a.completed).length;
    const totalAchievements = achievements.length;
    
    res.json({
      stats,
      achievements: {
        total: totalAchievements,
        completed: totalCompleted,
        percentage: totalAchievements > 0 ? Math.round((totalCompleted / totalAchievements) * 100) : 0,
        categories: categoryProgress
      }
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    res.status(500).json({ message: "Error fetching user stats", error: error.message });
  }
});

app.post("/progress/quiz-with-achievements", async (req, res) => {
  try {
    const { userId, score, questionsAnswered, gameId, title } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }
    
    // Track quiz completion and get achievement updates
    const { stats, newAchievements } = await UserStats.trackQuizCompleted(
      userId, 
      score, 
      questionsAnswered || 1
    );
    
    // Track game activity directly
    try {
      const user = await User.findById(userId);
      if (user) {
        // Get current game progress
        const gameProgress = user.gameProgress || [];
        
        // Find if game already exists in user progress
        const gameIndex = gameProgress.findIndex(g => g.gameId === (gameId || "financial-trivia"));
        
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
            gameId: gameId || "financial-trivia",
            title: title || "Financial Trivia",
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
          title: title || "Financial Trivia",
          action: 'played',
          timestamp: new Date()
        });
        
        // Keep only the 10 most recent activities
        if (activities.length > 10) {
          activities.length = 10;
        }
        
        user.recentActivity = activities;
        
        await user.save();
      }
    } catch (gameError) {
      console.error("Error updating game progress:", gameError);
      // Continue execution even if game progress update fails
    }
    
    res.json({ 
      message: "Quiz progress updated with achievements", 
      stats,
      newAchievements
    });
  } catch (error) {
    console.error("Error updating quiz progress with achievements:", error);
    res.status(500).json({ 
      message: "Error updating quiz progress", 
      error: error.message 
    });
  }
});

app.post("/progress/course-with-achievements", async (req, res) => {
  try {
    const { userId, courseId, title, progress } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }
    
    // Use the existing course progress route logic
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Get current course progress
    const courseProgress = user.courseProgress || [];
    
    // Find if course already exists in user progress
    const courseIndex = courseProgress.findIndex(c => c.courseId === courseId);
    
    // Check if course was just completed
    let courseJustCompleted = false;
    
    // Update or add course progress
    if (courseIndex >= 0) {
      courseProgress[courseIndex].progress = progress;
      courseProgress[courseIndex].lastAccessed = new Date();
      
      // Check if course was just completed
      if (progress >= 100 && !courseProgress[courseIndex].completed) {
        courseProgress[courseIndex].completed = true;
        user.totalCoursesCompleted += 1;
        courseJustCompleted = true;
        
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
      
      if (progress >= 100) {
        courseJustCompleted = true;
        user.totalCoursesCompleted += 1;
      }
      
      // Add started course activity
      const activities = user.recentActivity || [];
      activities.unshift({
        type: 'course',
        title: title,
        action: progress >= 100 ? 'completed' : 'started',
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
    
    // Track course completion for achievements if applicable
    let achievementUpdate = { newAchievements: [] };
    if (courseJustCompleted) {
      achievementUpdate = await UserStats.trackCourseCompleted(userId);
    }
    
    res.json({ 
      message: "Course progress updated", 
      progress,
      achievements: achievementUpdate.newAchievements
    });
  } catch (error) {
    console.error("Course progress error:", error);
    res.status(500).json({ message: "Error updating course progress", error: error.message });
  }
});


app.post("/challenges/:challengeId/score", async (req, res) => {
  try {
    const { challengeId } = req.params;
    const { userId, score } = req.body;
    
    // Get the challenge directly using the Challenge model
    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }
    
    // Update challenge with score directly
    const updatedChallenge = await Challenge.updateScore(challengeId, userId, score);
    
    // Track achievement if challenge was just completed and this user won
    if (updatedChallenge.status === 'completed' && updatedChallenge.winnerId === userId) {
      const { newAchievements } = await UserStats.trackChallengeWon(userId);
      
      // Add achievements to response
      return res.json({
        ...updatedChallenge,
        achievements: newAchievements
      });
    }
    
    res.json(updatedChallenge);
  } catch (error) {
    console.error("Error updating challenge score:", error);
    res.status(500).json({ message: "Error updating challenge score", error: error.message });
  }
});


app.post("/challenges", async (req, res) => {
  try {
    const { challengerId, challengedId, gameType, gameMode, quizSettings } = req.body;
    
    // Validate users exist
    const challenger = await User.findById(challengerId);
    const challenged = await User.findById(challengedId);
    
    if (!challenger || !challenged) {
      return res.status(404).json({ message: "One or both users not found" });
    }
    
    // First create the challenge
    const challenge = await Challenge.create({
      challengerId,
      challengedId,
      gameType,
      gameMode,
      quizSettings
    });
    
    // Then separately track the achievement
    let achievementUpdate = { newAchievements: [] };
    try {
      // Track achievement for sending a challenge in a separate transaction
      achievementUpdate = await UserStats.trackChallengeSent(challengerId);
    } catch (achievementError) {
      console.error("Error tracking challenge achievement (non-fatal):", achievementError);
    }
    
    res.status(201).json({
      ...challenge,
      achievements: achievementUpdate.newAchievements
    });
  } catch (error) {
    console.error("Error creating challenge:", error);
    res.status(500).json({ message: "Error creating challenge", error: error.message });
  }
});


// Initialise achievements and rewards system
await initAchievementsSystem();
await Achievement.initDefaultAchievements();
await Reward.initDefaultRewards();
console.log("Achievements and rewards system initialized");


// Get user statistics
app.get("/stats/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Get all game progress
    const gameProgress = user.gameProgress || [];
    
    // Extract trivia game data
    const triviaGames = gameProgress.filter(game => game.gameId === "financial-trivia");
    
    // Parse metadata for each game
    const gameData = triviaGames.map(game => {
      try {
        const metadata = JSON.parse(game.metadata || '{}');
        return {
          gameId: game.gameId,
          title: game.title,
          score: game.highScore,
          timestamp: game.lastPlayed,
          metadata
        };
      } catch (e) {
        return {
          gameId: game.gameId,
          title: game.title,
          score: game.highScore,
          timestamp: game.lastPlayed,
          metadata: {}
        };
      }
    });
    
    // Calculate aggregate statistics
    
    const categoryMastery = {};
    const categoryAttempts = {};
    
    gameData.forEach(game => {
      // Only use games with valid metadata that contains masteryData
      if (game.metadata && game.metadata.masteryData) {
        Object.entries(game.metadata.masteryData).forEach(([category, mastery]) => {
          if (!categoryMastery[category]) {
            categoryMastery[category] = 0;
            categoryAttempts[category] = 0;
          }
          categoryMastery[category] += mastery;
          categoryAttempts[category] += 1;
        });
      }
    });
    
    // Average the mastery scores
    const masteryLevels = {};
    Object.keys(categoryMastery).forEach(category => {
      masteryLevels[category] = categoryAttempts[category] > 0 
        ? Math.round(categoryMastery[category] / categoryAttempts[category]) 
        : 0;
    });
    
    const performanceOverTime = gameData
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .map(game => ({
        date: game.timestamp,
        score: game.score,
        correctPercentage: game.metadata.categoryPerformance 
          ? calculateAveragePerformance(game.metadata.categoryPerformance)
          : null
      }));
    
    const strengths = [];
    const weaknesses = [];
    
    if (Object.keys(masteryLevels).length > 0) {
      // Determine strongest categories
      const sortedStrengths = Object.entries(masteryLevels)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
      
      // Determine weakest categories
      const sortedWeaknesses = Object.entries(masteryLevels)
        .sort((a, b) => a[1] - b[1])
        .slice(0, 3);
      
      sortedStrengths.forEach(([category, mastery]) => {
        if (mastery > 50) {
          strengths.push({ category, mastery });
        }
      });
      
      sortedWeaknesses.forEach(([category, mastery]) => {
        if (mastery < 80) {
          weaknesses.push({ category, mastery });
        }
      });
    }
    
    const recommendedTopics = generateRecommendedTopics(weaknesses, masteryLevels);
    
    // Return compiled statistics
    res.json({
      masteryLevels,
      performanceOverTime,
      strengths,
      weaknesses,
      recommendedTopics,
      recentGames: gameData.slice(-5) // Last 5 games
    });
    
  } catch (error) {
    console.error("Error fetching user statistics:", error);
    res.status(500).json({ message: "Error fetching statistics", error: error.message });
  }
});

// Helper function to calculate average performance
function calculateAveragePerformance(categoryPerformance) {
  let totalCorrect = 0;
  let totalQuestions = 0;
  
  Object.values(categoryPerformance).forEach(data => {
    totalCorrect += data.correct;
    totalQuestions += data.total;
  });
  
  return totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
}

// Helper function to generate recommended topics
function generateRecommendedTopics(weaknesses, masteryLevels) {
  const recommendations = [];
  
  // Add recommendations based on weaknesses
  weaknesses.forEach(({ category, mastery }) => {
    // Only recommend topics with low mastery scores
    if (mastery < 60) {
      recommendations.push({
        category,
        reason: `Your mastery level is only ${mastery}% in this category.`,
        priority: "high"
      });
    } else if (mastery < 80) {
      recommendations.push({
        category,
        reason: `You could improve your mastery level of ${mastery}% in this category.`,
        priority: "medium"
      });
    }
  });
  
  // Check for categories with no attempts
  ['investing', 'budgeting', 'credit', 'taxes', 'retirement', 'savings', 'debt', 'insurance'].forEach(category => {
    if (!masteryLevels[category]) {
      recommendations.push({
        category,
        reason: "You haven't tried questions in this category yet.",
        priority: "low"
      });
    }
  });
  
  return recommendations;
}

// Add course routes to the application
setupCourseRoutes(app);

// Basic health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "Server is running" });
});

// Connect to database and initialise it
connectDB().then(async () => {
  try {
        // Run migration to add quiz_settings column if needed
        await addQuizSettingsColumn();
        
    // Initialise course tables
    await initCourseTables();
    
    await initMultiplayerTables();
    
    // Initialise sample course data
    await initSampleCourseData();
    
    // Initialise trivia questions if needed
    await updateTriviaQuestions();

    // Set up course routes 
    setupCourseRoutes(app);

     // Set up challenge routes
     app.use('/', challengeRoutes);
    
    // Populate course content data
    await populateCourseData();
    console.log("Course data population complete or already exists");
    
    // Start server after database is ready
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`For other devices on your network, try: http://<your-ip-address>:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to initialize database:", error);
    process.exit(1);
  }
});

app.get("/users", async (req, res) => {
  try {
    const connection = await import('./config/sqlite-adapter.js').then(m => m.connect());
    
    // Get all users but only return basic info (id, username, avatar)
    const users = await connection.all(
      'SELECT id, username, avatar FROM users'
    );
    
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users", error: error.message });
  }
});