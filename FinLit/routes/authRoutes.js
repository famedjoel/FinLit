/* eslint-disable no-unused-vars */
// routes/authRoutes.js
import express from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../config/sqlite-adapter.js';

const router = express.Router();

// Helper functions for route handlers (exported for testing)
export const signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already in use' });

    // Create new user with initial course data
    const initialCourses = [
      { courseId: 'course1', title: 'Beginner Finance', progress: 0 },
      { courseId: 'course2', title: 'Investment Basics', progress: 0 },
      { courseId: 'course3', title: 'Advanced Trading', progress: 0 },
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
        timestamp: new Date(),
      }],
    });

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

    // Add login activity
    const activities = user.recentActivity || [];
    activities.unshift({
      type: 'account',
      title: 'Login',
      action: 'logged in',
      timestamp: new Date(),
    });

    // Keep only the 10 most recent activities
    const updatedActivities = activities.slice(0, 10);

    user.recentActivity = updatedActivities;
    await user.save();

    // Login successful
    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { userId, username, avatar, financialGoals } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { username, avatar, financialGoals },
      { new: true },
    );

    res.json({ message: 'Profile updated', user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
};

// Authentication middleware
export const authMiddleware = async (req, res, next) => {
  try {
    // In a real app, you'd verify a JWT token here
    // For now, we'll check for a user ID in localStorage
    const userId = req.headers['user-id'] || req.cookies?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Verify the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Set the user on the request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Setup the routes
router.post('/signup', signup);
router.post('/login', login);
router.put('/profile', updateProfile);
router.get('/profile/:userId', getProfile);

// Export a function to set up the routes on the app
export const setupAuthRoutes = (app) => {
  app.use('/', router);

  // Sample protected route
  app.get('/dashboard', authMiddleware, (req, res) => {
    res.json({ message: 'Protected dashboard data', user: req.user });
  });

  console.log('Authentication routes configured');
};

export default router;
