// models/Reward.js
import { connect } from '../config/sqlite-adapter.js';

const Reward = {
  // Create a new reward
  create: async (rewardData) => {
    try {
      const connection = await connect();
      const result = await connection.run(
        `INSERT INTO rewards (
          name, description, type, icon, points_cost, requirement_type, 
          requirement_value, image_url, is_premium
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          rewardData.name,
          rewardData.description,
          rewardData.type,
          rewardData.icon,
          rewardData.pointsCost || 0,
          rewardData.requirementType || null,
          rewardData.requirementValue || null,
          rewardData.imageUrl || null,
          rewardData.isPremium ? 1 : 0
        ]
      );
      const reward = await connection.get('SELECT * FROM rewards WHERE id = ?', result.lastID);
      return processRewardData(reward);
    } catch (error) {
      console.error('Error creating reward:', error);
      throw error;
    }
  },

  // Get all rewards
  getAll: async () => {
    try {
      const connection = await connect();
      const rewards = await connection.all('SELECT * FROM rewards ORDER BY type, points_cost');
      return rewards.map(processRewardData);
    } catch (error) {
      console.error('Error getting all rewards:', error);
      throw error;
    }
  },

  // Get rewards by type
  getByType: async (type) => {
    try {
      const connection = await connect();
      const rewards = await connection.all(
        'SELECT * FROM rewards WHERE type = ? ORDER BY points_cost',
        type
      );
      return rewards.map(processRewardData);
    } catch (error) {
      console.error('Error getting rewards by type:', error);
      throw error;
    }
  },

  // Find a specific reward by ID
  findById: async (id) => {
    try {
      const connection = await connect();
      const reward = await connection.get('SELECT * FROM rewards WHERE id = ?', id);
      return reward ? processRewardData(reward) : null;
    } catch (error) {
      console.error('Error finding reward by ID:', error);
      throw error;
    }
  },

  // Initialize default rewards if none exist
initDefaultRewards: async () => {
  try {
    const connection = await connect();

    // Check if any rewards already exist
    const existing = await connection.get('SELECT COUNT(*) as count FROM rewards');
    if (existing.count > 0) {
      console.log(`Rewards already initialized (${existing.count} rewards found).`);
      return;
    }

    const defaultRewards = [
      // Example rewards
      {
        name: "Gold Frame",
        description: "A premium gold frame for your profile picture",
        type: "avatar_frame",
        icon: "🖼️",
        pointsCost: 1000,
        imageUrl: "/images/rewards/gold-frame.png",
        isPremium: false
      },
      {
        name: "Diamond Frame",
        description: "A sparkling diamond frame for your profile picture",
        type: "avatar_frame",
        icon: "💎",
        pointsCost: 3000,
        imageUrl: "/images/rewards/diamond-frame.png",
        isPremium: false
      },
      {
        name: "Financial Wizard",
        description: "Badge showcasing your financial knowledge",
        type: "badge",
        icon: "🧙",
        pointsCost: 500,
        imageUrl: "/images/rewards/financial-wizard-badge.png",
        isPremium: false
      },
      {
        name: "Double Points Booster",
        description: "Double your points in your next 3 quizzes",
        type: "booster",
        icon: "⚡",
        pointsCost: 1500,
        imageUrl: "/images/rewards/double-points-booster.png",
        isPremium: false
      }
    ];

    for (const rewardData of defaultRewards) {
      await Reward.create(rewardData);
    }

    console.log(`Initialized ${defaultRewards.length} default rewards.`);
  } catch (error) {
    console.error('Error initializing default rewards:', error);
    throw error;
  }
},
  // Update a reward
  update: async (id, updates) => {
    try {
      const connection = await connect();
      const setClauses = [];
      const params = [];

      for (const [key, value] of Object.entries(updates)) {
        if (key === 'isPremium') {
          setClauses.push('is_premium = ?');
          params.push(value ? 1 : 0);
        } else {
          const dbKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
          setClauses.push(`${dbKey} = ?`);
          params.push(value);
        }
      }

      if (setClauses.length > 0) {
        params.push(id);
        await connection.run(`UPDATE rewards SET ${setClauses.join(', ')} WHERE id = ?`, params);
      }

      return await Reward.findById(id);
    } catch (error) {
      console.error('Error updating reward:', error);
      throw error;
    }
  },

  // Delete a reward
  delete: async (id) => {
    try {
      const connection = await connect();
      await connection.run('DELETE FROM rewards WHERE id = ?', id);
      return true;
    } catch (error) {
      console.error('Error deleting reward:', error);
      throw error;
    }
  },

  // Get rewards for a specific user
  getUserRewards: async (userId) => {
    try {
      const connection = await connect();
      const userRewards = await connection.all(
        `SELECT r.*, ur.acquired_at, ur.is_equipped
         FROM rewards r
         LEFT JOIN user_rewards ur ON r.id = ur.reward_id AND ur.user_id = ?
         ORDER BY r.type, r.points_cost`,
        userId
      );
      return userRewards.map(reward => ({
        ...processRewardData(reward),
        acquired: reward.acquired_at !== null,
        acquiredAt: reward.acquired_at,
        isEquipped: reward.is_equipped === 1
      }));
    } catch (error) {
      console.error('Error getting user rewards:', error);
      throw error;
    }
  },

  // Give a reward to a user manually
  giveRewardToUser: async (userId, rewardId) => {
    try {
      const connection = await connect();
      await connection.run('BEGIN TRANSACTION');

      try {
        const existingReward = await connection.get(
          `SELECT * FROM user_rewards WHERE user_id = ? AND reward_id = ?`,
          [userId, rewardId]
        );
        if (existingReward) {
          await connection.run('COMMIT');
          return { success: false, message: 'User already has this reward' };
        }

        const reward = await Reward.findById(rewardId);
        if (!reward) throw new Error('Reward not found');

        const now = new Date().toISOString();
        await connection.run(
          `INSERT INTO user_rewards (user_id, reward_id, acquired_at) VALUES (?, ?, ?)`,
          [userId, rewardId, now]
        );

        await connection.run('COMMIT');
        return { success: true, reward };
      } catch (error) {
        await connection.run('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error giving reward to user:', error);
      throw error;
    }
  },

  // Equip or unequip a reward
  toggleEquipStatus: async (userId, rewardId, equip = true) => {
    try {
      const connection = await connect();
      const userReward = await connection.get(
        `SELECT * FROM user_rewards WHERE user_id = ? AND reward_id = ?`,
        [userId, rewardId]
      );

      if (!userReward) {
        return { success: false, message: 'You do not own this reward' };
      }

      if (equip) {
        const reward = await Reward.findById(rewardId);
        if (!reward) throw new Error('Reward not found');

        await connection.run(
          `UPDATE user_rewards 
           SET is_equipped = 0
           WHERE user_id = ? AND reward_id IN (SELECT id FROM rewards WHERE type = ?)`,
          [userId, reward.type]
        );
      }

      await connection.run(
        `UPDATE user_rewards SET is_equipped = ? WHERE user_id = ? AND reward_id = ?`,
        [equip ? 1 : 0, userId, rewardId]
      );

      return { success: true };
    } catch (error) {
      console.error('Error toggling reward equip status:', error);
      throw error;
    }
  },

  // Get user's equipped rewards
  getEquippedRewards: async (userId) => {
    try {
      const connection = await connect();
      const equippedRewards = await connection.all(
        `SELECT r.* 
         FROM rewards r
         JOIN user_rewards ur ON r.id = ur.reward_id
         WHERE ur.user_id = ? AND ur.is_equipped = 1`,
        userId
      );
      return equippedRewards.map(processRewardData);
    } catch (error) {
      console.error('Error getting equipped rewards:', error);
      throw error;
    }
  },

  // Purchase a reward with points
  purchaseReward: async (userId, rewardId) => {
    try {
      const connection = await connect();
      await connection.run('BEGIN TRANSACTION');

      try {
        const existingReward = await connection.get(
          `SELECT * FROM user_rewards WHERE user_id = ? AND reward_id = ?`,
          [userId, rewardId]
        );
        if (existingReward) {
          await connection.run('ROLLBACK');
          return { success: false, message: 'You already own this reward' };
        }

        const reward = await Reward.findById(rewardId);
        if (!reward) throw new Error('Reward not found');

        const userPoints = await connection.get(
          `SELECT * FROM user_points WHERE user_id = ?`,
          userId
        );
        if (!userPoints || userPoints.total_points < reward.pointsCost) {
          await connection.run('ROLLBACK');
          return { success: false, message: 'Not enough points to purchase this reward' };
        }

        const now = new Date().toISOString();

        await connection.run(
          `UPDATE user_points 
           SET total_points = total_points - ?, last_updated = ?
           WHERE user_id = ?`,
          [reward.pointsCost, now, userId]
        );

        await connection.run(
          `INSERT INTO points_history (user_id, points_change, reason, reference_id)
           VALUES (?, ?, ?, ?)`,
          [userId, -reward.pointsCost, 'reward_purchase', `reward_${rewardId}`]
        );

        await connection.run(
          `INSERT INTO user_rewards (user_id, reward_id, acquired_at)
           VALUES (?, ?, ?)`,
          [userId, rewardId, now]
        );

        await connection.run(
          `UPDATE user_stats
           SET points_spent = points_spent + ?
           WHERE user_id = ?`,
          [reward.pointsCost, userId]
        );

        await connection.run('COMMIT');
        return { success: true, reward };
      } catch (error) {
        await connection.run('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error purchasing reward:', error);
      throw error;
    }
  }
};

// Utility: process DB row into a JS object
function processRewardData(reward) {
  if (!reward) return null;

  return {
    id: reward.id,
    name: reward.name,
    description: reward.description,
    type: reward.type,
    icon: reward.icon,
    pointsCost: reward.points_cost,
    requirementType: reward.requirement_type,
    requirementValue: reward.requirement_value,
    imageUrl: reward.image_url,
    isPremium: reward.is_premium === 1,
    acquired: reward.acquired_at !== null,
    acquiredAt: reward.acquired_at,
    isEquipped: reward.is_equipped === 1,
    createdAt: reward.created_at
  };
}

export default Reward;
