import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import CourseDashboard from "./pages/CourseDashboard";
import Games from "./pages/Games";
import MoneyMatch from "./pages/MoneyMatch";
import "./styles.css";

function App() {
  const [menuOpen, setMenuOpen] = useState(false);

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
          </div>
        </nav>

        {/* Main Content */}
        <div className="content-container">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/courses" element={<CourseDashboard />} />
            <Route path="/games" element={<Games />} />
            <Route path="/games/money-match" element={<MoneyMatch />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
