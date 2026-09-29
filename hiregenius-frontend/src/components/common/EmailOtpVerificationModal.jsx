import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, X, RefreshCw, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { updateUser } from '../../features/auth/authSlice';
import authService from '../../services/authService';

const COOLDOWN_SECONDS = 60;

export default function EmailOtpVerificationModal({
  isOpen,
  onClose,
  email,
  onSuccess,
}) {
  const dispatch = useDispatch();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const inputRefs = useRef([]);

  // Auto-focus first input when modal opens
  useEffect(() => {
    if (isOpen) {
      setOtp(['', '', '', '', '', '']);
      setErrorMsg('');
      setIsSuccess(false);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleChange = (val, index) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setErrorMsg('');

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim().replace(/\D/g, '');
    if (!pasted) return;

    const digits = pasted.slice(0, 6).split('');
    const newOtp = [...otp];
    digits.forEach((d, i) => {
      if (i < 6) newOtp[i] = d;
    });
    setOtp(newOtp);
    setErrorMsg('');
    const nextFocus = Math.min(digits.length, 5);
    inputRefs.current[nextFocus]?.focus();
  };

  const fullOtp = otp.join('');

  const handleVerify = async (e) => {
    e?.preventDefault();
    if (fullOtp.length !== 6) {
      setErrorMsg('Please enter all 6 digits.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      await authService.verifyEmailOtp({
        email: email.trim(),
        otp: fullOtp,
      });

      // Update Redux state immediately
      dispatch(updateUser({ email_verified: true, emailVerified: true }));
      setIsSuccess(true);
      toast.success('Email verified successfully!');

      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid or expired OTP code';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setErrorMsg('');

    try {
      const res = await authService.resendOtp({ email: email.trim(), purpose: 'EMAIL_VERIFICATION' });
      setCooldown(COOLDOWN_SECONDS);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      toast.success(res?.data?.message || 'New verification code sent to your email.');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to resend verification code';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            background: 'rgba(5, 10, 5, 0.75)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {/* Backdrop click */}
          <div
            onClick={onClose}
            style={{ position: 'absolute', inset: 0 }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 440,
              background: '#0e170b',
              border: '1px solid rgba(107, 138, 58, 0.35)',
              borderRadius: 24,
              padding: 'clamp(20px, 4vw, 32px)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.65)',
              color: '#fff',
              zIndex: 1,
            }}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              type="button"
              style={{
                position: 'absolute',
                top: 18,
                right: 18,
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.10)',
                borderRadius: 10,
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(255, 255, 255, 0.65)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <X size={16} />
            </button>

            {isSuccess ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    background: 'rgba(52, 211, 153, 0.15)',
                    border: '2px solid rgba(52, 211, 153, 0.40)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    color: '#34d399',
                  }}
                >
                  <CheckCircle2 size={32} />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 8px', color: '#fff' }}>
                  Email Verified!
                </h3>
                <p style={{ fontSize: 13, color: 'rgba(190, 220, 140, 0.70)', margin: 0 }}>
                  Your email address has been successfully verified.
                </p>
              </div>
            ) : (
              <form onSubmit={handleVerify}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      background: 'rgba(107, 138, 58, 0.18)',
                      border: '1px solid rgba(107, 138, 58, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#a3e635',
                      flexShrink: 0,
                    }}
                  >
                    <Mail size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 3px', color: '#fff' }}>
                      Verify Email Address
                    </h3>
                    <p style={{ fontSize: 12, color: 'rgba(190, 220, 140, 0.70)', margin: 0, wordBreak: 'break-all' }}>
                      Enter the 6-digit code sent to <strong style={{ color: '#fff' }}>{email}</strong>
                    </p>
                  </div>
                </div>

                {/* 6-Digit OTP Inputs */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 8,
                    margin: '22px 0 16px',
                  }}
                >
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (inputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(e.target.value, idx)}
                      onKeyDown={(e) => handleKeyDown(e, idx)}
                      onPaste={idx === 0 ? handlePaste : undefined}
                      style={{
                        width: '100%',
                        maxWidth: 48,
                        height: 52,
                        borderRadius: 12,
                        textAlign: 'center',
                        fontSize: 20,
                        fontWeight: 800,
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: `1.5px solid ${digit ? '#a3e635' : errorMsg ? 'rgba(248,113,113,0.7)' : 'rgba(107,138,58,0.35)'}`,
                        color: '#fff',
                        outline: 'none',
                        transition: 'all 0.15s',
                        boxShadow: digit ? '0 0 12px rgba(163,230,53,0.20)' : 'none',
                      }}
                    />
                  ))}
                </div>

                {/* Error message */}
                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 12,
                      color: '#f87171',
                      marginBottom: 16,
                      background: 'rgba(248,113,113,0.10)',
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: '1px solid rgba(248,113,113,0.25)',
                    }}
                  >
                    <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                    <span>{errorMsg}</span>
                  </motion.div>
                )}

                {/* Verify Action Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={submitting || fullOtp.length !== 6}
                  style={{
                    width: '100%',
                    minHeight: 46,
                    borderRadius: 14,
                    border: 'none',
                    background: fullOtp.length === 6 ? 'linear-gradient(135deg, #3D5016, #6B8A3A)' : 'rgba(255,255,255,0.08)',
                    color: fullOtp.length === 6 ? '#fff' : 'rgba(255,255,255,0.40)',
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: submitting || fullOtp.length !== 6 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: fullOtp.length === 6 ? '0 4px 18px rgba(61,80,22,0.45)' : 'none',
                    transition: 'all 0.18s',
                    marginBottom: 14,
                  }}
                >
                  {submitting ? 'Verifying…' : (
                    <>
                      Verify Code <ArrowRight size={16} />
                    </>
                  )}
                </motion.button>

                {/* Resend Cooldown */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={cooldown > 0 || resending}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: cooldown > 0 ? 'rgba(190, 220, 140, 0.45)' : '#a3e635',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: cooldown > 0 || resending ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '4px 8px',
                    }}
                  >
                    <RefreshCw size={13} className={resending ? 'animate-spin' : ''} />
                    {resending
                      ? 'Sending code…'
                      : cooldown > 0
                      ? `Resend code in ${cooldown}s`
                      : 'Resend code'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
