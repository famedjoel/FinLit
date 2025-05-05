/* eslint-disable multiline-ternary */
/* eslint-disable no-unused-vars */
import React, { useState } from 'react';

// Multiple Choice Question component
export const MultipleChoiceQuestion = ({
  question,
  options,
  correctAnswer,
  onSelect,
  selectedAnswer,
  answerSubmitted,
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
              ${selectedAnswer === index ? 'selected' : ''} 
              ${answerSubmitted && index === correctAnswer ? 'correct' : ''}
              ${answerSubmitted && selectedAnswer === index && index !== correctAnswer ? 'incorrect' : ''}
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

// True/False Question component
export const TrueFalseQuestion = ({
  question,
  correctAnswer,
  onSelect,
  selectedAnswer,
  answerSubmitted,
}) => {
  const options = ['True', 'False'];
  return (
    <div className="question-container">
      <h3 className="question">{question}</h3>
      <div className="options-container true-false-options">
        {options.map((option, index) => (
          <div
            key={index}
            className={`
              option true-false-option 
              ${selectedAnswer === index ? 'selected' : ''} 
              ${answerSubmitted && index === correctAnswer ? 'correct' : ''}
              ${answerSubmitted && selectedAnswer === index && index !== correctAnswer ? 'incorrect' : ''}
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

// Fill in the Blank Question component
export const FillInBlankQuestion = ({
  question,
  options,
  correctAnswer,
  onSelect,
  userInput,
  answerSubmitted,
  isCorrect,
}) => {
  // Split the question at recognised blank markers
  const parts = question.split(/____|\[blank\]|___/i);

  // Determine if there are options provided
  const hasOptions = Array.isArray(options) && options.length > 0;

  // Handle selection from dropdown or button options
  const handleOptionSelect = (optionIndex) => {
    if (!answerSubmitted) {
      onSelect(options[optionIndex]);
    }
  };

  // Handle changes in text input
  const handleTextInput = (e) => {
    if (!answerSubmitted) {
      onSelect(e.target.value);
    }
  };

  // Compute the correct answer text, whether from options or as given directly
  const correctAnswerText =
    typeof correctAnswer === 'number' && hasOptions ? options[correctAnswer] : correctAnswer;

  return (
    <div className="question-container">
      <div className="question fill-blank-question">
        {parts[0]}
        {hasOptions ? (
          <select
            value={userInput || ''}
            onChange={(e) => handleOptionSelect(parseInt(e.target.value))}
            className={`
              blank-dropdown
              ${answerSubmitted && isCorrect ? 'correct-input' : ''}
              ${answerSubmitted && !isCorrect ? 'incorrect-input' : ''}
            `}
            disabled={answerSubmitted}
          >
            <option value="" disabled>
              Select answer...
            </option>
            {options.map((option, index) => (
              <option key={index} value={index}>
                {option}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={userInput || ''}
            onChange={handleTextInput}
            className={`
              blank-input 
              ${answerSubmitted && isCorrect ? 'correct-input' : ''}
              ${answerSubmitted && !isCorrect ? 'incorrect-input' : ''}
            `}
            disabled={answerSubmitted}
            placeholder="Enter your answer"
          />
        )}
        {parts[1] || ''}
      </div>

      {hasOptions && !answerSubmitted && (
        <div className="options-buttons">
          {options.map((option, index) => (
            <button
              key={index}
              className={`option-btn ${userInput === option ? 'selected' : ''}`}
              onClick={() => handleOptionSelect(index)}
            >
              {option}
            </button>
          ))}
        </div>
      )}

      {answerSubmitted && !isCorrect && (
        <div className="correct-answer-display">
          <p>
            Correct answer: <strong>{correctAnswerText}</strong>
          </p>
        </div>
      )}
    </div>
  );
};

// Matching Question component
export const MatchingQuestion = ({
  question,
  terms = [],
  definitions = [],
  items = [],
  correctMatches = [],
  onSelect,
  userMatches,
  answerSubmitted,
}) => {
  const [selectedTerm, setSelectedTerm] = useState(null);

  // Prepare terms and definitions from the new or legacy format
  let processedTerms = [];
  let processedDefinitions = [];

  if (items && items.length > 0) {
    processedTerms = items.map((item) => item.term);
    processedDefinitions = items.map((item) => item.definition);
  } else {
    processedTerms = terms;
    processedDefinitions = definitions;
  }

  // Initialise matches if none provided
  const matches = userMatches || Array(processedTerms.length).fill(null);

  // Handle clicking a term; deselect if already matched
  const handleTermClick = (index) => {
    if (answerSubmitted) return;
    if (matches[index] !== null) {
      const updatedMatches = [...matches];
      updatedMatches[index] = null;
      onSelect(updatedMatches);
    }
    setSelectedTerm(index);
  };

  // Handle clicking a definition to match with the selected term
  const handleDefinitionClick = (index) => {
    if (answerSubmitted || selectedTerm === null) return;
    const updatedMatches = [...matches];
    updatedMatches[selectedTerm] = index;
    onSelect(updatedMatches);
    setSelectedTerm(null);
  };

  // Check whether a definition is already matched
  const isDefinitionMatched = (defIndex) => {
    return matches.includes(defIndex);
  };

  // Retrieve the term index matched with a definition
  const getMatchedTermIndex = (defIndex) => {
    return matches.findIndex((match) => match === defIndex);
  };

  return (
    <div className="question-container">
      <h3 className="question">{question}</h3>

      <div className="matching-container">
        <div className="matching-instructions">
          <p>Click on a term, then click on its matching definition</p>
        </div>

        <div className="matching-interface">
          <div className="terms-column">
            <h4>Terms</h4>
            {processedTerms.map((term, index) => {
              let termClass = 'matching-item term-item';
              if (selectedTerm === index) termClass += ' selected';
              if (answerSubmitted) {
                termClass +=
                  correctMatches[index] === matches[index]
                    ? ' correct-match'
                    : ' incorrect-match';
              } else if (matches[index] !== null) {
                termClass += ' matched';
              }

              return (
                <div
                  key={index}
                  className={termClass}
                  onClick={() => handleTermClick(index)}
                >
                  <span className="term-number">{index + 1}.</span>
                  <span className="term-text">{term}</span>
                  {matches[index] !== null && !answerSubmitted && (
                    <div className="matched-indicator">
                      ↔️ {matches[index] + 1}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="definitions-column">
            <h4>Definitions</h4>
            {processedDefinitions.map((definition, index) => {
              let defClass = 'matching-item definition-item';

              if (answerSubmitted) {
                const termIndex = getMatchedTermIndex(index);
                if (termIndex !== -1 && correctMatches[termIndex] === index) {
                  defClass += ' correct-match';
                } else if (termIndex !== -1) {
                  defClass += ' incorrect-match';
                }
              } else if (isDefinitionMatched(index)) {
                defClass += ' matched';
              }

              return (
                <div
                  key={index}
                  className={defClass}
                  onClick={() => handleDefinitionClick(index)}
                >
                  <span className="definition-number">{index + 1}.</span>
                  <span className="definition-text">{definition}</span>
                  {isDefinitionMatched(index) && !answerSubmitted && (
                    <div className="matched-indicator">
                      ↔️ {getMatchedTermIndex(index) + 1}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {answerSubmitted && (
        <div className="correct-matches-display">
          <h4>Correct Matches:</h4>
          <ul>
            {processedTerms.map((term, index) => (
              <li
                key={index}
                className={correctMatches[index] === matches[index] ? 'correct' : 'incorrect'}
              >
                <strong>{term}</strong>: {processedDefinitions[correctMatches[index]]}
                {correctMatches[index] !== matches[index] && (
                  <span className="your-match">
                    Your match: {matches[index] !== null ? processedDefinitions[matches[index]] : 'None'}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// Financial Calculation Question component
export const CalculationQuestion = ({
  question,
  correctAnswer,
  options,
  hint,
  formula,
  onSelect,
  userInput,
  answerSubmitted,
  isCorrect,
  showHint,
  onToggleHint,
}) => {
  // Determine if options are provided
  const hasOptions = Array.isArray(options) && options.length > 0;

  return (
    <div className="question-container">
      <h3 className="question">{question}</h3>

      <div className="calculation-input-container">
        <input
          type="number"
          step="0.01"
          value={userInput !== null ? userInput : ''}
          onChange={(e) => onSelect(parseFloat(e.target.value))}
          className={`
            calculation-input 
            ${answerSubmitted && isCorrect ? 'correct-input' : ''}
            ${answerSubmitted && !isCorrect ? 'incorrect-input' : ''}
          `}
          disabled={answerSubmitted}
          placeholder="Enter your answer"
        />
      </div>

      {hasOptions && !answerSubmitted && (
        <div className="calculation-options">
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => onSelect(parseFloat(option.replace(/[^0-9.-]+/g, '')))}
              className={`
                calculation-option 
                ${userInput === parseFloat(option.replace(/[^0-9.-]+/g, '')) ? 'selected' : ''}
              `}
            >
              {option}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={onToggleHint}
        className="hint-button"
        disabled={answerSubmitted}
      >
        {showHint ? 'Hide Hint' : 'Show Hint'}
      </button>

      {showHint && (
        <div className="hint-container">
          <p>
            <strong>Hint:</strong> {hint}
          </p>
          {formula && (
            <div className="formula-display">
              <p>
                <strong>Formula:</strong> {formula}
              </p>
            </div>
          )}
        </div>
      )}

      {answerSubmitted && (
        <div className={`answer-feedback ${isCorrect ? 'correct-feedback' : 'incorrect-feedback'}`}>
          <p>
            {isCorrect
              ? 'Correct!'
              : `Incorrect. The correct answer is ${
                  hasOptions &&
                  Number.isInteger(correctAnswer) &&
                  correctAnswer >= 0 &&
                  correctAnswer < options.length
                    ? options[correctAnswer]
                    : correctAnswer
                }.`}
          </p>
        </div>
      )}
    </div>
  );
};
