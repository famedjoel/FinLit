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
    if (type === 'game' && action === 'played') return '🎮';
    if (type === 'account' && action === 'created') return '👤';
    if (type === 'account' && action === 'logged in') return '🔑';
    return '📝';
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

      {/* Game Progress Section - Detailed Stats */}
      {dashboardData?.gameProgress && dashboardData.gameProgress.length > 0 && (
        <div className="games-section">
          <h3>Game Details</h3>
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