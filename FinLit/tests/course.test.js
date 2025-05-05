/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
// tests/course.test.js
import { jest } from '@jest/globals';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Mock dependencies
let Course, Chapter, Lesson, Quiz;

// Create a setup function to import modules after setting up all mocks
async function setupModule() {
  Course = (await import('../models/Course.js')).default;
  Chapter = (await import('../models/Chapter.js')).default;
  Lesson = (await import('../models/Lesson.js')).default;
  Quiz = (await import('../models/Quiz.js')).default;
}

// Mock database connection
const mockConnection = {
  run: jest.fn(),
  get: jest.fn(),
  all: jest.fn(),
  exec: jest.fn(),
};

// Mock the sqlite-adapter module
jest.unstable_mockModule('../config/sqlite-adapter.js', () => ({
  connect: jest.fn().mockResolvedValue(mockConnection),
}));

describe('Course Management System', () => {
  beforeAll(async () => {
    await setupModule();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Course Model', () => {
    test('should create a new course successfully', async () => {
      // Arrange
      const courseData = {
        title: 'Test Course',
        description: 'Test Description',
        level: 'Beginner',
        imageUrl: '/test.jpg',
        chaptersCount: 2,
        lessonsCount: 5,
        estimatedHours: 10,
        status: 'published',
      };

      mockConnection.run.mockResolvedValue({ lastID: 1 });
      mockConnection.get.mockResolvedValue({
        id: 1,
        ...courseData,
        image_url: courseData.imageUrl,
        chapters_count: courseData.chaptersCount,
        lessons_count: courseData.lessonsCount,
        estimated_hours: courseData.estimatedHours,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Act
      const result = await Course.create(courseData);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.title).toBe(courseData.title);
      expect(mockConnection.run).toHaveBeenCalled();
    });

    test('should handle course creation errors', async () => {
      // Arrange
      const courseData = { title: 'Error Course' };
      mockConnection.run.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(Course.create(courseData)).rejects.toThrow('Database error');
    });

    test('should find courses with filters', async () => {
      // Arrange
      const filters = { level: 'Beginner', status: 'published' };
      mockConnection.all.mockResolvedValue([
        { id: 1, title: 'Course 1', level: 'Beginner', status: 'published' },
        { id: 2, title: 'Course 2', level: 'Beginner', status: 'published' },
      ]);

      // Act
      const result = await Course.findAll(filters);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].level).toBe('Beginner');
    });

    test('should return empty array when no courses found', async () => {
      // Arrange
      mockConnection.all.mockResolvedValue([]);

      // Act
      const result = await Course.findAll();

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  describe('Chapter Model', () => {
    test('should create a chapter successfully', async () => {
      // Arrange
      const chapterData = {
        courseId: 1,
        title: 'Chapter 1',
        description: 'Test chapter',
        order: 0,
      };

      mockConnection.run.mockResolvedValue({ lastID: 1 });
      mockConnection.get.mockResolvedValue({
        id: 1,
        course_id: chapterData.courseId,
        title: chapterData.title,
        description: chapterData.description,
        order: chapterData.order,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Act
      const result = await Chapter.create(chapterData);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.courseId).toBe(1);
    });

    test('should find chapters by course ID', async () => {
      // Arrange
      const courseId = 1;
      mockConnection.all.mockResolvedValue([
        { id: 1, course_id: courseId, title: 'Chapter 1', order: 0 },
        { id: 2, course_id: courseId, title: 'Chapter 2', order: 1 },
      ]);

      // Act
      const result = await Chapter.findByCourseId(courseId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].courseId).toBe(courseId);
    });
  });

  describe('Lesson Model', () => {
    test('should create a lesson successfully', async () => {
      // Arrange
      const lessonData = {
        chapterId: 1,
        title: 'Lesson 1',
        content: 'Test content',
        order: 0,
        estimatedMinutes: 15,
      };

      mockConnection.run.mockResolvedValue({ lastID: 1 });
      mockConnection.get.mockResolvedValue({
        id: 1,
        chapter_id: lessonData.chapterId,
        title: lessonData.title,
        content: lessonData.content,
        order: lessonData.order,
        estimated_minutes: lessonData.estimatedMinutes,
        resources: '[]',
      });

      // Act
      const result = await Lesson.create(lessonData);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.chapterId).toBe(1);
      expect(result.resources).toEqual([]);
    });

    test('should find lesson by ID with quiz', async () => {
      // Arrange
      const lessonId = 1;
      mockConnection.get.mockImplementation((query) => {
        if (query.includes('lessons')) {
          return Promise.resolve({
            id: lessonId,
            chapter_id: 1,
            title: 'Lesson 1',
            content: 'Test',
            resources: '[]',
          });
        }
        if (query.includes('quizzes')) {
          return Promise.resolve({
            id: 1,
            lesson_id: lessonId,
            title: 'Quiz 1',
            passing_score: 70,
          });
        }
        return Promise.resolve(null);
      });

      mockConnection.all.mockResolvedValue([
        {
          id: 1,
          quiz_id: 1,
          question: 'Test question?',
          options: '["A", "B", "C"]',
          correct_answer: '0',
        },
      ]);

      // Act
      const result = await Lesson.findById(lessonId);

      // Assert
      expect(result.quiz).toBeDefined();
      expect(result.quiz.questions).toHaveLength(1);
    });
  });

  describe('Quiz Model', () => {
    test('should create a quiz with questions', async () => {
      // Arrange
      const quizData = {
        lessonId: 1,
        title: 'Test Quiz',
        passingScore: 70,
        questions: [
          {
            type: 'multiple-choice',
            question: 'Test question?',
            options: ['A', 'B', 'C'],
            correctAnswer: '0',
            explanation: 'Test explanation',
          },
        ],
      };

      mockConnection.run.mockResolvedValue({ lastID: 1 });
      mockConnection.get.mockResolvedValue({
        id: 1,
        lesson_id: quizData.lessonId,
        title: quizData.title,
        passing_score: quizData.passingScore,
      });

      // Act
      await Quiz.create(quizData);

      // Assert
      expect(mockConnection.run).toHaveBeenCalledWith('BEGIN TRANSACTION');
      expect(mockConnection.run).toHaveBeenCalledWith('COMMIT');
      expect(mockConnection.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO quiz_questions'),
        expect.any(Array),
      );
    });

    test('should rollback on quiz creation error', async () => {
      // Arrange
      const quizData = { lessonId: 1, title: 'Error Quiz' };
      mockConnection.run.mockImplementation((query) => {
        if (query.includes('INSERT INTO quizzes')) {
          throw new Error('Database error');
        }
        return Promise.resolve();
      });

      // Act & Assert
      await expect(Quiz.create(quizData)).rejects.toThrow();
      expect(mockConnection.run).toHaveBeenCalledWith('ROLLBACK');
    });
  });
});
