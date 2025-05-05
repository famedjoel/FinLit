/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-undef */
// tests/challenge.test.js
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

describe('Challenge System', () => {
  let Challenge;

  beforeAll(async () => {
    Challenge = (await import('../models/Challenge.js')).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create a challenge successfully', async () => {
    // Arrange
    const challengeData = {
      challengerId: 1,
      challengedId: 2,
      gameType: 'trivia',
      gameMode: 'quick',
      prizePoints: 50,
      quizSettings: {
        difficulty: 'medium',
        categories: ['investing', 'budgeting'],
        questionCount: 5,
      },
    };

    mockConnection.run.mockResolvedValue({ lastID: 1 });
    mockConnection.get.mockResolvedValue({
      id: 1,
      challenger_id: 1,
      challenged_id: 2,
      game_type: 'trivia',
      status: 'pending',
      quiz_settings: JSON.stringify(challengeData.quizSettings),
    });

    // Act
    const result = await Challenge.create(challengeData);

    // Assert
    expect(result).toBeDefined();
    expect(result.id).toBe(1);
    expect(result.status).toBe('pending');
    expect(result.quizSettings).toEqual(challengeData.quizSettings);
    expect(mockConnection.run).toHaveBeenCalledWith('BEGIN TRANSACTION');
    expect(mockConnection.run).toHaveBeenCalledWith('COMMIT');
  });

  test('should find challenges by user ID', async () => {
    // Arrange
    const userId = 1;

    mockConnection.all.mockResolvedValue([
      {
        id: 1,
        challenger_id: userId,
        challenged_id: 2,
        status: 'pending',
        game_type: 'trivia',
        challenger_username: 'user1',
        challenged_username: 'user2',
      },
      {
        id: 2,
        challenger_id: 3,
        challenged_id: userId,
        status: 'completed',
        game_type: 'trivia',
        winner_id: userId,
        challenger_username: 'user3',
        challenged_username: 'user1',
        winner_username: 'user1',
      },
    ]);

    // Act
    const result = await Challenge.findByUserId(userId);

    // Assert
    expect(result).toHaveLength(2);
    expect(result[0].challengerId).toBe(userId);
    expect(result[1].challengedId).toBe(userId);
    expect(result[1].winnerId).toBe(userId);
  });

  test('should accept a challenge', async () => {
    // Arrange
    const challengeId = 1;

    mockConnection.run.mockResolvedValue({ changes: 1 });
    mockConnection.get.mockResolvedValue({
      id: 1,
      status: 'accepted',
      challenged_at: new Date().toISOString(),
    });

    // Act
    const result = await Challenge.accept(challengeId);

    // Assert
    expect(result).toBeDefined();
    expect(result.status).toBe('accepted');
    expect(mockConnection.run).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE challenges'),
      expect.arrayContaining([expect.any(String), challengeId]),
    );
  });

  test('should not accept non-pending challenge', async () => {
    // Arrange
    const challengeId = 1;

    mockConnection.run.mockResolvedValue({ changes: 0 }); // No rows updated

    // Act
    const result = await Challenge.accept(challengeId);

    // Assert
    expect(result).toBe(null);
  });

  test('should award points to winner', async () => {
    // Arrange
    const userId = 1;
    const points = 50;
    const reason = 'challenge_win';
    const referenceId = 'test';

    // Mock transaction
    mockConnection.run.mockResolvedValue();

    // Act
    const result = await Challenge.awardPoints(userId, points, reason, referenceId);

    // Assert
    expect(result).toBe(true);
    expect(mockConnection.run).toHaveBeenCalledWith('BEGIN TRANSACTION');
    expect(mockConnection.run).toHaveBeenCalledWith('COMMIT');
    expect(mockConnection.run).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO user_points'),
      expect.any(Array),
    );
    expect(mockConnection.run).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO points_history'),
      expect.any(Array),
    );
  });

  test('should handle points award errors', async () => {
    // Arrange
    const userId = 1;
    const points = 50;
    const reason = 'challenge_win';

    // Mock error in transaction
    mockConnection.run.mockImplementation((query) => {
      if (query.includes('INSERT INTO user_points')) {
        throw new Error('Database error');
      }
      return Promise.resolve();
    });

    // Act & Assert
    await expect(Challenge.awardPoints(userId, points, reason)).rejects.toThrow();
    expect(mockConnection.run).toHaveBeenCalledWith('ROLLBACK');
  });

  test('should filter challenges by status', async () => {
    // Arrange
    const userId = 1;
    const options = { status: 'pending', limit: 5 };

    mockConnection.all.mockResolvedValue([
      {
        id: 1,
        status: 'pending',
        game_type: 'trivia',
      },
      {
        id: 2,
        status: 'pending',
        game_type: 'trivia',
      },
    ]);

    // Act
    const result = await Challenge.findByUserId(userId, options);

    // Assert
    expect(result).toHaveLength(2);
    expect(mockConnection.all).toHaveBeenCalledWith(
      expect.stringContaining('status = ?'),
      expect.arrayContaining([userId, userId, 'pending', 5]),
    );
  });
});
