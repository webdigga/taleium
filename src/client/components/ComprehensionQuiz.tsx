import { useState } from 'react';
import type { ComprehensionQuestion } from '../../worker/types';

interface ComprehensionQuizProps {
  questions: ComprehensionQuestion[];
}

export default function ComprehensionQuiz({ questions }: ComprehensionQuizProps) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  function handleSelect(questionIndex: number, optionIndex: number) {
    if (revealed[questionIndex]) return;
    setAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }));
    setRevealed((prev) => ({ ...prev, [questionIndex]: true }));
  }

  const answeredCount = Object.keys(revealed).length;
  const correctCount = Object.entries(revealed).filter(
    ([qi]) => answers[Number(qi)] === questions[Number(qi)].correctIndex
  ).length;

  return (
    <section className="quiz-section">
      <h2 className="quiz-heading">Test Your Understanding</h2>
      <div className="quiz-questions">
        {questions.map((q, qi) => (
          <div key={qi} className="quiz-question">
            <p className="quiz-question-text">
              <span className="quiz-question-number">{qi + 1}.</span> {q.question}
            </p>
            <div className="quiz-options">
              {q.options.map((option, oi) => {
                let optionClass = 'quiz-option';
                if (revealed[qi]) {
                  if (oi === q.correctIndex) optionClass += ' correct';
                  else if (oi === answers[qi]) optionClass += ' incorrect';
                }
                if (answers[qi] === oi && !revealed[qi]) optionClass += ' selected';

                return (
                  <button
                    key={oi}
                    className={optionClass}
                    onClick={() => handleSelect(qi, oi)}
                    disabled={revealed[qi]}
                  >
                    <span className="quiz-option-letter">
                      {String.fromCharCode(65 + oi)}
                    </span>
                    {option}
                  </button>
                );
              })}
            </div>
            {revealed[qi] && (
              <p className={`quiz-explanation ${answers[qi] === q.correctIndex ? 'correct' : 'incorrect'}`}>
                {answers[qi] === q.correctIndex ? 'Correct! ' : 'Not quite. '}
                {q.explanation}
              </p>
            )}
          </div>
        ))}
      </div>
      {answeredCount === questions.length && (
        <div className="quiz-score">
          You got <strong>{correctCount}</strong> out of <strong>{questions.length}</strong> correct
        </div>
      )}
    </section>
  );
}
