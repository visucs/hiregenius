import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
} from 'lucide-react';

import { authService } from '../../services/authService';
import GradientButton from '../../components/GradientButton/GradientButton';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState(token ? 'loading' : 'idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('idle');
      return;
    }

    let isMounted = true;
    setStatus('loading');

    authService
      .verifyEmail(token)
      .then(() => {
        if (isMounted) {
          setStatus('success');
          toast.success('Email verified successfully! You can now log in.');
        }
      })
      .catch((err) => {
        if (isMounted) {
          setStatus('error');
          const msg =
            err?.response?.data?.message ||
            'The verification link is invalid or has expired. Please request a new one below.';
          setErrorMessage(msg);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail || !resendEmail.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setIsResending(true);
    setResendSuccess(false);

    try {
      const res = await authService.resendVerification({ email: resendEmail.trim() });
      setResendSuccess(true);
      toast.success(res?.data?.message || 'Verification email dispatched. Please check your inbox.');
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        'Failed to resend verification email. Please wait 2 minutes or try again later.';
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
          maxWidth: '460px',
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
            Email Verification
          </h1>
          <p style={{ fontSize: '14px', color: '#94A3B8', margin: 0 }}>
            Account security and notifications verification
          </p>
        </div>

        {/* State 1: Loading / Verifying */}
        {status === 'loading' && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <Loader2
              size={44}
              color="#6366F1"
              style={{ animation: 'spin 1s linear infinite', marginBottom: '16px' }}
            />
            <p style={{ fontSize: '15px', color: '#E2E8F0', fontWeight: 600, margin: '0 0 6px 0' }}>
              Verifying your email...
            </p>
            <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
              Connecting to HireGenius authentication services
            </p>
          </div>
        )}

        {/* State 2: Success */}
        {status === 'success' && (
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
              Your account is fully activated. You can now post jobs, apply for positions, and receive critical platform notifications.
            </p>
            <Link to="/login" style={{ textDecoration: 'none', display: 'block' }}>
              <GradientButton fullWidth size="lg">
                Continue to Sign In <ArrowRight size={16} style={{ marginLeft: '8px' }} />
              </GradientButton>
            </Link>
          </div>
        )}

        {/* State 3: Error or Idle (Resend Form) */}
        {(status === 'error' || status === 'idle') && (
          <div>
            {status === 'error' && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  marginBottom: '24px',
                }}
              >
                <AlertCircle size={20} color="#EF4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#FCA5A5', margin: '0 0 2px 0' }}>
                    Verification Unsuccessful
                  </p>
                  <p style={{ fontSize: '13px', color: '#CBD5E1', margin: 0, lineHeight: 1.4 }}>
                    {errorMessage}
                  </p>
                </div>
              </div>
            )}

            {status === 'idle' && (
              <div
                style={{
                  background: 'rgba(99, 102, 241, 0.10)',
                  border: '1px solid rgba(99, 102, 241, 0.22)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  marginBottom: '24px',
                }}
              >
                <Mail size={20} color="#818CF8" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#C7D2FE', margin: '0 0 2px 0' }}>
                    Need a verification link?
                  </p>
                  <p style={{ fontSize: '13px', color: '#CBD5E1', margin: 0, lineHeight: 1.4 }}>
                    Enter your registered email below to receive a fresh verification link.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleResend} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label
                  htmlFor="resend-email"
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#E2E8F0',
                    marginBottom: '6px',
                  }}
                >
                  Registered Email Address
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
                    id="resend-email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
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

              {resendSuccess && (
                <div
                  style={{
                    background: 'rgba(34, 197, 94, 0.12)',
                    border: '1px solid rgba(34, 197, 94, 0.25)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    fontSize: '13px',
                    color: '#86EFAC',
                    lineHeight: 1.4,
                  }}
                >
                  Verification email sent! Please check your spam or inbox folder.
                </div>
              )}

              <GradientButton
                type="submit"
                fullWidth
                size="md"
                disabled={isResending}
                style={{ marginTop: '8px' }}
              >
                {isResending ? (
                  <>
                    <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite', marginRight: '8px' }} />
                    Sending link...
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} style={{ marginRight: '8px' }} />
                    Resend Verification Link
                  </>
                )}
              </GradientButton>
            </form>

            <div style={{ textAlign: 'center', marginTop: '24px' }}>
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
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default VerifyEmailPage;
