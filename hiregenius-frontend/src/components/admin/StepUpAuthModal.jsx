import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Eye, EyeOff, AlertCircle, Loader2, X } from 'lucide-react';
import adminService from '../../services/adminService';

/**
 * StepUpAuthModal
 * Prompts the acting administrator for their local password to authorize sensitive AI configuration operations.
 * Fails closed on Google OAuth accounts with LOCAL_CREDENTIALS_REQUIRED.
 * Enforces dedicated 5-attempt/15m lockout on brute force.
 */
export default function StepUpAuthModal({
  isOpen,
  onClose,
  actionType,
  actionTitle = 'Elevated Action Authorization',
  actionDescription = 'Please re-enter your administrator password to authorize this sensitive configuration change.',
  onSuccess,
}) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorCode, setErrorCode] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setError('Password is required for step-up verification.');
      return;
    }

    setLoading(true);
    setError(null);
    setErrorCode(null);

    try {
      const response = await adminService.createStepUpToken({
        password,
        action_type: actionType,
      });

      const token = response.data?.step_up_token;
      if (!token) {
        throw new Error('Failed to acquire step-up token.');
      }

      setPassword('');
      onSuccess(token);
    } catch (err) {
      const respData = err.response?.data || {};
      const status = err.response?.status;
      const code = respData.code;
      const message = respData.message || err.message || 'Verification failed.';

      setErrorCode(code);
      if (code === 'LOCAL_CREDENTIALS_REQUIRED') {
        setError(
          'Your account was registered exclusively via Google OAuth and has no local password hash. Step-up authorization requires a local password. Please set a password in your account profile.'
        );
      } else if (code === 'STEP_UP_LOCKED_OUT' || status === 429) {
        setError(
          'Security Lockout: Too many failed password attempts. This endpoint is temporarily locked for 15 minutes.'
        );
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError(null);
    setErrorCode(null);
    onClose();
  };

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          background: 'rgba(5, 5, 15, 0.75)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          style={{
            width: '100%',
            maxWidth: 440,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: '0 20px 48px rgba(0, 0, 0, 0.35)',
            boxSizing: 'border-box',
          }}
        >
          {/* Top header bar with security accent */}
          <div
            style={{
              height: 4,
              background: 'linear-gradient(90deg, #4f46e5, #818cf8, #ec4899)',
            }}
          />

          <div style={{ padding: '20px 24px 24px' }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: 'rgba(99, 102, 241, 0.12)',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Lock size={18} style={{ color: '#818cf8' }} />
                </div>
                <div>
                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      margin: 0,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {actionTitle}
                  </h3>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Action: {actionType}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 4,
                  borderRadius: 8,
                }}
              >
                <X size={18} />
              </button>
            </div>

            <p
              style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
                margin: '0 0 18px',
              }}
            >
              {actionDescription}
            </p>

            {/* Error banner */}
            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: errorCode === 'STEP_UP_LOCKED_OUT' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                  border: `1px solid ${errorCode === 'STEP_UP_LOCKED_OUT' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                  marginBottom: 16,
                }}
              >
                <AlertCircle
                  size={16}
                  style={{
                    color: errorCode === 'STEP_UP_LOCKED_OUT' ? '#ef4444' : '#f59e0b',
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                />
                <p
                  style={{
                    fontSize: 12,
                    color: 'var(--text-primary)',
                    lineHeight: 1.45,
                    margin: 0,
                  }}
                >
                  {error}
                </p>
              </div>
            )}

            {/* Password input form */}
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 18 }}>
                <label
                  htmlFor="step-up-password-input"
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: 6,
                  }}
                >
                  Admin Master Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="step-up-password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your administrator password"
                    autoFocus
                    disabled={loading || errorCode === 'STEP_UP_LOCKED_OUT'}
                    style={{
                      width: '100%',
                      minHeight: 44,
                      padding: '10px 42px 10px 14px',
                      borderRadius: 12,
                      fontSize: 13,
                      background: 'var(--card-row-bg)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: 4,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 12,
                    fontSize: 13,
                    fontWeight: 700,
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !password || errorCode === 'STEP_UP_LOCKED_OUT'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 18px',
                    borderRadius: 12,
                    fontSize: 13,
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                    border: 'none',
                    color: '#fff',
                    cursor: (loading || !password || errorCode === 'STEP_UP_LOCKED_OUT') ? 'not-allowed' : 'pointer',
                    opacity: (loading || !password || errorCode === 'STEP_UP_LOCKED_OUT') ? 0.6 : 1,
                    boxShadow: '0 2px 12px rgba(79, 70, 229, 0.35)',
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" /> Verifying...
                    </>
                  ) : (
                    <>
                      <Shield size={15} /> Authorize Action
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
