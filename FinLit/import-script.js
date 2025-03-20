import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name using ES modules approach
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the questions JSON file
const questionsFilePath = path.join(__dirname, 'financial-trivia-questions.json');

// API endpoint for bulk inserting questions
const API_URL = 'http://localhost:7900/admin/trivia/questions/bulk';

async function importQuestions() {
  try {
    console.log('Reading questions file...');
    const questionsData = await fs.readFile(questionsFilePath, 'utf8');
    const questions = JSON.parse(questionsData);
    
    console.log(`Found ${questions.length} questions to import.`);
    
    // Make the API request to bulk insert questions
    console.log('Sending questions to the API...');
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ questions }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Import successful!', result);
    console.log(`Imported ${questions.length} financial trivia questions.`);
  } catch (error) {
    console.error('Error importing questions:', error);
  }
}

// Run the import function
importQuestions();