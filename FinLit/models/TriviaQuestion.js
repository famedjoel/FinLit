import { connect } from '../config/sqlite-adapter.js';

const TriviaQuestion = {
  // Create a new trivia question
  create: async (questionData) => {
    try {
      const connection = await connect();

      // Ensure options are always present, even for question types that do not use them
      if (!questionData.options) {
        questionData.options = [];
      }

      const options = JSON.stringify(questionData.options);

      // Handle fields specific to matching type questions
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

      // Ensure correctAnswer is provided and formatted appropriately
      let correctAnswer = questionData.correctAnswer;
      if (correctAnswer === undefined || correctAnswer === null) {
        if (questionData.type === 'multiple-choice' || questionData.type === 'true-false') {
          correctAnswer = 0;
        } else if (questionData.type === 'fill-blank') {
          correctAnswer = 'answer';
        } else if (questionData.type === 'calculation') {
          correctAnswer = 0;
        } else if (questionData.type === 'matching') {
          correctAnswer = JSON.stringify([0, 1, 2, 3].slice(0, questionData.terms?.length || 0));
        } else {
          correctAnswer = '';
        }
      }

      if (typeof correctAnswer !== 'string') {
        correctAnswer = questionData.type === 'matching' && Array.isArray(correctAnswer)
          ? JSON.stringify(correctAnswer)
          : correctAnswer.toString();
      }

      // Insert the question into the database
      const result = await connection.run(
        `INSERT INTO trivia_questions (
          question, options, correctAnswer, explanation, 
          difficulty, category, type, terms, definitions, 
          correct_matches, hint, formula, active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          questionData.question,
          options,
          correctAnswer,
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

  // Retrieve questions based on filters such as difficulty, category, and types
  getByFilters: async (difficulty = null, category = null, types = null, limit = 10, dateSeed = null) => {
    try {
      const connection = await connect();

      let query = 'SELECT * FROM trivia_questions WHERE active = 1';
      const params = [];

      if (difficulty) {
        query += ' AND difficulty = ?';
        params.push(difficulty);
      }

      if (category && category !== 'all') {
        query += ' AND category = ?';
        params.push(category);
      }

      if (types && Array.isArray(types) && types.length > 0) {
        query += ' AND type IN (' + types.map(() => '?').join(',') + ')';
        params.push(...types);
      }

      query += dateSeed
        ? ` ORDER BY (id * ${parseInt(dateSeed)}) % 1000`
        : ' ORDER BY RANDOM()';

      query += ' LIMIT ?';
      params.push(limit);

      const questions = await connection.all(query, params);

      return questions.map(question => processQuestionData(question));
    } catch (error) {
      console.error('Error fetching questions by filters:', error);
      throw error;
    }
  },

  // Retrieve questions by difficulty
  getByDifficulty: async (difficulty, limit = 10) => {
    try {
      return await TriviaQuestion.getByFilters(difficulty, null, null, limit);
    } catch (error) {
      console.error('Error fetching questions by difficulty:', error);
      throw error;
    }
  },

  // Retrieve questions by category
  getByCategory: async (category, limit = 10) => {
    try {
      return await TriviaQuestion.getByFilters(null, category, null, limit);
    } catch (error) {
      console.error('Error fetching questions by category:', error);
      throw error;
    }
  },

  // Retrieve questions by type
  getByType: async (type, limit = 10) => {
    try {
      return await TriviaQuestion.getByFilters(null, null, [type], limit);
    } catch (error) {
      console.error('Error fetching questions by type:', error);
      throw error;
    }
  },

  // Retrieve all available categories
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

  // Retrieve all available question types
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

  // Retrieve random questions
  getRandom: async (limit = 5) => {
    try {
      return await TriviaQuestion.getByFilters(null, null, null, limit);
    } catch (error) {
      console.error('Error fetching random questions:', error);
      throw error;
    }
  },

  // Retrieve all questions (admin use)
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

  // Find a question by its ID
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

  // Update an existing question
  update: async (id, updates) => {
    try {
      const connection = await connect();

      if (updates.options === undefined || updates.options === null) {
        if (['fill-blank', 'calculation'].includes(updates.type)) {
          updates.options = [];
        }
      }

      if (Array.isArray(updates.options)) {
        updates.options = JSON.stringify(updates.options);
      }

      if (updates.type === 'matching') {
        if (Array.isArray(updates.terms)) {
          updates.terms = JSON.stringify(updates.terms);
        }
        if (Array.isArray(updates.definitions)) {
          updates.definitions = JSON.stringify(updates.definitions);
        }
        if (Array.isArray(updates.correctMatches)) {
          updates.correct_matches = JSON.stringify(updates.correctMatches);
          delete updates.correctMatches;
        }
      }

      if (updates.correctAnswer === undefined || updates.correctAnswer === null) {
        if (updates.type) {
          const existingQuestion = await TriviaQuestion.findById(id);
          if (existingQuestion && existingQuestion.type !== updates.type) {
            if (updates.type === 'multiple-choice' || updates.type === 'true-false') {
              updates.correctAnswer = '0';
            } else if (updates.type === 'fill-blank') {
              updates.correctAnswer = 'answer';
            } else if (updates.type === 'calculation') {
              updates.correctAnswer = '0';
            } else if (updates.type === 'matching') {
              const terms = updates.terms || existingQuestion.terms;
              const termsLength = Array.isArray(terms) ? terms.length : 0;
              updates.correctAnswer = JSON.stringify([0, 1, 2, 3].slice(0, termsLength));
            }
          }
        }
      } else if (typeof updates.correctAnswer !== 'string') {
        updates.correctAnswer = updates.correctAnswer.toString();
      }

      const setClauses = [];
      const params = [];

      Object.entries(updates).forEach(([key, value]) => {
        if (key !== 'id') {
          setClauses.push(`${key} = ?`);
          params.push(value);
        }
      });

      params.push(id);

      if (setClauses.length > 0) {
        await connection.run(
          `UPDATE trivia_questions SET ${setClauses.join(', ')} WHERE id = ?`,
          params,
        );
      }

      return await TriviaQuestion.findById(id);
    } catch (error) {
      console.error('Error updating question:', error);
      throw error;
    }
  },

  // Soft delete a question (mark as inactive)
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

  // Bulk insert multiple questions
  bulkInsert: async (questions) => {
    try {
      const connection = await connect();

      await connection.run('BEGIN TRANSACTION');

      try {
        for (const question of questions) {
          if (!question.options) {
            question.options = [];
          }

          const options = JSON.stringify(question.options);

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

          let correctAnswer = question.correctAnswer;
          if (correctAnswer === undefined || correctAnswer === null) {
            if (question.type === 'multiple-choice' || question.type === 'true-false') {
              correctAnswer = 0;
            } else if (question.type === 'fill-blank') {
              correctAnswer = 'answer';
            } else if (question.type === 'calculation') {
              correctAnswer = 0;
            } else if (question.type === 'matching') {
              correctAnswer = JSON.stringify([0, 1, 2, 3].slice(0, question.terms?.length || 0));
            } else {
              correctAnswer = '';
            }
          }

          if (typeof correctAnswer !== 'string') {
            correctAnswer = correctAnswer.toString();
          }

          await connection.run(
            `INSERT INTO trivia_questions (
              question, options, correctAnswer, explanation, 
              difficulty, category, type, terms, definitions, 
              correct_matches, hint, formula, active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [
              question.question,
              options,
              correctAnswer,
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

        await connection.run('COMMIT');
        return true;
      } catch (error) {
        await connection.run('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error in bulk insert:', error);
      throw error;
    }
  },

  // Import questions from a JSON file
  importFromJSON: async (jsonData) => {
    try {
      let questions = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

      if (!Array.isArray(questions)) {
        throw new Error('Invalid JSON format. Expected an array of questions.');
      }

      questions = questions.map(question => {
        const result = { ...question };

        if (!result.options && ['fill-blank', 'calculation'].includes(result.type)) {
          result.options = [];
        }

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
    if (typeof question.options === 'string') {
      question.options = JSON.parse(question.options);
    }

    if (question.type === 'matching') {
      if (typeof question.terms === 'string') {
        question.terms = JSON.parse(question.terms);
      }
      if (typeof question.definitions === 'string') {
        question.definitions = JSON.parse(question.definitions);
      }
      if (typeof question.correct_matches === 'string') {
        question.correctMatches = JSON.parse(question.correct_matches);
      }
    }

    if (!question.type) {
      question.type = 'multiple-choice';
    }

    if (question.type === 'multiple-choice' || question.type === 'true-false') {
      if (typeof question.correctAnswer === 'string') {
        question.correctAnswer = parseInt(question.correctAnswer, 10);
      }
    } else if (question.type === 'calculation') {
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
