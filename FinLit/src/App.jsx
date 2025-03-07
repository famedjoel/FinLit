 
import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import CourseDashboard from "./pages/CourseDashboard";
import Games from "./pages/Games";
import MoneyMatch from "./pages/MoneyMatch";
import SavingsChallenge from "./pages/SavingsChallenge";
import LemonadeStand from "./pages/LemonadeStand"; // Import game
import BattleBudgets from "./pages/BattleBudgets";
//import loanshark
import LoanShark from "./pages/LoanShark";
import "./styles/styles.css"; 
import SignUp from "./components/SignUp"; // Import Sign-Up Page
import Login from "./components/Login"; // Import Login Page  
import Dashboard from "./components/Dashboard"; // Example protected page
import Profile from "./components/Profile"; // Import Profile Page


function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  // Check if user is logged in (from localStorage)
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);


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
                <Link to="/signup" onClick={() => setMenuOpen(false)}>Sign Up</Link>
                <Link to="/login" onClick={() => setMenuOpen(false)}>Login</Link>
              </>
            ) : (
              <>
                <Link to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                <Link to="/profile" onClick={() => setMenuOpen(false)}>Profile</Link>
                {/* <img src={user.avatar} alt="User Avatar" className="nav-avatar" /> */}
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

export default App;
