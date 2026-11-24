import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, Eye, EyeOff, Shield, AlertCircle, Loader2, X } from 'lucide-react';
import StepUpAuthModal from './StepUpAuthModal';
import adminService from '../../services/adminService';

/**
 * UpdateKeyModal
 * Prompts for new API key, validates format, then gates submission with Step-Up Password Auth.
 * Key is never stored in persistent client memory or logged.
 */
export default function UpdateKeyModal({
  isOpen,
  onClose,
  provider = 'gemini',
  providerDisplayName = 'Google Gemini',
  onSuccess,
}) {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isStepUpOpen, setIsStepUpOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleOpenStepUp = (e) => {
    e.preventDefault();
    const cleanKey = apiKey.trim();

    if (!cleanKey) {
      setError('Please provide a valid API key.');
      return;
    }

    if (cleanKey.length < 20) {
      setError('The provided key appears too short to be a valid API key (minimum 20 characters).');
      return;
    }

    if (provider === 'gemini' && !cleanKey.startsWith('AIzaSy')) {
      // Gentle warning for Gemini keys
      setError("Google Gemini API keys typically start with 'AIzaSy'. Please verify the copied key.");
      return;
    }

    setError(null);
    setIsStepUpOpen(true);
  };

  const handleStepUpSuccess = async (stepUpToken) => {
    setIsStepUpOpen(false);
    setSaving(true);
    setError(null);

    try {
      const response = await adminService.saveAICredential(provider, apiKey.trim(), stepUpToken);
      // Immediately clear key from state
      setApiKey('');
      onSuccess(response.data);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save provider credential.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setApiKey('');
    setError(null);
    setIsStepUpOpen(false);
    onClose();
  };

  return (
    <>
      <AnimatePresence>
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9998,
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
              maxWidth: 480,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              overflow: 'hidden',
              boxShadow: '0 20px 48px rgba(0, 0, 0, 0.35)',
              boxSizing: 'border-box',
            }}
          >
            {/* Header bar */}
            <div
              style={{
                height: 4,
                background: 'linear-gradient(90deg, #3b82f6, #60a5fa, #818cf8)',
              }}
            />

            <div style={{ padding: '20px 24px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: 'rgba(59, 130, 246, 0.12)',
                      border: '1px solid rgba(59, 130, 246, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Key size={18} style={{ color: '#60a5fa' }} />
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
                      Update {providerDisplayName} API Key
                    </h3>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#60a5fa',
                      }}
                    >
                      Encrypted Key Vault Storage
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={saving}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 4,
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Security info banner */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid rgba(99, 102, 241, 0.22)',
                  marginBottom: 16,
                }}
              >
                <Shield size={16} style={{ color: '#818cf8', flexShrink: 0, marginTop: 2 }} />
                <p
                  style={{
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  The submitted key is encrypted at rest using AES-256-GCM with a random nonce per record in the AI microservice. Plaintext keys are never logged, stored in Core API, or retrievable via any API.
                </p>
              </div>

              {error && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '12px 14px',
                    borderRadius: 12,
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    marginBottom: 16,
                  }}
                >
                  <AlertCircle size={16} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
                  <p style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.45, margin: 0 }}>
                    {error}
                  </p>
                </div>
              )}

              <form onSubmit={handleOpenStepUp}>
                <div style={{ marginBottom: 20 }}>
                  <label
                    htmlFor="api-key-input"
                    style={{
                      display: 'block',
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: 6,
                    }}
                  >
                    API Secret Key
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="api-key-input"
                      type={showKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={provider === 'gemini' ? 'AIzaSy...' : 'sk-...'}
                      autoFocus
                      disabled={saving}
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
                        fontFamily: 'monospace',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
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
                      {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                    Tip: Keys can be acquired from the official {providerDisplayName} developer portal.
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={saving}
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
                    disabled={saving || !apiKey.trim()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 18px',
                      borderRadius: 12,
                      fontSize: 13,
                      fontWeight: 800,
                      background: 'linear-gradient(135deg, #3b82f6, #4f46e5)',
                      border: 'none',
                      color: '#fff',
                      cursor: (saving || !apiKey.trim()) ? 'not-allowed' : 'pointer',
                      opacity: (saving || !apiKey.trim()) ? 0.6 : 1,
                      boxShadow: '0 2px 12px rgba(59, 130, 246, 0.35)',
                    }}
                  >
                    {saving ? (
                      <>
                        <Loader2 size={15} className="animate-spin" /> Storing...
                      </>
                    ) : (
                      <>
                        <Shield size={15} /> Continue to Step-Up Auth
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Step-Up Password Modal */}
      <StepUpAuthModal
        isOpen={isStepUpOpen}
        onClose={() => setIsStepUpOpen(false)}
        actionType="PUT_CREDENTIAL"
        actionTitle="Authorize API Key Storage"
        actionDescription={`Enter your administrator password to authorize storing the new API key for ${providerDisplayName}.`}
        onSuccess={handleStepUpSuccess}
      />
    </>
  );
}
