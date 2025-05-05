/* eslint-disable no-unused-vars */
import { useState, useEffect, useRef, useContext } from 'react';
import { Sun, Cloud, CloudRain, Coins, ShoppingBag, ArrowRight, DollarSign, RefreshCw, Thermometer } from 'lucide-react';
import { ThemeContext } from '../context/ThemeContext.jsx';
import '../styles/LemonadeStand.css';

const LemonadeStand = () => {
  const weatherTypes = ['Sunny', 'Cloudy', 'Rainy'];
  const { theme } = useContext(ThemeContext);

  // Load saved game state from localStorage or initialise default state
  const loadGameState = () => {
    const savedState = JSON.parse(localStorage.getItem('lemonadeStandGame'));
    return savedState || {
      money: 20,
      lemons: 0,
      sugar: 0,
      ice: 0,
      lemonadePrice: 1,
      cupsSold: 0,
      totalCupsSold: 0,
      day: 1,
      weather: 'Sunny',
    };
  };

  const [gameState, setGameState] = useState(loadGameState);
  const { money, lemons, sugar, ice, lemonadePrice, cupsSold, totalCupsSold, day, weather } = gameState;
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [animateSale, setAnimateSale] = useState(false);
  const [showWeatherEffect, setShowWeatherEffect] = useState(true);

  const containerRef = useRef(null);

  const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:7900`;

  // Save game state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('lemonadeStandGame', JSON.stringify(gameState));
  }, [gameState]);

  // Load user data from localStorage on initial render
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Track game start activity for logged-in users
  useEffect(() => {
    if (user && !gameStarted && day === 1) {
      trackGameActivity(0);
      setGameStarted(true);
    }
  }, [user, gameStarted, day]);

  // Trigger weather effect animations when weather changes
  useEffect(() => {
    setShowWeatherEffect(true);
    const timer = setTimeout(() => {
      setShowWeatherEffect(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [weather]);

  // Generate weather effects (raindrops, sun rays, clouds) based on current weather
  useEffect(() => {
    if (!containerRef.current || !showWeatherEffect) return;

    const existingEffects = containerRef.current.querySelectorAll('.weather-effect');
    existingEffects.forEach(effect => effect.remove());

    if (weather === 'Rainy') {
      for (let i = 0; i < 20; i++) createRaindrop();
    } else if (weather === 'Sunny') {
      createSunRays();
    } else if (weather === 'Cloudy') {
      for (let i = 0; i < 3; i++) createCloud();
    }

    return () => {
      const effects = containerRef.current?.querySelectorAll('.weather-effect');
      effects?.forEach(effect => effect.remove());
    };
  }, [weather, showWeatherEffect]);

  // Create a raindrop element for rainy weather
  const createRaindrop = () => {
    if (!containerRef.current) return;

    const raindrop = document.createElement('div');
    raindrop.classList.add('raindrop', 'weather-effect');
    raindrop.style.left = `${Math.random() * 100}%`;
    raindrop.style.animationDelay = `${Math.random() * 2}s`;
    raindrop.style.animationDuration = `${0.5 + Math.random()}s`;

    containerRef.current.appendChild(raindrop);

    setTimeout(() => raindrop.remove(), 3000);
  };

  // Create sun rays element for sunny weather
  const createSunRays = () => {
    if (!containerRef.current) return;

    const sunRays = document.createElement('div');
    sunRays.classList.add('sun-rays', 'weather-effect');

    containerRef.current.appendChild(sunRays);

    setTimeout(() => sunRays.remove(), 3000);
  };

  // Create cloud elements for cloudy weather
  const createCloud = () => {
    if (!containerRef.current) return;

    const cloud = document.createElement('div');
    cloud.classList.add('cloud', 'weather-effect');
    cloud.style.top = `${20 + Math.random() * 30}%`;
    cloud.style.animationDuration = `${20 + Math.random() * 10}s`;

    containerRef.current.appendChild(cloud);

    setTimeout(() => cloud.remove(), 30000);
  };

  // Display appropriate weather icon based on current weather
  const WeatherIcon = () => {
    switch (weather) {
      case 'Sunny': return <Sun className="weather-icon" color={theme === 'dark' ? '#ffb74d' : '#f57f17'} />;
      case 'Cloudy': return <Cloud className="weather-icon" color={theme === 'dark' ? '#b0bec5' : '#607d8b'} />;
      case 'Rainy': return <CloudRain className="weather-icon" color={theme === 'dark' ? '#90a4ae' : '#546e7a'} />;
      default: return null;
    }
  };

  // Calculate customer demand based on weather and lemonade price
  const calculateDemand = () => {
    let baseDemand = 50;
    if (weather === 'Sunny') baseDemand += 20;
    if (weather === 'Cloudy') baseDemand -= 10;
    if (weather === 'Rainy') baseDemand -= 30;

    let priceFactor = 1 - lemonadePrice * 0.05;
    if (priceFactor < 0.5) priceFactor = 0.5;

    return Math.floor(baseDemand * priceFactor);
  };

  // Render cups emoji to visualise sales
  const renderCups = (count) => {
    const cups = [];
    const maxDisplayCups = 20;
    const displayCount = Math.min(count, maxDisplayCups);

    for (let i = 0; i < displayCount; i++) {
      cups.push(
        <span key={i} className="cup" style={{ animationDelay: `${i * 0.05}s` }}>
          🥤
        </span>,
      );
    }

    if (count > maxDisplayCups) {
      cups.push(<span key="more" className="cup-more">+{count - maxDisplayCups} more</span>);
    }

    return cups;
  };

  // Track game activity for analytics
  const trackGameActivity = async (score) => {
    if (!user) return;

    try {
      const response = await fetch(`${API_BASE_URL}/progress/game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          gameId: 'lemonade-stand',
          title: 'Lemonade Stand',
          score,
          metadata: JSON.stringify({
            daysSurvived: day,
            moneyEarned: money,
            totalCupsSold,
            lastWeather: weather,
          }),
        }),
      });

      if (!response.ok) {
        console.error('Error tracking game activity');
      }
    } catch (error) {
      console.error('Failed to track game activity:', error);
    }
  };

  // Determine the appropriate weather class for styling
  const getWeatherClass = () => {
    switch (weather) {
      case 'Sunny': return 'day-sunny';
      case 'Cloudy': return 'day-cloudy';
      case 'Rainy': return 'day-rainy';
      default: return '';
    }
  };

  // Handle purchasing items from the shop
  const buyItem = (item) => {
    if (money < 2) {
      setMessage('❌ Not enough money!');
      return;
    }
    setGameState((prev) => ({
      ...prev,
      money: prev.money - 2,
      lemons: item === 'lemon' ? prev.lemons + 1 : prev.lemons,
      sugar: item === 'sugar' ? prev.sugar + 1 : prev.sugar,
      ice: item === 'ice' ? prev.ice + 1 : prev.ice,
    }));

    if (containerRef.current) {
      const purchaseEffect = document.createElement('div');
      purchaseEffect.classList.add('purchase-effect');
      purchaseEffect.textContent = item === 'lemon' ? '🍋' : item === 'sugar' ? '🥄' : '🧊';

      containerRef.current.appendChild(purchaseEffect);

      setTimeout(() => purchaseEffect.remove(), 1000);
    }
  };

  // Handle selling lemonade to customers
  const sellLemonade = () => {
    if (lemons < 1 || sugar < 1 || ice < 1) {
      setMessage('❌ Not enough ingredients!');
      return;
    }

    const customers = calculateDemand();
    const cupsToSell = Math.min(customers, lemons, sugar, ice);
    const earnings = cupsToSell * lemonadePrice;

    setGameState((prev) => ({
      ...prev,
      money: prev.money + earnings,
      lemons: prev.lemons - cupsToSell,
      sugar: prev.sugar - cupsToSell,
      ice: prev.ice - cupsToSell,
      cupsSold: cupsToSell,
      totalCupsSold: prev.totalCupsSold + cupsToSell,
    }));

    setMessage(`✅ You sold ${cupsToSell} cups today and earned $${earnings.toFixed(2)}!`);

    setAnimateSale(true);
    setTimeout(() => setAnimateSale(false), 2000);
  };

  // Progress to the next day and update weather
  const nextDay = () => {
    if (day >= 7) {
      setMessage(`🎉 Game Over! You made $${money.toFixed(2)} in 7 days.`);

      if (user && !gameEnded) {
        trackGameActivity(Math.round(money));
        setGameEnded(true);
      }

      if (containerRef.current) {
        for (let i = 0; i < 50; i++) {
          createConfetti();
        }
      }

      return;
    }

    const newWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];

    setGameState((prev) => ({
      ...prev,
      day: prev.day + 1,
      weather: newWeather,
      cupsSold: 0,
      message: '',
    }));
  };

  // Create confetti for game end celebration
  const createConfetti = () => {
    if (!containerRef.current) return;

    const confetti = document.createElement('div');
    confetti.classList.add('confetti');
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
    confetti.style.transform = `rotate(${Math.random() * 360}deg)`;

    containerRef.current.appendChild(confetti);

    setTimeout(() => confetti.remove(), 3000);
  };

  // Reset the game to its initial state
  const resetGame = () => {
    if (user && gameStarted && !gameEnded && day > 1) {
      trackGameActivity(Math.round(money));
    }

    localStorage.removeItem('lemonadeStandGame');
    setGameState({
      money: 20,
      lemons: 0,
      sugar: 0,
      ice: 0,
      lemonadePrice: 1,
      cupsSold: 0,
      totalCupsSold: 0,
      day: 1,
      weather: 'Sunny',
    });
    setMessage('🔄 Game Reset!');
    setGameStarted(false);
    setGameEnded(false);
  };

  // Get estimated demand text based on current price and weather
  const getEstimatedDemand = () => {
    const demand = calculateDemand();

    if (demand >= 40) return 'Very High';
    if (demand >= 30) return 'High';
    if (demand >= 20) return 'Moderate';
    if (demand >= 10) return 'Low';
    return 'Very Low';
  };

  // Get colour for demand indicator
  const getDemandColour = () => {
    const demand = calculateDemand();

    if (theme === 'dark') {
      if (demand >= 40) return '#4caf50';
      if (demand >= 30) return '#8bc34a';
      if (demand >= 20) return '#ffeb3b';
      if (demand >= 10) return '#ff9800';
      return '#f44336';
    } else {
      if (demand >= 40) return '#4caf50';
      if (demand >= 30) return '#8bc34a';
      if (demand >= 20) return '#ffc107';
      if (demand >= 10) return '#ff9800';
      return '#f44336';
    }
  };

  return (
    <div className={`lemonade-game ${theme === 'dark' ? 'dark-theme' : ''}`} ref={containerRef}>
      <div className="lemon-decoration one">🍋</div>
      <div className="lemon-decoration two">🍋</div>
      <div className="lemon-decoration three">🍋</div>

      <div className="container">
        <div className={`header ${getWeatherClass()}`}>
          <div className="header-content">
            <h1 className="game-title">🍋 Lemonade Stand</h1>
            <div className="day-display">
              <span>Day {day}/7</span>
              <WeatherIcon />
            </div>
          </div>
        </div>

        <div className="main-content">
          <div className="stats-grid">
            <div className="stat-card money">
              <DollarSign size={24} />
              <h3>${money.toFixed(2)}</h3>
              <p>Money</p>
            </div>
            <div className="stat-card lemons">
              <span style={{ fontSize: '1.5rem' }}>🍋</span>
              <h3>{lemons}x</h3>
              <p>Lemons</p>
            </div>
            <div className="stat-card sugar">
              <span style={{ fontSize: '1.5rem' }}>🥄</span>
              <h3>{sugar}x</h3>
              <p>Sugar</p>
            </div>
            <div className="stat-card ice">
              <span style={{ fontSize: '1.5rem' }}>🧊</span>
              <h3>{ice}x</h3>
              <p>Ice</p>
            </div>
          </div>

          <div className="section">
            <h2 className="shop-title">
              <Thermometer size={20} />
              Weather & Demand
            </h2>
            <div className="weather-info">
              <div className="weather-detail">
                <p><strong>Today&apos;s Weather:</strong> {weather}</p>
                <p><strong>Estimated Demand:</strong> <span style={{ color: getDemandColour() }}>{getEstimatedDemand()}</span></p>
                <p className="weather-tip">
                  {weather === 'Sunny'
                    ? 'Perfect day for selling lemonade! Expect more customers.'
                    : weather === 'Cloudy'
                      ? 'Fewer customers during cloudy weather.'
                      : 'Rainy days are slow for lemonade sales.'}
                </p>
              </div>
            </div>
          </div>

          <div className="section">
            <h2 className="shop-title">
              <ShoppingBag size={20} />
              Shop
            </h2>
            <div className="shop-grid">
              <button onClick={() => buyItem('lemon')} className="btn btn-lemon">
                <span style={{ fontSize: '1.2rem' }}>🍋</span> Buy Lemon ($2)
              </button>
              <button onClick={() => buyItem('sugar')} className="btn btn-sugar">
                <span style={{ fontSize: '1.2rem' }}>🥄</span> Buy Sugar ($2)
              </button>
              <button onClick={() => buyItem('ice')} className="btn btn-ice">
                <span style={{ fontSize: '1.2rem' }}>🧊</span> Buy Ice ($2)
              </button>
            </div>
          </div>

          <div className="price-section">
            <div className="price-display">
              <span>Lemonade Price:</span>
              <span>${lemonadePrice.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.1"
              value={lemonadePrice}
              onChange={(e) => setGameState({ ...gameState, lemonadePrice: parseFloat(e.target.value) })}
              className="slider"
            />
            <div className="price-tips">
              <p><small>💡 Lower prices attract more customers, but you&apos;ll earn less per cup.</small></p>
            </div>
          </div>

          <div className="action-buttons">
            <button onClick={sellLemonade} className="btn btn-sell">
              <Coins size={20} /> Sell Lemonade
            </button>
            <button onClick={nextDay} className="btn btn-next">
              <ArrowRight size={20} /> Next Day
            </button>
          </div>

          {message && <div className="message">{message}</div>}

          <div className="sales-report">
            <h3 className="sales-title">📊 Today&apos;s Sales</h3>
            <p>Cups Sold: {cupsSold}</p>
            <p>Total Cups Sold: {totalCupsSold}</p>

            {cupsSold > 0 && (
              <div className="cups-counter">
                {renderCups(cupsSold)}
              </div>
            )}
          </div>

          <button onClick={resetGame} className="btn btn-reset">
            <RefreshCw size={18} /> Reset Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default LemonadeStand;
