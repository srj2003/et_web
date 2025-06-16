import React, { useEffect, useState } from 'react';
import './loginpage.css';
import logo from '../../assets/GM-Logo.png';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LoginWeb = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Auto-redirect if already authenticated
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userid');
    if (token && userId) {
      navigate('/dashboard');
    }
  }, [navigate]);

  // Validation Functions
  const validateEmailOrPhone = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;
    if (!value) {
      setEmailError('Email or phone number is required');
      return false;
    }
    if (!emailRegex.test(value) && !phoneRegex.test(value)) {
      setEmailError('Please enter a valid email or 10-digit phone number');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (value) => {
    if (!value) {
      setPasswordError('Password is required');
      return false;
    }
    if (value.length < 5) {
      setPasswordError('Password must be at least 5 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    const isEmailValid = validateEmailOrPhone(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) return;

    setLoading(true);
    try {
      const response = await fetch('https://demo-expense.geomaticxevs.in/ET-api/login.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          u_identify: email.trim(),
          u_pass: password.trim(),
        }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid server response format');
      }

      const result = await response.json();
      console.log('Login Response:', result);

      if (result.status === 'success' && result.data) {
        // Store user info and token
        localStorage.setItem('authToken', result.token);
        localStorage.setItem('userid', result.data.userid?.toString() || '');
        localStorage.setItem('roleId', result.data.role_id?.toString() || '');
        localStorage.setItem('userName', result.data.userfullname || '');
        localStorage.setItem('currentLoginTime', Date.now().toString());

        setLoginError('');
        navigate('/dashboard');
      } else {
        setLoginError(result.message || 'Invalid login credentials');
      }
    } catch (error) {
      console.error('Login Error:', error);
      setLoginError('Server error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-gradient-bg">
      <div className="login-bg-shapes">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="login-shape"></div>
        ))}
      </div>
      <div className="login-overlay" />
      <div className="login-scroll">
        <div className="login-center">
          <img src={logo} alt="Logo" className="login-logo" />
          <h1 className="login-title">Welcome Back</h1>
          <form className="login-form" onSubmit={handleLogin} autoComplete="off">
            {loginError && <div className="login-error-text">{loginError}</div>}
            <input
              className={`login-input${emailError ? ' login-input-error' : ''}`}
              placeholder="E-mail or Telephone Number"
              type="text"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                validateEmailOrPhone(e.target.value);
              }}
              onBlur={() => validateEmailOrPhone(email)}
              autoComplete="username"
            />
            {emailError && <div className="login-error-text">{emailError}</div>}

            <div className={`login-password-container${passwordError ? ' login-input-error' : ''}`}>
              <input
                className="login-password-input"
                placeholder="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  validatePassword(e.target.value);
                }}
                onBlur={() => validatePassword(password)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-eye-icon"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {passwordError && <div className="login-error-text">{passwordError}</div>}

            <button
              className={`login-button${loading ? ' login-button-loading' : ''}`}
              type="submit"
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginWeb;
