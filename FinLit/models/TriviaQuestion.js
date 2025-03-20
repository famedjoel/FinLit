import { connect } from '../config/sqlite-adapter.js';

// Create a TriviaQuestion model with Mongoose-like API
const TriviaQuestion = {
  // Create a new question
  create: async (questionData) => {
    try {
      const connection = await connect();
      
      // Convert options array to JSON string
      if (Array.isArray(questionData.options)) {
        questionData.options = JSON.stringify(questionData.options);
      }
      
      // Insert into database
      const result = await connection.run(
        `INSERT INTO trivia_questions (
          question, options, correctAnswer, explanation, difficulty, category
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          questionData.question,
          questionData.options,
          questionData.correctAnswer,
          questionData.explanation,
          questionData.difficulty || 'easy',
          questionData.category || 'general'
        ]
      );
      
      // Get the inserted question
      const question = await connection.get(
        'SELECT * FROM trivia_questions WHERE id = ?',
        result.lastID
      );
      
      return processQuestionData(question);
    } catch (error) {
      console.error('Error creating question:', error);
      throw error;
    }
  },
  
  // Get questions by difficulty
  getByDifficulty: async (difficulty, limit = 10) => {
    try {
      const connection = await connect();
      
      // Get questions with specified difficulty
      const questions = await connection.all(
        'SELECT * FROM trivia_questions WHERE difficulty = ? AND active = 1 ORDER BY RANDOM() LIMIT ?',
        [difficulty, limit]
      );
      
      return questions.map(question => processQuestionData(question));
    } catch (error) {
      console.error('Error fetching questions by difficulty:', error);
      throw error;
    }
  },
  
  // Get random questions (with optional difficulty filter)
  getRandom: async (limit = 5, difficulty = null) => {
    try {
      const connection = await connect();
      
      let query = 'SELECT * FROM trivia_questions WHERE active = 1';
      const params = [];
      
      if (difficulty) {
        query += ' AND difficulty = ?';
        params.push(difficulty);
      }
      
      query += ' ORDER BY RANDOM() LIMIT ?';
      params.push(limit);
      
      const questions = await connection.all(query, params);
      
      return questions.map(question => processQuestionData(question));
    } catch (error) {
      console.error('Error fetching random questions:', error);
      throw error;
    }
  },
  
  // Get all questions
  getAll: async () => {
    try {
      const connection = await connect();
      
      const questions = await connection.all('SELECT * FROM trivia_questions');
      
      return questions.map(question => processQuestionData(question));
    } catch (error) {
      console.error('Error fetching all questions:', error);
      throw error;
    }
  },
  
  // Find a question by ID
  findById: async (id) => {
    try {
      const connection = await connect();
      
      const question = await connection.get(
        'SELECT * FROM trivia_questions WHERE id = ?',
        id
      );
      
      return question ? processQuestionData(question) : null;
    } catch (error) {
      console.error('Error finding question by ID:', error);
      throw error;
    }
  },
  
  // Update a question
  update: async (id, updates) => {
    try {
      const connection = await connect();
      
      // Prepare options if it's an array
      if (Array.isArray(updates.options)) {
        updates.options = JSON.stringify(updates.options);
      }
      
      // Prepare update queries
      const setClauses = [];
      const params = [];
      
      Object.entries(updates).forEach(([key, value]) => {
        if (key !== 'id') {
          setClauses.push(`${key} = ?`);
          params.push(value);
        }
      });
      
      // Add ID to params
      params.push(id);
      
      // Execute update if there are fields to update
      if (setClauses.length > 0) {
        await connection.run(
          `UPDATE trivia_questions SET ${setClauses.join(', ')} WHERE id = ?`,
          params
        );
      }
      
      // Return updated question
      return await TriviaQuestion.findById(id);
    } catch (error) {
      console.error('Error updating question:', error);
      throw error;
    }
  },
  
  // Delete a question (set inactive)
  delete: async (id) => {
    try {
      const connection = await connect();
      
      await connection.run(
        'UPDATE trivia_questions SET active = 0 WHERE id = ?',
        id
      );
      
      return true;
    } catch (error) {
      console.error('Error deleting question:', error);
      throw error;
    }
  },
  
  // Permanently delete a question
  hardDelete: async (id) => {
    try {
      const connection = await connect();
      
      await connection.run(
        'DELETE FROM trivia_questions WHERE id = ?',
        id
      );
      
      return true;
    } catch (error) {
      console.error('Error permanently deleting question:', error);
      throw error;
    }
  },
  
  // Bulk insert questions
  bulkInsert: async (questions) => {
    try {
      const connection = await connect();
      
      // Start a transaction
      await connection.run('BEGIN TRANSACTION');
      
      try {
        for (const question of questions) {
          // Convert options array to JSON string
          const options = Array.isArray(question.options) 
            ? JSON.stringify(question.options) 
            : question.options;
          
          await connection.run(
            `INSERT INTO trivia_questions (
              question, options, correctAnswer, explanation, difficulty, category
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            [
              question.question,
              options,
              question.correctAnswer,
              question.explanation,
              question.difficulty || 'easy',
              question.category || 'general'
            ]
          );
        }
        
        // Commit the transaction
        await connection.run('COMMIT');
        return true;
      } catch (error) {
        // Rollback in case of error
        await connection.run('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error in bulk insert:', error);
      throw error;
    }
  }
};

// Process question data - parse JSON strings
function processQuestionData(question) {
  if (!question) return null;
  
  try {
    // Parse options JSON string to array
    if (typeof question.options === 'string') {
      question.options = JSON.parse(question.options);
    }
  } catch (error) {
    console.error('Error parsing question data:', error);
  }
  
  return question;
}

export default TriviaQuestion;