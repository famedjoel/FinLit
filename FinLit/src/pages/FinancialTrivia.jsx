/* eslint-disable brace-style */
/* eslint-disable multiline-ternary */
/* eslint-disable no-useless-catch */
/* eslint-disable no-case-declarations */
/* eslint-disable no-unused-vars */
import { useState, useEffect, useRef } from 'react';
import '../styles/FinancialTrivia.css';
import '../styles/FinancialTriviaQuizTypes.css';
import '../styles/QuestionTypes.css';
import { useSearchParams, useNavigate } from 'react-router-dom';


const FinancialTrivia = () => {
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
  const [difficulty, setDifficulty] = useState('easy');
  const [gameType, setGameType] = useState('standard');
  const [timer, setTimer] = useState(30);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showQuitConfirmation, setShowQuitConfirmation] = useState(false);
  const [timerSetting, setTimerSetting] = useState(30);
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [questionCount, setQuestionCount] = useState(5);
  const [showResultsReview, setShowResultsReview] = useState(false);
  const [userAnswers, setUserAnswers] = useState([]);
  const [showCertificate, setShowCertificate] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const resultsRef = useRef(null);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [searchParams] = useSearchParams();
  const challengeId = searchParams.get('challengeId');
  const navigate = useNavigate();
  const [message, setMessage] = useState(''); // <-- New: To show submission message
  const [challengeSettings, setChallengeSettings] = useState(null);
  const [loadingChallenge, setLoadingChallenge] = useState(false);
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [challengeMode, setChallengeMode] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [masteryData, setMasteryData] = useState({});
  const [categoryPerformance, setCategoryPerformance] = useState({});

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }

        const categoriesResponse = await fetch(`${API_BASE_URL}/trivia/categories`);
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          setCategories(categoriesData);
        }

        const params = new URLSearchParams(window.location.search);
        const challengeId = params.get('challengeId');
        const urlDifficulty = params.get('difficulty');
        const urlCategory = params.get('category');
        const urlType = params.get('type');

        if (challengeId) {
          await fetchQuestionsForChallenge(challengeId);
        } else if (urlType === 'daily') {
          const today = new Date().toDateString();
          const dateSeed = Date.parse(today);
          fetchDailyChallenge(dateSeed);
        } else if (urlType === 'progressive') {
          setGameType('progressive');
          fetchQuestions('easy', urlCategory || selectedCategory, 5);
        } else if (urlType === 'marathon') {
          setGameType('marathon');
          fetchQuestions(urlDifficulty || difficulty, urlCategory || selectedCategory, 20);
        } else {
          if (urlDifficulty) setDifficulty(urlDifficulty);
          if (urlCategory) setSelectedCategory(urlCategory);

          fetchQuestions(
            urlDifficulty || difficulty,
            urlCategory || selectedCategory,
            questionCount,
          );
        }
      } catch (err) {
        console.error('Error during initialization:', err);
        setError('Failed to initialize the game. Please try again.');
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);


  const [quizType, setQuizType] = useState('standard');
  const [currentStreak, setCurrentStreak] = useState(0);
  const [topStreak, setTopStreak] = useState(0);
  const [progressiveDifficulty, setProgressiveDifficulty] = useState('easy');
  const [totalQuestionsAnswered, setTotalQuestionsAnswered] = useState(0);
  const [dailyChallengeCompleted, setDailyChallengeCompleted] = useState(false);

  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState({
    'multiple-choice': true,
    'true-false': true,
    'fill-blank': true,
    'matching': true,
    'calculation': true,
  });

  const questionCountOptions = [
    { value: 3, label: '3 (Quick Quiz)' },
    { value: 5, label: '5 questions' },
    { value: 10, label: '10 questions' },
    { value: 15, label: '15 questions' },
    { value: 20, label: '20 questions' },
  ];

  const timerOptions = [
    { value: 15, label: '15 seconds' },
    { value: 30, label: '30 seconds' },
    { value: 45, label: '45 seconds' },
    { value: 60, label: '60 seconds' },
    { value: 0, label: 'No time limit' },
  ];

  const quizTypeOptions = [
    {
      value: 'standard',
      label: 'Standard Quiz',
      description: 'Answer a set number of questions with your chosen difficulty level.',
      icon: '📚',
    },
    {
      value: 'daily',
      label: 'Daily Challenge',
      description: 'A new set of 5 questions each day across various topics.',
      icon: '🗓️',
    },
    {
      value: 'progressive',
      label: 'Progressive Difficulty',
      description: 'Starts easy and gets harder as you answer correctly.',
      icon: '📈',
    },
    {
      value: 'marathon',
      label: 'Marathon Mode',
      description: 'Keep answering questions until you get one wrong.',
      icon: '🏃',
    },
  ];

  const questionTypeOptions = [
    { value: 'multiple-choice', label: 'Multiple Choice', icon: '🔠' },
    { value: 'true-false', label: 'True/False', icon: '✓✗' },
    { value: 'fill-blank', label: 'Fill in the Blank', icon: '📝' },
    { value: 'matching', label: 'Matching', icon: '🔄' },
    { value: 'calculation', label: 'Financial Calculations', icon: '🧮' },
  ];

  const financialCategories = [
    { id: 'all', name: 'All Topics', icon: '📚' },
    { id: 'investing', name: 'Investing', icon: '📈' },
    { id: 'budgeting', name: 'Budgeting', icon: '💰' },
    { id: 'savings', name: 'Savings', icon: '🏦' },
    { id: 'credit', name: 'Credit', icon: '💳' },
    { id: 'taxes', name: 'Taxes', icon: '📝' },
    { id: 'retirement', name: 'Retirement', icon: '🏖️' },
    { id: 'insurance', name: 'Insurance', icon: '🛡️' },
    { id: 'debt', name: 'Debt Management', icon: '⚖️' },
  ];

  // Get the current hostname for API calls
  const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:7900`;

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    fetchCategories();

    checkDailyChallengeStatus();

    const queryParams = new URLSearchParams(window.location.search);
    const typeParam = queryParams.get('type');

    if (typeParam && quizTypeOptions.some(option => option.value === typeParam)) {
      changeQuizType(typeParam);
    }
  }, []);

  const checkDailyChallengeStatus = () => {
    const lastCompleted = localStorage.getItem('dailyChallengeCompleted');
    if (lastCompleted) {
      const lastDate = new Date(lastCompleted);
      const today = new Date();

      if (lastDate.toDateString() === today.toDateString()) {
        setDailyChallengeCompleted(true);
      }
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/trivia/categories`);

      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        setCategories(financialCategories.map(cat => cat.id));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories(financialCategories.map(cat => cat.id));
    }
  };

  const fetchQuestions = async (difficulty, category, limit = 10) => {
    try {
      setLoading(true);
      setError('');

      const questionTypes = Object.entries(selectedQuestionTypes)
        .filter(([_, enabled]) => enabled)
        .map(([type]) => type);

      const params = new URLSearchParams();
      if (difficulty) params.append('difficulty', difficulty);
      if (category && category !== 'all') params.append('category', category);
      params.append('limit', limit.toString());
      if (questionTypes.length > 0) params.append('types', questionTypes.join(','));

      const response = await fetch(`${API_BASE_URL}/trivia/questions?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }

      const data = await response.json();
      setQuestions(data);
      setCurrentQuestionIndex(0);
      setScore(0);
      setShowResults(false);

      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('type') || urlParams.get('difficulty') || urlParams.get('category')) {
        setGameActive(true);
        setTimeLeft(timer);
      }

      switch (quizType) {
        case 'daily':
          await fetchDailyChallenge();
          break;
        case 'progressive':
          await fetchProgressiveQuestions();
          break;
        case 'marathon':
          await fetchMarathonQuestions();
          break;
        case 'standard':
        default:
          await fetchStandardQuestions();
          break;
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching questions:', error);
      setError(error.message);
      setLoading(false);
      showNotification(`Error: ${error.message}`, 'error');
    }
  };

  const fetchChallengeSettings = async () => {
    try {
      setLoadingChallenge(true);
      const response = await fetch(`${API_BASE_URL}/challenges/${challengeId}`);

      if (!response.ok) throw new Error('Failed to fetch challenge settings');

      const challenge = await response.json();

      if (challenge.quizSettings) {
        setChallengeSettings(challenge.quizSettings);
        setQuizType(challenge.quizSettings.quizType);
        setDifficulty(challenge.quizSettings.difficulty);
        setTimerSetting(challenge.quizSettings.timer);
        setTimerEnabled(challenge.quizSettings.timer > 0);
        setQuestionCount(challenge.quizSettings.questionCount);
        setSelectedCategory(challenge.quizSettings.category);

        const selectedTypes = {};
        questionTypeOptions.forEach(type => {
          selectedTypes[type.value] = challenge.quizSettings.questionTypes.includes(type.value);
        });
        setSelectedQuestionTypes(selectedTypes);
      }

      setLoadingChallenge(false);
    } catch (error) {
      console.error('Error fetching challenge settings:', error);
      setLoadingChallenge(false);
    }
  };


  const fetchStandardQuestions = async () => {
    try {
      const enabledTypes = Object.entries(selectedQuestionTypes)
        .filter(([_, enabled]) => enabled)
        .map(([type]) => type);

      if (enabledTypes.length === 0) {
        throw new Error('Please select at least one question type');
      }

      let url = `${API_BASE_URL}/trivia/questions?difficulty=${difficulty}&limit=${questionCount}`;

      if (selectedCategory !== 'all') {
        url += `&category=${selectedCategory}`;
      }

      url += `&types=${enabledTypes.join(',')}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }

      const data = await response.json();

      if (data.length === 0) {
        throw new Error('No questions found for this combination');
      }

      setQuestions(data);
    } catch (error) {
      throw error;
    }
  };

  const fetchDailyChallenge = async (dateSeed) => {
    try {
      setLoading(true);
      setError(null);
      setGameType('daily');

      const today = new Date();
      const dateSeed = `${today.getFullYear()}${today.getMonth()}${today.getDate()}`;

      let url = `${API_BASE_URL}/trivia/questions?limit=5&dateSeed=${dateSeed}`;

      const enabledTypes = Object.entries(selectedQuestionTypes)
        .filter(([_, enabled]) => enabled)
        .map(([type]) => type);

      if (enabledTypes.length > 0) {
        url += `&types=${enabledTypes.join(',')}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch daily challenge');
      }

      const data = await response.json();

      if (data.length === 0) {
        throw new Error('No questions available for daily challenge');
      }

      setQuestions(data);
      setCurrentQuestionIndex(0);
      setScore(0);
      setShowResults(false);
      setGameActive(true);
      setTimeLeft(timer);
      setLoading(false);
    } catch (error) {
      throw error;
    }
  };

  const fetchProgressiveQuestions = async () => {
    try {
      const enabledTypes = Object.entries(selectedQuestionTypes)
        .filter(([_, enabled]) => enabled)
        .map(([type]) => type);

      if (enabledTypes.length === 0) {
        throw new Error('Please select at least one question type');
      }

      const easyUrl = `${API_BASE_URL}/trivia/questions?difficulty=easy&limit=5&types=${enabledTypes.join(',')}`;
      const mediumUrl = `${API_BASE_URL}/trivia/questions?difficulty=medium&limit=5&types=${enabledTypes.join(',')}`;
      const hardUrl = `${API_BASE_URL}/trivia/questions?difficulty=hard&limit=5&types=${enabledTypes.join(',')}`;

      const [easyResponse, mediumResponse, hardResponse] = await Promise.all([
        fetch(easyUrl),
        fetch(mediumUrl),
        fetch(hardUrl),
      ]);

      if (!easyResponse.ok || !mediumResponse.ok || !hardResponse.ok) {
        throw new Error('Failed to fetch questions for progressive mode');
      }

      const easyData = await easyResponse.json();
      const mediumData = await mediumResponse.json();
      const hardData = await hardResponse.json();

      const combinedQuestions = [...easyData, ...mediumData, ...hardData];

      if (combinedQuestions.length === 0) {
        throw new Error('No questions available for progressive difficulty');
      }

      setQuestions(combinedQuestions);
    } catch (error) {
      throw error;
    }
  };

  const fetchMarathonQuestions = async () => {
    try {
      const enabledTypes = Object.entries(selectedQuestionTypes)
        .filter(([_, enabled]) => enabled)
        .map(([type]) => type);

      if (enabledTypes.length === 0) {
        throw new Error('Please select at least one question type');
      }

      let url = `${API_BASE_URL}/trivia/questions?difficulty=${difficulty}&limit=20&types=${enabledTypes.join(',')}`;

      if (selectedCategory !== 'all') {
        url += `&category=${selectedCategory}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch marathon questions');
      }

      const data = await response.json();

      if (data.length === 0) {
        throw new Error('No questions available for marathon mode');
      }

      setQuestions(data);
    } catch (error) {
      throw error;
    }
  };

  const fetchMoreMarathonQuestions = async () => {
    try {
      let marathonDifficulty = 'easy';
      if (currentStreak >= 20) {
        marathonDifficulty = 'hard';
      } else if (currentStreak >= 10) {
        marathonDifficulty = 'medium';
      }

      const enabledTypes = Object.entries(selectedQuestionTypes)
        .filter(([_, enabled]) => enabled)
        .map(([type]) => type);

      let url = `${API_BASE_URL}/trivia/questions?difficulty=${marathonDifficulty}&limit=10&types=${enabledTypes.join(',')}`;

      if (selectedCategory !== 'all') {
        url += `&category=${selectedCategory}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        console.error('Failed to fetch more marathon questions');
        return;
      }

      const newQuestions = await response.json();

      if (newQuestions.length > 0) {
        setQuestions(prev => [...prev, ...newQuestions]);
      }
    } catch (error) {
      console.error('Error fetching more marathon questions:', error);
    }
  };

  useEffect(() => {
    if (!quizStarted) {
      fetchQuestions();
    }
  }, [difficulty, selectedCategory, questionCount, quizType, selectedQuestionTypes]);

  const showNotification = (message, type) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  };

  const trackGameProgress = async (finalScore) => {
    if (!user) return;

    try {
      const categoryPerformance = {};
      const questionTypePerformance = {};
      const difficultyPerformance = {};

      userAnswers.forEach(answer => {
        const question = questions.find(q => q.question === answer.question);
        if (!question) return;

        const category = question.category || 'general';
        if (!categoryPerformance[category]) {
          categoryPerformance[category] = {
            total: 0,
            correct: 0,
            avgResponseTime: 0,
            responseTimeCount: 0,
          };
        }
        categoryPerformance[category].total += 1;
        if (answer.isCorrect) {
          categoryPerformance[category].correct += 1;
        }

        const questionType = question.type || 'multiple-choice';
        if (!questionTypePerformance[questionType]) {
          questionTypePerformance[questionType] = { total: 0, correct: 0 };
        }
        questionTypePerformance[questionType].total += 1;
        if (answer.isCorrect) {
          questionTypePerformance[questionType].correct += 1;
        }

        const questionDifficulty = question.difficulty || 'medium';
        if (!difficultyPerformance[questionDifficulty]) {
          difficultyPerformance[questionDifficulty] = { total: 0, correct: 0 };
        }
        difficultyPerformance[questionDifficulty].total += 1;
        if (answer.isCorrect) {
          difficultyPerformance[questionDifficulty].correct += 1;
        }
      });

      const masteryData = {};
      Object.keys(categoryPerformance).forEach(category => {
        const data = categoryPerformance[category];
        masteryData[category] = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
      });

      const response = await fetch(`${API_BASE_URL}/progress/game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          gameId: 'financial-trivia',
          title: `Financial Trivia - ${quizTypeOptions.find(t => t.value === quizType)?.label}`,
          score: finalScore,
          metadata: JSON.stringify({
            timestamp: new Date().toISOString(),
            difficulty,
            category: selectedCategory,
            quizType,
            questionCount: userAnswers.length,
            topStreak: quizType === 'marathon' ? topStreak : undefined,
            categoryPerformance,
            questionTypePerformance,
            difficultyPerformance,
            masteryData,
            questionTypes: Object.entries(selectedQuestionTypes)
              .filter(([_, enabled]) => enabled)
              .map(([type]) => type),
          }),
        }),
      });

      if (!response.ok) {
        console.error('Error tracking enhanced game progress');
      }
    } catch (error) {
      console.error('Failed to track enhanced game progress:', error);
    }
  };

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

  const startQuiz = () => {
    if (questions.length === 0) {
      showNotification('No questions available. Try a different mode or category.', 'error');
      return;
    }

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
    setProgressiveDifficulty('easy');
    setUserAnswers([]);
    setShowHint(false);

    if (quizType === 'standard' || quizType === 'daily') {
      setQuestions(prevQuestions => [...prevQuestions].sort(() => Math.random() - 0.5));
    }

    if (quizType === 'progressive') {
      setQuestions(prevQuestions =>
        [...prevQuestions].sort((a, b) => {
          const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
          return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
        }),
      );
    }
  };

  const checkAnswer = () => {
    if (selectedAnswer === null || selectedAnswer === undefined) return false;

    const currentQ = questions[currentQuestion];
    if (!currentQ) return false;

    const questionType = currentQ.type || 'multiple-choice';

    switch (questionType) {
      case 'multiple-choice':
      case 'true-false':
        return selectedAnswer === currentQ.correctAnswer;

      case 'fill-blank':
        try {
          const userAnswer = String(selectedAnswer || '').trim();

          if (Array.isArray(currentQ.options) && currentQ.options.length > 0) {
            const correctOptionIndex = currentQ.correctAnswer;

            if (Number.isInteger(Number(correctOptionIndex)) &&
              correctOptionIndex >= 0 &&
              correctOptionIndex < currentQ.options.length) {
              const correctOption = currentQ.options[correctOptionIndex];
              return userAnswer.toLowerCase() === correctOption.toLowerCase();
            }

            return userAnswer.toLowerCase() === String(currentQ.correctAnswer || '').toLowerCase().trim();
          } else {
            return userAnswer.toLowerCase() === String(currentQ.correctAnswer || '').toLowerCase().trim();
          }
        } catch (error) {
          console.error('Error checking fill-blank answer:', error);
          return false;
        }

      case 'matching':
        if (Array.isArray(currentQ.items) && currentQ.items.length > 0) {
          const expectedMatches = Array.from({ length: currentQ.items.length }, (_, i) => i);
          return JSON.stringify(selectedAnswer) === JSON.stringify(expectedMatches);
        } else if (Array.isArray(currentQ.correctMatches)) {
          return JSON.stringify(selectedAnswer) === JSON.stringify(currentQ.correctMatches);
        } else {
          return false;
        }

      case 'calculation':
        const tolerance = 0.01;

        if (Array.isArray(currentQ.options) && currentQ.options.length > 0) {
          if (Number.isInteger(currentQ.correctAnswer) &&
            currentQ.correctAnswer >= 0 &&
            currentQ.correctAnswer < currentQ.options.length) {
            return Math.abs(parseFloat(selectedAnswer) -
                         parseFloat(currentQ.options[currentQ.correctAnswer])) <= tolerance;
          } else {
            return Math.abs(parseFloat(selectedAnswer) - parseFloat(currentQ.correctAnswer)) <= tolerance;
          }
        } else {
          return Math.abs(parseFloat(selectedAnswer) - parseFloat(currentQ.correctAnswer)) <= tolerance;
        }

      default:
        return selectedAnswer === currentQ.correctAnswer;
    }
  };


  const fetchQuestionsForChallenge = async (challengeId) => {
    try {
      setLoading(true);
      setError(null);

      const challengeResponse = await fetch(`${API_BASE_URL}/challenges/${challengeId}`);
      if (!challengeResponse.ok) {
        throw new Error('Failed to fetch challenge details.');
      }
      const challengeData = await challengeResponse.json();
      console.log('Challenge data:', challengeData);

      if (!challengeData.quizSettings) {
        throw new Error('Challenge has no quiz settings.');
      }

      const settings = challengeData.quizSettings;

      const params = new URLSearchParams();

      if (settings.difficulty) {
        params.append('difficulty', settings.difficulty);
      }
      if (settings.category && settings.category !== 'all') {
        params.append('category', settings.category);
      }
      if (settings.questionCount) {
        params.append('limit', settings.questionCount);
      }
      if (settings.questionTypes && settings.questionTypes.length > 0) {
        params.append('types', settings.questionTypes.join(','));
      }

      const questionsUrl = `${API_BASE_URL}/trivia/questions?${params.toString()}`;
      console.log('Fetching questions from:', questionsUrl);

      const questionsResponse = await fetch(questionsUrl);
      if (!questionsResponse.ok) {
        throw new Error('Failed to fetch challenge questions.');
      }

      const questionsData = await questionsResponse.json();

      if (!questionsData || questionsData.length === 0) {
        throw new Error('No questions found for this challenge. Maybe invalid settings?');
      }

      setDifficulty(settings.difficulty || 'medium');
      setGameType(settings.quizType || 'standard');
      setTimer(settings.timer || 30);
      setTimerSetting(settings.timer || 30);
      setTimerEnabled(settings.timer !== 0);
      setSelectedCategory(settings.category || 'all');
      setQuestionCount(settings.questionCount || 10);

      const updatedQuestionTypes = {
        'multiple-choice': false,
        'true-false': false,
        'fill-blank': false,
        'matching': false,
        'calculation': false,
      };
      if (settings.questionTypes && settings.questionTypes.length > 0) {
        settings.questionTypes.forEach(type => {
        // eslint-disable-next-line no-prototype-builtins
          if (updatedQuestionTypes.hasOwnProperty(type)) {
            updatedQuestionTypes[type] = true;
          }
        });
      }
      setSelectedQuestionTypes(updatedQuestionTypes);

      setQuestions(questionsData);
      setCurrentQuestionIndex(0);
      setScore(0);
      setShowResults(false);
      setGameActive(true);
      setChallengeMode(true);
      setCurrentChallenge(challengeData);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching challenge questions:', error);
      setError(error.message || 'An unexpected error occurred while loading the challenge.');
      setLoading(false);
    }
  };


  const submitChallengeScore = async () => {
    if (!challengeMode || !currentChallenge || !user) return;

    try {
      const response = await fetch(`${API_BASE_URL}/challenges/${currentChallenge.id}/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          score,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit challenge score');
      }

      const result = await response.json();
      console.log('Challenge score submitted:', result);

      if (result.status === 'completed') {
        setCurrentChallenge(result);

        setResultMessage(
          result.winnerId === user.id
            ? '🏆 You won the challenge!'
            : result.winnerId === null
              ? '🤝 It\'s a tie!'
              : '❌ You lost the challenge.',
        );
      } else {
        setResultMessage(
          'Your score has been submitted. Waiting for your opponent to play.',
        );
      }
    } catch (error) {
      console.error('Error submitting challenge score:', error);
      setResultMessage('Failed to submit your challenge score. Please try again.');
    }
  };

  const startGame = () => {
    setGameActive(true);
    setCurrentQuestionIndex(0);
    setScore(0);
    setShowResults(false);
    setTimeLeft(timer);
    setCategoryPerformance({});
    setMasteryData({});
  };

  const endGame = async () => {
    setShowScore(true);
    setQuizFinished(true);

    const percentage = calculateScorePercentage();

    calculateMastery();

    if (challengeId && user && score > 0) {
      try {
        const challengeResponse = await fetch(`${API_BASE_URL}/challenges/${challengeId}/score`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            score,
          }),
        });

        if (!challengeResponse.ok) {
          throw new Error('Failed to submit challenge score');
        }

        setMessage('Challenge score submitted! Redirecting to Challenges...');
        setTimeout(() => {
          navigate('/challenges');
        }, 2000);
      } catch (error) {
        console.error('Error submitting challenge score:', error);
        setMessage('Failed to submit challenge score. Please try again.');
      }
    } else {
      if (percentage >= 90) {
        setMessage("Outstanding! You're a financial genius!");
      } else if (percentage >= 70) {
        setMessage('Great job! You have solid financial knowledge!');
      } else if (percentage >= 50) {
        setMessage('Good effort! Keep learning to improve your score!');
      } else {
        setMessage('Keep practising! Financial literacy is a journey.');
      }
    }

    if (user) {
      await trackGameProgress(score);

      try {
        const leaderboardResponse = await fetch(`${API_BASE_URL}/leaderboard/financial-trivia`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            gameType: 'financial-trivia',
            score,
          }),
        });

        if (!leaderboardResponse.ok) {
          console.error('Failed to update leaderboard');
        }

        if (!challengeId) {
          const pointsResponse = await fetch(`${API_BASE_URL}/challenges/award-points`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user.id,
              points: 10,
              reason: 'game_completed',
            }),
          });

          if (!pointsResponse.ok) {
            console.error('Failed to award points');
          }
        }

        saveUserStats(masteryData, categoryPerformance);
      } catch (error) {
        console.error('Error updating leaderboard or points:', error);
      }
    }
  };

  const calculateScorePercentage = () => {
    if (questions.length === 0) return 0;
    return Math.round((score / questions.length) * 100);
  };

  const calculateMastery = () => {
    const mastery = {};
    const performance = { ...categoryPerformance };

    categories.forEach(category => {
      mastery[category] = 0;
      if (!performance[category]) {
        performance[category] = { correct: 0, total: 0 };
      }
    });

    questions.forEach((question, index) => {
      const category = question.category || 'general';
      if (!performance[category]) {
        performance[category] = { correct: 0, total: 0 };
      }

      performance[category].total++;

      if (userAnswers[index] && userAnswers[index].isCorrect) {
        performance[category].correct++;
      }
    });

    Object.keys(performance).forEach(category => {
      if (performance[category].total > 0) {
        mastery[category] = Math.round(
          (performance[category].correct / performance[category].total) * 100,
        );
      }
    });

    setMasteryData(mastery);
    setCategoryPerformance(performance);
  };

  const saveUserStats = async (mastery, performance) => {
    try {
      if (!user) return;

      const gameData = {
        userId: user.id,
        gameId: 'financial-trivia',
        title: 'Financial Trivia',
        score,
        metadata: {
          difficulty,
          questionsAnswered: questions.length,
          categoryPerformance: performance,
          masteryData: mastery,
        },
      };

      const response = await fetch(`${API_BASE_URL}/progress/game`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gameData),
      });

      if (!response.ok) {
        console.error('Error saving game progress');
      }
    } catch (err) {
      console.error('Error saving game progress:', err);
    }
  };


  const goToNextQuestion = () => {
    setTotalQuestionsAnswered(prev => prev + 1);

    if (quizType === 'marathon' && !answerIsCorrect) {
      endGame();
      return;
    }

    const nextQuestion = currentQuestion + 1;

    if (nextQuestion < questions.length) {
      setCurrentQuestion(nextQuestion);
      setSelectedAnswer(null);
      setAnswerSubmitted(false);
      setTimeLeft(timerSetting);
      setShowHint(false);

      if (quizType === 'progressive') {
        const currentProgress = totalQuestionsAnswered + 1;
        if (currentProgress === 5) {
          setProgressiveDifficulty('medium');
          showNotification('Difficulty increased to Medium!', 'info');
        } else if (currentProgress === 10) {
          setProgressiveDifficulty('hard');
          showNotification('Difficulty increased to Hard!', 'info');
        }
      }

      if (quizType === 'marathon' && nextQuestion >= questions.length - 5) {
        fetchMoreMarathonQuestions();
      }
    } else {
      endGame();
    }
  };


  const handleAnswerSubmit = (answer) => {
    if (selectedAnswer === null) {
      showNotification('Please select an answer first!', 'warning');
      return;
    }

    setAnswerSubmitted(true);
    const isCorrect = checkAnswer();
    setAnswerIsCorrect(isCorrect);

    if (!answerSubmitted) {
      if (questions[currentQuestion].type === 'matching') {
        if (!Array.isArray(selectedAnswer)) {
          const termsLength = questions[currentQuestion].terms?.length ||
                             (questions[currentQuestion].items?.length || 0);
          setSelectedAnswer(Array(termsLength).fill(null));
        } else {
          setSelectedAnswer(answer);
        }
      } else {
        setSelectedAnswer(answer);
      }
    }

    setUserAnswers(prev => [
      ...prev,
      {
        question: questions[currentQuestion].question,
        userAnswer: selectedAnswer,
        correctAnswer: questions[currentQuestion].correctAnswer,
        questionType: questions[currentQuestion].type || 'multiple-choice',
        options: questions[currentQuestion].options,
        terms: questions[currentQuestion].terms,
        definitions: questions[currentQuestion].definitions,
        explanation: questions[currentQuestion].explanation,
        isCorrect,
      },
    ]);

    if (isCorrect) {
      let difficultyPoints = 10;

      if (quizType === 'progressive') {
        difficultyPoints = progressiveDifficulty === 'easy'
          ? 10
          : progressiveDifficulty === 'medium' ? 20 : 30;
      } else {
        difficultyPoints = questions[currentQuestion].difficulty === 'easy'
          ? 10
          : questions[currentQuestion].difficulty === 'medium' ? 20 : 30;
      }

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

      const timeBonus = timerEnabled && timerSetting > 0 ? Math.round(timeLeft * 0.2) : 0;
      const totalPoints = difficultyPoints + questionTypeBonus + timeBonus;

      setScore(prev => prev + totalPoints);

      if (quizType === 'marathon') {
        const newStreak = currentStreak + 1;
        setCurrentStreak(newStreak);
        if (newStreak > topStreak) {
          setTopStreak(newStreak);
        }
      }

      let pointsMessage = `✅ Correct! +${totalPoints} points`;
      if (timeBonus > 0) pointsMessage += ` (includes ${timeBonus} time bonus)`;
      if (questionTypeBonus > 0) pointsMessage += ` (includes ${questionTypeBonus} question type bonus)`;

      showNotification(pointsMessage, 'success');
    } else {
      if (quizType === 'marathon') {
        setCurrentStreak(0);
      }
      showNotification('❌ Incorrect!', 'error');
    }

    setTimeout(() => goToNextQuestion(), 2000);
  };

  const handleTimeUp = () => {
    setAnswerSubmitted(true);
    setAnswerIsCorrect(false);

    setUserAnswers(prev => [
      ...prev,
      {
        question: questions[currentQuestion].question,
        userAnswer: null,
        correctAnswer: questions[currentQuestion].correctAnswer,
        questionType: questions[currentQuestion].type || 'multiple-choice',
        options: questions[currentQuestion].options,
        explanation: questions[currentQuestion].explanation,
        isCorrect: false,
      },
    ]);

    if (quizType === 'marathon') {
      setCurrentStreak(0);
    }

    showNotification("⏰ Time's up!", 'warning');

    setTimeout(() => goToNextQuestion(), 2000);
  };

  const handleAnswerSelect = (answer) => {
    try {
      if (!answerSubmitted) {
        if (questions[currentQuestion].type === 'fill-blank') {
          setSelectedAnswer(String(answer || ''));
        }
        else if (questions[currentQuestion].type === 'matching') {
          if (!Array.isArray(answer)) {
            const termsLength = questions[currentQuestion].terms?.length ||
                               (questions[currentQuestion].items?.length || 0);
            setSelectedAnswer(Array(termsLength).fill(null));
          } else {
            setSelectedAnswer(answer);
          }
        }
        else if (questions[currentQuestion].type === 'calculation') {
          try {
            const numericValue = parseFloat(answer);
            setSelectedAnswer(isNaN(numericValue) ? 0 : numericValue);
          } catch (error) {
            console.error('Error parsing calculation input:', error);
            setSelectedAnswer(0);
          }
        }
        else {
          setSelectedAnswer(answer);
        }
      }
    } catch (error) {
      console.error('Error handling answer selection:', error);
    }
  };

  const toggleHint = () => {
    setShowHint(!showHint);
  };

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
    setProgressiveDifficulty('easy');
    fetchQuestions();
    setUserAnswers([]);
    setShowResultsReview(false);
    setShowHint(false);
  };

  const exportResultsAsText = () => {
    let resultsText = 'Financial Trivia Quiz Results\n';
    resultsText += `Quiz Type: ${quizTypeOptions.find(t => t.value === quizType)?.label}\n`;
    resultsText += `Final Score: ${score}\n`;
    resultsText += `Correct Answers: ${userAnswers.filter(a => a.isCorrect).length} out of ${userAnswers.length}\n\n`;

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

      resultsText += `Result: ${answer.isCorrect ? 'Correct' : 'Incorrect'}\n`;
      resultsText += `Explanation: ${answer.explanation}\n\n`;
    });

    const element = document.createElement('a');
    const file = new Blob([resultsText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'financial_trivia_results.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const generateCertificate = () => {
    const correctPercentage = (userAnswers.filter(a => a.isCorrect).length / userAnswers.length) * 100;

    if (correctPercentage < 80) {
      showNotification('Score at least 80% to earn a certificate!', 'warning');
      return;
    }

    setShowCertificate(true);
  };

  const toggleQuestionType = (type) => {
    setSelectedQuestionTypes(prev => {
      const otherTypesSelected = Object.entries(prev)
        .filter(([key]) => key !== type)
        .some(([_, enabled]) => enabled);

      if (prev[type] && !otherTypesSelected) {
        showNotification('At least one question type must be selected', 'warning');
        return prev;
      }

      return {
        ...prev,
        [type]: !prev[type],
      };
    });
  };

  const changeDifficulty = (level) => {
    setDifficulty(level);
    resetQuiz();
  };

  const changeCategory = (category) => {
    setSelectedCategory(category);
    resetQuiz();
  };

  const changeQuizType = (type) => {
    setQuizType(type);

    switch (type) {
      case 'daily':
        setQuestionCount(5);
        setTimerSetting(30);
        setTimerEnabled(true);
        break;
      case 'progressive':
        setQuestionCount(15);
        setTimerSetting(30);
        setTimerEnabled(true);
        break;
      case 'marathon':
        setTimerSetting(20);
        setTimerEnabled(true);
        break;
      case 'standard':
      default:
        break;
    }

    resetQuiz();
  };

  const handleQuitClick = () => {
    setShowQuitConfirmation(true);
  };

  const handleConfirmQuit = () => {
    if (currentQuestion > 0 && user && !quizFinished) {
      trackGameProgress(score);
    }

    resetQuiz();
    setShowQuitConfirmation(false);
    showNotification('Quiz exited', 'info');
  };

  const handleCancelQuit = () => {
    setShowQuitConfirmation(false);
  };

  const getCategoryInfo = (categoryId) => {
    const category = financialCategories.find(cat => cat.id === categoryId) || financialCategories[0];
    return category;
  };

  const [matchingSelectedTerm, setMatchingSelectedTerm] = useState(null);
  const [matchingMatches, setMatchingMatches] = useState([]);

  useEffect(() => {
    if (questions[currentQuestion]?.type === 'matching') {
      const currentQ = questions[currentQuestion];
      const isNewFormat = Array.isArray(currentQ.items) && currentQ.items.length > 0;

      const termsCount = isNewFormat
        ? currentQ.items.length
        : (currentQ.terms ? currentQ.terms.length : 0);

      setSelectedTerm(null);

      setSelectedAnswer(Array(termsCount).fill(null));

      setMatchingMatches(Array(termsCount).fill(null));
    }
  }, [currentQuestion, questions]);

  const renderMatchingQuestion = (currentQ) => {
    const isNewFormat = Array.isArray(currentQ.items) && currentQ.items.length > 0;

    let terms = [];
    let definitions = [];

    if (isNewFormat) {
      terms = currentQ.items.map(item => item.term);
      definitions = currentQ.items.map(item => item.definition);
    } else {
      terms = currentQ.terms || [];
      definitions = currentQ.definitions || [];
    }

    const removeMatch = (termIndex) => {
      if (answerSubmitted) return;

      const updatedMatches = [...selectedAnswer];
      updatedMatches[termIndex] = null;
      setSelectedAnswer(updatedMatches);
    };

    return (
    <div className="question-container">
      <h3 className="question">{currentQ.question}</h3>

      <div className="matching-instructions">
        <p>Click on a term, then click on its matching definition</p>
      </div>

      <div className="matching-container">
        <div className="matching-interface">
          <div className="terms-column">
            <h4>Terms</h4>
            {terms.map((term, index) => {
              const isMatched = Array.isArray(selectedAnswer) && selectedAnswer[index] !== null;
              const matchedDefIndex = isMatched ? selectedAnswer[index] : null;

              return (
                <div
                  key={index}
                  onClick={() => {
                    if (answerSubmitted || isMatched) return;
                    setSelectedTerm(index);
                  }}
                  className={`
                    matching-item 
                    term-item
                    ${selectedTerm === index ? 'selected' : ''}
                    ${isMatched ? 'matched' : ''}
                    ${answerSubmitted && isNewFormat && index === matchedDefIndex ? 'correct-match' : ''}
                    ${answerSubmitted && !isNewFormat && currentQ.correctMatches[index] === matchedDefIndex ? 'correct-match' : ''}
                    ${answerSubmitted && isNewFormat && index !== matchedDefIndex ? 'incorrect-match' : ''}
                    ${answerSubmitted && !isNewFormat && currentQ.correctMatches[index] !== matchedDefIndex ? 'incorrect-match' : ''}
                  `}
                >
                  <span className="term-number">{index + 1}</span>
                  <span className="term-text">{term}</span>

                  {isMatched && (
                    <div className="matched-indicator">
                      → Matched with {definitions[matchedDefIndex]}

                      {/* Undo button */}
                      {!answerSubmitted && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeMatch(index);
                          }}
                          className="undo-match-btn"
                          style={{
                            marginLeft: '10px',
                            backgroundColor: '#fee2e2',
                            color: '#b91c1c',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '2px 6px',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                          }}
                        >
                          Undo
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="definitions-column">
            <h4>Definitions</h4>
            {definitions.map((definition, index) => {
              const isMatched = Array.isArray(selectedAnswer) && selectedAnswer.includes(index);
              const matchedTermIndex = isMatched ? selectedAnswer.findIndex(val => val === index) : null;

              return (
                <div
                  key={index}
                  onClick={() => {
                    if (answerSubmitted || isMatched || selectedTerm === null) return;

                    const newMatches = [...(selectedAnswer || Array(terms.length).fill(null))];
                    newMatches[selectedTerm] = index;
                    setSelectedAnswer(newMatches);
                    setSelectedTerm(null);
                  }}
                  className={`
                    matching-item 
                    definition-item
                    ${isMatched ? 'matched' : ''}
                    ${answerSubmitted && isNewFormat && matchedTermIndex === index ? 'correct-match' : ''}
                    ${answerSubmitted && !isNewFormat && currentQ.correctMatches.indexOf(index) === matchedTermIndex ? 'correct-match' : ''}
                    ${answerSubmitted && isNewFormat && matchedTermIndex !== index ? 'incorrect-match' : ''}
                    ${answerSubmitted && !isNewFormat && currentQ.correctMatches.indexOf(index) !== matchedTermIndex ? 'incorrect-match' : ''}
                  `}
                >
                  <span className="definition-number">{index + 1}</span>
                  <span className="definition-text">{definition}</span>

                  {isMatched && (
                    <div className="matched-indicator">
                      ← Matched with {terms[matchedTermIndex]}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Completion status */}
        {!answerSubmitted && (
          <div className="matching-status" style={{
            marginTop: '1rem',
            padding: '0.75rem',
            backgroundColor: '#f3f4f6',
            borderRadius: '6px',
            textAlign: 'center',
          }}>
            <p>
              {Array.isArray(selectedAnswer) && selectedAnswer.every(match => match !== null)
                ? '✅ All terms matched! Click Submit when ready.'
                : `${Array.isArray(selectedAnswer) ? selectedAnswer.filter(match => match !== null).length : 0} of ${terms.length} terms matched`}
            </p>
          </div>
        )}
      </div>

      {/* Show correct matches after submission */}
      {answerSubmitted && (
        <div className="correct-matches-display">
          <h4>Correct Matches:</h4>
          <ul>
            {terms.map((term, index) => {
              let correctDefIndex;
              if (isNewFormat) {
                correctDefIndex = index;
              } else {
                correctDefIndex = currentQ.correctMatches[index];
              }

              const userDefIndex = Array.isArray(selectedAnswer) ? selectedAnswer[index] : null;
              const isCorrectMatch = userDefIndex === correctDefIndex;

              return (
                <li key={index} className={isCorrectMatch ? 'correct' : 'incorrect'}>
                  <strong>{term}</strong>: {definitions[correctDefIndex]}

                  {!isCorrectMatch && userDefIndex !== null && (
                    <span className="your-match">
                      Your match: {definitions[userDefIndex]}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
    );
  };

  const renderQuestion = () => {
    if (!questions[currentQuestion]) return null;

    const currentQ = questions[currentQuestion];
    const questionType = currentQ.type || 'multiple-choice';

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
                    ${selectedAnswer === index ? 'selected' : ''} 
                    ${answerSubmitted && index === currentQ.correctAnswer ? 'correct' : ''}
                    ${answerSubmitted && selectedAnswer === index && index !== currentQ.correctAnswer ? 'incorrect' : ''}
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
              {['True', 'False'].map((option, index) => (
                <div
                  key={index}
                  className={`
                    option true-false-option 
                    ${selectedAnswer === index ? 'selected' : ''} 
                    ${answerSubmitted && index === currentQ.correctAnswer ? 'correct' : ''}
                    ${answerSubmitted && selectedAnswer === index && index !== currentQ.correctAnswer ? 'incorrect' : ''}
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
        const parts = currentQ.question.split(/____|\[blank\]|___/i);

        const hasOptions = Array.isArray(currentQ.options) && currentQ.options.length > 0;

        const handleFillBlankChange = (e) => {
          try {
            if (!answerSubmitted) {
              handleAnswerSelect(e.target.value);
            }
          } catch (error) {
            console.error('Error handling fill-blank input:', error);
          }
        };

        return (
            <div className="question-container">
              <div className="question fill-blank-question">
                {parts[0] || ''}

                <input
                  type="text"
                  value={selectedAnswer || ''}
                  onChange={handleFillBlankChange}
                  className="blank-input"
                  placeholder={hasOptions ? 'Enter or select an answer' : 'Enter your answer'}
                  disabled={answerSubmitted}
                />

                {parts[1] || ''}
              </div>

              {hasOptions && !answerSubmitted && (
                <div className="fill-blank-options">
                  {currentQ.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(option)}
                      className={`fill-blank-option ${selectedAnswer === option ? 'selected' : ''}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {answerSubmitted && !checkAnswer() && (
                <div className="correct-answer-display">
                  <p>Correct answer: <strong>
                    {typeof currentQ.correctAnswer === 'number' && hasOptions
                      ? currentQ.options[currentQ.correctAnswer]
                      : currentQ.correctAnswer}
                  </strong></p>
                </div>
              )}
            </div>
        );

      case 'matching':
        return renderMatchingQuestion(currentQ);

      case 'calculation':
        const hasOption = Array.isArray(currentQ.options) && currentQ.options.length > 0;

        return (
    <div className="question-container">
      <h3 className="question">{currentQ.question}</h3>

      <div className="calculation-input-container">
        <input
          type="number"
          step="0.01"
          value={selectedAnswer !== null ? selectedAnswer : ''}
          onChange={(e) => handleAnswerSelect(parseFloat(e.target.value))}
          className={`
            calculation-input 
            ${answerSubmitted && checkAnswer() ? 'correct-input' : ''}
            ${answerSubmitted && !checkAnswer() ? 'incorrect-input' : ''}
          `}
          disabled={answerSubmitted}
          placeholder="Enter your answer"
        />
      </div>

      {hasOption && !answerSubmitted && (
        <div className="options-container" style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          justifyContent: 'center',
          marginTop: '15px',
        }}>
          {currentQ.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(parseFloat(option))}
              className={`option ${selectedAnswer === parseFloat(option) ? 'selected' : ''}`}
              style={{
                padding: '8px 16px',
                backgroundColor: selectedAnswer === parseFloat(option) ? '#dbeafe' : '#f3f4f6',
                border: `1px solid ${selectedAnswer === parseFloat(option) ? '#3b82f6' : '#d1d5db'}`,
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {option}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={toggleHint}
        className="hint-button"
        disabled={answerSubmitted}
      >
        {showHint ? 'Hide Hint' : 'Show Hint'}
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
        <div className={`answer-feedback ${checkAnswer() ? 'correct-feedback' : 'incorrect-feedback'}`}>
          <p>
            {checkAnswer()
              ? 'Correct!'
              : `Incorrect. The correct answer is ${currentQ.correctAnswer}.`}
          </p>
        </div>
      )}
    </div>
        );

      default:
        return (
          <div className="question-container">
            <h3 className="question">{currentQ.question}</h3>
            <div className="options-container">
              {currentQ.options.map((option, index) => (
                <div
                  key={index}
                  className={`
                    option 
                    ${selectedAnswer === index ? 'selected' : ''} 
                    ${answerSubmitted && index === currentQ.correctAnswer ? 'correct' : ''}
                    ${answerSubmitted && selectedAnswer === index && index !== currentQ.correctAnswer ? 'incorrect' : ''}
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

    {challengeId && (
      <div className="challenge-mode-banner">
        <span className="challenge-icon">⚔️</span>
        <span className="challenge-text">Challenge Mode Active!</span>
      </div>
    )}

    {message && (
      <div className="challenge-message">
        {message}
      </div>
    )}

    {/* Show challenge settings */}
    {challengeId && challengeSettings && !quizStarted && (
      <div className="challenge-settings-info">
        <h3>Challenge Settings</h3>
        <p>Both players will use these settings:</p>
        <div className="settings-summary">
          <div className="setting-item">
            <strong>Quiz Type:</strong> {challengeSettings.quizType}
          </div>
          <div className="setting-item">
            <strong>Difficulty:</strong> {challengeSettings.difficulty}
          </div>
          <div className="setting-item">
            <strong>Timer:</strong> {challengeSettings.timer} seconds
          </div>
          <div className="setting-item">
            <strong>Questions:</strong> {challengeSettings.questionCount}
          </div>
          <div className="setting-item">
            <strong>Category:</strong> {financialCategories.find(c => c.id === challengeSettings.category)?.name}
          </div>
          <div className="setting-item">
            <strong>Question Types:</strong> {challengeSettings.questionTypes.join(', ')}
          </div>
        </div>
      </div>
    )}

    {/* Notifications */}
    <div className="notifications">
      {notifications.map((note) => (
        <div key={note.id} className={`notification ${note.type}`}>
          {note.message}
        </div>
      ))}
    </div>

    {/* Quiz Selection UI - Only show if not in challenge mode or challenge settings not loaded */}
    {!quizStarted && !loadingChallenge && (
      <div className="quiz-selection">
        {!challengeId ? (
          <>
            {/* Quiz Type Selection */}
            <div className="selection-section quiz-type-selector">
              <h3>Select Quiz Type:</h3>
              <div className="quiz-type-options">
                {quizTypeOptions.map((option) => (
                  <button
                    key={option.value}
                    className={`quiz-type-btn ${quizType === option.value ? 'active' : ''} ${option.value === 'daily' && dailyChallengeCompleted ? 'completed' : ''}`}
                    onClick={() => changeQuizType(option.value)}
                    disabled={option.value === 'daily' && dailyChallengeCompleted}
                  >
                    <span className="quiz-type-icon">{option.icon}</span>
                    <span className="quiz-type-label">{option.label}</span>
                    {option.value === 'daily' && dailyChallengeCompleted && (
                      <span className="daily-completed-badge">✅ Completed Today</span>
                    )}
                  </button>
                ))}
              </div>
              <p className="quiz-type-description">
                {quizTypeOptions.find(option => option.value === quizType)?.description}
              </p>
            </div>

            {/* Question Types Selection */}
            <div className="selection-section question-types-selector">
              <h3>Select Question Types:</h3>
              <div className="question-type-options">
                {questionTypeOptions.map((option) => (
                  <button
                    key={option.value}
                    className={`quiz-type-btn ${selectedQuestionTypes[option.value] ? 'active' : ''}`}
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

            {/* Difficulty Selection */}
            {(quizType === 'standard' || quizType === 'marathon') && (
              <div className="selection-section difficulty-selector">
                <h3>Select Difficulty Level:</h3>
                <div className="difficulty-buttons">
                  <button
                    className={`difficulty-btn ${difficulty === 'easy' ? 'active' : ''}`}
                    onClick={() => changeDifficulty('easy')}
                  >
                    Easy
                  </button>
                  <button
                    className={`difficulty-btn ${difficulty === 'medium' ? 'active' : ''}`}
                    onClick={() => changeDifficulty('medium')}
                  >
                    Medium
                  </button>
                  <button
                    className={`difficulty-btn ${difficulty === 'hard' ? 'active' : ''}`}
                    onClick={() => changeDifficulty('hard')}
                  >
                    Hard
                  </button>
                </div>
                <p className="difficulty-description">
                  {difficulty === 'easy'
                    ? 'Basic financial concepts and terminology.'
                    : difficulty === 'medium'
                      ? 'Intermediate financial knowledge and concepts.'
                      : 'Advanced financial strategies and market knowledge.'}
                </p>
              </div>
            )}

            {/* Timer Settings */}
            {(quizType === 'standard' || quizType === 'marathon') && (
              <div className="selection-section timer-selector">
                <h3>Timer Settings:</h3>
                <div className="timer-options">
                  {timerOptions.map((option) => (
                    <button
                      key={option.value}
                      className={`timer-btn ${timerSetting === option.value ? 'active' : ''}`}
                      onClick={() => {
                        setTimerSetting(option.value);
                        setTimerEnabled(option.value > 0);
                      }}
                      disabled={quizType === 'marathon' && option.value === 0}
                    >
                      {option.label}
                      {quizType === 'marathon' && option.value === 0 && ' (Not available for Marathon)'}
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

            {/* Question Count */}
            {quizType === 'standard' && (
              <div className="selection-section question-count-selector">
                <h3>Number of Questions:</h3>
                <div className="question-count-options">
                  {questionCountOptions.map((option) => (
                    <button
                      key={option.value}
                      className={`question-count-btn ${questionCount === option.value ? 'active' : ''}`}
                      onClick={() => setQuestionCount(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <p className="question-count-description">
                  {questionCount <= 5
                    ? 'A short quiz to test your knowledge.'
                    : questionCount <= 10
                      ? 'A medium-length quiz to challenge you.'
                      : 'A comprehensive quiz to thoroughly test your knowledge.'}
                </p>
              </div>
            )}

            {/* Category Selection */}
            {(quizType === 'standard' || quizType === 'marathon') && (
              <div className="selection-section category-selector">
                <h3>Select Category:</h3>
                <div className="category-buttons">
                  {financialCategories.map((category) => (
                    <button
                      key={category.id}
                      className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
                      onClick={() => changeCategory(category.id)}
                    >
                      <span className="category-icon">{category.icon}</span>
                      <span className="category-name">{category.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quiz Mode Information */}
            <div className="quiz-mode-info">
              {quizType === 'daily' && (
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

              {quizType === 'progressive' && (
                <div className="progressive-info">
                  <h3>About Progressive Difficulty</h3>
                  <p>
                    You&apos;ll start with 5 easy questions, then move to 5 medium questions,
                    and finish with 5 hard questions. Each level awards more points!
                  </p>
                </div>
              )}

              {quizType === 'marathon' && (
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

            {/* Start Button for Non-Challenge Mode */}
            {loading
              ? (
              <div className="loading-spinner">
                <div className="spinner"></div>
                <p>Loading questions...</p>
              </div>
                )
              : error
                ? (
              <div className="error-message">
                <p>{error}</p>
                <button onClick={fetchQuestions} className="retry-btn">
                  Try Again
                </button>
              </div>
                  )
                : (
              <button
                onClick={startQuiz}
                className="start-quiz-btn"
                disabled={quizType === 'daily' && dailyChallengeCompleted}
              >
                {quizType === 'daily' && dailyChallengeCompleted
                  ? "Today's Challenge Completed"
                  : `Start ${quizTypeOptions.find(t => t.value === quizType)?.label}`}
              </button>
                  )}
          </>
        ) : (
          /* Challenge Mode Start Section */
          <div className="challenge-start">
            <p>Your opponent has set up this challenge with specific settings.</p>
            <p>Both players will use the same settings for a fair competition.</p>
            <button
              onClick={startQuiz}
              className="start-quiz-btn"
              disabled={loading}
            >
              Start Challenge
            </button>
          </div>
        )}
      </div>
    )}

    {/* Loading Challenge Settings */}
    {loadingChallenge && (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading challenge settings...</p>
      </div>
    )}

    {/* Quiz in progress */}
    {quizStarted && !showScore && questions.length > 0 && (
      <div className="quiz-container">
        <div className="quiz-header">
          <div className="quiz-progress">
            {quizType === 'marathon'
              ? (
              <span>Streak: {currentStreak} questions</span>
                )
              : (
              <span>Question {currentQuestion + 1}/{quizType === 'progressive' ? 15 : quizType === 'daily' ? 5 : questions.length}</span>
                )}
          </div>
          <div className="quiz-score">
            Score: {score}
          </div>
          <div className="quiz-info">
            <span className="quiz-difficulty">
              {quizType === 'progressive'
                ? progressiveDifficulty.charAt(0).toUpperCase() + progressiveDifficulty.slice(1)
                : (questions[currentQuestion].difficulty || 'Medium').charAt(0).toUpperCase() +
                  (questions[currentQuestion].difficulty || 'Medium').slice(1)}
            </span>
            <span className="quiz-type-label">
              {questionTypeOptions.find(t => t.value === questions[currentQuestion].type)?.icon || '🔠'}
            </span>
          </div>
          {timerEnabled && timerSetting > 0 && (
            <div className={`quiz-timer ${timeLeft < 10 ? 'running-out' : ''}`}>
              Time: {timeLeft}s
            </div>
          )}
        </div>

        <div className="question-container">
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

    {/* Quiz Results */}
    {showScore && (
      <div className="results-container">
        <h3>Quiz Completed!</h3>

        {quizType === 'marathon'
          ? (
          <div className="marathon-results">
            <div className="streak-display">
              <p>Your marathon streak: <span>{topStreak}</span></p>
              <p>Total questions answered: <span>{totalQuestionsAnswered}</span></p>
            </div>
          </div>
            )
          : null}

        <div className="final-score">
          <p>Your score: <span>{score}</span></p>
          <p>Quiz type: <span>{quizTypeOptions.find(t => t.value === quizType)?.label}</span></p>
          <p>Correct answers: <span>{userAnswers.filter(a => a.isCorrect).length} out of {userAnswers.length}</span></p>

          {quizType === 'standard' && (
            <>
              <p>Difficulty: <span>{difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</span></p>
              <p>Category: <span>{getCategoryInfo(selectedCategory).name}</span></p>
            </>
          )}

          {quizType === 'daily' && dailyChallengeCompleted && (
            <div className="daily-badge">
              <p>🏆 Daily Challenge Complete!</p>
              <p>Come back tomorrow for a new set of questions</p>
            </div>
          )}
        </div>

        <div className="result-buttons">
          <button onClick={() => {
            if (quizType === 'standard') {
              changeDifficulty(difficulty);
              changeCategory(selectedCategory);
            } else {
              changeQuizType(quizType);
            }
          }} className="play-again-btn">
            {quizType === 'daily' && dailyChallengeCompleted
              ? 'Try Another Quiz Type'
              : 'Play Again'}
          </button>
          <button onClick={resetQuiz} className="change-settings-btn">
            Change Settings
          </button>
        </div>
      </div>
    )}

    {/* Show Results Review Button */}
    {showScore && (
      <div className="result-actions">
        <button
          onClick={() => setShowResultsReview(!showResultsReview)}
          className="show-results-btn"
        >
          {showResultsReview ? 'Hide Details' : 'Show Results Details'}
        </button>
      </div>
    )}

    {/* Results Review */}
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
              className={`question-review-item ${answer.isCorrect ? 'correct' : 'incorrect'}`}
            >
              <div className="question-review-header">
                <span className="question-number">Question {index + 1}</span>
                <span className={`question-result ${answer.isCorrect ? 'correct' : 'incorrect'}`}>
                  {answer.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                </span>
              </div>

              <p className="question-text">
                <span className="question-type-badge">
                  {questionTypeOptions.find(t => t.value === answer.questionType)?.icon || '🔠'}
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
            <div className="user-name">{user?.username || 'Financial Learner'}</div>
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
