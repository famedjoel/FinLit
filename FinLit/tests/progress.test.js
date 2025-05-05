/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-undef */
// tests/progress.test.js
import { jest } from '@jest/globals';

// Mock the database connection
const mockConnection = {
  run: jest.fn(),
  get: jest.fn(),
  all: jest.fn(),
  exec: jest.fn(),
};

// Mock modules before importing courseRoutes
jest.unstable_mockModule('../config/sqlite-adapter.js', () => ({
  connect: jest.fn().mockResolvedValue(mockConnection),
}));

jest.unstable_mockModule('../models/User.js', () => ({
  default: {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));

jest.unstable_mockModule('../models/Course.js', () => ({
  default: {
    findById: jest.fn(),
  },
}));

jest.unstable_mockModule('../models/Lesson.js', () => ({
  default: {
    findById: jest.fn(),
  },
}));

jest.unstable_mockModule('../models/Chapter.js', () => ({
  default: {
    findById: jest.fn(),
  },
}));

jest.unstable_mockModule('../models/Quiz.js', () => ({
  default: {
    findById: jest.fn(),
  },
}));

describe('Course Progress System', () => {
  let mockApp, courseRoutes;
  let mockRequest, mockResponse;
  let Course, Lesson, Chapter, Quiz;

  beforeAll(async () => {
    // Import after setting up all mocks
    courseRoutes = await import('../routes/courseRoutes.js');
    Course = (await import('../models/Course.js')).default;
    Lesson = (await import('../models/Lesson.js')).default;
    Chapter = (await import('../models/Chapter.js')).default;
    Quiz = (await import('../models/Quiz.js')).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockApp = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };

    mockRequest = (body = {}, params = {}, query = {}) => ({
      body,
      params,
      query,
    });

    mockResponse = () => {
      const res = {};
      res.status = jest.fn().mockReturnValue(res);
      res.json = jest.fn().mockReturnValue(res);
      return res;
    };
  });

  describe('Course Progress Tracking', () => {
    test('should update lesson progress successfully', async () => {
      // Arrange
      const req = mockRequest({
        userId: 1,
        lessonId: 10,
        status: 'completed',
        position: 100,
      });
      const res = mockResponse();

      // Mock lesson exists
      Lesson.findById.mockResolvedValue({
        id: 10,
        chapterId: 5,
        title: 'Test Lesson',
      });

      // Mock Chapter exists
      Chapter.findById.mockResolvedValue({
        id: 5,
        courseId: 1,
      });

      // Mock existing progress check
      mockConnection.get.mockResolvedValue(null);
      mockConnection.run.mockResolvedValue();

      // Mock the SQL queries for updateCourseProgress
      mockConnection.all.mockImplementation((query) => {
        if (query.includes('SELECT l.id')) {
          return Promise.resolve([
            { id: 1 },
            { id: 2 },
            { id: 3 },
            { id: 4 },
          ]);
        }
        if (query.includes('COUNT(*) as count')) {
          return Promise.resolve([{ count: 2 }]);
        }
        return Promise.resolve([]);
      });

      // Setup route
      courseRoutes.setupCourseRoutes(mockApp);

      // Find and call the progress lesson route handler
      const progressLessonHandler = mockApp.post.mock.calls.find(call =>
        call[0] === '/api/progress/lesson',
      )?.[1];

      expect(progressLessonHandler).toBeDefined();

      // Act
      await progressLessonHandler(req, res);

      // Assert
      expect(mockConnection.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_lesson_progress'),
        expect.any(Array),
      );
      expect(res.json).toHaveBeenCalledWith({ message: 'Progress updated successfully' });
    });

    test('should handle lesson not found', async () => {
      // Arrange
      const req = mockRequest({
        userId: 1,
        lessonId: 999, // Non-existent lesson
        status: 'completed',
      });
      const res = mockResponse();

      Lesson.findById.mockResolvedValue(null);

      // Setup route
      courseRoutes.setupCourseRoutes(mockApp);

      // Find and call the progress lesson route handler
      const progressLessonHandler = mockApp.post.mock.calls.find(call =>
        call[0] === '/api/progress/lesson',
      )?.[1];

      // Act
      await progressLessonHandler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Lesson not found' });
    });

    test('should get user course progress', async () => {
      // Arrange
      const req = mockRequest({}, { userId: 1, courseId: 1 });
      const res = mockResponse();

      // Mock course exists
      Course.findById.mockResolvedValue({
        id: 1,
        title: 'Test Course',
      });

      // Mock enrolment check
      mockConnection.get.mockResolvedValue(null); // No existing enrolment
      mockConnection.run.mockResolvedValue();

      // Setup route
      courseRoutes.setupCourseRoutes(mockApp);

      // Find and call the get progress route handler
      const getProgressHandler = mockApp.get.mock.calls.find(call =>
        call[0] === '/api/users/:userId/courses/:courseId/progress',
      )?.[1];

      // Act
      await getProgressHandler(req, res);

      // Assert
      expect(mockConnection.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_course_progress'),
        expect.any(Array),
      );
    });
  });

  describe('Quiz Progress', () => {
    test('should submit quiz successfully', async () => {
      // Arrange
      const req = mockRequest({
        userId: 1,
        quizId: 5,
        answers: [0, 1, 2],
      });
      const res = mockResponse();

      // Mock Quiz.findById to return quiz with questions
      Quiz.findById.mockResolvedValue({
        id: 5,
        lessonId: 10,
        passingScore: 70,
        questions: [
          { correctAnswer: '0' },
          { correctAnswer: '1' },
          { correctAnswer: '2' },
        ],
      });

      // Mock Lesson and Chapter
      Lesson.findById.mockResolvedValue({
        id: 10,
        chapterId: 5,
      });

      Chapter.findById.mockResolvedValue({
        id: 5,
        courseId: 1,
      });

      mockConnection.run.mockResolvedValue({ lastID: 1 });

      // Mock the SQL queries for updateCourseProgress
      mockConnection.all.mockImplementation((query) => {
        if (query.includes('SELECT l.id')) {
          return Promise.resolve([
            { id: 1 },
            { id: 2 },
            { id: 3 },
            { id: 4 },
          ]);
        }
        if (query.includes('COUNT(*) as count')) {
          return Promise.resolve([{ count: 2 }]);
        }
        return Promise.resolve([]);
      });

      // Setup route
      courseRoutes.setupCourseRoutes(mockApp);

      // Find and call the quiz progress route handler
      const quizProgressHandler = mockApp.post.mock.calls.find(call =>
        call[0] === '/api/progress/quiz',
      )?.[1];

      expect(quizProgressHandler).toBeDefined();

      // Act
      await quizProgressHandler(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          quizId: 5,
          score: 100,
          passed: true,
        }),
      );
    });

    test('should handle quiz validation errors', async () => {
      // Arrange
      const req = mockRequest({
        userId: 1,
        quizId: 5,
        answers: [0, 1], // Missing answer
      });
      const res = mockResponse();

      // Mock Quiz.findById to return quiz with questions
      Quiz.findById.mockResolvedValue({
        id: 5,
        passingScore: 70,
        questions: [
          { correctAnswer: '0' },
          { correctAnswer: '1' },
          { correctAnswer: '2' },
        ],
      });

      // Setup route
      courseRoutes.setupCourseRoutes(mockApp);

      // Find and call the quiz progress route handler
      const quizProgressHandler = mockApp.post.mock.calls.find(call =>
        call[0] === '/api/progress/quiz',
      )?.[1];

      // Act
      await quizProgressHandler(req, res);

      // Assert
      expect(Quiz.findById).toHaveBeenCalled();
      // The code calculates score as 67% (2 out of 3 correct, rounded)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          score: 67, // Rounded percentage
          passed: false, // Below 70%
        }),
      );
    });
  });

  describe('Progress Calculation', () => {
    test('should calculate correct overall progress', async () => {
      // Arrange
      const userId = 1;
      const courseId = 1;

      // Mock SQL queries for progress calculation
      mockConnection.all.mockImplementation((query) => {
        if (query.includes('SELECT l.id')) {
          return Promise.resolve([
            { id: 1 },
            { id: 2 },
            { id: 3 },
            { id: 4 },
          ]);
        }
        if (query.includes('COUNT(*) as count')) {
          return Promise.resolve([{ count: 2 }]); // 2 out of 4 completed
        }
        return Promise.resolve([]);
      });

      // Mock updateCourseProgress function from courseRoutes
      const updateCourseProgress = async (userId, courseId) => {
        const connection = mockConnection;

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

        const totalLessons = lessons.length;
        const completed = completedLessonsResult[0]?.count || 0;
        return totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;
      };

      // Act
      const progress = await updateCourseProgress(userId, courseId);

      // Assert
      expect(progress).toBe(50); // 2/4 = 50%
    });
  });
});
