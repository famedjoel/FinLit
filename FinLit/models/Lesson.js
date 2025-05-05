import { connect } from '../config/sqlite-adapter.js';

/*
  Lesson model for handling lesson-related database operations.
  All dates are generated in ISO format and resources are stored as JSON.
*/

const Lesson = {
  // Inserts a new lesson into the database and returns the created record.
  create: async (lessonData) => {
    try {
      const connection = await connect();

      // Convert resources to JSON string if provided as an array.
      let resources = '[]';
      if (Array.isArray(lessonData.resources)) {
        resources = JSON.stringify(lessonData.resources);
      }

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

  // Retrieves all lessons for a given chapter, ordered by the "order" field.
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

  // Retrieves a lesson by its ID, including any linked quiz and questions.
  findById: async (id) => {
    try {
      const connection = await connect();

      const lesson = await connection.get(
        'SELECT * FROM lessons WHERE id = ?',
        id,
      );

      if (!lesson) return null;

      const quiz = await connection.get(
        'SELECT * FROM quizzes WHERE lesson_id = ?',
        id,
      );

      const processedLesson = processLessonData(lesson);

      if (quiz) {
        try {
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

  // Updates the properties of an existing lesson.
  update: async (id, updates) => {
    try {
      const connection = await connect();

      const existingLesson = await connection.get(
        'SELECT * FROM lessons WHERE id = ?',
        id,
      );

      if (!existingLesson) {
        throw new Error('Lesson not found');
      }

      // Convert resources array to JSON if necessary.
      if (updates.resources && Array.isArray(updates.resources)) {
        updates.resources = JSON.stringify(updates.resources);
      }

      const setClauses = [];
      const params = [];

      // Convert camelCase keys to snake_case for database column names.
      for (const [key, value] of Object.entries(updates)) {
        const dbKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        setClauses.push(`${dbKey} = ?`);
        params.push(value);
      }

      // Update the modification date.
      setClauses.push('updated_at = ?');
      params.push(new Date().toISOString());

      // The final parameter is the lesson ID.
      params.push(id);

      await connection.run(
        `UPDATE lessons SET ${setClauses.join(', ')} WHERE id = ?`,
        params,
      );

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

  // Deletes a lesson and its associated quiz data within a transaction.
  delete: async (id) => {
    try {
      const connection = await connect();

      await connection.run('BEGIN TRANSACTION');

      try {
        const quiz = await connection.get(
          'SELECT id FROM quizzes WHERE lesson_id = ?',
          id,
        );

        if (quiz) {
          await connection.run(
            'DELETE FROM quiz_questions WHERE quiz_id = ?',
            quiz.id,
          );

          await connection.run(
            'DELETE FROM quizzes WHERE id = ?',
            quiz.id,
          );
        }

        await connection.run(
          'DELETE FROM lessons WHERE id = ?',
          id,
        );

        await connection.run('COMMIT');

        return true;
      } catch (err) {
        await connection.run('ROLLBACK');
        throw err;
      }
    } catch (error) {
      console.error('Error deleting lesson:', error);
      throw error;
    }
  },
};

// Helper function to format lesson data for application use.
function processLessonData(lesson) {
  if (!lesson) return null;

  let resources = [];
  try {
    resources = JSON.parse(lesson.resources || '[]');
  } catch (e) {
    console.error('Error parsing lesson resources:', e);
  }

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
