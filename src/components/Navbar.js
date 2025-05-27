import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function capitalizeFirstLetter(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar navbar-expand-md navbar-dark bg-primary py-2">
      <div className="container">
        <Link className="navbar-brand" to="/">
          <i className="fas fa-graduation-cap me-2"></i>
          EduSync
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNavDropdown"
          aria-controls="navbarNavDropdown"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNavDropdown">
          <ul className="navbar-nav me-auto">
            {user && (
              <>
                <li className="nav-item">
                  <Link className={`nav-link ${isActive('/dashboard')}`} to="/dashboard">
                    <i className="fas fa-home me-1"></i>
                    Dashboard
                  </Link>
                </li>
                {(user.role || '').toLowerCase() === 'instructor' ? (
                  <>
                    <li className="nav-item">
                      <Link className={`nav-link ${isActive('/courses')}`} to="/courses">
                        <i className="fas fa-book me-1"></i>
                        My Courses
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link className={`nav-link ${isActive('/assessments/manage')}`} to="/assessments/manage">
                        <i className="fas fa-tasks me-1"></i>
                        Manage Assessments
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link className={`nav-link ${isActive('/progress')}`} to="/progress">
                        <i className="fas fa-chart-line me-1"></i>
                        Progress Analysis
                      </Link>
                    </li>
                  </>
                ) : (user.role || '').toLowerCase() === 'student' ? (
                  <>
                    <li className="nav-item">
                      <Link className={`nav-link ${isActive('/courses')}`} to="/courses">
                        <i className="fas fa-graduation-cap me-1"></i>
                        My Courses
                      </Link>
                    </li>
                  </>
                ) : null}
              </>
            )}
          </ul>
          <ul className="navbar-nav">
            {user ? (
              <>
                <li className="nav-item">
                  <span className="nav-link">
                    <i className="fas fa-user me-1"></i>
                    {user.name} ({capitalizeFirstLetter(user.role)})
                  </span>
                </li>
                <li className="nav-item">
                  <button 
                    className="nav-link btn btn-link" 
                    onClick={handleLogout}
                  >
                    <i className="fas fa-sign-out-alt me-1"></i>
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link className={`nav-link ${isActive('/login')}`} to="/login">
                    <i className="fas fa-sign-in-alt me-1"></i>
                    Login
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link ${isActive('/register')}`} to="/register">
                    <i className="fas fa-user-plus me-1"></i>
                    Register
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
