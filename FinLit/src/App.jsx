import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import CourseDashboard from "./pages/CourseDashboard";
import CourseContent from "./pages/CourseContent"; // Import the new component
import Games from "./pages/Games";
import MoneyMatch from "./pages/MoneyMatch";
import SavingsChallenge from "./pages/SavingsChallenge";
import LemonadeStand from "./pages/LemonadeStand";
import BattleBudgets from "./pages/BattleBudgets";
import LoanShark from "./pages/LoanShark";
import FinancialTrivia from "./pages/FinancialTrivia";
import EnhancedStatistics from "./pages/EnhancedStatistics"; 
import "./styles/styles.css"; 
import "./styles/theme.css"; // Import the theme CSS
import SignUp from "./components/SignUp";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Profile from "./components/Profile";
import ThemeToggle from "./components/ThemeToggle"; // Import ThemeToggle component
import { ThemeProvider } from "./context/ThemeContext"; // Import ThemeProvider

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
    <ThemeProvider>
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
                  <Link to="/stats" className="nav-link" onClick={() => setMenuOpen(false)}>Statistics</Link>
                  <Link to="/profile" className="nav-link" onClick={() => setMenuOpen(false)}>Profile</Link>
                  <button onClick={handleLogout} className="nav-link logout-link">Logout</button>
                </>
              )}
              <ThemeToggle /> {/* Add Theme Toggle Component */}
            </div>
          </nav>

          {/* Main Content */}
          <div className="content-container">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/courses" element={<CourseDashboard />} />
              <Route path="/courses/:courseId" element={<CourseContent />} /> {/* Route for Course Content */}
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
            </Routes>
          </div>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;