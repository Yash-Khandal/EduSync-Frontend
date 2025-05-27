import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';

const CustomLoader = () => (
  <>
    <div className="loader mx-auto my-5"></div>
    <style>{`
      .loader {
        width: 45px;
        aspect-ratio: 1;
        --c:no-repeat linear-gradient(#0d6efd 0 0);
        background: var(--c), var(--c), var(--c), var(--c), var(--c), var(--c);
        animation: 
          l14-1 .5s infinite alternate,
          l14-2  2s infinite;
        margin: 32px auto;
        display: block;
      }
      @keyframes l14-1 {
        0%,10% {background-size:20% 100%}
        100%   {background-size:20% 20%}
      }
      @keyframes l14-2 {
        0%,49.9% {background-position: 0 0,0 100%,50% 50%,50% 50%,100% 0,100% 100%}
        50%,100% {background-position: 0 50%,0 50%,50% 0,50% 100%,100% 50%,100% 50% }
      }
    `}</style>
  </>
);

const AssessmentForm = ({ initialData, onComplete, isEdit }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    courseId: '',
  });

  const [courses, setCourses] = useState([]);
  const [questions, setQuestions] = useState([
    { questionText: '', options: ['', '', '', ''], correctOption: 0 },
  ]);
  const [loading, setLoading] = useState(false);

  // Fetch instructor's courses (case-insensitive role and field)
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.courses.getAll();
        setCourses(res.data.filter(
          c => (c.instructorId || c.InstructorId) === user.id
        ));
      } catch {
        setCourses([]);
      }
    };
    if (user && (user.role || '').toLowerCase() === 'instructor') fetchCourses();
  }, [user]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        description: initialData.description,
        courseId: initialData.courseId,
      });
      try {
        setQuestions(JSON.parse(initialData.questions));
      } catch {
        setQuestions([{ questionText: '', options: ['', '', '', ''], correctOption: 0 }]);
      }
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleQuestionChange = (qIdx, field, value) => {
    const updated = [...questions];
    updated[qIdx][field] = value;
    setQuestions(updated);
  };

  const handleOptionChange = (qIdx, optIdx, value) => {
    const updated = [...questions];
    updated[qIdx].options[optIdx] = value;
    setQuestions(updated);
  };

  const handleCorrectOptionChange = (qIdx, value) => {
    const updated = [...questions];
    updated[qIdx].correctOption = parseInt(value, 10);
    setQuestions(updated);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { questionText: '', options: ['', '', '', ''], correctOption: 0 },
    ]);
  };

  const removeQuestion = (idx) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (!formData.title || !formData.description || !formData.courseId) {
      alert('Please fill in all required fields.');
      setLoading(false);
      return;
    }
    for (let q of questions) {
      if (
        !q.questionText ||
        q.options.some((opt) => !opt) ||
        q.correctOption === undefined
      ) {
        alert('Please complete all questions and options.');
        setLoading(false);
        return;
      }
    }
    try {
      const payload = {
        ...formData,
        questions: JSON.stringify(questions),
        maxScore: 100,
      };
      let response;
      if (isEdit && initialData && initialData.assessmentId) {
        response = await api.assessments.update(initialData.assessmentId, payload);
      } else {
        response = await api.assessments.create(payload);
      }
      if (
        response.status === 200 ||
        response.status === 201 ||
        response.status === 204
      ) {
        alert(isEdit ? 'Assessment updated successfully!' : 'Assessment created successfully!');
        if (onComplete) onComplete();
        else navigate('/dashboard');
      } else {
        alert('Failed to save assessment.');
      }
    } catch (error) {
      console.error('Error saving assessment:', error);
      alert('Failed to save assessment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user || (user.role || '').toLowerCase() !== 'instructor') {
    return (
      <div className="alert alert-danger mt-4">
        You do not have permission to create assessments.
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="mx-auto" style={{ maxWidth: 720 }}>
        <div className="mb-4 text-center">
          <h2 className="fw-bold mb-2">
            <i className="fas fa-clipboard-list text-primary me-2"></i>
            {isEdit ? 'Edit Assessment' : 'Create New Assessment'}
          </h2>
          <p className="text-muted">Build interactive quizzes for your course with ease.</p>
        </div>
        <div className="bg-white rounded shadow p-4">
          {loading ? (
            <CustomLoader />
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="row mb-3">
                <div className="col-md-6 mb-3 mb-md-0">
                  <label htmlFor="title" className="form-label fw-semibold">Title</label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. HTML Basics Quiz"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="courseId" className="form-label fw-semibold">
                    <i className="fas fa-book-open text-primary me-2"></i>
                    Course
                  </label>
                  <select
                    className="form-select form-select-lg shadow-sm"
                    id="courseId"
                    name="courseId"
                    value={formData.courseId}
                    onChange={handleChange}
                    required
                    style={{
                      borderRadius: 14,
                      fontWeight: 500,
                      background: "#f8f9fa",
                      minHeight: 48,
                      fontSize: "1.1rem"
                    }}
                  >
                    <option value="">-- Select a course --</option>
                    {courses.length === 0 ? (
                      <option disabled>No courses found. Create a course first.</option>
                    ) : (
                      courses.map(c => (
                        <option key={c.courseId || c.CourseId} value={c.courseId || c.CourseId}>
                          {c.title || c.Title}
                        </option>
                      ))
                    )}
                  </select>
                  <style>
                    {`
                      .form-select:focus {
                        border-color: #86b7fe;
                        box-shadow: 0 0 0 0.15rem rgba(13,110,253,.25);
                        background: #eaf1fb;
                      }
                    `}
                  </style>
                </div>
              </div>
              <div className="mb-3">
                <label htmlFor="description" className="form-label fw-semibold">Description</label>
                <textarea
                  className="form-control"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Describe this assessment..."
                  required
                ></textarea>
              </div>
              <hr className="my-4" />
              <h5 className="mb-3">
                <i className="fas fa-question-circle text-info me-2"></i>
                Questions
              </h5>
              {questions.map((q, qIdx) => (
                <div key={qIdx} className="mb-4 card shadow-sm border-0">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-semibold text-primary">
                        <i className="fas fa-hashtag me-1"></i>
                        Question {qIdx + 1}
                      </span>
                      {questions.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => removeQuestion(qIdx)}
                        >
                          <i className="fas fa-trash-alt"></i> Remove
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      className="form-control mb-3"
                      placeholder="Question text"
                      value={q.questionText}
                      onChange={(e) =>
                        handleQuestionChange(qIdx, 'questionText', e.target.value)
                      }
                      required
                    />
                    <div className="row">
                      {q.options.map((opt, optIdx) => (
                        <div className="col-12 col-md-6 mb-2" key={optIdx}>
                          <div className="input-group">
                            <span className="input-group-text bg-light">
                              <input
                                type="radio"
                                name={`correctOption${qIdx}`}
                                checked={q.correctOption === optIdx}
                                onChange={() =>
                                  handleCorrectOptionChange(qIdx, optIdx)
                                }
                                required
                              />
                            </span>
                            <input
                              type="text"
                              className="form-control"
                              placeholder={`Option ${optIdx + 1}`}
                              value={opt}
                              onChange={(e) =>
                                handleOptionChange(qIdx, optIdx, e.target.value)
                              }
                              required
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              <div className="d-flex justify-content-between align-items-center mb-4">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={addQuestion}
                >
                  <i className="fas fa-plus-circle me-1"></i>
                  Add Question
                </button>
                <span className="text-muted small">
                  <i className="fas fa-info-circle me-1"></i>
                  Select the correct option for each question.
                </span>
              </div>
              <button type="submit" className="btn btn-primary btn-lg w-100">
                {isEdit ? 'Update Assessment' : 'Create Assessment'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssessmentForm;
