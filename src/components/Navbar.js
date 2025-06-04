import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

function capitalizeFirstLetter(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const AppNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Navbar
      bg="primary"
      variant="dark"
      expand="md"
      className="py-2"
      collapseOnSelect
      style={{ backgroundColor: '#007bff' }} // Ensures Bootstrap blue
    >
      <Container>
        <Navbar.Brand as={Link} to="/">
          <i className="fas fa-graduation-cap me-2"></i>
          EduSync
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-navbar-nav" />
        <Navbar.Collapse id="main-navbar-nav">
          <Nav className="me-auto">
            {user && (
              <>
                <Nav.Link as={Link} to="/dashboard" active={location.pathname === '/dashboard'}>
                  <i className="fas fa-home me-1"></i> Dashboard
                </Nav.Link>
                {(user.role || '').toLowerCase() === 'instructor' && (
                  <>
                    <Nav.Link as={Link} to="/courses" active={location.pathname === '/courses'}>
                      <i className="fas fa-book me-1"></i> My Courses
                    </Nav.Link>
                    <Nav.Link as={Link} to="/assessments/manage" active={location.pathname === '/assessments/manage'}>
                      <i className="fas fa-tasks me-1"></i> Manage Assessments
                    </Nav.Link>
                    <Nav.Link as={Link} to="/progress" active={location.pathname === '/progress'}>
                      <i className="fas fa-chart-line me-1"></i> Progress Analysis
                    </Nav.Link>
                  </>
                )}
                {(user.role || '').toLowerCase() === 'student' && (
                  <Nav.Link as={Link} to="/courses" active={location.pathname === '/courses'}>
                    <i className="fas fa-graduation-cap me-1"></i> My Courses
                  </Nav.Link>
                )}
              </>
            )}
          </Nav>
          <Nav>
            {user ? (
              <>
                <Nav.Link disabled>
                  <i className="fas fa-user me-1"></i>
                  {user.name} ({capitalizeFirstLetter(user.role)})
                </Nav.Link>
                <Nav.Link as="button" className="btn btn-link nav-link" onClick={handleLogout}>
                  <i className="fas fa-sign-out-alt me-1"></i> Logout
                </Nav.Link>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login" active={location.pathname === '/login'}>
                  <i className="fas fa-sign-in-alt me-1"></i> Login
                </Nav.Link>
                <Nav.Link as={Link} to="/register" active={location.pathname === '/register'}>
                  <i className="fas fa-user-plus me-1"></i> Register
                </Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;
