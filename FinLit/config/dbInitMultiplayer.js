import { connect } from './sqlite-adapter.js';

export async function initMultiplayerTables() {
  try {
    const connection = await connect();

    // Verify if the challenges table exists
    const tablesCheck = await connection.all(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='challenges'",
    );

    if (tablesCheck.length === 0) {
      // Create the challenges table for multiplayer user challenges
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
          quiz_settings TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          challenged_at TEXT,
          completed_at TEXT,
          FOREIGN KEY (challenger_id) REFERENCES users (id),
          FOREIGN KEY (challenged_id) REFERENCES users (id),
          FOREIGN KEY (winner_id) REFERENCES users (id)
        )
      `);
    } else {
      // Ensure the quiz_settings column exists in the challenges table
      const tableInfo = await connection.all('PRAGMA table_info(challenges)');
      const hasQuizSettings = tableInfo.some(column => column.name === 'quiz_settings');

      if (!hasQuizSettings) {
        await connection.exec(`
          ALTER TABLE challenges ADD COLUMN quiz_settings TEXT
        `);
        console.log('Added quiz_settings column to the existing challenges table');
      }
    }

    // Create the leaderboard table for tracking user rankings
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

    // Create the user points table for managing reward points
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

    // Create the points history table for recording point transactions
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
