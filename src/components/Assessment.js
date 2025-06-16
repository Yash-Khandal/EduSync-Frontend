import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './Assessment.css';

const MAX_WARNINGS = 2;

const Assessment = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [timeLeft, setTimeLeft] = useState(25);
  const [showWarning, setShowWarning] = useState(false);
  const [warningCount, setWarningCount] = useState(0);

  // Parse questions safely - MOVED UP TO AVOID REFERENCE ERROR
  let questions = [];
  if (assessment) {
    try {
      questions = JSON.parse(assessment.questions);
    } catch {
      questions = [];
    }
  }

  // Fetch assessment data
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

  // Submit handler - MOVED UP BEFORE handleAutoSubmit
  const handleSubmit = useCallback(async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (submitted) return;

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

      if (document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen();
      }

      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setSuccessMsg('Submission failed. Please try again.');
    }
  }, [submitted, answers, questions, assessment, user, navigate]);

  // Auto-submit handler - NOW PROPERLY REFERENCES handleSubmit
  const handleAutoSubmit = useCallback(() => {
    if (typeof answers[currentQuestion] === 'undefined') {
      setAnswers(prev => ({ ...prev, [currentQuestion]: -1 }));
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      handleSubmit({ preventDefault: () => {} });
    }
  }, [currentQuestion, answers, questions, handleSubmit]);

  // Timer logic
  useEffect(() => {
    if (!submitted && assessment && questions.length > 0) {
      setTimeLeft(25);
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
  }, [currentQuestion, submitted, assessment, questions.length, handleAutoSubmit]);

  // Security measures
  useEffect(() => {
    if (submitted) return;

    const preventBack = () => window.history.pushState(null, '', window.location.href);
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', preventBack);

    const preventUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'Are you sure you want to leave? Your progress will be lost.';
      return e.returnValue;
    };
    window.addEventListener('beforeunload', preventUnload);

    const preventCopy = (e) => e.preventDefault();
    const preventPaste = (e) => e.preventDefault();
    const preventCut = (e) => e.preventDefault();
    const preventRightClick = (e) => e.preventDefault();
    const preventKeyboardShortcuts = (e) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.key === 'u') ||
        (e.ctrlKey && e.key === 'U') ||
        (e.ctrlKey && e.shiftKey && e.key === 'C')
      ) {
        e.preventDefault();
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 3000);
      }
    };

    document.addEventListener('copy', preventCopy);
    document.addEventListener('paste', preventPaste);
    document.addEventListener('cut', preventCut);
    document.addEventListener('contextmenu', preventRightClick);
    document.addEventListener('keydown', preventKeyboardShortcuts);

    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }

    const handleCheatAttempt = () => {
      if (!submitted) {
        setWarningCount(prev => {
          if (prev + 1 > MAX_WARNINGS) {
            handleAutoSubmit();
            return prev + 1;
          } else {
            setShowWarning(true);
            setTimeout(() => setShowWarning(false), 3000);
            return prev + 1;
          }
        });
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) handleCheatAttempt();
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) handleCheatAttempt();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('popstate', preventBack);
      window.removeEventListener('beforeunload', preventUnload);
      document.removeEventListener('copy', preventCopy);
      document.removeEventListener('paste', preventPaste);
      document.removeEventListener('cut', preventCut);
      document.removeEventListener('contextmenu', preventRightClick);
      document.removeEventListener('keydown', preventKeyboardShortcuts);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);

      if (document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen();
      }
    };
  }, [submitted, handleAutoSubmit]);

  const formatTime = (seconds) => `${seconds}s`;

  if (loading) return <div>Loading...</div>;
  if (!assessment) return <div>Assessment not found.</div>;
  if (questions.length === 0) return <div>No questions found.</div>;

  const totalQuestions = questions.length;

  const handleOptionChange = (qIdx, oIdx) => {
    setAnswers(prev => ({ ...prev, [qIdx]: oIdx }));
  };

  const handleNext = () => {
    setCurrentQuestion(q => Math.min(totalQuestions - 1, q + 1));
  };

  const progress = ((currentQuestion + 1) / totalQuestions) * 100;

  return (
    <div className="assessment-bg">
      <div className="assessment-container">
        {showWarning && (
          <div className="alert alert-danger position-fixed" style={{ top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999 }}>
            <i className="fas fa-shield-alt me-2"></i>
            Security Alert: Unauthorized action detected! ({warningCount}/{MAX_WARNINGS} warnings)
          </div>
        )}
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

          <div className="d-flex justify-content-end align-items-center mt-4">
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
