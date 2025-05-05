import { connect } from '../config/sqlite-adapter.js';

// Quiz model encapsulating quiz-related database operations
const Quiz = {
  // Create a new quiz with optional questions
  create: async (quizData) => {
    try {
      const connection = await connect();

      // Begin transaction
      await connection.run('BEGIN TRANSACTION');

      try {
        // Insert a new quiz record
        const quizResult = await connection.run(
          `INSERT INTO quizzes (
            lesson_id, title, instructions, passing_score, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            quizData.lessonId,
            quizData.title || 'Lesson Quiz',
            quizData.instructions || 'Test your knowledge of this lesson.',
            quizData.passingScore || 70,
            new Date().toISOString(),
            new Date().toISOString(),
          ],
        );

        const quizId = quizResult.lastID;

        // If questions are provided, add each one to the quiz_questions table
        if (Array.isArray(quizData.questions) && quizData.questions.length > 0) {
          for (let i = 0; i < quizData.questions.length; i++) {
            const question = quizData.questions[i];

            // Convert options array to a JSON string
            let options = '[]';
            if (Array.isArray(question.options)) {
              options = JSON.stringify(question.options);
            }

            await connection.run(
              `INSERT INTO quiz_questions (
                quiz_id, type, question, options, correct_answer, 
                explanation, order, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                quizId,
                question.type || 'multiple-choice',
                question.question,
                options,
                question.correctAnswer,
                question.explanation || '',
                i, // Order based on array index
                new Date().toISOString(),
                new Date().toISOString(),
              ],
            );
          }
        }

        // Commit transaction after successful insertion
        await connection.run('COMMIT');

        // Return the complete quiz with its questions
        return await Quiz.findById(quizId);
      } catch (err) {
        // Roll back transaction if an error occurs
        await connection.run('ROLLBACK');
        throw err;
      }
    } catch (error) {
      console.error('Error creating quiz:', error);
      throw error;
    }
  },

  // Retrieve a quiz and its associated questions by quiz ID
  findById: async (id) => {
    try {
      const connection = await connect();

      // Fetch the quiz record
      const quiz = await connection.get(
        'SELECT * FROM quizzes WHERE id = ?',
        id,
      );

      if (!quiz) return null;

      // Fetch related questions in the specified order
      const questions = await connection.all(
        'SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY `order`',
        id,
      );

      // Assemble and return the processed quiz object
      const processedQuiz = {
        id: quiz.id,
        lessonId: quiz.lesson_id,
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
        createdAt: quiz.created_at,
        updatedAt: quiz.updated_at,
      };

      return processedQuiz;
    } catch (error) {
      console.error('Error finding quiz by ID:', error);
      throw error;
    }
  },

  // Retrieve a quiz by its associated lesson ID
  findByLessonId: async (lessonId) => {
    try {
      const connection = await connect();

      // Locate the quiz using the lesson identifier
      const quiz = await connection.get(
        'SELECT * FROM quizzes WHERE lesson_id = ?',
        lessonId,
      );

      if (!quiz) return null;

      // Leverage findById to include the questions
      return await Quiz.findById(quiz.id);
    } catch (error) {
      console.error('Error finding quiz by lesson ID:', error);
      throw error;
    }
  },

  // Update an existing quiz and optionally its questions
  update: async (id, updates) => {
    try {
      const connection = await connect();

      // Begin transaction for updating
      await connection.run('BEGIN TRANSACTION');

      try {
        // Confirm that the quiz exists
        const existingQuiz = await connection.get(
          'SELECT * FROM quizzes WHERE id = ?',
          id,
        );

        if (!existingQuiz) {
          throw new Error('Quiz not found');
        }

        // Update core quiz details if any are provided
        if (updates.title || updates.instructions || updates.passingScore) {
          const setClauses = [];
          const params = [];

          if (updates.title) {
            setClauses.push('title = ?');
            params.push(updates.title);
          }

          if (updates.instructions) {
            setClauses.push('instructions = ?');
            params.push(updates.instructions);
          }

          if (updates.passingScore) {
            setClauses.push('passing_score = ?');
            params.push(updates.passingScore);
          }

          // Update the modification timestamp
          setClauses.push('updated_at = ?');
          params.push(new Date().toISOString());

          // Include quiz identifier in parameters
          params.push(id);

          await connection.run(
            `UPDATE quizzes SET ${setClauses.join(', ')} WHERE id = ?`,
            params,
          );
        }

        // Replace quiz questions if a new set is provided
        if (Array.isArray(updates.questions) && updates.questions.length > 0) {
          // Remove existing questions to prepare for insertion of new ones
          await connection.run(
            'DELETE FROM quiz_questions WHERE quiz_id = ?',
            id,
          );

          // Insert each new question sequentially
          for (let i = 0; i < updates.questions.length; i++) {
            const question = updates.questions[i];

            // Convert options to a JSON string if available
            let options = '[]';
            if (Array.isArray(question.options)) {
              options = JSON.stringify(question.options);
            }

            await connection.run(
              `INSERT INTO quiz_questions (
                quiz_id, type, question, options, correct_answer, 
                explanation, order, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                id,
                question.type || 'multiple-choice',
                question.question,
                options,
                question.correctAnswer,
                question.explanation || '',
                i, // Index defines the display order
                new Date().toISOString(),
                new Date().toISOString(),
              ],
            );
          }
        }

        // Finalise update by committing the transaction
        await connection.run('COMMIT');

        // Return the updated quiz with questions
        return await Quiz.findById(id);
      } catch (err) {
        // Roll back all changes if an error occurs
        await connection.run('ROLLBACK');
        throw err;
      }
    } catch (error) {
      console.error('Error updating quiz:', error);
      throw error;
    }
  },

  // Delete a quiz and its related questions
  delete: async (id) => {
    try {
      const connection = await connect();

      // Begin a transaction for deletion
      await connection.run('BEGIN TRANSACTION');

      try {
        // Remove associated quiz questions first (to satisfy foreign key constraints)
        await connection.run(
          'DELETE FROM quiz_questions WHERE quiz_id = ?',
          id,
        );

        // Remove the quiz record
        await connection.run(
          'DELETE FROM quizzes WHERE id = ?',
          id,
        );

        // Commit the deletion transaction
        await connection.run('COMMIT');

        return true;
      } catch (err) {
        // Roll back on any error encountered during deletion
        await connection.run('ROLLBACK');
        throw err;
      }
    } catch (error) {
      console.error('Error deleting quiz:', error);
      throw error;
    }
  },
};

export default Quiz;
