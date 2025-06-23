import React, { useEffect, useState } from 'react';
import './loginpage.css';
import logo from '../../assets/GM-Logo.png';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Modal from '@mui/material/Modal'; // Or use your preferred modal/dialog
import Box from '@mui/material/Box';     // For modal content styling

const LoginWeb = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotInput, setForgotInput] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [otpConfirmed, setOtpConfirmed] = useState(false);

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

  // Forgot Password Handlers
  const handleSendOtp = async () => {
    setForgotError('');
    if (!forgotInput) {
      setForgotError('Please enter your registered email.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotInput.trim())) {
      setForgotError('Please enter a valid email address.');
      return;
    }
    setOtpLoading(true);
    try {
      const response = await fetch('https://demo-expense.geomaticxevs.in/ET-api/forgot_password.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ u_email: forgotInput.trim() }),
      });
      const data = await response.json();
      if (data.status === 'success') {
        setOtpSent(true);
        setForgotError('');
      } else {
        setForgotError(data.message || 'Failed to send OTP. Try again.');
      }
    } catch (err) {
      setForgotError('Network error. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setForgotError('');
    if (!otpInput) {
      setForgotError('Please enter the OTP sent to your email.');
      return;
    }
    setResetLoading(true);
    try {
      const response = await fetch('https://demo-expense.geomaticxevs.in/ET-api/verify_otp.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ u_email: forgotInput.trim(), otp: otpInput.trim() }),
      });
      const data = await response.json();
      if (data.status === 'success') {
        setOtpConfirmed(true);
        setForgotError('');
      } else {
        setForgotError(data.message || 'Invalid OTP. Please try again.');
      }
    } catch (err) {
      setForgotError('Network error. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otpInput || !newPassword || !confirmPassword) {
      setForgotError('All fields are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match.');
      return;
    }
    setResetLoading(true);
    try {
      const response = await fetch('https://demo-expense.geomaticxevs.in/ET-api/reset_password.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          u_email: forgotInput.trim(),
          otp: otpInput.trim(),
          new_password: newPassword,
        }),
      });
      const data = await response.json();
      if (data.status === 'success') {
        setForgotError('');
        setOtpSent(false);
        setShowForgotModal(false);
        setForgotInput('');
        setOtpInput('');
        setNewPassword('');
        setConfirmPassword('');
        setOtpConfirmed(false);
        alert('Password reset successful! Please login with your new password.');
      } else {
        setForgotError(data.message || 'Failed to reset password.');
      }
    } catch (err) {
      setForgotError('Network error. Please try again.');
    } finally {
      setResetLoading(false);
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
            {/* Forgot Password Link */}
            <div style={{ textAlign: 'right', marginTop: '-16px', marginBottom: '8px' }}>
              <button
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#1976d2',
                  fontSize: '15px',
                  fontWeight: 500,
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: 0,
                }}
                onClick={() => setShowForgotModal(true)}
              >
                Forgot Password?
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        open={showForgotModal}
        onClose={() => {
          setShowForgotModal(false);
          setForgotInput('');
          setForgotError('');
          setOtpSent(false);
          setOtpInput('');
          setNewPassword('');
          setConfirmPassword('');
          setOtpConfirmed(false);
        }}
        aria-labelledby="forgot-password-modal"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 350,
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <h2 style={{ color: '#1976d2', marginBottom: 16 }}>Forgot Password</h2>
          {!otpSent && (
            <>
              <input
                className="login-input"
                placeholder="Enter your registered email"
                value={forgotInput}
                onChange={e => setForgotInput(e.target.value)}
                type="email"
                autoComplete="username"
                style={{ marginBottom: 12 }}
              />
              {forgotError && <div className="login-error-text">{forgotError}</div>}
              <button
                className="login-button"
                style={{ marginBottom: 0 }}
                onClick={handleSendOtp}
                disabled={otpLoading}
                type="button"
              >
                {otpLoading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </>
          )}
          {otpSent && !otpConfirmed && (
            <>
              <input
                className="login-input"
                placeholder="Enter OTP"
                value={otpInput}
                onChange={e => setOtpInput(e.target.value)}
                type="text"
                autoComplete="one-time-code"
                style={{ marginBottom: 12 }}
              />
              {forgotError && <div className="login-error-text">{forgotError}</div>}
              <button
                className="login-button"
                style={{ marginBottom: 0 }}
                onClick={handleVerifyOtp}
                disabled={resetLoading}
                type="button"
              >
                {resetLoading ? 'Verifying...' : 'Confirm OTP'}
              </button>
            </>
          )}
          {otpSent && otpConfirmed && (
            <>
              <input
                className="login-input"
                placeholder="New Password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                type="password"
                style={{ marginBottom: 12 }}
              />
              <input
                className="login-input"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                type="password"
                style={{ marginBottom: 12 }}
              />
              {forgotError && <div className="login-error-text">{forgotError}</div>}
              <button
                className="login-button"
                style={{ marginBottom: 0 }}
                onClick={handleResetPassword}
                disabled={resetLoading}
                type="button"
              >
                {resetLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </>
          )}
          <button
            className="login-button"
            style={{
              background: '#fff',
              color: '#1976d2',
              marginTop: 10,
              border: '1px solid #1976d2',
            }}
            onClick={() => {
              setShowForgotModal(false);
              setForgotInput('');
              setForgotError('');
              setOtpSent(false);
              setOtpInput('');
              setNewPassword('');
              setConfirmPassword('');
              setOtpConfirmed(false);
            }}
            type="button"
          >
            Close
          </button>
        </Box>
      </Modal>
    </div>
  );
};

export default LoginWeb;
