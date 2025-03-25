/* eslint-disable no-undef */
// migrations/add-question-types.js
import { connect } from '../config/sqlite-adapter.js';

const migrate = async () => {
  try {
    console.log("Starting migration to add question type columns...");
    const db = await connect();
    
    // Check if columns already exist to avoid errors
    const tableInfo = await db.all('PRAGMA table_info(trivia_questions)');
    const columns = tableInfo.map(column => column.name);
    
    // Add columns if they don't exist
    const columnsToAdd = [
      { name: 'type', type: 'VARCHAR(50)', default: "'multiple-choice'" },
      { name: 'terms', type: 'TEXT', default: 'NULL' },
      { name: 'definitions', type: 'TEXT', default: 'NULL' },
      { name: 'correct_matches', type: 'TEXT', default: 'NULL' },
      { name: 'hint', type: 'TEXT', default: 'NULL' },
      { name: 'formula', type: 'TEXT', default: 'NULL' }
    ];
    
    for (const column of columnsToAdd) {
      if (!columns.includes(column.name)) {
        console.log(`Adding column: ${column.name}`);
        await db.run(`ALTER TABLE trivia_questions ADD COLUMN ${column.name} ${column.type} DEFAULT ${column.default}`);
      } else {
        console.log(`Column already exists: ${column.name}`);
      }
    }
    
    console.log("Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

migrate();