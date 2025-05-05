/* eslint-disable no-unused-vars */
import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from 'react-router-dom';
import "../styles/dashboard.css";
import { ThemeContext } from "../context/ThemeContext";
// import GameProgress from "./GameProgress";
import DashboardCourseItem from "./DashboardCourseItem";

// Get the current hostname for API calls (works on all devices)
const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:7900`;

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [validCourseIds, setValidCourseIds] = useState([]);
  const { theme } = useContext(ThemeContext);

  // Fetch valid course IDs when the component loads
  useEffect(() => {
    const fetchValidCourses = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/courses`);
        if (response.ok) {
          const courses = await response.json();
          // Extract just the IDs
          const ids = courses.map(course => course.id);
          setValidCourseIds(ids);
        }
      } catch (error) {
        console.error("Error fetching valid courses:", error);
      }
    };
    
    fetchValidCourses();
  }, []);

  useEffect(() => {
    const checkAuth = () => {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        navigate("/login");
      } else {
        setUser(JSON.parse(storedUser));
        fetchDashboardData(JSON.parse(storedUser).id);
      }
    };
    
    checkAuth();
    
    // Add listeners for logout or other auth changes
    window.addEventListener('loginStatusChange', checkAuth);
    window.addEventListener('storage', (event) => {
      if (event.key === 'user') {
        checkAuth();
      }
    });
    
    return () => {
      window.removeEventListener('loginStatusChange', checkAuth);
      window.removeEventListener('storage', checkAuth);
    };
  }, [navigate]);

  const fetchDashboardData = async (userId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/dashboard/${userId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }
      
      const data = await response.json();
      setDashboardData(data);
      setLoading(false);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError("Failed to load dashboard data. Please try again later.");
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.dispatchEvent(new Event('loginStatusChange'));
    navigate("/login");
  };

  // Format the timestamp to a readable format
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get appropriate icon for activity
  const getActivityIcon = (type, action) => {
    if (type === 'course' && action === 'completed') return '🏆';
    if (type === 'course' && action === 'started') return '📖';
    if (type === 'game' && action === 'played') {
      // Check specific games for custom icons
      if (action.includes('Battle of Budgets')) return '⚔️';
      if (action.includes('Money Match')) return '💰';
      return '🎮';
    }
    if (type === 'account' && action === 'created') return '👤';
    if (type === 'account' && action === 'logged in') return '🔑';
    return '📝';
  };

  // Get game title from activity
  const getGameTitle = (activity) => {
    // Check if activity has metadata
    if (activity.metadata) {
      try {
        const metadata = typeof activity.metadata === 'string' 
          ? JSON.parse(activity.metadata) 
          : activity.metadata;
        
        // Return the title from metadata if it exists
        if (metadata.title) return metadata.title;
      } catch (e) {
        // If parsing fails, fall back to activity.title
      }
    }
    
    return activity.title;
  };

  // Format game metadata for Battle Budgets
  const formatGameDetails = (metadata) => {
    console.log('Formatting metadata:', metadata); // Debug log
    
    if (!metadata) return null;
    
    try {
      // Handle metadata whether it's string or object
      let parsed = metadata;
      if (typeof metadata === 'string') {
        parsed = JSON.parse(metadata);
      }
      
      console.log('Parsed metadata:', parsed); // Debug log
      
      // Ensure all required fields exist
      return {
        winner: parsed.winner || null,
        aiPersonality: parsed.aiPersonality || null,
        finalPlayerMoney: parsed.finalPlayerMoney || 0,
        finalAiMoney: parsed.finalAiMoney || 0,
        specialEvents: parsed.specialEvents || 0
      };
    } catch (e) {
      console.error('Error parsing metadata:', e); // Debug log
      return null;
    }
  };

  // Get Battle Budgets specific details for activity
  const getBattleBudgetsDetails = (activity) => {
    if (activity.gameId === 'battle-budgets' && activity.metadata) {
      const details = formatGameDetails(activity.metadata);
      if (details) {
        const outcome = details.winner === 'player' ? 'Won' : 
                        details.winner === 'ai' ? 'Lost' : 'Draw';
        return `${outcome} vs ${details.aiPersonality}`;
      }
    }
    return null;
  };

  if (loading) {
    return (
      <div className={`dashboard-container ${theme === "dark" ? "dark-theme" : ""}`}>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`dashboard-container ${theme === "dark" ? "dark-theme" : ""}`}>
        <div className="error-message">
          <h3>⚠️ {error}</h3>
          <button onClick={() => fetchDashboardData(user.id)} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`dashboard-container ${theme === "dark" ? "dark-theme" : ""}`}>
      <h2>Welcome, {user?.username || "User"}!</h2>

      <div className="dashboard-content">
        {/* Progress Section */}
        <div className="progress-section">
          <h3>Your Learning Progress</h3>
          <div className="progress-bar">
            <div 
              className="progress" 
              style={{ width: `${dashboardData?.overallProgress || 0}%` }}
            ></div>
          </div>
          <p><strong>{dashboardData?.overallProgress || 0}% Completed</strong></p>
          
          {dashboardData?.courseProgress && dashboardData.courseProgress.length > 0 ? (
            <>
              {/* Original courses list - can be used for light theme */}
              <div className={`courses-list ${theme === "dark" ? "d-none" : ""}`}>
                <h4>Your Courses</h4>
                {dashboardData.courseProgress
              // Filter out courses that don't exist in the database anymore
              .filter(course => validCourseIds.includes(course.courseId))
              .map((course, index) => (
                  <div key={index} className="course-item">
                    <div className="course-info">
                      <span className="course-title">{course.title}</span>
                      <span className="course-progress">{course.progress}%</span>
                    </div>
                    <div className="course-progress-bar">
                      <div 
                        className="course-progress-fill" 
                        style={{ width: `${course.progress}%` }}
                      ></div>
                    </div>
                    <Link to={`/courses/${course.courseId}`} className="continue-btn">
                      {course.progress > 0 ? 'Continue' : 'Start'}
                    </Link>
                  </div>
                ))}
              </div>
              
              {/* Dark theme courses list that matches screenshot */}
              <div className={`dashboard-courses ${theme !== "dark" ? "d-none" : ""}`}>
                {dashboardData.courseProgress
                // Filter out courses that don't exist in the database anymore
                .filter(course => validCourseIds.includes(course.courseId))
                .map((course, index) => (
                  <DashboardCourseItem 
                    key={index} 
                    course={{
                      courseId: course.courseId,
                      title: course.title,
                      progress: course.progress
                    }} 
                  />
                ))}
              </div>
            </>
          ) : (
            <p className="no-data">No courses in progress yet</p>
          )}
        </div>

        {/* Recent Activity */}
        <div className="recent-activity">
          <h3>Recent Activity</h3>
          
          {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ? (
            <ul className="activity-list">
              {dashboardData.recentActivity.map((activity, index) => (
                <li key={index} className="activity-item">
                  <div className="activity-icon">
                    {getActivityIcon(activity.type, activity.title)}
                  </div>
                  <div className="activity-details">
                    <span className="activity-text">
                      {activity.action === 'played' ? 'Played' : 
                       activity.action === 'completed' ? 'Completed' : 
                       activity.action === 'started' ? 'Started' : 
                       activity.action}
                      {" "}
                      <strong>{getGameTitle(activity)}</strong>
                      
                      {/* Show Battle Budgets outcome */}
                      {activity.gameId === 'battle-budgets' && activity.metadata && (() => {
                        const result = activity.metadata.winner;
                        const personality = activity.metadata.aiPersonality;
                        
                        if (result === 'player') {
                          return <span className="game-outcome win"> - Victory vs {personality}! 🏆</span>;
                        } else if (result === 'ai') {
                          return <span className="game-outcome loss"> - Lost to {personality} 😔</span>;
                        } else if (result === 'tie') {
                          return <span className="game-outcome tie"> - Draw vs {personality} 🤝</span>;
                        }
                        return null;
                      })()}
                      
                      {/* Show session type for MoneyMatch */}
                      {activity.type === 'game' && activity.title?.includes('Money Budgeting Challenge') && (
                        <span className="game-details">
                          {activity.title.includes('Session Start') ? '' : 
                           activity.score ? ` (Score: ${activity.score})` : ''}
                        </span>
                      )}
                    </span>
                    
                    {/* Show score for games */}
                    {activity.type === 'game' && activity.score !== undefined && (
                      <span className="activity-score">Score: ${activity.score}</span>
                    )}
                    
                    <span className="activity-time">{formatDate(activity.timestamp)}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-data">No recent activity</p>
          )}
        </div>
      </div>

{/* Game Stats Dashboard */}
{dashboardData?.gameProgress && dashboardData.gameProgress.length > 0 && (
  <div className="games-section">
    <h3>Game Stats Dashboard</h3>
    <div className="games-grid">
      {dashboardData.gameProgress.map((game, index) => {
        let metadata = {};
        try {
          // Always try to parse metadata
          if (game.metadata) {
            metadata = typeof game.metadata === 'string' 
              ? JSON.parse(game.metadata) 
              : game.metadata;
          }
        } catch (e) {
          console.error('Error parsing game metadata:', e);
          metadata = {};
        }
        
        // Don't show Money Budgeting Challenge - Session Start
        if (game.gameId === 'money-match' && game.title?.includes('Session Start')) {
          return null;
        }
              
        return (
          <div key={index} className="game-stat-card enhanced">
            <h4>{game.title || 'Untitled Game'}</h4>
            
            {/* Battle Budgets specific details */}
            {game.gameId === 'battle-budgets' && (
              <div className="game-details">
                <p>💰 High Score: <strong>${game.highScore || 0}</strong></p>
                <p>🎮 Played: <strong>{game.timesPlayed || 0} times</strong></p>
                <p>📅 Last played: <strong>{game.lastPlayed ? formatDate(game.lastPlayed) : 'Never'}</strong></p>
                
                {/* Only show additional details if metadata exists */}
                {metadata && Object.keys(metadata).length > 0 && (() => {
                  const details = formatGameDetails(metadata);
                  return details && (
                    <>
                      <p>🎯 Last Match: <strong>{details.winner === 'player' ? '🏆 Victory' : details.winner === 'ai' ? '😔 Loss' : '🤝 Draw'}</strong></p>
                      <p>🤖 Last Opponent: <strong>{details.aiPersonality || 'Unknown'}</strong></p>
                      <p>⭐ Special Events: <strong>{details.specialEvents || 0}</strong></p>
                    </>
                  );
                })()}
              </div>
            )}
                  
 {/* MoneyMatch specific details */}
 {game.gameId === 'money-match' && !game.title?.includes('Session Start') && (
              <div className="game-details">
                <p>High Score: <strong>{game.highScore}</strong></p>
                <p>Played: <strong>{game.timesPlayed} times</strong></p>
                <p>Last played: <strong>{formatDate(game.lastPlayed)}</strong></p>
                {metadata.difficulty && (
                  <p>Last difficulty: <strong>{metadata.difficulty}</strong></p>
                )}
                {metadata.essentialsPercentage && (
                  <p>Essentials: <strong>{metadata.essentialsPercentage}%</strong></p>
                )}
                {metadata.luxuriesPercentage && (
                  <p>Luxuries: <strong>{metadata.luxuriesPercentage}%</strong></p>
                )}
                {metadata.savingsPercentage && (
                  <p>Savings: <strong>{metadata.savingsPercentage}%</strong></p>
                )}
              </div>
            )}
                  
                  {/* Generic game details for other games */}
                  {game.gameId !== 'battle-budgets' && (game.gameId !== 'money-match' || game.title?.includes('Session Start')) && (
                    <div className="game-details">
                      <p>High Score: <strong>{game.highScore}</strong></p>
                      <p>Played: <strong>{game.timesPlayed} times</strong></p>
                      <p>Last played: <strong>{formatDate(game.lastPlayed)}</strong></p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MoneyMatch Highlight Section */}
      {dashboardData?.gameProgress?.some(game => game.gameId === 'money-match') && (
        <div className="moneymatch-highlight">
          <h3>MoneyMatch Budgeting Challenge</h3>
          {dashboardData.gameProgress
            .filter(game => game.gameId === 'money-match')
            .map((game, index) => {
              let metadata = {};
              try {
                metadata = typeof game.metadata === 'string' 
                  ? JSON.parse(game.metadata) 
                  : game.metadata || {};
              } catch (e) {
                metadata = {};
              }
              
              return (
                <div key={index} className="moneymatch-summary">
                  <div className="moneymatch-stats">
                    <div className="stat-item">
                      <span className="stat-label">High Score</span>
                      <span className="stat-value">{game.highScore}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Sessions Played</span>
                      <span className="stat-value">{game.timesPlayed}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Last Difficulty</span>
                      <span className="stat-value">{metadata.difficulty || 'N/A'}</span>
                    </div>
                  </div>
                  
                  {/* Budget breakdown from last game */}
                  {metadata.essentialsPercentage && (
                    <div className="budget-breakdown">
                      <h4>Last Budget Breakdown</h4>
                      <div className="breakdown-bars">
                        <div className="breakdown-bar">
                          <div className="bar-label">Essentials</div>
                          <div className="bar-container">
                            <div className="bar-fill" style={{ width: `${metadata.essentialsPercentage}%`, backgroundColor: '#38b2ac' }}></div>
                          </div>
                          <div className="bar-value">{metadata.essentialsPercentage}%</div>
                        </div>
                        <div className="breakdown-bar">
                          <div className="bar-label">Luxuries</div>
                          <div className="bar-container">
                            <div className="bar-fill" style={{ width: `${metadata.luxuriesPercentage}%`, backgroundColor: '#ed8936' }}></div>
                          </div>
                          <div className="bar-value">{metadata.luxuriesPercentage}%</div>
                        </div>
                        <div className="breakdown-bar">
                          <div className="bar-label">Savings</div>
                          <div className="bar-container">
                            <div className="bar-fill" style={{ width: `${metadata.savingsPercentage}%`, backgroundColor: '#4299e1' }}></div>
                          </div>
                          <div className="bar-value">{metadata.savingsPercentage}%</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          }
        </div>
      )}

      <button className="logout-btn" onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default Dashboard;