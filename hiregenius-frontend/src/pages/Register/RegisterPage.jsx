import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Eye, EyeOff, UserPlus, Sparkles, ArrowLeft, Briefcase, Users } from 'lucide-react';

import { registerSchema } from '../../utils/validationSchemas';
import { authService } from '../../services/authService';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../lib/firebase';
import { ROLE_HOME } from '../../routes/RoleRedirect';
import {
  setCredentials, setLoading, setError,
  selectIsAuthenticated, selectAuthLoading, selectAuthError, clearError,
} from '../../features/auth/authSlice';
import { formatError } from '../../utils/helpers';
import GradientButton from '../../components/GradientButton/GradientButton';
import GoogleSignInButton from '../../components/GoogleSignInButton/GoogleSignInButton';
import ServerWakeupNotice from '../../components/ServerWakeupNotice/ServerWakeupNotice';

const RegisterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
    return () => dispatch(clearError());
  }, [isAuthenticated, navigate, dispatch]);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: '' },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data) => {
    dispatch(setLoading(true));
    dispatch(clearError());
    const { confirmPassword: _confirmPassword, ...payload } = data;
    try {
      const res = await authService.register(payload);
      dispatch(setCredentials({ token: res.data.token, user: res.data.user }));
      toast.success('Account created! Welcome to HireGenius AI.');
      navigate(ROLE_HOME[res.data.user?.role] || '/dashboard');
    } catch (err) {
      const msg = formatError(err);
      dispatch(setError(msg));
      toast.error(msg);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!selectedRole) {
      toast.error('Please select whether you are hiring or looking for a job before continuing with Google.');
      return;
    }
    setIsGoogleLoading(true);
    dispatch(clearError());
    try {
      // 1. Trigger Firebase Google popup
      const result = typeof window !== 'undefined' && window.__mockSignInWithPopup
        ? await window.__mockSignInWithPopup()
        : await signInWithPopup(auth, googleProvider);
      // 2. Extract ID token
      const idToken = await result.user.getIdToken();
      // 3. Build request payload with chosen role (required on Register)
      const payload = { idToken, role: selectedRole };
      // 4. Call mock API
      const res = await authService.googleLogin(payload);
      const { token, role: returnedRole } = res;
      // 5. Store session in Redux & navigate to role dashboard
      const user = {
        id: result.user.uid,
        name: result.user.displayName || (returnedRole === 'RECRUITER' ? 'Recruiter' : 'Candidate'),
        email: result.user.email || '',
        role: returnedRole,
      };
      dispatch(setCredentials({ token, user, role: returnedRole }));
      toast.success(`Account created! Welcome to HireGenius AI, ${result.user.displayName || ''}`);
      navigate(ROLE_HOME[returnedRole] ?? '/dashboard');
    } catch (err) {
      console.error('Google registration error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        toast.error('Sign-in cancelled. You closed the Google sign-in window.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        toast.error('Sign-in cancelled.');
      } else if (err.code === 'auth/popup-blocked') {
        toast.error('Pop-up blocked by browser. Please enable popups for this site.');
      } else {
        const msg = err.message || 'Failed to register with Google.';
        toast.error(msg);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const inputStyle = (hasError) => ({
    width: '100%', minHeight: 44, padding: '12px 16px', borderRadius: 'var(--radius-btn)',
    fontSize: 14, background: 'rgba(255,255,255,0.04)',
    border: `1.5px solid ${hasError ? 'var(--danger)' : 'var(--border)'}`,
    color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s',
  });

  const FieldError = ({ message }) =>
    message ? <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 6 }}>{message}</p> : null;

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px clamp(12px, 4vw, 24px)', position: 'relative', overflow: 'hidden', background: 'var(--bg-base)',
    }}>
      {/* Background glows */}
      <div style={{
        position: 'absolute', width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(99,102,241,0.1), transparent 70%)',
        top: '-20%', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(34,211,238,0.06), transparent 70%)',
        bottom: '5%', left: '10%', pointerEvents: 'none',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: '100%', maxWidth: 480, position: 'relative', zIndex: 1 }}
      >
        {/* Back link */}
        <Link to="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none', marginBottom: 24,
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
            HireGenius{' '}
            <span style={{ background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>AI</span>
          </span>
        </div>

        {/* Glass card */}
        <div style={{
          background: 'rgba(15,20,32,0.8)', backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)', border: '1px solid var(--border)',
          borderRadius: 20, padding: 'clamp(20px, 6vw, 40px)',
          boxShadow: '0 8px 48px rgba(0,0,0,0.4)',
        }}>
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 8 }}>
              Create your account
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Join thousands using AI to hire smarter and land better jobs.
            </p>
          </div>

          {authError && (
            <div style={{
              marginBottom: 24, padding: '12px 16px', borderRadius: 12,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
              fontSize: 14, color: 'var(--danger)',
            }} role="alert">{authError}</div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Role — shown FIRST per backend contract before Google or password registration */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 10 }}>
                I am…
              </label>
              {/* Hidden input keeps react-hook-form + Zod wired */}
              <input type="hidden" {...register('role')} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: 10 }}>
                {[
                  {
                    value: 'CANDIDATE',
                    icon: Briefcase,
                    title: "I'm looking for a job",
                    sub: 'Score resumes, prep for interviews',
                  },
                  {
                    value: 'RECRUITER',
                    icon: Users,
                    title: "I'm hiring",
                    sub: 'Screen candidates with AI',
                  },
                ].map(({ value, icon: Icon, title, sub }) => {
                  const isSelected = selectedRole === value;
                  return (
                    <motion.button
                      key={value}
                      type="button"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setValue('role', value, { shouldValidate: true })}
                      style={{
                        padding: '14px 16px', borderRadius: 14, textAlign: 'left',
                        cursor: 'pointer', border: 'none', transition: 'all 0.18s',
                        background: isSelected
                          ? 'rgba(99,102,241,0.1)'
                          : 'rgba(255,255,255,0.03)',
                        outline: isSelected
                          ? '1.5px solid rgba(99,102,241,0.6)'
                          : '1.5px solid var(--border)',
                        boxShadow: isSelected ? '0 0 0 3px rgba(99,102,241,0.08)' : 'none',
                      }}
                      id={`register-role-${value.toLowerCase()}`}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                          background: isSelected ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.05)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Icon size={15} style={{ color: isSelected ? 'var(--primary)' : 'var(--text-muted)' }} />
                        </div>
                        <span style={{
                          fontSize: 13, fontWeight: 600,
                          color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                        }}>
                          {title}
                        </span>
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', paddingLeft: 40, lineHeight: 1.4 }}>
                        {sub}
                      </p>
                    </motion.button>
                  );
                })}
              </div>
              {errors.role && (
                <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 6 }}>{errors.role.message}</p>
              )}
            </div>

            {/* Full Name */}
            <div>
              <label htmlFor="register-name" style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 8 }}>Full Name</label>
              <input id="register-name" type="text" autoComplete="name" placeholder="Jane Smith"
                {...register('name')} style={inputStyle(errors.name)}
                onFocus={e => e.target.style.borderColor = errors.name ? 'var(--danger)' : 'var(--primary)'}
                onBlur={e => e.target.style.borderColor = errors.name ? 'var(--danger)' : 'var(--border)'}
              />
              <FieldError message={errors.name?.message} />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="register-email" style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 8 }}>Email address</label>
              <input id="register-email" type="email" autoComplete="email" placeholder="you@company.com"
                {...register('email')} style={inputStyle(errors.email)}
                onFocus={e => e.target.style.borderColor = errors.email ? 'var(--danger)' : 'var(--primary)'}
                onBlur={e => e.target.style.borderColor = errors.email ? 'var(--danger)' : 'var(--border)'}
              />
              <FieldError message={errors.email?.message} />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="register-password" style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 8 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input id="register-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password"
                  placeholder="Min 8 chars, 1 uppercase, 1 number" {...register('password')}
                  style={{ ...inputStyle(errors.password), paddingRight: 44 }}
                  onFocus={e => e.target.style.borderColor = errors.password ? 'var(--danger)' : 'var(--primary)'}
                  onBlur={e => e.target.style.borderColor = errors.password ? 'var(--danger)' : 'var(--border)'}
                />
                <button type="button" onClick={() => setShowPassword(p => !p)} tabIndex={-1}
                  style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <FieldError message={errors.password?.message} />
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="register-confirm-password" style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 8 }}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input id="register-confirm-password" type={showConfirm ? 'text' : 'password'} autoComplete="new-password"
                  placeholder="••••••••" {...register('confirmPassword')}
                  style={{ ...inputStyle(errors.confirmPassword), paddingRight: 44 }}
                  onFocus={e => e.target.style.borderColor = errors.confirmPassword ? 'var(--danger)' : 'var(--primary)'}
                  onBlur={e => e.target.style.borderColor = errors.confirmPassword ? 'var(--danger)' : 'var(--border)'}
                />
                <button type="button" onClick={() => setShowConfirm(p => !p)} tabIndex={-1}
                  style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <FieldError message={errors.confirmPassword?.message} />
            </div>

            <GradientButton type="submit" isLoading={isLoading} disabled={isLoading} style={{ width: '100%', minHeight: 44, marginTop: 4 }} id="register-submit-btn">
              <UserPlus size={15} /> Create Account
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

          {/* Continue with Google (requires role selection first) */}
          <div>
            <GoogleSignInButton
              id="register-google-btn"
              isLoading={isGoogleLoading}
              disabled={!selectedRole || isGoogleLoading}
              onClick={handleGoogleSignIn}
              label={selectedRole ? `Continue with Google as ${selectedRole === 'RECRUITER' ? 'Recruiter' : 'Candidate'}` : 'Continue with Google'}
            />
            {!selectedRole && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
                Select whether you&apos;re hiring or looking for a job above to enable Google sign up
              </p>
            )}
          </div>

          {/* Server wake-up notice for slow cold-start requests */}
          <ServerWakeupNotice isLoading={isLoading || isGoogleLoading} />

          <p style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" id="register-login-link" style={{ fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
