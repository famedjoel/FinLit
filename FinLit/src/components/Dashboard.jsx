import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";

// Get the current hostname for API calls (works on all devices)
const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:5900`;

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    if (type === 'game' && action === 'played') return '🎮';
    if (type === 'account' && action === 'created') return '👤';
    if (type === 'account' && action === 'logged in') return '🔑';
    return '📝';
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
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
    <div className="dashboard-container">
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
          <p>{dashboardData?.overallProgress || 0}% Completed</p>
          
          {dashboardData?.courseProgress && dashboardData.courseProgress.length > 0 ? (
            <div className="courses-list">
              <h4>Your Courses</h4>
              {dashboardData.courseProgress.map((course, index) => (
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
                </div>
              ))}
            </div>
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
                    {getActivityIcon(activity.type, activity.action)}
                  </div>
                  <div className="activity-details">
                    <span className="activity-text">
                      {activity.action === 'played' ? 'Played' : 
                       activity.action === 'completed' ? 'Completed' : 
                       activity.action === 'started' ? 'Started' : 
                       activity.action}
                      {" "}
                      <strong>{activity.title}</strong>
                    </span>
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

      {dashboardData?.gameProgress && dashboardData.gameProgress.length > 0 && (
        <div className="games-section">
          <h3>Game Progress</h3>
          <div className="games-grid">
            {dashboardData.gameProgress.map((game, index) => (
              <div key={index} className="game-stat-card">
                <h4>{game.title}</h4>
                <p>High Score: <strong>{game.highScore}</strong></p>
                <p>Played: <strong>{game.timesPlayed} times</strong></p>
                <p>Last played: <strong>{formatDate(game.lastPlayed)}</strong></p>
              </div>
            ))}
          </div>
        </div>
      )}

      <button className="logout-btn" onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default Dashboard;