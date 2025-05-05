/* eslint-disable no-unused-vars */
/* eslint-disable import/no-extraneous-dependencies */
import { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import '../styles/SavingsChallenge.css';
import Confetti from 'react-confetti';
import dropSound from '../assets/drop.mp3';
import removeSound from '../assets/remove.mp3';
import challengeSound from '../assets/challenge-completed.mp3';
import streakSound from '../assets/streak-bonus.mp3';
import goalSound from '../assets/goal-reached.mp3';
import { ThemeContext } from '../context/ThemeContext.jsx';

// Get the current hostname for API calls
const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:7900`;

// Initialise audio files for challenge, streak bonus and goal reached alerts
const challengeAudio = new Audio(challengeSound);
const streakAudio = new Audio(streakSound);
const goalAudio = new Audio(goalSound);

// Preset money denominations available for selection
const moneyOptions = [1, 5, 10, 20, 50];

// Daily challenges available for users
const challenges = [
  { text: 'Save at least £5 today!', minAmount: 5, reward: 2 },
  { text: 'Save at least £10 today!', minAmount: 10, reward: 5 },
  { text: 'Save exactly £7 today!', minAmount: 7, reward: 3 },
  { text: 'Save an even amount today!', isEven: true, reward: 4 },
  { text: 'Save a multiple of £5 today!', isMultipleOfFive: true, reward: 3 },
];

const SavingsChallenge = () => {
  // Retrieve savings data from local storage or initialise with 30 zeroes
  const [savings, setSavings] = useState(() => {
    const savedData = localStorage.getItem('savingsData');
    return savedData ? JSON.parse(savedData) : Array(30).fill(0);
  });

  // Calculate the total saved amount
  const [totalSaved, setTotalSaved] = useState(() => {
    return savings.reduce((acc, val) => acc + val, 0);
  });

  // Retrieve user's savings goal or set to default (£300)
  const [goal, setGoal] = useState(() => {
    const savedGoal = localStorage.getItem('savingsGoal');
    return savedGoal ? JSON.parse(savedGoal) : 300;
  });

  const [goalReached, setGoalReached] = useState(false);
  const [streak, setStreak] = useState(0);
  const [challenge, setChallenge] = useState(null);
  const [challengeCompleted, setChallengeCompleted] = useState(false);

  // Create audio objects for deposit and removal sounds
  const dropAudio = new Audio(dropSound);
  const removeAudio = new Audio(removeSound);

  // Notifications for user feedback
  const [notifications, setNotifications] = useState([]);
  // User details initialisation
  const [user, setUser] = useState(null);

  // Apply theme from the context
  const { theme } = useContext(ThemeContext);

  // Mute state persisted in local storage
  const [isMuted, setIsMuted] = useState(() => {
    const savedMute = localStorage.getItem('savingsMuted');
    return savedMute ? JSON.parse(savedMute) : false;
  });

  // Load user data from local storage after mounting
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Track game progress when savings are updated
  useEffect(() => {
    const trackActivity = async () => {
      if (!user) return;

      const today = new Date().toDateString();
      const lastTrackedDate = localStorage.getItem('lastTrackedDate');

      // Track once per day if savings have been updated
      if (totalSaved > 0 && lastTrackedDate !== today) {
        try {
          const response = await fetch(`${API_BASE_URL}/progress/game`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user.id,
              gameId: 'savings-challenge',
              title: '30-Day Savings Challenge',
              score: totalSaved,
              metadata: {
                currentStreak: streak,
                daysFilled: savings.filter(amount => amount > 0).length,
                totalSaved,
                goal,
                goalReached,
                challengeCompleted,
              },
            }),
          });

          if (response.ok) {
            localStorage.setItem('lastTrackedDate', today);
          }
        } catch (error) {
          console.error('Error tracking activity:', error);
        }
      }
    };

    trackActivity();
  }, [user, totalSaved, streak, goalReached, challengeCompleted]);

  // Initialise daily challenge and save progress
  useEffect(() => {
    const today = new Date().toDateString();
    const savedChallenge = localStorage.getItem('dailyChallenge');

    if (!savedChallenge || JSON.parse(savedChallenge).date !== today) {
      const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)];
      localStorage.setItem('dailyChallenge', JSON.stringify({ ...randomChallenge, date: today }));
      setChallenge(randomChallenge);
      setChallengeCompleted(false);
    } else {
      setChallenge(JSON.parse(savedChallenge));
    }

    localStorage.setItem('savingsData', JSON.stringify(savings));
    localStorage.setItem('savingsGoal', JSON.stringify(goal));
    setTotalSaved(savings.reduce((acc, val) => acc + val, 0));

    if (totalSaved >= goal && goal > 0) {
      setGoalReached(true);
      showNotification('🎉 Goal Reached! Well done!', 'success', goalAudio);
      setTimeout(() => setGoalReached(false), 5000);
    }
  }, [savings, goal, totalSaved]);

  // Display a notification with optional sound
  const showNotification = (message, type, sound) => {
    const newNotification = { id: Date.now(), message, type };
    setNotifications((prev) => [...prev, newNotification]);

    if (sound && !isMuted) sound.play();

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== newNotification.id));
    }, 4000);
  };

  // Toggle the mute state and persist the choice
  const toggleMute = () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    localStorage.setItem('savingsMuted', JSON.stringify(newMuteState));
  };

  // Check whether the current deposit meets the daily challenge criteria
  const checkChallengeCompletion = (amount) => {
    if (!challenge || challengeCompleted) return;

    let completed = false;

    if (challenge.minAmount && amount >= challenge.minAmount) {
      completed = true;
    } else if (challenge.isEven && amount % 2 === 0) {
      completed = true;
    } else if (challenge.isMultipleOfFive && amount % 5 === 0) {
      completed = true;
    }

    if (completed) {
      setChallengeCompleted(true);
      setSavings((prevSavings) => {
        const updatedSavings = [...prevSavings];
        updatedSavings[amount - 1] += challenge.reward;
        return updatedSavings;
      });
      showNotification('🎯 Daily Challenge Completed! Bonus Added!', 'success');
    }
  };

  // Manage depositing money into a day’s savings slot
  const handleDrop = (dayIndex, amount) => {
    const updatedSavings = [...savings];
    updatedSavings[dayIndex] += amount;

    if (!challengeCompleted && checkChallengeCompletion(amount)) {
      setChallengeCompleted(true);
      showNotification('🎯 Daily Challenge Completed! Bonus Added!', 'success', challengeAudio);
    }

    if (dayIndex > 0 && updatedSavings[dayIndex - 1] > 0) {
      setStreak((prev) => prev + 1);
    } else {
      setStreak(1);
    }

    if (streak >= 3) {
      updatedSavings[dayIndex] += 5;
      showNotification('🔥 Streak Bonus! +£5 Added!', 'success', streakAudio);
    }

    setSavings(updatedSavings);
    checkChallengeCompletion(amount);
    if (!isMuted) dropAudio.play();
  };

  // Manage removal of money from a day’s savings slot
  const handleRemove = (dayIndex) => {
    const removedAmount = savings[dayIndex];
    if (removedAmount > 0) {
      const updatedSavings = [...savings];
      updatedSavings[dayIndex] = 0;
      setSavings(updatedSavings);
      setStreak(0);
      if (!isMuted) removeAudio.play();
    }
  };

  // Reset all savings and related state data
  const resetSavings = () => {
    setSavings(Array(30).fill(0));
    setTotalSaved(0);
    setStreak(0);
    localStorage.removeItem('savingsData');
    setGoal(300);
    localStorage.removeItem('savingsGoal');
  };

  // Generate a weekly report of savings totals
  const getWeeklyReport = () => {
    const weeklyTotals = [];
    for (let i = 0; i < savings.length; i += 7) {
      const weekSum = savings.slice(i, i + 7).reduce((acc, val) => acc + val, 0);
      weeklyTotals.push(weekSum);
    }
    return weeklyTotals;
  };

  return (
      <div className={`savings-challenge ${theme === 'dark' ? 'dark-mode' : ''}`}>
          {goalReached && <Confetti />}

          <div className="notifications">
              {notifications.map((note) => (
                  <div key={note.id} className={`notification ${note.type}`}>
                      {note.message}
                  </div>
              ))}
          </div>

          <div className="savings-header">
              <h2>💰 30-Day Savings Challenge</h2>
              <p className="description">Drag and drop money into each day&apos;s slot. Click a slot to remove money.</p>

              {/* Mute toggle button */}
              <button
                  className="mute-button"
                  onClick={toggleMute}
                  aria-label={isMuted ? 'Unmute sounds' : 'Mute sounds'}
              >
                  {isMuted ? '🔇' : '🔊'}
              </button>
          </div>

          <div className="goal-container">
              <div className="goal-setting">
                  <label>Set Goal: £</label>
                  <input
                      type="number"
                      value={goal}
                      onChange={(e) => setGoal(Number(e.target.value))}
                  />
              </div>

              <div className="progress-overview">
                  <div className="progress-stat">
                      <span className="stat-value">£{totalSaved}</span>
                      <span className="stat-label">Total Saved</span>
                  </div>
                  <div className="progress-stat">
                      <span className="stat-value">{Math.round((totalSaved / goal) * 100)}%</span>
                      <span className="stat-label">Progress</span>
                  </div>
                  <div className="progress-stat">
                      <span className="stat-value">{streak}</span>
                      <span className="stat-label">Day Streak 🔥</span>
                  </div>
              </div>
          </div>

          <div className="money-options">
              {moneyOptions.map((amount) => (
                  <DraggableMoney key={amount} amount={amount} />
              ))}
          </div>

          <div className="grid">
              {savings.map((savedAmount, index) => (
                  <DaySlot
                      key={index}
                      day={index + 1}
                      savedAmount={savedAmount}
                      onDrop={handleDrop}
                      onRemove={handleRemove}
                  />
              ))}
          </div>

          <div className="progress-section">
              <div className="progress-info">
                  <div className="progress-label">
                      <h3>Progress to Goal</h3>
                      <span className="goal-info">Target: £{goal}</span>
                  </div>
                  <div className="progress-amount">
                      <span className="current-amount">£{totalSaved}</span>
                      <span className="remaining-amount">£{goal - totalSaved} to go</span>
                  </div>
              </div>

              <div className="progress-bar-container">
                  <div
                      className="progress-bar"
                      style={{ width: `${(totalSaved / goal) * 100}%` }}
                  >
                      <span className="progress-text">{Math.round((totalSaved / goal) * 100)}%</span>
                  </div>
              </div>

              <div className="progress-markers">
                  <span className="marker start">0%</span>
                  <span className="marker quarter">25%</span>
                  <span className="marker half">50%</span>
                  <span className="marker three-quarter">75%</span>
                  <span className="marker end">100%</span>
              </div>
          </div>

          {challenge && (
              <div className={`daily-challenge-card ${challengeCompleted ? 'completed' : ''}`}>
                  <h3>🎯 Daily Challenge</h3>
                  <p className="challenge-text">{challenge.text}</p>
                  <div className="challenge-status">
                      {challengeCompleted
                        ? (
                          <span className="completed-badge">✅ Completed!</span>
                          )
                        : (
                          <span className="pending-badge">❌ Not Completed</span>
                          )}
                  </div>
              </div>
          )}

          <div className="weekly-report">
              <h3>📊 Weekly Savings Report</h3>
              <div className="week-cards">
                  {getWeeklyReport().map((weekTotal, index) => (
                      <div key={index} className="week-card">
                          <h4>Week {index + 1}</h4>
                          <p className="week-total">£{weekTotal}</p>
                      </div>
                  ))}
              </div>
          </div>

          <button onClick={resetSavings} className="reset-btn">Reset Progress</button>
      </div>
  );
};

// Component for draggable money
const DraggableMoney = ({ amount }) => {
  // Initiate drag event and pass the amount data
  const handleDragStart = (e) => {
    e.dataTransfer.setData('amount', amount);
  };

  return (
        <div
            className="draggable-money"
            draggable
            onDragStart={handleDragStart}
        >
            💵 £{amount}
        </div>
  );
};

// Component representing each day in the challenge grid
const DaySlot = ({ day, savedAmount, onDrop, onRemove }) => {
  // Allow items to be dragged over
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Handle drop event and retrieve the deposited amount
  const handleDrop = (e) => {
    const amount = Number(e.dataTransfer.getData('amount'));
    onDrop(day - 1, amount);
  };

  return (
        <div
            className={`day-slot ${savedAmount > 0 ? 'filled' : ''}`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => onRemove(day - 1)}
        >
            <div className="day-number">Day {day}</div>
            <div className="day-amount">
                £{savedAmount}
            </div>
        </div>
  );
};

// PropTypes for the DaySlot component
DaySlot.propTypes = {
  day: PropTypes.number.isRequired,
  onDrop: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  savedAmount: PropTypes.number.isRequired,
};

// PropTypes for the DraggableMoney component
DraggableMoney.propTypes = {
  amount: PropTypes.number.isRequired,
};

export default SavingsChallenge;
