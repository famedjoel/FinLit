// models/Achievement.js
import { connect } from '../config/sqlite-adapter.js';

const Achievement = {
  // Create a new achievement definition
  create: async (achievementData) => {
    try {
      const connection = await connect();
      
      const result = await connection.run(
        `INSERT INTO achievements (
          name, description, category, icon, points_reward,
          requirement_type, requirement_value, badge_image, level, max_level
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          achievementData.name,
          achievementData.description,
          achievementData.category,
          achievementData.icon,
          achievementData.pointsReward || 0,
          achievementData.requirementType,
          achievementData.requirementValue,
          achievementData.badgeImage || null,
          achievementData.level || 1,
          achievementData.maxLevel || 1
        ]
      );
      
      // Get the inserted achievement
      const achievement = await connection.get(
        'SELECT * FROM achievements WHERE id = ?',
        result.lastID
      );
      
      return processAchievementData(achievement);
    } catch (error) {
      console.error('Error creating achievement:', error);
      throw error;
    }
  },
  
  // Get all achievements
  getAll: async () => {
    try {
      const connection = await connect();
      
      const achievements = await connection.all(
        'SELECT * FROM achievements ORDER BY category, level'
      );
      
      return achievements.map(achievement => processAchievementData(achievement));
    } catch (error) {
      console.error('Error getting all achievements:', error);
      throw error;
    }
  },
  
  // Get achievements by category
  getByCategory: async (category) => {
    try {
      const connection = await connect();
      
      const achievements = await connection.all(
        'SELECT * FROM achievements WHERE category = ? ORDER BY level',
        category
      );
      
      return achievements.map(achievement => processAchievementData(achievement));
    } catch (error) {
      console.error('Error getting achievements by category:', error);
      throw error;
    }
  },
  
  // Get a specific achievement by ID
  findById: async (id) => {
    try {
      const connection = await connect();
      
      const achievement = await connection.get(
        'SELECT * FROM achievements WHERE id = ?',
        id
      );
      
      return achievement ? processAchievementData(achievement) : null;
    } catch (error) {
      console.error('Error finding achievement by ID:', error);
      throw error;
    }
  },
  
  // Update an achievement
  update: async (id, updates) => {
    try {
      const connection = await connect();
      
      // Build update query
      const setClauses = [];
      const params = [];
      
      for (const [key, value] of Object.entries(updates)) {
        // Convert camelCase to snake_case for DB
        const dbKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        setClauses.push(`${dbKey} = ?`);
        params.push(value);
      }
      
      // Add id to params
      params.push(id);
      
      // Execute update if there are fields to update
      if (setClauses.length > 0) {
        await connection.run(
          `UPDATE achievements SET ${setClauses.join(', ')} WHERE id = ?`,
          params
        );
      }
      
      // Return updated achievement
      return await Achievement.findById(id);
    } catch (error) {
      console.error('Error updating achievement:', error);
      throw error;
    }
  },
  
  // Delete an achievement
  delete: async (id) => {
    try {
      const connection = await connect();
      
      await connection.run(
        'DELETE FROM achievements WHERE id = ?',
        id
      );
      
      return true;
    } catch (error) {
      console.error('Error deleting achievement:', error);
      throw error;
    }
  },
  
  // Get achievements for a specific user with progress
  getUserAchievements: async (userId) => {
    try {
      const connection = await connect();
      
      const userAchievements = await connection.all(
        `SELECT a.*, ua.progress, ua.current_level, ua.completed, ua.completed_at
         FROM achievements a
         LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ?
         ORDER BY a.category, a.level`,
        userId
      );
      
      return userAchievements.map(achievement => {
        const processed = processAchievementData(achievement);
        // Add user-specific fields
        processed.progress = achievement.progress || 0;
        processed.currentLevel = achievement.current_level || 1;
        processed.completed = achievement.completed === 1;
        processed.completedAt = achievement.completed_at;
        
        // Calculate progress percentage
        processed.progressPercentage = Math.min(
          100, 
          Math.round((processed.progress / processed.requirementValue) * 100)
        );
        
        return processed;
      });
    } catch (error) {
      console.error('Error getting user achievements:', error);
      throw error;
    }
  },
  
  // Update user achievement progress
  updateUserProgress: async (userId, achievementId, progressValue, transaction = null) => {
    try {
      const connection = await connect();
      
      // Only start a transaction if one wasn't passed in
      const shouldManageTransaction = !transaction;
      
      try {
        // Begin transaction only if we need to manage it ourselves
        if (shouldManageTransaction) {
          await connection.run('BEGIN TRANSACTION');
        }
        
        // Get the achievement details
        const achievement = await Achievement.findById(achievementId);
        if (!achievement) {
          throw new Error('Achievement not found');
        }
        
        // Get current user progress for this achievement
        let userAchievement = await connection.get(
          `SELECT * FROM user_achievements 
           WHERE user_id = ? AND achievement_id = ?`,
          [userId, achievementId]
        );
        
        const now = new Date().toISOString();
        
        // If no record exists yet, create one
        if (!userAchievement) {
          await connection.run(
            `INSERT INTO user_achievements
             (user_id, achievement_id, progress, current_level, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, achievementId, 0, 1, now, now]
          );
          
          userAchievement = { 
            user_id: userId, 
            achievement_id: achievementId, 
            progress: 0, 
            current_level: 1,
            completed: 0
          };
        }
        
        // Calculate new progress value
        let newProgress = progressValue;
        if (progressValue > 0 && progressValue <= userAchievement.progress) {
          // If the new value is less than current progress, we're setting an absolute value
          // Otherwise, we're incrementing
          newProgress = userAchievement.progress + progressValue;
        }
        
        // Check if the achievement is completed at this level
        const isCompleted = newProgress >= achievement.requirementValue;
        
        // Update user achievement record
        await connection.run(
          `UPDATE user_achievements
           SET progress = ?, completed = ?, updated_at = ?,
           completed_at = CASE WHEN ? AND completed = 0 THEN ? ELSE completed_at END
           WHERE user_id = ? AND achievement_id = ?`,
          [
            newProgress, 
            isCompleted ? 1 : 0, 
            now,
            isCompleted, // Condition for updating completed_at
            now,        // New completed_at value
            userId, 
            achievementId
          ]
        );
        
        // If newly completed, award points
        if (isCompleted && userAchievement.completed === 0) {
          // Award points for completing the achievement
          await connection.run(
            `INSERT INTO user_points (user_id, total_points, last_updated)
             VALUES (?, ?, ?)
             ON CONFLICT(user_id) DO UPDATE SET
             total_points = total_points + ?,
             last_updated = ?`,
            [userId, achievement.pointsReward, now, achievement.pointsReward, now]
          );
          
          // Record points history
          await connection.run(
            `INSERT INTO points_history (user_id, points_change, reason, reference_id)
             VALUES (?, ?, ?, ?)`,
            [userId, achievement.pointsReward, 'achievement_completed', `achievement_${achievementId}`]
          );
          
          // Update user stats for achievement tracking
          await connection.run(
            `UPDATE user_stats
             SET points_earned = points_earned + ?
             WHERE user_id = ?`,
            [achievement.pointsReward, userId]
          );
        }
        
        // Commit the transaction only if we started it
        if (shouldManageTransaction) {
          await connection.run('COMMIT');
        }
        
        // Get updated user achievement
        const updatedUserAchievement = await connection.get(
          `SELECT a.*, ua.progress, ua.current_level, ua.completed, ua.completed_at
           FROM achievements a
           JOIN user_achievements ua ON a.id = ua.achievement_id
           WHERE ua.user_id = ? AND ua.achievement_id = ?`,
          [userId, achievementId]
        );
        
        return processAchievementData(updatedUserAchievement);
      } catch (error) {
        // Rollback the transaction on error only if we started it
        if (shouldManageTransaction) {
          await connection.run('ROLLBACK');
        }
        throw error;
      }
    } catch (error) {
      console.error('Error updating user achievement progress:', error);
      throw error;
    }
  },
  
  // Get newly completed achievements for a user
  getNewlyCompletedAchievements: async (userId) => {
    try {
      const connection = await connect();
      
      // Get achievements completed in the last 24 hours
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      const newlyCompleted = await connection.all(
        `SELECT a.*, ua.progress, ua.current_level, ua.completed, ua.completed_at
         FROM achievements a
         JOIN user_achievements ua ON a.id = ua.achievement_id
         WHERE ua.user_id = ? AND ua.completed = 1 
         AND ua.completed_at > ?
         ORDER BY ua.completed_at DESC`,
        [userId, oneDayAgo.toISOString()]
      );
      
      return newlyCompleted.map(achievement => processAchievementData(achievement));
    } catch (error) {
      console.error('Error getting newly completed achievements:', error);
      throw error;
    }
  },
  
  // Initialize default achievements in the database
  initDefaultAchievements: async () => {
    try {
      const connection = await connect();
      
      // Check if achievements already exist
      const existingAchievements = await connection.all('SELECT * FROM achievements');
      if (existingAchievements.length > 0) {
        console.log(`Database already contains ${existingAchievements.length} achievements.`);
        return;
      }
      
      // Default achievement definitions
      const defaultAchievements = [
        // Quiz achievements
        {
          name: "Quiz Novice",
          description: "Complete 5 financial trivia quizzes",
          category: "quiz",
          icon: "🎓",
          pointsReward: 50,
          requirementType: "quizzes_completed",
          requirementValue: 5,
          level: 1,
          maxLevel: 4
        },
        {
          name: "Quiz Enthusiast",
          description: "Complete 25 financial trivia quizzes",
          category: "quiz",
          icon: "📚",
          pointsReward: 150,
          requirementType: "quizzes_completed",
          requirementValue: 25,
          level: 2,
          maxLevel: 4
        },
        {
          name: "Quiz Master",
          description: "Complete 50 financial trivia quizzes",
          category: "quiz",
          icon: "🧠",
          pointsReward: 300,
          requirementType: "quizzes_completed",
          requirementValue: 50,
          level: 3,
          maxLevel: 4
        },
        {
          name: "Quiz Legend",
          description: "Complete 100 financial trivia quizzes",
          category: "quiz",
          icon: "👑",
          pointsReward: 500,
          requirementType: "quizzes_completed",
          requirementValue: 100,
          level: 4,
          maxLevel: 4
        },
        
        // Question achievements
        {
          name: "Question Starter",
          description: "Answer 50 trivia questions",
          category: "questions",
          icon: "❓",
          pointsReward: 100,
          requirementType: "questions_answered",
          requirementValue: 50,
          level: 1,
          maxLevel: 3
        },
        {
          name: "Question Pro",
          description: "Answer 250 trivia questions",
          category: "questions",
          icon: "❔",
          pointsReward: 250,
          requirementType: "questions_answered",
          requirementValue: 250,
          level: 2,
          maxLevel: 3
        },
        {
          name: "Question Guru",
          description: "Answer 1000 trivia questions",
          category: "questions",
          icon: "❗",
          pointsReward: 500,
          requirementType: "questions_answered",
          requirementValue: 1000,
          level: 3,
          maxLevel: 3
        },
        
        // Challenge achievements
        {
          name: "Challenger",
          description: "Send 5 challenges to other users",
          category: "challenge",
          icon: "🎯",
          pointsReward: 50,
          requirementType: "challenges_sent",
          requirementValue: 5,
          level: 1,
          maxLevel: 3
        },
        {
          name: "Victor",
          description: "Win 10 challenges against other users",
          category: "challenge",
          icon: "🏆",
          pointsReward: 200,
          requirementType: "challenges_won",
          requirementValue: 10,
          level: 1,
          maxLevel: 3
        },
        {
          name: "Champion",
          description: "Win 25 challenges against other users",
          category: "challenge",
          icon: "🥇",
          pointsReward: 500,
          requirementType: "challenges_won",
          requirementValue: 25,
          level: 2,
          maxLevel: 3
        },
        {
          name: "Invincible",
          description: "Win 50 challenges against other users",
          category: "challenge",
          icon: "💪",
          pointsReward: 1000,
          requirementType: "challenges_won",
          requirementValue: 50,
          level: 3,
          maxLevel: 3
        },
        
        // Course achievements
        {
          name: "Student",
          description: "Complete 1 financial course",
          category: "course",
          icon: "📝",
          pointsReward: 200,
          requirementType: "courses_completed",
          requirementValue: 1,
          level: 1,
          maxLevel: 3
        },
        {
          name: "Scholar",
          description: "Complete 3 financial courses",
          category: "course",
          icon: "📚",
          pointsReward: 500,
          requirementType: "courses_completed",
          requirementValue: 3,
          level: 2,
          maxLevel: 3
        },
        {
          name: "Professor",
          description: "Complete all financial courses",
          category: "course",
          icon: "🎓",
          pointsReward: 1000,
          requirementType: "courses_completed",
          requirementValue: 5,
          level: 3,
          maxLevel: 3
        },
        
        // Streak achievements
        {
          name: "Consistent Learner",
          description: "Login and take a quiz 3 days in a row",
          category: "streak",
          icon: "📆",
          pointsReward: 100,
          requirementType: "streak_days",
          requirementValue: 3,
          level: 1,
          maxLevel: 3
        },
        {
          name: "Dedicated Student",
          description: "Login and take a quiz 7 days in a row",
          category: "streak",
          icon: "🔥",
          pointsReward: 300,
          requirementType: "streak_days",
          requirementValue: 7,
          level: 2,
          maxLevel: 3
        },
        {
          name: "Financial Devotee",
          description: "Login and take a quiz 14 days in a row",
          category: "streak",
          icon: "⚡",
          pointsReward: 700,
          requirementType: "streak_days",
          requirementValue: 14,
          level: 3,
          maxLevel: 3
        }
      ];
      
      // Insert achievements
      for (const achievementData of defaultAchievements) {
        await Achievement.create(achievementData);
      }
      
      console.log(`Initialized ${defaultAchievements.length} default achievements`);
      
    } catch (error) {
      console.error('Error initializing default achievements:', error);
      throw error;
    }
  }
};

// Process achievement data from DB format
function processAchievementData(achievement) {
  if (!achievement) return null;
  
  // Convert snake_case to camelCase
  return {
    id: achievement.id,
    name: achievement.name,
    description: achievement.description,
    category: achievement.category,
    icon: achievement.icon,
    pointsReward: achievement.points_reward,
    requirementType: achievement.requirement_type,
    requirementValue: achievement.requirement_value,
    badgeImage: achievement.badge_image,
    level: achievement.level,
    maxLevel: achievement.max_level,
    progress: achievement.progress,
    currentLevel: achievement.current_level,
    completed: achievement.completed === 1,
    completedAt: achievement.completed_at,
    createdAt: achievement.created_at
  };
}

export default Achievement;