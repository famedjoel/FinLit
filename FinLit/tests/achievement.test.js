/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
// tests/achievement.test.js
import { jest } from '@jest/globals';

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

describe('Achievement and Rewards System', () => {
  let Achievement, Reward, UserStats;

  beforeAll(async () => {
    Achievement = (await import('../models/Achievement.js')).default;
    Reward = (await import('../models/Reward.js')).default;
    UserStats = (await import('../models/UserStats.js')).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Achievement Model', () => {
    test('should create achievement successfully', async () => {
      // Arrange
      const achievementData = {
        name: 'Quiz Novice',
        description: 'Complete 5 quizzes',
        category: 'quiz',
        icon: '🎓',
        pointsReward: 50,
        requirementType: 'quizzes_completed',
        requirementValue: 5,
      };

      mockConnection.run.mockResolvedValue({ lastID: 1 });
      mockConnection.get.mockResolvedValue({
        id: 1,
        name: achievementData.name,
        description: achievementData.description,
        points_reward: 50,
        requirement_type: 'quizzes_completed',
        requirement_value: 5,
      });

      // Act
      const result = await Achievement.create(achievementData);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.pointsReward).toBe(50);
    });

    test('should get user achievements with progress', async () => {
      // Arrange
      const userId = 1;

      mockConnection.all.mockResolvedValue([
        {
          id: 1,
          name: 'Quiz Novice',
          requirement_type: 'quizzes_completed',
          requirement_value: 5,
          points_reward: 50,
          progress: 3,
          completed: 0,
        },
        {
          id: 2,
          name: 'Quiz Master',
          requirement_type: 'quizzes_completed',
          requirement_value: 50,
          points_reward: 300,
          progress: 50,
          completed: 1,
          completed_at: '2024-01-01T00:00:00Z',
        },
      ]);

      // Act
      const result = await Achievement.getUserAchievements(userId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].progress).toBe(3);
      expect(result[0].progressPercentage).toBe(60); // 3/5 * 100
      expect(result[1].completed).toBe(true);
    });

    test('should update user achievement progress', async () => {
      // Arrange
      const userId = 1;
      const achievementId = 1;
      const newProgress = 5;

      // Mock existing user achievement
      mockConnection.get.mockImplementation((query) => {
        if (query.includes('achievements WHERE id')) {
          // Achievement exists
          return Promise.resolve({
            id: 1,
            points_reward: 50,
            requirement_value: 5,
          });
        }
        if (query.includes('user_achievements WHERE user_id')) {
          // Return existing progress
          return Promise.resolve({
            user_id: userId,
            achievement_id: achievementId,
            progress: 3,
            completed: 0,
          });
        }
      });

      // Act
      const result = await Achievement.updateUserProgress(userId, achievementId, newProgress);

      // Assert
      expect(mockConnection.run).toHaveBeenCalledWith('BEGIN TRANSACTION');
      expect(mockConnection.run).toHaveBeenCalledWith('COMMIT');
      expect(mockConnection.run).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE user_achievements'),
        expect.any(Array),
      );
    });

    test('should award points on achievement completion', async () => {
      // Arrange
      const userId = 1;
      const achievementId = 1;
      const newProgress = 5; // Completes the achievement

      mockConnection.get.mockImplementation((query) => {
        if (query.includes('achievements WHERE id')) {
          return Promise.resolve({
            id: 1,
            points_reward: 50,
            requirement_value: 5,
          });
        }
        if (query.includes('user_achievements WHERE user_id')) {
          return Promise.resolve({
            user_id: userId,
            achievement_id: achievementId,
            progress: 4, // Almost complete
            completed: 0,
          });
        }
      });

      // Act
      await Achievement.updateUserProgress(userId, achievementId, newProgress);

      // Assert
      expect(mockConnection.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_points'),
        expect.any(Array),
      );
      expect(mockConnection.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO points_history'),
        expect.any(Array),
      );
    });

    test('should initialize default achievements', async () => {
      // Arrange
      mockConnection.all.mockResolvedValue([]); // No existing achievements

      // Act
      await Achievement.initDefaultAchievements();

      // Assert
      expect(mockConnection.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO achievements'),
        expect.any(Array),
      );
    });
  });
});
