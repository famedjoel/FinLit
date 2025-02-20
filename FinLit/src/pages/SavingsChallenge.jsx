import { useState,  useEffect } from "react";
import PropTypes from 'prop-types';
import "../styles/SavingsChallenge.css"; 
import Confetti from "react-confetti";
import dropSound from "../assets/drop.mp3"; // Add a drop sound effect
import removeSound from "../assets/remove.mp3"; // Add a remove sound effect
import challengeSound from "../assets/challenge-completed.mp3";
import streakSound from "../assets/streak-bonus.mp3";
import goalSound from "../assets/goal-reached.mp3";

// Load audio files
const challengeAudio = new Audio(challengeSound);
const streakAudio = new Audio(streakSound);
const goalAudio = new Audio(goalSound);


const moneyOptions = [1, 5, 10, 20, 50];


// List of random daily challenges
const challenges = [
  { text: "Save at least $5 today!", minAmount: 5, reward: 2 },
  { text: "Save at least $10 today!", minAmount: 10, reward: 5 },
  { text: "Save exactly $7 today!", minAmount: 7, reward: 3 },
  { text: "Save an even amount today!", isEven: true, reward: 4 },
  { text: "Save a multiple of $5 today!", isMultipleOfFive: true, reward: 3 },
];

const SavingsChallenge = () => {
    const [savings, setSavings] = useState(() => {
        const savedData = localStorage.getItem("savingsData");
        return savedData ? JSON.parse(savedData) : Array(30).fill(0);
    });

    const [totalSaved, setTotalSaved] = useState(() => {
        return savings.reduce((acc, val) => acc + val, 0);
    });

    const [goal, setGoal] = useState(() => {
        const savedGoal = localStorage.getItem("savingsGoal");
        return savedGoal ? JSON.parse(savedGoal) : 300;
    });

    const [goalReached, setGoalReached] = useState(false);
    const [streak, setStreak] = useState(0); // Track the user's current streak
    const [challenge, setChallenge] = useState(null);
  const [challengeCompleted, setChallengeCompleted] = useState(false);
    const dropAudio = new Audio(dropSound);
    const removeAudio = new Audio(removeSound);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
      const today = new Date().toDateString();
      const savedChallenge = localStorage.getItem("dailyChallenge");
  
      if (!savedChallenge || JSON.parse(savedChallenge).date !== today) {
        const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)];
        localStorage.setItem("dailyChallenge", JSON.stringify({ ...randomChallenge, date: today }));
        setChallenge(randomChallenge);
        setChallengeCompleted(false);
      } else {
        setChallenge(JSON.parse(savedChallenge));
      }

        localStorage.setItem("savingsData", JSON.stringify(savings));
        localStorage.setItem("savingsGoal", JSON.stringify(goal));
        setTotalSaved(savings.reduce((acc, val) => acc + val, 0));

        if (totalSaved >= goal && goal > 0) {
            setGoalReached(true);
      showNotification("🎉 Goal Reached! Great job!", "success", goalAudio);
            setTimeout(() => setGoalReached(false), 5000);
        }
    }, [savings, goal, totalSaved]);


  // Show notifications with sound effects
  const showNotification = (message, type, sound) => {
    const newNotification = { id: Date.now(), message, type };
    setNotifications((prev) => [...prev, newNotification]);

    if (sound) sound.play();  // 🎵 Play assigned sound effect

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== newNotification.id));
    }, 4000);
  };

    // Function to check if the daily challenge is completed
  const checkChallengeCompletion = (amount) => {
    if (!challenge || challengeCompleted) return;

    let completed = false;

    if (challenge.minAmount && amount >= challenge.minAmount) {
      completed = true;
    } else if (challenge.isEven && amount % 2 === 0) {
      completed = true;
    } else if (challenge.isMultipleOfFive && amount % 5 === 0) {
      completed = true;
    }

    if (completed) {
      setChallengeCompleted(true);
      setSavings((prevSavings) => {
        const updatedSavings = [...prevSavings];
        updatedSavings[amount - 1] += challenge.reward;
        return updatedSavings;
      });
      showNotification("🎯 Daily Challenge Completed! Bonus Added!", "success");
    }
  };



    // Function to handle dropping money into a slot
    const handleDrop = (dayIndex, amount) => {
        const updatedSavings = [...savings];
        updatedSavings[dayIndex] += amount;

        if (!challengeCompleted && checkChallengeCompletion(amount)) {
          setChallengeCompleted(true);
          showNotification("🎯 Daily Challenge Completed! Bonus Added!", "success", challengeAudio);
        }

        // Check if this continues a streak
        if (dayIndex > 0 && updatedSavings[dayIndex - 1] > 0) {
            setStreak((prev) => prev + 1);
        } else {
            setStreak(1);
        }

        // Reward bonus if streak reaches 3 days
        if (streak >= 3) {
            updatedSavings[dayIndex] += 5; // Bonus reward of $5
      showNotification("🔥 Streak Bonus! +$5 Added!", "success", streakAudio);
        }

        setSavings(updatedSavings);
        checkChallengeCompletion(amount);
        dropAudio.play();
    };

    // Function to remove money from a slot
    const handleRemove = (dayIndex) => {
        const removedAmount = savings[dayIndex];
        if (removedAmount > 0) {
            const updatedSavings = [...savings];
            updatedSavings[dayIndex] = 0;
            setSavings(updatedSavings);
            setStreak(0); // Reset streak if a day is cleared
            removeAudio.play();
        }
    };

    // Reset function to clear all progress
    const resetSavings = () => {
        setSavings(Array(30).fill(0));
        setTotalSaved(0);
        setStreak(0);
        localStorage.removeItem("savingsData");
        setGoal(300);
        localStorage.removeItem("savingsGoal");
    };

    // Function to generate weekly savings report
    const getWeeklyReport = () => {
        let weeklyTotals = [];
        for (let i = 0; i < savings.length; i += 7) {
            const weekSum = savings.slice(i, i + 7).reduce((acc, val) => acc + val, 0);
            weeklyTotals.push(weekSum);
        }
        return weeklyTotals;
    };

    return (
        <div className="savings-challenge">
            {goalReached && <Confetti />} {/* 🎉 Confetti Effect */}

            {/* Notifications */}
      <div className="notifications">
        {notifications.map((note) => (
          <div key={note.id} className={`notification ${note.type}`}>
            {note.message}
          </div>
        ))}
      </div>

            <h2>💰 30-Day Savings Challenge</h2>
            <p>Drag and drop money into each day&apos;s slot. Click a slot to remove money.</p>

            <div className="goal-setting">
                <label>Set Goal: $</label>
                <input 
                    type="number" 
                    value={goal} 
                    onChange={(e) => setGoal(Number(e.target.value))}
                />
            </div>

            <div className="money-options">
                {moneyOptions.map((amount) => (
                    <DraggableMoney key={amount} amount={amount} />
                ))}
            </div>

            <div className="grid">
                {savings.map((savedAmount, index) => (
                    <DaySlot
                        key={index}
                        day={index + 1}
                        savedAmount={savedAmount}
                        onDrop={handleDrop}
                        onRemove={handleRemove}
                    />
                ))}
            </div>

            <div className="progress-bar-container">
                <div
                    className="progress-bar"
                    style={{ width: `${(totalSaved / goal) * 100}%` }}
                ></div>
            </div>

            <p><strong>Total Saved: ${totalSaved} / ${goal}</strong></p>
            <p><strong>Current Streak: {streak} Days 🔥</strong></p>

            {/* Display daily challenge */}
      <h3>🎯 Daily Challenge:</h3>
      {challenge && (
        <p>
          {challenge.text} {challengeCompleted ? "✅ Completed!" : "❌ Not Completed"}
        </p>
      )}

            <h3>📊 Weekly Savings Report</h3>
            <ul>
                {getWeeklyReport().map((weekTotal, index) => (
                    <li key={index}>Week {index + 1}: ${weekTotal}</li>
                ))}
            </ul>

            <button onClick={resetSavings} className="reset-btn">Reset Progress</button>
        </div>
    );
};

// Draggable Money Component
const DraggableMoney = ({ amount }) => {
    const handleDragStart = (e) => {
        e.dataTransfer.setData("amount", amount);
    };

    return (
        <div
            className="draggable-money"
            draggable
            onDragStart={handleDragStart}
        >
            💵 ${amount}
        </div>
    );
};

// Day Slot Component
const DaySlot = ({ day, savedAmount, onDrop, onRemove }) => {
    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e) => {
        const amount = Number(e.dataTransfer.getData("amount"));
        onDrop(day - 1, amount);
    };

    return (
        <div
            className="day-slot"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => onRemove(day - 1)}
        >
            <p>Day {day}</p>
            <p><strong>${savedAmount}</strong></p>
        </div>
    );
};

// PropTypes Validation
DaySlot.propTypes = {
    day: PropTypes.number.isRequired,
    onDrop: PropTypes.func.isRequired,
    onRemove: PropTypes.func.isRequired,
    savedAmount: PropTypes.number.isRequired,
};

DraggableMoney.propTypes = {
    amount: PropTypes.number.isRequired,
};



export default SavingsChallenge;
