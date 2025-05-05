/* eslint-disable no-unused-vars */
import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import '../styles/landing-page.css';
import { ThemeContext } from '../context/ThemeContext.jsx';

function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const { theme } = useContext(ThemeContext); // Access the current theme from context

  useEffect(() => {
    // Determine if the user is logged in by checking local storage
    const user = localStorage.getItem('user');
    setIsLoggedIn(!!user);
  }, []);

  // Testimonials data for the carousel
  const testimonials = [
    {
      id: 1,
      name: 'Sarah J.',
      role: 'College Student',
      text: 'FinLearn helped me understand how to manage my student loans and start saving for the future. The interactive games made learning about finance actually fun!',
      avatar: '/avatars/avatar1.png',
    },
    {
      id: 2,
      name: 'Michael T.',
      role: 'Young Professional',
      text: "I never thought I'd enjoy learning about investing, but the courses here made it simple and engaging. I've already started my first investment portfolio!",
      avatar: '/avatars/avatar2.png',
    },
    {
      id: 3,
      name: 'Anita K.',
      role: 'Parent',
      text: "Teaching my children about money was challenging until we found FinLearn. Now we play the financial games together as a family and everyone's learning!",
      avatar: '/avatars/avatar3.png',
    },
  ];

  // Features data displayed in the features section
  const features = [
    {
      id: 1,
      title: 'Interactive Courses',
      description: 'Step-by-step lessons that make learning financial concepts clear and simple.',
      icon: '📚',
    },
    {
      id: 2,
      title: 'Learning Games',
      description: 'Fun games that simulate real-world financial decisions and their consequences.',
      icon: '🎮',
    },
    {
      id: 3,
      title: 'Progress Tracking',
      description: 'Track your learning journey and see how your financial knowledge grows.',
      icon: '📊',
    },
    {
      id: 4,
      title: 'Practical Simulations',
      description: 'Try out financial strategies without risking real money.',
      icon: '🧪',
    },
  ];

  // FAQ data for the FAQ section
  const faqs = [
    {
      id: 1,
      question: 'Is FinLearn suitable for beginners?',
      answer: 'Absolutely! Our courses start from basic concepts and gradually progress to more advanced topics. Anyone can start learning regardless of previous financial knowledge.',
    },
    {
      id: 2,
      question: 'How much time do I need to commit?',
      answer: 'Learn at your own pace! Each course is broken down into short modules that can be completed in 15-20 minutes. Games can be played in short sessions whenever you have free time.',
    },
    {
      id: 3,
      question: 'Can FinLearn really help me save money?',
      answer: 'Yes! Users report saving more money after learning concepts like budgeting, debt management, and investment strategies through our platform.',
    },
  ];

  useEffect(() => {
    // Automatically change the testimonial every 5 seconds
    const interval = setInterval(() => {
      setTestimonialIndex((prevIndex) =>
        prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1,
      );
    }, 5000);

    return () => clearInterval(interval); // Clean up the interval on component unmount
  }, [testimonials.length]);

  return (
    <div className={`landing-page ${theme === 'dark' ? 'dark-theme' : ''}`}>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Unlock Financial Wisdom Through Play</h1>
          <p className="hero-subtitle">
            Master investing, budgeting, and smart money decisions with interactive courses and games.
          </p>
          <div className="hero-buttons">
            {isLoggedIn
              ? (
              <Link to="/dashboard" className="btn-primary">Go to Dashboard</Link>
                )
              : (
              <>
                <Link to="/signup" className="btn-primary">Get Started</Link>
                <Link to="/login" className="btn-secondary">Login</Link>
              </>
                )}
          </div>
        </div>
        <div className="hero-image">
          <img src="/images/hero-finance.svg" alt="Financial Learning" className="placeholder-image" />
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2>Why Choose FinLearn?</h2>
        <div className="features-grid">
          {features.map(feature => (
            <div className="feature-card" key={feature.id}>
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Courses Preview Section */}
      <section className="courses-preview-section">
        <h2>Popular Learning Paths</h2>
        <div className="courses-preview-grid">
          <div className="course-preview-card">
            <div className="course-preview-icon">💰</div>
            <h3>Personal Finance Basics</h3>
            <p>Learn budgeting, saving, and debt management fundamentals.</p>
            <Link to="/courses" className="btn-outline">Explore Course</Link>
          </div>
          <div className="course-preview-card">
            <div className="course-preview-icon">📈</div>
            <h3>Investing for Beginners</h3>
            <p>Understand stocks, bonds, and building your first portfolio.</p>
            <Link to="/courses" className="btn-outline">Explore Course</Link>
          </div>
          <div className="course-preview-card">
            <div className="course-preview-icon">🏠</div>
            <h3>Real Estate & Mortgages</h3>
            <p>Navigate the complexities of home buying and property investment.</p>
            <Link to="/courses" className="btn-outline">Explore Course</Link>
          </div>
        </div>
      </section>

      {/* Games Preview Section */}
      <section className="games-preview-section">
        <h2>Learn By Playing</h2>
        <div className="games-preview-grid">
          <div className="game-preview-card">
            <h3>🦈 Loan Shark Challenge</h3>
            <p>Manage loans and interest rates while building your savings.</p>
            <Link to="/games/loan-shark" className="btn-play">Play Now</Link>
          </div>
          <div className="game-preview-card">
            <h3>💰 30-Day Savings Challenge</h3>
            <p>Develop daily saving habits through fun challenges.</p>
            <Link to="/games/30-day-savings" className="btn-play">Play Now</Link>
          </div>
          <div className="game-preview-card">
            <h3>🍋 Lemonade Stand</h3>
            <p>Run a business and learn about revenue, costs, and profit.</p>
            <Link to="/games/lemonade-stand" className="btn-play">Play Now</Link>
          </div>
          <div className="game-preview-card">
            <h3>💳 Money Match</h3>
            <p>Master budgeting by categorising needs vs. wants.</p>
            <Link to="/games/money-match" className="btn-play">Play Now</Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <h2>What Our Users Say</h2>
        <div className="testimonial-carousel">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.id}
              className={`testimonial-card ${index === testimonialIndex ? 'active' : ''}`}
            >
              <div className="testimonial-content">
                <p className="testimonial-text">&quot;{testimonial.text}&quot;</p>
                <div className="testimonial-user">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="testimonial-avatar"
                  />
                  <div className="testimonial-info">
                    <h4>{testimonial.name}</h4>
                    <p>{testimonial.role}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div className="testimonial-dots">
            {testimonials.map((_, index) => (
              <span
                key={index}
                className={`dot ${index === testimonialIndex ? 'active' : ''}`}
                onClick={() => setTestimonialIndex(index)}
              ></span>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-container">
          {faqs.map(faq => (
            <details key={faq.id} className="faq-item">
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Call-to-Action Section */}
      <section className="cta-section">
        <h2>Ready to Build Your Financial Future?</h2>
        <p>Join thousands of others who are mastering finance the fun way.</p>
        <div className="cta-buttons">
          {isLoggedIn
            ? (
            <Link to="/courses" className="btn-primary">Explore Courses</Link>
              )
            : (
            <Link to="/signup" className="btn-primary">Start For Free</Link>
              )}
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h3>💰 FinLearn</h3>
            <p>Making financial literacy accessible and enjoyable for everyone.</p>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h4>Platform</h4>
              <ul>
                <li><Link to="/courses">Courses</Link></li>
                <li><Link to="/games">Games</Link></li>
                <li><Link to="/signup">Sign Up</Link></li>
                <li><Link to="/login">Login</Link></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>Resources</h4>
              <ul>
                <li><a href="#faq">FAQ</a></li>
                <li><a href="#blog">Blog</a></li>
                <li><a href="#community">Community</a></li>
                <li><a href="#support">Support</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>Company</h4>
              <ul>
                <li><a href="#about">About Us</a></li>
                <li><a href="#careers">Careers</a></li>
                <li><a href="#contact">Contact</a></li>
                <li><a href="#privacy">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} FinLearn. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
