import { useState } from "react";

function Quiz() {
  const [score, setScore] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const questions = [
    { q: "What is a stock?", a: "A share in a company" },
    { q: "What does ROI stand for?", a: "Return on Investment" },
  ];

  const handleAnswer = (answer) => {
    if (answer === questions[questionIndex].a) setScore(score + 1);
    setQuestionIndex(questionIndex + 1);
  };

  return (
    <div className="quiz-container">
      {questionIndex < questions.length ? (
        <div>
          <h3>{questions[questionIndex].q}</h3>
          <button onClick={() => handleAnswer("A share in a company")} className="btn-primary">A share in a company</button>
          <button onClick={() => handleAnswer("A type of loan")} className="btn-secondary">A type of loan</button>
        </div>
      ) : (
        <h3>Your Score: {score}/{questions.length}</h3>
      )}
    </div>
  );
}

export default Quiz;
