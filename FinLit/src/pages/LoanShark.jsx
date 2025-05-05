/* eslint-disable no-unused-vars */
import { useState, useEffect, useRef } from 'react';
import '../styles/LoanShark.css'; // Import the enhanced styles

const LOAN_OPTIONS = [100, 200, 500];
const DAILY_INTEREST = 0.05; // 5% daily interest
const LOAN_DEADLINE = 7; // Repayment deadline in days
const MOVEMENT_POINTS_PER_DAY = 3; // Player gets 3 movement points per day

// Get the current hostname for API calls (works on all devices)
const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:7900`;

// Define city districts and their properties
const DISTRICTS = [
  {
    id: 'downtown',
    name: 'Downtown Financial District',
    type: 'financial',
    description: 'Banks with lower interest rates but strict requirements.',
    loans: [
      { amount: 200, interest: 0.03, name: 'Bank Loan', requirementLevel: 3 },
      { amount: 500, interest: 0.04, name: 'Credit Union', requirementLevel: 4 },
    ],
    jobs: [],
    x: 70, // position percentage for player marker
    y: 25,
  },
  {
    id: 'shady-harbor',
    name: 'Shady Harbor',
    type: 'harbor',
    description: 'Where the real loan sharks operate. High interest, no questions asked.',
    loans: [
      { amount: 100, interest: 0.05, name: 'Fishy Loans', requirementLevel: 0 },
      { amount: 300, interest: 0.06, name: 'Shark Finance', requirementLevel: 0 },
      { amount: 500, interest: 0.07, name: 'Deep Water Loans', requirementLevel: 0 },
    ],
    jobs: [
      { title: 'Dock Hand', pay: 25, icon: '⚓' },
    ],
    x: 20,
    y: 60,
  },
  {
    id: 'residential',
    name: 'Suburban Neighborhood',
    type: 'residential',
    description: 'Quiet streets with houses and lawns that need maintenance.',
    loans: [],
    jobs: [
      { title: 'Lawn Mowing', pay: 15, icon: '🌱' },
      { title: 'Dog Walking', pay: 12, icon: '🐕' },
    ],
    x: 70,
    y: 75,
  },
  {
    id: 'commercial',
    name: 'Shopping District',
    type: 'commercial',
    description: 'Busy commercial area with lots of small businesses.',
    loans: [],
    jobs: [
      { title: 'Car Washing', pay: 20, icon: '🚗' },
      { title: 'Store Clerk', pay: 35, icon: '🛒' },
    ],
    x: 50,
    y: 50,
  },
  {
    id: 'industrial',
    name: 'Factory Zone',
    type: 'industrial',
    description: 'Industrial area with factories and warehouses.',
    loans: [],
    jobs: [
      { title: 'Factory Work', pay: 40, icon: '🏭' },
      { title: 'Warehouse Loading', pay: 45, icon: '📦' },
    ],
    x: 80,
    y: 50,
  },
  {
    id: 'waterfront',
    name: 'Tourist Beaches',
    type: 'waterfront',
    description: 'Popular beaches with tourists looking for services.',
    loans: [],
    jobs: [
      { title: 'Beach Cleanup', pay: 18, icon: '🏖️' },
      { title: 'Food Delivery', pay: 30, icon: '🍔' },
    ],
    x: 30,
    y: 80,
  },
];

// Time periods affect job availability
const TIME_PERIODS = ['Morning', 'Afternoon', 'Evening'];

const LoanShark = () => {
  const [money, setMoney] = useState(() => parseFloat(localStorage.getItem('money')) || 50);
  const [loan, setLoan] = useState(() => parseFloat(localStorage.getItem('loan')) || 0);
  const [daysLeft, setDaysLeft] = useState(() => parseInt(localStorage.getItem('daysLeft')) || LOAN_DEADLINE);
  const [interest, setInterest] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [gameOverMessage, setGameOverMessage] = useState('');
  const [gameOverType, setGameOverType] = useState(''); // 'success' or 'failure'
  const [finalProfit, setFinalProfit] = useState(0);
  const [daysPassed, setDaysPassed] = useState(0);

  // City map related state
  const [currentDistrict, setCurrentDistrict] = useState('commercial'); // Start in commercial district
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [showDistrictInfo, setShowDistrictInfo] = useState(false);
  const [movementPoints, setMovementPoints] = useState(MOVEMENT_POINTS_PER_DAY);
  const [timePeriod, setTimePeriod] = useState(0); // 0: morning, 1: afternoon, 2: evening
  const [currentLoanSource, setCurrentLoanSource] = useState(''); // Track where loan was taken
  const [creditScore, setCreditScore] = useState(1); // Credit score from 1-10, affects loan options

  // Ref for the container to add bubble animations
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const playerMarkerRef = useRef(null);

  // Get the current district object
  const getCurrentDistrictObj = () => {
    return DISTRICTS.find(d => d.id === currentDistrict);
  };

  // Get the selected district object
  const getSelectedDistrictObj = () => {
    if (!selectedDistrict) return null;
    return DISTRICTS.find(d => d.id === selectedDistrict);
  };

  // Check if user is logged in
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Track game start
  useEffect(() => {
    // Only track if user is logged in and game hasn't been started yet
    if (user && !gameStarted) {
      trackGameActivity(0); // 0 score for just starting
      setGameStarted(true);
    }
  }, [user, gameStarted]);

  // Update player marker position when changing districts
  useEffect(() => {
    if (playerMarkerRef.current && mapRef.current) {
      const district = DISTRICTS.find(d => d.id === currentDistrict);
      if (district) {
        const mapRect = mapRef.current.getBoundingClientRect();
        const x = (district.x / 100) * mapRect.width;
        const y = (district.y / 100) * mapRect.height;

        playerMarkerRef.current.style.left = `${x}px`;
        playerMarkerRef.current.style.top = `${y}px`;
      }
    }
  }, [currentDistrict]);

  // Load/save game state
  useEffect(() => {
    // Load state from localStorage
    const loadGameState = () => {
      const storedMovementPoints = localStorage.getItem('movementPoints');
      const storedTimePeriod = localStorage.getItem('timePeriod');
      const storedCurrentDistrict = localStorage.getItem('currentDistrict');
      const storedCreditScore = localStorage.getItem('creditScore');
      const storedCurrentLoanSource = localStorage.getItem('currentLoanSource');

      if (storedMovementPoints) setMovementPoints(parseInt(storedMovementPoints));
      if (storedTimePeriod) setTimePeriod(parseInt(storedTimePeriod));
      if (storedCurrentDistrict) setCurrentDistrict(storedCurrentDistrict);
      if (storedCreditScore) setCreditScore(parseInt(storedCreditScore));
      if (storedCurrentLoanSource) setCurrentLoanSource(storedCurrentLoanSource);
    };

    loadGameState();
  }, []);

  // Save game state
  useEffect(() => {
    localStorage.setItem('money', money);
    localStorage.setItem('loan', loan);
    localStorage.setItem('daysLeft', daysLeft);
    localStorage.setItem('movementPoints', movementPoints);
    localStorage.setItem('timePeriod', timePeriod);
    localStorage.setItem('currentDistrict', currentDistrict);
    localStorage.setItem('creditScore', creditScore);
    localStorage.setItem('currentLoanSource', currentLoanSource);
  }, [money, loan, daysLeft, movementPoints, timePeriod, currentDistrict, creditScore, currentLoanSource]);

  const showNotification = (message, type) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  };

  useEffect(() => {
    if (loan > 0 && daysLeft > 0) {
      setInterest(loan * DAILY_INTEREST);
    }
  }, [loan, daysLeft]);

  // Track game activity (start, end, score update)
  const trackGameActivity = async (score) => {
    if (!user) return; // Only track if user is logged in

    try {
      const response = await fetch(`${API_BASE_URL}/progress/game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          gameId: 'loan-shark',
          title: 'Loan Shark Challenge',
          score,
        }),
      });

      if (!response.ok) {
        console.error('Error tracking game activity');
      }
    } catch (error) {
      console.error('Failed to track game activity:', error);
    }
  };

  // Create random bubble animations
  useEffect(() => {
    if (!containerRef.current) return;

    const createBubble = () => {
      if (!containerRef.current) return;

      const bubble = document.createElement('div');
      bubble.classList.add('bubble');

      // Random size between 5px and 25px
      const size = Math.random() * 20 + 5;
      bubble.style.width = `${size}px`;
      bubble.style.height = `${size}px`;

      // Random position
      bubble.style.left = `${Math.random() * 100}%`;
      bubble.style.bottom = '0';

      // Random animation duration
      const duration = Math.random() * 10 + 5;
      bubble.style.animationDuration = `${duration}s`;

      containerRef.current.appendChild(bubble);

      // Remove bubble after animation completes
      setTimeout(() => {
        if (bubble && bubble.parentNode) {
          bubble.parentNode.removeChild(bubble);
        }
      }, duration * 1000);
    };

    // Create bubbles at random intervals
    const bubbleInterval = setInterval(createBubble, 2000);

    return () => clearInterval(bubbleInterval);
  }, []);

  // Method to see if player can travel to selected district
  const canTravelTo = (districtId) => {
    if (movementPoints <= 0) return false;
    if (currentDistrict === districtId) return false;
    return true;
  };

  // Travel to a new district
  const travelToDistrict = (districtId) => {
    if (!canTravelTo(districtId)) {
      showNotification('Not enough movement points to travel!', 'error');
      return;
    }

    setCurrentDistrict(districtId);
    setMovementPoints(prev => prev - 1);
    setShowDistrictInfo(false);

    // If movement points are exhausted, progress time
    if (movementPoints <= 1) {
      progressTime();
    }

    showNotification(`Traveled to ${DISTRICTS.find(d => d.id === districtId).name}`, 'success');
  };

  // Progress time period (morning -> afternoon -> evening)
  const progressTime = () => {
    if (timePeriod < TIME_PERIODS.length - 1) {
      setTimePeriod(prev => prev + 1);
      showNotification(`Time advances to ${TIME_PERIODS[timePeriod + 1]}`, 'info');
    } else {
      // End of day
      nextDay();
    }
  };

  // Borrow money based on location
  const borrowMoney = (loanOption) => {
    const districtObj = getCurrentDistrictObj();

    // Check if player meets requirements
    if (loanOption.requirementLevel > creditScore) {
      showNotification('❌ Your credit score is too low for this loan!', 'error');
      return;
    }

    if (loan > 0) {
      showNotification('❌ You can only take one loan at a time!', 'error');
      return;
    }

    // Set interest rate based on the specific loan's rate
    const actualInterest = loanOption.interest || DAILY_INTEREST;

    setLoan(loanOption.amount);
    setMoney(money + loanOption.amount);
    setDaysLeft(LOAN_DEADLINE);
    setCurrentLoanSource(districtObj.id);

    // Improve credit score slightly if using a bank loan
    if (districtObj.type === 'financial') {
      setCreditScore(prev => Math.min(10, prev + 1));
    }

    showNotification(`💰 Borrowed $${loanOption.amount} from ${loanOption.name}. Repay within ${LOAN_DEADLINE} days.`, 'success');
  };

  // Work job based on location
  const workJob = (job) => {
    // Check if player has enough time (movement points)
    if (movementPoints <= 0) {
      showNotification("❌ You're out of time today!", 'error');
      return;
    }

    setMoney(money + job.pay);
    setMovementPoints(prev => prev - 1);

    // If movement points are exhausted, progress time
    if (movementPoints <= 1) {
      progressTime();
    }

    // Improve credit score slightly when earning money
    setCreditScore(prev => Math.min(10, prev + 0.1));

    showNotification(`💼 You earned $${job.pay} from ${job.title}!`, 'success');
  };

  const repayLoan = () => {
    // Check if player is in the district where they got the loan
    if (currentLoanSource && currentLoanSource !== currentDistrict) {
      showNotification(`❌ You must return to ${DISTRICTS.find(d => d.id === currentLoanSource).name} to repay!`, 'error');
      return;
    }

    if (money >= loan + interest) {
      const finalMoney = money - (loan + interest);
      setMoney(finalMoney);
      setLoan(0);
      setDaysLeft(0);
      setInterest(0);
      setCurrentLoanSource('');

      // Improve credit score substantially when repaying loans
      setCreditScore(prev => Math.min(10, prev + 1));

      // Show success overlay if loan paid off
      if (daysPassed > 0) {
        setGameOverType('success');
        setGameOverMessage('Congratulations! You successfully repaid your loan.');
        setFinalProfit(finalMoney - 50); // Starting money was 50
        setShowGameOver(true);
      } else {
        showNotification('🎉 Loan fully repaid!', 'success');
      }

      // Track successful loan repayment as a score
      if (user && !gameEnded) {
        trackGameActivity(Math.round(finalMoney));
      }
    } else {
      showNotification('❌ Not enough money to repay the loan!', 'error');
    }
  };

  const nextDay = () => {
    setDaysPassed(prevDays => prevDays + 1);
    setMovementPoints(MOVEMENT_POINTS_PER_DAY);
    setTimePeriod(0); // Reset to morning

    if (daysLeft > 0) {
      setDaysLeft(daysLeft - 1);
      if (daysLeft - 1 === 0 && loan > 0) {
        showNotification('⚠️ Loan due TODAY! Pay up or face penalties!', 'warning');
      }
    } else {
      if (loan > 0) {
        const newLoan = loan * 1.2;
        setLoan(newLoan);
        showNotification('❌ Loan overdue! 20% penalty applied.', 'error');

        // Decrease credit score when missing payments
        setCreditScore(prev => Math.max(1, prev - 2));

        // Check if player is bankrupt (loan much larger than money)
        if (newLoan > money * 2 && daysPassed > 5) {
          setGameOverType('failure');
          setGameOverMessage("The loan sharks have come to collect! You couldn't repay your mounting debt.");
          setFinalProfit(money - newLoan);
          setShowGameOver(true);
          setGameEnded(true);

          // Track game over due to defaulting on loan
          if (user && !gameEnded) {
            trackGameActivity(Math.round(money - newLoan));
            setGameEnded(true);
          }
        }
      } else {
        showNotification('✅ A new day, no debts. Keep going!', 'success');
      }
    }
  };

  const resetGame = () => {
    // Track final score before reset if game was in progress
    if (user && gameStarted && !gameEnded) {
      trackGameActivity(Math.round(money - loan));
    }

    setMoney(50);
    setLoan(0);
    setDaysLeft(LOAN_DEADLINE);
    setGameStarted(false);
    setGameEnded(false);
    setShowGameOver(false);
    setDaysPassed(0);
    setMovementPoints(MOVEMENT_POINTS_PER_DAY);
    setTimePeriod(0);
    setCurrentDistrict('commercial');
    setCreditScore(1);
    setCurrentLoanSource('');
    localStorage.clear();
    showNotification('🔄 Game reset! Start fresh.', 'success');
  };

  // Calculate progress toward loan repayment
  const calculateLoanProgress = () => {
    if (loan === 0) return 100;
    const totalNeeded = loan + interest;
    const progress = (money / totalNeeded) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  // Handle district click
  const handleDistrictClick = (districtId) => {
    setSelectedDistrict(districtId);
    setShowDistrictInfo(true);
  };

  // Get available jobs for the current time period
  const getAvailableJobs = (district) => {
    // In a real game, you could filter jobs based on time period
    return district.jobs;
  };

  return (
    <div className="loan-shark-game" ref={containerRef}>
      {/* Decorative elements */}
      <div className="bubble bubble-1"></div>
      <div className="bubble bubble-2"></div>
      <div className="bubble bubble-3"></div>
      <div className="seaweed seaweed-1"></div>
      <div className="seaweed seaweed-2"></div>
      <div className="seaweed seaweed-3"></div>

      <div className="game-content">
        <h2>Loan Shark Challenge</h2>
        <p>Navigate the city, work jobs, and manage your loans. Watch out for the loan sharks!</p>

        {/* Notifications */}
        <div className="notifications">
          {notifications.map((note) => (
            <div key={note.id} className={`notification ${note.type}`}>
              {note.message}
            </div>
          ))}
        </div>

        {/* City Map */}
        <div className="city-map-container" ref={mapRef}>
          {/* Water area for bay/harbor */}
          <div className="water-area"></div>

          {/* Movement points indicator */}
          <div className="movement-points">
            <span className="movement-icon">👣</span> Moves: {movementPoints}
          </div>

          {/* Time of day indicator */}
          <div className="time-indicator">
            <span className="time-icon">{
              timePeriod === 0
                ? '🌅'
                : timePeriod === 1 ? '☀️' : '🌇'
            }</span> {TIME_PERIODS[timePeriod]}
          </div>

          {/* City grid with districts */}
          <div className="city-grid">
            {DISTRICTS.map((district) => (
              <div
                key={district.id}
                className={`district ${district.type} ${currentDistrict === district.id ? 'active' : ''}`}
                onClick={() => handleDistrictClick(district.id)}
              >
                {district.jobs.length > 0 && (
                  <div className="job-indicator">Jobs</div>
                )}
                {district.loans.length > 0 && (
                  <div className="loan-indicator">Loans</div>
                )}
                <div className="district-label">{district.name}</div>
              </div>
            ))}
          </div>

          {/* Player location marker */}
          <div className="player-location" ref={playerMarkerRef}></div>

          {/* Map legend */}
          <div className="map-legend">
            <div className="legend-item">
              <div className="legend-color legend-financial"></div>
              <span>Financial District</span>
            </div>
            <div className="legend-item">
              <div className="legend-color legend-harbor"></div>
              <span>Harbor Area</span>
            </div>
            <div className="legend-item">
              <div className="legend-color legend-residential"></div>
              <span>Residential</span>
            </div>
            <div className="legend-item">
              <div className="legend-color legend-commercial"></div>
              <span>Commercial</span>
            </div>
            <div className="legend-item">
              <div className="legend-color legend-industrial"></div>
              <span>Industrial</span>
            </div>
            <div className="legend-item">
              <div className="legend-color legend-waterfront"></div>
              <span>Waterfront</span>
            </div>
          </div>

          {/* District info popup */}
          {showDistrictInfo && selectedDistrict && (
            <div className="district-info active">
              <div className="district-info-header">
                <div className="district-info-title">
                  {getSelectedDistrictObj().name}
                </div>
                <button
                  className="district-info-close"
                  onClick={() => setShowDistrictInfo(false)}
                >
                  ×
                </button>
              </div>

              <p>{getSelectedDistrictObj().description}</p>

              <div className="district-info-options">
                {/* Jobs section */}
                {getAvailableJobs(getSelectedDistrictObj()).length > 0 && (
                  <>
                    <h4>Available Jobs:</h4>
                    {getAvailableJobs(getSelectedDistrictObj()).map((job, index) => (
                      <div
                        key={index}
                        className="district-option"
                        onClick={() => {
                          if (currentDistrict === selectedDistrict) {
                            workJob(job);
                            setShowDistrictInfo(false);
                          }
                        }}
                      >
                        <div className="option-label">
                          <span className="option-icon">{job.icon}</span>
                          {job.title}
                        </div>
                        <div className="option-reward">${job.pay}</div>
                      </div>
                    ))}
                  </>
                )}

                {/* Loans section */}
                {getSelectedDistrictObj().loans.length > 0 && loan === 0 && (
                  <>
                    <h4>Available Loans:</h4>
                    {getSelectedDistrictObj().loans.map((loanOption, index) => (
                      <div
                        key={index}
                        className="district-option"
                        onClick={() => {
                          if (currentDistrict === selectedDistrict) {
                            borrowMoney(loanOption);
                            setShowDistrictInfo(false);
                          }
                        }}
                        style={{
                          opacity: loanOption.requirementLevel > creditScore ? 0.5 : 1,
                          cursor: loanOption.requirementLevel > creditScore ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <div className="option-label">
                          <span className="option-icon">💰</span>
                          {loanOption.name}
                          {loanOption.requirementLevel > creditScore &&
                            <span style={{ color: '#ef4444', fontSize: '0.8rem', marginLeft: '5px' }}>
                              (Credit: {loanOption.requirementLevel})
                            </span>
                          }
                        </div>
                        <div className="option-reward">${loanOption.amount}</div>
                      </div>
                    ))}
                  </>
                )}

                {/* Repay loan option */}
                {loan > 0 && currentDistrict === currentLoanSource && (
                  <>
                    <h4>Repay Loan:</h4>
                    <div
                      className="district-option"
                      onClick={() => {
                        repayLoan();
                        setShowDistrictInfo(false);
                      }}
                      style={{
                        opacity: money < (loan + interest) ? 0.5 : 1,
                        cursor: money < (loan + interest) ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <div className="option-label">
                        <span className="option-icon">💸</span>
                        Pay off loan
                      </div>
                      <div className="option-reward">${(loan + interest).toFixed(2)}</div>
                    </div>
                  </>
                )}

                {/* Travel button - only show if not already in this district */}
                {currentDistrict !== selectedDistrict && (
                  <button
                    className="travel-btn"
                    onClick={() => travelToDistrict(selectedDistrict)}
                    disabled={movementPoints <= 0}
                  >
                    {movementPoints > 0 ? 'Travel Here' : 'No movement points left!'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Stats Panel */}
        <div className="stats-area" style={{ margin: '2rem 0' }}>
          <div className="stats">
            {/* Money Stat */}
            <div className="stat-item money-stat">
              <div className="stat-icon">💰</div>
              <div className="stat-details">
                <div className="stat-label">Money</div>
                <div className="stat-value">${money.toFixed(2)}</div>
              </div>
            </div>

            {/* Days Left Stat */}
            <div className={`stat-item days-stat ${daysLeft === 1 && loan > 0 ? 'days-warning' : ''}`}>
              <div className="stat-icon">📅</div>
              <div className="stat-details">
                <div className="stat-label">Days Left</div>
                <div className="stat-value">
                  {loan > 0
                    ? (
                        daysLeft > 0 ? `${daysLeft} days` : 'OVERDUE!'
                      )
                    : (
                        'No loan active'
                      )}
                </div>
              </div>
            </div>

            {/* Loan Balance Stat */}
            <div className="stat-item loan-stat">
              <div className="stat-icon">🦈</div>
              <div className="stat-details">
                <div className="stat-label">Loan Balance</div>
                <div className="stat-value">${loan.toFixed(2)}</div>
              </div>
            </div>

            {/* Credit Score Stat */}
            <div className="stat-item interest-stat">
              <div className="stat-icon">📊</div>
              <div className="stat-details">
                <div className="stat-label">
                  Credit Score
                  <span className="tooltip">
                    ⓘ
                    <span className="tooltip-text">
                      Determines which loans you can access. Improves when you repay loans on time and work jobs.
                    </span>
                  </span>
                </div>
                <div className="stat-value">{Math.round(creditScore)}/10</div>
              </div>
            </div>
          </div>

          {/* Loan Repayment Progress */}
          {loan > 0 && (
            <div className="progress-container">
              <div className="progress-label">
                <span>Loan Repayment Progress</span>
                <span>{Math.round(calculateLoanProgress())}%</span>
              </div>
              <div className="progress-bar-outer">
                <div
                  className="progress-bar-inner"
                  style={{ width: `${calculateLoanProgress()}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Next Day Button */}
        <button onClick={nextDay} className="btn next-day-btn">
          <span className="btn-icon">⏭️</span>
          End Day
        </button>

        {/* Reset Game Button */}
        <button onClick={resetGame} className="btn reset-btn">
          <span className="btn-icon">🔄</span>
          Reset Game
        </button>
      </div>

      {/* Game Over Overlay */}
      {showGameOver && (
        <div className="game-over-overlay">
          <div className="game-over-content">
            <h2 className="game-over-title">
              {gameOverType === 'success' ? 'Mission Accomplished! 🎉' : 'Game Over! 💸'}
            </h2>
            <p className="game-over-message">{gameOverMessage}</p>

            <div className="final-stats">
              <div className="final-stat-item">
                <div className="final-stat-label">Final Money</div>
                <div className="final-stat-value final-money">${money.toFixed(2)}</div>
              </div>

              <div className="final-stat-item">
                <div className="final-stat-label">Final Loan</div>
                <div className="final-stat-value final-loan">${loan.toFixed(2)}</div>
              </div>

              <div className="final-stat-item">
                <div className="final-stat-label">Days Survived</div>
                <div className="final-stat-value final-days">{daysPassed}</div>
              </div>

              <div className="final-stat-item">
                <div className="final-stat-label">Net Profit</div>
                <div className="final-stat-value final-profit" style={{ color: finalProfit >= 0 ? '#4ecca3' : '#e7455d' }}>
                  ${finalProfit.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="game-over-buttons">
              <button className="play-again-btn" onClick={resetGame}>
                Play Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanShark;
