import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const Assessment = () => {
  const { id } = useParams(); // assessmentId
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');

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

  if (loading) return <div>Loading...</div>;
  if (!assessment) return <div>Assessment not found.</div>;

  // Parse questions (assuming assessment.Questions is a JSON string)
  let questions = [];
  try {
    questions = JSON.parse(assessment.questions);
  } catch {
    questions = [];
  }

  const handleOptionChange = (qIdx, oIdx) => {
    setAnswers(prev => ({ ...prev, [qIdx]: oIdx }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Calculate score
    let score = 0;
    questions.forEach((q, idx) => {
      // Make sure each question object has a correctOption property/index
      if (answers[idx] === q.correctOption) score += 1;
    });
    const percentScore = Math.round((score / questions.length) * 100);

    try {
      // Send result to backend
      await api.results.createResult({
        assessmentId: assessment.assessmentId,
        userId: user.id,
        score: percentScore
      });
      setSuccessMsg('Thank you! Your answers have been submitted.');
      setSubmitted(true);
      // Optionally redirect after a short delay
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setSuccessMsg('Submission failed. Please try again.');
    }
  };

  return (
    <div className="container mt-4">
      <h2>{assessment.title}</h2>
      <form onSubmit={handleSubmit}>
        {questions.map((q, qIdx) => (
          <div key={qIdx} className="mb-4">
            <div className="fw-bold mb-2">{qIdx + 1}. {q.questionText}</div>
            {q.options.map((opt, oIdx) => (
              <div key={oIdx} className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name={`q${qIdx}`}
                  id={`q${qIdx}o${oIdx}`}
                  checked={answers[qIdx] === oIdx}
                  onChange={() => handleOptionChange(qIdx, oIdx)}
                  disabled={submitted}
                  required
                />
                <label className="form-check-label" htmlFor={`q${qIdx}o${oIdx}`}>{opt}</label>
              </div>
            ))}
          </div>
        ))}
        <button type="submit" className="btn btn-success" disabled={submitted}>
          {submitted ? "Submitted" : "Submit Assessment"}
        </button>
      </form>
      {successMsg && (
        <div className={`alert mt-3 ${submitted ? 'alert-success' : 'alert-danger'}`}>{successMsg}</div>
      )}
    </div>
  );
};

export default Assessment;
