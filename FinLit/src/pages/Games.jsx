import { Link } from "react-router-dom";

function Games() {
  return (
    <div className="games-container">
      <h2>🎮 Choose Your Game</h2>
      <div className="game-options">
        <Link to="/games/quiz" className="game-card">
          <h3>📘 Financial Trivia</h3>
          <p>Test your financial knowledge with multiple-choice questions across different difficulty levels.</p>
        </Link>
        <Link to="/games/debt-trap" className="game-card">
          <h3>🚨 Avoid the Debt Trap</h3>
          <p>Make smart financial choices to stay debt-free while enjoying life.</p>
        </Link>
        <Link to="/games/30-day-savings" className="game-card">
          <h3>💰 The 30-Day Savings Challenge</h3>
          <p>Complete daily money-saving tasks to reach your goal.</p>
        </Link>
        <Link to="/games/money-match" className="game-card">
        <h3>💳 Money Match: Needs vs. Wants</h3>
        <p>Drag and drop expenses into the correct category.</p>
        </Link>

        <Link to="/games/lifestyle-inflation" className="game-card">
          <h3>📈 Lifestyle Inflation Trap</h3>
          <p>Decide between upgrading your lifestyle or saving for the future.</p>
        </Link>
        <Link to="/games/emergency-fund" className="game-card">
          <h3>⚠️ Emergency Fund Rush</h3>
          <p>Save up for emergencies while dealing with surprise expenses.</p>
        </Link>
        <Link to="/games/battle-of-budgets" className="game-card">
          <h3>🛠️ Battle of the Budgets</h3>
          <p>Compete to create the most efficient budget.</p>
        </Link>
        <Link to="/games/lemonade-stand" className="game-card">
          <h3>🍋 The Lemonade Stand Game</h3>
          <p>Run a lemonade business and manage pricing, marketing, and profits.</p>
        </Link>
        <Link to="/games/credit-score" className="game-card">
          <h3>🏦 The Credit Score Game</h3>
          <p>Make financial choices that impact your credit score over time.</p>
        </Link>
        <Link to="/games/loan-shark" className="game-card">
          <h3>💸 The Loan Shark Challenge</h3>
          <p>Evaluate different loan offers and pick the best one.</p>
        </Link>
      </div>
    </div>
  );
}

export default Games;
