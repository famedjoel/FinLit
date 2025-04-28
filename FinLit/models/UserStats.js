/* eslint-disable no-unused-vars */
// models/UserStats.js
import { connect } from '../config/sqlite-adapter.js';
import Achievement from './Achievement.js';

const UserStats = {
  // Initialize user stats for a new user
  initializeForUser: async (userId) => {
    try {
      const connection = await connect();
      
      // Check if stats already exist for this user
      const existingStats = await connection.get(
        'SELECT * FROM user_stats WHERE user_id = ?',
        userId
      );
      
      if (existingStats) {
        return processUserStatsData(existingStats);
      }
      
      // Create new stats record
      await connection.run(
        `INSERT INTO user_stats (
          user_id, quizzes_completed, questions_answered,
          streak_days, challenges_sent, challenges_won,
          courses_completed, points_earned, points_spent
        ) VALUES (?, 0, 0, 0, 0, 0, 0, 0, 0)`,
        userId
      );
      
      // Get the new stats
      const stats = await connection.get(
        'SELECT * FROM user_stats WHERE user_id = ?',
        userId
      );
      
      return processUserStatsData(stats);
    } catch (error) {
      console.error('Error initializing user stats:', error);
      throw error;
    }
  },
  
  // Get stats for a user
  getForUser: async (userId) => {
    try {
      const connection = await connect();
      
      const stats = await connection.get(
        'SELECT * FROM user_stats WHERE user_id = ?',
        userId
      );
      
      if (!stats) {
        // Initialize if not exists
        return await UserStats.initializeForUser(userId);
      }
      
      return processUserStatsData(stats);
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  },
  
  // Update a specific stat for a user and check for achievements
  updateStat: async (userId, statName, value, increment = true) => {
    try {
      const connection = await connect();
      
      // Begin transaction
      await connection.run('BEGIN TRANSACTION');
      
      try {
        // Check if stats exist for this user
        const existingStats = await connection.get(
          'SELECT * FROM user_stats WHERE user_id = ?',
          userId
        );
        
        if (!existingStats) {
          // Initialize if not exists
          await UserStats.initializeForUser(userId);
        }
        
        // Update the specified stat
        if (increment) {
          // Increment the stat
          await connection.run(
            `UPDATE user_stats SET ${statName} = ${statName} + ? WHERE user_id = ?`,
            [value, userId]
          );
        } else {
          // Set the stat to a specific value
          await connection.run(
            `UPDATE user_stats SET ${statName} = ? WHERE user_id = ?`,
            [value, userId]
          );
        }
        
        // Get updated stats
        const updatedStats = await connection.get(
          'SELECT * FROM user_stats WHERE user_id = ?',
          userId
        );
        
        // Check for achievements related to this stat
        const achievements = await connection.all(
          `SELECT * FROM achievements 
           WHERE requirement_type = ?`,
          statName
        );
        
        const updatedAchievements = [];
        
        // Update progress for each relevant achievement
        for (const achievement of achievements) {
          // Get current progress for this achievement
          const userAchievement = await connection.get(
            `SELECT * FROM user_achievements 
             WHERE user_id = ? AND achievement_id = ?`,
            [userId, achievement.id]
          );
          
          const currentValue = updatedStats[statName];
          
          // If achievement is not already completed, update progress
          if (!userAchievement || userAchievement.completed === 0) {
            // Calculate progress as a number (should be the current value of the stat)
            const progress = currentValue;
            
            // Update achievement progress
            const updatedAchievement = await Achievement.updateUserProgress(
              userId,
              achievement.id,
              progress
            );
            
            if (updatedAchievement) {
              updatedAchievements.push(updatedAchievement);
            }
          }
        }
        
        // Commit the transaction
        await connection.run('COMMIT');
        
        return {
          stats: processUserStatsData(updatedStats),
          updatedAchievements
        };
      } catch (error) {
        // Rollback the transaction on error
        await connection.run('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error updating user stat:', error);
      throw error;
    }
  },
  
  // Update multiple stats at once
  updateMultipleStats: async (userId, statsObject) => {
    try {
      const connection = await connect();
      
      // Begin transaction
      await connection.run('BEGIN TRANSACTION');
      
      try {
        // Check if stats exist for this user
        const existingStats = await connection.get(
          'SELECT * FROM user_stats WHERE user_id = ?',
          userId
        );
        
        if (!existingStats) {
          // Initialize if not exists
          await UserStats.initializeForUser(userId);
        }
        
        // Update each stat in the object
        for (const [statName, value] of Object.entries(statsObject)) {
          // Skip invalid stat names
          if (!statName || typeof value !== 'number') continue;
          
          await connection.run(
            `UPDATE user_stats SET ${statName} = ? WHERE user_id = ?`,
            [value, userId]
          );
        }
        
        // Get updated stats
        const updatedStats = await connection.get(
          'SELECT * FROM user_stats WHERE user_id = ?',
          userId
        );
        
        // Commit the transaction
        await connection.run('COMMIT');
        
        return processUserStatsData(updatedStats);
      } catch (error) {
        // Rollback the transaction on error
        await connection.run('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error updating multiple user stats:', error);
      throw error;
    }
  },
  
  // Update login streak
  updateLoginStreak: async (userId) => {
    try {
      const connection = await connect();
      
      // Get user's current streak and last active date
      const stats = await UserStats.getForUser(userId);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize to start of day
      
      let newStreak = 1; // Default to 1 (today)
      
      if (stats.lastActiveDate) {
        const lastActive = new Date(stats.lastActiveDate);
        lastActive.setHours(0, 0, 0, 0); // Normalize to start of day
        
        // Calculate days difference
        const diffTime = Math.abs(today - lastActive);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          // Consecutive day
          newStreak = stats.streakDays + 1;
        } else if (diffDays > 1) {
          // Streak broken
          newStreak = 1;
        } else if (diffDays === 0) {
          // Same day, keep current streak
          newStreak = stats.streakDays;
        }
      }
      
      // Update streak and last active date
      const result = await UserStats.updateMultipleStats(userId, {
        streak_days: newStreak,
        last_active_date: today.toISOString()
      });
      
      // Check for streak achievements
      await UserStats.updateStat(userId, 'streak_days', newStreak, false);
      
      return result;
    } catch (error) {
      console.error('Error updating login streak:', error);
      throw error;
    }
  },
  
  // Track quiz completion
  trackQuizCompleted: async (userId, score, questionsAnswered) => {
    try {
      // Update multiple stats related to quiz completion
      const statsToUpdate = {
        quizzes_completed: { value: 1, increment: true },
        questions_answered: { value: questionsAnswered, increment: true }
      };
      
      // Update each stat and collect achievement updates
      let allUpdatedAchievements = [];
      
      for (const [statName, config] of Object.entries(statsToUpdate)) {
        const { stats, updatedAchievements } = await UserStats.updateStat(
          userId, 
          statName, 
          config.value, 
          config.increment
        );
        
        allUpdatedAchievements = [...allUpdatedAchievements, ...updatedAchievements];
      }
      
      // Also update login streak when completing a quiz
      await UserStats.updateLoginStreak(userId);
      
      return {
        stats: await UserStats.getForUser(userId),
        newAchievements: allUpdatedAchievements.filter(a => a.completed)
      };
    } catch (error) {
      console.error('Error tracking quiz completion:', error);
      throw error;
    }
  },
  
  // Track challenge sent
  trackChallengeSent: async (userId) => {
    try {
      const { stats, updatedAchievements } = await UserStats.updateStat(
        userId, 
        'challenges_sent', 
        1, 
        true
      );
      
      return {
        stats,
        newAchievements: updatedAchievements.filter(a => a.completed)
      };
    } catch (error) {
      console.error('Error tracking challenge sent:', error);
      throw error;
    }
  },
  
  // Track challenge won
  trackChallengeWon: async (userId) => {
    try {
      const { stats, updatedAchievements } = await UserStats.updateStat(
        userId, 
        'challenges_won', 
        1, 
        true
      );
      
      return {
        stats,
        newAchievements: updatedAchievements.filter(a => a.completed)
      };
    } catch (error) {
      console.error('Error tracking challenge won:', error);
      throw error;
    }
  },
  
  // Track course completion
  trackCourseCompleted: async (userId) => {
    try {
      const { stats, updatedAchievements } = await UserStats.updateStat(
        userId, 
        'courses_completed', 
        1, 
        true
      );
      
      return {
        stats,
        newAchievements: updatedAchievements.filter(a => a.completed)
      };
    } catch (error) {
      console.error('Error tracking course completion:', error);
      throw error;
    }
  }
};

// Process user stats data from DB format
function processUserStatsData(stats) {
  if (!stats) return null;
  
  // Convert snake_case to camelCase
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
    pointsSpent: stats.points_spent
  };
}

export default UserStats;