import { useState, useEffect } from "react";
// eslint-disable-next-line no-unused-vars
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import CourseDashboard from "./pages/CourseDashboard";
import Games from "./pages/Games";
import MoneyMatch from "./pages/MoneyMatch";
import SavingsChallenge from "./pages/SavingsChallenge";
import LemonadeStand from "./pages/LemonadeStand";
import BattleBudgets from "./pages/BattleBudgets";
import LoanShark from "./pages/LoanShark";
import FinancialTrivia from "./pages/FinancialTrivia";
import "./styles/styles.css"; 
import SignUp from "./components/SignUp";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Profile from "./components/Profile";

// Create a custom event for login status changes
const loginStatusChange = new Event('loginStatusChange');

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  // Check if user is logged in (from localStorage)
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    // Add event listener for login status changes
    const handleLoginChange = () => {
      const updatedUser = localStorage.getItem("user");
      if (updatedUser) {
        setUser(JSON.parse(updatedUser));
      } else {
        setUser(null);
      }
    };
    
    window.addEventListener('loginStatusChange', handleLoginChange);
    
    // Also check for storage events (in case localStorage changes in another tab)
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

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    window.dispatchEvent(loginStatusChange);
    // Redirect to home page after logout
    window.location.href = "/";
  };

  return (
    <Router>
      <div className="app-container">
        {/* Navbar */}
        <nav className="navbar">
          <div className="logo">💰 FinLearn</div>
          <div className="menu-icon" onClick={() => setMenuOpen(!menuOpen)}>
            ☰
          </div>
          <div className={`nav-links ${menuOpen ? "show" : ""}`}>
            <Link to="/" className="nav-link" onClick={() => setMenuOpen(false)}>Home</Link>
            <Link to="/courses" className="nav-link" onClick={() => setMenuOpen(false)}>Courses</Link>
            <Link to="/games" className="nav-link" onClick={() => setMenuOpen(false)}>Games</Link>
            {!user ? (
              <>
                <Link to="/signup" className="nav-link" onClick={() => setMenuOpen(false)}>Sign Up</Link>
                <Link to="/login" className="nav-link" onClick={() => setMenuOpen(false)}>Login</Link>
              </>
            ) : (
              <>
                <Link to="/dashboard" className="nav-link" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                <Link to="/profile" className="nav-link" onClick={() => setMenuOpen(false)}>Profile</Link>
                <button onClick={handleLogout} className="nav-link logout-link">Logout</button>
              </>
            )}
          </div>
        </nav>

        {/* Main Content */}
        <div className="content-container">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/courses" element={<CourseDashboard />} />
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
          </Routes>
        </div>
      </div>
    </Router>
  );
}

// Add CSS styles for logout button
document.head.insertAdjacentHTML(
  'beforeend',
  `<style>
    .logout-link {
      background: none;
      border: none;
      color: white;
      font-size: 1rem;
      font-weight: bold;
      cursor: pointer;
      padding: 8px 15px;
      border-radius: 5px;
      transition: all 0.3s ease;
    }
    .logout-link:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  </style>`
);

export default App;