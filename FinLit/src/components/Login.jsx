/* eslint-disable no-unused-vars */
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/auth.css";

// Get the current hostname for API calls (works on all devices)
const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:7900`;

function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log("Quiz submitted at:", new Date().toLocaleTimeString());
      console.log(`Submitting to ${API_BASE_URL}/login`);
      console.log("Form data:", formData);

      const res = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      console.log("Server response:", data);

      // Simulating quiz-like status and score log for Figure 6.10
      console.log("POST /api/submit-quiz status:", res.status);
      console.log("User score:", data.score ?? "N/A");

      setMessage(data.message);
      setMessageType(res.ok ? "success" : "error");

      if (res.ok) {
        console.log("Login successful. Redirecting to dashboard...");
        localStorage.setItem("user", JSON.stringify(data.user));
        window.dispatchEvent(new Event('loginStatusChange'));
        window.location.href = "/dashboard"; // or use navigate("/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      setMessage(
        "Connection error: Unable to reach the server. Please check your network connection or try again later."
      );
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="auth-container">
      <div className="auth-logo">💰</div>
      <h2>Welcome Back!</h2>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="your@email.com"
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        </div>

        <div className="input-group">
          <label htmlFor="password">Password</label>
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            placeholder="••••••••"
            onChange={handleChange}
            required
            disabled={isLoading}
          />
          <span
            className="password-toggle"
            onClick={togglePasswordVisibility}
          >
            {showPassword ? "🙈" : "👁️"}
          </span>
        </div>

        <button
          type="submit"
          className="auth-btn"
          disabled={isLoading}
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </form>

      {message && (
        <div className={`auth-message ${messageType}`}>
          {message}
        </div>
      )}

      <div className="auth-switch">
        Don&apos;t have an account? <Link to="/signup">Sign Up</Link>
      </div>

      <div className="server-info">
        <small>Server: {API_BASE_URL}</small>
      </div>
    </div>
  );
}

export default Login;
