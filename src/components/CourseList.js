import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Loader from './Loader';

// Helper to check if URL is a downloadable file
function isFileUrl(url) {
  return /\.(pdf|csv|docx?|xlsx?|pptx?|txt)$/i.test(url);
}

// Helper to check if URL is an online learning link
function isOnlineLearningUrl(url) {
  return /youtube\.com|youtu\.be|geeksforgeeks\.org|coursera\.org|udemy\.com|khanacademy\.org/i.test(url);
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
  }, [user]);

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

  const handleEdit = (courseId) => {
    navigate(`/courses/edit/${courseId}`);
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

  // Smart download handler for files
  const handleDownload = async (url, fileName) => {
    try {
      const response = await fetch(url, { method: 'GET' });
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName || 'course-material';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      alert('Failed to download file.');
    }
  };

  if (loading) return <Loader />;

  // Instructor view with Edit button added
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
                  
                  {/* Action Buttons */}
                  <div className="d-grid gap-2">
                    {/* Edit Button */}
                    <button
                      className="btn btn-outline-warning"
                      onClick={() => handleEdit(course.courseId || course.id)}
                      style={{
                        fontWeight: 500,
                        transition: 'all 0.2s',
                      }}
                    >
                      <i className="fas fa-edit me-2"></i>
                      Edit Course
                    </button>
                    
                    {/* Delete Button */}
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDelete(course.courseId || course.id)}
                      style={{
                        fontWeight: 500,
                        transition: 'all 0.2s',
                      }}
                    >
                      <i className="fas fa-trash me-2"></i>
                      Delete
                    </button>
                    
                    {/* View Students Button */}
                    <button
                      className="btn btn-primary"
                      onClick={() => handleViewStudents(course.courseId || course.id)}
                      style={{
                        fontWeight: 500,
                        transition: 'all 0.2s',
                      }}
                    >
                      <i className="fas fa-users me-2"></i>
                      View Students
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Students Modal */}
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
          .btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          }
        `}</style>
      </div>
    );
  }

  // Student view (unchanged)
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
              const mediaFile = course.mediaFile;

              const hasOnlineLink = mediaUrl && isOnlineLearningUrl(mediaUrl);
              const hasPdfFile = (mediaUrl && isFileUrl(mediaUrl)) || mediaFile;

              return (
                <div key={course.courseId || course.id} className="col-md-6 col-lg-4 mb-4">
                  <div className="card h-100">
                    <div className="card-body">
                      <h5 className="card-title">{course.title}</h5>
                      <p className="card-text">{course.description}</p>
                      <p className="card-text">
                        <small className="text-muted">Instructor: {course.instructorName}</small>
                      </p>

                      {/* Learning Options Section */}
                      {(hasOnlineLink || hasPdfFile) && (
                        <div className="mb-3">
                          <h6 className="text-primary">📚 Learning Materials:</h6>
                          <div className="d-grid gap-2">
                            
                            {/* Online Learning Link */}
                            {hasOnlineLink && (
                              <a
                                href={mediaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-outline-info btn-sm"
                              >
                                <i className="fas fa-globe me-2"></i>
                                Learn Online (YouTube/GFG)
                              </a>
                            )}

                            {/* PDF/File Download */}
                            {hasPdfFile && (
                              <button
                                className="btn btn-outline-success btn-sm"
                                onClick={() => handleDownload(
                                  mediaFile || mediaUrl, 
                                  `${course.title}-materials.pdf`
                                )}
                              >
                                <i className="fas fa-download me-2"></i>
                                Download PDF/Materials
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Enrollment/Continue Learning Button */}
                      {enrolled ? (
                        <Link
                          to={`/courses/${course.courseId || course.id}/learn`}
                          className="btn btn-success w-100"
                        >
                          <i className="fas fa-play me-2"></i>
                          Continue Learning
                        </Link>
                      ) : (
                        <button
                          className="btn btn-primary w-100"
                          onClick={async () => {
                            try {
                              await api.enrollments.enroll(course.courseId || course.id, user.id);
                              setEnrolledCourses([...enrolledCourses, course]);
                              alert('Successfully enrolled! You can now access learning materials.');
                            } catch {
                              alert('Failed to enroll. Please try again.');
                            }
                          }}
                        >
                          <i className="fas fa-user-plus me-2"></i>
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
