function LandingPage() {
  return (
    <div className="landing-container">
      <h1>Welcome to Financial Literacy Hub</h1>
      <p className="sub-text">Master investing, budgeting, and trading with real-world simulations.</p>
      <div className="btn-container">
        <a href="/courses" className="btn-primary">📘 Start Learning</a>
        <a href="/quiz" className="btn-secondary">🎮 Take a Quiz</a>
      </div>
    </div>
  );
}

export default LandingPage;
