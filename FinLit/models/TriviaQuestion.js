// models/TriviaQuestion.js
import { connect } from '../config/sqlite-adapter.js';

// Updated TriviaQuestion model with fixes for database constraints
const TriviaQuestion = {
  // Create a new question
  create: async (questionData) => {
    try {
      const connection = await connect();

      // Process arrays for storage as JSON strings
      // Ensure options is always present for all question types due to NOT NULL constraint
      if (!questionData.options) {
        if (['fill-blank', 'calculation'].includes(questionData.type)) {
          questionData.options = []; // Empty array for types that don't use options
        } else {
          questionData.options = []; // Default empty options for other types
        }
      }

      const options = JSON.stringify(questionData.options);

      // Handle question type specific fields
      let terms = null; let definitions = null; let correctMatches = null;
      if (questionData.type === 'matching') {
        if (Array.isArray(questionData.terms)) {
          terms = JSON.stringify(questionData.terms);
        }
        if (Array.isArray(questionData.definitions)) {
          definitions = JSON.stringify(questionData.definitions);
        }
        if (Array.isArray(questionData.correctMatches)) {
          correctMatches = JSON.stringify(questionData.correctMatches);
        }
      }

      // Ensure correctAnswer is provided and in the correct format
      let correctAnswer = questionData.correctAnswer;
      if (correctAnswer === undefined || correctAnswer === null) {
        // Default to something based on question type
        if (questionData.type === 'multiple-choice' || questionData.type === 'true-false') {
          correctAnswer = 0; // Default to first option
        } else if (questionData.type === 'fill-blank') {
          correctAnswer = 'answer'; // Default placeholder
        } else if (questionData.type === 'calculation') {
          correctAnswer = 0; // Default to zero
        } else if (questionData.type === 'matching') {
          correctAnswer = JSON.stringify([0, 1, 2, 3].slice(0, questionData.terms?.length || 0));
        } else {
          correctAnswer = ''; // Empty string as last resort
        }
      }

      // Convert to string if needed for the database
      if (typeof correctAnswer !== 'string') {
        if (questionData.type === 'matching') {
          // For matching type, ensure it's a JSON string
          if (Array.isArray(correctAnswer)) {
            correctAnswer = JSON.stringify(correctAnswer);
          }
        } else if (questionData.type === 'calculation') {
          // For calculation, ensure it's a string
          correctAnswer = correctAnswer.toString();
        } else {
          // For other types, convert to string
          correctAnswer = correctAnswer.toString();
        }
      }

      // Insert the question with type-specific fields
      const result = await connection.run(
        `INSERT INTO trivia_questions (
          question, options, correctAnswer, explanation, 
          difficulty, category, type, terms, definitions, 
          correct_matches, hint, formula, active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          questionData.question,
          options, // Always provide options
          correctAnswer, // Ensure correctAnswer is provided
          questionData.explanation || 'No explanation provided',
          questionData.difficulty || 'easy',
          questionData.category || 'general',
          questionData.type || 'multiple-choice',
          terms,
          definitions,
          correctMatches,
          questionData.hint || null,
          questionData.formula || null,
        ],
      );

      // Get the inserted question
      const question = await connection.get(
        'SELECT * FROM trivia_questions WHERE id = ?',
        result.lastID,
      );

      return processQuestionData(question);
    } catch (error) {
      console.error('Error creating question:', error);
      throw error;
    }
  },

  // Get questions with multiple filters including types
  getByFilters: async (difficulty = null, category = null, types = null, limit = 10, dateSeed = null) => {
    try {
      const connection = await connect();

      // Build query with all filters
      let query = 'SELECT * FROM trivia_questions WHERE active = 1';
      const params = [];

      // Add difficulty filter
      if (difficulty) {
        query += ' AND difficulty = ?';
        params.push(difficulty);
      }

      // Add category filter
      if (category && category !== 'all') {
        query += ' AND category = ?';
        params.push(category);
      }

      // Add question type filter
      if (types && Array.isArray(types) && types.length > 0) {
        query += ' AND type IN (' + types.map(() => '?').join(',') + ')';
        params.push(...types);
      }

      // Ordering for consistent results or random
      if (dateSeed) {
        // Use a seed-based ordering for daily challenges
        query += ` ORDER BY (id * ${parseInt(dateSeed)}) % 1000`;
      } else {
        query += ' ORDER BY RANDOM()';
      }

      // Add limit
      query += ' LIMIT ?';
      params.push(limit);

      // Execute query
      const questions = await connection.all(query, params);

      // Process all returned questions
      return questions.map(question => processQuestionData(question));
    } catch (error) {
      console.error('Error fetching questions by filters:', error);
      throw error;
    }
  },

  // Get questions by difficulty
  getByDifficulty: async (difficulty, limit = 10) => {
    try {
      return await TriviaQuestion.getByFilters(difficulty, null, null, limit);
    } catch (error) {
      console.error('Error fetching questions by difficulty:', error);
      throw error;
    }
  },

  // Get questions by category
  getByCategory: async (category, limit = 10) => {
    try {
      return await TriviaQuestion.getByFilters(null, category, null, limit);
    } catch (error) {
      console.error('Error fetching questions by category:', error);
      throw error;
    }
  },

  // Get questions by question type
  getByType: async (type, limit = 10) => {
    try {
      return await TriviaQuestion.getByFilters(null, null, [type], limit);
    } catch (error) {
      console.error('Error fetching questions by type:', error);
      throw error;
    }
  },

  // Get all available categories
  getCategories: async () => {
    try {
      const connection = await connect();

      const result = await connection.all(
        'SELECT DISTINCT category FROM trivia_questions WHERE active = 1',
      );

      return result.map(row => row.category).filter(Boolean);
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  // Get all available question types
  getQuestionTypes: async () => {
    try {
      const connection = await connect();

      const result = await connection.all(
        'SELECT DISTINCT type FROM trivia_questions WHERE active = 1',
      );

      return result.map(row => row.type).filter(Boolean);
    } catch (error) {
      console.error('Error fetching question types:', error);
      throw error;
    }
  },

  // Get random questions
  getRandom: async (limit = 5) => {
    try {
      return await TriviaQuestion.getByFilters(null, null, null, limit);
    } catch (error) {
      console.error('Error fetching random questions:', error);
      throw error;
    }
  },

  // Get all questions (admin endpoint)
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
        id,
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

      // Process arrays for updates
      if (updates.options === undefined || updates.options === null) {
        // If options is not provided, but type is fill-blank or calculation, provide empty array
        if (['fill-blank', 'calculation'].includes(updates.type)) {
          updates.options = [];
        }
      }

      if (Array.isArray(updates.options)) {
        updates.options = JSON.stringify(updates.options);
      }

      // Handle question type specific updates
      if (updates.type === 'matching') {
        if (Array.isArray(updates.terms)) {
          updates.terms = JSON.stringify(updates.terms);
        }
        if (Array.isArray(updates.definitions)) {
          updates.definitions = JSON.stringify(updates.definitions);
        }
        if (Array.isArray(updates.correctMatches)) {
          updates.correct_matches = JSON.stringify(updates.correctMatches);
          delete updates.correctMatches; // Remove camelCase version
        }
      }

      // Ensure correctAnswer is provided if being updated
      if (updates.correctAnswer === undefined || updates.correctAnswer === null) {
        // If updating type but not correctAnswer, ensure correctAnswer is appropriate for the type
        if (updates.type) {
          const existingQuestion = await TriviaQuestion.findById(id);
          if (existingQuestion) {
            if (existingQuestion.type !== updates.type) {
              // Type is changing, so we need to ensure correctAnswer is appropriate
              if (updates.type === 'multiple-choice' || updates.type === 'true-false') {
                updates.correctAnswer = '0'; // Default to first option
              } else if (updates.type === 'fill-blank') {
                updates.correctAnswer = 'answer'; // Default placeholder
              } else if (updates.type === 'calculation') {
                updates.correctAnswer = '0'; // Default to zero
              } else if (updates.type === 'matching') {
                // Create default matching based on existing terms or definitions
                const terms = updates.terms || existingQuestion.terms;
                const termsLength = Array.isArray(terms) ? terms.length : 0;
                updates.correctAnswer = JSON.stringify([0, 1, 2, 3].slice(0, termsLength));
              }
            }
          }
        }
      } else if (typeof updates.correctAnswer !== 'string') {
        // Convert correctAnswer to string if it's not already
        updates.correctAnswer = updates.correctAnswer.toString();
      }

      // Build update query
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
          params,
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
        id,
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
        id,
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

      // Start a transaction for better performance
      await connection.run('BEGIN TRANSACTION');

      try {
        for (const question of questions) {
          // Ensure options is always present for all question types due to NOT NULL constraint
          if (!question.options) {
            if (['fill-blank', 'calculation'].includes(question.type)) {
              question.options = []; // Empty array for types that don't use options
            } else {
              question.options = []; // Default empty options for other types
            }
          }

          // Process arrays for storage
          const options = JSON.stringify(question.options);

          // Handle question type specific fields
          let terms = null; let definitions = null; let correctMatches = null;
          if (question.type === 'matching') {
            if (Array.isArray(question.terms)) {
              terms = JSON.stringify(question.terms);
            }
            if (Array.isArray(question.definitions)) {
              definitions = JSON.stringify(question.definitions);
            }
            if (Array.isArray(question.correctMatches)) {
              correctMatches = JSON.stringify(question.correctMatches);
            }
          }

          // Ensure correctAnswer is provided and in the correct format
          let correctAnswer = question.correctAnswer;
          if (correctAnswer === undefined || correctAnswer === null) {
            // Default to something based on question type
            if (question.type === 'multiple-choice' || question.type === 'true-false') {
              correctAnswer = 0; // Default to first option
            } else if (question.type === 'fill-blank') {
              correctAnswer = 'answer'; // Default placeholder
            } else if (question.type === 'calculation') {
              correctAnswer = 0; // Default to zero
            } else if (question.type === 'matching') {
              correctAnswer = JSON.stringify([0, 1, 2, 3].slice(0, question.terms?.length || 0));
            } else {
              correctAnswer = ''; // Empty string as last resort
            }
          }

          // Convert to string if needed for the database
          if (typeof correctAnswer !== 'string') {
            correctAnswer = correctAnswer.toString();
          }

          // Insert the question
          await connection.run(
            `INSERT INTO trivia_questions (
              question, options, correctAnswer, explanation, 
              difficulty, category, type, terms, definitions, 
              correct_matches, hint, formula, active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [
              question.question,
              options, // Always provide options
              correctAnswer, // Ensure correctAnswer is provided
              question.explanation || 'No explanation provided',
              question.difficulty || 'easy',
              question.category || 'general',
              question.type || 'multiple-choice',
              terms,
              definitions,
              correctMatches,
              question.hint || null,
              question.formula || null,
            ],
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
  },

  // Import from JSON file
  importFromJSON: async (jsonData) => {
    try {
      let questions;

      // Check if input is string (JSON) or array
      if (typeof jsonData === 'string') {
        questions = JSON.parse(jsonData);
      } else {
        questions = jsonData;
      }

      if (!Array.isArray(questions)) {
        throw new Error('Invalid JSON format. Expected an array of questions.');
      }

      // Add empty options arrays and ensure correctAnswer for questions that need them
      questions = questions.map(question => {
        const result = { ...question };

        // Ensure options
        if (!result.options && ['fill-blank', 'calculation'].includes(result.type)) {
          result.options = [];
        }

        // Ensure correctAnswer
        if (result.correctAnswer === undefined || result.correctAnswer === null) {
          if (result.type === 'multiple-choice' || result.type === 'true-false') {
            result.correctAnswer = 0;
          } else if (result.type === 'fill-blank') {
            result.correctAnswer = 'answer';
          } else if (result.type === 'calculation') {
            result.correctAnswer = 0;
          } else if (result.type === 'matching' && Array.isArray(result.terms)) {
            result.correctAnswer = [0, 1, 2, 3].slice(0, result.terms.length);
          } else {
            result.correctAnswer = '';
          }
        }

        return result;
      });

      return await TriviaQuestion.bulkInsert(questions);
    } catch (error) {
      console.error('Error importing from JSON:', error);
      throw error;
    }
  },
};

// Process question data from database format to JavaScript format
function processQuestionData(question) {
  if (!question) return null;

  try {
    // Parse options JSON string to array if needed
    if (typeof question.options === 'string') {
      question.options = JSON.parse(question.options);
    }

    // Type-specific parsing
    if (question.type === 'matching') {
      // Parse terms
      if (typeof question.terms === 'string') {
        question.terms = JSON.parse(question.terms);
      }

      // Parse definitions
      if (typeof question.definitions === 'string') {
        question.definitions = JSON.parse(question.definitions);
      }

      // Parse correctMatches (handle both camelCase and snake_case)
      if (typeof question.correct_matches === 'string') {
        question.correctMatches = JSON.parse(question.correct_matches);
      }
    }

    // Set default question type if not specified
    if (!question.type) {
      question.type = 'multiple-choice';
    }

    // Handle correctAnswer format based on question type
    if (question.type === 'multiple-choice' || question.type === 'true-false') {
      // Convert string to number for these types
      if (typeof question.correctAnswer === 'string') {
        question.correctAnswer = parseInt(question.correctAnswer, 10);
      }
    } else if (question.type === 'calculation') {
      // Convert string to number for calculation
      if (typeof question.correctAnswer === 'string') {
        question.correctAnswer = parseFloat(question.correctAnswer);
      }
    }
  } catch (error) {
    console.error('Error parsing question data:', error);
  }

  return question;
}

export default TriviaQuestion;
