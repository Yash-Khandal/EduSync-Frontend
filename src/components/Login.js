import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError('An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg d-flex align-items-center justify-content-center min-vh-100">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-7 col-lg-5">
            <div className="card shadow-lg border-0 animate__animated animate__fadeInDown" style={{ borderRadius: 24 }}>
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <i className="fas fa-graduation-cap fa-2x text-primary mb-2"></i>
                  <h2 className="fw-bold mb-0">Login to EduSync</h2>
                  <div className="text-muted small mt-1">Welcome back! Please login to continue.</div>
                </div>
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label fw-semibold">
                      <i className="fas fa-envelope me-2 text-secondary"></i>Email
                    </label>
                    <input
                      type="email"
                      className="form-control form-control-lg"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      style={{ borderRadius: 12 }}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="password" className="form-label fw-semibold">
                      <i className="fas fa-lock me-2 text-secondary"></i>Password
                    </label>
                    <div className="input-group">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="form-control form-control-lg"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ borderRadius: 12 }}
                      />
                      <button
                        className="btn btn-outline-secondary"
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ borderRadius: 12 }}
                      >
                        <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg w-100 mt-3"
                    disabled={loading}
                    style={{ borderRadius: 12, fontWeight: 600, fontSize: "1.1rem" }}
                  >
                    {loading ? (
                      <>
                        <CustomLoader /> Logging in...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-sign-in-alt me-2"></i>
                        Login
                      </>
                    )}
                  </button>
                </form>
                <div className="text-center mt-4">
                  <span className="text-muted">
                    Don't have an account?{' '}
                    <Link to="/register" className="fw-bold text-primary text-decoration-none">
                      Register here
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
        .login-bg {
          min-height: 100vh;
          background: linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%);
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

export default Login;
