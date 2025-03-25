/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-useless-catch */
/* eslint-disable no-case-declarations */
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable no-unused-vars */
// src/pages/FinancialTrivia.jsx
import { useState, useEffect, useRef } from "react";
import "../styles/FinancialTrivia.css";
import "../styles/FinancialTriviaQuizTypes.css";
import "../styles/QuestionTypes.css"; // Import the new question type styles

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
  const [timerSetting, setTimerSetting] = useState(30);
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [questionCount, setQuestionCount] = useState(5);
  const [showResultsReview, setShowResultsReview] = useState(false);
  const [userAnswers, setUserAnswers] = useState([]);
  const [showCertificate, setShowCertificate] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const resultsRef = useRef(null);
  
  // Quiz type options
  const [quizType, setQuizType] = useState("standard");
  const [currentStreak, setCurrentStreak] = useState(0);
  const [topStreak, setTopStreak] = useState(0);
  const [progressiveDifficulty, setProgressiveDifficulty] = useState("easy");
  const [totalQuestionsAnswered, setTotalQuestionsAnswered] = useState(0);
  const [dailyChallengeCompleted, setDailyChallengeCompleted] = useState(false);

  // New: Selected question types
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState({
    'multiple-choice': true,
    'true-false': true,
    'fill-blank': true,
    'matching': true,
    'calculation': true
  });

  // Question count options
  const questionCountOptions = [
    { value: 3, label: "3 (Quick Quiz)" },
    { value: 5, label: "5 questions" },
    { value: 10, label: "10 questions" },
    { value: 15, label: "15 questions" },
    { value: 20, label: "20 questions" }
  ];

  // Timer settings options
  const timerOptions = [
    { value: 15, label: "15 seconds" },
    { value: 30, label: "30 seconds" },
    { value: 45, label: "45 seconds" },
    { value: 60, label: "60 seconds" },
    { value: 0, label: "No time limit" }
  ];

  // Quiz type options
  const quizTypeOptions = [
    { 
      value: "standard", 
      label: "Standard Quiz", 
      description: "Answer a set number of questions with your chosen difficulty level.",
      icon: "📚"
    },
    { 
      value: "daily", 
      label: "Daily Challenge", 
      description: "A new set of 5 questions each day across various topics.",
      icon: "🗓️"
    },
    { 
      value: "progressive", 
      label: "Progressive Difficulty", 
      description: "Starts easy and gets harder as you answer correctly.",
      icon: "📈"
    },
    { 
      value: "marathon", 
      label: "Marathon Mode", 
      description: "Keep answering questions until you get one wrong.",
      icon: "🏃"
    }
  ];

  // Question type options
  const questionTypeOptions = [
    { value: "multiple-choice", label: "Multiple Choice", icon: "🔠" },
    { value: "true-false", label: "True/False", icon: "✓✗" },
    { value: "fill-blank", label: "Fill in the Blank", icon: "📝" },
    { value: "matching", label: "Matching", icon: "🔄" },
    { value: "calculation", label: "Financial Calculations", icon: "🧮" }
  ];

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

  // Get the current hostname for API calls
  const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:7900`;

  // Load user data if available
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    // Load available categories from the server
    fetchCategories();
    
    // Check if daily challenge was already completed today
    checkDailyChallengeStatus();
    
    // Check for quiz type in URL parameters
    const queryParams = new URLSearchParams(window.location.search);
    const typeParam = queryParams.get('type');
    
    if (typeParam && quizTypeOptions.some(option => option.value === typeParam)) {
      changeQuizType(typeParam);
    }
  }, []);

  // Check if daily challenge was completed today
  const checkDailyChallengeStatus = () => {
    const lastCompleted = localStorage.getItem("dailyChallengeCompleted");
    if (lastCompleted) {
      const lastDate = new Date(lastCompleted);
      const today = new Date();
      
      // Compare if the saved date is today
      if (lastDate.toDateString() === today.toDateString()) {
        setDailyChallengeCompleted(true);
      }
    }
  };

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

  // Fetch questions based on quiz type
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Handle different quiz types
      switch (quizType) {
        case "daily":
          await fetchDailyChallenge();
          break;
        case "progressive":
          await fetchProgressiveQuestions();
          break;
        case "marathon":
          await fetchMarathonQuestions();
          break;
        case "standard":
        default:
          await fetchStandardQuestions();
          break;
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching questions:", error);
      setError(error.message);
      setLoading(false);
      showNotification(`Error: ${error.message}`, "error");
    }
  };

  // Fetch standard quiz questions with question types filter
  const fetchStandardQuestions = async () => {
    try {
      // Get the selected question types
      const enabledTypes = Object.entries(selectedQuestionTypes)
        .filter(([_, enabled]) => enabled)
        .map(([type]) => type);
      
      if (enabledTypes.length === 0) {
        throw new Error("Please select at least one question type");
      }
      
      let url = `${API_BASE_URL}/trivia/questions?difficulty=${difficulty}&limit=${questionCount}`;
      
      if (selectedCategory !== "all") {
        url += `&category=${selectedCategory}`;
      }
      
      // Add question types as a parameter
      url += `&types=${enabledTypes.join(',')}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error("Failed to fetch questions");
      }
      
      const data = await response.json();
      
      if (data.length === 0) {
        throw new Error("No questions found for this combination");
      }
      
      setQuestions(data);
    } catch (error) {
      throw error;
    }
  };

  // Fetch daily challenge questions
  const fetchDailyChallenge = async () => {
    try {
      // Generate a seed based on the current date
      const today = new Date();
      const dateSeed = `${today.getFullYear()}${today.getMonth()}${today.getDate()}`;
      
      let url = `${API_BASE_URL}/trivia/questions?limit=5&dateSeed=${dateSeed}`;
      
      // Get the selected question types
      const enabledTypes = Object.entries(selectedQuestionTypes)
        .filter(([_, enabled]) => enabled)
        .map(([type]) => type);
      
      if (enabledTypes.length > 0) {
        url += `&types=${enabledTypes.join(',')}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error("Failed to fetch daily challenge");
      }
      
      const data = await response.json();
      
      if (data.length === 0) {
        throw new Error("No questions available for daily challenge");
      }
      
      setQuestions(data);
    } catch (error) {
      throw error;
    }
  };

  // Fetch progressive difficulty questions
  const fetchProgressiveQuestions = async () => {
    try {
      // Get the selected question types
      const enabledTypes = Object.entries(selectedQuestionTypes)
        .filter(([_, enabled]) => enabled)
        .map(([type]) => type);
      
      if (enabledTypes.length === 0) {
        throw new Error("Please select at least one question type");
      }
      
      // Fetch questions for all difficulty levels
      const easyUrl = `${API_BASE_URL}/trivia/questions?difficulty=easy&limit=5&types=${enabledTypes.join(',')}`;
      const mediumUrl = `${API_BASE_URL}/trivia/questions?difficulty=medium&limit=5&types=${enabledTypes.join(',')}`;
      const hardUrl = `${API_BASE_URL}/trivia/questions?difficulty=hard&limit=5&types=${enabledTypes.join(',')}`;
      
      const [easyResponse, mediumResponse, hardResponse] = await Promise.all([
        fetch(easyUrl),
        fetch(mediumUrl),
        fetch(hardUrl)
      ]);
      
      if (!easyResponse.ok || !mediumResponse.ok || !hardResponse.ok) {
        throw new Error("Failed to fetch questions for progressive mode");
      }
      
      const easyData = await easyResponse.json();
      const mediumData = await mediumResponse.json();
      const hardData = await hardResponse.json();
      
      // Combine all questions
      const combinedQuestions = [...easyData, ...mediumData, ...hardData];
      
      if (combinedQuestions.length === 0) {
        throw new Error("No questions available for progressive difficulty");
      }
      
      setQuestions(combinedQuestions);
    } catch (error) {
      throw error;
    }
  };

  // Fetch marathon questions
  const fetchMarathonQuestions = async () => {
    try {
      // Get the selected question types
      const enabledTypes = Object.entries(selectedQuestionTypes)
        .filter(([_, enabled]) => enabled)
        .map(([type]) => type);
      
      if (enabledTypes.length === 0) {
        throw new Error("Please select at least one question type");
      }
      
      // Start with easy questions for marathon mode
      let url = `${API_BASE_URL}/trivia/questions?difficulty=${difficulty}&limit=20&types=${enabledTypes.join(',')}`;
      
      if (selectedCategory !== "all") {
        url += `&category=${selectedCategory}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error("Failed to fetch marathon questions");
      }
      
      const data = await response.json();
      
      if (data.length === 0) {
        throw new Error("No questions available for marathon mode");
      }
      
      setQuestions(data);
    } catch (error) {
      throw error;
    }
  };

  // Fetch more questions for marathon mode
  const fetchMoreMarathonQuestions = async () => {
    try {
      // Determine difficulty based on streak
      let marathonDifficulty = "easy";
      if (currentStreak >= 20) {
        marathonDifficulty = "hard";
      } else if (currentStreak >= 10) {
        marathonDifficulty = "medium";
      }
      
      // Get the selected question types
      const enabledTypes = Object.entries(selectedQuestionTypes)
        .filter(([_, enabled]) => enabled)
        .map(([type]) => type);
      
      let url = `${API_BASE_URL}/trivia/questions?difficulty=${marathonDifficulty}&limit=10&types=${enabledTypes.join(',')}`;
      
      if (selectedCategory !== "all") {
        url += `&category=${selectedCategory}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error("Failed to fetch more marathon questions");
        return;
      }
      
      const newQuestions = await response.json();
      
      if (newQuestions.length > 0) {
        setQuestions(prev => [...prev, ...newQuestions]);
      }
    } catch (error) {
      console.error("Error fetching more marathon questions:", error);
    }
  };
  
  // Load questions when difficulty, category, or quiz type changes
  useEffect(() => {
    if (!quizStarted) {
      fetchQuestions();
    }
  }, [difficulty, selectedCategory, questionCount, quizType, selectedQuestionTypes]);

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
          title: `Financial Trivia - ${quizTypeOptions.find(t => t.value === quizType)?.label}`,
          score: finalScore,
          metadata: JSON.stringify({
            difficulty,
            category: selectedCategory,
            quizType,
            questionCount,
            topStreak: quizType === "marathon" ? topStreak : undefined,
            questionTypes: Object.entries(selectedQuestionTypes)
              .filter(([_, enabled]) => enabled)
              .map(([type]) => type)
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

  // Timer countdown
  useEffect(() => {
    let timer;
    if (quizStarted && !answerSubmitted && !showScore && timeLeft > 0 && timerEnabled && timerSetting > 0) {
      timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && !answerSubmitted && !showScore && timerEnabled && timerSetting > 0) {
      handleTimeUp();
    }
    
    return () => clearTimeout(timer);
  }, [timeLeft, answerSubmitted, showScore, quizStarted, timerEnabled]);

  // Start quiz
  const startQuiz = () => {
    if (questions.length === 0) {
      showNotification("No questions available. Try a different mode or category.", "error");
      return;
    }
    
    // Reset state for new quiz
    setQuizStarted(true);
    setTimeLeft(timerSetting);
    setCurrentQuestion(0);
    setScore(0);
    setShowScore(false);
    setSelectedAnswer(null);
    setAnswerSubmitted(false);
    setQuizFinished(false);
    setCurrentStreak(0);
    setTotalQuestionsAnswered(0);
    setProgressiveDifficulty("easy");
    setUserAnswers([]);
    setShowHint(false);
    
    // Shuffle questions for standard and daily modes
    if (quizType === "standard" || quizType === "daily") {
      setQuestions(prevQuestions => [...prevQuestions].sort(() => Math.random() - 0.5));
    }
    
    // Sort questions by difficulty for progressive mode
    if (quizType === "progressive") {
      setQuestions(prevQuestions => 
        [...prevQuestions].sort((a, b) => {
          const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
          return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
        })
      );
    }
  };

  // Check if answer is correct based on question type
  const checkAnswer = () => {
    if (selectedAnswer === null) return false;
    
    const currentQ = questions[currentQuestion];
    const questionType = currentQ.type || "multiple-choice";
    
    switch (questionType) {
      case 'multiple-choice':
      case 'true-false':
        return selectedAnswer === currentQ.correctAnswer;
        
      case 'fill-blank':
        // Case insensitive comparison
        return selectedAnswer.toLowerCase().trim() === currentQ.correctAnswer.toLowerCase().trim();
        
      case 'matching':
        // Check if all matches are correct
        return JSON.stringify(selectedAnswer) === JSON.stringify(currentQ.correctMatches);
        
      case 'calculation':
        // Allow small tolerance for floating point errors
        const tolerance = 0.01;
        return Math.abs(parseFloat(selectedAnswer) - currentQ.correctAnswer) <= tolerance;
        
      default:
        return selectedAnswer === currentQ.correctAnswer;
    }
  };

  // Go to next question
  const goToNextQuestion = () => {
    setTotalQuestionsAnswered(prev => prev + 1);
    
    // Handle marathon mode - continue until wrong answer
    if (quizType === "marathon" && !answerIsCorrect) {
      setShowScore(true);
      setQuizFinished(true);
      if (user) {
        trackGameProgress(score);
      }
      return;
    }
    
    // For regular progression
    const nextQuestion = currentQuestion + 1;
    
    // Check if we've reached the end of questions
    if (nextQuestion < questions.length) {
      // Continue to next question
      setCurrentQuestion(nextQuestion);
      setSelectedAnswer(null);
      setAnswerSubmitted(false);
      setTimeLeft(timerSetting);
      setShowHint(false);
      
      // For progressive mode, check if we should increase difficulty
      if (quizType === "progressive") {
        const currentProgress = totalQuestionsAnswered + 1;
        if (currentProgress === 5) {
          setProgressiveDifficulty("medium");
          showNotification("Difficulty increased to Medium!", "info");
        } else if (currentProgress === 10) {
          setProgressiveDifficulty("hard");
          showNotification("Difficulty increased to Hard!", "info");
        }
      }
      
      // For marathon mode, fetch more questions if needed
      if (quizType === "marathon" && nextQuestion >= questions.length - 5) {
        fetchMoreMarathonQuestions();
      }
    } else {
      // End of quiz reached
      setShowScore(true);
      setQuizFinished(true);
      
      // Mark daily challenge as completed if applicable
      if (quizType === "daily") {
        setDailyChallengeCompleted(true);
        localStorage.setItem("dailyChallengeCompleted", new Date().toISOString());
      }
      
      // Track game progress
      if (user) {
        trackGameProgress(score);
      }
    }
  };

  // Handle answer submission
  const handleAnswerSubmit = () => {
    if (selectedAnswer === null) {
      showNotification("Please select an answer first!", "warning");
      return;
    }
    
    setAnswerSubmitted(true);
    const isCorrect = checkAnswer();
    setAnswerIsCorrect(isCorrect);

    // Save the user's answer for this question
    setUserAnswers(prev => [
      ...prev, 
      {
        question: questions[currentQuestion].question,
        userAnswer: selectedAnswer,
        correctAnswer: questions[currentQuestion].correctAnswer,
        questionType: questions[currentQuestion].type || "multiple-choice",
        options: questions[currentQuestion].options,
        terms: questions[currentQuestion].terms,
        definitions: questions[currentQuestion].definitions,
        explanation: questions[currentQuestion].explanation,
        isCorrect: isCorrect
      }
    ]);
    
    if (isCorrect) {
      // Calculate points based on difficulty and quiz type
      let difficultyPoints = 10; // Default easy points
      
      if (quizType === "progressive") {
        // Use progressive difficulty for scoring
        difficultyPoints = progressiveDifficulty === "easy" ? 10 : 
                          progressiveDifficulty === "medium" ? 20 : 30;
      } else {
        // Use question's actual difficulty for scoring
        difficultyPoints = questions[currentQuestion].difficulty === "easy" ? 10 : 
                          questions[currentQuestion].difficulty === "medium" ? 20 : 30;
      }
      
      // Add bonus points for harder question types
      let questionTypeBonus = 0;
      switch (questions[currentQuestion].type) {
        case 'matching':
          questionTypeBonus = 10;
          break;
        case 'calculation':
          questionTypeBonus = 15;
          break;
        case 'fill-blank':
          questionTypeBonus = 5;
          break;
        default:
          questionTypeBonus = 0;
      }
      
      // Add time bonus for timed quizzes
      const timeBonus = timerEnabled && timerSetting > 0 ? Math.round(timeLeft * 0.2) : 0;
      const totalPoints = difficultyPoints + questionTypeBonus + timeBonus;
      
      setScore(prev => prev + totalPoints);
      
      // Update streak for marathon mode
      if (quizType === "marathon") {
        const newStreak = currentStreak + 1;
        setCurrentStreak(newStreak);
        if (newStreak > topStreak) {
          setTopStreak(newStreak);
        }
      }
      
      let pointsMessage = `✅ Correct! +${totalPoints} points`;
      if (timeBonus > 0) pointsMessage += ` (includes ${timeBonus} time bonus)`;
      if (questionTypeBonus > 0) pointsMessage += ` (includes ${questionTypeBonus} question type bonus)`;
      
      showNotification(pointsMessage, "success");
    } else {
      // Reset streak for marathon mode on wrong answer
      if (quizType === "marathon") {
        setCurrentStreak(0);
      }
      showNotification("❌ Incorrect!", "error");
    }
    
    // Move to next question after 2 seconds
    setTimeout(() => goToNextQuestion(), 2000);
  };

  // Handle time up
  const handleTimeUp = () => {
    setAnswerSubmitted(true);
    setAnswerIsCorrect(false);

    // Save the time-up as a skipped answer
    setUserAnswers(prev => [
      ...prev, 
      {
        question: questions[currentQuestion].question,
        userAnswer: null, // No answer selected
        correctAnswer: questions[currentQuestion].correctAnswer,
        questionType: questions[currentQuestion].type || "multiple-choice",
        options: questions[currentQuestion].options,
        explanation: questions[currentQuestion].explanation,
        isCorrect: false
      }
    ]);
    
    // Reset streak for marathon mode on time up
    if (quizType === "marathon") {
      setCurrentStreak(0);
    }
    
    showNotification("⏰ Time's up!", "warning");
    
    // Move to next question after 2 seconds
    setTimeout(() => goToNextQuestion(), 2000);
  };

  // Handle answer selection
  const handleAnswerSelect = (answer) => {
    if (!answerSubmitted) {
      setSelectedAnswer(answer);
    }
  };

  // Toggle hint visibility for calculation questions
  const toggleHint = () => {
    setShowHint(!showHint);
  };

  // Reset the quiz
  const resetQuiz = () => {
    setQuizStarted(false);
    setShowScore(false);
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setAnswerSubmitted(false);
    setTimeLeft(timerSetting);
    setQuizFinished(false);
    setCurrentStreak(0);
    setTopStreak(0);
    setTotalQuestionsAnswered(0);
    setProgressiveDifficulty("easy");
    fetchQuestions();
    setUserAnswers([]);
    setShowResultsReview(false);
    setShowHint(false);
  };

  // Export results as text file
  const exportResultsAsText = () => {
    // Create a text representation of the results
    let resultsText = `Financial Trivia Quiz Results\n`;
    resultsText += `Quiz Type: ${quizTypeOptions.find(t => t.value === quizType)?.label}\n`;
    resultsText += `Final Score: ${score}\n`;
    resultsText += `Correct Answers: ${userAnswers.filter(a => a.isCorrect).length} out of ${userAnswers.length}\n\n`;
    
    // Add each question and answer
    userAnswers.forEach((answer, index) => {
      resultsText += `Question ${index + 1} (${answer.questionType}): ${answer.question}\n`;
      
      switch (answer.questionType) {
        case 'multiple-choice':
        case 'true-false':
          resultsText += `Your Answer: ${answer.userAnswer !== null ? answer.options[answer.userAnswer] : "Time's up - No answer"}\n`;
          resultsText += `Correct Answer: ${answer.options[answer.correctAnswer]}\n`;
          break;
          
        case 'fill-blank':
          resultsText += `Your Answer: ${answer.userAnswer !== null ? answer.userAnswer : "Time's up - No answer"}\n`;
          resultsText += `Correct Answer: ${answer.correctAnswer}\n`;
          break;
          
        case 'matching':
          resultsText += `Your Matches: ${answer.userAnswer !== null ? JSON.stringify(answer.userAnswer) : "Time's up - No answer"}\n`;
          resultsText += `Correct Matches: ${JSON.stringify(answer.correctAnswer)}\n`;
          break;
          
        case 'calculation':
          resultsText += `Your Answer: ${answer.userAnswer !== null ? answer.userAnswer : "Time's up - No answer"}\n`;
          resultsText += `Correct Answer: ${answer.correctAnswer}\n`;
          break;
          
        default:
          resultsText += `Your Answer: ${answer.userAnswer !== null ? answer.userAnswer : "Time's up - No answer"}\n`;
          resultsText += `Correct Answer: ${answer.correctAnswer}\n`;
      }
      
      resultsText += `Result: ${answer.isCorrect ? "Correct" : "Incorrect"}\n`;
      resultsText += `Explanation: ${answer.explanation}\n\n`;
    });
    
    // Create a download link
    const element = document.createElement("a");
    const file = new Blob([resultsText], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "financial_trivia_results.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Generate certificate
  const generateCertificate = () => {
    const correctPercentage = (userAnswers.filter(a => a.isCorrect).length / userAnswers.length) * 100;
    
    // Only generate a certificate if the user got at least 80% correct
    if (correctPercentage < 80) {
      showNotification("Score at least 80% to earn a certificate!", "warning");
      return;
    }
    
    setShowCertificate(true);
  };

  // Toggle question type
  const toggleQuestionType = (type) => {
    setSelectedQuestionTypes(prev => {
      // Make sure at least one question type is selected
      const otherTypesSelected = Object.entries(prev)
        .filter(([key]) => key !== type)
        .some(([_, enabled]) => enabled);
      
      // If trying to unselect the last selected type, prevent it
      if (prev[type] && !otherTypesSelected) {
        showNotification("At least one question type must be selected", "warning");
        return prev;
      }
      
      return {
        ...prev,
        [type]: !prev[type]
      };
    });
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

  // Change quiz type
  const changeQuizType = (type) => {
    setQuizType(type);
    
    // Adjust settings based on quiz type
    switch (type) {
      case "daily":
        setQuestionCount(5);
        setTimerSetting(30);
        setTimerEnabled(true);
        break;
      case "progressive":
        setQuestionCount(15);
        setTimerSetting(30);
        setTimerEnabled(true);
        break;
      case "marathon":
        // Marathon mode uses unlimited questions
        setTimerSetting(20);
        setTimerEnabled(true);
        break;
      case "standard":
      default:
        // Keep current settings
        break;
    }
    
    resetQuiz();
  };

  // Handle showing quit confirmation dialog
  const handleQuitClick = () => {
    setShowQuitConfirmation(true);
  };

  // Handle actual quitting after confirmation
  const handleConfirmQuit = () => {
    // Track progress if user has played at least one question
    if (currentQuestion > 0 && user && !quizFinished) {
      trackGameProgress(score);
    }
    
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

  // Render different question types
  const renderQuestion = () => {
    if (!questions[currentQuestion]) return null;
    
    const currentQ = questions[currentQuestion];
    const questionType = currentQ.type || "multiple-choice";
    
    switch (questionType) {
      case 'multiple-choice':
        return (
          <div className="question-container">
            <h3 className="question">{currentQ.question}</h3>
            <div className="options-container">
              {currentQ.options.map((option, index) => (
                <div 
                  key={index} 
                  className={`
                    option 
                    ${selectedAnswer === index ? "selected" : ""} 
                    ${answerSubmitted && index === currentQ.correctAnswer ? "correct" : ""}
                    ${answerSubmitted && selectedAnswer === index && index !== currentQ.correctAnswer ? "incorrect" : ""}
                  `}
                  onClick={() => handleAnswerSelect(index)}
                >
                  {option}
                </div>
              ))}
            </div>
          </div>
        );
        
      case 'true-false':
        return (
          <div className="question-container">
            <h3 className="question">{currentQ.question}</h3>
            <div className="options-container true-false-options">
              {["True", "False"].map((option, index) => (
                <div 
                  key={index} 
                  className={`
                    option true-false-option 
                    ${selectedAnswer === index ? "selected" : ""} 
                    ${answerSubmitted && index === currentQ.correctAnswer ? "correct" : ""}
                    ${answerSubmitted && selectedAnswer === index && index !== currentQ.correctAnswer ? "incorrect" : ""}
                  `}
                  onClick={() => handleAnswerSelect(index)}
                >
                  {option}
                </div>
              ))}
            </div>
          </div>
        );
        
      case 'fill-blank':
        // Split the question at the blank marker ____ or [blank]
        const parts = currentQ.question.split(/____|\[blank\]/i);
        
        return (
          <div className="question-container">
            <div className="question fill-blank-question">
              {parts[0]}
              <input 
                type="text" 
                value={selectedAnswer || ""}
                onChange={(e) => handleAnswerSelect(e.target.value)}
                className={`
                  blank-input 
                  ${answerSubmitted && checkAnswer() ? "correct-input" : ""}
                  ${answerSubmitted && !checkAnswer() ? "incorrect-input" : ""}
                `}
                disabled={answerSubmitted}
                placeholder="Enter your answer"
              />
              {parts[1] || ""}
            </div>
            
            {answerSubmitted && !checkAnswer() && (
              <div className="correct-answer-display">
                <p>Correct answer: <strong>{currentQ.correctAnswer}</strong></p>
              </div>
            )}
          </div>
        );
        
      case 'matching':
        const [matchingState, setMatchingState] = useState({
          selectedTerm: null,
          matches: Array(currentQ.terms.length).fill(null)
        });
        
        const handleTermClick = (index) => {
          if (answerSubmitted) return;
          setMatchingState({...matchingState, selectedTerm: index});
        };
        
        const handleDefinitionClick = (index) => {
          if (answerSubmitted || matchingState.selectedTerm === null) return;
          
          const newMatches = [...matchingState.matches];
          newMatches[matchingState.selectedTerm] = index;
          
          setMatchingState({
            selectedTerm: null,
            matches: newMatches
          });
          
          handleAnswerSelect(newMatches);
        };
        
        return (
          <div className="question-container">
            <h3 className="question">{currentQ.question}</h3>
            
            <div className="matching-container">
              <div className="terms-column">
                <h4>Terms</h4>
                {currentQ.terms.map((term, index) => (
                  <div 
                    key={index} 
                    className={`
                      matching-item term-item 
                      ${matchingState.selectedTerm === index ? "selected" : ""}
                      ${answerSubmitted && currentQ.correctMatches[index] === matchingState.matches[index] ? "correct-match" : ""}
                      ${answerSubmitted && currentQ.correctMatches[index] !== matchingState.matches[index] ? "incorrect-match" : ""}
                    `}
                    onClick={() => handleTermClick(index)}
                  >
                    {term}
                  </div>
                ))}
              </div>
              
              <div className="definitions-column">
                <h4>Definitions</h4>
                {currentQ.definitions.map((definition, index) => (
                  <div 
                    key={index} 
                    className={`
                      matching-item definition-item
                      ${answerSubmitted && matchingState.matches.includes(index) && 
                        currentQ.correctMatches[matchingState.matches.indexOf(index)] === index ? "correct-match" : ""}
                      ${answerSubmitted && matchingState.matches.includes(index) && 
                        currentQ.correctMatches[matchingState.matches.indexOf(index)] !== index ? "incorrect-match" : ""}
                    `}
                    onClick={() => handleDefinitionClick(index)}
                  >
                    {definition}
                  </div>
                ))}
              </div>
            </div>
            
            {answerSubmitted && (
              <div className="correct-matches-display">
                <h4>Correct Matches:</h4>
                <ul>
                  {currentQ.terms.map((term, index) => (
                    <li key={index}>
                      <strong>{term}</strong>: {currentQ.definitions[currentQ.correctMatches[index]]}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
        
      case 'calculation':
        return (
          <div className="question-container">
            <h3 className="question">{currentQ.question}</h3>
            
            <div className="calculation-input-container">
              <input 
                type="number" 
                step="0.01"
                value={selectedAnswer || ""}
                onChange={(e) => handleAnswerSelect(parseFloat(e.target.value))}
                className={`
                  calculation-input 
                  ${answerSubmitted && checkAnswer() ? "correct-input" : ""}
                  ${answerSubmitted && !checkAnswer() ? "incorrect-input" : ""}
                `}
                disabled={answerSubmitted}
                placeholder="Enter your answer"
              />
            </div>
            
            <button 
              onClick={toggleHint} 
              className="hint-button"
              disabled={answerSubmitted}
            >
              {showHint ? "Hide Hint" : "Show Hint"}
            </button>
            
            {showHint && (
              <div className="hint-container">
                <p><strong>Hint:</strong> {currentQ.hint}</p>
                {currentQ.formula && (
                  <div className="formula-display">
                    <p><strong>Formula:</strong> {currentQ.formula}</p>
                  </div>
                )}
              </div>
            )}
            
            {answerSubmitted && (
              <div className={`answer-feedback ${checkAnswer() ? "correct-feedback" : "incorrect-feedback"}`}>
                <p>
                  {checkAnswer() 
                    ? "Correct!" 
                    : `Incorrect. The correct answer is ${currentQ.correctAnswer}.`}
                </p>
              </div>
            )}
          </div>
        );
        
      default:
        // Fall back to multiple choice if type is unknown
        return (
          <div className="question-container">
            <h3 className="question">{currentQ.question}</h3>
            <div className="options-container">
              {currentQ.options.map((option, index) => (
                <div 
                  key={index} 
                  className={`
                    option 
                    ${selectedAnswer === index ? "selected" : ""} 
                    ${answerSubmitted && index === currentQ.correctAnswer ? "correct" : ""}
                    ${answerSubmitted && selectedAnswer === index && index !== currentQ.correctAnswer ? "incorrect" : ""}
                  `}
                  onClick={() => handleAnswerSelect(index)}
                >
                  {option}
                </div>
              ))}
            </div>
          </div>
        );
    }
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
      
      {/* Quiz Selection UI */}
      {!quizStarted && (
        <div className="quiz-selection">
          {/* Quiz Type Selection */}
          <div className="selection-section quiz-type-selector">
            <h3>Select Quiz Type:</h3>
            <div className="quiz-type-options">
              {quizTypeOptions.map((option) => (
                <button 
                  key={option.value}
                  className={`quiz-type-btn ${quizType === option.value ? "active" : ""} ${option.value === "daily" && dailyChallengeCompleted ? "completed" : ""}`}
                  onClick={() => changeQuizType(option.value)}
                  disabled={option.value === "daily" && dailyChallengeCompleted}
                >
                  <span className="quiz-type-icon">{option.icon}</span>
                  <span className="quiz-type-label">{option.label}</span>
                  {option.value === "daily" && dailyChallengeCompleted && (
                    <span className="daily-completed-badge">✅ Completed Today</span>
                  )}
                </button>
              ))}
            </div>
            <p className="quiz-type-description">
              {quizTypeOptions.find(option => option.value === quizType)?.description}
            </p>
          </div>

          {/* NEW: Question Types Selection */}
          <div className="selection-section question-types-selector">
            <h3>Select Question Types:</h3>
            <div className="question-type-options">
              {questionTypeOptions.map((option) => (
                <button 
                  key={option.value}
                  className={`quiz-type-btn ${selectedQuestionTypes[option.value] ? "active" : ""}`}
                  onClick={() => toggleQuestionType(option.value)}
                >
                  <span className="quiz-type-icon">{option.icon}</span>
                  <span className="quiz-type-label">{option.label}</span>
                </button>
              ))}
            </div>
            <p className="quiz-type-description">
              Mix different question types to test your knowledge in various ways.
            </p>
          </div>

          {/* Only show difficulty for standard and marathon modes */}
          {(quizType === "standard" || quizType === "marathon") && (
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
          )}

          {/* Only show timer settings for standard and marathon modes */}
          {(quizType === "standard" || quizType === "marathon") && (
            <div className="selection-section timer-selector">
              <h3>Timer Settings:</h3>
              <div className="timer-options">
                {timerOptions.map((option) => (
                  <button 
                    key={option.value} 
                    className={`timer-btn ${timerSetting === option.value ? "active" : ""}`}
                    onClick={() => {
                      setTimerSetting(option.value);
                      setTimerEnabled(option.value > 0);
                    }}
                    disabled={quizType === "marathon" && option.value === 0}
                  >
                    {option.label}
                    {quizType === "marathon" && option.value === 0 && " (Not available for Marathon)"}
                  </button>
                ))}
              </div>
              <p className="timer-description">
                {timerSetting > 0 
                  ? `You'll have ${timerSetting} seconds to answer each question.` 
                  : "Take your time. There's no time limit for answering questions."}
              </p>
            </div>
          )}

          {/* Only show question count for standard mode */}
          {quizType === "standard" && (
            <div className="selection-section question-count-selector">
              <h3>Number of Questions:</h3>
              <div className="question-count-options">
                {questionCountOptions.map((option) => (
                  <button 
                    key={option.value} 
                    className={`question-count-btn ${questionCount === option.value ? "active" : ""}`}
                    onClick={() => setQuestionCount(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="question-count-description">
                {questionCount <= 5 
                  ? "A short quiz to test your knowledge." 
                  : questionCount <= 10 
                  ? "A medium-length quiz to challenge you." 
                  : "A comprehensive quiz to thoroughly test your knowledge."}
              </p>
            </div>
          )}

          {/* Only show category selection for standard and marathon modes */}
          {(quizType === "standard" || quizType === "marathon") && (
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
          )}
          
          {/* Show information about the quiz type */}
          <div className="quiz-mode-info">
            {quizType === "daily" && (
              <div className="daily-challenge-info">
                <h3>About Daily Challenge</h3>
                <p>
                  Test your knowledge with a new set of 5 curated questions each day.
                  Covers various financial topics and difficulty levels. Challenge
                  resets at midnight.
                </p>
                {dailyChallengeCompleted && (
                  <div className="daily-completed-message">
                    <p>You&apos;ve already completed today&apos;s challenge! Come back tomorrow for a new set of questions.</p>
                  </div>
                )}
              </div>
            )}
            
            {quizType === "progressive" && (
              <div className="progressive-info">
                <h3>About Progressive Difficulty</h3>
                <p>
                  You&apos;ll start with 5 easy questions, then move to 5 medium questions,
                  and finish with 5 hard questions. Each level awards more points!
                </p>
              </div>
            )}
            
            {quizType === "marathon" && (
              <div className="marathon-info">
                <h3>About Marathon Mode</h3>
                <p>
                  Keep answering questions as long as you can. The quiz ends when you
                  answer incorrectly or run out of time. The difficulty increases as
                  your streak builds. How many can you get right in a row?
                </p>
              </div>
            )}
          </div>
          
          {/* Loading/error states and start button */}
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
            <button 
              onClick={startQuiz} 
              className="start-quiz-btn"
              disabled={quizType === "daily" && dailyChallengeCompleted}
            >
              {quizType === "daily" && dailyChallengeCompleted 
                ? "Today's Challenge Completed" 
                : `Start ${quizTypeOptions.find(t => t.value === quizType)?.label}`}
            </button>
          )}
        </div>
      )}
      
      {/* Quiz in progress */}
      {quizStarted && !showScore && questions.length > 0 && (
        <div className="quiz-container">
          <div className="quiz-header">
            <div className="quiz-progress">
              {quizType === "marathon" ? (
                <span>Streak: {currentStreak} questions</span>
              ) : (
                <span>Question {currentQuestion + 1}/{quizType === "progressive" ? 15 : quizType === "daily" ? 5 : questions.length}</span>
              )}
            </div>
            <div className="quiz-score">
              Score: {score}
            </div>
            <div className="quiz-info">
              <span className="quiz-difficulty">
                {quizType === "progressive" 
                  ? progressiveDifficulty.charAt(0).toUpperCase() + progressiveDifficulty.slice(1)
                  : (questions[currentQuestion].difficulty || 'Medium').charAt(0).toUpperCase() + 
                    (questions[currentQuestion].difficulty || 'Medium').slice(1)}
              </span>
              <span className="quiz-type-label">
                {questionTypeOptions.find(t => t.value === questions[currentQuestion].type)?.icon || "🔠"}
              </span>
            </div>
            {timerEnabled && timerSetting > 0 && (
              <div className={`quiz-timer ${timeLeft < 10 ? "running-out" : ""}`}>
                Time: {timeLeft}s
              </div>
            )}
          </div>
          
          <div className="question-container">
            {/* Render the current question based on its type */}
            {renderQuestion()}
            
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
          
          {quizType === "marathon" ? (
            <div className="marathon-results">
              <div className="streak-display">
                <p>Your marathon streak: <span>{topStreak}</span></p>
                <p>Total questions answered: <span>{totalQuestionsAnswered}</span></p>
              </div>
            </div>
          ) : null}
          
          <div className="final-score">
            <p>Your score: <span>{score}</span></p>
            <p>Quiz type: <span>{quizTypeOptions.find(t => t.value === quizType)?.label}</span></p>
            <p>Correct answers: <span>{userAnswers.filter(a => a.isCorrect).length} out of {userAnswers.length}</span></p>
            
            {quizType === "standard" && (
              <>
                <p>Difficulty: <span>{difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</span></p>
                <p>Category: <span>{getCategoryInfo(selectedCategory).name}</span></p>
              </>
            )}
            
            {quizType === "daily" && dailyChallengeCompleted && (
              <div className="daily-badge">
                <p>🏆 Daily Challenge Complete!</p>
                <p>Come back tomorrow for a new set of questions</p>
              </div>
            )}
          </div>
          
          <div className="result-buttons">
            <button onClick={() => {
              if (quizType === "standard") {
                changeDifficulty(difficulty);
                changeCategory(selectedCategory);
              } else {
                changeQuizType(quizType);
              }
            }} className="play-again-btn">
              {quizType === "daily" && dailyChallengeCompleted 
                ? "Try Another Quiz Type" 
                : "Play Again"}
            </button>
            <button onClick={resetQuiz} className="change-settings-btn">
              Change Settings
            </button>
          </div>
        </div>
      )}

      {/* Quiz Results Review */}
      {showScore && (
        <div className="result-actions">
          <button 
            onClick={() => setShowResultsReview(!showResultsReview)} 
            className="show-results-btn"
          >
            {showResultsReview ? "Hide Details" : "Show Results Details"}
          </button>
        </div>
      )}

      {showResultsReview && (
        <div className="results-review">
          <h3>Question Review</h3>
          <p className="results-summary">
            You answered {userAnswers.filter(a => a.isCorrect).length} out of {userAnswers.length} questions correctly.
          </p>
          
          <div className="question-review-list">
            {userAnswers.map((answer, index) => (
              <div 
                key={index} 
                className={`question-review-item ${answer.isCorrect ? "correct" : "incorrect"}`}
              >
                <div className="question-review-header">
                  <span className="question-number">Question {index + 1}</span>
                  <span className={`question-result ${answer.isCorrect ? "correct" : "incorrect"}`}>
                    {answer.isCorrect ? "✓ Correct" : "✗ Incorrect"}
                  </span>
                </div>
                
                <p className="question-text">
                  <span className="question-type-badge">
                    {questionTypeOptions.find(t => t.value === answer.questionType)?.icon || "🔠"}
                  </span>
                  {answer.question}
                </p>
                
                <div className="explanation-review">
                  <strong>Explanation:</strong> {answer.explanation}
                </div>
              </div>
            ))}
          </div>
          
          <button 
            onClick={() => setShowResultsReview(false)} 
            className="close-review-btn"
          >
            Close Review
          </button>

          <div className="results-actions">
            <h4>Save Your Results</h4>
            <div className="results-buttons">
              <button onClick={exportResultsAsText} className="export-results-btn">
                Download as Text
              </button>
              {userAnswers.filter(a => a.isCorrect).length / userAnswers.length >= 0.8 && (
                <button onClick={generateCertificate} className="certificate-btn">
                  View Certificate
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Certificate Modal */}
      {showCertificate && (
        <div className="certificate-modal">
          <div className="certificate-content">
            <button 
              className="close-certificate" 
              onClick={() => setShowCertificate(false)}
            >
              ×
            </button>
            <div className="certificate">
              <div className="certificate-logo">🏆</div>
              <div className="certificate-title">Certificate of Achievement</div>
              <p>This certifies that</p>
              <div className="user-name">{user?.username || "Financial Learner"}</div>
              <p className="achievement">has successfully completed the</p>
              <p className="achievement"><strong>{quizTypeOptions.find(t => t.value === quizType)?.label}</strong></p>
              <p className="achievement">in Financial Literacy</p>
              <p className="score">with a score of {score} ({(userAnswers.filter(a => a.isCorrect).length / userAnswers.length * 100).toFixed(0)}% correct)</p>
              <p className="date">Date: {new Date().toLocaleDateString()}</p>
            </div>
            <div className="certificate-actions">
              <button 
                onClick={() => window.print()} 
                className="print-certificate-btn"
              >
                Print Certificate
              </button>
            </div>
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