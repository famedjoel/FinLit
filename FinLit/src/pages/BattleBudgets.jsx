/* eslint-disable require-await */
import { useState, useEffect } from 'react';
import '../styles/BattleBudgets.css';

// Constants for starting budget and number of weeks.
const STARTING_BUDGET = 1000;
const WEEKS = 4;

// Predefined list of possible weekly expenses.
const expensesList = [
  { name: 'Rent', cost: 400, icon: '🏠' },
  { name: 'Groceries', cost: 100, icon: '🛒' },
  { name: 'Entertainment', cost: 50, icon: '🎭' },
  { name: 'Transportation', cost: 75, icon: '🚗' },
  { name: 'Dining Out', cost: 60, icon: '🍽️' },
  { name: 'Shopping', cost: 80, icon: '🛍️' },
  { name: 'Utilities', cost: 120, icon: '⚡' },
  { name: 'Internet', cost: 50, icon: '📡' },
];

// List of AI personalities with their preferences and probabilities.
const AI_PERSONALITIES = [
  {
    name: 'Saver Sam',
    emoji: '🦧',
    bias: 'save',
    description: 'Always saves money',
    probability: { save: 0.9, spend: 0.05, invest: 0.05 },
  },
  {
    name: 'Investor Ian',
    emoji: '📈',
    bias: 'invest',
    description: 'Loves to invest',
    probability: { save: 0.2, spend: 0.2, invest: 0.6 },
  },
  {
    name: 'Balanced Betty',
    emoji: '⚖️',
    bias: 'balanced',
    description: 'Makes balanced decisions',
    probability: { save: 0.4, spend: 0.3, invest: 0.3 },
  },
  {
    name: 'Spender Steve',
    emoji: '💸',
    bias: 'spend',
    description: 'Spends freely',
    probability: { save: 0.1, spend: 0.7, invest: 0.2 },
  },
];

const BattleBudgets = () => {
  // State hooks for game logic
  const [week, setWeek] = useState(1);
  const [playerMoney, setPlayerMoney] = useState(STARTING_BUDGET);
  const [aiMoney, setAiMoney] = useState(STARTING_BUDGET);
  const [expenses, setExpenses] = useState([]);
  const [message, setMessage] = useState('');
  const [gameHistory, setGameHistory] = useState([]);
  const [aiPersonality, setAiPersonality] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showTooltips, setShowTooltips] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [specialEvent, setSpecialEvent] = useState(null);

  // Base URL for API requests
  const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:7900`;

  // On initial load, select a random AI personality and generate expenses.
  useEffect(() => {
    const randomPersonality = AI_PERSONALITIES[Math.floor(Math.random() * AI_PERSONALITIES.length)];
    setAiPersonality(randomPersonality);
    generateWeeklyExpenses();
  }, []);

  // Regenerate expenses and check special events when week changes (except for the first week).
  useEffect(() => {
    if (week > 1) {
      generateWeeklyExpenses();
      checkSpecialEvents();
    }
  }, [week]);

  // Generate a random selection of weekly expenses.
  const generateWeeklyExpenses = () => {
    const randomExpenses = expensesList
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 2) + 3); // selects 3 or 4 random expenses
    setExpenses(randomExpenses);
  };

  // 20% chance to trigger a special event.
  const checkSpecialEvents = () => {
    if (Math.random() < 0.2) {
      const events = [
        {
          type: 'bonus',
          message: '🎉 Bonus! You received $100 for completing extra tasks!',
          effect: 100,
        },
        {
          type: 'penalty',
          message: '😱 Unexpected medical expense: -$80',
          effect: -80,
        },
        {
          type: 'discount',
          message: '🛍️ Flash Sale! All expenses reduced by 20%',
          effect: 'discount',
        },
        {
          type: 'investment',
          message: '📈 Market Rally! Your investments doubled!',
          effect: 'double_investment',
        },
      ];
      const randomEvent = events[Math.floor(Math.random() * events.length)];
      setSpecialEvent(randomEvent);
    } else {
      setSpecialEvent(null);
    }
  };

  // Apply special event effect if applicable.
  const applySpecialEvent = (choice, amount) => {
    if (!specialEvent) return amount;

    switch (specialEvent.effect) {
      case 'discount':
        return amount * 0.8; // reduce cost by 20%
      case 'double_investment':
        return choice === 'invest' ? amount * 2 : amount; // double investment return if chosen
      default:
        return amount;
    }
  };

  // Determine AI's choice based on its personality probabilities.
  const getAiChoice = () => {
    const random = Math.random();
    const probabilities = aiPersonality.probability;

    if (random < probabilities.save) return 'save';
    if (random < probabilities.save + probabilities.spend) return 'spend';
    return 'invest';
  };

  // Handle player's choice and determine effects for both player and AI.
  const handleChoice = async (choice) => {
    if (isAnimating) return;

    setIsAnimating(true);
    const totalExpense = expenses.reduce((sum, item) => sum + item.cost, 0);
    let newPlayerMoney = playerMoney;
    let newAiMoney = aiMoney;
    let playerEffect = 0;
    let aiEffect = 0;

    // Apply bonus/penalty events if present.
    if (specialEvent && specialEvent.type === 'bonus') {
      newPlayerMoney += specialEvent.effect;
      newAiMoney += specialEvent.effect;
    }
    if (specialEvent && specialEvent.type === 'penalty') {
      newPlayerMoney += specialEvent.effect;
      newAiMoney += specialEvent.effect;
    }

    // Calculate player's cash effect based on their choice.
    if (choice === 'save') {
      playerEffect = -totalExpense * 0.5; // save reduces cost by 50%
      newPlayerMoney += playerEffect;
    } else if (choice === 'spend') {
      playerEffect = -totalExpense; // full expense cost
      newPlayerMoney += playerEffect;
    } else if (choice === 'invest') {
      const investmentReturn = Math.floor(Math.random() * 41) + 40; // random return between 40 and 80
      const costReduction = totalExpense * 0.75; // reduced expense when investing
      playerEffect = -costReduction + investmentReturn;
      newPlayerMoney += playerEffect;
    }

    // Apply any special event modifications.
    if (specialEvent && specialEvent.effect === 'discount') {
      playerEffect = applySpecialEvent(choice, playerEffect);
    }
    if (specialEvent && specialEvent.effect === 'double_investment' && choice === 'invest') {
      const investmentBonus = Math.floor(Math.abs(playerEffect) * 0.5);
      playerEffect += investmentBonus;
      newPlayerMoney += investmentBonus;
    }

    // Get AI decision and calculate its effect.
    const aiChoice = getAiChoice();
    if (aiChoice === 'save') {
      aiEffect = -totalExpense * 0.5;
    } else if (aiChoice === 'spend') {
      aiEffect = -totalExpense;
    } else if (aiChoice === 'invest') {
      const investmentReturn = Math.floor(Math.random() * 41) + 40;
      const costReduction = totalExpense * 0.75;
      aiEffect = -costReduction + investmentReturn;
    }
    aiEffect = applySpecialEvent(aiChoice, aiEffect);
    if (specialEvent && specialEvent.effect === 'double_investment' && aiChoice === 'invest') {
      const investmentBonus = Math.floor(Math.abs(aiEffect) * 0.5);
      aiEffect += investmentBonus;
    }

    newAiMoney += aiEffect;

    // Save round history for review.
    const roundHistory = {
      week,
      playerChoice: choice,
      playerEffect,
      aiChoice,
      aiEffect,
      playerMoney: newPlayerMoney,
      aiMoney: newAiMoney,
      specialEvent,
    };
    setGameHistory([...gameHistory, roundHistory]);

    setPlayerMoney(newPlayerMoney);
    setAiMoney(newAiMoney);

    // Construct response message showing both choices and any special event.
    let responseMessage = `You chose ${choice}! ${choice === 'invest' ? `Investment return: $${Math.abs(playerEffect) + totalExpense * 0.75}` : ''} 
