import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';

const ProgressAnalysis = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [assessments, setAssessments] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(null);

  // For selecting student and assessment for chart
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('');

  // Fetch instructor's courses
  useEffect(() => {
    const fetchCourses = async () => {
      const res = await api.courses.getAll();
      setCourses(
        res.data.filter(
          c => (c.instructorId || c.InstructorId) === user.id
        )
      );
    };
    if (user && (user.role || '').toLowerCase() === 'instructor') fetchCourses();
  }, [user]);

  // Fetch assessments and results for selected course
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedCourseId) return;
      setLoading(true);
      const assessRes = await api.assessments.getAll();
      const courseAssessments = assessRes.data.filter(
        a => (a.courseId || a.CourseId) === selectedCourseId
      );
      setAssessments(courseAssessments);

      // Get all attempts for each assessment
      let allResults = [];
      for (const assessment of courseAssessments) {
        const assessmentId = assessment.assessmentId || assessment.AssessmentId;
        const resultRes = await api.results.getResultsForAssessment(assessmentId);
        allResults = allResults.concat(resultRes.data);
      }
      setResults(allResults);
      setLoading(false);
    };
    fetchData();
  }, [selectedCourseId, publishing]);

  // Build students list and results-by-student
  const students = {};
  results.forEach(r => {
    const userId = r.userId || r.UserId;
    const userName = r.userName || r.UserName;
    const userEmail = r.userEmail || r.UserEmail;
    const assessmentId = r.assessmentId || r.AssessmentId;
    if (!students[userId]) {
      students[userId] = {
        name: userName,
        email: userEmail,
        attempts: {}
      };
    }
    if (!students[userId].attempts[assessmentId]) {
      students[userId].attempts[assessmentId] = [];
    }
    students[userId].attempts[assessmentId].push(r);
  });

  // Prepare chart data for selected student and assessment
  let chartData = null;
  const attempts = (students[selectedStudentId]?.attempts[selectedAssessmentId]) || [];
  const scores = attempts.map(a => a.score ?? a.Score).filter(v => typeof v === 'number' && !isNaN(v));

  if (scores.length > 0) {
    chartData = {
      labels: attempts.map((_, idx) => `Attempt ${idx + 1}`),
      datasets: [
        {
          label: 'Score (%)',
          data: scores,
          backgroundColor: '#4caf50',
        },
      ],
    };
  }

  // Helper: get published status for an assessment
  const isAssessmentPublished = (assessmentId) => {
    return results.some(r =>
      (r.assessmentId || r.AssessmentId) === assessmentId && (r.published || r.Published)
    );
  };

  // Toggle publish/unpublish for an assessment
  const handleTogglePublish = async (assessmentId, currentPublished) => {
    setPublishing(assessmentId);
    try {
      if (currentPublished) {
        await api.results.unpublishResults(assessmentId);
        alert('Results unpublished!');
      } else {
        await api.results.publishResults(assessmentId);
        alert('Results published!');
      }
    } catch {
      alert('Failed to update publish status.');
    }
    setPublishing(null);
  };

  return (
    <div className="progress-dashboard-bg py-4">
      <div className="progress-card">
        <h2 className="mb-4 fw-bold text-center" style={{ color: '#4b2994' }}>Student Progress Analysis</h2>
        <div className="mb-4 row">
          <div className="col-md-4">
            <label htmlFor="course" className="form-label">Select Course</label>
            <select
              className="form-select progress-dropdown"
              id="course"
              value={selectedCourseId}
              onChange={e => {
                setSelectedCourseId(e.target.value);
                setSelectedStudentId('');
                setSelectedAssessmentId('');
              }}
            >
              <option value="">-- Choose a course --</option>
              {courses.map(course => (
                <option key={course.courseId || course.CourseId} value={course.courseId || course.CourseId}>
                  {course.title || course.Title}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-4">
            <label htmlFor="student" className="form-label">Select Student</label>
            <select
              className="form-select progress-dropdown"
              id="student"
              value={selectedStudentId}
              onChange={e => {
                setSelectedStudentId(e.target.value);
                setSelectedAssessmentId('');
              }}
              disabled={!selectedCourseId}
            >
              <option value="">-- Choose a student --</option>
              {Object.entries(students).map(([studentId, s]) => (
                <option key={studentId} value={studentId}>
                  {s.name} {s.email && `(${s.email})`}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-4">
            <label htmlFor="assessment" className="form-label">Select Assessment</label>
            <select
              className="form-select progress-dropdown"
              id="assessment"
              value={selectedAssessmentId}
              onChange={e => setSelectedAssessmentId(e.target.value)}
              disabled={!selectedStudentId}
            >
              <option value="">-- Choose an assessment --</option>
              {assessments.map(a => (
                <option key={a.assessmentId || a.AssessmentId} value={a.assessmentId || a.AssessmentId}>
                  {a.title || a.Title}
                </option>
              ))}
            </select>
          </div>
        </div>
        {selectedStudentId && selectedAssessmentId && (
          chartData ? (
            <div className="progress-bar-chart-card mb-4">
              <h5>Score per Attempt (Bar Chart)</h5>
              <Bar
                data={chartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: false },
                    title: { display: false }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                      title: { display: true, text: 'Score (%)' }
                    },
                    x: {
                      title: { display: true, text: 'Attempt' }
                    }
                  }
                }}
              />
            </div>
          ) : (
            <div className="mb-4 text-muted">
              No attempts or scores to display for this assessment.
            </div>
          )
        )}
        {loading ? (
          <div>Loading progress...</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered align-middle progress-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Email</th>
                  {assessments.map(a => (
                    <th key={a.assessmentId || a.AssessmentId}>
                      <div className="d-flex flex-column align-items-center">
                        <span>{a.title || a.Title}</span>
                        {/* Publish/unpublish toggle button */}
                        <button
                          className={`btn btn-sm mt-1 publish-btn ${isAssessmentPublished(a.assessmentId || a.AssessmentId) ? 'btn-success' : 'btn-outline-secondary'}`}
                          disabled={publishing === (a.assessmentId || a.AssessmentId)}
                          onClick={() =>
                            handleTogglePublish(
                              a.assessmentId || a.AssessmentId,
                              isAssessmentPublished(a.assessmentId || a.AssessmentId)
                            )
                          }
                        >
                          {publishing === (a.assessmentId || a.AssessmentId)
                            ? 'Updating...'
                            : isAssessmentPublished(a.assessmentId || a.AssessmentId)
                            ? 'Unpublish'
                            : 'Publish'}
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(students).length === 0 ? (
                  <tr>
                    <td colSpan={2 + assessments.length} className="text-center">
                      No progress data found for this course.
                    </td>
                  </tr>
                ) : (
                  Object.entries(students).map(([studentId, s]) => (
                    <tr key={studentId}>
                      <td>{s.name}</td>
                      <td>{s.email}</td>
                      {assessments.map(a => {
                        const assessmentId = a.assessmentId || a.AssessmentId;
                        const attempts = s.attempts[assessmentId] || [];
                        return (
                          <td key={assessmentId}>
                            {attempts.length === 0 ? (
                              <span className="text-muted">Not Attempted</span>
                            ) : (
                              <div>
                                {attempts.map((attempt, idx) => (
                                  <div key={attempt.resultId || attempt.ResultId || idx}>
                                    <span className={`badge bg-${(attempt.score ?? attempt.Score) >= 80 ? 'success' : (attempt.score ?? attempt.Score) >= 50 ? 'warning' : 'danger'} me-1`}>
                                      Attempt {idx + 1}: {(attempt.score ?? attempt.Score) ?? 0}%
                                    </span>
                                    {attempt.published || attempt.Published ? (
                                      <span className="badge bg-success">Published</span>
                                    ) : (
                                      <span className="badge bg-secondary">Not Published</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <style>{`
        .progress-dashboard-bg {
          background: #f7f7fb;
          min-height: 100vh;
          padding-bottom: 40px;
        }
        .progress-card {
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 2px 24px rgba(0,0,0,0.07);
          padding: 2rem 2.5rem;
          margin-bottom: 2rem;
          max-width: 900px;
          margin-left: auto;
          margin-right: auto;
        }
        .progress-dropdown {
          border-radius: 8px;
          font-size: 1.08rem;
          background-color: #fff;
          border: 1.5px solid #d1d1e0;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .progress-dropdown:focus {
          border-color: #7c3aed;
          box-shadow: 0 0 0 0.15rem rgba(124,58,237,0.13);
        }
        .progress-table th, .progress-table td {
          vertical-align: middle !important;
          text-align: center;
        }
        .progress-table thead th {
          background: #f3e7f3;
          color: #4b2994;
          font-weight: 600;
          font-size: 1.08rem;
        }
        .progress-table tbody tr:nth-child(even) {
          background: #fcfaff;
        }
        .publish-btn {
          min-width: 120px;
          border-radius: 6px;
          font-weight: 500;
          transition: background 0.2s, color 0.2s;
        }
        .publish-btn.btn-success {
          background: #4caf50;
          border: none;
          color: #fff;
        }
        .publish-btn.btn-outline-secondary {
          border: 1.5px solid #bdbdbd;
          color: #4b2994;
          background: #fff;
        }
        .publish-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .badge.bg-success {
          background: #4caf50 !important;
        }
        .badge.bg-secondary {
          background: #bdbdbd !important;
          color: #333 !important;
        }
        .progress-bar-chart-card {
          background: #181829;
          color: #fff;
          border-radius: 14px;
          box-shadow: 0 2px 24px rgba(0,0,0,0.07);
          padding: 1.5rem 1rem;
          margin-bottom: 2rem;
          max-width: 500px;
          margin-left: auto;
          margin-right: auto;
        }
      `}</style>
    </div>
  );
};

export default ProgressAnalysis;
