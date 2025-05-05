/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-unused-vars */
import { useState, useEffect, useContext } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import PropTypes from 'prop-types';
import '../styles/MoneyMatch.css';
import { ThemeContext } from '../context/ThemeContext.jsx';

// API Base URL (works on all devices)
const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:7900`;

const EASY_BUDGET = 1500;
const HARD_BUDGET = 800;

// Array of expense items available for the budgeting challenge
const items = [
  { id: 1, name: 'Rent', category: 'Essentials', cost: 500 },
  { id: 2, name: 'Netflix Subscription', category: 'Luxuries', cost: 15 },
  { id: 3, name: 'Groceries', category: 'Essentials', cost: 200 },
  { id: 4, name: 'Concert Tickets', category: 'Luxuries', cost: 100 },
  { id: 5, name: 'Electricity Bill', category: 'Essentials', cost: 80 },
  { id: 6, name: 'Vacation Trip', category: 'Luxuries', cost: 300 },
  { id: 7, name: 'Emergency Savings', category: 'Savings', cost: 200 },
  { id: 8, name: 'Gym Membership', category: 'Luxuries', cost: 50 },
  { id: 9, name: 'Health Insurance', category: 'Essentials', cost: 150 },
  { id: 10, name: 'Dining Out', category: 'Luxuries', cost: 120 },
  { id: 11, name: 'Retirement Fund', category: 'Savings', cost: 150 },
  { id: 12, name: 'Phone Bill', category: 'Essentials', cost: 60 },
];

// Component that renders an individual draggable expense item
function DraggableItem({ item, isUsed }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'ITEM',
    item,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: !isUsed,
  }));

  return (
    <div
      ref={drag}
      className={`draggable-item ${isDragging ? 'dragging' : ''} ${isUsed ? 'used' : ''}`}
      data-category={item.category}
    >
      <span>{item.name}</span>
      <span className="item-cost">${item.cost}</span>
    </div>
  );
}

// Component representing a drop zone for a specific budget category
function DropZone({ category, onDrop, allocatedItems, totalCost }) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'ITEM',
    drop: (item) => onDrop(item, category),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div className={`drop-zone ${isOver ? 'over' : ''}`} ref={drop}>
      <h3>{category}</h3>
      <p>Total: ${totalCost}</p>
      {allocatedItems.map((item) => (
        <div key={item.id} className="dropped-item">
          <span>{item.name}</span>
          <span className="item-cost">${item.cost}</span>
        </div>
      ))}
    </div>
  );
}

// Main component encompassing the Money Budgeting Challenge logic and interface
function MoneyMatch() {
  // States for budget, allocations and game status
  const [budgetLimit, setBudgetLimit] = useState(EASY_BUDGET);
  const [essentials, setEssentials] = useState([]);
  const [luxuries, setLuxuries] = useState([]);
  const [savings, setSavings] = useState([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [usedItems, setUsedItems] = useState(new Set());
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });
  const [showHints, setShowHints] = useState(false);
  const [showObjectives, setShowObjectives] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [shake, setShake] = useState(false);
  const [confetti, setConfetti] = useState([]);
  const { theme } = useContext(ThemeContext);

  // States for user and progress tracking
  const [user, setUser] = useState(null);
  const [progressStats, setProgressStats] = useState({
    gamesPlayed: 0,
    gamesCompleted: 0,
    highScore: 0,
    achievements: [],
    level: 1,
    lastGameTimestamp: null,
  });
  const [sessionTracked, setSessionTracked] = useState(false);
  const [dashboardSynced, setDashboardSynced] = useState(false);

  // Retrieve user and progress details from localStorage on initial render
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    const storedProgress = localStorage.getItem('moneyMatchProgress');
    if (storedProgress) {
      setProgressStats(JSON.parse(storedProgress));
    }
    // Begin the game session tracking if not already initialised
    if (!sessionTracked) {
      trackGameSession();
    }
  }, []);

  // Function to record the commencement of a game session
  const trackGameSession = async () => {
    if (!user) return;
    try {
      const response = await fetch(`${API_BASE_URL}/progress/game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          gameId: 'money-match',
          title: 'Money Budgeting Challenge - Session Start',
          score: 0,
          metadata: JSON.stringify({
            sessionStart: true,
            timestamp: new Date().toISOString(),
            difficulty: budgetLimit === EASY_BUDGET ? 'easy' : 'hard',
          }),
        }),
      });

      if (response.ok) {
        setSessionTracked(true);
        showAlert('Game session started! Progress will be tracked.', 'info');
      }
    } catch (error) {
      console.error('Failed to track game session:', error);
    }
  };

  // Generate confetti particles once the game is completed
  useEffect(() => {
    if (gameCompleted) {
      const confettiArray = [];
      for (let i = 0; i < 50; i++) {
        confettiArray.push({
          id: i,
          x: `${Math.random() * 100}%`,
          y: `-${Math.random() * 10}px`,
          color: ['#4facfe', '#00f2fe', '#38b2ac', '#ed8936', '#4299e1'][Math.floor(Math.random() * 5)],
          size: Math.random() * 10 + 5,
          delay: Math.random() * 3,
        });
      }
      setConfetti(confettiArray);
      // Update progress details on game completion
      updateProgress();
    }
  }, [gameCompleted]);

  // Function to display temporary alert notifications
  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: '' }), 3000);
  };

  // Process the dropping of an expense item into a budget category
  const handleDrop = (item, category) => {
    if (usedItems.has(item.id)) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      showAlert('This item has already been allocated!', 'error');
      return;
    }

    if (totalSpent + item.cost > budgetLimit) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      showAlert('Adding this would exceed your budget limit!', 'error');
      return;
    }

    setUsedItems(new Set([...usedItems, item.id]));

    if (category === 'Essentials') setEssentials((prev) => [...prev, item]);
    if (category === 'Luxuries') setLuxuries((prev) => [...prev, item]);
    if (category === 'Savings') setSavings((prev) => [...prev, item]);

    setTotalSpent((prev) => prev + item.cost);
    showAlert(`Added ${item.name} to ${category}.`, 'success');

    // Verify if the game completion criteria have been met
    if (essentials.length > 0 && savings.length > 0) {
      if ((totalSpent + item.cost) >= budgetLimit * 0.8) {
        setGameCompleted(true);
      }
    }
  };

  // Update user progress, calculate score and assign achievements post game completion
  const updateProgress = () => {
    const essentialsPercentage = Math.round((essentials.reduce((sum, item) => sum + item.cost, 0) / budgetLimit) * 100);
    const luxuriesPercentage = Math.round((luxuries.reduce((sum, item) => sum + item.cost, 0) / budgetLimit) * 100);
    const savingsPercentage = Math.round((savings.reduce((sum, item) => sum + item.cost, 0) / budgetLimit) * 100);

    const idealEssentials = 50;
    const idealLuxuries = 30;
    const idealSavings = 20;

    const essentialsDev = Math.abs(essentialsPercentage - idealEssentials);
    const luxuriesDev = Math.abs(luxuriesPercentage - idealLuxuries);
    const savingsDev = Math.abs(savingsPercentage - idealSavings);

    // Score is determined by deviation from the ideal percentages
    const score = Math.max(0, 100 - (essentialsDev + luxuriesDev + savingsDev));
    const newAchievements = [...progressStats.achievements];

    if (!newAchievements.includes('firstGame')) {
      newAchievements.push('firstGame');
      showAlert('Achievement Unlocked: Beginner Budgeter! 🔰', 'success');
    }

    if (!newAchievements.includes('perfectBalance') && essentialsDev <= 5 && luxuriesDev <= 5 && savingsDev <= 5) {
      newAchievements.push('perfectBalance');
      showAlert('Achievement Unlocked: Balance Master! ⚖️', 'success');
    }

    if (!newAchievements.includes('moneyWise') && budgetLimit === HARD_BUDGET) {
      newAchievements.push('moneyWise');
      showAlert('Achievement Unlocked: Money Wise! 🧠', 'success');
    }

    if (!newAchievements.includes('savingsChamp') && savingsPercentage >= 30) {
      newAchievements.push('savingsChamp');
      showAlert('Achievement Unlocked: Savings Champion! 🏆', 'success');
    }

    const newGamesCompleted = progressStats.gamesCompleted + 1;
    if (!newAchievements.includes('fiveGames') && newGamesCompleted >= 5) {
      newAchievements.push('fiveGames');
      showAlert('Achievement Unlocked: Consistency! 🔄', 'success');
    }

    if (!newAchievements.includes('tenGames') && newGamesCompleted >= 10) {
      newAchievements.push('tenGames');
      showAlert('Achievement Unlocked: Budget Veteran! 🌟', 'success');
    }

    const newLevel = Math.floor(1 + (newGamesCompleted / 2) + (newAchievements.length / 2));
    const updatedStats = {
      gamesPlayed: progressStats.gamesPlayed + 1,
      gamesCompleted: newGamesCompleted,
      highScore: Math.max(progressStats.highScore, score),
      achievements: newAchievements,
      level: newLevel,
      lastGameTimestamp: new Date().toISOString(),
    };

    setProgressStats(updatedStats);
    localStorage.setItem('moneyMatchProgress', JSON.stringify(updatedStats));

    if (user) {
      trackGameProgress(score, updatedStats, {
        essentialsPercentage,
        luxuriesPercentage,
        savingsPercentage,
      });
    }
  };

  // Send the game progress and statistics to the server for synchronisation
  const trackGameProgress = async (score, updatedStats, budgetBreakdown) => {
    if (!user) return;
    try {
      const response = await fetch(`${API_BASE_URL}/progress/game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          gameId: 'money-match',
          title: 'Money Budgeting Challenge',
          score,
          metadata: JSON.stringify({
            difficulty: budgetLimit === EASY_BUDGET ? 'easy' : 'hard',
            essentialsPercentage: budgetBreakdown.essentialsPercentage,
            luxuriesPercentage: budgetBreakdown.luxuriesPercentage,
            savingsPercentage: budgetBreakdown.savingsPercentage,
            totalSpent,
            budgetLimit,
            achievements: updatedStats.achievements,
            level: updatedStats.level,
            gameCompleted: true,
            timestamp: new Date().toISOString(),
            gameStats: {
              usedItems: usedItems.size,
              remainingBudget: budgetLimit - totalSpent,
              completionPercentage: Math.round((totalSpent / budgetLimit) * 100),
            },
          }),
        }),
      });

      if (response.ok) {
        setDashboardSynced(true);
        showAlert('Progress saved to your dashboard!', 'success');
      }
    } catch (error) {
      console.error('Failed to track game progress:', error);
    }
  };

  // Reset all game states to start a new session
  const resetGame = () => {
    setEssentials([]);
    setLuxuries([]);
    setSavings([]);
    setTotalSpent(0);
    setUsedItems(new Set());
    setAlert({ show: false, message: '', type: '' });
    setGameCompleted(false);
    setConfetti([]);
    setDashboardSynced(false);
    setSessionTracked(false);
    trackGameSession();
  };

  // Compute allocation percentages for each category
  const essentialsPercentage = Math.round((essentials.reduce((sum, item) => sum + item.cost, 0) / budgetLimit) * 100) || 0;
  const luxuriesPercentage = Math.round((luxuries.reduce((sum, item) => sum + item.cost, 0) / budgetLimit) * 100) || 0;
  const savingsPercentage = Math.round((savings.reduce((sum, item) => sum + item.cost, 0) / budgetLimit) * 100) || 0;

  // Provide a status based on the remaining budget for visual feedback
  const getBudgetStatus = () => {
    const remainingPercentage = 100 - (totalSpent / budgetLimit * 100);
    if (remainingPercentage > 20) return 'good';
    if (remainingPercentage > 5) return 'warning';
    return 'danger';
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={`game-container ${shake ? 'shake-animation' : ''} ${theme === 'dark' ? 'dark-theme' : ''}`}></div>
      <div className={`game-container ${shake ? 'shake-animation' : ''}`}>
        {user && (
          <div className="dashboard-indicator">
            <span className="dashboard-icon">📊</span>
            <span className="dashboard-text">Progress tracking enabled</span>
          </div>
        )}

        <div className={`difficulty-indicator ${budgetLimit === EASY_BUDGET ? 'easy' : 'hard'}`}>
          {budgetLimit === EASY_BUDGET ? 'EASY MODE' : 'HARD MODE'}
        </div>

        <h2>💰 Money Budgeting Challenge</h2>
        <p>Drag and drop expenses into the correct categories while staying within your budget. Make sure to include both essentials and savings!</p>

        <div className="helper-buttons">
          <button className="helper-btn hint-btn" onClick={() => setShowHints(true)}>
            Budgeting Tips
          </button>
          <button className="helper-btn objectives-btn" onClick={() => setShowObjectives(true)}>
            Game Objectives
          </button>
        </div>

        <div className="budget-selector">
          <label>
            Select Difficulty:
            <select
              onChange={(e) => {
                setBudgetLimit(e.target.value === 'Easy' ? EASY_BUDGET : HARD_BUDGET);
                resetGame();
              }}
            >
              <option value="Easy">Easy ($1500)</option>
              <option value="Hard">Hard ($800)</option>
            </select>
          </label>
        </div>

        <h3 className="budget">Budget: ${budgetLimit} | Spent: ${totalSpent} | Remaining: ${budgetLimit - totalSpent}</h3>

        <div className="budget-progress">
          <div className="budget-progress-label">
            <span>Budget Usage</span>
            <span>{Math.round((totalSpent / budgetLimit) * 100)}%</span>
          </div>
          <div className="budget-progress-bar">
            <div className="budget-progress-fill" style={{ width: `${(totalSpent / budgetLimit) * 100}%` }}></div>
          </div>
        </div>

        <div className={`budget-status ${getBudgetStatus()}`}>
          {getBudgetStatus() === 'good'
            ? '👍 Budget looking good! Keep allocating wisely.'
            : getBudgetStatus() === 'warning'
              ? '⚠️ Budget getting tight. Choose carefully!'
              : '🚨 Budget almost maxed out!'}
        </div>

        <div className="game-board">
          <div className="items-container">
            {items.map((item) => (
              <DraggableItem key={item.id} item={item} isUsed={usedItems.has(item.id)} />
            ))}
          </div>
          <div className="drop-zones">
            <DropZone
              category="Essentials"
              onDrop={handleDrop}
              allocatedItems={essentials}
              totalCost={essentials.reduce((sum, item) => sum + item.cost, 0)}
            />
            <DropZone
              category="Luxuries"
              onDrop={handleDrop}
              allocatedItems={luxuries}
              totalCost={luxuries.reduce((sum, item) => sum + item.cost, 0)}
            />
            <DropZone
              category="Savings"
              onDrop={handleDrop}
              allocatedItems={savings}
              totalCost={savings.reduce((sum, item) => sum + item.cost, 0)}
            />
          </div>
        </div>

        <div className="budget-breakdown">
          <h3 className="breakdown-title">Your Budget Breakdown</h3>
          <div className="breakdown-items">
            <div className="breakdown-item">
              <div className="breakdown-label">
                <span className="budget-icon essentials"></span>
                Essentials
              </div>
              <div className="breakdown-value">{essentialsPercentage}%</div>
            </div>
            <div className="breakdown-item">
              <div className="breakdown-label">
                <span className="budget-icon luxuries"></span>
                Luxuries
              </div>
              <div className="breakdown-value">{luxuriesPercentage}%</div>
            </div>
            <div className="breakdown-item">
              <div className="breakdown-label">
                <span className="budget-icon savings"></span>
                Savings
              </div>
              <div className="breakdown-value">{savingsPercentage}%</div>
            </div>
          </div>
        </div>

        <div className="action-buttons center-only-reset">
          <button className="reset-btn" onClick={resetGame}>🔄 Reset Game</button>
        </div>

        {alert.show && (
          <div className={`alert ${alert.type}`}>
            {alert.message}
          </div>
        )}

        {showHints && (
          <div className="helper-modal">
            <div className="helper-content">
              <button className="helper-close" onClick={() => setShowHints(false)}>×</button>
              <h3 className="helper-title">Budgeting Tips 💡</h3>
              <p className="helper-text">Follow these financial best practices:</p>
              <ul className="helper-list">
                <li>Aim to spend 50-60% of your budget on <strong>Essentials</strong> (needs)</li>
                <li>Limit <strong>Luxuries</strong> (wants) to 20-30% of your budget</li>
                <li>Try to allocate at least 20% of your budget to <strong>Savings</strong></li>
                <li>Always prioritise essential expenses before luxuries</li>
                <li>Consider the 50/30/20 rule: 50% needs, 30% wants, 20% savings</li>
              </ul>
              <p className="helper-text">Remember, sound budgeting is about making informed choices aligned with your financial goals!</p>
            </div>
          </div>
        )}

        {showObjectives && (
          <div className="helper-modal">
            <div className="helper-content">
              <button className="helper-close" onClick={() => setShowObjectives(false)}>×</button>
              <h3 className="helper-title">Game Objectives 🎯</h3>
              <p className="helper-text">To triumph in the Money Budgeting Challenge:</p>
              <ul className="helper-list">
                <li>Drag and drop items into their correct categories</li>
                <li>Remain within your budget limit (${budgetLimit})</li>
                <li>Ensure that essential expenses are included</li>
                <li>Allocate a portion of funds to savings</li>
                <li>Utilise at least 80% of your available budget</li>
                <li>Create a balanced budget that is realistic</li>
              </ul>
              <p className="helper-text">Test yourself with hard mode once you have mastered the basics!</p>
            </div>
          </div>
        )}

        {gameCompleted && (
          <div className="game-completion">
            {confetti.map(particle => (
              <div
                key={particle.id}
                className="confetti"
                style={{
                  left: particle.x,
                  top: particle.y,
                  backgroundColor: particle.color,
                  width: `${particle.size}px`,
                  height: `${particle.size}px`,
                  animationDelay: `${particle.delay}s`,
                }}
              />
            ))}
            <div className="completion-content">
              <h2 className="completion-title">Excellent Budgeting! 🎉</h2>
              <p className="completion-message">
                You have successfully devised a balanced budget. Your careful allocation of funds demonstrates sound financial decision-making.
              </p>
              <div className="completion-stats">
                <div className="completion-stat">
                  <div className="completion-stat-label">Budget Used</div>
                  <div className="completion-stat-value">{Math.round((totalSpent / budgetLimit) * 100)}%</div>
                </div>
                <div className="completion-stat">
                  <div className="completion-stat-label">Savings Rate</div>
                  <div className="completion-stat-value">{savingsPercentage}%</div>
                </div>
                <div className="completion-stat">
                  <div className="completion-stat-label">Essentials</div>
                  <div className="completion-stat-value">${essentials.reduce((sum, item) => sum + item.cost, 0)}</div>
                </div>
                <div className="completion-stat">
                  <div className="completion-stat-label">Luxuries</div>
                  <div className="completion-stat-value">${luxuries.reduce((sum, item) => sum + item.cost, 0)}</div>
                </div>
                <div className="completion-stat">
                  <div className="completion-stat-label">Level Progress</div>
                  <div className="completion-stat-value">Level {progressStats.level}</div>
                </div>
              </div>
              {user && (
                <div className={`dashboard-sync-status ${dashboardSynced ? 'synced' : 'syncing'}`}>
                  <span className="sync-icon">{dashboardSynced ? '✓' : '⟳'}</span>
                  <span className="sync-text">
                    {dashboardSynced ? 'Progress saved to your dashboard!' : 'Syncing with your dashboard...'}
                  </span>
                </div>
              )}
              <div className="completion-buttons">
                <button className="completion-btn play-again-btn" onClick={resetGame}>
                  Play Again
                </button>
                {user && (
                  <button className="completion-btn dashboard-btn" onClick={() => { window.location.href = '/dashboard'; }}>
                    Go to Dashboard
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
}

// PropTypes for DraggableItem
DraggableItem.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    cost: PropTypes.number.isRequired,
  }).isRequired,
  isUsed: PropTypes.bool.isRequired,
};

// PropTypes for DropZone
DropZone.propTypes = {
  category: PropTypes.string.isRequired,
  onDrop: PropTypes.func.isRequired,
  allocatedItems: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      category: PropTypes.string.isRequired,
      cost: PropTypes.number.isRequired,
    }),
  ).isRequired,
  totalCost: PropTypes.number.isRequired,
};

export default MoneyMatch;