${aiPersonality.name} chose ${aiChoice}!`;

    if (specialEvent) {
      responseMessage += `\n\n${specialEvent.message}`;
    }

    setMessage(responseMessage);

    // After a short delay, move to the next week or end the game.
    setTimeout(() => {
      if (week < WEEKS) {
        setWeek(week + 1);
        setSpecialEvent(null);
      } else {
        setGameOver(true);
        determineWinner(newPlayerMoney, newAiMoney);
        trackGameStats(newPlayerMoney, newAiMoney);
      }
      setIsAnimating(false);
    }, 2000);
  };

  // Determine the winner based on final monies.
  const determineWinner = (player, ai) => {
    if (player > ai) {
      setMessage(`🎉 Congratulations! You won with $${player.toFixed(2)}!`);
    } else if (player < ai) {
      setMessage(`😔 You lost! ${aiPersonality.name} wins with $${ai.toFixed(2)}!`);
    } else {
      setMessage(`🤝 It's a tie! Both have $${player.toFixed(2)}!`);
    }
  };

  // Track game stats by sending data to an API endpoint.
  const trackGameStats = async (finalPlayerMoney, finalAiMoney) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    const score = finalPlayerMoney;
    const metadata = {
      gameType: 'Battle of Budgets',
      finalPlayerMoney,
      finalAiMoney,
      winner: finalPlayerMoney > finalAiMoney ? 'player' : finalPlayerMoney < finalAiMoney ? 'ai' : 'tie',
      aiPersonality: aiPersonality.name,
      gameHistory,
      specialEvents: gameHistory.filter(h => h.specialEvent).length,
    };

    try {
      await fetch(`${API_BASE_URL}/progress/game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          gameId: 'battle-budgets',
          title: 'Battle of Budgets',
          score,
          metadata,
        }),
      });
    } catch (error) {
      console.error('Error tracking game stats:', error);
    }
  };

  // Reset the game to initial state.
  const resetGame = () => {
    setWeek(1);
    setPlayerMoney(STARTING_BUDGET);
    setAiMoney(STARTING_BUDGET);
    setGameHistory([]);
    setGameOver(false);
    setSpecialEvent(null);

    // Select a new AI personality for the new game.
    const randomPersonality = AI_PERSONALITIES[Math.floor(Math.random() * AI_PERSONALITIES.length)];
    setAiPersonality(randomPersonality);
    generateWeeklyExpenses();
  };

  return (
    <div className="battle-budgets-container">
      <h2 className="title animated-title">⚔️ Battle of the Budgets</h2>

      {/* Display AI personality information */}
      {aiPersonality && (
        <div className="ai-personality-card">
          <div className="ai-avatar">{aiPersonality.emoji}</div>
          <div className="ai-info">
            <h3>You&apos;re facing: {aiPersonality.name}</h3>
            <p>{aiPersonality.description}</p>
          </div>
        </div>
      )}

      <div className="stats">
        <div className="week-indicator">
          Week {week} of {WEEKS}
        </div>

        <div className="progress-bars">
          {/* Progress bar for player */}
          <div className="progress-bar player" style={{ width: `${(playerMoney / STARTING_BUDGET) * 100}%` }}>
            <div className="progress-text">Player: ${playerMoney.toFixed(2)}</div>
          </div>
          {/* Progress bar for AI */}
          <div className="progress-bar ai" style={{ width: `${(aiMoney / STARTING_BUDGET) * 100}%` }}>
            <div className="progress-text">{aiPersonality?.name}: ${aiMoney.toFixed(2)}</div>
          </div>
        </div>

        <div className="highlight player-money">
          <span>💰 Your Money:</span>
          <span>${playerMoney.toFixed(2)}</span>
        </div>
        <div className="highlight ai-money">
          <span>🤖 {aiPersonality?.name} Money:</span>
          <span>${aiMoney.toFixed(2)}</span>
        </div>
      </div>

      {/* Display current week's expenses */}
      <div className="expenses">
        <h4>This Week&apos;s Expenses:</h4>
        <ul>
          {expenses.map((expense, index) => (
            <li key={index} className="expense-item fade-in">
              <span>{expense.icon} {expense.name}:</span>
              <span>${expense.cost}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Display special event if any */}
      {specialEvent && (
        <div className="special-event-card">
          <h3>🌟 Special Event!</h3>
          <p>{specialEvent.message}</p>
        </div>
      )}

      <div className="choices">
        {/* Buttons to choose game action */}
        <button className={'choice-btn save pulse tooltip'}
                onClick={() => handleChoice('save')}
                disabled={isAnimating || gameOver}>
          💰 Save
          {showTooltips && <span className="tooltiptext">Save 50% on expenses</span>}
        </button>
        <button className={'choice-btn spend shake tooltip'}
                onClick={() => handleChoice('spend')}
                disabled={isAnimating || gameOver}>
          🛍️ Spend
          {showTooltips && <span className="tooltiptext">Pay all expenses as usual</span>}
        </button>
        <button className={'choice-btn invest bounce tooltip'}
                onClick={() => handleChoice('invest')}
                disabled={isAnimating || gameOver}>
          📈 Invest
          {showTooltips && <span className="tooltiptext">Pay 75% expenses, earn 40-80 return</span>}
        </button>
      </div>

      {message && <p className={`message-box pop-up ${gameOver ? 'game-over' : ''}`}>{message}</p>}

      {/* Controls to reset game or toggle tooltips when game is over */}
      {gameOver && (
        <div className="game-controls">
          <button onClick={resetGame} className="choice-btn invest">
            🔄 Play Again
          </button>
          <button
            onClick={() => {
              setShowTooltips(!showTooltips);
              console.log('Tooltips now:', !showTooltips); // Debug log
            }}
            className={`choice-btn save ${showTooltips ? 'active' : ''}`}
            style={{
              backgroundColor: showTooltips ? '#66bb6a' : undefined,
              transform: showTooltips ? 'scale(1.05)' : undefined,
            }}
          >
            💡 {showTooltips ? 'Hide Tips' : 'Show Tips'}
          </button>
        </div>
      )}

      {/* Helper text for tooltips when enabled */}
      {showTooltips && gameOver && (
        <div style={{
          textAlign: 'center',
          marginTop: '10px',
          padding: '10px',
          backgroundColor: 'rgba(66, 187, 106, 0.1)',
          color: '#4CAF50',
          fontSize: '14px',
          borderRadius: '8px',
          border: '1px solid #4CAF50',
        }}>
          ℹ️ Hover over the Save, Spend, and Invest buttons to see detailed explanations!
        </div>
      )}

      {/* Display game history if any rounds have been played */}
      {gameHistory.length > 0 && (
        <div className="game-history">
          <h3>Game History</h3>
          <div className="history-entries">
            {gameHistory.map((entry, index) => (
              <div key={index} className="history-entry">
                <div className="history-week">Week {entry.week}</div>
                <div className="history-choice player">
                  You: {entry.playerChoice}
                  <span className={entry.playerEffect > 0 ? 'positive' : 'negative'}>
                    {entry.playerEffect > 0 ? '+' : ''}{entry.playerEffect.toFixed(2)}
                  </span>
                </div>
                <div className="history-choice ai">
                  {aiPersonality?.name}: {entry.aiChoice}
                  <span className={entry.aiEffect > 0 ? 'positive' : 'negative'}>
                    {entry.aiEffect > 0 ? '+' : ''}{entry.aiEffect.toFixed(2)}
                  </span>
                </div>
                {entry.specialEvent && (
                  <div className="history-event">⭐ Special: {entry.specialEvent.type}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BattleBudgets;
