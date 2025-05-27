import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import AssessmentForm from './AssessmentForm';
import Loader from './Loader';

const AssessmentManagement = () => {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState([]);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAssessments = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.assessments.getAll();
        // Robust filter: support both instructorId and InstructorId
        const filtered = (res.data || []).filter(
          a => (a.instructorId ?? a.InstructorId) === user.id
        );
        console.log(res.data);
        setAssessments(res.data || []);
      
  
        
      } catch (err) {
        setError('Failed to load assessments. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    if (user && (user.role || '').toLowerCase() === 'instructor') fetchAssessments();
  }, [user, refresh]);

  const handleDelete = async (assessmentId) => {
    if (!window.confirm('Are you sure you want to delete this assessment?')) return;
    try {
      await api.assessments.delete(assessmentId);
      setRefresh(r => !r);
    } catch {
      alert('Failed to delete assessment.');
    }
  };

  const handleEdit = (assessment) => {
    setEditing(assessment);
    setCreating(false);
  };

  const handleComplete = () => {
    setEditing(null);
    setCreating(false);
    setRefresh(r => !r);
  };

  if (creating) {
    return (
      <AssessmentForm
        onComplete={handleComplete}
        isEdit={false}
      />
    );
  }

  if (editing) {
    return (
      <AssessmentForm
        initialData={editing}
        onComplete={handleComplete}
        isEdit
      />
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Manage Assessments</h2>
        <button
          className="btn btn-primary"
          onClick={() => setCreating(true)}
        >
          + Create Assessment
        </button>
      </div>
      {loading ? (
        <Loader />
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <table className="table table-bordered align-middle">
  <thead>
    <tr>
      <th>S.No</th> 
      <th>Course</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {assessments.length === 0 ? (
      <tr>
        <td colSpan={3} className="text-center">No assessments found.</td>
      </tr>
    ) : (
      assessments.map((a, idx) => (
        <tr key={a.assessmentId}>
          <td>{idx + 1}</td> {/* Serial number */}
          <td>{a.title}</td>
          <td>
            <button
              className="btn btn-sm btn-warning me-2"
              onClick={() => handleEdit(a)}
            >Edit</button>
            <button
              className="btn btn-sm btn-danger"
              onClick={() => handleDelete(a.assessmentId)}
            >Delete</button>
          </td>
        </tr>
      ))
    )}
  </tbody>
</table>

      )}
    </div>
  );
};

export default AssessmentManagement;
