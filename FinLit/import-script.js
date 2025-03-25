/* eslint-disable no-undef */
/**
 * Import Script for Financial Trivia Questions
 * 
 * This script imports questions from a JSON file into the trivia_questions table.
 * It supports all question types: multiple-choice, true-false, fill-blank, matching, calculation.
 * 
 * Usage: node import-script.js [path-to-json-file]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import TriviaQuestion from './models/TriviaQuestion.js';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to validate questions
const validateQuestion = (question) => {
  // Common validations
  if (!question.question || !question.explanation) {
    return `Question missing required fields: ${JSON.stringify(question)}`;
  }
  
  if (!question.difficulty) {
    question.difficulty = 'medium';
  }
  
  if (!question.category) {
    question.category = 'general';
  }
  
  // Type-specific validations
  switch (question.type) {
    case 'multiple-choice':
      if (!Array.isArray(question.options) || question.options.length < 2) {
        return `Multiple choice question missing options: ${JSON.stringify(question)}`;
      }
      if (question.correctAnswer === undefined || question.correctAnswer === null) {
        return `Multiple choice question missing correctAnswer: ${JSON.stringify(question)}`;
      }
      break;
      
    case 'true-false':
      // Set default options for true-false if not provided
      if (!Array.isArray(question.options) || question.options.length !== 2) {
        question.options = ["True", "False"];
      }
      if (question.correctAnswer === undefined || question.correctAnswer === null) {
        return `True/False question missing correctAnswer: ${JSON.stringify(question)}`;
      }
      break;
      
    case 'fill-blank':
      if (!question.correctAnswer) {
        return `Fill in the blank question missing correctAnswer: ${JSON.stringify(question)}`;
      }
      // Ensure question contains a blank marker
      if (!question.question.includes('____') && !question.question.toLowerCase().includes('[blank]')) {
        question.question = question.question.replace(/\.\s*$/, '') + ' ____.';
        console.warn(`Added blank marker to question: ${question.question}`);
      }
      break;
      
    case 'matching':
      if (!Array.isArray(question.terms) || question.terms.length < 2) {
        return `Matching question missing terms: ${JSON.stringify(question)}`;
      }
      if (!Array.isArray(question.definitions) || question.definitions.length < 2) {
        return `Matching question missing definitions: ${JSON.stringify(question)}`;
      }
      if (!Array.isArray(question.correctMatches) || question.correctMatches.length !== question.terms.length) {
        return `Matching question has invalid correctMatches: ${JSON.stringify(question)}`;
      }
      break;
      
    case 'calculation':
      if (question.correctAnswer === undefined || question.correctAnswer === null) {
        return `Calculation question missing correctAnswer: ${JSON.stringify(question)}`;
      }
      // Convert string numbers to actual numbers
      if (typeof question.correctAnswer === 'string') {
        question.correctAnswer = parseFloat(question.correctAnswer);
      }
      break;
      
    default:
      if (!question.type) {
        // Default to multiple-choice if no type specified
        question.type = 'multiple-choice';
        
        // Validate as multiple-choice
        if (!Array.isArray(question.options) || question.options.length < 2) {
          return `Question missing options: ${JSON.stringify(question)}`;
        }
        if (question.correctAnswer === undefined || question.correctAnswer === null) {
          return `Question missing correctAnswer: ${JSON.stringify(question)}`;
        }
      } else {
        return `Unknown question type: ${question.type}`;
      }
  }
  
  return null; // No validation errors
};

const importQuestions = async () => {
  try {
    // Connect to the database
    const db = await connectDB();
    
    // Get the file path from command line args or use default
    const filePath = process.argv[2] || path.join(__dirname, 'financial-trivia-questions.json');
    
    console.log(`Reading questions from: ${filePath}`);
    
    // Read and parse the JSON file
    const questionsData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    if (!Array.isArray(questionsData)) {
      console.error('Invalid JSON format. Expected an array of questions.');
      process.exit(1);
    }
    
    console.log(`Found ${questionsData.length} questions to import.`);
    
    // Validate all questions before importing
    const validationErrors = [];
    questionsData.forEach((question, index) => {
      const error = validateQuestion(question);
      if (error) {
        validationErrors.push(`Question #${index + 1}: ${error}`);
      }
    });
    
    if (validationErrors.length > 0) {
      console.error('Validation errors found:');
      validationErrors.forEach(error => console.error(error));
      process.exit(1);
    }
    
    console.log('All questions passed validation. Starting import...');
    
    // Group questions by type
    const questionsByType = {};
    questionsData.forEach(question => {
      const type = question.type || 'multiple-choice';
      if (!questionsByType[type]) {
        questionsByType[type] = [];
      }
      questionsByType[type].push(question);
    });
    
    // Log question type counts
    Object.entries(questionsByType).forEach(([type, questions]) => {
      console.log(`${type}: ${questions.length} questions`);
    });
    
    // Perform the bulk insert
    await TriviaQuestion.bulkInsert(questionsData);
    
    console.log('✅ Import completed successfully!');
    
    // Get counts of questions in the database
    const connection = await db;
    
    // Count by type
    const typeResults = await connection.all('SELECT type, COUNT(*) as count FROM trivia_questions GROUP BY type');
    console.log('\nDatabase counts by question type:');
    typeResults.forEach(result => {
      console.log(`${result.type || 'unspecified'}: ${result.count} questions`);
    });
    
    // Count by difficulty
    const difficultyResults = await connection.all('SELECT difficulty, COUNT(*) as count FROM trivia_questions GROUP BY difficulty');
    console.log('\nDatabase counts by difficulty:');
    difficultyResults.forEach(result => {
      console.log(`${result.difficulty || 'unspecified'}: ${result.count} questions`);
    });
    
    // Count by category
    const categoryResults = await connection.all('SELECT category, COUNT(*) as count FROM trivia_questions GROUP BY category');
    console.log('\nDatabase counts by category:');
    categoryResults.forEach(result => {
      console.log(`${result.category || 'unspecified'}: ${result.count} questions`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error during import:', error);
    process.exit(1);
  }
};

// Run the import function
importQuestions();