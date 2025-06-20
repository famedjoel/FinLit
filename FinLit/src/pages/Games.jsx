/* eslint-disable no-unused-vars */
import { Link } from 'react-router-dom'; // Importing Link component for navigation

function Games() {
  return (
    <div className="games-container">
      <h2>🎮 Financial Learning Games</h2>
      <div className="game-options">
        {/* Financial Trivia Games Section */}
        <div className="game-category">
          <h3 className="game-category-title">📘 Financial Trivia Games</h3>
          <div className="game-category-items">
            {/* Featured Game: Enhanced Financial Trivia */}
            <Link to="/games/quiz" className="game-card featured-game">
              <div className="new-feature-badge">New!</div>
              <h3>🧠 Enhanced Financial Trivia</h3>
              <p>Test your knowledge with multiple question types: multiple-choice, true/false, fill in the blank, matching, and financial calculations with hints!</p>
              <div className="question-types-preview">
                {/* Icons representing different question types */}
                <span className="question-type-icon" title="Multiple Choice">🔠</span>
                <span className="question-type-icon" title="True/False">✓✗</span>
                <span className="question-type-icon" title="Fill in the Blank">📝</span>
                <span className="question-type-icon" title="Matching">🔄</span>
                <span className="question-type-icon" title="Financial Calculations">🧮</span>
              </div>
            </Link>

            {/* Daily Challenge Game */}
            <Link to="/games/quiz?type=daily" className="game-card">
              <h3>🗓️ Daily Challenge</h3>
              <p>A new set of questions each day. Can you master today&apos;s financial challenge?</p>
            </Link>

            {/* Progressive Difficulty Game */}
            <Link to="/games/quiz?type=progressive" className="game-card">
              <h3>📈 Progressive Difficulty</h3>
              <p>Start with easy questions and work your way up to expert-level financial concepts.</p>
            </Link>

            {/* Marathon Mode Game */}
            <Link to="/games/quiz?type=marathon" className="game-card">
              <h3>🏃 Marathon Mode</h3>
              <p>Keep answering questions until you get one wrong. How far can you go?</p>
            </Link>
          </div>
        </div>

        {/* Financial Simulation Games Section */}
        <div className="game-category">
          <h3 className="game-category-title">💰 Financial Simulation Games</h3>
          <div className="game-category-items">
            {/* Money Match Game */}
            <Link to="/games/money-match" className="game-card">
              <h3>💳 Money Match: Needs vs. Wants</h3>
              <p>Drag and drop expenses into the correct category.</p>
            </Link>

            {/* 30-Day Savings Challenge */}
            <Link to="/games/30-day-savings" className="game-card">
              <h3>💰 The 30-Day Savings Challenge</h3>
              <p>Complete daily money-saving tasks to reach your goal.</p>
            </Link>

            {/* Lemonade Stand Game */}
            <Link to="/games/lemonade-stand" className="game-card">
              <h3>🍋 The Lemonade Stand Game</h3>
              <p>Run a lemonade business and manage pricing, marketing, and profits.</p>
            </Link>

            {/* Loan Shark Challenge */}
            <Link to="/games/loan-shark" className="game-card">
              <h3>💸 The Loan Shark Challenge</h3>
              <p>Evaluate different loan offers and pick the best one.</p>
            </Link>

            {/* Battle of the Budgets Game */}
            <Link to="/games/battle-of-budgets" className="game-card">
              <h3>🛠️ Battle of the Budgets</h3>
              <p>Compete to create the most efficient budget.</p>
            </Link>
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="game-category">
          <h3 className="game-category-title">🔍 Coming Soon</h3>
          <div className="game-category-items">
            {/* Placeholder for upcoming games */}
            <div className="game-card coming-soon">
              <h3>⚠️ Emergency Fund Rush</h3>
              <p>Save up for emergencies while dealing with surprise expenses.</p>
              <span className="coming-soon-badge">Coming Soon</span>
            </div>

            <div className="game-card coming-soon">
              <h3>📈 Lifestyle Inflation Trap</h3>
              <p>Decide between upgrading your lifestyle or saving for the future.</p>
              <span className="coming-soon-badge">Coming Soon</span>
            </div>

            <div className="game-card coming-soon">
              <h3>🏦 The Credit Score Game</h3>
              <p>Make financial choices that impact your credit score over time.</p>
              <span className="coming-soon-badge">Coming Soon</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Games; // Exporting the Games component for use in other parts of the application
