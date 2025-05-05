/* eslint-disable no-unused-vars */
import express from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../config/sqlite-adapter.js';

const router = express.Router();

/**
 * Registers a new user.
 * Checks if the email is already registered, then creates the user with initial course data.
 */
export const signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Verify whether the email has already been registered
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already in use' });

    // Prepare initial courses for the new user
    const initialCourses = [
      { courseId: 'course1', title: 'Beginner Finance', progress: 0 },
      { courseId: 'course2', title: 'Investment Basics', progress: 0 },
      { courseId: 'course3', title: 'Advanced Trading', progress: 0 },
    ];

    // Create the new user document with a record of account creation
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

/**
 * Logs in an existing user.
 * Verifies the email and password, records the login activity and returns user details.
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Locate the user using their email
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    // Validate the provided password against the stored hash
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

    // Record the login activity
    const activities = user.recentActivity || [];
    activities.unshift({
      type: 'account',
      title: 'Login',
      action: 'logged in',
      timestamp: new Date(),
    });

    // Limit the stored activities to the 10 most recent entries
    const updatedActivities = activities.slice(0, 10);

    user.recentActivity = updatedActivities;
    await user.save();

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

/**
 * Updates the user's profile with new details.
 * Accepts username, avatar and financial goals to update the profile.
 */
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

/**
 * Retrieves the user's profile details using their user ID.
 */
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
};

/**
 * Middleware to check for authenticated users.
 * In production, this would verify a JWT token.
 * Here, it checks for a user ID in the request headers or cookies.
 */
export const authMiddleware = async (req, res, next) => {
  try {
    const userId = req.headers['user-id'] || req.cookies?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Confirm that the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Attach the user object to the request for further use
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Define the authentication routes
router.post('/signup', signup);
router.post('/login', login);
router.put('/profile', updateProfile);
router.get('/profile/:userId', getProfile);

/**
 * Sets up the authentication and protected routes on the given application.
 */
export const setupAuthRoutes = (app) => {
  app.use('/', router);

  // Protected dashboard route demonstrates middleware usage
  app.get('/dashboard', authMiddleware, (req, res) => {
    res.json({ message: 'Protected dashboard data', user: req.user });
  });

  console.log('Authentication routes configured');
};

export default router;
