/* eslint-disable no-unused-vars */
// syncUsingModel.js
import TriviaQuestion from './models/TriviaQuestion.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function syncQuestions() {
  try {
    // Get all existing questions
    const existingQuestions = await TriviaQuestion.getAll();
    
    // Delete all existing questions
    console.log(`Deleting ${existingQuestions.length} existing questions...`);
    for (const question of existingQuestions) {
      await TriviaQuestion.hardDelete(question.id);
    }
    
    // Read new questions from JSON file
    const jsonFilePath = path.resolve('./financial-trivia-questions.json');
    const fileContent = fs.readFileSync(jsonFilePath, 'utf8');
    
    // Use the importFromJSON method
    console.log('Importing new questions...');
    await TriviaQuestion.importFromJSON(fileContent);
    
    console.log('Questions synced successfully!');
  } catch (error) {
    console.error('Error syncing questions:', error);
  }
}

syncQuestions();