import { connect } from '../config/sqlite-adapter.js';

/*
  Chapter model that provides database operations for chapters
  and their related lessons. It supports creating, reading,
  updating, and deleting chapter records.
*/
const Chapter = {
  // Creates a new chapter record in the database.
  create: async (chapterData) => {
    try {
      const connection = await connect();

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
          new Date().toISOString(),
        ],
      );

      // Retrieve the newly created chapter using its generated ID.
      const chapter = await connection.get(
        'SELECT * FROM chapters WHERE id = ?',
        result.lastID,
      );

      return processChapterData(chapter);
    } catch (error) {
      console.error('Error creating chapter:', error);
      throw error;
    }
  },

  // Retrieves all chapters for a specific course, including their lessons.
  findByCourseId: async (courseId) => {
    try {
      const connection = await connect();

      // Query chapters for the given course ID, ordered by 'order'.
      const chapters = await connection.all(
        'SELECT * FROM chapters WHERE course_id = ? ORDER BY `order`',
        courseId,
      );

      // For each chapter, retrieve its associated lessons.
      const chaptersWithLessons = await Promise.all(
        chapters.map(async (chapter) => {
          const lessons = await connection.all(
            'SELECT id, title, `order` FROM lessons WHERE chapter_id = ? ORDER BY `order`',
            chapter.id,
          );

          const processedChapter = processChapterData(chapter);
          processedChapter.lessons = lessons.map((lesson) => ({
            id: lesson.id,
            title: lesson.title,
            order: lesson.order,
          }));

          return processedChapter;
        }),
      );

      return chaptersWithLessons;
    } catch (error) {
      console.error('Error finding chapters by course ID:', error);
      throw error;
    }
  },

  // Retrieves a chapter by its ID along with its associated lessons.
  findById: async (id) => {
    try {
      const connection = await connect();

      const chapter = await connection.get(
        'SELECT * FROM chapters WHERE id = ?',
        id,
      );
      if (!chapter) return null;

      // Retrieve lessons for the chapter.
      const lessons = await connection.all(
        'SELECT id, title, `order` FROM lessons WHERE chapter_id = ? ORDER BY `order`',
        id,
      );

      const processedChapter = processChapterData(chapter);
      processedChapter.lessons = lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        order: lesson.order,
      }));

      return processedChapter;
    } catch (error) {
      console.error('Error finding chapter by ID:', error);
      throw error;
    }
  },

  // Updates an existing chapter record with the provided changes.
  update: async (id, updates) => {
    try {
      const connection = await connect();

      // Verify that the chapter exists.
      const existingChapter = await connection.get(
        'SELECT * FROM chapters WHERE id = ?',
        id,
      );
      if (!existingChapter) {
        throw new Error('Chapter not found');
      }

      // Dynamically construct the SQL update clause from the updates provided.
      const setClauses = [];
      const params = [];

      for (const [key, value] of Object.entries(updates)) {
        // Convert camelCase property names to snake_case for the database.
        const dbKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        setClauses.push(`${dbKey} = ?`);
        params.push(value);
      }

      // Add updated_at timestamp.
      setClauses.push('updated_at = ?');
      params.push(new Date().toISOString());

      // Append chapter id for the WHERE clause.
      params.push(id);

      await connection.run(
        `UPDATE chapters SET ${setClauses.join(', ')} WHERE id = ?`,
        params,
      );

      // Retrieve the updated chapter record.
      const updatedChapter = await connection.get(
        'SELECT * FROM chapters WHERE id = ?',
        id,
      );
      return processChapterData(updatedChapter);
    } catch (error) {
      console.error('Error updating chapter:', error);
      throw error;
    }
  },

  // Deletes a chapter and its dependent lessons from the database.
  delete: async (id) => {
    try {
      const connection = await connect();

      // Begin a transaction to ensure atomicity of the deletion.
      await connection.run('BEGIN TRANSACTION');

      try {
        // Remove associated lessons first to satisfy foreign key constraints.
        await connection.run(
          'DELETE FROM lessons WHERE chapter_id = ?',
          id,
        );

        // Delete the chapter record.
        await connection.run(
          'DELETE FROM chapters WHERE id = ?',
          id,
        );

        // Commit the transaction if both deletions succeed.
        await connection.run('COMMIT');
        return true;
      } catch (err) {
        // Roll back the transaction if an error occurs.
        await connection.run('ROLLBACK');
        throw err;
      }
    } catch (error) {
      console.error('Error deleting chapter:', error);
      throw error;
    }
  },
};

// Converts database chapter data from snake_case to camelCase.
function processChapterData(chapter) {
  if (!chapter) return null;
  return {
    id: chapter.id,
    courseId: chapter.course_id,
    title: chapter.title,
    description: chapter.description,
    order: chapter.order,
    createdAt: chapter.created_at,
    updatedAt: chapter.updated_at,
  };
}

export default Chapter;
