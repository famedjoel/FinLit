/* eslint-disable multiline-ternary */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import LandingPage from './pages/LandingPage.jsx';
import CourseDashboard from './pages/CourseDashboard.jsx';
import CourseContent from './pages/CourseContent.jsx';
import Games from './pages/Games.jsx';
import MoneyMatch from './pages/MoneyMatch.jsx';
import SavingsChallenge from './pages/SavingsChallenge.jsx';
import LemonadeStand from './pages/LemonadeStand.jsx';
import BattleBudgets from './pages/BattleBudgets.jsx';
import LoanShark from './pages/LoanShark.jsx';
import FinancialTrivia from './pages/FinancialTrivia.jsx';
import EnhancedStatistics from './pages/EnhancedStatistics.jsx';
import SignUp from './components/SignUp.jsx';
import Login from './components/Login.jsx';
import Dashboard from './components/Dashboard.jsx';
import Profile from './components/Profile.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import Challenges from './pages/Challenges.jsx';
import Achievements from './pages/Achievements.jsx';
import Rewards from './pages/Rewards.jsx';
import './styles/styles.css';
import './styles/theme.css';

// Define a custom event to signal changes in login status
const loginStatusChange = new Event('loginStatusChange');

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  // On mount, check for a logged-in user and set up listeners for login updates
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Update the user state when login status changes
    const handleLoginChange = () => {
      const updatedUser = localStorage.getItem('user');
      if (updatedUser) {
        setUser(JSON.parse(updatedUser));
      } else {
        setUser(null);
      }
    };

    window.addEventListener('loginStatusChange', handleLoginChange);
    window.addEventListener('storage', (event) => {
      if (event.key === 'user') {
        handleLoginChange();
      }
    });

    return () => {
      window.removeEventListener('loginStatusChange', handleLoginChange);
      window.removeEventListener('storage', handleLoginChange);
    };
  }, []);

  // Log out the current user, update the state and redirect to the home page
  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    window.dispatchEvent(loginStatusChange);
    window.location.href = '/';
  };

  return (
    <ThemeProvider>
      <Router>
        <div className="app-container">
          {/* Navigation bar */}
          <nav className="navbar">
            <div className="logo">💰 FinLearn</div>
            <div className="menu-icon" onClick={() => setMenuOpen(!menuOpen)}>
              ☰
            </div>

            <div className={`nav-links ${menuOpen ? 'show' : ''}`}>
              {/* Persistent links for all users */}
              <Link to="/" className="nav-link" onClick={() => setMenuOpen(false)}>Home</Link>
              <Link to="/courses" className="nav-link" onClick={() => setMenuOpen(false)}>Courses</Link>
              <Link to="/games" className="nav-link" onClick={() => setMenuOpen(false)}>Games</Link>

              {user ? (
                <>
                  <Link to="/dashboard" className="nav-link" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                  <Link to="/stats" className="nav-link" onClick={() => setMenuOpen(false)}>Statistics</Link>
                  <Link to="/profile" className="nav-link" onClick={() => setMenuOpen(false)}>Profile</Link>

                  {/* Additional options for logged-in users */}
                  <div className="nav-link dropdown">
                    More ▾
                    <div className="dropdown-content">
                      <Link to="/leaderboard" className="dropdown-link" onClick={() => setMenuOpen(false)}>Leaderboard</Link>
                      <Link to="/challenges" className="dropdown-link" onClick={() => setMenuOpen(false)}>Challenges</Link>
                      <Link to="/achievements" className="dropdown-link" onClick={() => setMenuOpen(false)}>Achievements</Link>
                      <Link to="/rewards" className="dropdown-link" onClick={() => setMenuOpen(false)}>Rewards</Link>
                    </div>
                  </div>

                  <button onClick={handleLogout} className="nav-link logout-link">Logout</button>
                </>
              ) : (
                <>
                  <Link to="/signup" className="nav-link" onClick={() => setMenuOpen(false)}>Sign Up</Link>
                  <Link to="/login" className="nav-link" onClick={() => setMenuOpen(false)}>Login</Link>
                </>
              )}

              <ThemeToggle /> {/* Always visible theme toggle */}
            </div>
          </nav>

          {/* Main content area */}
          <div className="content-container">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/courses" element={<CourseDashboard />} />
              <Route path="/courses/:courseId" element={<CourseContent />} />
              <Route path="/games" element={<Games />} />
              <Route path="/games/money-match" element={<MoneyMatch />} />
              <Route path="/games/30-day-savings" element={<SavingsChallenge />} />
              <Route path="/games/lemonade-stand" element={<LemonadeStand />} />
              <Route path="/games/loan-shark" element={<LoanShark />} />
              <Route path="/games/battle-of-budgets" element={<BattleBudgets />} />
              <Route path="/games/quiz" element={<FinancialTrivia />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/stats" element={<EnhancedStatistics />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/challenges" element={<Challenges />} />
              <Route path="/achievements" element={<Achievements />} />
              <Route path="/rewards" element={<Rewards />} />
            </Routes>
          </div>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
