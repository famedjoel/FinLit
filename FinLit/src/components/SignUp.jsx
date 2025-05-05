/* eslint-disable no-unused-vars */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/auth.css';

// Get the current hostname for API calls (works on all devices)
const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:7900`;

function SignUp() {
  // Initialise state to store form data (username, email, and password)
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  // Initialise state to store feedback message from the server
  const [message, setMessage] = useState('');
  // Initialise state to store the type of feedback message (success or error)
  const [messageType, setMessageType] = useState('');
  // Initialise state to control password visibility
  const [showPassword, setShowPassword] = useState(false);
  // Initialise state to indicate when the submission is in progress
  const [isLoading, setIsLoading] = useState(false);
  // Initialise navigation hook to allow redirection after signup
  const navigate = useNavigate();

  // Update the form data as the user types into the input fields
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle the form submission for signing up
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log(`Submitting to ${API_BASE_URL}/signup`);
      // Send a POST request to the signup API endpoint with user data
      const res = await fetch(`${API_BASE_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      setMessage(data.message);
      setMessageType(res.ok ? 'success' : 'error');

      if (res.ok) {
        // After a short delay, redirect the user to the login page
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      }
    } catch (error) {
      console.error('Signup error:', error);
      // Inform the user if there is a connection issue
      setMessage('Connection error: Unable to reach the server. Please check your network connection or try again later.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle the visibility of the password input field
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="auth-container">
      {/* Display the application logo */}
      <div className="auth-logo">💰</div>
      <h2>Create an Account</h2>

      {/* Form for user registration */}
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            placeholder="Choose a username"
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        </div>

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
            type={showPassword ? 'text' : 'password'}
            id="password"
            name="password"
            placeholder="••••••••"
            onChange={handleChange}
            required
            disabled={isLoading}
          />
          {/* Click to toggle password visibility */}
          <span className="password-toggle" onClick={togglePasswordVisibility}>
            {showPassword ? '🙈' : '👁️'}
          </span>
        </div>

        <button type="submit" className="auth-btn" disabled={isLoading}>
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      {/* Display the server's feedback message if one exists */}
      {message && (
        <div className={`auth-message ${messageType}`}>
          {message}
        </div>
      )}

      <div className="auth-switch">
        Already have an account? <Link to="/login">Login</Link>
      </div>

      <div className="server-info">
        <small>Server: {API_BASE_URL}</small>
      </div>
    </div>
  );
}

export default SignUp;
