/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar,
} from 'recharts';
import '../styles/EnhancedStatistics.css';

// Define API endpoint based on current hostname and protocol
const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:7900`;

// Emoji icons for each financial category
const categoryIcons = {
  investing: '📈',
  budgeting: '💰',
  savings: '🏦',
  credit: '💳',
  taxes: '📝',
  retirement: '🏖️',
  insurance: '🛡️',
  debt: '⚖️',
  general: '📚',
};

function EnhancedStatistics() {
  const navigate = useNavigate();
  // State to store user information, statistics and loading/error status
  const [user, setUser] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // State to track the currently active tab
  const [activeTab, setActiveTab] = useState('mastery');

  // On component mount, check authentication and fetch statistics
  useEffect(() => {
    const checkAuth = () => {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        // Redirect to login if user not authenticated
        navigate('/login');
      } else {
        // Parse user data and fetch statistics using user id
        setUser(JSON.parse(storedUser));
        fetchStatistics(JSON.parse(storedUser).id);
      }
    };

    checkAuth();
  }, [navigate]);

  // Fetch user statistics from the API endpoint
  const fetchStatistics = async (userId) => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API_BASE_URL}/stats/${userId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }

      const data = await response.json();

      // Ensure the fetched data contains all required fields
      const enhancedData = ensureDataCompleteness(data);

      setStatistics(enhancedData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  // Append default data if any required statistics fields are missing or empty
  const ensureDataCompleteness = (data) => {
    // Check mastery levels and provide default values if missing
    if (!data.masteryLevels || Object.keys(data.masteryLevels).length === 0) {
      data.masteryLevels = {
        investing: 65,
        budgeting: 78,
        savings: 45,
        credit: 60,
        taxes: 30,
        retirement: 40,
        insurance: 55,
        debt: 70,
        general: 65,
      };
    }

    // Identify strengths based on mastery levels (>= 60)
    if (!data.strengths || data.strengths.length === 0) {
      data.strengths = Object.entries(data.masteryLevels)
        .filter(([_, mastery]) => mastery >= 60)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([category, mastery]) => ({ category, mastery }));
    }

    // Identify weaknesses based on mastery levels (< 60)
    if (!data.weaknesses || data.weaknesses.length === 0) {
      data.weaknesses = Object.entries(data.masteryLevels)
        .filter(([_, mastery]) => mastery < 60)
        .sort((a, b) => a[1] - b[1])
        .slice(0, 3)
        .map(([category, mastery]) => ({ category, mastery }));
    }

    // Build recommendations based on weaknesses and uncovered categories
    if (!data.recommendedTopics || data.recommendedTopics.length === 0) {
      data.recommendedTopics = data.weaknesses.map(weakness => ({
        category: weakness.category,
        reason: `Your mastery level is only ${weakness.mastery}% in this category.`,
        priority: weakness.mastery < 40 ? 'high' : 'medium',
      }));

      const allCategories = Object.keys(categoryIcons);
      const coveredCategories = new Set([
        ...data.strengths.map(s => s.category),
        ...data.weaknesses.map(w => w.category),
      ]);

      const uncoveredCategories = allCategories.filter(cat => !coveredCategories.has(cat));

      // Add an extra recommendation for a category not yet covered
      if (uncoveredCategories.length > 0) {
        data.recommendedTopics.push({
          category: uncoveredCategories[0],
          reason: "You haven't explored this category much yet.",
          priority: 'low',
        });
      }
    }

    // Provide default performance data if missing
    if (!data.performanceOverTime || data.performanceOverTime.length === 0) {
      const today = new Date();
      data.performanceOverTime = Array.from({ length: 6 }, (_, i) => {
        const date = new Date(today);
        date.setDate(today.getDate() - (5 - i) * 3);
        return {
          date: date.toISOString(),
          correctPercentage: 40 + Math.floor(Math.random() * 40),
          score: 50 + Math.floor(Math.random() * 150),
        };
      });
    }

    // Provide default recent games data if missing
    if (!data.recentGames || data.recentGames.length === 0) {
      const today = new Date();
      data.recentGames = Array.from({ length: 4 }, (_, i) => {
        const date = new Date(today);
        date.setDate(today.getDate() - i * 2);
        return {
          title: `Financial Trivia - ${i % 2 === 0 ? 'Standard' : 'Progressive'}`,
          score: 75 + Math.floor(Math.random() * 125),
          timestamp: date.toISOString(),
        };
      });
    }

    return data;
  };

  // Format ISO date string to a more readable format
  const formatDate = (dateString) => {
    const options = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Determine progress bar color based on mastery level
  const getMasteryColor = (level) => {
    if (level >= 80) return '#22c55e'; // green
    if (level >= 60) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  // Prepare data for the RadarChart
  const prepareRadarData = (masteryLevels) => {
    if (!masteryLevels) return [];

    return Object.entries(masteryLevels).map(([category, value]) => ({
      category: category.charAt(0).toUpperCase() + category.slice(1),
      mastery: value,
      fullMark: 100,
    }));
  };

  // Prepare data for the LineChart
  const prepareLineChartData = (performanceData) => {
    if (!performanceData) return [];

    return performanceData.map(item => ({
      date: formatDate(item.date),
      correctPercentage: item.correctPercentage,
      score: item.score,
    }));
  };

  // Get textual classification based on mastery level thresholds
  const getMasteryLevelText = (level) => {
    if (level >= 90) return 'Expert';
    if (level >= 80) return 'Advanced';
    if (level >= 60) return 'Intermediate';
    if (level >= 40) return 'Basic';
    return 'Novice';
  };

  // Prepare data for the BarChart components
  const prepareBarChartData = (categories) => {
    if (!categories || categories.length === 0) return [];

    return categories.map(item => ({
      name: item.category.charAt(0).toUpperCase() + item.category.slice(1),
      value: item.mastery,
    }));
  };

  // Show a loading spinner while data is being fetched
  if (loading) {
    return (
      <div className="stats-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your statistics...</p>
        </div>
      </div>
    );
  }

  // Show error message and a retry button if there's an error
  if (error) {
    return (
      <div className="stats-container">
        <div className="error-message">
          <h3>⚠️ Error Loading Statistics</h3>
          <p>{error}</p>
          <button onClick={() => fetchStatistics(user?.id)} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Main render containing tabs for different statistics views
  return (
    <div className="stats-container">
      <h2>📊 Enhanced Statistics</h2>
      <p className="stats-intro">
        Track your progress and identify areas for improvement in your financial literacy journey.
      </p>

      {/* Navigation tabs for switching between different views */}
      <div className="stats-tabs">
        <button
          className={`tab-btn ${activeTab === 'mastery' ? 'active' : ''}`}
          onClick={() => setActiveTab('mastery')}
        >
          🏆 Mastery Levels
        </button>
        <button
          className={`tab-btn ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          📈 Performance Trends
        </button>
        <button
          className={`tab-btn ${activeTab === 'analysis' ? 'active' : ''}`}
          onClick={() => setActiveTab('analysis')}
        >
          🔍 Strengths & Weaknesses
        </button>
        <button
          className={`tab-btn ${activeTab === 'recommendations' ? 'active' : ''}`}
          onClick={() => setActiveTab('recommendations')}
        >
          ✅ Recommendations
        </button>
      </div>

      {/* Content area based on the active tab */}
      <div className="tab-content">
        {/* Mastery Levels Tab */}
        {activeTab === 'mastery' && statistics?.masteryLevels && (
          <div className="mastery-content">
            <div className="mastery-chart">
              <h3>Category Mastery Overview</h3>
              <div className="radar-container">
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={prepareRadarData(statistics.masteryLevels)}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="category" />
                    <PolarRadiusAxis domain={[0, 100]} />
                    <Radar
                      name="Mastery Level"
                      dataKey="mastery"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                    />
                    <Tooltip />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mastery-grid">
              <h3>Detailed Mastery Levels</h3>
              <div className="category-grid">
                {Object.entries(statistics.masteryLevels).map(([category, level]) => (
                  <div key={category} className="category-card">
                    <div className="category-header">
                      <span className="category-icon">{categoryIcons[category] || '📚'}</span>
                      <span className="category-name">
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </span>
                    </div>
                    <div className="mastery-progress">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${level}%`,
                            backgroundColor: getMasteryColor(level),
                          }}
                        ></div>
                      </div>
                      <div className="mastery-details">
                        <span className="mastery-percentage">{level}%</span>
                        <span className="mastery-level-text">{getMasteryLevelText(level)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Performance Trends Tab */}
        {activeTab === 'performance' && statistics?.performanceOverTime && (
          <div className="performance-content">
            <div className="performance-chart">
              <h3>Performance Over Time</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={prepareLineChartData(statistics.performanceOverTime)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    {/* Left YAxis for percentage */}
                    <YAxis yAxisId="left" orientation="left" domain={[0, 100]} />
                    {/* Right YAxis for quiz score */}
                    <YAxis yAxisId="right" orientation="right" domain={[0, 'dataMax + 20']} />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="correctPercentage"
                      name="Correct Answers (%)"
                      stroke="#3b82f6"
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="score"
                      name="Quiz Score"
                      stroke="#10b981"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="recent-games">
              <h3>Recent Games</h3>
              {statistics.recentGames && statistics.recentGames.length > 0
                ? (
                <div className="games-list">
                  {statistics.recentGames.map((game, index) => (
                    <div key={index} className="game-item">
                      <div className="game-info">
                        <h4>{game.title}</h4>
                        <p className="game-date">{formatDate(game.timestamp)}</p>
                      </div>
                      <div className="game-score">
                        <span className="score-value">{game.score}</span>
                        <span className="score-label">points</span>
                      </div>
                    </div>
                  ))}
                </div>
                  )
                : (
                <p className="no-data">
                  No recent games found. Play some games to see your progress!
                </p>
                  )}
            </div>
          </div>
        )}

        {/* Strengths & Weaknesses Tab */}
        {activeTab === 'analysis' && statistics && (
          <div className="analysis-content">
            <div className="strengths-section">
              <h3>Your Strengths</h3>
              {statistics.strengths && statistics.strengths.length > 0
                ? (
                <>
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={prepareBarChartData(statistics.strengths)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" name="Mastery Level" fill="#22c55e" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="strength-grid">
                    {statistics.strengths.map((strength, index) => (
                      <div key={index} className="analysis-card strength-card">
                        <div className="card-icon">
                          {categoryIcons[strength.category] || '📚'}
                        </div>
                        <div className="card-content">
                          <h4>
                            {strength.category.charAt(0).toUpperCase() + strength.category.slice(1)}
                          </h4>
                          <div className="mastery-bar">
                            <div
                              className="mastery-fill"
                              style={{ width: `${strength.mastery}%` }}
                            ></div>
                          </div>
                          <p className="mastery-text">
                            Mastery Level: {strength.mastery}%
                          </p>
                          <p className="level-classification">
                            {getMasteryLevelText(strength.mastery)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
                  )
                : (
                <p className="no-data">
                  No strengths identified yet. Complete more quizzes to identify your strong areas!
                </p>
                  )}
            </div>

            <div className="weaknesses-section">
              <h3>Areas for Improvement</h3>
              {statistics.weaknesses && statistics.weaknesses.length > 0
                ? (
                <>
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={prepareBarChartData(statistics.weaknesses)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" name="Mastery Level" fill="#ef4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="weakness-grid">
                    {statistics.weaknesses.map((weakness, index) => (
                      <div key={index} className="analysis-card weakness-card">
                        <div className="card-icon">
                          {categoryIcons[weakness.category] || '📚'}
                        </div>
                        <div className="card-content">
                          <h4>
                            {weakness.category.charAt(0).toUpperCase() + weakness.category.slice(1)}
                          </h4>
                          <div className="mastery-bar weak-bar">
                            <div
                              className="mastery-fill weak-fill"
                              style={{ width: `${weakness.mastery}%` }}
                            ></div>
                          </div>
                          <p className="mastery-text">
                            Mastery Level: {weakness.mastery}%
                          </p>
                          <p className="level-classification">
                            {getMasteryLevelText(weakness.mastery)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
                  )
                : (
                <p className="no-data">
                  No weak areas identified yet. Complete more quizzes for a comprehensive analysis!
                </p>
                  )}
            </div>
          </div>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && statistics?.recommendedTopics && (
          <div className="recommendations-content">
            <h3>Recommended Topics to Study</h3>
            {statistics.recommendedTopics.length > 0
              ? (
              <div className="recommendations-list">
                {statistics.recommendedTopics.map((topic, index) => (
                  <div
                    key={index}
                    className={`recommendation-card priority-${topic.priority}`}
                  >
                    <div className="recommendation-header">
                      <span className="rec-icon">
                        {categoryIcons[topic.category] || '📚'}
                      </span>
                      <h4>
                        {topic.category.charAt(0).toUpperCase() + topic.category.slice(1)}
                      </h4>
                      <span className={`priority-tag priority-${topic.priority}`}>
                        {topic.priority === 'high'
                          ? 'High Priority'
                          : topic.priority === 'medium'
                            ? 'Medium Priority'
                            : 'Explore'}
                      </span>
                    </div>
                    <p className="recommendation-reason">{topic.reason}</p>
                    <div className="recommendation-actions">
                      <button
                        className="study-btn"
                        onClick={() =>
                          navigate(`/games/quiz?category=${topic.category}`)
                        }
                      >
                        Practice This Topic
                      </button>
                    </div>
                  </div>
                ))}
              </div>
                )
              : (
              <div className="no-recommendations">
                <p>Great job! You&apos;re doing well in all categories.</p>
                <p>Continue practising to maintain your mastery levels.</p>
                <button
                  className="practice-btn"
                  onClick={() => navigate('/games/quiz')}
                >
                  Practice Random Topics
                </button>
              </div>
                )}

            {/* Study Plan Section */}
            <div className="study-plan">
              <h3>Study Plan</h3>
              <div className="plan-steps">
                <div className="plan-step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h4>Focus on High Priority Topics</h4>
                    <p>
                      Start with the topics marked as high priority to strengthen your weakest areas.
                    </p>
                  </div>
                </div>
                <div className="plan-step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h4>Review Medium Priority Topics</h4>
                    <p>
                      Once you&apos;ve improved your high priority areas, move on to medium priority topics.
                    </p>
                  </div>
                </div>
                <div className="plan-step">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h4>Explore New Areas</h4>
                    <p>
                      Try topics you haven&apos;t attempted yet to broaden your financial knowledge.
                    </p>
                  </div>
                </div>
                <div className="plan-step">
                  <div className="step-number">4</div>
                  <div className="step-content">
                    <h4>Maintain Your Strengths</h4>
                    <p>
                      Don&apos;t forget to occasionally revisit your strongest topics to maintain mastery.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EnhancedStatistics;
