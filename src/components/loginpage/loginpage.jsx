import React, { useState } from 'react';
import './loginpage.css';

export default function LoginWeb() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

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

  const validatePassword = (password) => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    }
    if (password.length < 5) {
      setPasswordError('Password must be at least 5 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const isEmailValid = validateEmailOrPhone(email);
    const isPasswordValid = validatePassword(password);
    if (isEmailValid && isPasswordValid) {
      setLoading(true);
      try {
        const response = await fetch('https://demo-expense.geomaticxevs.in/ET-api/login.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ u_identify: email, u_pass: password }),
        });
        const data = await response.json();
        if (data.status === 'success') {
          setLoginError('');
          // Store user data in localStorage for web
          localStorage.setItem('userid', data.data.userid.toString());
          localStorage.setItem('roleId', data.data.role_id.toString());
          localStorage.setItem('currentLoginTime', Date.now().toString());
          window.location.replace('/dashboard');
        } else {
          setLoginError(data.message || 'Invalid email or password');
        }
      } catch (error) {
        setLoginError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="login-gradient-bg">
      <div className="login-overlay" />
      <div className="login-scroll">
        <div className="login-center">
          <img src="/assets/images/GM-Logo.png" alt="Logo" className="login-logo" />
          <h1 className="login-title">Welcome Back</h1>
          <form className="login-form" onSubmit={handleLogin} autoComplete="off">
            {loginError && <div className="login-error-text">{loginError}</div>}
            <input
              className={`login-input${emailError ? ' login-input-error' : ''}`}
              placeholder="E-mail or Telephone Number"
              type="text"
              value={email}
              onChange={e => {
                setEmail(e.target.value);
                if (emailError) validateEmailOrPhone(e.target.value);
              }}
              autoComplete="username"
            />
            {emailError && <div className="login-error-text">{emailError}</div>}
            <div className={`login-password-container${passwordError ? ' login-input-error' : ''}`}> 
              <input
                className="login-password-input"
                placeholder="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  if (passwordError) validatePassword(e.target.value);
                }}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-eye-icon"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? '🙈' : '👁️'}
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
}
