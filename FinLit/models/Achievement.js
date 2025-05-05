import { connect } from '../config/sqlite-adapter.js';

const Achievement = {
  // Creates a new achievement record in the database.
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
          achievementData.maxLevel || 1,
        ],
      );

      // Retrieve the newly inserted achievement.
      const achievement = await connection.get(
        'SELECT * FROM achievements WHERE id = ?',
        result.lastID,
      );

      return processAchievementData(achievement);
    } catch (error) {
      console.error('Error creating achievement:', error);
      throw error;
    }
  },

  // Retrieves all achievements from the database.
  getAll: async () => {
    try {
      const connection = await connect();

      const achievements = await connection.all(
        'SELECT * FROM achievements ORDER BY category, level',
      );

      return achievements.map(achievement => processAchievementData(achievement));
    } catch (error) {
      console.error('Error retrieving all achievements:', error);
      throw error;
    }
  },

  // Retrieves achievements by a given category.
  getByCategory: async (category) => {
    try {
      const connection = await connect();

      const achievements = await connection.all(
        'SELECT * FROM achievements WHERE category = ? ORDER BY level',
        category,
      );

      return achievements.map(achievement => processAchievementData(achievement));
    } catch (error) {
      console.error('Error retrieving achievements by category:', error);
      throw error;
    }
  },

  // Finds an achievement by its ID.
  findById: async (id) => {
    try {
      const connection = await connect();

      const achievement = await connection.get(
        'SELECT * FROM achievements WHERE id = ?',
        id,
      );

      return achievement ? processAchievementData(achievement) : null;
    } catch (error) {
      console.error('Error finding achievement by ID:', error);
      throw error;
    }
  },

  // Updates an achievement record with the specified updates.
  update: async (id, updates) => {
    try {
      const connection = await connect();

      const setClauses = [];
      const params = [];
      for (const [key, value] of Object.entries(updates)) {
        const dbKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        setClauses.push(`${dbKey} = ?`);
        params.push(value);
      }

      params.push(id);

      if (setClauses.length > 0) {
        await connection.run(
          `UPDATE achievements SET ${setClauses.join(', ')} WHERE id = ?`,
          params,
        );
      }

      return await Achievement.findById(id);
    } catch (error) {
      console.error('Error updating achievement:', error);
      throw error;
    }
  },

  // Deletes an achievement record using its ID.
  delete: async (id) => {
    try {
      const connection = await connect();

      await connection.run(
        'DELETE FROM achievements WHERE id = ?',
        id,
      );

      return true;
    } catch (error) {
      console.error('Error deleting achievement:', error);
      throw error;
    }
  },

  // Retrieves achievements for a specific user, including progress details.
  getUserAchievements: async (userId) => {
    try {
      const connection = await connect();

      const userAchievements = await connection.all(
        `SELECT a.*, ua.progress, ua.current_level, ua.completed, ua.completed_at
         FROM achievements a
         LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ?
         ORDER BY a.category, a.level`,
        userId,
      );

      return userAchievements.map(achievement => {
        const processed = processAchievementData(achievement);
        processed.progress = achievement.progress || 0;
        processed.currentLevel = achievement.current_level || 1;
        processed.completed = achievement.completed === 1;
        processed.completedAt = achievement.completed_at;
        processed.progressPercentage = Math.min(
          100,
          Math.round((processed.progress / processed.requirementValue) * 100),
        );

        return processed;
      });
    } catch (error) {
      console.error('Error retrieving user achievements:', error);
      throw error;
    }
  },

  // Updates the progress for a user's achievement and awards points upon completion.
  updateUserProgress: async (userId, achievementId, progressValue, transaction = null) => {
    try {
      const connection = await connect();
      const shouldManageTransaction = !transaction;

      try {
        if (shouldManageTransaction) {
          await connection.run('BEGIN TRANSACTION');
        }

        const achievement = await Achievement.findById(achievementId);
        if (!achievement) {
          throw new Error('Achievement not found');
        }

        let userAchievement = await connection.get(
          `SELECT * FROM user_achievements 
           WHERE user_id = ? AND achievement_id = ?`,
          [userId, achievementId],
        );

        const now = new Date().toISOString();

        if (!userAchievement) {
          await connection.run(
            `INSERT INTO user_achievements
             (user_id, achievement_id, progress, current_level, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, achievementId, 0, 1, now, now],
          );

          userAchievement = {
            user_id: userId,
            achievement_id: achievementId,
            progress: 0,
            current_level: 1,
            completed: 0,
          };
        }

        let newProgress = progressValue;
        if (progressValue > 0 && progressValue <= userAchievement.progress) {
          newProgress = userAchievement.progress + progressValue;
        }

        const isCompleted = newProgress >= achievement.requirementValue;

        await connection.run(
          `UPDATE user_achievements
           SET progress = ?, completed = ?, updated_at = ?,
           completed_at = CASE WHEN ? AND completed = 0 THEN ? ELSE completed_at END
           WHERE user_id = ? AND achievement_id = ?`,
          [
            newProgress,
            isCompleted ? 1 : 0,
            now,
            isCompleted,
            now,
            userId,
            achievementId,
          ],
        );

        if (isCompleted && userAchievement.completed === 0) {
          await connection.run(
            `INSERT INTO user_points (user_id, total_points, last_updated)
             VALUES (?, ?, ?)
             ON CONFLICT(user_id) DO UPDATE SET
             total_points = total_points + ?,
             last_updated = ?`,
            [userId, achievement.pointsReward, now, achievement.pointsReward, now],
          );

          await connection.run(
            `INSERT INTO points_history (user_id, points_change, reason, reference_id)
             VALUES (?, ?, ?, ?)`,
            [userId, achievement.pointsReward, 'achievement_completed', `achievement_${achievementId}`],
          );

          await connection.run(
            `UPDATE user_stats
             SET points_earned = points_earned + ?
             WHERE user_id = ?`,
            [achievement.pointsReward, userId],
          );
        }

        if (shouldManageTransaction) {
          await connection.run('COMMIT');
        }

        const updatedUserAchievement = await connection.get(
          `SELECT a.*, ua.progress, ua.current_level, ua.completed, ua.completed_at
           FROM achievements a
           JOIN user_achievements ua ON a.id = ua.achievement_id
           WHERE ua.user_id = ? AND ua.achievement_id = ?`,
          [userId, achievementId],
        );

        return processAchievementData(updatedUserAchievement);
      } catch (error) {
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

  // Retrieves achievements that were completed within the last 24 hours by a user.
  getNewlyCompletedAchievements: async (userId) => {
    try {
      const connection = await connect();

      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const newlyCompleted = await connection.all(
        `SELECT a.*, ua.progress, ua.current_level, ua.completed, ua.completed_at
         FROM achievements a
         JOIN user_achievements ua ON a.id = ua.achievement_id
         WHERE ua.user_id = ? AND ua.completed = 1 
         AND ua.completed_at > ?
         ORDER BY ua.completed_at DESC`,
        [userId, oneDayAgo.toISOString()],
      );

      return newlyCompleted.map(achievement => processAchievementData(achievement));
    } catch (error) {
      console.error('Error retrieving newly completed achievements:', error);
      throw error;
    }
  },

  // Initialises the default achievements if none are present in the database.
  initDefaultAchievements: async () => {
    try {
      const connection = await connect();

      const existingAchievements = await connection.all('SELECT * FROM achievements');
      if (existingAchievements.length > 0) {
        console.log(`Database already contains ${existingAchievements.length} achievements.`);
        return;
      }

      const defaultAchievements = [
        {
          name: 'Quiz Novice',
          description: 'Complete 5 financial trivia quizzes',
          category: 'quiz',
          icon: '🎓',
          pointsReward: 50,
          requirementType: 'quizzes_completed',
          requirementValue: 5,
          level: 1,
          maxLevel: 4,
        },
        {
          name: 'Quiz Enthusiast',
          description: 'Complete 25 financial trivia quizzes',
          category: 'quiz',
          icon: '📚',
          pointsReward: 150,
          requirementType: 'quizzes_completed',
          requirementValue: 25,
          level: 2,
          maxLevel: 4,
        },
        {
          name: 'Quiz Master',
          description: 'Complete 50 financial trivia quizzes',
          category: 'quiz',
          icon: '🧠',
          pointsReward: 300,
          requirementType: 'quizzes_completed',
          requirementValue: 50,
          level: 3,
          maxLevel: 4,
        },
        {
          name: 'Quiz Legend',
          description: 'Complete 100 financial trivia quizzes',
          category: 'quiz',
          icon: '👑',
          pointsReward: 500,
          requirementType: 'quizzes_completed',
          requirementValue: 100,
          level: 4,
          maxLevel: 4,
        },
        {
          name: 'Question Starter',
          description: 'Answer 50 trivia questions',
          category: 'questions',
          icon: '❓',
          pointsReward: 100,
          requirementType: 'questions_answered',
          requirementValue: 50,
          level: 1,
          maxLevel: 3,
        },
        {
          name: 'Question Pro',
          description: 'Answer 250 trivia questions',
          category: 'questions',
          icon: '❔',
          pointsReward: 250,
          requirementType: 'questions_answered',
          requirementValue: 250,
          level: 2,
          maxLevel: 3,
        },
        {
          name: 'Question Guru',
          description: 'Answer 1000 trivia questions',
          category: 'questions',
          icon: '❗',
          pointsReward: 500,
          requirementType: 'questions_answered',
          requirementValue: 1000,
          level: 3,
          maxLevel: 3,
        },
        {
          name: 'Challenger',
          description: 'Send 5 challenges to other users',
          category: 'challenge',
          icon: '🎯',
          pointsReward: 50,
          requirementType: 'challenges_sent',
          requirementValue: 5,
          level: 1,
          maxLevel: 3,
        },
        {
          name: 'Victor',
          description: 'Win 10 challenges against other users',
          category: 'challenge',
          icon: '🏆',
          pointsReward: 200,
          requirementType: 'challenges_won',
          requirementValue: 10,
          level: 1,
          maxLevel: 3,
        },
        {
          name: 'Champion',
          description: 'Win 25 challenges against other users',
          category: 'challenge',
          icon: '🥇',
          pointsReward: 500,
          requirementType: 'challenges_won',
          requirementValue: 25,
          level: 2,
          maxLevel: 3,
        },
        {
          name: 'Invincible',
          description: 'Win 50 challenges against other users',
          category: 'challenge',
          icon: '💪',
          pointsReward: 1000,
          requirementType: 'challenges_won',
          requirementValue: 50,
          level: 3,
          maxLevel: 3,
        },
        {
          name: 'Student',
          description: 'Complete 1 financial course',
          category: 'course',
          icon: '📝',
          pointsReward: 200,
          requirementType: 'courses_completed',
          requirementValue: 1,
          level: 1,
          maxLevel: 3,
        },
        {
          name: 'Scholar',
          description: 'Complete 3 financial courses',
          category: 'course',
          icon: '📚',
          pointsReward: 500,
          requirementType: 'courses_completed',
          requirementValue: 3,
          level: 2,
          maxLevel: 3,
        },
        {
          name: 'Professor',
          description: 'Complete all financial courses',
          category: 'course',
          icon: '🎓',
          pointsReward: 1000,
          requirementType: 'courses_completed',
          requirementValue: 5,
          level: 3,
          maxLevel: 3,
        },
        {
          name: 'Consistent Learner',
          description: 'Login and take a quiz 3 days in a row',
          category: 'streak',
          icon: '📆',
          pointsReward: 100,
          requirementType: 'streak_days',
          requirementValue: 3,
          level: 1,
          maxLevel: 3,
        },
        {
          name: 'Dedicated Student',
          description: 'Login and take a quiz 7 days in a row',
          category: 'streak',
          icon: '🔥',
          pointsReward: 300,
          requirementType: 'streak_days',
          requirementValue: 7,
          level: 2,
          maxLevel: 3,
        },
        {
          name: 'Financial Devotee',
          description: 'Login and take a quiz 14 days in a row',
          category: 'streak',
          icon: '⚡',
          pointsReward: 700,
          requirementType: 'streak_days',
          requirementValue: 14,
          level: 3,
          maxLevel: 3,
        },
      ];

      for (const achievementData of defaultAchievements) {
        await Achievement.create(achievementData);
      }

      console.log(`Initialised ${defaultAchievements.length} default achievements`);
    } catch (error) {
      console.error('Error initialising default achievements:', error);
      throw error;
    }
  },
};

// Converts a database achievement record (snake_case) into a standard camelCase JavaScript object.
function processAchievementData(achievement) {
  if (!achievement) return null;

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
    createdAt: achievement.created_at,
  };
}

export default Achievement;
