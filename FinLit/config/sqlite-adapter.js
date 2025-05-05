import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

// Resolve directory and database path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../database.sqlite');

// SQLite database instance
let db = null;

// Initialise the database connection and create tables if they do not exist
async function initDatabase() {
  if (db) return db;

  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        avatar TEXT DEFAULT '',
        preferences TEXT DEFAULT '{"theme":"light","notifications":true}',
        courseProgress TEXT DEFAULT '[]',
        gameProgress TEXT DEFAULT '[]',
        recentActivity TEXT DEFAULT '[]',
        totalCoursesCompleted INTEGER DEFAULT 0,
        overallProgress INTEGER DEFAULT 0,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS trivia_questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question TEXT NOT NULL,
        options TEXT NOT NULL,
        correctAnswer INTEGER NOT NULL,
        explanation TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        category TEXT DEFAULT 'general',
        active INTEGER DEFAULT 1,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `);

    return db;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

// User model with methods for database operations
const User = {
  // Create a new user
  create: async (userData) => {
    try {
      const connection = await initDatabase();

      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(userData.password, salt);

      if (typeof userData.preferences === 'object') {
        userData.preferences = JSON.stringify(userData.preferences);
      }
      if (typeof userData.courseProgress === 'object') {
        userData.courseProgress = JSON.stringify(userData.courseProgress);
      }
      if (typeof userData.gameProgress === 'object') {
        userData.gameProgress = JSON.stringify(userData.gameProgress);
      }
      if (typeof userData.recentActivity === 'object') {
        userData.recentActivity = JSON.stringify(userData.recentActivity);
      }

      const now = new Date().toISOString();

      const result = await connection.run(
        `INSERT INTO users (
          username, email, password, avatar, 
          preferences, courseProgress, gameProgress, recentActivity,
          totalCoursesCompleted, overallProgress, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userData.username,
          userData.email,
          userData.password,
          userData.avatar || '',
          userData.preferences || '{"theme":"light","notifications":true}',
          userData.courseProgress || '[]',
          userData.gameProgress || '[]',
          userData.recentActivity || '[]',
          userData.totalCoursesCompleted || 0,
          userData.overallProgress || 0,
          now,
          now,
        ],
      );

      const user = await connection.get(
        'SELECT * FROM users WHERE id = ?',
        result.lastID,
      );

      return processUserData(user);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // Find a user by specific criteria
  findOne: async (criteria) => {
    try {
      const connection = await initDatabase();

      const whereClauses = [];
      const params = [];

      for (const [key, value] of Object.entries(criteria)) {
        whereClauses.push(`${key} = ?`);
        params.push(value);
      }

      const whereClause = whereClauses.length > 0
        ? `WHERE ${whereClauses.join(' AND ')}`
        : '';

      const user = await connection.get(
        `SELECT * FROM users ${whereClause}`,
        params,
      );

      return user ? processUserData(user) : null;
    } catch (error) {
      console.error('Error finding user:', error);
      throw error;
    }
  },

  // Find a user by ID
  findById: async (id) => {
    try {
      const connection = await initDatabase();

      const user = await connection.get(
        'SELECT * FROM users WHERE id = ?',
        id,
      );

      return user ? processUserData(user) : null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  },

  // Update a user by ID
  findByIdAndUpdate: async (id, updates, options = {}) => {
    try {
      const connection = await initDatabase();

      const currentUser = await connection.get(
        'SELECT * FROM users WHERE id = ?',
        id,
      );

      if (!currentUser) {
        return null;
      }

      const setClauses = [];
      const params = [];

      for (const [key, value] of Object.entries(updates)) {
        if (key === 'id') continue;

        setClauses.push(`${key} = ?`);

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          params.push(JSON.stringify(value));
        } else if (Array.isArray(value)) {
          params.push(JSON.stringify(value));
        } else {
          params.push(value);
        }
      }

      setClauses.push('updatedAt = ?');
      params.push(new Date().toISOString());
      params.push(id);

      await connection.run(
        `UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`,
        params,
      );

      if (options.new !== false) {
        const updatedUser = await connection.get(
          'SELECT * FROM users WHERE id = ?',
          id,
        );
        return processUserData(updatedUser);
      }

      return null;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },
};

// Process user data to parse JSON fields and add methods
function processUserData(user) {
  if (!user) return null;

  try {
    user.preferences = JSON.parse(user.preferences || '{"theme":"light","notifications":true}');
    user.courseProgress = JSON.parse(user.courseProgress || '[]');
    user.gameProgress = JSON.parse(user.gameProgress || '[]');
    user.recentActivity = JSON.parse(user.recentActivity || '[]');
  } catch (error) {
    console.error('Error parsing user JSON data:', error);
  }

  user.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  };

  user.save = async function () {
    const userCopy = { ...this };
    delete userCopy.save;
    delete userCopy.comparePassword;

    await User.findByIdAndUpdate(this.id, userCopy, { new: true });
    return this;
  };

  return user;
}

// Establish database connection
const connect = async () => {
  return await initDatabase();
};

export { connect, User };
