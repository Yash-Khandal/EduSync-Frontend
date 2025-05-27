import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const CourseLearn = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourseAndAssessments = async () => {
      try {
        const courseRes = await api.courses.getById(courseId);
        setCourse(courseRes.data);
        const assessRes = await api.assessments.getAll();
        setAssessments(assessRes.data.filter(a => a.courseId === courseId));
      } catch (err) {
        // handle error
      } finally {
        setLoading(false);
      }
    };
    fetchCourseAndAssessments();
  }, [courseId]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mt-4">
      <h2 className="mb-3">{course?.title}</h2>
      <p>{course?.description}</p>
      <h4 className="mt-4">Assessments</h4>
      {assessments.length === 0 ? (
        <div>No assessments available for this course.</div>
      ) : (
        <ul className="list-group">
          {assessments.map(a => (
            <li key={a.assessmentId} className="list-group-item d-flex justify-content-between align-items-center">
              <span>{a.title}</span>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => navigate(`/assessment/${a.assessmentId}`)}
              >
                Start
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CourseLearn;
