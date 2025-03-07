import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login"); // Redirect to login if not logged in
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="dashboard-container">
      <h2>Welcome, {user?.username}!</h2>
      <p>Email: {user?.email}</p>

      <div className="dashboard-content">
        {/* Progress Section */}
        <div className="progress-section">
          <h3>Your Learning Progress</h3>
          <div className="progress-bar">
            <div className="progress" style={{ width: "50%" }}></div>
          </div>
          <p>50% Completed</p>
        </div>

        {/* Recent Activity */}
        <div className="recent-activity">
          <h3>Recent Activity</h3>
          <ul>
            <li>🏆 Completed &quot;Budgeting 101&quot;</li>
            <li>🎮 Played &quot;Money Match&quot;</li>
            <li>📖 Started &quot;Investing Basics&quot;</li>
          </ul>
        </div>
      </div>

      <button className="logout-btn" onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default Dashboard;


