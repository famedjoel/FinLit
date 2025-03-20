#!/usr/bin/env node
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

/**
 * This script seeds the database with sample financial trivia questions
 * Run it with: node seed-trivia.js
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import TriviaQuestion from './models/TriviaQuestion.js';
import connectDB from './config/db.js';
import { connect } from './config/sqlite-adapter.js';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Add this function to your seed-trivia.js file
async function clearExistingQuestions() {
  try {
    const db = await connect();
    console.log("Deleting all existing questions...");
    await db.run('DELETE FROM trivia_questions');
    console.log("All existing questions deleted successfully");
    return true;
  } catch (error) {
    console.error("Error deleting questions:", error);
    return false;
  }
}

async function seedDatabase() {
  try {
    // Connect to the database
    await connectDB();
    console.log("Connected to database");

    // Clear existing questions
    await clearExistingQuestions();
    
    // Check if we already have questions
    const db = await connect();
    const countResult = await db.get('SELECT COUNT(*) as count FROM trivia_questions');
    
    if (countResult.count > 0) {
      console.log(`Database already has ${countResult.count} questions`);
      const shouldContinue = process.argv.includes('--force');
      
      if (!shouldContinue) {
        console.log("Use --force flag to add more questions anyway");
        process.exit(0);
      }
      console.log("Proceeding with seeding due to --force flag");
    }
    
    // Load question data from a module
    const questionsModule = await import('./data/financial-trivia-questions.js');
    const sampleQuestions = questionsModule.default || [];
    
    if (sampleQuestions.length === 0) {
      console.error("No questions found in the data file");
      process.exit(1);
    }
    
    console.log(`Found ${sampleQuestions.length} questions to seed`);
    
    // Use bulk insert for better performance
    await TriviaQuestion.bulkInsert(sampleQuestions);
    
    console.log(`Successfully seeded ${sampleQuestions.length} financial trivia questions!`);
    
    // Verify seeding was successful
    const categories = await TriviaQuestion.getCategories();
    console.log("Available categories now:", categories);
    
    // Get count by difficulty
    const easyCount = (await TriviaQuestion.getByDifficulty('easy')).length;
    const mediumCount = (await TriviaQuestion.getByDifficulty('medium')).length;
    const hardCount = (await TriviaQuestion.getByDifficulty('hard')).length;
    
    console.log(`Question counts by difficulty: Easy=${easyCount}, Medium=${mediumCount}, Hard=${hardCount}`);
    
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    process.exit(0);
  }
}

// Run the seeding function
seedDatabase();