/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Challenges.css';

// Set the base URL for API calls using the current window hostname and protocol
const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:7900`;

function Challenges() {
  const navigate = useNavigate();

  // Local state declarations for user, challenges, modals, settings, etc.
  const [user, setUser] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [activeTab, setActiveTab] = useState('active');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedQuizType, setSelectedQuizType] = useState('standard');
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [selectedTimer, setSelectedTimer] = useState(30);
  const [selectedQuestionCount, setSelectedQuestionCount] = useState(10);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState({
    'multiple-choice': true,
    'true-false': true,
    'fill-blank': true,
    'matching': true,
    'calculation': true,
  });

  // Options for quiz types, difficulties, timer values, etc.
  const quizTypeOptions = [
    { value: 'standard', label: 'Standard Quiz', icon: '📚' },
    { value: 'progressive', label: 'Progressive Difficulty', icon: '📈' },
    { value: 'marathon', label: 'Marathon Mode', icon: '🏃' },
  ];

  const difficultiesOptions = ['easy', 'medium', 'hard'];
  const timerOptions = [15, 30, 45, 60];
  const questionCountOptions = [5, 10, 15, 20];
  const financialCategories = [
    { id: 'all', name: 'All Topics', icon: '📚' },
    { id: 'investing', name: 'Investing', icon: '📈' },
    { id: 'budgeting', name: 'Budgeting', icon: '💰' },
    { id: 'savings', name: 'Savings', icon: '🏦' },
    { id: 'credit', name: 'Credit', icon: '💳' },
    { id: 'taxes', name: 'Taxes', icon: '📝' },
    { id: 'retirement', name: 'Retirement', icon: '🏖️' },
    { id: 'insurance', name: 'Insurance', icon: '🛡️' },
    { id: 'debt', name: 'Debt Management', icon: '⚖️' },
  ];

  const questionTypes = [
    { value: 'multiple-choice', label: 'Multiple Choice', icon: '🔠' },
    { value: 'true-false', label: 'True/False', icon: '✓✗' },
    { value: 'fill-blank', label: 'Fill in the Blank', icon: '📝' },
    { value: 'matching', label: 'Matching', icon: '🔄' },
    { value: 'calculation', label: 'Financial Calculations', icon: '🧮' },
  ];

  // useEffect to check for stored user data in localStorage; if not, redirect to login
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  // useEffect to fetch challenges and users when the user or active tab changes
  useEffect(() => {
    if (user) {
      fetchChallenges();
      fetchUsers();
    }
  }, [user, activeTab]);

  // Fetch challenges for the current user depending on the active tab (active or completed)
  const fetchChallenges = async () => {
    try {
      setLoading(true);
      let response;

      if (activeTab === 'active') {
        response = await fetch(`${API_BASE_URL}/challenges/user/${user.id}`);
      } else {
        response = await fetch(`${API_BASE_URL}/challenges/user/${user.id}?status=completed`);
      }

      if (!response.ok) throw new Error('Failed to fetch challenges');

      const data = await response.json();

      if (activeTab === 'active') {
        // Filter challenges to only display pending or accepted ones
        const activeChallenges = data.filter(challenge =>
          challenge.status === 'pending' || challenge.status === 'accepted',
        );
        setChallenges(activeChallenges);
      } else {
        setChallenges(data);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching challenges:', err);
      setError('Failed to load challenges');
      setLoading(false);
    }
  };

  // Fetch list of users (to select as opponents) excluding the current user
  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.filter(u => u.id !== user.id));
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  // Create a new challenge with the selected options and send it to the API
  const handleCreateChallenge = async () => {
    if (!selectedUser) return;

    try {
      // Filter out the enabled question types
      const selectedTypes = Object.entries(selectedQuestionTypes)
        .filter(([_, enabled]) => enabled)
        .map(([type]) => type);

      if (selectedTypes.length === 0) {
        alert('Please select at least one question type');
        return;
      }

      // Consolidate quiz settings for the challenge
      const quizSettings = {
        quizType: selectedQuizType,
        difficulty: selectedDifficulty,
        timer: selectedTimer,
        questionCount: selectedQuestionCount,
        category: selectedCategory,
        questionTypes: selectedTypes,
      };

      console.log('Creating challenge with settings:', quizSettings);

      const response = await fetch(`${API_BASE_URL}/challenges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          challengerId: user.id,
          challengedId: selectedUser,
          gameType: 'financial-trivia',
          gameMode: 'standard',
          quizSettings,
        }),
      });

      if (!response.ok) throw new Error('Failed to create challenge');

      // Close modal and refresh challenges
      setShowCreateModal(false);
      setSelectedUser('');
      fetchChallenges();
    } catch (err) {
      console.error('Error creating challenge:', err);
      alert('Failed to create challenge');
    }
  };

  // Format quiz settings to be displayed on challenge cards
  const formatQuizSettings = (settings) => {
    if (!settings) return 'Standard Settings';
    return `${settings.quizType} • ${settings.difficulty} • ${settings.questionCount}Q • ${settings.timer}s`;
  };

  // Format date strings into a more readable format
  const formatDateTime = (dateString) => {
    const options = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return new Date(dateString).toLocaleString(undefined, options);
  };

  // Accept a challenge by sending a POST request to the API
  const handleAcceptChallenge = async (challengeId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/challenges/${challengeId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to accept challenge');

      fetchChallenges();
    } catch (err) {
      console.error('Error accepting challenge:', err);
      alert('Failed to accept challenge');
    }
  };

  // Navigate to the game play view for the selected challenge
  const handlePlayChallenge = (challenge) => {
    navigate(`/games/quiz?challengeId=${challenge.id}`);
  };

  // Delete a challenge via API call and refresh the list after deletion
  const handleDeleteChallenge = async (challengeId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/challenges/${challengeId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to delete challenge');

      setDeleteConfirmation(null);

      alert('Challenge deleted successfully');

      fetchChallenges();
    } catch (err) {
      console.error('Error deleting challenge:', err);
      alert('Failed to delete challenge');
    }
  };

  // Determine the current status of a challenge from the perspective of the user
  const getChallengeStatus = (challenge) => {
    if (challenge.status === 'pending' && challenge.challengedId === user.id) {
      return 'awaiting_acceptance';
    }

    if (challenge.status === 'accepted') {
      const isChallenger = challenge.challengerId === user.id;
      const hasPlayed = isChallenger ? challenge.challengerScore !== null : challenge.challengedScore !== null;

      if (!hasPlayed) {
        return 'ready_to_play';
      }

      return 'waiting_opponent';
    }

    return challenge.status;
  };

  // Render a challenge card with its details and available actions
  const renderChallengeCard = (challenge) => {
    const status = getChallengeStatus(challenge);
    const isChallenger = challenge.challengerId === user.id;
    const opponent = isChallenger ? challenge.challengedUsername : challenge.challengerUsername;

    return (
      <div key={challenge.id} className="challenge-card">
        <div className="challenge-header">
          <span className="game-type">🧠 Financial Trivia</span>
          <span className={`challenge-status status-${status}`}>
            {status.replace(/_/g, ' ').toUpperCase()}
          </span>
        </div>

        {/* Display quiz settings if available */}
        {challenge.quizSettings && (
          <div className="challenge-settings">
            <span className="settings-badge">
              {formatQuizSettings(challenge.quizSettings)}
            </span>
          </div>
        )}

        <div className="challenge-players">
          <div className="player">
            <span className="player-label">You</span>
            <span className="player-score">
              {isChallenger ? challenge.challengerScore : challenge.challengedScore}
              {(isChallenger ? challenge.challengerScore : challenge.challengedScore) !== null && ' pts'}
            </span>
          </div>
          <div className="vs">VS</div>
          <div className="player">
            <span className="player-label">{opponent}</span>
            <span className="player-score">
              {isChallenger ? challenge.challengedScore : challenge.challengerScore}
              {(isChallenger ? challenge.challengedScore : challenge.challengerScore) !== null && ' pts'}
            </span>
          </div>
        </div>

        <div className="challenge-actions">
          {status === 'awaiting_acceptance' && (
            <button className="btn-accept" onClick={() => handleAcceptChallenge(challenge.id)}>
              Accept Challenge
            </button>
          )}
          {status === 'ready_to_play' && (
            <button className="btn-play" onClick={() => handlePlayChallenge(challenge)}>
              Play Now
            </button>
          )}
          {status === 'waiting_opponent' && (
            <div className="waiting-text">Waiting for opponent...</div>
          )}
          {status === 'completed' && (
            <div className="result">
              {challenge.winnerId === user.id
                ? '🏆 You Won!'
                : challenge.winnerId === null ? "🤝 It's a Tie!" : '❌ You Lost'}
            </div>
          )}

          {/* Display delete button only for challenges created by the current user */}
          {isChallenger && (
            <button
              className="btn-delete"
              onClick={() => setDeleteConfirmation(challenge.id)}
              title="Delete this challenge"
            >
              🗑️ Delete
            </button>
          )}
        </div>

        <div className="challenge-footer">
          <span className="prize">🏆 {challenge.prizePoints} points</span>
          <span className="date">{formatDateTime(challenge.createdAt)}</span>
        </div>
      </div>
    );
  };

  // Show a loading spinner when data is being fetched
  if (loading) {
    return (
      <div className="challenges-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading challenges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="challenges-container">
      <h2>⚔️ Challenges</h2>
      <p className="challenges-intro">
        Challenge your friends to financial trivia battles and earn points!
      </p>

      {/* Button to open the create challenge modal */}
      <button className="btn-create-challenge" onClick={() => setShowCreateModal(true)}>
        Create New Challenge
      </button>

      <div className="challenges-tabs">
        <button
          className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          🎯 Active Challenges
        </button>
        <button
          className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          ✅ Completed
        </button>
      </div>

      <div className="challenges-list">
        {challenges.map(renderChallengeCard)}

        {challenges.length === 0 && (
          <div className="no-challenges">
            <p>No {activeTab} challenges found.</p>
            {activeTab === 'active' && (
              <button onClick={() => setShowCreateModal(true)}>
                Create your first challenge!
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create Challenge Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content wide-modal">
            <h3>Create Challenge</h3>

            {/* Opponent selection dropdown */}
            <div className="form-group">
              <label>Select Opponent</label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
              >
                <option value="">Choose an opponent...</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.username}
                  </option>
                ))}
              </select>
            </div>

            {/* Quiz Settings Section */}
            <div className="quiz-settings-form">
              <h4>Quiz Settings</h4>
              <p className="settings-description">These settings will be used by both players</p>

              <div className="form-group">
                <label>Quiz Type</label>
                <select
                  value={selectedQuizType}
                  onChange={(e) => setSelectedQuizType(e.target.value)}
                >
                  {quizTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Difficulty</label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                >
                  {difficultiesOptions.map(diff => (
                    <option key={diff} value={diff}>
                      {diff.charAt(0).toUpperCase() + diff.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Timer (seconds)</label>
                <select
                  value={selectedTimer}
                  onChange={(e) => setSelectedTimer(Number(e.target.value))}
                >
                  {timerOptions.map(time => (
                    <option key={time} value={time}>
                      {time} seconds
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Number of Questions</label>
                <select
                  value={selectedQuestionCount}
                  onChange={(e) => setSelectedQuestionCount(Number(e.target.value))}
                >
                  {questionCountOptions.map(count => (
                    <option key={count} value={count}>
                      {count} questions
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {financialCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Question Types</label>
                <div className="question-types-grid">
                  {[
                    { value: 'multiple-choice', label: 'Multiple Choice', icon: '🔠' },
                    { value: 'true-false', label: 'True/False', icon: '✓✗' },
                    { value: 'fill-blank', label: 'Fill in the Blank', icon: '📝' },
                    { value: 'matching', label: 'Matching', icon: '🔄' },
                    { value: 'calculation', label: 'Financial Calculations', icon: '🧮' },
                  ].map(type => (
                    <label key={type.value} className="question-type-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedQuestionTypes[type.value]}
                        onChange={() => {
                          setSelectedQuestionTypes({
                            ...selectedQuestionTypes,
                            [type.value]: !selectedQuestionTypes[type.value],
                          });
                        }}
                      />
                      <span>{type.icon} {type.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal action buttons */}
            <div className="modal-actions">
              <button onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button
                onClick={handleCreateChallenge}
                disabled={!selectedUser}
                className="btn-primary"
              >
                Send Challenge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="modal-overlay">
          <div className="modal-content delete-modal">
            <h3>Delete Challenge</h3>
            <p>Are you sure you want to delete this challenge?</p>
            <div className="modal-actions">
              <button onClick={() => setDeleteConfirmation(null)}>Cancel</button>
              <button
                onClick={() => handleDeleteChallenge(deleteConfirmation)}
                className="btn-delete-confirm"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Challenges;
