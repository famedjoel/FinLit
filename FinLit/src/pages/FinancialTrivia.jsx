/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import "../styles/FinancialTrivia.css";

const FinancialTrivia = () => {
  // State variables
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [answerIsCorrect, setAnswerIsCorrect] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [difficulty, setDifficulty] = useState("easy");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showQuitConfirmation, setShowQuitConfirmation] = useState(false);

  // Financial categories
  const financialCategories = [
    { id: "all", name: "All Topics", icon: "📚" },
    { id: "investing", name: "Investing", icon: "📈" },
    { id: "budgeting", name: "Budgeting", icon: "💰" },
    { id: "savings", name: "Savings", icon: "🏦" },
    { id: "credit", name: "Credit", icon: "💳" },
    { id: "taxes", name: "Taxes", icon: "📝" },
    { id: "retirement", name: "Retirement", icon: "🏖️" },
    { id: "insurance", name: "Insurance", icon: "🛡️" },
    { id: "debt", name: "Debt Management", icon: "⚖️" }
  ];

  // Load user data if available
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    // Load available categories from the server
    fetchCategories();
  }, []);

  // Get the current hostname for API calls (works on all devices)
  const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:7900`;

  // Fetch available categories from the server
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/trivia/categories`);
      
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        // If categories endpoint fails, use our predefined list
        setCategories(financialCategories.map(cat => cat.id));
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      // Use predefined categories as fallback
      setCategories(financialCategories.map(cat => cat.id));
    }
  };

  // Show notification function
  const showNotification = (message, type) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  };

  // Track game progress
  const trackGameProgress = async (finalScore) => {
    if (!user) return; // Only track if user is logged in
    
    try {
      const response = await fetch(`${API_BASE_URL}/progress/game`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          gameId: "financial-trivia",
          title: "Financial Trivia Quiz",
          score: finalScore,
          metadata: JSON.stringify({
            difficulty: difficulty,
            category: selectedCategory
          })
        }),
      });
      
      if (!response.ok) {
        console.error("Error tracking game progress");
      }
    } catch (error) {
      console.error("Failed to track game progress:", error);
    }
  };

  // Load questions from the database based on difficulty level and category
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError("");
      
      let url = `${API_BASE_URL}/trivia/questions?difficulty=${difficulty}&limit=5`;
      
      // Add category parameter if a specific category is selected
      if (selectedCategory !== "all") {
        url += `&category=${selectedCategory}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error("Failed to fetch questions");
      }
      
      const data = await response.json();
      
      if (data.length === 0) {
        throw new Error("No questions found for this combination of difficulty and category");
      }
      
      setQuestions(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching questions:", error);
      setError(error.message);
      setLoading(false);
      showNotification(`Error: ${error.message}`, "error");
    }
  };

  // Load questions when difficulty or category changes
  useEffect(() => {
    if (!quizStarted) {
      // Fetch questions when user selects difficulty and category but hasn't started yet
      fetchQuestions();
    }
  }, [difficulty, selectedCategory]);

  // Timer countdown
  useEffect(() => {
    let timer;
    if (quizStarted && !answerSubmitted && !showScore && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && !answerSubmitted && !showScore) {
      // Time's up, move to next question
      handleTimeUp();
    }
    
    return () => clearTimeout(timer);
  }, [timeLeft, answerSubmitted, showScore, quizStarted]);

  // Handle when time is up
  const handleTimeUp = () => {
    setAnswerSubmitted(true);
    setAnswerIsCorrect(false);
    showNotification("⏰ Time's up!", "warning");
    
    // Move to next question after 2 seconds
    setTimeout(() => {
      const nextQuestion = currentQuestion + 1;
      if (nextQuestion < questions.length) {
        setCurrentQuestion(nextQuestion);
        setSelectedAnswer(null);
        setAnswerSubmitted(false);
        setTimeLeft(30);
      } else {
        setShowScore(true);
        setQuizFinished(true);
        // Track game progress if user is logged in
        if (user) {
          trackGameProgress(score);
        }
      }
    }, 2000);
  };

  // Handle answer selection
  const handleAnswerSelect = (optionIndex) => {
    if (!answerSubmitted) {
      setSelectedAnswer(optionIndex);
    }
  };

  // Handle answer submission
  const handleAnswerSubmit = () => {
    if (selectedAnswer === null) {
      showNotification("Please select an answer first!", "warning");
      return;
    }
    
    setAnswerSubmitted(true);
    const isCorrect = selectedAnswer === questions[currentQuestion].correctAnswer;
    setAnswerIsCorrect(isCorrect);
    
    if (isCorrect) {
      const pointsEarned = difficulty === "easy" ? 10 : difficulty === "medium" ? 20 : 30;
      setScore(score + pointsEarned);
      showNotification(`✅ Correct! +${pointsEarned} points`, "success");
    } else {
      showNotification("❌ Incorrect!", "error");
    }
    
    // Move to next question after 2 seconds
    setTimeout(() => {
      const nextQuestion = currentQuestion + 1;
      if (nextQuestion < questions.length) {
        setCurrentQuestion(nextQuestion);
        setSelectedAnswer(null);
        setAnswerSubmitted(false);
        setTimeLeft(30);
      } else {
        setShowScore(true);
        setQuizFinished(true);
        // Track game progress if user is logged in
        if (user) {
          trackGameProgress(score);
        }
      }
    }, 2000);
  };

  // Start the quiz
  const startQuiz = () => {
    if (questions.length === 0) {
      showNotification("No questions available. Try a different difficulty level or category.", "error");
      return;
    }
    
    setQuizStarted(true);
    setTimeLeft(30);
    setCurrentQuestion(0);
    setScore(0);
    setShowScore(false);
    setSelectedAnswer(null);
    setAnswerSubmitted(false);
    setQuizFinished(false);
  };

  // Reset the quiz
  const resetQuiz = () => {
    setQuizStarted(false);
    setShowScore(false);
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setAnswerSubmitted(false);
    setTimeLeft(30);
    setQuizFinished(false);
    // Fetch questions again
    fetchQuestions();
  };

  // Change difficulty level
  const changeDifficulty = (level) => {
    setDifficulty(level);
    resetQuiz();
  };

  // Change category
  const changeCategory = (category) => {
    setSelectedCategory(category);
    resetQuiz();
  };

  // Handle showing quit confirmation dialog
  const handleQuitClick = () => {
    setShowQuitConfirmation(true);
  };

  // Handle actual quitting after confirmation
  const handleConfirmQuit = () => {
    // If the user has played at least one question and is logged in,
    // track their progress with their current score
    if (currentQuestion > 0 && user && !quizFinished) {
      trackGameProgress(score);
    }
    
    // Reset the quiz
    resetQuiz();
    setShowQuitConfirmation(false);
    showNotification("Quiz exited", "info");
  };

  // Handle canceling the quit action
  const handleCancelQuit = () => {
    setShowQuitConfirmation(false);
  };

  // Get category icon and name for display
  const getCategoryInfo = (categoryId) => {
    const category = financialCategories.find(cat => cat.id === categoryId) || financialCategories[0];
    return category;
  };

  return (
    <div className="financial-trivia-container">
      <h2>📘 Financial Trivia Challenge</h2>
      
      {/* Notifications */}
      <div className="notifications">
        {notifications.map((note) => (
          <div key={note.id} className={`notification ${note.type}`}>
            {note.message}
          </div>
        ))}
      </div>
      
      {/* Selection UI for non-started quiz */}
      {!quizStarted && (
        <div className="quiz-selection">
          {/* Difficulty Selection */}
          <div className="selection-section difficulty-selector">
            <h3>Select Difficulty Level:</h3>
            <div className="difficulty-buttons">
              <button 
                className={`difficulty-btn ${difficulty === "easy" ? "active" : ""}`}
                onClick={() => changeDifficulty("easy")}
              >
                Easy
              </button>
              <button 
                className={`difficulty-btn ${difficulty === "medium" ? "active" : ""}`}
                onClick={() => changeDifficulty("medium")}
              >
                Medium
              </button>
              <button 
                className={`difficulty-btn ${difficulty === "hard" ? "active" : ""}`}
                onClick={() => changeDifficulty("hard")}
              >
                Hard
              </button>
            </div>
            <p className="difficulty-description">
              {difficulty === "easy" ? 
                "Basic financial concepts and terminology." : 
                difficulty === "medium" ? 
                "Intermediate financial knowledge and concepts." : 
                "Advanced financial strategies and market knowledge."}
            </p>
          </div>

          {/* Category Selection */}
          <div className="selection-section category-selector">
            <h3>Select Category:</h3>
            <div className="category-buttons">
              {financialCategories.map((category) => (
                <button 
                  key={category.id}
                  className={`category-btn ${selectedCategory === category.id ? "active" : ""}`}
                  onClick={() => changeCategory(category.id)}
                >
                  <span className="category-icon">{category.icon}</span>
                  <span className="category-name">{category.name}</span>
                </button>
              ))}
            </div>
          </div>
          
          {loading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading questions...</p>
            </div>
          ) : error ? (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={fetchQuestions} className="retry-btn">
                Try Again
              </button>
            </div>
          ) : (
            <button onClick={startQuiz} className="start-quiz-btn">
              Start Quiz
            </button>
          )}
        </div>
      )}
      
      {/* Quiz in progress */}
      {quizStarted && !showScore && questions.length > 0 && (
        <div className="quiz-container">
          <div className="quiz-header">
            <div className="quiz-progress">
              Question {currentQuestion + 1}/{questions.length}
            </div>
            <div className="quiz-score">
              Score: {score}
            </div>
            <div className="quiz-info">
              <span className="quiz-difficulty">{difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</span>
              <span className="quiz-category">
                {questions[currentQuestion].category ? 
                  getCategoryInfo(questions[currentQuestion].category).icon : 
                  getCategoryInfo("all").icon}
              </span>
            </div>
            <div className={`quiz-timer ${timeLeft < 10 ? "running-out" : ""}`}>
              Time: {timeLeft}s
            </div>
          </div>
          
          <div className="question-container">
            <h3 className="question">{questions[currentQuestion].question}</h3>
            
            <div className="options-container">
              {questions[currentQuestion].options.map((option, index) => (
                <div 
                  key={index} 
                  className={`
                    option 
                    ${selectedAnswer === index ? "selected" : ""} 
                    ${answerSubmitted && index === questions[currentQuestion].correctAnswer ? "correct" : ""}
                    ${answerSubmitted && selectedAnswer === index && index !== questions[currentQuestion].correctAnswer ? "incorrect" : ""}
                  `}
                  onClick={() => handleAnswerSelect(index)}
                >
                  {option}
                </div>
              ))}
            </div>
            
            {answerSubmitted && (
              <div className="explanation-box">
                <p><strong>Explanation:</strong> {questions[currentQuestion].explanation}</p>
              </div>
            )}
            
            <div className="quiz-buttons">
              {!answerSubmitted && (
                <button 
                  onClick={handleAnswerSubmit} 
                  className="submit-btn"
                  disabled={selectedAnswer === null}
                >
                  Submit Answer
                </button>
              )}
              
              <button onClick={handleQuitClick} className="quit-btn">
                Quit Quiz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quiz results */}
      {showScore && (
        <div className="results-container">
          <h3>Quiz Completed!</h3>
          <div className="final-score">
            <p>Your score: <span>{score}</span></p>
            <p>Difficulty: <span>{difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</span></p>
            <p>Category: <span>{getCategoryInfo(selectedCategory).name}</span></p>
          </div>
          
          <div className="result-buttons">
            <button onClick={() => {
              changeDifficulty(difficulty);
              changeCategory(selectedCategory);
            }} className="play-again-btn">
              Play Again
            </button>
            <button onClick={resetQuiz} className="change-settings-btn">
              Change Settings
            </button>
          </div>
        </div>
      )}

      {/* Quit Confirmation Dialog */}
      {showQuitConfirmation && (
        <div className="confirmation-overlay">
          <div className="confirmation-dialog">
            <h3>Quit Quiz?</h3>
            <p>Are you sure you want to quit? Your current progress will be saved, but you won&apos;t be able to continue this quiz.</p>
            <div className="confirmation-buttons">
              <button onClick={handleConfirmQuit} className="confirm-btn">
                Yes, Quit
              </button>
              <button onClick={handleCancelQuit} className="cancel-btn">
                No, Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialTrivia;