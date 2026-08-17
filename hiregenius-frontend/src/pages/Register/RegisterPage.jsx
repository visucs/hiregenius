import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Eye, EyeOff, UserPlus, Sparkles, ArrowLeft } from 'lucide-react';

import { registerSchema } from '../../utils/validationSchemas';
import { authService } from '../../services/authService';
import {
  setCredentials, setLoading, setError,
  selectIsAuthenticated, selectAuthLoading, selectAuthError, clearError,
} from '../../features/auth/authSlice';
import { formatError } from '../../utils/helpers';
import GradientButton from '../../components/GradientButton/GradientButton';

const RegisterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
    return () => dispatch(clearError());
  }, [isAuthenticated, navigate, dispatch]);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'RECRUITER' },
  });

  const onSubmit = async (data) => {
    dispatch(setLoading(true));
    dispatch(clearError());
    const { confirmPassword, ...payload } = data;
    try {
      const res = await authService.register(payload);
      dispatch(setCredentials({ token: res.data.token, user: res.data.user }));
      toast.success('Account created! Welcome to HireGenius AI.');
      navigate('/dashboard');
    } catch (err) {
      const msg = formatError(err);
      dispatch(setError(msg));
      toast.error(msg);
    }
  };

  const inputStyle = (hasError) => ({
    width: '100%', padding: '12px 16px', borderRadius: 'var(--radius-btn)',
    fontSize: 14, background: 'rgba(255,255,255,0.04)',
    border: `1.5px solid ${hasError ? 'var(--danger)' : 'var(--border)'}`,
    color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s',
  });

  const FieldError = ({ message }) =>
    message ? <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 6 }}>{message}</p> : null;

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', position: 'relative', overflow: 'hidden', background: 'var(--bg-base)',
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
          borderRadius: 20, padding: '40px',
          boxShadow: '0 8px 48px rgba(0,0,0,0.4)',
        }}>
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 8 }}>
              Create your account
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Start hiring smarter with AI.
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

            {/* Role */}
            <div>
              <label htmlFor="register-role" style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 8 }}>Role</label>
              <select id="register-role" {...register('role')} style={{ ...inputStyle(errors.role), cursor: 'pointer' }}>
                <option value="RECRUITER">Recruiter</option>
                <option value="ADMIN">Admin</option>
              </select>
              <FieldError message={errors.role?.message} />
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
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
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
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}>
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <FieldError message={errors.confirmPassword?.message} />
            </div>

            <GradientButton type="submit" isLoading={isLoading} disabled={isLoading} style={{ width: '100%', marginTop: 4 }} id="register-submit-btn">
              <UserPlus size={15} /> Create Account
            </GradientButton>
          </form>

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
