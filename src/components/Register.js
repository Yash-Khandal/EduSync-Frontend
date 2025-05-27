import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const CustomLoader = () => (
  <>
    <span className="loader-btn"></span>
    <style>{`
      .loader-btn {
        display: inline-block;
        width: 1.5em;
        height: 1.5em;
        vertical-align: middle;
        --c:no-repeat linear-gradient(#fff 0 0);
        background: var(--c), var(--c), var(--c), var(--c), var(--c), var(--c);
        animation: 
          l14-1 .5s infinite alternate,
          l14-2 2s infinite;
      }
      @keyframes l14-1 {
        0%,10% {background-size:20% 100%}
        100%   {background-size:20% 20%}
      }
      @keyframes l14-2 {
        0%,49.9% {background-position: 0 0,0 100%,50% 50%,50% 50%,100% 0,100% 100%}
        50%,100% {background-position: 0 50%,0 50%,50% 0,50% 100%,100% 50%,100% 50% }
      }
    `}</style>
  </>
);

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      const response = await api.auth.register(registerData);
      if (response.status === 200 || response.status === 201) {
        navigate('/login');
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-bg d-flex align-items-center justify-content-center min-vh-100">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-7 col-lg-5">
            <div className="card shadow-lg border-0 animate__animated animate__fadeInDown" style={{ borderRadius: 24 }}>
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <i className="fas fa-user-plus fa-2x text-primary mb-2"></i>
                  <h2 className="fw-bold mb-0">Register for EduSync</h2>
                  <div className="text-muted small mt-1">Create your account to get started.</div>
                </div>
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}
                <form onSubmit={handleSubmit}>
                  <div className="form-group mb-3">
                    <label htmlFor="name" className="form-label fw-semibold">
                      <i className="fas fa-user me-2 text-secondary"></i>
                      Full Name
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      style={{ borderRadius: 12 }}
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label htmlFor="email" className="form-label fw-semibold">
                      <i className="fas fa-envelope me-2 text-secondary"></i>
                      Email
                    </label>
                    <input
                      type="email"
                      className="form-control form-control-lg"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      style={{ borderRadius: 12 }}
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label htmlFor="password" className="form-label fw-semibold">
                      <i className="fas fa-lock me-2 text-secondary"></i>
                      Password
                    </label>
                    <div className="input-group">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="form-control form-control-lg"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        style={{ borderRadius: 12 }}
                      />
                      <button
                        className="btn btn-outline-secondary"
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ borderRadius: 12 }}
                      >
                        <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </button>
                    </div>
                  </div>
                  <div className="form-group mb-3">
                    <label htmlFor="confirmPassword" className="form-label fw-semibold">
                      <i className="fas fa-lock me-2 text-secondary"></i>
                      Confirm Password
                    </label>
                    <div className="input-group">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        className="form-control form-control-lg"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        style={{ borderRadius: 12 }}
                      />
                      <button
                        className="btn btn-outline-secondary"
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{ borderRadius: 12 }}
                      >
                        <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </button>
                    </div>
                  </div>
                  <div className="form-group mb-3">
                    <label htmlFor="role" className="form-label fw-semibold">
                      <i className="fas fa-user-tag me-2 text-secondary"></i>
                      Role
                    </label>
                    <select
                      className="form-select form-select-lg"
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      required
                      style={{ borderRadius: 12, fontWeight: 500 }}
                    >
                      <option value="student">Student</option>
                      <option value="instructor">Instructor</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg w-100 mt-3"
                    disabled={loading}
                    style={{ borderRadius: 12, fontWeight: 600, fontSize: "1.1rem" }}
                  >
                    {loading ? (
                      <>
                        <CustomLoader /> Registering...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-user-plus me-2"></i>
                        Register
                      </>
                    )}
                  </button>
                </form>
                <div className="text-center mt-4">
                  <span className="text-muted">
                    Already have an account?{' '}
                    <Link to="/login" className="fw-bold text-primary text-decoration-none">
                      Login here
                    </Link>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Animate.css CDN for fadeInDown animation */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"
      />
      {/* Animated gradient background */}
      <style>{`
        .register-bg {
          min-height: 100vh;
          background: linear-gradient(120deg, #fbc2eb 0%, #a6c1ee 100%);
          background-size: 200% 200%;
          animation: gradientMove 8s ease-in-out infinite;
        }
        @keyframes gradientMove {
          0% {background-position: 0% 50%;}
          50% {background-position: 100% 50%;}
          100% {background-position: 0% 50%;}
        }
      `}</style>
    </div>
  );
};

export default Register;
