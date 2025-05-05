/* eslint-disable no-undef */
// config/dbInit.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import TriviaQuestion from '../models/TriviaQuestion.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function initTriviaQuestions() {
  try {
    // Check if questions already exist
    const existingQuestions = await TriviaQuestion.getAll();

    // If we have questions already, return
    if (existingQuestions && existingQuestions.length > 0) {
      console.log(`Database already contains ${existingQuestions.length} trivia questions.`);
      return;
    }

    // No questions exist, load from JSON file
    console.log('No trivia questions found in database. Loading from JSON file...');

    const jsonFilePath = path.join(__dirname, '..', 'financial-trivia-questions.json');

    // Check if JSON file exists
    if (!fs.existsSync(jsonFilePath)) {
      console.log('Questions file not found. Skipping initialization.');
      return;
    }

    const fileContent = fs.readFileSync(jsonFilePath, 'utf8');

    // Parse the JSON to validate it first
    const questions = JSON.parse(fileContent);

    console.log(`Found ${questions.length} questions in JSON file. Importing...`);

    // Use the importFromJSON method to load questions
    await TriviaQuestion.importFromJSON(fileContent);

    console.log('Trivia questions imported successfully!');
  } catch (error) {
    console.error('Error initializing trivia questions:', error);
  }
}

// Add to dbInit.js
export async function updateTriviaQuestions(forceUpdate = false) {
  try {
    const jsonFilePath = path.join(__dirname, '..', 'financial-trivia-questions.json');

    // Check if JSON file exists
    if (!fs.existsSync(jsonFilePath)) {
      console.log('Questions file not found. Skipping update.');
      return;
    }

    // Read the JSON file with questions
    const fileContent = fs.readFileSync(jsonFilePath, 'utf8');
    const questionsData = JSON.parse(fileContent);

    // If there's a version property in the JSON, use it for version checking
    if (questionsData.version && !forceUpdate) {
      // Get the currently stored version
      const db = await connect();
      const storedVersion = await db.get("SELECT value FROM app_settings WHERE key = 'questions_version'");

      // If the version is the same, no need to update
      if (storedVersion && storedVersion.value === questionsData.version) {
        console.log(`Trivia questions already at version ${questionsData.version}`);
        return;
      }

      console.log(`Updating trivia questions from version ${storedVersion?.value || 'none'} to ${questionsData.version}`);
    }

    // Clear existing questions and import new ones
    const existingQuestions = await TriviaQuestion.getAll();
    for (const question of existingQuestions) {
      await TriviaQuestion.hardDelete(question.id);
    }

    // Extract just the questions array if there's a version property
    const questions = questionsData.questions || questionsData;

    // Import the questions
    await TriviaQuestion.importFromJSON(JSON.stringify(questions));

    // If we have a version, store it
    if (questionsData.version) {
      const db = await connect();
      await db.run(
        'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)',
        ['questions_version', questionsData.version],
      );
    }

    console.log('Trivia questions updated successfully!');
  } catch (error) {
    console.error('Error updating trivia questions:', error);
  }
}
