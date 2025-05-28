import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Loader from './Loader';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [showLoader, setShowLoader] = useState(true);

  // For course selection and filtered results
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [filteredResults, setFilteredResults] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !user.id) {
        setShowLoader(false);
        return;
      }
      try {
        // 1. Get student's enrolled courses
        const coursesResponse = await api.students.getCourses(user.id);
        setCourses(coursesResponse.data || []);
        const courseIds = (coursesResponse.data || []).map(c => c.courseId || c.CourseId);

        // 2. Get all assessments
        const allAssessments = await api.assessments.getAll();
        // 3. Filter assessments for enrolled courses
        const filtered = (allAssessments.data || []).filter(a =>
          courseIds.includes(a.courseId || a.CourseId)
        );
        setAssessments(filtered);

        // 4. Get all published results for this student
        const resultsResponse = await api.results.getResultsForUser(user.id);
        setResults(resultsResponse.data || []);
      } catch (err) {
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setShowLoader(false);
      }
    };
    fetchData();
  }, [user]);

  // Filter results for selected course
  useEffect(() => {
    if (!selectedCourseId) {
      setFilteredResults([]);
      return;
    }
    // Find assessments for this course
    const assessmentIds = assessments
      .filter(a => (a.courseId || a.CourseId) === selectedCourseId)
      .map(a => a.assessmentId || a.AssessmentId);

    // Filter results for these assessments
    const filtered = results.filter(
      r => assessmentIds.includes(r.assessmentId || r.AssessmentId)
    );
    setFilteredResults(filtered);
  }, [selectedCourseId, assessments, results]);

  return (
    <div className="dashboard-bg min-vh-100 d-flex flex-column">
      {/* No navbar here! */}

      <div className="container py-4 flex-grow-1 d-flex flex-column">
        <div className="mb-4 text-center animate__animated animate__fadeInDown">
          <h2 className="fw-bold mb-1" style={{ color: '#4b2994' }}>
            👋 Welcome, {user && user.name ? user.name : 'User'}!
          </h2>
          <div className="text-muted fs-5">
            {"Here's your Student dashboard overview."}
          </div>
        </div>
        {showLoader ? (
          <div className="d-flex flex-column justify-content-center align-items-center flex-grow-1">
            <Loader />
            <p className="mt-3 fw-semibold text-primary fs-5">Loading your dashboard...</p>
          </div>
        ) : error ? (
          <div className="container mt-4 flex-grow-1">
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          </div>
        ) : (
          <>
            <div className="row justify-content-center g-4 mt-3">
              <div className="col-md-6 col-lg-4">
                <div className="card h-100 shadow-sm border-0 dashboard-card-hover" style={{ borderRadius: '15px', background: '#fff' }}>
                  <div className="card-body d-flex align-items-center">
                    <i className="fas fa-graduation-cap fa-2x text-primary me-2"></i>
                    <span className="fw-semibold">Courses Enrolled</span>
                    <span className="mx-2">=</span>
                    <span className="fw-bold fs-5 text-primary">{courses.length}</span>
                  </div>
                </div>
              </div>
              <div className="col-md-6 col-lg-4">
                <div className="card h-100 shadow-sm border-0 dashboard-card-hover" style={{ borderRadius: '15px', background: '#fff' }}>
                  <div className="card-body d-flex align-items-center">
                    <i className="fas fa-clipboard-list fa-2x text-success me-2"></i>
                    <span className="fw-semibold">Assessments</span>
                    <span className="mx-2">=</span>
                    <span className="fw-bold fs-5 text-success">{assessments.length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Course selection and results */}
            <div className="mt-5 text-center">
              <h4 className="fw-bold mb-3">Exam Results</h4>
              <div className="mb-3" style={{ maxWidth: 400, margin: '0 auto' }}>
                <select
                  className="form-select custom-select"
                  value={selectedCourseId}
                  onChange={e => setSelectedCourseId(e.target.value)}
                >
                  <option value="">-- Select a course to view results --</option>
                  {courses.map(c => (
                    <option key={c.courseId || c.CourseId} value={c.courseId || c.CourseId}>
                      {c.title || c.Title}
                    </option>
                  ))}
                </select>
              </div>
              {selectedCourseId && (
                filteredResults.length === 0 ? (
                  <div className="alert alert-warning" style={{ maxWidth: 500, margin: '0 auto' }}>
                    No published results for this course yet.
                  </div>
                ) : (
                  <div className="card results-card shadow-sm mx-auto" style={{ maxWidth: 500 }}>
                    <div className="card-body">
                      <ul className="list-group">
                        {filteredResults.map((result, idx) => (
                          <li key={idx} className="list-group-item d-flex justify-content-between align-items-center">
                            <span>{result.assessmentTitle || result.examName || result.assessmentName}</span>
                            <span className="fw-bold">{result.score ?? result.Score}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )
              )}
            </div>
          </>
        )}
      </div>
      <footer className="mt-auto py-3 w-100 bg-light">
        <div className="container text-center">
          <span className="text-muted">© {new Date().getFullYear()} EduSync by Yash Khandal</span>
        </div>
      </footer>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"
      />
      <style>{`
        .dashboard-bg {
          background: #f7f7fb;
        }
        .dashboard-card-hover {
          transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
        }
        .dashboard-card-hover:hover {
          transform: translateY(-5px);
          box-shadow: 0 1rem 3rem rgba(0,0,0,.175) !important;
        }
        .results-card {
          background: #181829;
          color: #fff;
          border-radius: 14px;
          box-shadow: 0 2px 24px rgba(0,0,0,0.07);
        }
        .results-card .list-group-item {
          background: transparent;
          color: #fff;
          border: none;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .results-card .list-group-item:last-child {
          border-bottom: none;
        }
        .form-select, .custom-select {
          border-radius: 8px;
          font-size: 1.08rem;
          background-color: #fff;
          border: 1.5px solid #d1d1e0;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .form-select:focus, .custom-select:focus {
          border-color: #7c3aed;
          box-shadow: 0 0 0 0.15rem rgba(124,58,237,0.13);
        }
        .mb-4.text-center h2 {
          color: #4b2994;
        }
        .card-body {
          font-size: 1.08rem;
        }
      `}</style>
    </div>
  );
};

export default StudentDashboard;
