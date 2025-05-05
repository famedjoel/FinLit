import { connect } from './sqlite-adapter.js';

// InitialiSe database tables for courses
export async function initCourseTables() {
  try {
    const connection = await connect();

    // Create courses table
    await connection.exec(`
      CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        level TEXT NOT NULL DEFAULT 'Beginner',
        image_url TEXT,
        chapters_count INTEGER DEFAULT 0,
        lessons_count INTEGER DEFAULT 0,
        estimated_hours REAL DEFAULT 0,
        status TEXT DEFAULT 'draft',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create chapters table
    await connection.exec(`
      CREATE TABLE IF NOT EXISTS chapters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        "order" INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE
      )
    `);

    // Create lessons table
    await connection.exec(`
      CREATE TABLE IF NOT EXISTS lessons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chapter_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        resources TEXT,
        "order" INTEGER DEFAULT 0,
        estimated_minutes INTEGER DEFAULT 15,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (chapter_id) REFERENCES chapters (id) ON DELETE CASCADE
      )
    `);

    // Create quizzes table
    await connection.exec(`
      CREATE TABLE IF NOT EXISTS quizzes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lesson_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        instructions TEXT,
        passing_score INTEGER DEFAULT 70,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE
      )
    `);

    // Create quiz questions table
    await connection.exec(`
      CREATE TABLE IF NOT EXISTS quiz_questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quiz_id INTEGER NOT NULL,
        type TEXT DEFAULT 'multiple-choice',
        question TEXT NOT NULL,
        options TEXT,
        correct_answer TEXT NOT NULL,
        explanation TEXT,
        "order" INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (quiz_id) REFERENCES quizzes (id) ON DELETE CASCADE
      )
    `);

    // Create user course progress table
    await connection.exec(`
      CREATE TABLE IF NOT EXISTS user_course_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        course_id INTEGER NOT NULL,
        status TEXT DEFAULT 'enrolled',
        progress INTEGER DEFAULT 0,
        enrolled_at TEXT DEFAULT CURRENT_TIMESTAMP,
        last_accessed TEXT DEFAULT CURRENT_TIMESTAMP,
        completed_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (course_id) REFERENCES courses (id)
      )
    `);

    // Create user lesson progress table
    await connection.exec(`
      CREATE TABLE IF NOT EXISTS user_lesson_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        lesson_id INTEGER NOT NULL,
        status TEXT DEFAULT 'not-started',
        position INTEGER DEFAULT 0,
        started_at TEXT,
        completed_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (lesson_id) REFERENCES lessons (id)
      )
    `);

    // Create user quiz attempts table
    await connection.exec(`
      CREATE TABLE IF NOT EXISTS user_quiz_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        quiz_id INTEGER NOT NULL,
        attempt_number INTEGER DEFAULT 1,
        score INTEGER DEFAULT 0,
        passed BOOLEAN DEFAULT 0,
        answers TEXT,
        started_at TEXT DEFAULT CURRENT_TIMESTAMP,
        completed_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (quiz_id) REFERENCES quizzes (id)
      )
    `);

    console.log('Course tables created successfully');
  } catch (error) {
    console.error('Error creating course tables:', error);
    throw error;
  }
}
