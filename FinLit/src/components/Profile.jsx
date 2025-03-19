import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/profile.css";

// Get the current hostname for API calls (works on all devices)
const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:7900`;

// Additional avatar options with more variety
const avatarOptions = [
  "/avatars/avatar1.png",
  "/avatars/avatar2.png",
  "/avatars/avatar3.png",
  "/avatars/avatar4.png",
  "/avatars/avatar5.png",
  "/avatars/avatar6.png",
  "/avatars/avatar7.png",
  "/avatars/avatar8.png",
];

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({ 
    username: "", 
    email: "",
    avatar: "", 
    bio: "",
    financialGoals: [],
    newGoal: ""
  });
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    coursesCompleted: 0,
    gamesPlayed: 0,
    learningStreakDays: 0
  });

  // Financial goal suggestions
  const goalSuggestions = [
    "Save for an emergency fund",
    "Pay off credit card debt",
    "Start investing regularly",
    "Save for retirement",
    "Create a monthly budget",
    "Improve credit score",
    "Save for a down payment on a house"
  ];

  useEffect(() => {
    const checkAuth = () => {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        navigate("/login");
      } else {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        fetchUserProfile(userData.id);
      }
    };
    
    checkAuth();
  }, [navigate]);

  const fetchUserProfile = async (userId) => {
    try {
      setLoading(true);
      
      // First fetch basic profile info
      const profileResponse = await fetch(`${API_BASE_URL}/profile/${userId}`);
      if (!profileResponse.ok) throw new Error("Failed to fetch profile");
      
      const profileData = await profileResponse.json();
      
      // Then fetch dashboard data for stats
      const dashboardResponse = await fetch(`${API_BASE_URL}/dashboard/${userId}`);
      let dashboardData = {};
      
      if (dashboardResponse.ok) {
        dashboardData = await dashboardResponse.json();
      }
      
      // Initialize form data with profile info
      setFormData({ 
        username: profileData.username || "", 
        email: profileData.email || "",
        avatar: profileData.avatar || avatarOptions[0],
        bio: profileData.bio || "I'm excited to learn about finance!",
        financialGoals: profileData.financialGoals || [],
        newGoal: ""
      });
      
      // Set user stats
      setStats({
        coursesCompleted: dashboardData.totalCoursesCompleted || 0,
        gamesPlayed: (dashboardData.gameProgress || []).length,
        learningStreakDays: dashboardData.learningStreak || 0
      });
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setMessage("Failed to load profile data. Please try again.");
      setMessageType("error");
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addFinancialGoal = () => {
    if (!formData.newGoal.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      financialGoals: [...prev.financialGoals, prev.newGoal],
      newGoal: ""
    }));
  };

  const removeFinancialGoal = (index) => {
    setFormData(prev => ({
      ...prev,
      financialGoals: prev.financialGoals.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setMessage("");
      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: user.id, 
          username: formData.username, 
          avatar: formData.avatar,
          bio: formData.bio,
          financialGoals: formData.financialGoals
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage(data.message || "Profile updated successfully!");
        setMessageType("success");
        
        // Update local storage with new username and avatar
        const updatedUser = {
          ...user,
          username: formData.username,
          avatar: formData.avatar
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        // Dispatch event to update other components
        window.dispatchEvent(new Event('loginStatusChange'));
        
        // Exit edit mode
        setIsEditing(false);
      } else {
        setMessage(data.message || "Failed to update profile");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage("An error occurred while updating your profile.");
      setMessageType("error");
    }
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar">
          <img src={formData.avatar || "/avatars/avatar1.png"} alt="User Avatar" />
          {isEditing && (
            <button className="change-avatar-btn" onClick={() => document.getElementById('avatar-selection').scrollIntoView()}>
              Change Avatar
            </button>
          )}
        </div>
        <div className="profile-info">
          <h1>{formData.username}</h1>
          <p className="profile-email">{formData.email}</p>
          {!isEditing ? (
            <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>
              Edit Profile
            </button>
          ) : (
            <button className="cancel-edit-btn" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="profile-stats">
        <div className="stat-card">
          <span className="stat-value">{stats.coursesCompleted}</span>
          <span className="stat-label">Courses Completed</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.gamesPlayed}</span>
          <span className="stat-label">Games Played</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.learningStreakDays}</span>
          <span className="stat-label">Day Streak</span>
        </div>
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-section">
            <h2>Basic Information</h2>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows="3"
                placeholder="Tell us a bit about yourself..."
              />
            </div>
          </div>

          <div className="form-section" id="avatar-selection">
            <h2>Choose Avatar</h2>
            <div className="avatar-grid">
              {avatarOptions.map((avatar, index) => (
                <div 
                  key={index} 
                  className={`avatar-option ${formData.avatar === avatar ? "selected" : ""}`}
                  onClick={() => setFormData({ ...formData, avatar })}
                >
                  <img src={avatar} alt={`Avatar ${index + 1}`} />
                </div>
              ))}
            </div>
          </div>

          <div className="form-section">
            <h2>Financial Goals</h2>
            <div className="goals-list">
              {formData.financialGoals.length > 0 ? (
                formData.financialGoals.map((goal, index) => (
                  <div key={index} className="goal-item">
                    <span>{goal}</span>
                    <button 
                      type="button" 
                      className="remove-goal-btn"
                      onClick={() => removeFinancialGoal(index)}
                    >
                      ✕
                    </button>
                  </div>
                ))
              ) : (
                <p className="no-goals">No financial goals added yet.</p>
              )}
            </div>

            <div className="add-goal">
              <input
                type="text"
                name="newGoal"
                value={formData.newGoal}
                onChange={handleInputChange}
                placeholder="Add a new financial goal..."
              />
              <button 
                type="button" 
                className="add-goal-btn"
                onClick={addFinancialGoal}
              >
                Add
              </button>
            </div>

            <div className="goal-suggestions">
              <h3>Suggestions:</h3>
              <div className="suggestion-tags">
                {goalSuggestions.map((suggestion, index) => (
                  <span 
                    key={index} 
                    className="suggestion-tag"
                    onClick={() => setFormData({...formData, newGoal: suggestion})}
                  >
                    {suggestion}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button type="submit" className="save-profile-btn">Save Profile</button>
        </form>
      ) : (
        <div className="profile-details">
          <div className="profile-section">
            <h2>About Me</h2>
            <p className="profile-bio">{formData.bio}</p>
          </div>

          <div className="profile-section">
            <h2>My Financial Goals</h2>
            {formData.financialGoals.length > 0 ? (
              <ul className="goals-display">
                {formData.financialGoals.map((goal, index) => (
                  <li key={index} className="goal-display-item">
                    <span className="goal-icon">🎯</span> {goal}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-goals">No financial goals added yet. Edit your profile to add some!</p>
            )}
          </div>
        </div>
      )}

      {message && (
        <div className={`profile-message ${messageType}`}>
          {message}
        </div>
      )}
    </div>
  );
}

export default Profile;