// FinLit/seed-trivia.js
// Script to seed financial trivia questions into the database

import fetch from 'node-fetch';
import questions from './data/financial-trivia-questions.js';

const API_BASE_URL = 'http://localhost:7900';
const BULK_INSERT_URL = `${API_BASE_URL}/admin/trivia/questions/bulk`;

// Function to clear existing questions before seeding
async function clearExistingQuestions() {
  try {
    console.log('Clearing existing trivia questions...');
    
    // Get all existing questions first
    const response = await fetch(`${API_BASE_URL}/admin/trivia/questions`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch existing questions: ${response.statusText}`);
    }
    
    const existingQuestions = await response.json();
    
    if (existingQuestions.length === 0) {
      console.log('No existing questions to clear.');
      return;
    }
    
    console.log(`Found ${existingQuestions.length} existing questions.`);
    
    // Delete each question
    let deletedCount = 0;
    for (const question of existingQuestions) {
      const deleteResponse = await fetch(`${API_BASE_URL}/admin/trivia/questions/${question.id}?permanent=true`, {
        method: 'DELETE',
      });
      
      if (deleteResponse.ok) {
        deletedCount++;
      }
    }
    
    console.log(`Successfully deleted ${deletedCount} questions.`);
  } catch (error) {
    console.error('Error clearing existing questions:', error);
    console.log('Continuing with seeding new questions...');
  }
}

async function seedQuestions() {
  try {
    console.log(`Preparing to seed ${questions.length} trivia questions...`);
    
    const response = await fetch(BULK_INSERT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ questions }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to seed questions: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log(`Success! ${result.message}`);
  } catch (error) {
    console.error('Error seeding questions:', error);
    console.error('Make sure your server is running on port 7900');
  }
}

// Add a main function to run everything in sequence
async function main() {
  try {
    // First clear existing questions
    await clearExistingQuestions();
    
    // Then seed new questions
    await seedQuestions();
    
    console.log('Seeding process completed successfully!');
  } catch (error) {
    console.error('Error in seeding process:', error);
  }
}

// Run the main function
main();