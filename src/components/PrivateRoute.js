import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // FIX: Make role check case-insensitive
  if (
    allowedRoles &&
    !allowedRoles.map(r => r.toLowerCase()).includes((user.role || '').toLowerCase())
  ) {
    return (
      <div className="alert alert-warning mt-4">
        Only {allowedRoles.join(' or ')} can access this feature.
      </div>
    );
  }

  return children;
};

export default PrivateRoute;
