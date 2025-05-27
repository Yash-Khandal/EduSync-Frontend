import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Loader from './Loader';

const InstructorDashboard = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [error, setError] = useState('');
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !user.id) {
        setShowLoader(false);
        return;
      }
      try {
        // Fetch all courses created by this instructor
        const coursesResponse = await api.courses.getAll();
        const instructorCourses = (coursesResponse.data || []).filter(
          course => (course.instructorId || course.InstructorId) === user.id
        );
        setCourses(instructorCourses);

        // Fetch all assessments created by this instructor
        const assessmentsResponse = await api.assessments.getAll();
        const instructorAssessments = (assessmentsResponse.data || []).filter(
          assessment => (assessment.instructorId || assessment.InstructorId) === user.id
        );
        setAssessments(instructorAssessments);
      } catch (err) {
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setShowLoader(false);
      }
    };
    fetchData();
  }, [user]);

  return (
    <div className="container py-4 flex-grow-1 d-flex flex-column">
      <div className="mb-4 text-center animate__animated animate__fadeInDown">
        <h2 className="fw-bold mb-1">
          👋 Welcome, {user && user.name ? user.name : 'Instructor'}!
        </h2>
        <div className="text-muted fs-5">
          {"Here's your Instructor dashboard overview."}
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
        <div className="row justify-content-center g-4 mt-3">
          <div className="col-md-6 col-lg-4">
            <div className="card h-100 shadow-sm border-0 dashboard-card-hover" style={{ borderRadius: '15px' }}>
              <div className="card-body d-flex align-items-center">
                <i className="fas fa-chalkboard-teacher fa-2x text-primary me-2"></i>
                <span className="fw-semibold">Courses Created</span>
                <span className="mx-2">=</span>
                <span className="fw-bold fs-5 text-primary">{courses.length}</span>
              </div>
            </div>
          </div>
          <div className="col-md-6 col-lg-4">
            <div className="card h-100 shadow-sm border-0 dashboard-card-hover" style={{ borderRadius: '15px' }}>
              <div className="card-body d-flex align-items-center">
                <i className="fas fa-clipboard-list fa-2x text-success me-2"></i>
                <span className="fw-semibold">Assessments</span>
                <span className="mx-2">=</span>
                <span className="fw-bold fs-5 text-success">{assessments.length}</span>
              </div>
            </div>
          </div>
        </div>
      )}
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
        .dashboard-card-hover {
          transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
        }
        .dashboard-card-hover:hover {
          transform: translateY(-5px);
          box-shadow: 0 1rem 3rem rgba(0,0,0,.175) !important;
        }
      `}</style>
    </div>
  );
};

export default InstructorDashboard;
