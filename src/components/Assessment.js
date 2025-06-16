import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './Assessment.css';

const MAX_WARNINGS = 2;

const Assessment = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [timeLeft, setTimeLeft] = useState(25);
  const [showWarning, setShowWarning] = useState(false);
  const [warningCount, setWarningCount] = useState(0);
  const [testStarted, setTestStarted] = useState(false);

  // Fetch assessment data
  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        const res = await api.assessments.getById(id);
        setAssessment(res.data);
        
        // Parse questions immediately
        let parsedQuestions = [];
        try {
          parsedQuestions = JSON.parse(res.data.questions);
        } catch (e) {
          console.error('Failed to parse questions:', e);
        }
        setQuestions(parsedQuestions);
      } catch (err) {
        console.error('Error fetching assessment:', err);
        setSuccessMsg('Failed to load assessment.');
      } finally {
        setLoading(false);
      }
    };
    fetchAssessment();
  }, [id]);

  // Timer logic - Fixed to actually count down
  useEffect(() => {
    if (!testStarted || submitted || questions.length === 0) return;

    // Reset timer for each question
    setTimeLeft(25);
    
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          // Auto submit when time runs out
          handleAutoSubmit();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestion, testStarted, submitted, questions.length]);

  // Auto submit function
  const handleAutoSubmit = () => {
    // Mark current question as unanswered if no answer selected
    if (typeof answers[currentQuestion] === 'undefined') {
      setAnswers(prev => ({ ...prev, [currentQuestion]: -1 }));
    }

    // Move to next question or submit
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      handleSubmit({ preventDefault: () => {} });
    }
  };

  // Security measures - Fixed fullscreen toggle issue
  useEffect(() => {
    if (!testStarted || submitted) return;

    let fullscreenRequested = false;

    // Request fullscreen only once
    const requestFullscreen = async () => {
      if (!fullscreenRequested && document.documentElement.requestFullscreen) {
        try {
          fullscreenRequested = true;
          await document.documentElement.requestFullscreen();
        } catch (err) {
          console.error('Fullscreen request failed:', err);
        }
      }
    };

    // Prevent various actions
    const preventBack = () => window.history.pushState(null, '', window.location.href);
    const preventUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'Are you sure you want to leave?';
      return e.returnValue;
    };
    const preventCopy = (e) => e.preventDefault();
    const preventRightClick = (e) => e.preventDefault();

    // Handle cheat attempts
    const handleCheatAttempt = () => {
      if (submitted) return;
      
      setWarningCount(prev => {
        const newCount = prev + 1;
        if (newCount > MAX_WARNINGS) {
          handleAutoSubmit();
        } else {
          setShowWarning(true);
          setTimeout(() => setShowWarning(false), 3000);
        }
        return newCount;
      });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) handleCheatAttempt();
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && testStarted && !submitted) {
        handleCheatAttempt();
      }
    };

    // Setup event listeners
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', preventBack);
    window.addEventListener('beforeunload', preventUnload);
    document.addEventListener('copy', preventCopy);
    document.addEventListener('paste', preventCopy);
    document.addEventListener('cut', preventCopy);
    document.addEventListener('contextmenu', preventRightClick);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // Request fullscreen
    requestFullscreen();

    return () => {
      window.removeEventListener('popstate', preventBack);
      window.removeEventListener('beforeunload', preventUnload);
      document.removeEventListener('copy', preventCopy);
      document.removeEventListener('paste', preventCopy);
      document.removeEventListener('cut', preventCopy);
      document.removeEventListener('contextmenu', preventRightClick);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [testStarted, submitted]);

  // Start test function
  const handleStartTest = () => {
    setTestStarted(true);
    setTimeLeft(25);
  };

  // Handle option selection - Fixed to work properly
  const handleOptionChange = (qIdx, oIdx) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qIdx]: oIdx }));
  };

  // Handle next question
  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  // Handle submit
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (submitted) return;

    try {
      let score = 0;
      questions.forEach((q, idx) => {
        if (answers[idx] === q.correctOption) score += 1;
      });
      const percentScore = Math.round((score / questions.length) * 100);

      await api.results.createResult({
        assessmentId: assessment.assessmentId,
        userId: user.id,
        score: percentScore
      });

      setSuccessMsg('Thank you! Your answers have been submitted.');
      setSubmitted(true);

      // Exit fullscreen
      if (document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen();
      }

      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      console.error('Submission error:', err);
      setSuccessMsg('Submission failed. Please try again.');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (!assessment || questions.length === 0) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          <h4>Assessment Error</h4>
          <p>{successMsg || 'Assessment not found or has no questions.'}</p>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Pre-test instructions
  if (!testStarted) {
    return (
      <div className="container mt-4">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card shadow-lg">
              <div className="card-body p-5">
                <h2 className="text-center mb-4">{assessment.title}</h2>
                <div className="alert alert-info">
                  <h5>Instructions:</h5>
                  <ul>
                    <li>You have <strong>25 seconds</strong> per question</li>
                    <li>You cannot go back to previous questions</li>
                    <li>The test will run in fullscreen mode</li>
                    <li>Switching tabs or exiting fullscreen will give warnings</li>
                    <li>After 2 warnings, your test will be auto-submitted</li>
                  </ul>
                </div>
                <div className="text-center">
                  <p><strong>Total Questions: {questions.length}</strong></p>
                  <button 
                    className="btn btn-success btn-lg"
                    onClick={handleStartTest}
                  >
                    Start Test
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main test interface
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const currentQ = questions[currentQuestion];

  return (
    <div className="assessment-bg">
      <div className="assessment-container">
        {/* Security Warning */}
        {showWarning && (
          <div className="alert alert-danger position-fixed" style={{ 
            top: '20px', 
            left: '50%', 
            transform: 'translateX(-50%)', 
            zIndex: 9999 
          }}>
            Security Alert: Unauthorized action detected! ({warningCount}/{MAX_WARNINGS} warnings)
          </div>
        )}

        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="assessment-title">{assessment.title}</div>
          <div 
            className="timer" 
            style={{ 
              color: timeLeft <= 5 ? 'red' : timeLeft <= 10 ? 'orange' : 'green',
              fontWeight: 'bold',
              fontSize: '1.2rem',
              background: '#f8f9fa',
              padding: '8px 15px',
              borderRadius: '5px',
              border: '1px solid #dee2e6'
            }}
          >
            ⏰ {timeLeft}s
          </div>
        </div>

        {/* Progress Bar */}
        <div className="progress" style={{ height: '8px', marginBottom: '24px' }}>
          <div
            className="progress-bar"
            style={{ 
              width: `${progress}%`, 
              background: 'linear-gradient(90deg, #7c3aed 60%, #4b2994 100%)' 
            }}
          />
        </div>

        {/* Question */}
        <div className="question-block">
          <div className="question-text">
            Question {currentQuestion + 1} of {questions.length}
          </div>
          <div className="fw-bold mb-3">{currentQ.questionText}</div>
          
          {currentQ.options.map((opt, oIdx) => (
            <div key={oIdx} className="form-check mb-2">
              <input
                className="form-check-input"
                type="radio"
                name={`q${currentQuestion}`}
                id={`q${currentQuestion}o${oIdx}`}
                checked={answers[currentQuestion] === oIdx}
                onChange={() => handleOptionChange(currentQuestion, oIdx)}
                disabled={submitted}
              />
              <label 
                className="form-check-label" 
                htmlFor={`q${currentQuestion}o${oIdx}`}
                style={{ cursor: 'pointer' }}
              >
                {opt}
              </label>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="d-flex justify-content-end mt-4">
          {currentQuestion < questions.length - 1 ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleNext}
              disabled={typeof answers[currentQuestion] === 'undefined' || submitted}
            >
              Next →
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-success"
              onClick={handleSubmit}
              disabled={submitted || typeof answers[currentQuestion] === 'undefined'}
            >
              ✓ Finish Test
            </button>
          )}
        </div>

        {/* Success Message */}
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
