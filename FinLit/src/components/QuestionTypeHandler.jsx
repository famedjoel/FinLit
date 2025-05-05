/* eslint-disable no-unused-vars */
// src/components/QuestionTypeHandler.jsx
import React, { useState } from 'react';
import {
  MultipleChoiceQuestion,
  TrueFalseQuestion,
  FillInBlankQuestion,
  MatchingQuestion,
  CalculationQuestion,
} from './QuestionTypes.jsx';
import '../styles/QuestionTypes.css';

const QuestionTypeHandler = ({
  currentQuestion,
  onAnswerSelect,
  selectedAnswer,
  answerSubmitted,
  answerIsCorrect,
}) => {
  const [showHint, setShowHint] = useState(false);

  // Determine if the fill-in-blank or calculation answer is correct
  const isTextAnswerCorrect = () => {
    if (currentQuestion.type === 'fill-blank') {
      // Case insensitive comparison for fill-in-blank
      return selectedAnswer?.toLowerCase() === currentQuestion.correctAnswer.toLowerCase();
    } else if (currentQuestion.type === 'calculation') {
      // For calculations, allow a small margin of error (0.01)
      const tolerance = 0.01;
      return Math.abs(selectedAnswer - currentQuestion.correctAnswer) <= tolerance;
    }
    return false;
  };

  // Render different question types
  switch (currentQuestion.type) {
    case 'multiple-choice':
      return (
        <MultipleChoiceQuestion
          question={currentQuestion.question}
          options={currentQuestion.options}
          correctAnswer={currentQuestion.correctAnswer}
          onSelect={onAnswerSelect}
          selectedAnswer={selectedAnswer}
          answerSubmitted={answerSubmitted}
        />
      );

    case 'true-false':
      return (
        <TrueFalseQuestion
          question={currentQuestion.question}
          correctAnswer={currentQuestion.correctAnswer}
          onSelect={onAnswerSelect}
          selectedAnswer={selectedAnswer}
          answerSubmitted={answerSubmitted}
        />
      );

    case 'fill-blank':
      return (
        <FillInBlankQuestion
          question={currentQuestion.question}
          correctAnswer={currentQuestion.correctAnswer}
          onSelect={onAnswerSelect}
          userInput={selectedAnswer}
          answerSubmitted={answerSubmitted}
          isCorrect={answerSubmitted && isTextAnswerCorrect()}
        />
      );

    case 'matching':
      return (
        <MatchingQuestion
          question={currentQuestion.question}
          terms={currentQuestion.terms}
          definitions={currentQuestion.definitions}
          correctMatches={currentQuestion.correctMatches}
          onSelect={onAnswerSelect}
          userMatches={selectedAnswer || Array(currentQuestion.terms.length).fill(null)}
          answerSubmitted={answerSubmitted}
        />
      );

    case 'calculation':
      return (
        <CalculationQuestion
          question={currentQuestion.question}
          correctAnswer={currentQuestion.correctAnswer}
          hint={currentQuestion.hint}
          formula={currentQuestion.formula}
          onSelect={onAnswerSelect}
          userInput={selectedAnswer}
          answerSubmitted={answerSubmitted}
          isCorrect={answerSubmitted && isTextAnswerCorrect()}
          showHint={showHint}
          onToggleHint={() => setShowHint(!showHint)}
        />
      );

    default:
      // Fallback to multiple choice
      return (
        <MultipleChoiceQuestion
          question={currentQuestion.question}
          options={currentQuestion.options}
          correctAnswer={currentQuestion.correctAnswer}
          onSelect={onAnswerSelect}
          selectedAnswer={selectedAnswer}
          answerSubmitted={answerSubmitted}
        />
      );
  }
};

export default QuestionTypeHandler;
