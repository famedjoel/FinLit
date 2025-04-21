// routes/courseRoutes.js
import Course from '../models/Course.js';
import Chapter from '../models/Chapter.js';
import Lesson from '../models/Lesson.js';
import Quiz from '../models/Quiz.js';
import { connect } from '../config/sqlite-adapter.js';

// Define course routes for Express app
export function setupCourseRoutes(app) {
  
  // Get all courses
  app.get("/api/courses", async (req, res) => {
    try {
      const { level, search, limit } = req.query;
      
      const filters = {};
      
      if (level && level !== 'All') {
        filters.level = level;
      }
      
      if (search) {
        filters.search = search;
      }
      
      if (limit) {
        filters.limit = parseInt(limit, 10);
      }
      
      const courses = await Course.findAll(filters);
      
      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Error fetching courses", error: error.message });
    }
  });
  
  // Get a specific course
  app.get("/api/courses/:courseId", async (req, res) => {
    try {
      const course = await Course.findById(req.params.courseId);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      res.json(course);
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(500).json({ message: "Error fetching course", error: error.message });
    }
  });
  
  // Get chapters for a course
  app.get("/api/courses/:courseId/chapters", async (req, res) => {
    try {
      const chapters = await Chapter.findByCourseId(req.params.courseId);
      
      res.json(chapters);
    } catch (error) {
      console.error("Error fetching chapters:", error);
      res.status(500).json({ message: "Error fetching chapters", error: error.message });
    }
  });
  
  // Get a specific chapter
  app.get("/api/chapters/:chapterId", async (req, res) => {
    try {
      const chapter = await Chapter.findById(req.params.chapterId);
      
      if (!chapter) {
        return res.status(404).json({ message: "Chapter not found" });
      }
      
      res.json(chapter);
    } catch (error) {
      console.error("Error fetching chapter:", error);
      res.status(500).json({ message: "Error fetching chapter", error: error.message });
    }
  });
  
  // Get lessons for a chapter
  app.get("/api/chapters/:chapterId/lessons", async (req, res) => {
    try {
      const lessons = await Lesson.findByChapterId(req.params.chapterId);
      
      res.json(lessons);
    } catch (error) {
      console.error("Error fetching lessons:", error);
      res.status(500).json({ message: "Error fetching lessons", error: error.message });
    }
  });
  
  // Get a specific lesson
  app.get("/api/lessons/:lessonId", async (req, res) => {
    try {
      const lesson = await Lesson.findById(req.params.lessonId);
      
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      
      res.json(lesson);
    } catch (error) {
      console.error("Error fetching lesson:", error);
      res.status(500).json({ message: "Error fetching lesson", error: error.message });
    }
  });
  
  // Get quiz for a lesson
  app.get("/api/lessons/:lessonId/quiz", async (req, res) => {
    try {
      const quiz = await Quiz.findByLessonId(req.params.lessonId);
      
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found for this lesson" });
      }
      
      res.json(quiz);
    } catch (error) {
      console.error("Error fetching quiz:", error);
      res.status(500).json({ message: "Error fetching quiz", error: error.message });
    }
  });
  
  // Update user progress for a lesson
  app.post("/api/progress/lesson", async (req, res) => {
    try {
      const { userId, lessonId, status, position } = req.body;
      
      if (!userId || !lessonId || !status) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const connection = await connect();
      
      // Check if progress record exists
      const existingProgress = await connection.get(
        'SELECT * FROM user_lesson_progress WHERE user_id = ? AND lesson_id = ?',
        [userId, lessonId]
      );
      
      if (existingProgress) {
        // Update existing record
        await connection.run(
          `UPDATE user_lesson_progress SET 
           status = ?, 
           position = ?, 
           completed_at = ?,
           started_at = COALESCE(started_at, CURRENT_TIMESTAMP)
           WHERE user_id = ? AND lesson_id = ?`,
          [
            status, 
            position || existingProgress.position,
            status === 'completed' ? new Date().toISOString() : existingProgress.completed_at,
            userId, 
            lessonId
          ]
        );
      } else {
        // Create new record
        await connection.run(
          `INSERT INTO user_lesson_progress (
            user_id, lesson_id, status, position, started_at, completed_at
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            userId, 
            lessonId, 
            status, 
            position || 0, 
            new Date().toISOString(),
            status === 'completed' ? new Date().toISOString() : null
          ]
        );
      }
      
      // If lesson is completed, update course progress
      if (status === 'completed') {
        // First, get the lesson to find its chapter
        const lesson = await Lesson.findById(lessonId);
        
        if (lesson && lesson.chapterId) {
          // Get the chapter to find its course
          const chapter = await Chapter.findById(lesson.chapterId);
          
          if (chapter && chapter.courseId) {
            // Get all lessons for this course
            const allChapters = await Chapter.findByCourseId(chapter.courseId);
            let totalLessons = 0;
            let completedLessons = 0;
            
            // Count total and completed lessons
            for (const ch of allChapters) {
              // Get lessons for this chapter
              const chapterLessons = await Lesson.findByChapterId(ch.id);
              totalLessons += chapterLessons.length;
              
              // Check which lessons are completed
              for (const l of chapterLessons) {
                const progress = await connection.get(
                  'SELECT * FROM user_lesson_progress WHERE user_id = ? AND lesson_id = ? AND status = "completed"',
                  [userId, l.id]
                );
                
                if (progress) {
                  completedLessons++;
                }
              }
            }
            
            // Calculate progress percentage
            const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
            
            // Update or create course progress
            const existingCourseProgress = await connection.get(
              'SELECT * FROM user_course_progress WHERE user_id = ? AND course_id = ?',
              [userId, chapter.courseId]
            );
            
            if (existingCourseProgress) {
              await connection.run(
                `UPDATE user_course_progress SET 
                 progress = ?, 
                 last_accessed = ?,
                 completed_at = ?,
                 status = ?
                 WHERE user_id = ? AND course_id = ?`,
                [
                  progressPercentage,
                  new Date().toISOString(),
                  progressPercentage === 100 ? new Date().toISOString() : existingCourseProgress.completed_at,
                  progressPercentage === 100 ? 'completed' : 'in-progress',
                  userId,
                  chapter.courseId
                ]
              );
            } else {
              await connection.run(
                `INSERT INTO user_course_progress (
                  user_id, course_id, status, progress, enrolled_at, last_accessed, completed_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                  userId,
                  chapter.courseId,
                  progressPercentage === 100 ? 'completed' : 'in-progress',
                  progressPercentage,
                  new Date().toISOString(),
                  new Date().toISOString(),
                  progressPercentage === 100 ? new Date().toISOString() : null
                ]
              );
            }
            
            // Add to user's recent activity
            const user = await connection.get('SELECT * FROM users WHERE id = ?', userId);
            
            if (user) {
              let recentActivity = [];
              try {
                recentActivity = JSON.parse(user.recentActivity || '[]');
              } catch (err) {
                console.error('Error parsing recent activity:', err);
              }
              
              // Add this activity
              const course = await Course.findById(chapter.courseId);
              
              recentActivity.unshift({
                type: 'course',
                title: `${lesson.title} in ${course ? course.title : 'a course'}`,
                action: status,
                timestamp: new Date().toISOString()
              });
              
              // Keep only the 10 most recent activities
              if (recentActivity.length > 10) {
                recentActivity = recentActivity.slice(0, 10);
              }
              
              // Update user
              await connection.run(
                'UPDATE users SET recentActivity = ? WHERE id = ?',
                [JSON.stringify(recentActivity), userId]
              );
            }
          }
        }
      }
      
      res.json({ message: "Progress updated successfully", status });
    } catch (error) {
      console.error("Error updating lesson progress:", error);
      res.status(500).json({ message: "Error updating progress", error: error.message });
    }
  });
  
  // Submit quiz attempt
  app.post("/api/progress/quiz", async (req, res) => {
    try {
      const { userId, quizId, answers } = req.body;
      
      if (!userId || !quizId || !answers) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const connection = await connect();
      
      // Get the quiz
      const quiz = await Quiz.findById(quizId);
      
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      // Calculate score
      let correctCount = 0;
      
      for (let i = 0; i < quiz.questions.length; i++) {
        const question = quiz.questions[i];
        if (answers[i] !== undefined && answers[i].toString() === question.correctAnswer.toString()) {
          correctCount++;
        }
      }
      
      const scorePercentage = Math.round((correctCount / quiz.questions.length) * 100);
      const passed = scorePercentage >= quiz.passingScore;
      
      // Get the next attempt number
      const lastAttempt = await connection.get(
        'SELECT MAX(attempt_number) as lastAttempt FROM user_quiz_attempts WHERE user_id = ? AND quiz_id = ?',
        [userId, quizId]
      );
      
      const attemptNumber = (lastAttempt && lastAttempt.lastAttempt) ? lastAttempt.lastAttempt + 1 : 1;
      
      // Record the attempt
      await connection.run(
        `INSERT INTO user_quiz_attempts (
          user_id, quiz_id, attempt_number, score, passed, answers, started_at, completed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          quizId,
          attemptNumber,
          scorePercentage,
          passed ? 1 : 0,
          JSON.stringify(answers),
          new Date().toISOString(),
          new Date().toISOString()
        ]
      );
      
      // If passed, mark the lesson as completed
      if (passed && quiz.lessonId) {
        await connection.run(
          `INSERT OR REPLACE INTO user_lesson_progress (
            user_id, lesson_id, status, position, started_at, completed_at
          ) VALUES (?, ?, 'completed', ?, COALESCE((SELECT started_at FROM user_lesson_progress WHERE user_id = ? AND lesson_id = ?), ?), ?)`,
          [
            userId,
            quiz.lessonId,
            100, // Set position to 100 (end of lesson)
            userId,
            quiz.lessonId,
            new Date().toISOString(),
            new Date().toISOString()
          ]
        );
      }
      
      res.json({
        message: "Quiz attempt recorded",
        score: scorePercentage,
        passed,
        attemptNumber
      });
    } catch (error) {
      console.error("Error submitting quiz attempt:", error);
      res.status(500).json({ message: "Error submitting quiz", error: error.message });
    }
  });
  
  // Get user progress for a course
  app.get("/api/users/:userId/courses/:courseId/progress", async (req, res) => {
    try {
      const { userId, courseId } = req.params;
      
      const connection = await connect();
      
      // Get course progress
      const courseProgress = await connection.get(
        'SELECT * FROM user_course_progress WHERE user_id = ? AND course_id = ?',
        [userId, courseId]
      );
      
      if (!courseProgress) {
        return res.json({
          enrolled: false,
          progress: 0,
          status: 'not-started',
          lessonProgress: []
        });
      }
      
      // Get chapters for this course
      const chapters = await Chapter.findByCourseId(courseId);
      
      // Get progress for each lesson
      const chaptersWithProgress = await Promise.all(
        chapters.map(async (chapter) => {
          const lessons = await Lesson.findByChapterId(chapter.id);
          
          const lessonsWithProgress = await Promise.all(
            lessons.map(async (lesson) => {
              // Get progress for this lesson
              const progress = await connection.get(
                'SELECT * FROM user_lesson_progress WHERE user_id = ? AND lesson_id = ?',
                [userId, lesson.id]
              );
              
              // Get quiz attempts if applicable
              const quiz = await Quiz.findByLessonId(lesson.id);
              let quizAttempts = [];
              
              if (quiz) {
                quizAttempts = await connection.all(
                  'SELECT * FROM user_quiz_attempts WHERE user_id = ? AND quiz_id = ? ORDER BY attempt_number DESC',
                  [userId, quiz.id]
                );
              }
              
              return {
                ...lesson,
                progress: progress ? {
                  status: progress.status,
                  position: progress.position,
                  startedAt: progress.started_at,
                  completedAt: progress.completed_at
                } : {
                  status: 'not-started',
                  position: 0,
                  startedAt: null,
                  completedAt: null
                },
                hasQuiz: !!quiz,
                quizAttempts: quizAttempts.map(attempt => ({
                  attemptNumber: attempt.attempt_number,
                  score: attempt.score,
                  passed: !!attempt.passed,
                  completedAt: attempt.completed_at
                }))
              };
            })
          );
          
          return {
            ...chapter,
            lessons: lessonsWithProgress
          };
        })
      );
      
      // Find the next lesson to continue (first incomplete lesson)
      let nextLessonId = null;
      let nextChapterId = null;
      
      outerLoop: for (const chapter of chaptersWithProgress) {
        for (const lesson of chapter.lessons) {
          if (lesson.progress.status !== 'completed') {
            nextLessonId = lesson.id;
            nextChapterId = chapter.id;
            break outerLoop;
          }
        }
      }
      
      res.json({
        enrolled: true,
        progress: courseProgress.progress,
        status: courseProgress.status,
        enrolledAt: courseProgress.enrolled_at,
        lastAccessed: courseProgress.last_accessed,
        completedAt: courseProgress.completed_at,
        nextLessonId,
        nextChapterId,
        chapters: chaptersWithProgress
      });
    } catch (error) {
      console.error("Error fetching course progress:", error);
      res.status(500).json({ message: "Error fetching progress", error: error.message });
    }
  });
  
  // ADMIN ROUTES - These would normally require authentication and authorization
  
  // Create a new course
  app.post("/api/admin/courses", async (req, res) => {
    try {
      const course = await Course.create(req.body);
      res.status(201).json(course);
    } catch (error) {
      console.error("Error creating course:", error);
      res.status(500).json({ message: "Error creating course", error: error.message });
    }
  });
  
  // Update a course
  app.put("/api/admin/courses/:courseId", async (req, res) => {
    try {
      const course = await Course.update(req.params.courseId, req.body);
      res.json(course);
    } catch (error) {
      console.error("Error updating course:", error);
      res.status(500).json({ message: "Error updating course", error: error.message });
    }
  });
  
  // Create a new chapter
  app.post("/api/admin/courses/:courseId/chapters", async (req, res) => {
    try {
      const chapterData = {
        ...req.body,
        courseId: req.params.courseId
      };
      
      const chapter = await Chapter.create(chapterData);
      res.status(201).json(chapter);
    } catch (error) {
      console.error("Error creating chapter:", error);
      res.status(500).json({ message: "Error creating chapter", error: error.message });
    }
  });
  
  // Create a new lesson
  app.post("/api/admin/chapters/:chapterId/lessons", async (req, res) => {
    try {
      const lessonData = {
        ...req.body,
        chapterId: req.params.chapterId
      };
      
      const lesson = await Lesson.create(lessonData);
      res.status(201).json(lesson);
    } catch (error) {
      console.error("Error creating lesson:", error);
      res.status(500).json({ message: "Error creating lesson", error: error.message });
    }
  });
  
  // Create a quiz for a lesson
  app.post("/api/admin/lessons/:lessonId/quiz", async (req, res) => {
    try {
      const quizData = {
        ...req.body,
        lessonId: req.params.lessonId
      };
      
      const quiz = await Quiz.create(quizData);
      res.status(201).json(quiz);
    } catch (error) {
      console.error("Error creating quiz:", error);
      res.status(500).json({ message: "Error creating quiz", error: error.message });
    }
  });
}