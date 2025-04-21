// models/Quiz.js
import { connect } from '../config/sqlite-adapter.js';

// Quiz model
const Quiz = {
  // Create a new quiz
  create: async (quizData) => {
    try {
      const connection = await connect();
      
      // Start a transaction
      await connection.run('BEGIN TRANSACTION');
      
      try {
        // Insert the quiz
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
            new Date().toISOString()
          ]
        );
        
        const quizId = quizResult.lastID;
        
        // Insert questions if provided
        if (Array.isArray(quizData.questions) && quizData.questions.length > 0) {
          for (let i = 0; i < quizData.questions.length; i++) {
            const question = quizData.questions[i];
            
            // Process options array to JSON string
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
                i, // Use array index as order
                new Date().toISOString(),
                new Date().toISOString()
              ]
            );
          }
        }
        
        // Commit the transaction
        await connection.run('COMMIT');
        
        // Get the created quiz with questions
        return await Quiz.findById(quizId);
      } catch (err) {
        // Rollback the transaction on error
        await connection.run('ROLLBACK');
        throw err;
      }
    } catch (error) {
      console.error('Error creating quiz:', error);
      throw error;
    }
  },
  
  // Find a quiz by ID
  findById: async (id) => {
    try {
      const connection = await connect();
      
      const quiz = await connection.get(
        'SELECT * FROM quizzes WHERE id = ?',
        id
      );
      
      if (!quiz) return null;
      
      // Get questions for this quiz
      const questions = await connection.all(
        'SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY `order`',
        id
      );
      
      // Process the quiz data
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
          order: q.order
        })),
        createdAt: quiz.created_at,
        updatedAt: quiz.updated_at
      };
      
      return processedQuiz;
    } catch (error) {
      console.error('Error finding quiz by ID:', error);
      throw error;
    }
  },
  
  // Find a quiz by lesson ID
  findByLessonId: async (lessonId) => {
    try {
      const connection = await connect();
      
      const quiz = await connection.get(
        'SELECT * FROM quizzes WHERE lesson_id = ?',
        lessonId
      );
      
      if (!quiz) return null;
      
      // Use the existing findById method to get the full quiz with questions
      return await Quiz.findById(quiz.id);
    } catch (error) {
      console.error('Error finding quiz by lesson ID:', error);
      throw error;
    }
  },
  
  // Update a quiz
  update: async (id, updates) => {
    try {
      const connection = await connect();
      
      // Start a transaction
      await connection.run('BEGIN TRANSACTION');
      
      try {
        // Check if quiz exists
        const existingQuiz = await connection.get(
          'SELECT * FROM quizzes WHERE id = ?',
          id
        );
        
        if (!existingQuiz) {
          throw new Error('Quiz not found');
        }
        
        // Update quiz properties
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
          
          // Add updated_at
          setClauses.push('updated_at = ?');
          params.push(new Date().toISOString());
          
          // Add id to params
          params.push(id);
          
          // Execute update
          await connection.run(
            `UPDATE quizzes SET ${setClauses.join(', ')} WHERE id = ?`,
            params
          );
        }
        
        // Update questions if provided
        if (Array.isArray(updates.questions) && updates.questions.length > 0) {
          // Delete existing questions
          await connection.run(
            'DELETE FROM quiz_questions WHERE quiz_id = ?',
            id
          );
          
          // Insert new questions
          for (let i = 0; i < updates.questions.length; i++) {
            const question = updates.questions[i];
            
            // Process options array to JSON string
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
                i, // Use array index as order
                new Date().toISOString(),
                new Date().toISOString()
              ]
            );
          }
        }
        
        // Commit the transaction
        await connection.run('COMMIT');
        
        // Get the updated quiz with questions
        return await Quiz.findById(id);
      } catch (err) {
        // Rollback the transaction on error
        await connection.run('ROLLBACK');
        throw err;
      }
    } catch (error) {
      console.error('Error updating quiz:', error);
      throw error;
    }
  },
  
  // Delete a quiz
  delete: async (id) => {
    try {
      const connection = await connect();
      
      // Start a transaction
      await connection.run('BEGIN TRANSACTION');
      
      try {
        // Delete quiz questions first (foreign key constraint)
        await connection.run(
          'DELETE FROM quiz_questions WHERE quiz_id = ?',
          id
        );
        
        // Then delete the quiz
        await connection.run(
          'DELETE FROM quizzes WHERE id = ?',
          id
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
      console.error('Error deleting quiz:', error);
      throw error;
    }
  }
};

export default Quiz;