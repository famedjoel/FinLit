import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import CourseDashboard from "./pages/CourseDashboard";
import Quiz from "./pages/Quiz";
import "./styles.css";

function App() {
  return (
    <Router>
      <div className="app-container">
        {/* Navigation Bar */}
        <nav className="navbar">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/courses" className="nav-link">Courses</Link>
          <Link to="/quiz" className="nav-link">Quiz</Link>
        </nav>

        {/* Routing for different pages */}
        <div className="content-container">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/courses" element={<CourseDashboard />} />
            <Route path="/quiz" element={<Quiz />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
