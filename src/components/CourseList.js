import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Loader from './Loader';

// Helper to check if mediaUrl is a file (pdf/csv/etc.)
function isFileUrl(url) {
  return /\.(pdf|csv|docx?|xlsx?|pptx?|txt)$/i.test(url);
}

const CourseList = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStudents, setShowStudents] = useState(null);
  const [students, setStudents] = useState([]);
  const navigate = useNavigate();

  // Carousel drag state
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const carouselRef = useRef(null);

  useEffect(() => {
    let timeoutId;
    const fetchCourses = async () => {
      try {
        const response = await api.courses.getAll();
        setCourses(response.data || []);
        if (user && (user.role || '').toLowerCase() === 'student') {
          const enrolledRes = await api.enrollments.getStudentCourses(user.id);
          setEnrolledCourses(enrolledRes.data || []);
        }
      } finally {
        timeoutId = setTimeout(() => setLoading(false), 3000);
      }
    };
    fetchCourses();
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line
  }, [user && user.role, user && user.id]);

  const handleDelete = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      await api.courses.delete(courseId);
      setCourses(courses.filter(c => (c.courseId || c.id) !== courseId));
      alert('Course deleted.');
    } catch {
      alert('Failed to delete course.');
    }
  };

  const handleViewStudents = async (courseId) => {
    setShowStudents(courseId);
    setStudents([]);
    try {
      const response = await api.enrollments.getCourseStudents(courseId);
      setStudents(response.data || []);
    } catch {
      setStudents([]);
    }
  };

  const handleCloseStudents = () => {
    setShowStudents(null);
    setStudents([]);
  };

  // Carousel mouse events
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
  };
  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    carouselRef.current.scrollLeft = scrollLeft - walk;
  };

  const isEnrolled = (courseId) => {
    return enrolledCourses.some(
      course => course.CourseId === courseId || course.courseId === courseId
    );
  };

  // Smart download for files (forces download even if server sends inline)
  const handleDownload = async (url, fileName) => {
    try {
      const response = await fetch(url, { method: 'GET' });
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName || 'file';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      alert('Failed to download file.');
    }
  };

  if (loading) return <Loader />;

  // Instructor view
  if (user && (user.role || '').toLowerCase() === 'instructor') {
    const instructorCourses = courses.filter(course => course.instructorId === user.id);
    return (
      <div className="container mt-4 d-flex flex-column align-items-center">
        <div className="d-flex justify-content-between align-items-center mb-4 w-100" style={{maxWidth: 1100}}>
          <h2 className="mb-0">My Courses</h2>
          <button className="btn btn-primary" onClick={() => navigate('/courses/new')}>
            <i className="fas fa-plus me-2"></i>
            Add New Course
          </button>
        </div>
        <div
          className="carousel-container"
          ref={carouselRef}
          style={{
            display: 'flex',
            overflowX: 'auto',
            gap: '2rem',
            cursor: isDragging ? 'grabbing' : 'grab',
            paddingBottom: '1rem',
            userSelect: 'none',
            width: '100%',
            maxWidth: 1100,
            margin: '0 auto'
          }}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          {instructorCourses.length === 0 ? (
            <div className="text-muted" style={{margin: '2rem auto'}}>No courses found.</div>
          ) : (
            instructorCourses.map(course => (
              <div
                key={course.courseId || course.id}
                className="card h-100"
                style={{
                  minWidth: 270,
                  maxWidth: 320,
                  flex: '0 0 auto',
                  margin: '0 0.5rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.07)'
                }}
              >
                <div className="card-body">
                  <h5 className="card-title">{course.title}</h5>
                  <p className="card-text">{course.description}</p>
                  <div className="d-flex mb-2" style={{ gap: "0.5rem" }}>
                    <button
                      className="custom-btn"
                      style={{
                        border: '1.5px solid #e63946',
                        color: '#fff',
                        background: '#e63946',
                        borderRadius: '4px',
                        fontWeight: 500,
                        fontSize: '1rem',
                        padding: '0.4rem 1.2rem',
                        transition: 'all 0.2s',
                      }}
                      onClick={() => handleDelete(course.courseId || course.id)}
                    >
                      Delete
                    </button>
                  </div>
                  <button
                    className="custom-btn"
                    style={{
                      display: 'block',
                      width: '100%',
                      marginTop: '0.5rem',
                      border: '1.5px solid #3b2fd1',
                      color: '#fff',
                      background: '#3b2fd1',
                      borderRadius: '4px',
                      fontWeight: 500,
                      fontSize: '1rem',
                      padding: '0.4rem 1.2rem',
                      transition: 'all 0.2s',
                    }}
                    onClick={() => handleViewStudents(course.courseId || course.id)}
                  >
                    View Students
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        {showStudents && (
          <div className="modal d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.4)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Enrolled Students</h5>
                  <button type="button" className="btn-close" onClick={handleCloseStudents}></button>
                </div>
                <div className="modal-body">
                  {students.length === 0 ? (
                    <div className="text-muted">No students enrolled yet.</div>
                  ) : (
                    <ul className="list-group">
                      {students.map(s => (
                        <li key={s.userId || s.UserId} className="list-group-item">
                          {s.name || s.Name} ({s.email || s.Email})
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={handleCloseStudents}>Close</button>
                </div>
              </div>
            </div>
          </div>
        )}
        <style>{`
          .carousel-container::-webkit-scrollbar {
            height: 8px;
          }
          .carousel-container::-webkit-scrollbar-thumb {
            background: #e0e0e0;
            border-radius: 4px;
          }
        `}</style>
      </div>
    );
  }

  // Student view
  if (user && (user.role || '').toLowerCase() === 'student') {
    return (
      <div className="container mt-4">
        <h2>Available Courses</h2>
        <div className="row">
          {courses.length === 0 ? (
            <div className="text-muted">No courses available.</div>
          ) : (
            courses.map(course => {
              const enrolled = isEnrolled(course.courseId || course.id);
              const mediaUrl = course.mediaUrl;
              return (
                <div key={course.courseId || course.id} className="col-md-6 col-lg-4 mb-4">
                  <div className="card h-100">
                    <div className="card-body">
                      <h5 className="card-title">{course.title}</h5>
                      <p className="card-text">Instructor: {course.instructorName}</p>
                      {mediaUrl && (
                        <div className="d-flex gap-2 mb-2">
                          {isFileUrl(mediaUrl) ? (
                            <button
                              className="btn btn-outline-success flex-fill"
                              onClick={() => {
                                fetch(mediaUrl)
                                  .then(res => res.blob())
                                  .then(blob => {
                                    const url = window.URL.createObjectURL(blob);
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.download = mediaUrl.split('/').pop() || 'file';
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    window.URL.revokeObjectURL(url);
                                  });
                              }}
                            >
                              <i className="fas fa-download me-2"></i>
                              Download
                            </button>
                          ) : (
                            <a
                              href={mediaUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-outline-info flex-fill"
                            >
                              <i className="fas fa-eye me-2"></i>
                              View Online
                            </a>
                          )}
                        </div>
                      )}
                      {enrolled ? (
                        <Link
                          to={`/courses/${course.courseId || course.id}/learn`}
                          className="btn btn-success w-100"
                        >
                          Continue Learning
                        </Link>
                      ) : (
                        <button
                          className="btn btn-primary w-100"
                          onClick={async () => {
                            try {
                              await api.enrollments.enroll(course.courseId || course.id, user.id);
                              setEnrolledCourses([...enrolledCourses, course]);
                              alert('Successfully enrolled!');
                            } catch {
                              alert('Failed to enroll.');
                            }
                          }}
                        >
                          Enroll Now
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // Fallback for users with no role or not logged in
  return <div className="container mt-4 text-center text-muted">No courses to display.</div>;
};

export default CourseList;
