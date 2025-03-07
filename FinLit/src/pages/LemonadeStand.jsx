import { useState, useEffect } from "react";
import { Sun, Cloud, CloudRain, Coins, ShoppingBag, ArrowRight, DollarSign } from "lucide-react";
import "../styles/LemonadeStand.css"; // Import styles

const LemonadeStand = () => {
  const weatherTypes = ["Sunny", "Cloudy", "Rainy"];

  // Load saved game state from localStorage
  const loadGameState = () => {
    const savedState = JSON.parse(localStorage.getItem("lemonadeStandGame"));
    return savedState || { money: 20, lemons: 0, sugar: 0, ice: 0, lemonadePrice: 1, cupsSold: 0, day: 1, weather: "Sunny" };
  };

  const [gameState, setGameState] = useState(loadGameState);
  const { money, lemons, sugar, ice, lemonadePrice, cupsSold, day, weather } = gameState;
  const [message, setMessage] = useState("");

  useEffect(() => {
    localStorage.setItem("lemonadeStandGame", JSON.stringify(gameState));
  }, [gameState]); // Save progress after every change

  const WeatherIcon = () => {
    switch (weather) {
      case "Sunny": return <Sun className="weather-icon" />;
      case "Cloudy": return <Cloud className="weather-icon" />;
      case "Rainy": return <CloudRain className="weather-icon" />;
      default: return null;
    }
  };

  const calculateDemand = () => {
    let baseDemand = 50;
    if (weather === "Sunny") baseDemand += 20;
    if (weather === "Cloudy") baseDemand -= 10;
    if (weather === "Rainy") baseDemand -= 30;

    let priceFactor = 1 - lemonadePrice * 0.05;
    if (priceFactor < 0.5) priceFactor = 0.5;

    return Math.floor(baseDemand * priceFactor);
  };

  const buyItem = (item) => {
    if (money < 2) {
      setMessage("❌ Not enough money!");
      return;
    }
    setGameState((prev) => ({
      ...prev,
      money: prev.money - 2,
      lemons: item === "lemon" ? prev.lemons + 1 : prev.lemons,
      sugar: item === "sugar" ? prev.sugar + 1 : prev.sugar,
      ice: item === "ice" ? prev.ice + 1 : prev.ice,
    }));
  };

  const sellLemonade = () => {
    if (lemons < 1 || sugar < 1 || ice < 1) {
      setMessage("❌ Not enough ingredients!");
      return;
    }

    let customers = calculateDemand();
    let cupsToSell = Math.min(customers, lemons, sugar, ice);
    let earnings = cupsToSell * lemonadePrice;

    setGameState((prev) => ({
      ...prev,
      money: prev.money + earnings,
      lemons: prev.lemons - cupsToSell,
      sugar: prev.sugar - cupsToSell,
      ice: prev.ice - cupsToSell,
      cupsSold: cupsToSell,
    }));
    setMessage(`✅ You sold ${cupsToSell} cups today and earned $${earnings.toFixed(2)}!`);
  };

  const nextDay = () => {
    if (day >= 7) {
      setMessage(`🎉 Game Over! You made $${money.toFixed(2)} in 7 days.`);
      return;
    }
    setGameState((prev) => ({
      ...prev,
      day: prev.day + 1,
      weather: weatherTypes[Math.floor(Math.random() * weatherTypes.length)],
      cupsSold: 0,
      message: "",
    }));
  };

  const resetGame = () => {
    localStorage.removeItem("lemonadeStandGame");
    setGameState({
      money: 20,
      lemons: 0,
      sugar: 0,
      ice: 0,
      lemonadePrice: 1,
      cupsSold: 0,
      day: 1,
      weather: "Sunny",
    });
    setMessage("🔄 Game Reset!");
  };

  return (
    <div className="container">
      <div className="header">
        <div className="header-content">
          <h1 className="game-title">🍋 Lemonade Stand</h1>
          <div className="day-display">
            <span>Day {day}/7</span>
            <WeatherIcon />
          </div>
        </div>
      </div>

      <div className="main-content">
        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card money"><DollarSign /> ${money.toFixed(2)} <p>Money</p></div>
          <div className="stat-card lemons">{lemons}x 🍋 <p>Lemons</p></div>
          <div className="stat-card sugar">{sugar}x 🥄 <p>Sugar</p></div>
          <div className="stat-card ice">{ice}x 🧊 <p>Ice</p></div>
        </div>

        {/* Shop */}
        <div className="section">
          <h2 className="shop-title">🛒 Shop</h2>
          <div className="shop-grid">
            <button onClick={() => buyItem("lemon")} className="btn btn-lemon"><ShoppingBag /> Buy Lemon ($2)</button>
            <button onClick={() => buyItem("sugar")} className="btn btn-sugar"><ShoppingBag /> Buy Sugar ($2)</button>
            <button onClick={() => buyItem("ice")} className="btn btn-ice"><ShoppingBag /> Buy Ice ($2)</button>
          </div>
        </div>

        {/* Set Lemonade Price */}
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
        </div>

        {/* Actions */}
        <div className="action-buttons">
          <button onClick={sellLemonade} className="btn btn-sell"><Coins /> Sell Lemonade</button>
          <button onClick={nextDay} className="btn btn-next"><ArrowRight /> Next Day</button>
        </div>

        {/* Message */}
        {message && <div className="message">{message}</div>}

        {/* Sales Report */}
        <div className="sales-report">
          <h3 className="sales-title">📊 Today&apos;s Sales</h3>
          <p>Cups Sold: {cupsSold}</p>
        </div>

        {/* Reset Game */}
        <button onClick={resetGame} className="btn btn-reset">🔄 Reset Game</button>
      </div>
    </div>
  );
};

export default LemonadeStand;
