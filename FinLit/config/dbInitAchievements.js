// config/dbInitAchievements.js
import { connect } from './sqlite-adapter.js';

// Initialize database tables for achievements and rewards
export async function initAchievementsSystem() {
  try {
    const connection = await connect();

    // Create achievements table for storing achievement definitions
    await connection.exec(`
      CREATE TABLE IF NOT EXISTS achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        icon TEXT NOT NULL,
        points_reward INTEGER NOT NULL DEFAULT 0,
        requirement_type TEXT NOT NULL,
        requirement_value INTEGER NOT NULL,
        badge_image TEXT,
        level INTEGER NOT NULL DEFAULT 1,
        max_level INTEGER NOT NULL DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create user_achievements table to track user progress and unlocked achievements
    await connection.exec(`
      CREATE TABLE IF NOT EXISTS user_achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        achievement_id INTEGER NOT NULL,
        progress INTEGER DEFAULT 0,
        current_level INTEGER DEFAULT 1,
        completed BOOLEAN DEFAULT 0,
        completed_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (achievement_id) REFERENCES achievements (id),
        UNIQUE(user_id, achievement_id)
      )
    `);

    // Create rewards table for items/badges users can unlock or purchase
    await connection.exec(`
      CREATE TABLE IF NOT EXISTS rewards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        type TEXT NOT NULL,
        icon TEXT NOT NULL,
        points_cost INTEGER NOT NULL DEFAULT 0,
        requirement_type TEXT, 
        requirement_value INTEGER,
        image_url TEXT,
        is_premium BOOLEAN DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create user_rewards table to track which rewards users have earned/purchased
    await connection.exec(`
      CREATE TABLE IF NOT EXISTS user_rewards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        reward_id INTEGER NOT NULL,
        acquired_at TEXT DEFAULT CURRENT_TIMESTAMP,
        is_equipped BOOLEAN DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (reward_id) REFERENCES rewards (id),
        UNIQUE(user_id, reward_id)
      )
    `);

    // Add milestone trackers to help with achievement tracking
    await connection.exec(`
      CREATE TABLE IF NOT EXISTS user_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        quizzes_completed INTEGER DEFAULT 0,
        questions_answered INTEGER DEFAULT 0,
        streak_days INTEGER DEFAULT 0,
        last_active_date TEXT,
        challenges_sent INTEGER DEFAULT 0,
        challenges_won INTEGER DEFAULT 0,
        courses_completed INTEGER DEFAULT 0,
        points_earned INTEGER DEFAULT 0,
        points_spent INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users (id),
        UNIQUE(user_id)
      )
    `);

    console.log('Achievement and Rewards tables created successfully');
  } catch (error) {
    console.error('Error creating achievement tables:', error);
    throw error;
  }
}
