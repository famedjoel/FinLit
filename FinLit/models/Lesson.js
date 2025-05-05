// models/Lesson.js
import { connect } from '../config/sqlite-adapter.js';

// Lesson model
const Lesson = {
  // Create a new lesson
  create: async (lessonData) => {
    try {
      const connection = await connect();

      // Process resources array to JSON string
      let resources = '[]';
      if (Array.isArray(lessonData.resources)) {
        resources = JSON.stringify(lessonData.resources);
      }

      // Insert the lesson
      const result = await connection.run(
        `INSERT INTO lessons (
          chapter_id, title, content, resources, order, 
          estimated_minutes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          lessonData.chapterId,
          lessonData.title,
          lessonData.content || '',
          resources,
          lessonData.order || 0,
          lessonData.estimatedMinutes || 15,
          new Date().toISOString(),
          new Date().toISOString(),
        ],
      );

      // Get the inserted lesson
      const lesson = await connection.get(
        'SELECT * FROM lessons WHERE id = ?',
        result.lastID,
      );

      return processLessonData(lesson);
    } catch (error) {
      console.error('Error creating lesson:', error);
      throw error;
    }
  },

  // Find all lessons for a chapter
  findByChapterId: async (chapterId) => {
    try {
      const connection = await connect();

      const lessons = await connection.all(
        'SELECT * FROM lessons WHERE chapter_id = ? ORDER BY `order`',
        chapterId,
      );

      return lessons.map(lesson => processLessonData(lesson));
    } catch (error) {
      console.error('Error finding lessons by chapter ID:', error);
      throw error;
    }
  },

  // Find a lesson by ID
  findById: async (id) => {
    try {
      const connection = await connect();

      const lesson = await connection.get(
        'SELECT * FROM lessons WHERE id = ?',
        id,
      );

      if (!lesson) return null;

      // Get quiz for this lesson if it exists
      const quiz = await connection.get(
        'SELECT * FROM quizzes WHERE lesson_id = ?',
        id,
      );

      const processedLesson = processLessonData(lesson);

      // Add quiz to lesson if it exists
      if (quiz) {
        try {
          // Get questions for this quiz
          const questions = await connection.all(
            'SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY `order`',
            quiz.id,
          );

          processedLesson.quiz = {
            id: quiz.id,
            title: quiz.title,
            instructions: quiz.instructions,
            passingScore: quiz.passing_score,
            questions: questions.map(q => ({
              id: q.id,
              type: q.type,
              question: q.question,
              options: JSON.parse(q.options || '[]'),
              correctAnswer: q.correct_answer,
              explanation: q.explanation,
              order: q.order,
            })),
          };
        } catch (err) {
          console.error('Error processing quiz data:', err);
          processedLesson.quiz = null;
        }
      } else {
        processedLesson.quiz = null;
      }

      return processedLesson;
    } catch (error) {
      console.error('Error finding lesson by ID:', error);
      throw error;
    }
  },

  // Update a lesson
  update: async (id, updates) => {
    try {
      const connection = await connect();

      // Check if lesson exists
      const existingLesson = await connection.get(
        'SELECT * FROM lessons WHERE id = ?',
        id,
      );

      if (!existingLesson) {
        throw new Error('Lesson not found');
      }

      // Process resources array to JSON string if present
      if (updates.resources && Array.isArray(updates.resources)) {
        updates.resources = JSON.stringify(updates.resources);
      }

      // Build update query
      const setClauses = [];
      const params = [];

      for (const [key, value] of Object.entries(updates)) {
        // Convert camelCase to snake_case for DB
        const dbKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        setClauses.push(`${dbKey} = ?`);
        params.push(value);
      }

      // Add updated_at
      setClauses.push('updated_at = ?');
      params.push(new Date().toISOString());

      // Add id to params
      params.push(id);

      // Execute update
      await connection.run(
        `UPDATE lessons SET ${setClauses.join(', ')} WHERE id = ?`,
        params,
      );

      // Get updated lesson
      const updatedLesson = await connection.get(
        'SELECT * FROM lessons WHERE id = ?',
        id,
      );

      return processLessonData(updatedLesson);
    } catch (error) {
      console.error('Error updating lesson:', error);
      throw error;
    }
  },

  // Delete a lesson
  delete: async (id) => {
    try {
      const connection = await connect();

      // Start a transaction
      await connection.run('BEGIN TRANSACTION');

      try {
        // Delete quiz questions first (foreign key constraint)
        const quiz = await connection.get(
          'SELECT id FROM quizzes WHERE lesson_id = ?',
          id,
        );

        if (quiz) {
          await connection.run(
            'DELETE FROM quiz_questions WHERE quiz_id = ?',
            quiz.id,
          );

          // Then delete the quiz
          await connection.run(
            'DELETE FROM quizzes WHERE id = ?',
            quiz.id,
          );
        }

        // Finally delete the lesson
        await connection.run(
          'DELETE FROM lessons WHERE id = ?',
          id,
        );

        // Commit the transaction
        await connection.run('COMMIT');

        return true;
      } catch (err) {
        // Rollback the transaction on error
        await connection.run('ROLLBACK');
        throw err;
      }
    } catch (error) {
      console.error('Error deleting lesson:', error);
      throw error;
    }
  },
};

// Process lesson data from DB format
function processLessonData(lesson) {
  if (!lesson) return null;

  // Parse resources JSON string to array
  let resources = [];
  try {
    resources = JSON.parse(lesson.resources || '[]');
  } catch (e) {
    console.error('Error parsing lesson resources:', e);
  }

  // Convert snake_case to camelCase
  return {
    id: lesson.id,
    chapterId: lesson.chapter_id,
    title: lesson.title,
    content: lesson.content,
    resources,
    order: lesson.order,
    estimatedMinutes: lesson.estimated_minutes,
    createdAt: lesson.created_at,
    updatedAt: lesson.updated_at,
  };
}

export default Lesson;
