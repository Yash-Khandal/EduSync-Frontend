// src/components/InstructorOnly.js
import React from 'react';
import { useAuth } from '../context/AuthContext';

const InstructorOnly = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="text-center mt-4">Loading user information...</div>;
  }

  if (!user || user.role !== 'instructor') {
    return (
      <div className="alert alert-danger mt-4">
        You do not have permission to access this page. Please log in as an instructor.
      </div>
    );
  }

  return <>{children}</>;
};

export default InstructorOnly;
