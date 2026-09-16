import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Lock, Eye, EyeOff, Sparkles, CheckCircle, AlertCircle, ArrowLeft, KeyRound
} from 'lucide-react';

import { resetPasswordSchema } from '../../utils/validationSchemas';
import { authService } from '../../services/authService';
import GradientButton from '../../components/GradientButton/GradientButton';

/**
 * ResetPasswordPage — Final phase of password reset flow.
 * Reads token from URL (?token=...), validates password requirements,
 * and calls POST /api/auth/reset-password.
 */
const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenError, setTokenError] = useState(
    !token ? 'Invalid or missing reset link. Please request a new password reset.' : ''
  );
  const [formError, setFormError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data) => {
    if (!token) {
      setTokenError('Invalid or missing reset link. Please request a new password reset.');
      return;
    }

    setFormError('');
    setIsLoading(true);

    try {
      await authService.resetPassword({ token, newPassword: data.password });
      setIsSuccess(true);
      toast.success('Password reset successful! You can now log in with your new password.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      const backendMessage = err?.response?.data?.message || err?.message || '';
      const status = err?.response?.status;

      if (
        status === 400 &&
        (backendMessage.toLowerCase().includes('token') ||
          backendMessage.toLowerCase().includes('expired') ||
          backendMessage.toLowerCase().includes('used'))
      ) {
        setTokenError('This reset link has expired or is invalid. Please request a new one.');
      } else if (
        status === 400 &&
        backendMessage.toLowerCase().includes('google')
      ) {
        setFormError(backendMessage || 'This account uses Google Sign-In and has no password to reset');
        toast.error(backendMessage);
      } else {
        const fallback = 'Failed to reset password. Please try again.';
        const msg = backendMessage || fallback;
        setFormError(msg);
        toast.error(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = (hasError) => ({
    width: '100%',
    minHeight: 44,
    padding: '12px 16px',
    borderRadius: 'var(--radius-btn, 12px)',
    fontSize: 14,
    background: 'rgba(255,255,255,0.04)',
    border: `1.5px solid ${hasError ? 'var(--danger, #EF4444)' : 'var(--border, rgba(255,255,255,0.1))'}`,
    color: 'var(--text-primary, #F8FAFC)',
    outline: 'none',
    transition: 'border-color 0.2s',
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px clamp(12px, 4vw, 24px)',
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--bg-base, #0B0F19)',
      }}
    >
      {/* Background glow effects matching LoginPage */}
      <div
        style={{
          position: 'absolute',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.12), transparent 70%)',
          top: '-20%',
          left: '50%',
          transform: 'translateX(-50%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(34,211,238,0.06), transparent 70%)',
          bottom: '10%',
          right: '15%',
          pointerEvents: 'none',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}
      >
        <div
          style={{
            background: 'var(--surface, #131825)',
            border: '1px solid var(--border, rgba(255,255,255,0.08))',
            borderRadius: 20,
            padding: 'clamp(24px, 5vw, 36px)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
          }}
        >
          {/* Header Branding */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 12,
              }}
            >
              <Sparkles size={20} style={{ color: 'var(--secondary, #38BDF8)' }} />
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 18,
                  background: 'linear-gradient(135deg, #6366F1, #38BDF8)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                HireGenius AI
              </span>
            </div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: 'var(--text-primary, #F8FAFC)',
                marginBottom: 6,
              }}
            >
              Set new password
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-secondary, #94A3B8)', lineHeight: 1.5 }}>
              Choose a strong password with at least 8 characters and 1 number.
            </p>
          </div>

          {/* 1. Missing or Invalid Token State */}
          {tokenError ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: 'center', padding: '16px 0 8px' }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'rgba(239,68,68,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  color: 'var(--danger, #EF4444)',
                }}
              >
                <AlertCircle size={28} />
              </div>
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: 'var(--text-primary, #F8FAFC)',
                  marginBottom: 8,
                }}
              >
                Link Expired or Invalid
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: 'var(--text-secondary, #94A3B8)',
                  lineHeight: 1.6,
                  marginBottom: 24,
                }}
              >
                {tokenError}
              </p>
              <Link
                to="/forgot-password"
                id="reset-request-new-link"
                style={{ textDecoration: 'none' }}
              >
                <GradientButton style={{ width: '100%', minHeight: 44 }}>
                  <KeyRound size={15} /> Request New Reset Link
                </GradientButton>
              </Link>
              <div style={{ marginTop: 20 }}>
                <Link
                  to="/login"
                  id="reset-back-to-login"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'var(--primary, #6366F1)',
                    textDecoration: 'none',
                  }}
                >
                  <ArrowLeft size={14} /> Back to Sign In
                </Link>
              </div>
            </motion.div>
          ) : isSuccess ? (
            /* 2. Success State */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: 'center', padding: '16px 0 8px' }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'rgba(34,197,94,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  color: 'var(--success, #22C55E)',
                }}
              >
                <CheckCircle size={32} />
              </div>
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: 'var(--text-primary, #F8FAFC)',
                  marginBottom: 8,
                }}
              >
                Password Reset Successful!
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: 'var(--text-secondary, #94A3B8)',
                  lineHeight: 1.6,
                  marginBottom: 24,
                }}
              >
                You can now log in with your new password. Redirecting to sign in...
              </p>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <GradientButton style={{ width: '100%', minHeight: 44 }}>
                  Proceed to Sign In
                </GradientButton>
              </Link>
            </motion.div>
          ) : (
            /* 3. Password Reset Form */
            <>
              {formError && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    marginBottom: 20,
                    padding: '12px 16px',
                    borderRadius: 12,
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.25)',
                    display: 'flex',
                    gap: 10,
                    alignItems: 'center',
                    fontSize: 14,
                    color: 'var(--danger, #EF4444)',
                  }}
                  role="alert"
                >
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{formError}</span>
                </motion.div>
              )}

              <form
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
              >
                {/* New Password */}
                <div>
                  <label
                    htmlFor="reset-password"
                    style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 500,
                      color: 'var(--text-primary, #F8FAFC)',
                      marginBottom: 8,
                    }}
                  >
                    New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="reset-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Enter new password (min 8 chars, 1 number)"
                      {...register('password')}
                      style={{ ...inputStyle(errors.password), paddingRight: 44 }}
                      onFocus={(e) => {
                        e.target.style.borderColor = errors.password
                          ? 'var(--danger, #EF4444)'
                          : 'var(--primary, #6366F1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = errors.password
                          ? 'var(--danger, #EF4444)'
                          : 'var(--border, rgba(255,255,255,0.1))';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      tabIndex={-1}
                      style={{
                        position: 'absolute',
                        right: 4,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted, #64748B)',
                        width: 44,
                        height: 44,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p
                      style={{
                        fontSize: 12,
                        color: 'var(--danger, #EF4444)',
                        marginTop: 6,
                      }}
                    >
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Confirm New Password */}
                <div>
                  <label
                    htmlFor="reset-confirm-password"
                    style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 500,
                      color: 'var(--text-primary, #F8FAFC)',
                      marginBottom: 8,
                    }}
                  >
                    Confirm New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="reset-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Re-enter your new password"
                      {...register('confirmPassword')}
                      style={{ ...inputStyle(errors.confirmPassword), paddingRight: 44 }}
                      onFocus={(e) => {
                        e.target.style.borderColor = errors.confirmPassword
                          ? 'var(--danger, #EF4444)'
                          : 'var(--primary, #6366F1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = errors.confirmPassword
                          ? 'var(--danger, #EF4444)'
                          : 'var(--border, rgba(255,255,255,0.1))';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((p) => !p)}
                      tabIndex={-1}
                      style={{
                        position: 'absolute',
                        right: 4,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted, #64748B)',
                        width: 44,
                        height: 44,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p
                      style={{
                        fontSize: 12,
                        color: 'var(--danger, #EF4444)',
                        marginTop: 6,
                      }}
                    >
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <GradientButton
                  type="submit"
                  isLoading={isLoading}
                  disabled={isLoading}
                  style={{ width: '100%', minHeight: 44, marginTop: 6 }}
                  id="reset-submit-btn"
                >
                  <Lock size={15} /> Reset Password
                </GradientButton>
              </form>

              <div style={{ marginTop: 24, textAlign: 'center' }}>
                <Link
                  to="/login"
                  id="reset-cancel-link"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'var(--primary, #6366F1)',
                    textDecoration: 'none',
                  }}
                >
                  <ArrowLeft size={14} /> Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
