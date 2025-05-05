/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-undef */
// tests/userStats.test.js
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

// Mock Achievement model
jest.unstable_mockModule('../models/Achievement.js', () => ({
  default: {
    updateUserProgress: jest.fn(),
  },
}));

describe('UserStats System', () => {
  let UserStats, Achievement;

  beforeAll(async () => {
    UserStats = (await import('../models/UserStats.js')).default;
    Achievement = (await import('../models/Achievement.js')).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize user stats for new user', async () => {
    // Arrange
    const userId = 1;

    // Mock no existing stats
    mockConnection.get.mockResolvedValue(null);

    // Mock successful creation
    mockConnection.run.mockResolvedValue();

    // Mock retrieval after creation
    const newStats = {
      user_id: userId,
      quizzes_completed: 0,
      questions_answered: 0,
      streak_days: 0,
      challenges_sent: 0,
      challenges_won: 0,
      courses_completed: 0,
      points_earned: 0,
      points_spent: 0,
    };

    // Setup sequential gets
    mockConnection.get
      .mockResolvedValueOnce(null) // No existing stats
      .mockResolvedValueOnce(newStats); // New stats

    // Act
    const result = await UserStats.initializeForUser(userId);

    // Assert
    expect(result).toBeDefined();
    expect(result.userId).toBe(userId);
    expect(result.quizzesCompleted).toBe(0);
    expect(mockConnection.run).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO user_stats'),
      userId,
    );
  });

  test('should get existing user stats', async () => {
    // Arrange
    const userId = 1;

    const existingStats = {
      id: 1,
      user_id: userId,
      quizzes_completed: 5,
      questions_answered: 50,
      streak_days: 7,
      challenges_sent: 2,
      challenges_won: 1,
      courses_completed: 1,
      points_earned: 300,
      points_spent: 100,
    };

    mockConnection.get.mockResolvedValue(existingStats);

    // Act
    const result = await UserStats.getForUser(userId);

    // Assert
    expect(result.quizzesCompleted).toBe(5);
    expect(result.streakDays).toBe(7);
  });

  test('should update single stat with increment', async () => {
    // Arrange
    const userId = 1;
    const statName = 'quizzes_completed';
    const incrementValue = 1;

    // Mock existing stats
    const existingStats = {
      user_id: userId,
      quizzes_completed: 4,
    };

    // Mock updated stats
    const updatedStats = {
      user_id: userId,
      quizzes_completed: 5, // Incremented value
    };

    // Setup mock sequence for stats retrieval
    mockConnection.get
      .mockResolvedValueOnce(existingStats) // Initial check
      .mockResolvedValueOnce(updatedStats) // Updated stats
      .mockResolvedValueOnce(null); // User achievement check

    // Mock related achievements
    mockConnection.all.mockResolvedValue([{
      id: 1,
      requirement_type: 'quizzes_completed',
      requirement_value: 5,
    }]);

    // Mock achievement update - needs to have completed flag
    const completedAchievement = {
      id: 1,
      name: 'Quiz Novice',
      completed: true,
    };

    Achievement.updateUserProgress.mockResolvedValue(completedAchievement);

    // Act
    const result = await UserStats.updateStat(userId, statName, incrementValue, true);

    // Assert
    expect(result.stats.quizzesCompleted).toBe(5);
    expect(result.updatedAchievements).toContain(completedAchievement);
    expect(mockConnection.run).toHaveBeenCalledWith('BEGIN TRANSACTION');
    expect(mockConnection.run).toHaveBeenCalledWith('COMMIT');
  });

  test('should handle challenge tracking', async () => {
    // Arrange
    const userId = 1;

    // Mock stats before challenge
    const initialStats = {
      user_id: userId,
      challenges_sent: 2,
      challenges_won: 1,
    };

    // Mock updated stats
    const updatedStats = {
      user_id: userId,
      challenges_sent: 3,
      challenges_won: 1,
    };

    mockConnection.get
      .mockResolvedValueOnce(initialStats) // Initial check
      .mockResolvedValueOnce(updatedStats); // Get updated stats

    // Act
    const result = await UserStats.trackChallengeSent(userId);

    // Assert
    expect(result.stats.challengesSent).toBe(3);
    expect(result.stats.challengesWon).toBe(1);
  });

  test('should handle database errors gracefully', async () => {
    // Arrange
    const userId = 1;

    // Mock database error
    mockConnection.get.mockRejectedValue(new Error('Database error'));

    // Act & Assert
    await expect(UserStats.getForUser(userId)).rejects.toThrow('Database error');
  });
});
