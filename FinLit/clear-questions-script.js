import fetch from 'node-fetch';

// API endpoint for getting all questions (admin endpoint)
const GET_ALL_URL = 'http://localhost:7900/admin/trivia/questions';
// API endpoint for deleting questions
const DELETE_URL = 'http://localhost:7900/admin/trivia/questions/';

async function clearExistingQuestions() {
  try {
    console.log('Fetching all existing questions...');
    const response = await fetch(GET_ALL_URL);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch questions: ${response.status}`);
    }
    
    const questions = await response.json();
    console.log(`Found ${questions.length} existing questions to delete.`);
    
    // Delete each question
    let deletedCount = 0;
    for (const question of questions) {
      console.log(`Deleting question ID ${question.id}...`);
      const deleteResponse = await fetch(`${DELETE_URL}${question.id}?permanent=true`, {
        method: 'DELETE'
      });
      
      if (deleteResponse.ok) {
        deletedCount++;
      } else {
        console.error(`Failed to delete question ${question.id}`);
      }
    }
    
    console.log(`Successfully deleted ${deletedCount} out of ${questions.length} questions.`);
  } catch (error) {
    console.error('Error clearing questions:', error);
  }
}

// Run the function
clearExistingQuestions();