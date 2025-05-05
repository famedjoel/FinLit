import Course from '../models/Course.js';
import Chapter from '../models/Chapter.js';
import Lesson from '../models/Lesson.js';
import Quiz from '../models/Quiz.js';
import { connect } from '../config/sqlite-adapter.js';

export function setupCourseRoutes(app) {
  // ROUTE: Retrieve all courses with optional query filters
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

  // ROUTE: Retrieve a course by its ID
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

  // ROUTE: Retrieve chapters for a given course along with their lessons
  app.get('/api/courses/:courseId/chapters', async (req, res) => {
    try {
      const { courseId } = req.params;
      const chapters = await Chapter.findByCourseId(parseInt(courseId));

      if (!chapters || chapters.length === 0) {
        return res.status(404).json({ message: 'No chapters found for this course' });
      }

      const chaptersWithLessons = await Promise.all(
        chapters.map(async (chapter) => {
          const lessons = await Lesson.findByChapterId(chapter.id);
          // Provide only essential lesson data
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

  // ROUTE: Retrieve a lesson by its ID
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

  // ROUTE: Retrieve a chapter by its ID
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

  // ROUTE: Record or update a user's lesson progress
  app.post('/api/progress/lesson', async (req, res) => {
    try {
      const { userId, lessonId, status, position } = req.body;
      if (!userId || !lessonId || !status) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Confirm that the lesson exists
      const lesson = await Lesson.findById(parseInt(lessonId));
      if (!lesson) {
        return res.status(404).json({ message: 'Lesson not found' });
      }

      const connection = await connect();
      const existingProgress = await connection.get(
        'SELECT * FROM user_lesson_progress WHERE user_id = ? AND lesson_id = ?',
        [userId, lessonId],
      );

      const now = new Date().toISOString();
      if (existingProgress) {
        await connection.run(
          `UPDATE user_lesson_progress 
           SET status = ?, position = ?, 
               completed_at = CASE WHEN status = 'completed' AND ? = 'completed' THEN completed_at WHEN ? = 'completed' THEN ? ELSE NULL END
           WHERE user_id = ? AND lesson_id = ?`,
          [status, position, status, status, now, userId, lessonId],
        );
      } else {
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

      // Update course progress if the lesson is completed
      if (status === 'completed') {
        const chapterId = lesson.chapterId;
        const chapter = await Chapter.findById(chapterId);
        const courseId = chapter.courseId;
        await updateCourseProgress(userId, courseId);
      }
      res.json({ message: 'Progress updated successfully' });
    } catch (error) {
      console.error('Error updating lesson progress:', error);
      res.status(500).json({ message: 'Error updating progress', error: error.message });
    }
  });

  // ROUTE: Retrieve a user's progress for a specific course
  app.get('/api/users/:userId/courses/:courseId/progress', async (req, res) => {
    try {
      const { userId, courseId } = req.params;
      const connection = await connect();

      // Confirm if the user is enrolled; enrol if missing
      const enrolment = await connection.get(
        'SELECT * FROM user_course_progress WHERE user_id = ? AND course_id = ?',
        [userId, courseId],
      );
      if (!enrolment) {
        await connection.run(
          `INSERT INTO user_course_progress 
           (user_id, course_id, status, progress, enrolled_at)
           VALUES (?, ?, ?, ?, ?)`,
          [userId, courseId, 'enrolled', 0, new Date().toISOString()],
        );
      }

      const course = await Course.findById(parseInt(courseId));
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      // Retrieve chapters and corresponding lesson progress
      const chapters = await Chapter.findByCourseId(parseInt(courseId));
      const progress = await Promise.all(
        chapters.map(async (chapter) => {
          const lessons = await Lesson.findByChapterId(chapter.id);
          const lessonProgress = await Promise.all(
            lessons.map(async (lesson) => {
              const prog = await connection.get(
                'SELECT * FROM user_lesson_progress WHERE user_id = ? AND lesson_id = ?',
                [userId, lesson.id],
              );
              return {
                id: lesson.id,
                title: lesson.title,
                order: lesson.order,
                progress: prog
                  ? {
                      status: prog.status,
                      position: prog.position,
                      completed: prog.status === 'completed',
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

      // Calculate overall progress percentage
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
      const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      // Identify the next uncompleted lesson
      let nextChapterId = null;
      let nextLessonId = null;
      const sortedChapters = [...progress].sort((a, b) => a.order - b.order);
      for (const chapter of sortedChapters) {
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

      // Update the user's overall course progress
      await connection.run(
        'UPDATE user_course_progress SET progress = ? WHERE user_id = ? AND course_id = ?',
        [overallProgress, userId, courseId],
      );
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

  // ROUTE: Submit a quiz attempt and record results
  app.post('/api/progress/quiz', async (req, res) => {
    try {
      const { userId, quizId, answers } = req.body;
      if (!userId || !quizId || !Array.isArray(answers)) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      const quiz = await Quiz.findById(parseInt(quizId));
      if (!quiz) {
        return res.status(404).json({ message: 'Quiz not found' });
      }

      // Determine the quiz score based on correct answers
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

      // If the user has passed, mark the associated lesson as completed
      if (passed) {
        const lessonId = quiz.lessonId;
        await connection.run(
          `INSERT INTO user_lesson_progress 
           (user_id, lesson_id, status, position, started_at, completed_at)
           VALUES (?, ?, 'completed', 100, ?, ?)
           ON CONFLICT (user_id, lesson_id) 
           DO UPDATE SET status = 'completed', position = 100, 
                        completed_at = COALESCE(completed_at, excluded.completed_at)`,
          [userId, lessonId, new Date().toISOString(), new Date().toISOString()],
        );

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

  // HELPER: Update the overall course progress for a user
  async function updateCourseProgress(userId, courseId) {
    try {
      const connection = await connect();
      const lessons = await connection.all(
        `SELECT l.id
         FROM lessons l
         JOIN chapters c ON l.chapter_id = c.id
         WHERE c.course_id = ?`,
        [courseId],
      );
      const completedLessonsResult = await connection.all(
        `SELECT COUNT(*) as count
         FROM user_lesson_progress ulp
         JOIN lessons l ON ulp.lesson_id = l.id
         JOIN chapters c ON l.chapter_id = c.id
         WHERE ulp.user_id = ? AND c.course_id = ? AND ulp.status = 'completed'`,
        [userId, courseId],
      );
      const totalLessons = lessons.length;
      const completed = completedLessonsResult[0]?.count || 0;
      const progress = totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;

      await connection.run(
        'UPDATE user_course_progress SET progress = ? WHERE user_id = ? AND course_id = ?',
        [progress, userId, courseId],
      );
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
