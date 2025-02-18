function LandingPage() {
  return (
    <div className="landing-container">
      <h1>Welcome to Financial Literacy Hub</h1>
      <p>Learn about investing, budgeting, and financial planning interactively.</p>
      <div className="btn-container">
        <a href="/courses" className="btn-primary">Start Learning</a>
        <a href="/quiz" className="btn-secondary">Take a Quiz</a>
      </div>
    </div>
  );
}

export default LandingPage;
