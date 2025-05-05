/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-undef */
// tests/reward.test.js
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

describe('Reward System', () => {
  let Reward;

  beforeAll(async () => {
    Reward = (await import('../models/Reward.js')).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create a reward successfully', async () => {
    const rewardData = {
      name: 'Gold Frame',
      description: 'A premium gold frame',
      type: 'avatar_frame',
      icon: '🖼️',
      pointsCost: 1000,
      imageUrl: '/images/gold-frame.png',
      isPremium: false,
    };

    mockConnection.run.mockResolvedValue({ lastID: 1 });
    mockConnection.get.mockResolvedValue({
      id: 1,
      name: rewardData.name,
      description: rewardData.description,
      type: rewardData.type,
      points_cost: 1000,
      is_premium: 0,
    });

    const result = await Reward.create(rewardData);

    expect(result).toBeDefined();
    expect(result.id).toBe(1);
    expect(result.pointsCost).toBe(1000);
    expect(result.isPremium).toBe(false);
  });

  test('should get user rewards', async () => {
    const userId = 1;

    mockConnection.all.mockResolvedValue([
      {
        id: 1,
        name: 'Gold Frame',
        points_cost: 1000,
        acquired_at: '2024-01-01T00:00:00Z',
        is_equipped: 1,
      },
      {
        id: 2,
        name: 'Silver Badge',
        points_cost: 500,
        acquired_at: null,
        is_equipped: 0,
      },
    ]);

    const result = await Reward.getUserRewards(userId);

    expect(result).toHaveLength(2);
    expect(result[0].acquired).toBe(true);
    expect(result[0].isEquipped).toBe(true);
    expect(result[1].acquired).toBe(false);
  });

  test('should purchase reward successfully', async () => {
    const userId = 1;
    const rewardId = 1;

    mockConnection.run.mockResolvedValue();

    mockConnection.get.mockImplementation((query) => {
      if (query.includes('SELECT * FROM rewards')) {
        return Promise.resolve({
          id: 1,
          name: 'Gold Frame',
          points_cost: 1000,
        });
      }
      if (query.includes('SELECT * FROM user_points')) {
        return Promise.resolve({
          user_id: userId,
          total_points: 2000,
        });
      }
      if (query.includes('SELECT * FROM user_rewards')) {
        return Promise.resolve(null);
      }
    });

    const result = await Reward.purchaseReward(userId, rewardId);

    expect(result.success).toBe(true);
    expect(mockConnection.run).toHaveBeenCalledWith('BEGIN TRANSACTION');
    expect(mockConnection.run).toHaveBeenCalledWith('COMMIT');
    expect(mockConnection.run).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE user_points'),
      expect.any(Array),
    );
  });

  test('should prevent purchasing if insufficient points', async () => {
    const userId = 1;
    const rewardId = 1;

    mockConnection.get.mockImplementation((query) => {
      if (query.includes('SELECT * FROM user_rewards')) {
        return Promise.resolve(null);
      }
      if (query.includes('SELECT * FROM rewards')) {
        return Promise.resolve({
          id: 1,
          points_cost: 1000,
        });
      }
      if (query.includes('SELECT * FROM user_points')) {
        return Promise.resolve({
          user_id: userId,
          total_points: 500,
        });
      }
    });

    const result = await Reward.purchaseReward(userId, rewardId);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Not enough points to purchase this reward');
  });

  test('should toggle equip status', async () => {
    const userId = 1;
    const rewardId = 1;

    mockConnection.get.mockImplementation((query) => {
      if (query.includes('user_rewards')) {
        return Promise.resolve({
          user_id: userId,
          reward_id: rewardId,
          is_equipped: 0,
        });
      }
      if (query.includes('rewards')) {
        return Promise.resolve({
          id: rewardId,
          type: 'avatar_frame',
        });
      }
    });

    const result = await Reward.toggleEquipStatus(userId, rewardId, true);

    expect(result.success).toBe(true);
    expect(mockConnection.run).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE user_rewards'),
      expect.any(Array),
    );
  });

  test('should prevent equipping unowned reward', async () => {
    const userId = 1;
    const rewardId = 1;

    mockConnection.get.mockResolvedValue(null);

    const result = await Reward.toggleEquipStatus(userId, rewardId, true);

    expect(result.success).toBe(false);
    expect(result.message).toBe('You do not own this reward');
  });

  test('should initialize default rewards', async () => {
    let lastId = 0;

    mockConnection.get.mockImplementation((query, params) => {
      if (query.includes('SELECT COUNT(*)')) {
        return Promise.resolve({ count: 0 });
      }
      if (query.includes('SELECT * FROM rewards WHERE id = ?')) {
        return Promise.resolve({
          id: params[0],
          name: 'Mock Reward',
          description: 'Default description',
          type: 'avatar_frame',
          points_cost: 0,
          is_premium: 0,
        });
      }
      return Promise.resolve();
    });

    mockConnection.run.mockImplementation((query) => {
      if (query.includes('INSERT INTO rewards')) {
        lastId += 1;
        return Promise.resolve({ lastID: lastId });
      }
      return Promise.resolve(); // for BEGIN, COMMIT, etc.
    });

    await Reward.initDefaultRewards();

    expect(mockConnection.run).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO rewards'),
      expect.any(Array),
    );
  });

  test('should not initialize if rewards already exist', async () => {
    mockConnection.get.mockResolvedValue({ count: 5 });

    const callsBefore = mockConnection.run.mock.calls.length;

    await Reward.initDefaultRewards();

    const callsAfter = mockConnection.run.mock.calls.length;
    expect(callsAfter).toBe(callsBefore);
  });
});
