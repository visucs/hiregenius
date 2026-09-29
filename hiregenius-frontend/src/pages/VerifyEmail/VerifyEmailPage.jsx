import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  CheckCircle,
  AlertCircle,
  Mail,
  ArrowRight,
  RefreshCw,
  Loader2,
  Sparkles,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';

import { authService } from '../../services/authService';
import GradientButton from '../../components/GradientButton/GradientButton';

const COOLDOWN_SECONDS = 120; // 2-minute cooldown

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const emailParam = searchParams.get('email') || '';
  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);

  const [status, setStatus] = useState('idle'); // 'idle' | 'submitting' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  // If email came via search params and user registered just now, start cooldown
  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
      setCooldown(COOLDOWN_SECONDS);
    }
  }, [emailParam]);

  // Countdown timer effect
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // Focus the first empty digit on load
  useEffect(() => {
    if (status !== 'success' && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [status]);

  // Handle single digit input
  const handleDigitChange = (index, value) => {
    const cleanValue = value.replace(/\D/g, ''); // Digits only
    if (!cleanValue) {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }

    // If user pasted or typed multiple digits
    if (cleanValue.length > 1) {
      const pastedDigits = cleanValue.slice(0, 6).split('');
      const newOtp = [...otp];
      pastedDigits.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + pastedDigits.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = cleanValue;
    setOtp(newOtp);

    // Auto-advance to next input
    if (index < 5 && cleanValue) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().replace(/\D/g, '');
    if (!pastedData) return;

    const digits = pastedData.slice(0, 6).split('');
    const newOtp = [...otp];
    digits.forEach((digit, i) => {
      newOtp[i] = digit;
    });
    setOtp(newOtp);
    const targetIdx = Math.min(digits.length, 5);
    inputRefs.current[targetIdx]?.focus();
  };

  const fullOtp = otp.join('');

  const handleVerify = async (e) => {
    e?.preventDefault();
    if (!email || !email.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    if (fullOtp.length !== 6) {
      toast.error('Please enter all 6 digits of your verification code');
      return;
    }

    setStatus('submitting');
    setErrorMessage('');

    try {
      await authService.verifyEmailOtp({
        email: email.trim(),
        otp: fullOtp,
      });
      setStatus('success');
      toast.success('Email verified successfully! You can now log in.');
    } catch (err) {
      setStatus('error');
      const msg =
        err?.response?.data?.message ||
        'Verification failed. The code may be incorrect, expired, or already used.';
      setErrorMessage(msg);
      toast.error(msg);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    if (!email || !email.trim()) {
      toast.error('Please enter your email address to receive a code');
      return;
    }

    setIsResending(true);
    setErrorMessage('');

    try {
      const res = await authService.resendOtp({ email: email.trim() });
      setCooldown(COOLDOWN_SECONDS);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      toast.success(res?.data?.message || 'New 6-digit verification code sent to your email.');
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        'Failed to resend verification code. Please wait 2 minutes before requesting again.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0B0F19',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Background ambient lighting */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'rgba(21, 27, 44, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          padding: '40px 32px',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.45)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '999px',
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              color: '#818CF8',
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.04em',
              marginBottom: '16px',
            }}
          >
            <Sparkles size={14} /> HireGenius AI
          </div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 800,
              color: '#F8FAFC',
              letterSpacing: '-0.02em',
              margin: '0 0 8px 0',
            }}
          >
            Verify Your Email
          </h1>
          <p style={{ fontSize: '14px', color: '#94A3B8', margin: 0 }}>
            Enter the 6-digit verification code sent to your email address
          </p>
        </div>

        {/* State: Success */}
        {status === 'success' ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px auto',
              }}
            >
              <CheckCircle size={32} color="#22C55E" />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#F8FAFC', marginBottom: '8px' }}>
              Email Successfully Verified!
            </h2>
            <p style={{ fontSize: '14px', color: '#94A3B8', lineHeight: 1.5, marginBottom: '28px' }}>
              Your email has been verified. You can now sign in and access the HireGenius AI platform.
            </p>
            <Link to="/login" style={{ textDecoration: 'none', display: 'block' }}>
              <GradientButton fullWidth size="lg">
                Continue to Sign In <ArrowRight size={16} style={{ marginLeft: '8px' }} />
              </GradientButton>
            </Link>
          </div>
        ) : (
          /* Form for Entering Email and 6-digit OTP */
          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Error Banner */}
            {status === 'error' && errorMessage && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}
              >
                <AlertCircle size={20} color="#EF4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#FCA5A5', margin: '0 0 2px 0' }}>
                    Verification Failed
                  </p>
                  <p style={{ fontSize: '13px', color: '#CBD5E1', margin: 0, lineHeight: 1.4 }}>
                    {errorMessage}
                  </p>
                </div>
              </div>
            )}

            {/* Email Address */}
            <div>
              <label
                htmlFor="verify-email"
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#E2E8F0',
                  marginBottom: '6px',
                }}
              >
                Registered Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  color="#64748B"
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  id="verify-email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    borderRadius: '12px',
                    background: 'rgba(11, 15, 25, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#F8FAFC',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#6366F1')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)')}
                />
              </div>
            </div>

            {/* 6-Digit Code Inputs */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label
                  style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#E2E8F0',
                  }}
                >
                  6-Digit Verification Code
                </label>
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                  Valid for 10 minutes
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(6, 1fr)',
                  gap: '8px',
                }}
                onPaste={handlePaste}
              >
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={idx === 0 ? 6 : 1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    style={{
                      height: '52px',
                      textAlign: 'center',
                      fontSize: '20px',
                      fontWeight: 700,
                      borderRadius: '12px',
                      background: digit ? 'rgba(99, 102, 241, 0.12)' : 'rgba(11, 15, 25, 0.7)',
                      border: digit
                        ? '1.5px solid #6366F1'
                        : '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#F8FAFC',
                      outline: 'none',
                      transition: 'all 0.15s ease',
                    }}
                    onFocus={(e) => {
                      e.target.select();
                      e.target.style.borderColor = '#818CF8';
                      e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.18)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = digit ? '#6366F1' : 'rgba(255, 255, 255, 0.12)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Verify Button */}
            <GradientButton
              type="submit"
              fullWidth
              size="lg"
              disabled={status === 'submitting' || fullOtp.length !== 6 || !email.trim()}
              style={{ marginTop: '8px' }}
            >
              {status === 'submitting' ? (
                <>
                  <Loader2 size={16} className="animate-spin" style={{ marginRight: '8px' }} />
                  Verifying Code...
                </>
              ) : (
                <>
                  <ShieldCheck size={16} style={{ marginRight: '8px' }} />
                  Verify Email
                </>
              )}
            </GradientButton>

            {/* Resend OTP Section with Cooldown */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '8px',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                fontSize: '13px',
              }}
            >
              <span style={{ color: '#94A3B8' }}>Didn't receive the code?</span>
              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0 || isResending || !email.trim()}
                style={{
                  background: 'none',
                  border: 'none',
                  color: cooldown > 0 ? '#64748B' : '#818CF8',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  transition: 'color 0.15s ease',
                }}
              >
                {isResending ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    Sending...
                  </>
                ) : cooldown > 0 ? (
                  <>
                    <RefreshCw size={13} />
                    Resend in {Math.floor(cooldown / 60)}:{(cooldown % 60).toString().padStart(2, '0')}
                  </>
                ) : (
                  <>
                    <RefreshCw size={13} />
                    Resend Code
                  </>
                )}
              </button>
            </div>

            {/* Back to Sign In Link */}
            <div style={{ textAlign: 'center', marginTop: '8px' }}>
              <Link
                to="/login"
                style={{
                  fontSize: '13px',
                  color: '#818CF8',
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default VerifyEmailPage;
