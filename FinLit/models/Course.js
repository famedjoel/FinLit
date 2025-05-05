// models/Course.js
import { connect } from '../config/sqlite-adapter.js';
import Chapter from './Chapter.js'; // Import the Chapter model

// Course model
const Course = {
  // Create a new course
  create: async (courseData) => {
    try {
      const connection = await connect();

      // Insert the course
      const result = await connection.run(
        `INSERT INTO courses (
          title, description, level, image_url, chapters_count, 
          lessons_count, estimated_hours, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          courseData.title,
          courseData.description,
          courseData.level || 'Beginner',
          courseData.imageUrl || '',
          courseData.chaptersCount || 0,
          courseData.lessonsCount || 0,
          courseData.estimatedHours || 0,
          courseData.status || 'draft',
          new Date().toISOString(),
          new Date().toISOString(),
        ],
      );

      // Get the inserted course
      const course = await connection.get(
        'SELECT * FROM courses WHERE id = ?',
        result.lastID,
      );

      return processCoursesData(course);
    } catch (error) {
      console.error('Error creating course:', error);
      throw error;
    }
  },

  // Find all courses with optional filters
  findAll: async (filters = {}) => {
    try {
      const connection = await connect();

      // Build WHERE clause
      const whereClauses = [];
      const params = [];

      if (filters.level && filters.level !== 'All') {
        whereClauses.push('level = ?');
        params.push(filters.level);
      }

      if (filters.status) {
        whereClauses.push('status = ?');
        params.push(filters.status);
      } else {
        // By default, only show published courses
        whereClauses.push('status = ?');
        params.push('published');
      }

      if (filters.search) {
        whereClauses.push('(title LIKE ? OR description LIKE ?)');
        params.push(`%${filters.search}%`);
        params.push(`%${filters.search}%`);
      }

      const whereClause = whereClauses.length > 0
        ? `WHERE ${whereClauses.join(' AND ')}`
        : '';

      // Add limit if provided
      const limitClause = filters.limit ? `LIMIT ${filters.limit}` : '';

      const courses = await connection.all(
        `SELECT * FROM courses ${whereClause} ORDER BY created_at DESC ${limitClause}`,
        params,
      );

      return courses.map(course => processCoursesData(course));
    } catch (error) {
      console.error('Error finding courses:', error);
      throw error;
    }
  },

  // Find a course by ID
  findById: async (id) => {
    try {
      const connection = await connect();

      const course = await connection.get(
        'SELECT * FROM courses WHERE id = ?',
        id,
      );

      if (!course) return null;

      // Get chapters for this course
      const chapters = await Chapter.findByCourseId(id); // uses the existing method you already built

      const processedCourse = processCoursesData(course);

      // This now includes lessons inside each chapter
      processedCourse.chapters = chapters;


      return processedCourse;
    } catch (error) {
      console.error('Error finding course by ID:', error);
      throw error;
    }
  },

  // Update a course
  update: async (id, updates) => {
    try {
      const connection = await connect();

      // Check if course exists
      const existingCourse = await connection.get(
        'SELECT * FROM courses WHERE id = ?',
        id,
      );

      if (!existingCourse) {
        throw new Error('Course not found');
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
        `UPDATE courses SET ${setClauses.join(', ')} WHERE id = ?`,
        params,
      );

      // Get updated course
      const updatedCourse = await connection.get(
        'SELECT * FROM courses WHERE id = ?',
        id,
      );

      return processCoursesData(updatedCourse);
    } catch (error) {
      console.error('Error updating course:', error);
      throw error;
    }
  },

  // Delete a course (set inactive)
  delete: async (id) => {
    try {
      const connection = await connect();

      await connection.run(
        'UPDATE courses SET status = ? WHERE id = ?',
        ['archived', id],
      );

      return true;
    } catch (error) {
      console.error('Error deleting course:', error);
      throw error;
    }
  },
};

// Process course data from DB format
function processCoursesData(course) {
  if (!course) return null;

  // Convert snake_case to camelCase
  return {
    id: course.id,
    title: course.title,
    description: course.description,
    level: course.level,
    imageUrl: course.image_url,
    chaptersCount: course.chapters_count,
    lessonsCount: course.lessons_count,
    estimatedHours: course.estimated_hours,
    status: course.status,
    createdAt: course.created_at,
    updatedAt: course.updated_at,
  };
}

export default Course;
