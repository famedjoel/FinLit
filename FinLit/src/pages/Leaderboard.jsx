/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
// src/pages/Leaderboard.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Leaderboard.css";

// Set API base URL dynamically
const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:7900`;

function Leaderboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("trivia");
  const [triviaLeaderboard, setTriviaLeaderboard] = useState([]);
  const [pointsLeaderboard, setPointsLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [userPoints, setUserPoints] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchLeaderboardData();
  }, [activeTab]);

  useEffect(() => {
    if (user) {
      fetchUserRankAndPoints();
    }
  }, [user, activeTab]);

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      if (activeTab === "trivia") {
        const response = await fetch(`${API_BASE_URL}/leaderboard/financial-trivia`);
        if (!response.ok) throw new Error("Failed to fetch trivia leaderboard");
        const data = await response.json();
        setTriviaLeaderboard(data);
      } else {
        const response = await fetch(`${API_BASE_URL}/leaderboard/points/top`);
        if (!response.ok) throw new Error("Failed to fetch points leaderboard");
        const data = await response.json();
        setPointsLeaderboard(data);
      }
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      setError("Failed to load leaderboard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRankAndPoints = async () => {
    try {
      if (activeTab === "trivia") {
        const response = await fetch(`${API_BASE_URL}/leaderboard/financial-trivia/user/${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setUserRank(data);
        }
      }
      const pointsResponse = await fetch(`${API_BASE_URL}/points/user/${user.id}`);
      if (pointsResponse.ok) {
        const data = await pointsResponse.json();
        setUserPoints(data);
      }
    } catch (err) {
      console.error("Error fetching user rank/points:", err);
    }
  };

  if (loading) {
    return (
      <div className="leaderboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="leaderboard-container">
      <h2>🏆 Leaderboard</h2>
      <p className="leaderboard-intro">
        See how you rank against other players in our Financial Literacy challenges!
      </p>

      {/* Tabs for switching between Trivia and Points */}
      <div className="leaderboard-tabs">
        <button 
          className={`tab-btn ${activeTab === "trivia" ? "active" : ""}`}
          onClick={() => setActiveTab("trivia")}
        >
          🧠 Trivia Champions
        </button>
        <button 
          className={`tab-btn ${activeTab === "points" ? "active" : ""}`}
          onClick={() => setActiveTab("points")}
        >
          💎 Total Points
        </button>
      </div>

      {/* Show user stats if logged in */}
      {user && userPoints && (
        <div className="user-stats-banner">
          <div className="user-stat">
            <span className="stat-label">Your Points</span>
            <span className="stat-value">{userPoints.total_points || 0}</span>
          </div>
          <div className="user-stat">
            <span className="stat-label">Challenges Won</span>
            <span className="stat-value">{userPoints.challenges_won || 0}</span>
          </div>
          {activeTab === "trivia" && userRank && (
            <div className="user-stat">
              <span className="stat-label">Your Rank</span>
              <span className="stat-value">#{userRank.rank}</span>
            </div>
          )}
        </div>
      )}

      {/* Main Leaderboard Content */}
      <div className="leaderboard-content">
        {activeTab === "trivia" ? (
          <div className="leaderboard-list">
            {triviaLeaderboard.map((player, index) => (
              <div key={player.userId} 
                   className={`leaderboard-item ${user && player.userId === user.id ? 'current-user' : ''}`}>
                <div className="rank">
                  {index < 3 ? (
                    <span className={`medal medal-${index + 1}`}>
                      {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                    </span>
                  ) : (
                    <span className="rank-number">#{index + 1}</span>
                  )}
                </div>
                <div className="player-info">
                  <img src={player.avatar || "/avatars/default.png"} alt="avatar" className="player-avatar" />
                  <span className="player-name">{player.username}</span>
                </div>
                <div className="player-score">
                  <span className="score-value">{player.totalPoints}</span>
                  <span className="score-label">points</span>
                </div>
                <div className="player-achievements">
                  <span className="achievement-badge">🏆 {player.challengesWon}</span>
                  <span className="achievement-badge">🎮 {player.challengesPlayed}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="leaderboard-list">
            {pointsLeaderboard.map((player, index) => (
              <div key={player.userId} 
                   className={`leaderboard-item ${user && player.userId === user.id ? 'current-user' : ''}`}>
                <div className="rank">
                  {index < 3 ? (
                    <span className={`medal medal-${index + 1}`}>
                      {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                    </span>
                  ) : (
                    <span className="rank-number">#{index + 1}</span>
                  )}
                </div>
                <div className="player-info">
                  <img src={player.avatar || "/avatars/default.png"} alt="avatar" className="player-avatar" />
                  <span className="player-name">{player.username}</span>
                </div>
                <div className="player-score">
                  <span className="score-value">{player.totalPoints}</span>
                  <span className="score-label">points</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA if not logged in */}
      {!user && (
        <div className="cta-login">
          <p>Login to see your rank and compete with others!</p>
          <button className="btn-login" onClick={() => navigate("/login")}>
            Login Now
          </button>
        </div>
      )}
    </div>
  );
}

export default Leaderboard;
