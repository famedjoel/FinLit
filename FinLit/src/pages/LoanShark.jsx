import { useState, useEffect } from "react";
import "../styles/LoanShark.css"; // Import styles

const LOAN_OPTIONS = [100, 200, 500];
const DAILY_INTEREST = 0.05; // 5% daily interest
const LOAN_DEADLINE = 7; // Repayment deadline in days

const LoanShark = () => {
  const [money, setMoney] = useState(() => parseFloat(localStorage.getItem("money")) || 50);
  const [loan, setLoan] = useState(() => parseFloat(localStorage.getItem("loan")) || 0);
  const [daysLeft, setDaysLeft] = useState(() => parseInt(localStorage.getItem("daysLeft")) || LOAN_DEADLINE);
  const [interest, setInterest] = useState(0);
  const [notifications, setNotifications] = useState([]);

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

  useEffect(() => {
    localStorage.setItem("money", money);
    localStorage.setItem("loan", loan);
    localStorage.setItem("daysLeft", daysLeft);
  }, [money, loan, daysLeft]);

  const borrowMoney = (amount) => {
    if (loan > 0) {
      showNotification("❌ You can only take one loan at a time!", "error");
      return;
    }
    setLoan(amount);
    setMoney(money + amount);
    setDaysLeft(LOAN_DEADLINE);
    showNotification(`✅ Borrowed $${amount}. Repay within ${LOAN_DEADLINE} days.`, "success");
  };

  const workJob = (pay) => {
    setMoney(money + pay);
    showNotification(`💼 You earned $${pay} from work!`, "success");
  };

  const repayLoan = () => {
    if (money >= loan + interest) {
      setMoney(money - (loan + interest));
      setLoan(0);
      setDaysLeft(0);
      setInterest(0);
      showNotification("🎉 Loan fully repaid!", "success");
    } else {
      showNotification("❌ Not enough money to repay the loan!", "error");
    }
  };

  const nextDay = () => {
    if (daysLeft > 0) {
      setDaysLeft(daysLeft - 1);
      if (daysLeft - 1 === 0 && loan > 0) {
        showNotification("⚠️ Loan due TODAY! Pay up or face penalties!", "warning");
      }
    } else {
      if (loan > 0) {
        setLoan(loan * 1.2);
        showNotification("❌ Loan overdue! Penalty applied.", "error");
      } else {
        showNotification("✅ A new day, no debts. Keep going!", "success");
      }
    }
  };

  const resetGame = () => {
    setMoney(50);
    setLoan(0);
    setDaysLeft(LOAN_DEADLINE);
    localStorage.clear();
    showNotification("🔄 Game reset! Start fresh.", "success");
  };

  return (
    <div className="loan-shark-game">
      <h2>🦈 Loan Shark Challenge</h2>
      <p>Borrow money, work, and repay before time runs out!</p>

      {/* Notifications */}
      <div className="notifications">
        {notifications.map((note) => (
          <div key={note.id} className={`notification ${note.type}`}>
            {note.message}
          </div>
        ))}
      </div>

      <div className="stats">
        <p>💰 Money: <strong>${money.toFixed(2)}</strong></p>
        <p>📅 Days Left: <strong>{daysLeft}</strong></p>
        <p>💳 Loan Balance: <strong>${loan.toFixed(2)}</strong></p>
        <p>📈 Daily Interest: <strong>${interest.toFixed(2)}</strong></p>
      </div>

      <h3>🏦 Take a Loan</h3>
      <div className="loan-options">
        {LOAN_OPTIONS.map((amount) => (
          <button key={amount} onClick={() => borrowMoney(amount)} className="btn loan-btn">
            Borrow ${amount}
          </button>
        ))}
      </div>

      <h3>💼 Work & Earn</h3>
      <div className="job-options">
        <button onClick={() => workJob(15)} className="btn job-btn">Mow a Lawn ($15)</button>
        <button onClick={() => workJob(20)} className="btn job-btn">Wash Cars ($20)</button>
        <button onClick={() => workJob(30)} className="btn job-btn">Deliver Food ($30)</button>
      </div>

      <h3>💳 Repay Loan</h3>
      <button onClick={repayLoan} className="btn repay-btn">Repay Now</button>

      <button onClick={nextDay} className="btn next-day-btn">⏭️ Next Day</button>
      <button onClick={resetGame} className="btn reset-btn">🔄 Reset Game</button>
    </div>
  );
};

export default LoanShark;
