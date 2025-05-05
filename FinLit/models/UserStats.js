/* eslint-disable no-unused-vars */
import { connect } from '../config/sqlite-adapter.js';
import Achievement from './Achievement.js';

const UserStats = {
  // Initialise user stats for a new user
  initialiseForUser: async (userId) => {
    try {
      const connection = await connect();

      // Check if stats already exist for the user
      const existingStats = await connection.get(
        'SELECT * FROM user_stats WHERE user_id = ?',
        userId,
      );

      if (existingStats) {
        return processUserStatsData(existingStats);
      }

      // Create a new stats record for the user
      await connection.run(
        `INSERT INTO user_stats (
          user_id, quizzes_completed, questions_answered,
          streak_days, challenges_sent, challenges_won,
          courses_completed, points_earned, points_spent
        ) VALUES (?, 0, 0, 0, 0, 0, 0, 0, 0)`,
        userId,
      );

      // Retrieve the newly created stats
      const stats = await connection.get(
        'SELECT * FROM user_stats WHERE user_id = ?',
        userId,
      );

      return processUserStatsData(stats);
    } catch (error) {
      console.error('Error initialising user stats:', error);
      throw error;
    }
  },

  // Retrieve stats for a user
  getForUser: async (userId) => {
    try {
      const connection = await connect();

      const stats = await connection.get(
        'SELECT * FROM user_stats WHERE user_id = ?',
        userId,
      );

      if (!stats) {
        // Initialise stats if they do not exist
        return await UserStats.initialiseForUser(userId);
      }

      return processUserStatsData(stats);
    } catch (error) {
      console.error('Error retrieving user stats:', error);
      throw error;
    }
  },

  // Update a specific stat for a user and check for related achievements
  updateStat: async (userId, statName, value, increment = true, transaction = null) => {
    try {
      const connection = await connect();
      const shouldManageTransaction = !transaction;

      try {
        if (shouldManageTransaction) {
          await connection.run('BEGIN TRANSACTION');
        }

        // Ensure stats exist for the user
        const existingStats = await connection.get(
          'SELECT * FROM user_stats WHERE user_id = ?',
          userId,
        );

        if (!existingStats) {
          await UserStats.initialiseForUser(userId);
        }

        // Update the specified stat
        if (increment) {
          await connection.run(
            `UPDATE user_stats SET ${statName} = ${statName} + ? WHERE user_id = ?`,
            [value, userId],
          );
        } else {
          await connection.run(
            `UPDATE user_stats SET ${statName} = ? WHERE user_id = ?`,
            [value, userId],
          );
        }

        // Retrieve updated stats
        const updatedStats = await connection.get(
          'SELECT * FROM user_stats WHERE user_id = ?',
          userId,
        );

        // Check for achievements related to the updated stat
        const achievements = await connection.all(
          `SELECT * FROM achievements 
           WHERE requirement_type = ?`,
          statName,
        );

        const updatedAchievements = [];

        for (const achievement of achievements) {
          const userAchievement = await connection.get(
            `SELECT * FROM user_achievements 
             WHERE user_id = ? AND achievement_id = ?`,
            [userId, achievement.id],
          );

          const currentValue = updatedStats[statName];

          if (!userAchievement || userAchievement.completed === 0) {
            const progress = currentValue;

            const updatedAchievement = await Achievement.updateUserProgress(
              userId,
              achievement.id,
              progress,
              connection,
            );

            if (updatedAchievement) {
              updatedAchievements.push(updatedAchievement);
            }
          }
        }

        if (shouldManageTransaction) {
          await connection.run('COMMIT');
        }

        return {
          stats: processUserStatsData(updatedStats),
          updatedAchievements,
        };
      } catch (error) {
        if (shouldManageTransaction) {
          await connection.run('ROLLBACK');
        }
        throw error;
      }
    } catch (error) {
      console.error('Error updating user stat:', error);
      throw error;
    }
  },

  // Update multiple stats for a user
  updateMultipleStats: async (userId, statsObject) => {
    try {
      const connection = await connect();

      await connection.run('BEGIN TRANSACTION');

      try {
        const existingStats = await connection.get(
          'SELECT * FROM user_stats WHERE user_id = ?',
          userId,
        );

        if (!existingStats) {
          await UserStats.initialiseForUser(userId);
        }

        for (const [statName, value] of Object.entries(statsObject)) {
          if (!statName || typeof value !== 'number') continue;

          await connection.run(
            `UPDATE user_stats SET ${statName} = ? WHERE user_id = ?`,
            [value, userId],
          );
        }

        const updatedStats = await connection.get(
          'SELECT * FROM user_stats WHERE user_id = ?',
          userId,
        );

        await connection.run('COMMIT');

        return processUserStatsData(updatedStats);
      } catch (error) {
        await connection.run('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error updating multiple user stats:', error);
      throw error;
    }
  },

  // Update the user's login streak
  updateLoginStreak: async (userId) => {
    try {
      const connection = await connect();

      const stats = await UserStats.getForUser(userId);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let newStreak = 1;

      if (stats.lastActiveDate) {
        const lastActive = new Date(stats.lastActiveDate);
        lastActive.setHours(0, 0, 0, 0);

        const diffTime = Math.abs(today - lastActive);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          newStreak = stats.streakDays + 1;
        } else if (diffDays > 1) {
          newStreak = 1;
        } else if (diffDays === 0) {
          newStreak = stats.streakDays;
        }
      }

      const result = await UserStats.updateMultipleStats(userId, {
        streak_days: newStreak,
        last_active_date: today.toISOString(),
      });

      await UserStats.updateStat(userId, 'streak_days', newStreak, false);

      return result;
    } catch (error) {
      console.error('Error updating login streak:', error);
      throw error;
    }
  },

  // Track quiz completion and update related stats
  trackQuizCompleted: async (userId, score, questionsAnswered) => {
    try {
      const statsToUpdate = {
        quizzes_completed: { value: 1, increment: true },
        questions_answered: { value: questionsAnswered, increment: true },
      };

      let allUpdatedAchievements = [];

      for (const [statName, config] of Object.entries(statsToUpdate)) {
        const { stats, updatedAchievements } = await UserStats.updateStat(
          userId,
          statName,
          config.value,
          config.increment,
        );

        allUpdatedAchievements = [...allUpdatedAchievements, ...updatedAchievements];
      }

      await UserStats.updateLoginStreak(userId);

      return {
        stats: await UserStats.getForUser(userId),
        newAchievements: allUpdatedAchievements.filter(a => a.completed),
      };
    } catch (error) {
      console.error('Error tracking quiz completion:', error);
      throw error;
    }
  },

  // Track a challenge sent by the user
  trackChallengeSent: async (userId) => {
    try {
      const { stats, updatedAchievements } = await UserStats.updateStat(
        userId,
        'challenges_sent',
        1,
        true,
      );

      return {
        stats,
        newAchievements: updatedAchievements.filter(a => a.completed),
      };
    } catch (error) {
      console.error('Error tracking challenge sent:', error);
      throw error;
    }
  },

  // Track a challenge won by the user
  trackChallengeWon: async (userId) => {
    try {
      const { stats, updatedAchievements } = await UserStats.updateStat(
        userId,
        'challenges_won',
        1,
        true,
      );

      return {
        stats,
        newAchievements: updatedAchievements.filter(a => a.completed),
      };
    } catch (error) {
      console.error('Error tracking challenge won:', error);
      throw error;
    }
  },

  // Track course completion by the user
  trackCourseCompleted: async (userId) => {
    try {
      const { stats, updatedAchievements } = await UserStats.updateStat(
        userId,
        'courses_completed',
        1,
        true,
      );

      return {
        stats,
        newAchievements: updatedAchievements.filter(a => a.completed),
      };
    } catch (error) {
      console.error('Error tracking course completion:', error);
      throw error;
    }
  },
};

// Convert database stats format to camelCase for easier usage
function processUserStatsData(stats) {
  if (!stats) return null;

  return {
    id: stats.id,
    userId: stats.user_id,
    quizzesCompleted: stats.quizzes_completed,
    questionsAnswered: stats.questions_answered,
    streakDays: stats.streak_days,
    lastActiveDate: stats.last_active_date,
    challengesSent: stats.challenges_sent,
    challengesWon: stats.challenges_won,
    coursesCompleted: stats.courses_completed,
    pointsEarned: stats.points_earned,
    pointsSpent: stats.points_spent,
  };
}

export default UserStats;
