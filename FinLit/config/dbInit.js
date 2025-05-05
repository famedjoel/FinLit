/* eslint-disable no-undef */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import TriviaQuestion from '../models/TriviaQuestion.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialise trivia questions in the database
export async function initTriviaQuestions() {
  try {
    const existingQuestions = await TriviaQuestion.getAll();

    // Exit if questions already exist in the database
    if (existingQuestions && existingQuestions.length > 0) {
      console.log(`Database already contains ${existingQuestions.length} trivia questions.`);
      return;
    }

    console.log('No trivia questions found in database. Loading from JSON file...');

    const jsonFilePath = path.join(__dirname, '..', 'financial-trivia-questions.json');

    // Check if the JSON file exists
    if (!fs.existsSync(jsonFilePath)) {
      console.log('Questions file not found. Skipping initialisation.');
      return;
    }

    const fileContent = fs.readFileSync(jsonFilePath, 'utf8');
    const questions = JSON.parse(fileContent);

    console.log(`Found ${questions.length} questions in JSON file. Importing...`);

    // Import questions into the database
    await TriviaQuestion.importFromJSON(fileContent);

    console.log('Trivia questions imported successfully!');
  } catch (error) {
    console.error('Error initialising trivia questions:', error);
  }
}

// Update trivia questions in the database, optionally forcing an update
export async function updateTriviaQuestions(forceUpdate = false) {
  try {
    const jsonFilePath = path.join(__dirname, '..', 'financial-trivia-questions.json');

    // Check if the JSON file exists
    if (!fs.existsSync(jsonFilePath)) {
      console.log('Questions file not found. Skipping update.');
      return;
    }

    const fileContent = fs.readFileSync(jsonFilePath, 'utf8');
    const questionsData = JSON.parse(fileContent);

    // Perform version checking if a version property exists in the JSON
    if (questionsData.version && !forceUpdate) {
      const db = await connect();
      const storedVersion = await db.get("SELECT value FROM app_settings WHERE key = 'questions_version'");

      // Skip update if the version matches the stored version
      if (storedVersion && storedVersion.value === questionsData.version) {
        console.log(`Trivia questions already at version ${questionsData.version}`);
        return;
      }

      console.log(`Updating trivia questions from version ${storedVersion?.value || 'none'} to ${questionsData.version}`);
    }

    // Remove existing questions from the database
    const existingQuestions = await TriviaQuestion.getAll();
    for (const question of existingQuestions) {
      await TriviaQuestion.hardDelete(question.id);
    }

    // Extract questions array if a version property exists
    const questions = questionsData.questions || questionsData;

    // Import the new set of questions
    await TriviaQuestion.importFromJSON(JSON.stringify(questions));

    // Store the new version in the database if available
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
