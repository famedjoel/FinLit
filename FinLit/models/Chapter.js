// models/Chapter.js
import { connect } from '../config/sqlite-adapter.js';

// Chapter model
const Chapter = {
  // Create a new chapter
  create: async (chapterData) => {
    try {
      const connection = await connect();
      
      // Insert the chapter
      const result = await connection.run(
        `INSERT INTO chapters (
          course_id, title, description, order, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          chapterData.courseId,
          chapterData.title,
          chapterData.description || '',
          chapterData.order || 0,
          new Date().toISOString(),
          new Date().toISOString()
        ]
      );
      
      // Get the inserted chapter
      const chapter = await connection.get(
        'SELECT * FROM chapters WHERE id = ?',
        result.lastID
      );
      
      return processChapterData(chapter);
    } catch (error) {
      console.error('Error creating chapter:', error);
      throw error;
    }
  },
  
  // Find all chapters for a course
  findByCourseId: async (courseId) => {
    try {
      const connection = await connect();
      
      const chapters = await connection.all(
        'SELECT * FROM chapters WHERE course_id = ? ORDER BY `order`',
        courseId
      );
      
      // For each chapter, get its lessons
      const chaptersWithLessons = await Promise.all(
        chapters.map(async (chapter) => {
          const lessons = await connection.all(
            'SELECT id, title, `order` FROM lessons WHERE chapter_id = ? ORDER BY `order`',
            chapter.id
          );
          
          const processedChapter = processChapterData(chapter);
          processedChapter.lessons = lessons.map(lesson => ({
            id: lesson.id,
            title: lesson.title,
            order: lesson.order
          }));
          
          return processedChapter;
        })
      );
      
      return chaptersWithLessons;
    } catch (error) {
      console.error('Error finding chapters by course ID:', error);
      throw error;
    }
  },
  
  // Find a chapter by ID
  findById: async (id) => {
    try {
      const connection = await connect();
      
      const chapter = await connection.get(
        'SELECT * FROM chapters WHERE id = ?',
        id
      );
      
      if (!chapter) return null;
      
      // Get lessons for this chapter
      const lessons = await connection.all(
        'SELECT id, title, `order` FROM lessons WHERE chapter_id = ? ORDER BY `order`',
        id
      );
      
      const processedChapter = processChapterData(chapter);
      
      // Add lessons to chapter
      processedChapter.lessons = lessons.map(lesson => ({
        id: lesson.id,
        title: lesson.title,
        order: lesson.order
      }));
      
      return processedChapter;
    } catch (error) {
      console.error('Error finding chapter by ID:', error);
      throw error;
    }
  },
  
  // Update a chapter
  update: async (id, updates) => {
    try {
      const connection = await connect();
      
      // Check if chapter exists
      const existingChapter = await connection.get(
        'SELECT * FROM chapters WHERE id = ?',
        id
      );
      
      if (!existingChapter) {
        throw new Error('Chapter not found');
      }
      
      // Build update query
      const setClauses = [];
      const params = [];
      
      for (const [key, value] of Object.entries(updates)) {
        // Convert camelCase to snake_case for DB
        const dbKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        setClauses.push(`${dbKey} = ?`);
        params.push(value);
      }
      
      // Add updated_at
      setClauses.push('updated_at = ?');
      params.push(new Date().toISOString());
      
      // Add id to params
      params.push(id);
      
      // Execute update
      await connection.run(
        `UPDATE chapters SET ${setClauses.join(', ')} WHERE id = ?`,
        params
      );
      
      // Get updated chapter
      const updatedChapter = await connection.get(
        'SELECT * FROM chapters WHERE id = ?',
        id
      );
      
      return processChapterData(updatedChapter);
    } catch (error) {
      console.error('Error updating chapter:', error);
      throw error;
    }
  },
  
  // Delete a chapter (and its lessons)
  delete: async (id) => {
    try {
      const connection = await connect();
      
      // Start a transaction
      await connection.run('BEGIN TRANSACTION');
      
      try {
        // Delete lessons first (foreign key constraint)
        await connection.run(
          'DELETE FROM lessons WHERE chapter_id = ?',
          id
        );
        
        // Then delete the chapter
        await connection.run(
          'DELETE FROM chapters WHERE id = ?',
          id
        );
        
        // Commit the transaction
        await connection.run('COMMIT');
        
        return true;
      } catch (err) {
        // Rollback the transaction on error
        await connection.run('ROLLBACK');
        throw err;
      }
    } catch (error) {
      console.error('Error deleting chapter:', error);
      throw error;
    }
  }
};

// Process chapter data from DB format
function processChapterData(chapter) {
  if (!chapter) return null;
  
  // Convert snake_case to camelCase
  return {
    id: chapter.id,
    courseId: chapter.course_id,
    title: chapter.title,
    description: chapter.description,
    order: chapter.order,
    createdAt: chapter.created_at,
    updatedAt: chapter.updated_at
  };
}

export default Chapter;