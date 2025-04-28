// migrations.js
import { connect } from './config/sqlite-adapter.js';

/**
 * Add the quiz_settings column to the challenges table
 */
async function addQuizSettingsColumn() {
  try {
    const connection = await connect();
    
    console.log('Checking if quiz_settings column exists in challenges table...');
    const tableInfo = await connection.all('PRAGMA table_info(challenges)');
    const columnExists = tableInfo.some(column => column.name === 'quiz_settings');
    
    if (!columnExists) {
      console.log('Adding quiz_settings column to challenges table...');
      await connection.run('ALTER TABLE challenges ADD COLUMN quiz_settings TEXT');
      console.log('Successfully added quiz_settings column to challenges table!');
    } else {
      console.log('quiz_settings column already exists in challenges table.');
    }
    
    return { success: true, message: 'Migration completed successfully' };
  } catch (error) {
    console.error('Error performing migration:', error);
    return { success: false, error: error.message };
  }
}

// Export the migration function
export { addQuizSettingsColumn };