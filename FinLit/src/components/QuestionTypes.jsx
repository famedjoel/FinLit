/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
// src/components/QuestionTypes.jsx
import React, { useState } from 'react';

// Question Type: Multiple Choice
export const MultipleChoiceQuestion = ({ 
  question, 
  options, 
  correctAnswer,
  onSelect,
  selectedAnswer,
  answerSubmitted
}) => {
  return (
    <div className="question-container">
      <h3 className="question">{question}</h3>
      
      <div className="options-container">
        {options.map((option, index) => (
          <div 
            key={index} 
            className={`
              option 
              ${selectedAnswer === index ? "selected" : ""} 
              ${answerSubmitted && index === correctAnswer ? "correct" : ""}
              ${answerSubmitted && selectedAnswer === index && index !== correctAnswer ? "incorrect" : ""}
            `}
            onClick={() => onSelect(index)}
          >
            {option}
          </div>
        ))}
      </div>
    </div>
  );
};

// Question Type: True/False
export const TrueFalseQuestion = ({ 
  question, 
  correctAnswer, 
  onSelect,
  selectedAnswer,
  answerSubmitted
}) => {
  const options = ["True", "False"];
  
  return (
    <div className="question-container">
      <h3 className="question">{question}</h3>
      <div className="options-container true-false-options">
        {options.map((option, index) => (
          <div 
            key={index} 
            className={`
              option true-false-option 
              ${selectedAnswer === index ? "selected" : ""} 
              ${answerSubmitted && index === correctAnswer ? "correct" : ""}
              ${answerSubmitted && selectedAnswer === index && index !== correctAnswer ? "incorrect" : ""}
            `}
            onClick={() => onSelect(index)}
          >
            {option}
          </div>
        ))}
      </div>
    </div>
  );
};

// Question Type: Fill in the Blank
export const FillInBlankQuestion = ({ 
  question, 
  correctAnswer, 
  onSelect,
  userInput,
  answerSubmitted,
  isCorrect
}) => {
  // Split the question at the blank marker ____ or [blank]
  const parts = question.split(/____|\[blank\]/i);
  
  return (
    <div className="question-container">
      <div className="question fill-blank-question">
        {parts[0]}
        <input 
          type="text" 
          value={userInput || ""}
          onChange={(e) => onSelect(e.target.value)}
          className={`
            blank-input 
            ${answerSubmitted && isCorrect ? "correct-input" : ""}
            ${answerSubmitted && !isCorrect ? "incorrect-input" : ""}
          `}
          disabled={answerSubmitted}
          placeholder="Enter your answer"
        />
        {parts[1]}
      </div>
      
      {answerSubmitted && !isCorrect && (
        <div className="correct-answer-display">
          <p>Correct answer: <strong>{correctAnswer}</strong></p>
        </div>
      )}
    </div>
  );
};

// Question Type: Matching
export const MatchingQuestion = ({ 
  question, 
  terms, 
  definitions, 
  correctMatches,
  onSelect,
  userMatches,
  answerSubmitted
}) => {
  const [selectedTerm, setSelectedTerm] = useState(null);
  
  const handleTermClick = (index) => {
    if (answerSubmitted) return;
    setSelectedTerm(index);
  };
  
  const handleDefinitionClick = (index) => {
    if (answerSubmitted || selectedTerm === null) return;
    
    const newMatches = [...userMatches];
    newMatches[selectedTerm] = index;
    onSelect(newMatches);
    setSelectedTerm(null);
  };
  
  return (
    <div className="question-container">
      <h3 className="question">{question}</h3>
      
      <div className="matching-container">
        <div className="terms-column">
          <h4>Terms</h4>
          {terms.map((term, index) => (
            <div 
              key={index} 
              className={`
                matching-item term-item 
                ${selectedTerm === index ? "selected" : ""}
                ${answerSubmitted && correctMatches[index] === userMatches[index] ? "correct-match" : ""}
                ${answerSubmitted && correctMatches[index] !== userMatches[index] ? "incorrect-match" : ""}
              `}
              onClick={() => handleTermClick(index)}
            >
              {term}
            </div>
          ))}
        </div>
        
        <div className="definitions-column">
          <h4>Definitions</h4>
          {definitions.map((definition, index) => (
            <div 
              key={index} 
              className={`
                matching-item definition-item
                ${answerSubmitted && userMatches.includes(index) && 
                  correctMatches[userMatches.indexOf(index)] === index ? "correct-match" : ""}
                ${answerSubmitted && userMatches.includes(index) && 
                  correctMatches[userMatches.indexOf(index)] !== index ? "incorrect-match" : ""}
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
            {terms.map((term, index) => (
              <li key={index}>
                <strong>{term}</strong>: {definitions[correctMatches[index]]}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// Question Type: Financial Calculation
export const CalculationQuestion = ({ 
  question, 
  correctAnswer, 
  hint,
  formula,
  onSelect,
  userInput,
  answerSubmitted,
  isCorrect,
  showHint,
  onToggleHint
}) => {
  return (
    <div className="question-container">
      <h3 className="question">{question}</h3>
      
      <div className="calculation-input-container">
        <input 
          type="number" 
          step="0.01"
          value={userInput || ""}
          onChange={(e) => onSelect(parseFloat(e.target.value))}
          className={`
            calculation-input 
            ${answerSubmitted && isCorrect ? "correct-input" : ""}
            ${answerSubmitted && !isCorrect ? "incorrect-input" : ""}
          `}
          disabled={answerSubmitted}
          placeholder="Enter your answer"
        />
      </div>
      
      <button 
        onClick={onToggleHint} 
        className="hint-button"
        disabled={answerSubmitted}
      >
        {showHint ? "Hide Hint" : "Show Hint"}
      </button>
      
      {showHint && (
        <div className="hint-container">
          <p><strong>Hint:</strong> {hint}</p>
          {formula && (
            <div className="formula-display">
              <p><strong>Formula:</strong> {formula}</p>
            </div>
          )}
        </div>
      )}
      
      {answerSubmitted && (
        <div className={`answer-feedback ${isCorrect ? "correct-feedback" : "incorrect-feedback"}`}>
          <p>
            {isCorrect 
              ? "Correct!" 
              : `Incorrect. The correct answer is ${correctAnswer}.`}
          </p>
        </div>
      )}
    </div>
  );
};