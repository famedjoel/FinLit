import  { useState, useEffect } from "react";
import "../styles/BattleBudgets.css";

const STARTING_BUDGET = 1000;
const WEEKS = 4;

const expensesList = [
  { name: "Rent", cost: 400 },
  { name: "Groceries", cost: 100 },
  { name: "Entertainment", cost: 50 },
  { name: "Transportation", cost: 75 },
  { name: "Dining Out", cost: 60 },
  { name: "Shopping", cost: 80 },
];

const BattleBudgets = () => {
  const [week, setWeek] = useState(1);
  const [playerMoney, setPlayerMoney] = useState(STARTING_BUDGET);
  const [aiMoney, setAiMoney] = useState(STARTING_BUDGET);
  const [expenses, setExpenses] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    generateWeeklyExpenses();
  }, [week]);

  const generateWeeklyExpenses = () => {
    const randomExpenses = expensesList
      .sort(() => 0.5 - Math.random())
      .slice(0, 3); // Select 3 random expenses
    setExpenses(randomExpenses);
  };

  const handleChoice = (choice) => {
    let totalExpense = expenses.reduce((sum, item) => sum + item.cost, 0);
    let newPlayerMoney = playerMoney;
    let newAiMoney = aiMoney;

    if (choice === "save") {
      newPlayerMoney -= totalExpense * 0.5; // Saving reduces expenses by 50%
    } else if (choice === "spend") {
      newPlayerMoney -= totalExpense; // Full expenses applied
    } else if (choice === "invest") {
      newPlayerMoney -= totalExpense * 0.75; // Investing costs 75%
      newPlayerMoney += 50; // Investment return
    }

    // AI Strategy: Randomly picks between saving or spending
    const aiChoice = Math.random() > 0.5 ? "save" : "spend";
    newAiMoney -= aiChoice === "save" ? totalExpense * 0.5 : totalExpense;

    setPlayerMoney(newPlayerMoney);
    setAiMoney(newAiMoney);
    setMessage(`You chose to ${choice}. AI chose to ${aiChoice}.`);

    if (week < WEEKS) {
      setWeek(week + 1);
    } else {
      determineWinner(newPlayerMoney, newAiMoney);
    }
  };

  const determineWinner = (player, ai) => {
    if (player > ai) {
      setMessage("🎉 You won! You saved more than the AI!");
    } else if (player < ai) {
      setMessage("😢 AI won! The AI saved more than you.");
    } else {
      setMessage("🤝 It's a tie! Both saved the same amount.");
    }
  };

  return (
    <div className="battle-budgets-container">
      <h2 className="title animated-title">💰 Battle of the Budgets</h2>
      <div className="stats">
        <h3>Week {week} of {WEEKS}</h3>
        <p className="player-money highlight">Your Money: <span>${playerMoney.toFixed(2)}</span></p>
        <p className="ai-money highlight">AI Money: <span>${aiMoney.toFixed(2)}</span></p>
      </div>
      
      <div className="expenses">
        <h4>This Week&apos;s Expenses:</h4>
        <ul>
          {expenses.map((expense, index) => (
            <li key={index} className="expense-item fade-in">{expense.name}: <span>${expense.cost}</span></li>
          ))}
        </ul>
      </div>

      <div className="choices">
        <button className="choice-btn save pulse" onClick={() => handleChoice("save")}>💰 Save</button>
        <button className="choice-btn spend shake" onClick={() => handleChoice("spend")}>🛍️ Spend</button>
        <button className="choice-btn invest bounce" onClick={() => handleChoice("invest")}>📈 Invest</button>
      </div>

      {message && <p className="message-box pop-up">{message}</p>}
    </div>
  );
};

export default BattleBudgets;
