import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, Sparkles, CheckCircle } from 'lucide-react';
import { useDispatch } from 'react-redux';

import { forgotPasswordSchema } from '../../utils/validationSchemas';
import { authService } from '../../services/authService';
import { setLoading, clearError } from '../../features/auth/authSlice';
import { formatError } from '../../utils/helpers';
import Loader from '../../components/Loader/Loader';
import useApiCall from '../../hooks/useApiCall';
import ServerWakeupNotice from '../../components/ServerWakeupNotice/ServerWakeupNotice';

/**
 * ForgotPasswordPage — Phase 1 Auth UI.
 * Sends reset email via Spring Boot; shows success state on completion.
 */
const ForgotPasswordPage = () => {
  const dispatch = useDispatch();
  const { execute, isLoading, error } = useApiCall();
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    return () => dispatch(clearError());
  }, [dispatch]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (data) => {
    try {
      await execute(() => authService.forgotPassword(data));
      setSubmitted(true);
      toast.success('Reset instructions sent! Check your inbox.');
    } catch (err) {
      const msg = formatError(err);
      toast.error(msg);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-3 sm:p-4"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <div
          className="rounded-2xl p-5 sm:p-8 shadow-lg"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
          }}
        >
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Sparkles size={22} style={{ color: 'var(--secondary)' }} />
              <span className="font-bold text-xl" style={{ color: 'var(--primary)' }}>
                HireGenius AI
              </span>
            </div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              Reset your password
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Enter your email and we&apos;ll send you a reset link.
            </p>
          </div>

          {/* Success state */}
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <CheckCircle
                size={48}
                className="mx-auto mb-4"
                style={{ color: 'var(--success)' }}
              />
              <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Check your email
              </h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                If an account exists for that email, we&apos;ve sent password reset instructions.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-semibold"
                style={{ color: 'var(--primary)' }}
                id="forgot-back-to-login-link"
              >
                <ArrowLeft size={16} />
                Back to Sign In
              </Link>
            </motion.div>
          ) : (
            <>
              {/* Error banner */}
              {error && (
                <div
                  className="mb-4 px-4 py-3 rounded-xl text-sm font-medium"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--danger) 12%, transparent)',
                    color: 'var(--danger)',
                    border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)',
                  }}
                  role="alert"
                >
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
                <div>
                  <label
                    htmlFor="forgot-email"
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Email address
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    {...register('email')}
                    className="w-full min-h-[44px] px-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{
                      backgroundColor: 'var(--bg)',
                      border: `1px solid ${errors.email ? 'var(--danger)' : 'var(--border)'}`,
                      color: 'var(--text-primary)',
                    }}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs" style={{ color: 'var(--danger)' }}>
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileTap={{ scale: 0.98 }}
                  className="w-full min-h-[44px] flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  style={{ backgroundColor: 'var(--primary)' }}
                  id="forgot-submit-btn"
                >
                  {isLoading ? (
                    <Loader size={18} label="" />
                  ) : (
                    <>
                      <Mail size={16} />
                      Send Reset Link
                    </>
                  )}
                </motion.button>

                {/* Server wake-up notice for slow cold-start requests */}
                <ServerWakeupNotice isLoading={isLoading} />
              </form>

              <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 font-semibold"
                  style={{ color: 'var(--primary)' }}
                  id="forgot-back-link"
                >
                  <ArrowLeft size={14} />
                  Back to Sign In
                </Link>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
