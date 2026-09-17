import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Eye, EyeOff, LogIn, Sparkles, AlertCircle, ArrowLeft } from 'lucide-react';

import { loginSchema } from '../../utils/validationSchemas';
import { authService } from '../../services/authService';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../lib/firebase';
import {
  setCredentials, setLoading, setError,
  selectIsAuthenticated, selectUserRole, selectAuthLoading, selectAuthError, clearError,
} from '../../features/auth/authSlice';
import { formatError } from '../../utils/helpers';
import { resolveRoleRedirect } from '../../routes/RoleRedirect';
import GradientButton from '../../components/GradientButton/GradientButton';
import GoogleSignInButton from '../../components/GoogleSignInButton/GoogleSignInButton';
import ServerWakeupNotice from '../../components/ServerWakeupNotice/ServerWakeupNotice';

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const role = useSelector(selectUserRole);
  const isLoading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError);
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const redirectParam = searchParams.get('redirect') || location.state?.from?.pathname || location.state?.redirect;

  useEffect(() => {
    if (isAuthenticated) {
      navigate(resolveRoleRedirect(redirectParam, role), { replace: true });
    }
    return () => dispatch(clearError());
  }, [isAuthenticated, role, navigate, dispatch, redirectParam]);

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data) => {
    dispatch(setLoading(true));
    dispatch(clearError());
    try {
      const res = await authService.login(data);
      const { token, user } = res.data;
      dispatch(setCredentials({ token, user }));
      toast.success(`Welcome back, ${user?.name || 'there'}!`);
      navigate(resolveRoleRedirect(redirectParam, user?.role));
    } catch (err) {
      const msg = formatError(err);
      dispatch(setError(msg));
      toast.error(msg);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    dispatch(clearError());
    try {
      // 1. Trigger Firebase Google popup
      const result = typeof window !== 'undefined' && window.__mockSignInWithPopup
        ? await window.__mockSignInWithPopup()
        : await signInWithPopup(auth, googleProvider);
      // 2. Extract ID token
      const idToken = await result.user.getIdToken();
      // 3. Build request payload (role absent on Login, as user already has role in backend)
      const payload = { idToken };
      // 4. Call mock API
      const res = await authService.googleLogin(payload);
      const { token, role: returnedRole } = res;
      // 5. Populate Redux auth state & persist session
      const user = {
        id: result.user.uid,
        name: result.user.displayName || 'Google User',
        email: result.user.email || '',
        role: returnedRole,
      };
      dispatch(setCredentials({ token, user, role: returnedRole }));
      toast.success(`Welcome back, ${result.user.displayName || 'there'}!`);
      navigate(resolveRoleRedirect(redirectParam, returnedRole));
    } catch (err) {
      console.error('Google Sign-In error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        toast.error('Sign-in cancelled. You closed the Google sign-in window.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        toast.error('Sign-in cancelled.');
      } else if (err.code === 'auth/popup-blocked') {
        toast.error('Pop-up blocked by browser. Please enable popups for this site.');
      } else {
        const msg = err.message || 'Failed to sign in with Google.';
        toast.error(msg);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const inputStyle = (hasError) => ({
    width: '100%',
    minHeight: 44,
    padding: '12px 16px',
    borderRadius: 'var(--radius-btn)',
    fontSize: 14,
    background: 'rgba(255,255,255,0.04)',
    border: `1.5px solid ${hasError ? 'var(--danger)' : 'var(--border)'}`,
    color: 'var(--text-primary)',
    outline: 'none',
    transition: 'border-color 0.2s',
  });

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px clamp(12px, 4vw, 24px)', position: 'relative', overflow: 'hidden',
      background: 'var(--bg-base)',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(99,102,241,0.12), transparent 70%)',
        top: '-20%', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(34,211,238,0.06), transparent 70%)',
        bottom: '10%', right: '15%', pointerEvents: 'none',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}
      >
        {/* Back to home */}
        <Link to="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none',
          marginBottom: 24, transition: 'color 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <ArrowLeft size={14} /> Back to home
        </Link>

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 11,
            background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={18} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            HireGenius <span style={{ background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>AI</span>
          </span>
        </div>

        {/* Glass card */}
        <div style={{
          background: 'rgba(15,20,32,0.8)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: 'clamp(20px, 6vw, 40px)',
          boxShadow: '0 8px 48px rgba(0,0,0,0.4)',
        }}>
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 8 }}>
              Sign in to your account
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              AI-powered recruitment, simplified.
            </p>
          </div>

          {/* Error banner */}
          {authError && (
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              style={{
                marginBottom: 24, padding: '12px 16px', borderRadius: 12,
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                display: 'flex', gap: 10, alignItems: 'center', fontSize: 14, color: 'var(--danger)',
              }}
              role="alert"
            >
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              {authError}
            </motion.div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Email */}
            <div>
              <label htmlFor="login-email" style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 8 }}>
                Email address
              </label>
              <input id="login-email" type="email" autoComplete="email" placeholder="you@company.com"
                {...register('email')} style={inputStyle(errors.email)}
                onFocus={e => e.target.style.borderColor = errors.email ? 'var(--danger)' : 'var(--primary)'}
                onBlur={e => e.target.style.borderColor = errors.email ? 'var(--danger)' : 'var(--border)'}
              />
              {errors.email && <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 6 }}>{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <label htmlFor="login-password" style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                  Password
                </label>
                <Link to="/forgot-password" id="login-forgot-password-link" style={{ fontSize: 12, fontWeight: 500, color: 'var(--primary)', textDecoration: 'none' }}>
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password"
                  placeholder="Enter your password" {...register('password')}
                  style={{ ...inputStyle(errors.password), paddingRight: 44 }}
                  onFocus={e => e.target.style.borderColor = errors.password ? 'var(--danger)' : 'var(--primary)'}
                  onBlur={e => e.target.style.borderColor = errors.password ? 'var(--danger)' : 'var(--border)'}
                />
                <button type="button" onClick={() => setShowPassword(p => !p)} tabIndex={-1}
                  style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 6 }}>{errors.password.message}</p>}
            </div>

            <GradientButton type="submit" isLoading={isLoading} disabled={isLoading} style={{ width: '100%', minHeight: 44, marginTop: 4 }} id="login-submit-btn">
              <LogIn size={15} /> Sign In
            </GradientButton>
          </form>

          {/* Visual Divider */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0 16px', gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>
              or
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* Continue with Google */}
          <GoogleSignInButton
            id="login-google-btn"
            isLoading={isGoogleLoading}
            disabled={isGoogleLoading || isLoading}
            onClick={handleGoogleSignIn}
            label="Continue with Google"
          />

          {/* Server wake-up notice for slow cold-start requests */}
          <ServerWakeupNotice isLoading={isLoading || isGoogleLoading} />

          <p style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)' }}>
            Don&apos;t have an account?{' '}
            <Link to="/register" id="login-register-link" style={{ fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }}>
              Create one
            </Link>
          </p>
        </div>

        <p style={{ marginTop: 16, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
          By signing in, you agree to our{' '}
          <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Terms of Service</span>.
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
