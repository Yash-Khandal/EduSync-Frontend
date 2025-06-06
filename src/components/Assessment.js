import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './Assessment.css';

const Assessment = () => {
  const { id } = useParams(); // assessmentId
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [timeLeft, setTimeLeft] = useState(10); // 10 seconds per question

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        const res = await api.assessments.getById(id);
        setAssessment(res.data);
      } catch (err) {
        setSuccessMsg('Failed to load assessment.');
      } finally {
        setLoading(false);
      }
    };
    fetchAssessment();
  }, [id]);

  // Timer logic - resets for each question
  useEffect(() => {
    if (!submitted && assessment) {
      setTimeLeft(10); // Reset timer to 10 seconds for new question
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [currentQuestion, submitted, assessment]);

  const handleAutoSubmit = () => {
    // Auto-select answer if none selected (mark as unanswered)
    if (typeof answers[currentQuestion] === 'undefined') {
      setAnswers(prev => ({ ...prev, [currentQuestion]: -1 }));
    }

    // Move to next question or submit assessment
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      handleSubmit({ preventDefault: () => {} }); // Simulate event object
    }
  };

  const formatTime = (seconds) => {
    return `${seconds}s`;
  };

  if (loading) return <div>Loading...</div>;
  if (!assessment) return <div>Assessment not found.</div>;

  let questions = [];
  try {
    questions = JSON.parse(assessment.questions);
  } catch {
    questions = [];
  }

  const totalQuestions = questions.length;

  const handleOptionChange = (qIdx, oIdx) => {
    setAnswers(prev => ({ ...prev, [qIdx]: oIdx }));
  };

  const handlePrevious = () => {
    setCurrentQuestion(q => Math.max(0, q - 1));
  };

  const handleNext = () => {
    setCurrentQuestion(q => Math.min(totalQuestions - 1, q + 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitted) return;

    // Calculate score (unanswered questions marked as -1 are wrong)
    let score = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correctOption) score += 1;
    });
    const percentScore = Math.round((score / questions.length) * 100);

    try {
      await api.results.createResult({
        assessmentId: assessment.assessmentId,
        userId: user.id,
        score: percentScore
      });
      setSuccessMsg('Thank you! Your answers have been submitted.');
      setSubmitted(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setSuccessMsg('Submission failed. Please try again.');
    }
  };

  // Progress bar width
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;

  return (
    <div className="assessment-bg">
      <div className="assessment-container">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="assessment-title">{assessment.title}</div>
          <div 
            className="timer" 
            style={{ 
              color: timeLeft <= 5 ? 'red' : timeLeft <= 10 ? 'orange' : 'inherit',
              fontWeight: 'bold',
              fontSize: '1.2rem',
              background: '#f8f9fa',
              padding: '8px 15px',
              borderRadius: '5px',
              border: '1px solid #dee2e6'
            }}
          >
            ⏰ {formatTime(timeLeft)}
          </div>
        </div>

        <div className="progress" style={{ height: '8px', marginBottom: '24px' }}>
          <div
            className="progress-bar"
            role="progressbar"
            style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #7c3aed 60%, #4b2994 100%)' }}
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="question-block">
            <div className="question-text">
              Question {currentQuestion + 1} of {totalQuestions}
            </div>
            <div className="fw-bold mb-2">{questions[currentQuestion].questionText}</div>
            {questions[currentQuestion].options.map((opt, oIdx) => (
              <div key={oIdx} className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name={`q${currentQuestion}`}
                  id={`q${currentQuestion}o${oIdx}`}
                  checked={answers[currentQuestion] === oIdx}
                  onChange={() => handleOptionChange(currentQuestion, oIdx)}
                  disabled={submitted}
                  required
                />
                <label className="form-check-label" htmlFor={`q${currentQuestion}o${oIdx}`}>
                  {opt}
                </label>
              </div>
            ))}
          </div>

          <div className="d-flex justify-content-between align-items-center mt-4">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={handlePrevious}
              disabled={currentQuestion === 0 || submitted}
            >
              &larr; Previous
            </button>
            
            {currentQuestion < totalQuestions - 1 ? (
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={handleNext}
                disabled={typeof answers[currentQuestion] === 'undefined' || submitted}
              >
                Next &rarr;
              </button>
            ) : (
              <button
                type="submit"
                className="btn btn-success"
                disabled={submitted || typeof answers[currentQuestion] === 'undefined'}
              >
                &#10003; Finish Quiz
              </button>
            )}
          </div>
        </form>

        {successMsg && (
          <div className={`alert mt-3 ${submitted ? 'alert-success' : 'alert-danger'}`}>
            {successMsg}
          </div>
        )}
      </div>
    </div>
  );
};

export default Assessment;
