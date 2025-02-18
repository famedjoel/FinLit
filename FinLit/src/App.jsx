import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import CourseDashboard from "./pages/CourseDashboard";
import Games from "./pages/Games";
import "./styles.css";
import "./index.css";

function App() {
  return (
    <Router>
      <div className="app-container">
        {/* Navigation Bar */}
        <nav className="navbar">
          <div className="logo">💰 FinLearn</div>
          <div className="nav-links">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/courses" className="nav-link">Courses</Link>
            <Link to="/games" className="nav-link">Games</Link>
          </div>
        </nav>

        {/* Routing for different pages */}
        <div className="content-container">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/courses" element={<CourseDashboard />} />
            <Route path="/games" element={<Games />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
