// routes/courseRoutes.js
import Course from '../models/Course.js';
import Chapter from '../models/Chapter.js';
import Lesson from '../models/Lesson.js';
import Quiz from '../models/Quiz.js';
import { connect } from '../config/sqlite-adapter.js';

export function setupCourseRoutes(app) {
  console.log('Setting up course routes...');

  // Get all courses with optional filters
  app.get('/api/courses', async (req, res) => {
    try {
      const { level, status, limit, search } = req.query;

      const filters = {};
      if (level && level !== 'All') filters.level = level;
      if (status) filters.status = status;
      if (search) filters.search = search;
      if (limit) filters.limit = parseInt(limit);

      const courses = await Course.findAll(filters);
      res.json(courses);
    } catch (error) {
      console.error('Error fetching courses:', error);
      res.status(500).json({ message: 'Error fetching courses', error: error.message });
    }
  });

  // Get a specific course by ID
  app.get('/api/courses/:courseId', async (req, res) => {
    try {
      const { courseId } = req.params;
      console.log(`Fetching course with ID: ${courseId}`);

      const course = await Course.findById(parseInt(courseId));

      if (!course) {
        console.log(`Course with ID ${courseId} not found`);
        return res.status(404).json({ message: 'Course not found' });
      }

      console.log(`Successfully found course: ${course.title}`);
      res.json(course);
    } catch (error) {
      console.error(`Error fetching course ${req.params.courseId}:`, error);
      res.status(500).json({ message: 'Error fetching course', error: error.message });
    }
  });

  // Get chapters for a specific course
  app.get('/api/courses/:courseId/chapters', async (req, res) => {
    try {
      const { courseId } = req.params;
      const chapters = await Chapter.findByCourseId(parseInt(courseId));

      if (!chapters || chapters.length === 0) {
        return res.status(404).json({ message: 'No chapters found for this course' });
      }

      // For each chapter, get its lessons
      const chaptersWithLessons = await Promise.all(
        chapters.map(async (chapter) => {
          const lessons = await Lesson.findByChapterId(chapter.id);

          // Return only lesson IDs, titles, and order for the chapter view
          const simplifiedLessons = lessons.map(lesson => ({
            id: lesson.id,
            title: lesson.title,
            order: lesson.order,
          }));

          return {
            ...chapter,
            lessons: simplifiedLessons,
          };
        }),
      );

      res.json(chaptersWithLessons);
    } catch (error) {
      console.error(`Error fetching chapters for course ${req.params.courseId}:`, error);
      res.status(500).json({ message: 'Error fetching chapters', error: error.message });
    }
  });

  // Get a specific lesson by ID
  app.get('/api/lessons/:lessonId', async (req, res) => {
    try {
      const { lessonId } = req.params;
      const lesson = await Lesson.findById(parseInt(lessonId));

      if (!lesson) {
        return res.status(404).json({ message: 'Lesson not found' });
      }

      res.json(lesson);
    } catch (error) {
      console.error(`Error fetching lesson ${req.params.lessonId}:`, error);
      res.status(500).json({ message: 'Error fetching lesson', error: error.message });
    }
  });

  // Get a specific chapter by ID
  app.get('/api/chapters/:chapterId', async (req, res) => {
    try {
      const { chapterId } = req.params;
      const chapter = await Chapter.findById(parseInt(chapterId));

      if (!chapter) {
        return res.status(404).json({ message: 'Chapter not found' });
      }

      res.json(chapter);
    } catch (error) {
      console.error(`Error fetching chapter ${req.params.chapterId}:`, error);
      res.status(500).json({ message: 'Error fetching chapter', error: error.message });
    }
  });

  // Track user's course progress
  app.post('/api/progress/lesson', async (req, res) => {
    try {
      const { userId, lessonId, status, position } = req.body;

      if (!userId || !lessonId || !status) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Check if lesson exists
      const lesson = await Lesson.findById(parseInt(lessonId));
      if (!lesson) {
        return res.status(404).json({ message: 'Lesson not found' });
      }

      const connection = await connect();

      // First, check if there's an existing progress record
      const existingProgress = await connection.get(
        'SELECT * FROM user_lesson_progress WHERE user_id = ? AND lesson_id = ?',
        [userId, lessonId],
      );

      const now = new Date().toISOString();

      if (existingProgress) {
        // Update existing record
        await connection.run(
          `UPDATE user_lesson_progress 
           SET status = ?, position = ?, 
               completed_at = CASE WHEN status = 'completed' AND ? = 'completed' THEN completed_at WHEN ? = 'completed' THEN ? ELSE NULL END
           WHERE user_id = ? AND lesson_id = ?`,
          [status, position, status, status, now, userId, lessonId],
        );
      } else {
        // Create new record
        await connection.run(
          `INSERT INTO user_lesson_progress 
           (user_id, lesson_id, status, position, started_at, completed_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            userId,
            lessonId,
            status,
            position,
            now,
            status === 'completed' ? now : null,
          ],
        );
      }

      // If lesson is completed, update course progress
      if (status === 'completed') {
        // Get chapter id for this lesson
        const chapterId = lesson.chapterId;

        // Get course id for this chapter
        const chapter = await Chapter.findById(chapterId);
        const courseId = chapter.courseId;

        // Update course progress
        await updateCourseProgress(userId, courseId);
      }

      res.json({ message: 'Progress updated successfully' });
    } catch (error) {
      console.error('Error updating lesson progress:', error);
      res.status(500).json({ message: 'Error updating progress', error: error.message });
    }
  });

  // Get user's progress for a specific course
  app.get('/api/users/:userId/courses/:courseId/progress', async (req, res) => {
    try {
      const { userId, courseId } = req.params;

      const connection = await connect();

      // Check if user is enrolled in this course
      const enrollment = await connection.get(
        'SELECT * FROM user_course_progress WHERE user_id = ? AND course_id = ?',
        [userId, courseId],
      );

      // If not enrolled, create enrollment
      if (!enrollment) {
        await connection.run(
          `INSERT INTO user_course_progress 
           (user_id, course_id, status, progress, enrolled_at)
           VALUES (?, ?, ?, ?, ?)`,
          [userId, courseId, 'enrolled', 0, new Date().toISOString()],
        );
      }

      // Get course details with chapters
      const course = await Course.findById(parseInt(courseId));
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      // Get all chapters for this course
      const chapters = await Chapter.findByCourseId(parseInt(courseId));

      // Get progress for all lessons in this course
      const progress = await Promise.all(
        chapters.map(async (chapter) => {
          const lessons = await Lesson.findByChapterId(chapter.id);

          const lessonProgress = await Promise.all(
            lessons.map(async (lesson) => {
              const progress = await connection.get(
                'SELECT * FROM user_lesson_progress WHERE user_id = ? AND lesson_id = ?',
                [userId, lesson.id],
              );

              return {
                id: lesson.id,
                title: lesson.title,
                order: lesson.order,
                progress: progress
                  ? {
                      status: progress.status,
                      position: progress.position,
                      completed: progress.status === 'completed',
                    }
                  : {
                      status: 'not-started',
                      position: 0,
                      completed: false,
                    },
              };
            }),
          );

          return {
            id: chapter.id,
            title: chapter.title,
            order: chapter.order,
            lessons: lessonProgress,
          };
        }),
      );

      // Calculate overall progress
      let completedLessons = 0;
      let totalLessons = 0;

      progress.forEach(chapter => {
        chapter.lessons.forEach(lesson => {
          totalLessons++;
          if (lesson.progress.status === 'completed') {
            completedLessons++;
          }
        });
      });

      const overallProgress = totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;

      // Find next uncompleted lesson
      let nextChapterId = null;
      let nextLessonId = null;

      // Sort chapters by order
      const sortedChapters = [...progress].sort((a, b) => a.order - b.order);

      for (const chapter of sortedChapters) {
        // Sort lessons by order
        const sortedLessons = [...chapter.lessons].sort((a, b) => a.order - b.order);

        for (const lesson of sortedLessons) {
          if (lesson.progress.status !== 'completed') {
            nextChapterId = chapter.id;
            nextLessonId = lesson.id;
            break;
          }
        }

        if (nextLessonId) break;
      }

      // Update overall progress in database
      await connection.run(
        'UPDATE user_course_progress SET progress = ? WHERE user_id = ? AND course_id = ?',
        [overallProgress, userId, courseId],
      );

      // If all lessons are completed, mark course as completed
      if (completedLessons === totalLessons && totalLessons > 0) {
        await connection.run(
          `UPDATE user_course_progress 
           SET status = 'completed', completed_at = COALESCE(completed_at, ?)
           WHERE user_id = ? AND course_id = ?`,
          [new Date().toISOString(), userId, courseId],
        );
      }

      res.json({
        courseId: parseInt(courseId),
        enrolled: true,
        progress: overallProgress,
        chapters: progress,
        nextChapterId,
        nextLessonId,
      });
    } catch (error) {
      console.error('Error fetching course progress:', error);
      res.status(500).json({ message: 'Error fetching progress', error: error.message });
    }
  });

  // Submit a quiz attempt
  app.post('/api/progress/quiz', async (req, res) => {
    try {
      const { userId, quizId, answers } = req.body;

      if (!userId || !quizId || !Array.isArray(answers)) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Get quiz details
      const quiz = await Quiz.findById(parseInt(quizId));
      if (!quiz) {
        return res.status(404).json({ message: 'Quiz not found' });
      }

      // Calculate score
      let correctAnswers = 0;

      quiz.questions.forEach((question, index) => {
        if (index < answers.length) {
          if (answers[index].toString() === question.correctAnswer.toString()) {
            correctAnswers++;
          }
        }
      });

      const score = Math.round((correctAnswers / quiz.questions.length) * 100);
      const passed = score >= quiz.passingScore;

      const connection = await connect();

      // Record the quiz attempt
      const attemptResult = await connection.run(
        `INSERT INTO user_quiz_attempts 
         (user_id, quiz_id, score, passed, answers, started_at, completed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          quizId,
          score,
          passed ? 1 : 0,
          JSON.stringify(answers),
          new Date().toISOString(),
          new Date().toISOString(),
        ],
      );

      // If passed, mark the lesson as completed
      if (passed) {
        // Get the lesson ID for this quiz
        const lessonId = quiz.lessonId;

        // Update lesson progress
        await connection.run(
          `INSERT INTO user_lesson_progress 
           (user_id, lesson_id, status, position, started_at, completed_at)
           VALUES (?, ?, 'completed', 100, ?, ?)
           ON CONFLICT (user_id, lesson_id) 
           DO UPDATE SET status = 'completed', position = 100, 
                        completed_at = COALESCE(completed_at, excluded.completed_at)`,
          [userId, lessonId, new Date().toISOString(), new Date().toISOString()],
        );

        // Also update course progress
        const lesson = await Lesson.findById(lessonId);
        const chapter = await Chapter.findById(lesson.chapterId);
        await updateCourseProgress(userId, chapter.courseId);
      }

      res.json({
        quizId: parseInt(quizId),
        score,
        correctAnswers,
        totalQuestions: quiz.questions.length,
        passed,
        attemptId: attemptResult.lastID,
      });
    } catch (error) {
      console.error('Error submitting quiz:', error);
      res.status(500).json({ message: 'Error submitting quiz', error: error.message });
    }
  });

  // Helper function to update course progress
  async function updateCourseProgress(userId, courseId) {
    try {
      const connection = await connect();

      // Get all lessons for this course
      const lessons = await connection.all(
        `SELECT l.id
         FROM lessons l
         JOIN chapters c ON l.chapter_id = c.id
         WHERE c.course_id = ?`,
        [courseId],
      );

      // Get completed lessons
      const completedLessonsResult = await connection.all(
        `SELECT COUNT(*) as count
         FROM user_lesson_progress ulp
         JOIN lessons l ON ulp.lesson_id = l.id
         JOIN chapters c ON l.chapter_id = c.id
         WHERE ulp.user_id = ? AND c.course_id = ? AND ulp.status = 'completed'`,
        [userId, courseId],
      );

      // Calculate progress percentage
      const totalLessons = lessons.length;
      const completed = completedLessonsResult[0]?.count || 0;
      const progress = totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;

      // Update course progress
      await connection.run(
        'UPDATE user_course_progress SET progress = ? WHERE user_id = ? AND course_id = ?',
        [progress, userId, courseId],
      );

      // If all lessons completed, mark course as completed
      if (progress === 100) {
        await connection.run(
          `UPDATE user_course_progress 
           SET status = 'completed', completed_at = COALESCE(completed_at, ?)
           WHERE user_id = ? AND course_id = ?`,
          [new Date().toISOString(), userId, courseId],
        );
      }

      return progress;
    } catch (error) {
      console.error('Error updating course progress:', error);
      throw error;
    }
  }
}
