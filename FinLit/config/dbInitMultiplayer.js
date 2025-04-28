// config/dbInitMultiplayer.js
import { connect } from './sqlite-adapter.js';

// Initialize database tables for multiplayer features
export async function initMultiplayerTables() {
  try {
    const connection = await connect();
    
    // Create challenges table for user-to-user challenges
    await connection.exec(`
      CREATE TABLE IF NOT EXISTS challenges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        challenger_id INTEGER NOT NULL,
        challenged_id INTEGER NOT NULL,
        game_type TEXT NOT NULL,
        game_mode TEXT,
        status TEXT DEFAULT 'pending',
        challenger_score INTEGER,
        challenged_score INTEGER,
        winner_id INTEGER,
        prize_points INTEGER DEFAULT 50,
        quiz_settings TEXT,  -- Store quiz settings as JSON
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        challenged_at TEXT,
        completed_at TEXT,
        FOREIGN KEY (challenger_id) REFERENCES users (id),
        FOREIGN KEY (challenged_id) REFERENCES users (id),
        FOREIGN KEY (winner_id) REFERENCES users (id)
      )
    `);
    
    // Create global leaderboard table
    await connection.exec(`
      CREATE TABLE IF NOT EXISTS leaderboard (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        game_type TEXT NOT NULL,
        score INTEGER NOT NULL,
        achieved_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        UNIQUE(user_id, game_type)
      )
    `);
    
    // Create user points table for reward system
    await connection.exec(`
      CREATE TABLE IF NOT EXISTS user_points (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        total_points INTEGER DEFAULT 0,
        challenges_won INTEGER DEFAULT 0,
        challenges_played INTEGER DEFAULT 0,
        last_updated TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        UNIQUE(user_id)
      )
    `);
    
    // Create points history table for tracking point transactions
    await connection.exec(`
      CREATE TABLE IF NOT EXISTS points_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        points_change INTEGER NOT NULL,
        reason TEXT NOT NULL,
        reference_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);
    
    console.log('Multiplayer tables created successfully');
    
  } catch (error) {
    console.error('Error creating multiplayer tables:', error);
    throw error;
  }
}