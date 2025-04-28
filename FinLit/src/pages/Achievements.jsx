/* eslint-disable react-hooks/exhaustive-deps */
// src/pages/Achievements.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Achievements.css';

// Set API base URL dynamically
const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:7900`;

function Achievements() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [showCompleted, setShowCompleted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newAchievements, setNewAchievements] = useState([]);
  const [showNewAchievementModal, setShowNewAchievementModal] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState(null);

  // Achievement categories with icons
  const categories = [
    { id: 'all', name: 'All Achievements', icon: '🏆' },
    { id: 'quiz', name: 'Quiz Achievements', icon: '🎓' },
    { id: 'questions', name: 'Question Achievements', icon: '❓' },
    { id: 'challenge', name: 'Challenge Achievements', icon: '⚔️' },
    { id: 'course', name: 'Course Achievements', icon: '📚' },
    { id: 'streak', name: 'Streak Achievements', icon: '🔥' }
  ];

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchAchievements();
      fetchUserStats();
      checkNewAchievements();
    }
  }, [user]);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/achievements/user/${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch achievements');
      const data = await response.json();
      setAchievements(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/stats/progress/${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch user stats');
      const data = await response.json();
      setUserStats(data);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const checkNewAchievements = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/achievements/new/${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch new achievements');
      const data = await response.json();
      if (data && data.length > 0) {
        setNewAchievements(data);
        setShowNewAchievementModal(true);
      }
    } catch (error) {
      console.error('Error checking new achievements:', error);
    }
  };

  const handleShowAchievementDetails = (achievement) => {
    setSelectedAchievement(achievement);
  };

  const handleCloseDetails = () => {
    setSelectedAchievement(null);
  };

  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Filter achievements based on active category, search query, and completion status
  const filteredAchievements = achievements.filter(achievement => {
    // Filter by category
    const categoryMatch = activeCategory === 'all' || achievement.category === activeCategory;
    
    // Filter by search query
    const searchMatch = searchQuery === '' || 
      achievement.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      achievement.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by completion status
    const completionMatch = !showCompleted || achievement.completed;
    
    return categoryMatch && searchMatch && completionMatch;
  });

  // Group achievements by category for better organization
  const groupedAchievements = filteredAchievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="achievements-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading achievements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="achievements-container">
      <h2>🏆 Achievements</h2>
      
      {userStats && (
        <div className="achievement-stats">
          <div className="achievement-progress">
            <div className="progress-label">
              <span>Overall Progress: </span>
              <span className="progress-value">{userStats.achievements.percentage}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${userStats.achievements.percentage}%` }}
              ></div>
            </div>
            <div className="progress-count">
              <span>{userStats.achievements.completed}/{userStats.achievements.total} Achievements Unlocked</span>
            </div>
          </div>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🎓</div>
              <div className="stat-label">Quizzes Completed</div>
              <div className="stat-value">{userStats.stats.quizzesCompleted}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">❓</div>
              <div className="stat-label">Questions Answered</div>
              <div className="stat-value">{userStats.stats.questionsAnswered}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⚔️</div>
              <div className="stat-label">Challenges Won</div>
              <div className="stat-value">{userStats.stats.challengesWon}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🔥</div>
              <div className="stat-label">Day Streak</div>
              <div className="stat-value">{userStats.stats.streakDays}</div>
            </div>
          </div>
        </div>
      )}
      
      <div className="achievements-filters">
        <div className="category-tabs">
          {categories.map(category => (
            <button 
              key={category.id}
              className={`category-tab ${activeCategory === category.id ? 'active' : ''}`}
              onClick={() => handleCategoryChange(category.id)}
            >
              <span className="category-icon">{category.icon}</span>
              <span className="category-name">{category.name}</span>
            </button>
          ))}
        </div>
        
        <div className="filter-options">
          <div className="search-box">
            <input 
              type="text" 
              placeholder="Search achievements..." 
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          
          <div className="filter-toggle">
            <label className="toggle">
              <input 
                type="checkbox" 
                checked={showCompleted}
                onChange={() => setShowCompleted(!showCompleted)}
              />
              <span className="toggle-slider"></span>
              <span className="toggle-label">Show Completed Only</span>
            </label>
          </div>
        </div>
      </div>
      
      <div className="achievements-list">
        {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => {
          const categoryInfo = categories.find(c => c.id === category) || { name: 'Uncategorized', icon: '🏆' };
          
          return (
            <div key={category} className="achievement-category-section">
              <h3 className="category-header">
                <span className="category-header-icon">{categoryInfo.icon}</span>
                <span>{categoryInfo.name}</span>
              </h3>
              
              <div className="achievement-cards">
                {categoryAchievements.map(achievement => (
                  <div 
                    key={achievement.id} 
                    className={`achievement-card ${achievement.completed ? 'completed' : 'locked'}`}
                    onClick={() => handleShowAchievementDetails(achievement)}
                  >
                    <div className="achievement-icon">{achievement.icon}</div>
                    <div className="achievement-info">
                      <h4 className="achievement-name">{achievement.name}</h4>
                      <p className="achievement-description">{achievement.description}</p>
                      
                      {!achievement.completed && (
                        <div className="achievement-progress-bar">
                          <div 
                            className="achievement-progress-fill" 
                            style={{ width: `${achievement.progressPercentage}%` }}
                          ></div>
                          <span className="achievement-progress-text">
                            {achievement.progress}/{achievement.requirementValue}
                          </span>
                        </div>
                      )}
                      
                      {achievement.completed && (
                        <div className="achievement-completed-label">
                          <span className="completed-icon">✓</span>
                          <span>Completed</span>
                          {achievement.completedAt && (
                            <span className="completed-date">
                              {new Date(achievement.completedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="achievement-reward">
                      <span className="reward-icon">💰</span>
                      <span className="reward-amount">{achievement.pointsReward}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        
        {filteredAchievements.length === 0 && (
          <div className="no-achievements">
            <p>No achievements found matching your criteria.</p>
            <button onClick={() => {
              setActiveCategory('all');
              setSearchQuery('');
              setShowCompleted(false);
            }}>Reset Filters</button>
          </div>
        )}
      </div>
      
      {/* Achievement Details Modal */}
      {selectedAchievement && (
        <div className="achievement-modal-overlay">
          <div className="achievement-modal">
            <button className="modal-close" onClick={handleCloseDetails}>×</button>
            
            <div className={`achievement-detail-card ${selectedAchievement.completed ? 'completed' : 'locked'}`}>
              <div className="achievement-detail-header">
                <div className="detail-icon">{selectedAchievement.icon}</div>
                <div className="detail-title">
                  <h3>{selectedAchievement.name}</h3>
                  <span className="detail-category">
                    {categories.find(c => c.id === selectedAchievement.category)?.name}
                  </span>
                </div>
              </div>
              
              <div className="achievement-detail-body">
                <p className="detail-description">{selectedAchievement.description}</p>
                
                <div className="detail-stats">
                  <div className="detail-stat">
                    <span className="stat-label">Reward:</span>
                    <span className="stat-value">{selectedAchievement.pointsReward} points</span>
                  </div>
                  
                  <div className="detail-stat">
                    <span className="stat-label">Progress:</span>
                    <span className="stat-value">
                      {selectedAchievement.progress}/{selectedAchievement.requirementValue}
                    </span>
                  </div>
                  
                  {selectedAchievement.completed && (
                    <div className="detail-stat">
                      <span className="stat-label">Completed On:</span>
                      <span className="stat-value">
                        {new Date(selectedAchievement.completedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
                
                {!selectedAchievement.completed && (
                  <div className="detail-progress-bar">
                    <div 
                      className="detail-progress-fill" 
                      style={{ width: `${selectedAchievement.progressPercentage}%` }}
                    ></div>
                    <span className="detail-progress-text">
                      {selectedAchievement.progressPercentage}% Complete
                    </span>
                  </div>
                )}
                
                <div className="detail-tip">
                  <h4>How to earn:</h4>
                  <p>
                    {selectedAchievement.category === 'quiz' && 'Complete financial trivia quizzes to progress.'}
                    {selectedAchievement.category === 'questions' && 'Answer more financial trivia questions to progress.'}
                    {selectedAchievement.category === 'challenge' && 'Send and win challenges against other users.'}
                    {selectedAchievement.category === 'course' && 'Complete financial education courses to progress.'}
                    {selectedAchievement.category === 'streak' && 'Login and take quizzes on consecutive days.'}
                  </p>
                </div>
              </div>
              
              <div className="achievement-detail-footer">
                {selectedAchievement.completed ? (
                  <div className="completed-badge">Achievement Unlocked!</div>
                ) : (
                  <div className="locked-badge">Keep Going!</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* New Achievement Notification Modal */}
      {showNewAchievementModal && newAchievements.length > 0 && (
        <div className="achievement-modal-overlay">
          <div className="achievement-modal new-achievement-modal">
            <div className="new-achievement-header">
              <h3>🎉 Achievement Unlocked!</h3>
              <button className="modal-close" onClick={() => setShowNewAchievementModal(false)}>×</button>
            </div>
            
            <div className="new-achievement-content">
              {newAchievements.map((achievement, index) => (
                <div key={index} className="new-achievement-card">
                  <div className="achievement-icon-large">{achievement.icon}</div>
                  <div className="new-achievement-info">
                    <h4>{achievement.name}</h4>
                    <p>{achievement.description}</p>
                    <div className="reward-badge">
                      <span>+{achievement.pointsReward} points</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="new-achievement-footer">
              <button onClick={() => setShowNewAchievementModal(false)}>
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Achievements;