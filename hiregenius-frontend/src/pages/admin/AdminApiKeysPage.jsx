import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Key, Cpu, Shield, Clock, AlertCircle, AlertTriangle,
  CheckCircle2, RefreshCw, Trash2, RotateCcw,
  Zap, Info, Activity, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import adminService from '../../services/adminService';
import StepUpAuthModal from '../../components/admin/StepUpAuthModal';
import UpdateKeyModal from '../../components/admin/UpdateKeyModal';

/* ─── Task Definition Metadata ───────────────────────────────────── */
const TASK_METADATA = {
  RESUME_PARSER: {
    name: 'Resume Parser',
    label: 'Automated Resume Parsing & Skill Extraction',
    description: 'Structured extraction of work experience, education, tech skills, and projects from candidate resumes.',
    defaultModel: 'gemini-2.5-flash',
    temp: 0.1,
    timeout: '60s',
    retries: 2,
    badgeColor: '#60a5fa',
  },
  ATS_SCORER: {
    name: 'ATS Scorer',
    label: 'ATS Keyword & Requirements Extraction',
    description: 'Extracts core skills, competencies, and years of experience criteria from job descriptions.',
    defaultModel: 'gemini-2.5-flash',
    temp: 0.1,
    timeout: '30s',
    retries: 2,
    badgeColor: '#34d399',
  },
  INTERVIEW_GENERATE: {
    name: 'Interview Question Generator',
    label: 'Adaptive Interview Question Generation',
    description: 'Generates tailored technical and behavioral questions adapted to candidate seniority without demographic bias.',
    defaultModel: 'gemini-2.5-flash',
    temp: 0.4,
    timeout: '45s',
    retries: 2,
    badgeColor: '#a78bfa',
  },
  INTERVIEW_EVALUATE: {
    name: 'Interview Evaluator',
    label: 'Candidate Answer Evaluation & Rubric Grading',
    description: 'Evaluates candidate interview responses against structured rubrics and provides indicative scoring.',
    defaultModel: 'gemini-2.5-flash',
    temp: 0.2,
    timeout: '60s',
    retries: 2,
    badgeColor: '#f472b6',
  },
  RAG_EXPLAINER: {
    name: 'RAG Explainer',
    label: 'Candidate Ranking Grounded Explanations',
    description: 'Generates strictly grounded candidate qualification justifications with cited resume chunk IDs.',
    defaultModel: 'gemini-2.5-flash',
    temp: 0.2,
    timeout: '10s',
    retries: 0,
    badgeColor: '#fbbf24',
  },
};

/* ─── Reusable Card Section ───────────────────────────────────────── */
const Section = ({ title, subtitle, icon: Icon, iconColor, stripe, action, children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}
    style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border)',
      borderRadius: 20,
      overflow: 'hidden',
      boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
    }}
  >
    {stripe && <div style={{ height: 3, background: stripe, borderRadius: '20px 20px 0 0' }} />}
    <div
      style={{
        padding: '16px 22px 14px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background: `${iconColor}14`,
            border: `1px solid ${iconColor}22`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={18} style={{ color: iconColor }} />
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em', margin: 0 }}>
            {title}
          </p>
          {subtitle && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, margin: 0 }}>{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
    <div style={{ padding: '20px 22px 24px' }}>{children}</div>
  </motion.div>
);

export default function AdminApiKeysPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [configData, setConfigData] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [error, setError] = useState(null);

  // Modals state
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePhrase, setDeletePhrase] = useState('');
  const [deleteStepUpOpen, setDeleteStepUpOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Draft & Model Assignment state
  const [taskAssignments, setTaskAssignments] = useState({});
  const [draftNote, setDraftNote] = useState('');
  const [testingDraft, setTestingDraft] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [activeDraftVersion, setActiveDraftVersion] = useState(null);

  // Activation state
  const [activateModalOpen, setActivateModalOpen] = useState(false);
  const [activatePhrase, setActivatePhrase] = useState('');
  const [ackInconclusive, setAckInconclusive] = useState(false);
  const [activateStepUpOpen, setActivateStepUpOpen] = useState(false);
  const [activating, setActivating] = useState(false);

  // Rollback state
  const [rollbackModalOpen, setRollbackModalOpen] = useState(false);
  const [rollbackTargetVersion, setRollbackTargetVersion] = useState(null);
  const [rollbackPhrase, setRollbackPhrase] = useState('');
  const [rollbackReason, setRollbackReason] = useState('');
  const [rollbackStepUpOpen, setRollbackStepUpOpen] = useState(false);
  const [rollingBack, setRollingBack] = useState(false);

  // Rechecking connection state
  const [rechecking, setRechecking] = useState(false);

  /* ─── Fetch Configuration & History ───────────────────────────── */
  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const [configRes, historyRes] = await Promise.all([
        adminService.getAIConfig(),
        adminService.getAIConfigHistory(20).catch(() => ({ data: { history: [] } })),
      ]);

      const cfg = configRes.data || {};
      setConfigData(cfg);
      setHistoryList(historyRes.data?.history || []);

      // Initialize task assignments from current active configuration
      const currentTasks = cfg.effective_config?.tasks || {};
      const initialMap = {};
      Object.keys(TASK_METADATA).forEach((taskKey) => {
        initialMap[taskKey] = {
          provider: currentTasks[taskKey]?.provider || 'gemini',
          model: currentTasks[taskKey]?.model || TASK_METADATA[taskKey].defaultModel,
        };
      });
      setTaskAssignments(initialMap);
    } catch (err) {
      console.error('[AdminApiKeysPage] Failed to fetch configuration:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load AI configuration.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ─── Recheck Credential ──────────────────────────────────────── */
  const handleRecheck = async () => {
    setRechecking(true);
    try {
      const res = await adminService.recheckAICredential('gemini');
      toast.success(res.data?.message || 'Connection verified successfully.');
      await fetchData(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Health probe failed.');
    } finally {
      setRechecking(false);
    }
  };

  /* ─── Delete Credential Flow ──────────────────────────────────── */
  const handleDeleteKeySubmit = (e) => {
    e.preventDefault();
    if (deletePhrase.trim() !== 'DELETE_CREDENTIAL_GEMINI') {
      toast.error("Please enter the exact confirmation phrase 'DELETE_CREDENTIAL_GEMINI'.");
      return;
    }
    setDeleteStepUpOpen(true);
  };

  const handleDeleteStepUpSuccess = async (stepUpToken) => {
    setDeleteStepUpOpen(false);
    setDeleting(true);
    try {
      await adminService.deleteAICredential('gemini', deletePhrase.trim(), stepUpToken);
      toast.success('Stored credential deleted. AI service reverted to fallback environment key.');
      setDeleteModalOpen(false);
      setDeletePhrase('');
      await fetchData(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete credential.');
    } finally {
      setDeleting(false);
    }
  };

  /* ─── Draft Creation & Test Runner Flow ───────────────────────── */
  const handleValidateDraft = async () => {
    setTestingDraft(true);
    setTestResults(null);
    try {
      // 1. Create draft
      const draftRes = await adminService.createAIDraft(taskAssignments, draftNote || 'Model validation draft');
      const draftVer = draftRes.data?.version;
      setActiveDraftVersion(draftVer);

      toast.success(`Draft v${draftVer} created. Running capability and latency test suite...`);

      // 2. Run automated test
      const testRes = await adminService.testAIDraft(draftVer);
      setTestResults(testRes.data);

      if (testRes.data?.overall_status === 'PASSED') {
        toast.success('All task tests passed. Ready for activation.');
      } else if (testRes.data?.overall_status === 'INCONCLUSIVE') {
        toast('Draft tests inconclusive due to provider rate limit/quota. Acknowledgment required to activate.', {
          icon: '⚠️',
        });
      } else {
        toast.error('One or more task tests failed. Review test output.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Draft validation failed.');
    } finally {
      setTestingDraft(false);
    }
  };

  /* ─── Activation Flow ─────────────────────────────────────────── */
  const handleOpenActivate = () => {
    if (!activeDraftVersion) {
      toast.error('Please validate and test a draft before activating.');
      return;
    }
    setActivatePhrase('');
    setActivateModalOpen(true);
  };

  const handleActivateSubmit = (e) => {
    e.preventDefault();
    const expected = `CONFIRM_ACTIVATE_VERSION_${activeDraftVersion}`;
    if (activatePhrase.trim() !== expected) {
      toast.error(`Confirmation phrase must exactly match '${expected}'.`);
      return;
    }
    if (testResults?.overall_status === 'INCONCLUSIVE' && !ackInconclusive) {
      toast.error('Please acknowledge inconclusive provider responses before activating.');
      return;
    }
    setActivateStepUpOpen(true);
  };

  const handleActivateStepUpSuccess = async (stepUpToken) => {
    setActivateStepUpOpen(false);
    setActivating(true);
    try {
      await adminService.activateAIConfig(
        {
          version: activeDraftVersion,
          expected_active_version: configData?.active_version || 1,
          acknowledge_inconclusive: ackInconclusive,
          confirmation_phrase: activatePhrase.trim(),
          note: draftNote,
        },
        stepUpToken
      );

      toast.success(`Configuration v${activeDraftVersion} is now LIVE in production!`);
      setActivateModalOpen(false);
      setTestResults(null);
      setActiveDraftVersion(null);
      setDraftNote('');
      await fetchData(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Activation failed.');
    } finally {
      setActivating(false);
    }
  };

  /* ─── Rollback Flow ───────────────────────────────────────────── */
  const handleOpenRollback = (ver) => {
    setRollbackTargetVersion(ver);
    setRollbackPhrase('');
    setRollbackReason('');
    setRollbackModalOpen(true);
  };

  const handleRollbackSubmit = (e) => {
    e.preventDefault();
    if (rollbackPhrase.trim() !== 'CONFIRM_ROLLBACK') {
      toast.error("Confirmation phrase must exactly match 'CONFIRM_ROLLBACK'.");
      return;
    }
    setRollbackStepUpOpen(true);
  };

  const handleRollbackStepUpSuccess = async (stepUpToken) => {
    setRollbackStepUpOpen(false);
    setRollingBack(true);
    try {
      await adminService.rollbackAIConfig(
        {
          target_version: rollbackTargetVersion,
          expected_active_version: configData?.active_version,
          confirmation_phrase: rollbackPhrase.trim(),
          reason: rollbackReason,
        },
        stepUpToken
      );

      toast.success(`Emergency rollback to version v${rollbackTargetVersion} executed successfully.`);
      setRollbackModalOpen(false);
      await fetchData(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rollback failed.');
    } finally {
      setRollingBack(false);
    }
  };

  /* ─── Render Loading / Error States ───────────────────────────── */
  if (loading) {
    return (
      <div style={{ background: 'var(--bg-base)', minHeight: '100vh', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <RefreshCw size={28} className="animate-spin" style={{ color: '#818cf8', marginBottom: 16 }} />
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', margin: 0 }}>
          Connecting to AI Configuration Vault...
        </p>
      </div>
    );
  }

  const catalog = configData?.catalog || [
    { model_id: 'gemini-2.5-flash', display_name: 'Gemini 2.5 Flash (Recommended)' },
    { model_id: 'gemini-2.0-flash', display_name: 'Gemini 2.0 Flash' },
    { model_id: 'gemini-1.5-flash', display_name: 'Gemini 1.5 Flash' },
  ];

  const geminiCred = configData?.credentials_summary?.gemini || {
    status: 'ENV_DEFAULT',
    last4: null,
    fingerprint: null,
    circuit_breaker: 'HEALTHY',
  };

  const activeVersion = configData?.active_version || 1;
  const configSource = configData?.effective_config?.effective_source || 'db';

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100%', paddingBottom: 60 }}>
      {/* ── Top Hero Banner ─────────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(150deg, #1e1b4b 0%, #0f0d2e 55%, #13103a 100%)',
          padding: 'clamp(24px, 4vw, 36px) clamp(16px, 4vw, 40px)',
          borderBottom: '1px solid rgba(99, 102, 241, 0.20)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(rgba(99,102,241,0.12) 1.5px, transparent 1.5px)',
            backgroundSize: '24px 24px',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 960, margin: '0 auto', width: '100%' }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'rgba(129,140,248,0.95)',
                    background: 'rgba(99,102,241,0.18)',
                    padding: '4px 12px',
                    borderRadius: 999,
                    border: '1px solid rgba(99,102,241,0.30)',
                  }}
                >
                  <Key size={11} /> AI Provider Vault
                </span>

                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#10b981',
                    background: 'rgba(16,185,129,0.12)',
                    padding: '4px 10px',
                    borderRadius: 999,
                    border: '1px solid rgba(16,185,129,0.25)',
                  }}
                >
                  <Activity size={11} /> Version v{activeVersion} LIVE ({configSource.toUpperCase()})
                </span>

                {geminiCred.circuit_breaker === 'HEALTHY' ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#34d399',
                      background: 'rgba(52,211,153,0.10)',
                      padding: '4px 10px',
                      borderRadius: 999,
                      border: '1px solid rgba(52,211,153,0.20)',
                    }}
                  >
                    <CheckCircle2 size={11} /> Gemini Breaker: Healthy
                  </span>
                ) : (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#f87171',
                      background: 'rgba(239,68,68,0.14)',
                      padding: '4px 10px',
                      borderRadius: 999,
                      border: '1px solid rgba(239,68,68,0.30)',
                    }}
                  >
                    <AlertTriangle size={11} /> Gemini Breaker: Cooldown Active
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => fetchData(true)}
                disabled={refreshing}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 700,
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.16)',
                  color: '#fff',
                  cursor: refreshing ? 'not-allowed' : 'pointer',
                }}
              >
                <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
                Refresh State
              </button>
            </div>

            <h1 style={{ fontSize: 'clamp(22px, 3.5vw, 28px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', margin: '0 0 8px' }}>
              AI Provider & Model Settings
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(196,200,255,0.70)', margin: 0, maxWidth: 680, lineHeight: 1.55 }}>
              Provision encrypted organization API credentials, configure task-to-model assignments with automated test validation, and manage audited configuration releases with instant rollback.
            </p>
          </motion.div>
        </div>
      </div>

      {/* ── Main Content Container ───────────────────────────────── */}
      <div
        style={{
          maxWidth: 960,
          margin: '0 auto',
          padding: 'clamp(20px, 3vw, 28px) clamp(16px, 4vw, 40px) 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 22,
          boxSizing: 'border-box',
          width: '100%',
        }}
      >
        {/* Error notification if any */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 18px',
              borderRadius: 14,
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.25)',
              color: 'var(--text-primary)',
            }}
          >
            <AlertCircle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
            <p style={{ fontSize: 13, margin: 0 }}>{error}</p>
          </div>
        )}

        {/* ── SECTION 1: Provider Credentials Vault ─────────────── */}
        <Section
          title="AI Provider Credentials"
          subtitle="Encrypted credential storage with circuit-breaker protection"
          icon={Key}
          iconColor="#60a5fa"
          stripe="linear-gradient(90deg, #3b82f6, #60a5fa, #818cf8)"
          delay={0.05}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
            {/* Google Gemini Card (Fully implemented) */}
            <div
              style={{
                padding: '16px 18px',
                borderRadius: 16,
                background: 'var(--card-row-bg)',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#60a5fa' }}>Google Gemini</span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 999,
                      background: 'rgba(96,165,250,0.14)',
                      color: '#60a5fa',
                      border: '1px solid rgba(96,165,250,0.25)',
                    }}
                  >
                    Implemented
                  </span>
                </div>

                {geminiCred.status === 'CONFIGURED' ? (
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle2 size={13} /> Vault Key
                  </span>
                ) : (
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Info size={13} /> Env Fallback
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, background: 'var(--bg-base)', padding: '10px 12px', borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Masked Key:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {geminiCred.last4 ? `••••••••••••${geminiCred.last4}` : 'Default System Key'}
                  </span>
                </div>
                {geminiCred.fingerprint && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                    <span style={{ color: 'var(--text-muted)' }}>SHA-256 Fingerprint:</span>
                    <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                      {geminiCred.fingerprint}
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Circuit Breaker:</span>
                  <span style={{ fontWeight: 700, color: geminiCred.circuit_breaker === 'HEALTHY' ? '#10b981' : '#ef4444' }}>
                    {geminiCred.circuit_breaker}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8, marginTop: 'auto', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setUpdateModalOpen(true)}
                  style={{
                    flex: 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '8px 12px',
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #3b82f6, #4f46e5)',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  <Key size={13} /> Update Key
                </button>

                <button
                  type="button"
                  onClick={handleRecheck}
                  disabled={rechecking}
                  title="Run active health probe test"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px 12px',
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 700,
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                    cursor: rechecking ? 'not-allowed' : 'pointer',
                  }}
                >
                  <RefreshCw size={13} className={rechecking ? 'animate-spin' : ''} />
                </button>

                {geminiCred.status === 'CONFIGURED' && (
                  <button
                    type="button"
                    onClick={() => {
                      setDeletePhrase('');
                      setDeleteModalOpen(true);
                    }}
                    title="Remove vault key and revert to environment fallback"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '8px 12px',
                      borderRadius: 10,
                      fontSize: 12,
                      fontWeight: 700,
                      background: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.20)',
                      color: '#ef4444',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* OpenAI Card (Scope v1 strictly: Not available yet) */}
            <div
              style={{
                padding: '16px 18px',
                borderRadius: 16,
                background: 'var(--card-row-bg)',
                border: '1px solid var(--border)',
                opacity: 0.72,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>OpenAI</span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: 'rgba(156,163,175,0.12)',
                    color: 'var(--text-muted)',
                    border: '1px solid rgba(156,163,175,0.25)',
                  }}
                >
                  Not available yet
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                Adapter contract in progress. Unlocks when provider contract tests pass in future release.
              </p>
              <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                <button
                  type="button"
                  disabled
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 600,
                    background: 'transparent',
                    border: '1px dashed var(--border)',
                    color: 'var(--text-muted)',
                    cursor: 'not-allowed',
                  }}
                >
                  Planned in Scope v2
                </button>
              </div>
            </div>

            {/* Anthropic Claude Card (Not available yet) */}
            <div
              style={{
                padding: '16px 18px',
                borderRadius: 16,
                background: 'var(--card-row-bg)',
                border: '1px solid var(--border)',
                opacity: 0.72,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Anthropic Claude</span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: 'rgba(156,163,175,0.12)',
                    color: 'var(--text-muted)',
                    border: '1px solid rgba(156,163,175,0.25)',
                  }}
                >
                  Not available yet
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                Claude 3.5 Sonnet adapter architecture pending contract verification.
              </p>
              <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                <button
                  type="button"
                  disabled
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 600,
                    background: 'transparent',
                    border: '1px dashed var(--border)',
                    color: 'var(--text-muted)',
                    cursor: 'not-allowed',
                  }}
                >
                  Planned in Scope v2
                </button>
              </div>
            </div>

            {/* Cohere Card (Not available yet) */}
            <div
              style={{
                padding: '16px 18px',
                borderRadius: 16,
                background: 'var(--card-row-bg)',
                border: '1px solid var(--border)',
                opacity: 0.72,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Cohere</span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: 'rgba(156,163,175,0.12)',
                    color: 'var(--text-muted)',
                    border: '1px solid rgba(156,163,175,0.25)',
                  }}
                >
                  Not available yet
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                Embed and Rerank specialized models adapter pending verification.
              </p>
              <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                <button
                  type="button"
                  disabled
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 600,
                    background: 'transparent',
                    border: '1px dashed var(--border)',
                    color: 'var(--text-muted)',
                    cursor: 'not-allowed',
                  }}
                >
                  Planned in Scope v2
                </button>
              </div>
            </div>
          </div>
        </Section>

        {/* ── SECTION 2: Task-to-Model Assignment Matrix ────────── */}
        <Section
          title="Task-to-Model Assignments & Testing"
          subtitle="Configure which verified LLM powers each AI subsystem"
          icon={Cpu}
          iconColor="#818cf8"
          stripe="linear-gradient(90deg, #4f46e5, #818cf8, #22d3ee)"
          delay={0.10}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {Object.entries(TASK_METADATA).map(([taskKey, meta]) => {
              const currentAssignment = taskAssignments[taskKey] || { provider: 'gemini', model: meta.defaultModel };

              return (
                <div
                  key={taskKey}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 14,
                    background: 'var(--card-row-bg)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 14,
                  }}
                >
                  <div style={{ flex: '1 1 320px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: '2px 7px',
                          borderRadius: 6,
                          background: `${meta.badgeColor}18`,
                          color: meta.badgeColor,
                          border: `1px solid ${meta.badgeColor}33`,
                        }}
                      >
                        {taskKey}
                      </span>
                      <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                        {meta.label}
                      </p>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
                      {meta.description}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, fontSize: 10, color: 'var(--text-muted)' }}>
                      <span>Temp: {meta.temp}</span>
                      <span>•</span>
                      <span>Timeout: {meta.timeout}</span>
                      <span>•</span>
                      <span>Retries: {meta.retries}</span>
                      <span>•</span>
                      <span style={{ color: '#10b981' }}>Structured: JSON Schema</span>
                    </div>
                  </div>

                  {/* Model selector */}
                  <div style={{ minWidth: 240, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>
                      Assigned Model:
                    </label>
                    <select
                      value={currentAssignment.model}
                      onChange={(e) => {
                        const newModel = e.target.value;
                        setTaskAssignments((prev) => ({
                          ...prev,
                          [taskKey]: { provider: 'gemini', model: newModel },
                        }));
                        // Invalidate previous test results on edit
                        setTestResults(null);
                        setActiveDraftVersion(null);
                      }}
                      style={{
                        padding: '9px 12px',
                        borderRadius: 10,
                        fontSize: 12,
                        fontWeight: 600,
                        background: 'var(--bg-base)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      {catalog.map((m) => (
                        <option key={m.model_id} value={m.model_id}>
                          {m.display_name || m.model_id}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}

            {/* Note & Action buttons row */}
            <div
              style={{
                marginTop: 10,
                padding: '16px',
                borderRadius: 14,
                background: 'var(--bg-base)',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Release Notes / Change Justification:
                </label>
                <input
                  type="text"
                  value={draftNote}
                  onChange={(e) => setDraftNote(e.target.value)}
                  placeholder="e.g. Upgrading resume parser and question generator to Gemini 2.5 Flash"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    fontSize: 12,
                    background: 'var(--card-row-bg)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleValidateDraft}
                  disabled={testingDraft}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 18px',
                    borderRadius: 12,
                    fontSize: 13,
                    fontWeight: 700,
                    background: 'rgba(99,102,241,0.12)',
                    border: '1px solid rgba(99,102,241,0.30)',
                    color: '#818cf8',
                    cursor: testingDraft ? 'not-allowed' : 'pointer',
                  }}
                >
                  {testingDraft ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Running Golden Task Tests...
                    </>
                  ) : (
                    <>
                      <Zap size={14} /> Validate & Test Model Configuration
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleOpenActivate}
                  disabled={!activeDraftVersion || testingDraft}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 20px',
                    borderRadius: 12,
                    fontSize: 13,
                    fontWeight: 800,
                    background: activeDraftVersion
                      ? 'linear-gradient(135deg, #10b981, #059669)'
                      : 'rgba(255,255,255,0.06)',
                    border: 'none',
                    color: activeDraftVersion ? '#fff' : 'var(--text-muted)',
                    cursor: activeDraftVersion ? 'pointer' : 'not-allowed',
                    boxShadow: activeDraftVersion ? '0 2px 14px rgba(16,185,129,0.35)' : 'none',
                  }}
                >
                  <CheckCircle2 size={15} /> Activate Configuration v{activeDraftVersion || ''}
                </button>
              </div>

              {/* Live Test Results Card */}
              {testResults && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  style={{
                    marginTop: 8,
                    padding: '14px 16px',
                    borderRadius: 12,
                    background: testResults.overall_status === 'PASSED'
                      ? 'rgba(16,185,129,0.08)'
                      : testResults.overall_status === 'INCONCLUSIVE'
                      ? 'rgba(245,158,11,0.08)'
                      : 'rgba(239,68,68,0.08)',
                    border: `1px solid ${
                      testResults.overall_status === 'PASSED'
                        ? 'rgba(16,185,129,0.25)'
                        : testResults.overall_status === 'INCONCLUSIVE'
                        ? 'rgba(245,158,11,0.25)'
                        : 'rgba(239,68,68,0.25)'
                    }`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
                      Automated Task Test Results (Draft v{activeDraftVersion}):
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        padding: '3px 10px',
                        borderRadius: 999,
                        background: testResults.overall_status === 'PASSED' ? '#10b981' : testResults.overall_status === 'INCONCLUSIVE' ? '#f59e0b' : '#ef4444',
                        color: '#fff',
                      }}
                    >
                      STATUS: {testResults.overall_status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {Object.entries(testResults.task_results || {}).map(([task, res]) => (
                      <div
                        key={task}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: 12,
                          padding: '6px 10px',
                          borderRadius: 8,
                          background: 'var(--bg-elevated)',
                        }}
                      >
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{task}:</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                            {res.latency_ms ? `${Math.round(res.latency_ms)}ms` : ''}
                          </span>
                          <span
                            style={{
                              fontWeight: 700,
                              color: res.status === 'PASSED' ? '#10b981' : res.status === 'INCONCLUSIVE' ? '#f59e0b' : '#ef4444',
                            }}
                          >
                            {res.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </Section>

        {/* ── SECTION 3: Version History & Emergency Rollback ───── */}
        <Section
          title="Configuration Audit & Rollback"
          subtitle="Immutable version registry and single-click emergency rollback"
          icon={Clock}
          iconColor="#a78bfa"
          stripe="linear-gradient(90deg, #818cf8, #a78bfa, #f472b6)"
          delay={0.15}
        >
          {historyList.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
              No previous configuration versions found in registry.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {historyList.map((ver) => {
                const isCurrent = ver.version === activeVersion;
                return (
                  <div
                    key={ver.version}
                    style={{
                      padding: '12px 16px',
                      borderRadius: 14,
                      background: isCurrent ? 'rgba(99,102,241,0.06)' : 'var(--card-row-bg)',
                      border: `1px solid ${isCurrent ? 'rgba(99,102,241,0.30)' : 'var(--border)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 900,
                          padding: '3px 8px',
                          borderRadius: 8,
                          background: isCurrent ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
                          color: isCurrent ? '#10b981' : 'var(--text-secondary)',
                          border: `1px solid ${isCurrent ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
                        }}
                      >
                        v{ver.version}
                      </span>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                            {ver.note || `Configuration Release v${ver.version}`}
                          </span>
                          {isCurrent && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 800,
                                padding: '2px 6px',
                                borderRadius: 999,
                                background: '#10b981',
                                color: '#fff',
                              }}
                            >
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          Author: Admin #{ver.created_by || '1'} • {new Date(ver.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {!isCurrent && (
                      <button
                        type="button"
                        onClick={() => handleOpenRollback(ver.version)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 12px',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          background: 'rgba(239,68,68,0.08)',
                          border: '1px solid rgba(239,68,68,0.22)',
                          color: '#ef4444',
                          cursor: 'pointer',
                        }}
                      >
                        <RotateCcw size={12} /> Rollback to v{ver.version}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        {/* ── SECTION 4: Security Architecture Notice ───────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.20 }}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
            padding: '16px 20px',
            borderRadius: 16,
            background: 'rgba(99,102,241,0.06)',
            border: '1px solid rgba(99,102,241,0.20)',
          }}
        >
          <Shield size={20} style={{ color: '#818cf8', flexShrink: 0, marginTop: 2 }} />
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>
              Security Architecture & Isolation Policy
            </h4>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              All keys are encrypted at rest with AES-256-GCM under master secret isolation in MongoDB. Microservice commands are signed with HMAC-SHA256, strictly rejecting replayed nonces and clock drift over 60 seconds. Every sensitive key modification or release activation triggers single-use step-up MFA and dispatches security alert notifications to all active administrators.
            </p>
          </div>
        </motion.div>
      </div>

      {/* ── UPDATE KEY MODAL ────────────────────────────────────── */}
      <UpdateKeyModal
        isOpen={updateModalOpen}
        onClose={() => setUpdateModalOpen(false)}
        provider="gemini"
        providerDisplayName="Google Gemini"
        onSuccess={() => {
          toast.success('Google Gemini API key encrypted and stored in vault.');
          fetchData(true);
        }}
      />

      {/* ── DELETE KEY CONFIRMATION MODAL ───────────────────────── */}
      <AnimatePresence>
        {deleteModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9990,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
              background: 'rgba(5, 5, 15, 0.75)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                width: '100%',
                maxWidth: 440,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 20,
                overflow: 'hidden',
                boxShadow: '0 20px 48px rgba(0, 0, 0, 0.35)',
              }}
            >
              <div style={{ height: 4, background: '#ef4444' }} />
              <div style={{ padding: '20px 24px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <AlertTriangle size={20} style={{ color: '#ef4444' }} />
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Delete Stored Gemini Key
                  </h3>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 16px' }}>
                  This will purge the encrypted Gemini key from the vault. The AI service will fall back to its environment key.
                </p>
                <form onSubmit={handleDeleteKeySubmit}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                    Type <code style={{ color: '#ef4444' }}>DELETE_CREDENTIAL_GEMINI</code> to confirm:
                  </label>
                  <input
                    type="text"
                    value={deletePhrase}
                    onChange={(e) => setDeletePhrase(e.target.value)}
                    placeholder="DELETE_CREDENTIAL_GEMINI"
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      fontSize: 12,
                      background: 'var(--card-row-bg)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      boxSizing: 'border-box',
                      marginBottom: 18,
                    }}
                  />
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => setDeleteModalOpen(false)}
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
                      disabled={deleting || deletePhrase.trim() !== 'DELETE_CREDENTIAL_GEMINI'}
                      style={{
                        padding: '10px 18px',
                        borderRadius: 12,
                        fontSize: 13,
                        fontWeight: 800,
                        background: '#ef4444',
                        border: 'none',
                        color: '#fff',
                        cursor: (deleting || deletePhrase.trim() !== 'DELETE_CREDENTIAL_GEMINI') ? 'not-allowed' : 'pointer',
                        opacity: (deleting || deletePhrase.trim() !== 'DELETE_CREDENTIAL_GEMINI') ? 0.6 : 1,
                      }}
                    >
                      {deleting ? (
                        <>
                          <Loader2 size={13} className="animate-spin" /> Deleting...
                        </>
                      ) : (
                        'Continue to Step-Up'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <StepUpAuthModal
        isOpen={deleteStepUpOpen}
        onClose={() => setDeleteStepUpOpen(false)}
        actionType="DELETE_CREDENTIAL"
        actionTitle="Authorize Key Deletion"
        actionDescription="Enter your administrator password to authorize permanently removing this credential."
        onSuccess={handleDeleteStepUpSuccess}
      />

      {/* ── ACTIVATE CONFIG MODAL ───────────────────────────────── */}
      <AnimatePresence>
        {activateModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9990,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
              background: 'rgba(5, 5, 15, 0.75)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                width: '100%',
                maxWidth: 460,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 20,
                overflow: 'hidden',
                boxShadow: '0 20px 48px rgba(0, 0, 0, 0.35)',
              }}
            >
              <div style={{ height: 4, background: '#10b981' }} />
              <div style={{ padding: '20px 24px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <CheckCircle2 size={20} style={{ color: '#10b981' }} />
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Activate Configuration v{activeDraftVersion}
                  </h3>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 14px' }}>
                  This will promote Draft v{activeDraftVersion} to the live active production configuration. All subsequent resume parses, interview evaluations, and candidate rankings will dynamically resolve to these models.
                </p>

                {testResults?.overall_status === 'INCONCLUSIVE' && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      padding: '12px',
                      borderRadius: 10,
                      background: 'rgba(245,158,11,0.12)',
                      border: '1px solid rgba(245,158,11,0.25)',
                      marginBottom: 14,
                    }}
                  >
                    <input
                      id="ack-inc-checkbox"
                      type="checkbox"
                      checked={ackInconclusive}
                      onChange={(e) => setAckInconclusive(e.target.checked)}
                      style={{ marginTop: 2, cursor: 'pointer' }}
                    />
                    <label htmlFor="ack-inc-checkbox" style={{ fontSize: 12, color: 'var(--text-primary)', cursor: 'pointer' }}>
                      I acknowledge that provider rate limits yielded inconclusive capability tests and I accept activating this release.
                    </label>
                  </div>
                )}

                <form onSubmit={handleActivateSubmit}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                    Type <code style={{ color: '#10b981' }}>CONFIRM_ACTIVATE_VERSION_{activeDraftVersion}</code>:
                  </label>
                  <input
                    type="text"
                    value={activatePhrase}
                    onChange={(e) => setActivatePhrase(e.target.value)}
                    placeholder={`CONFIRM_ACTIVATE_VERSION_${activeDraftVersion}`}
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      fontSize: 12,
                      background: 'var(--card-row-bg)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      boxSizing: 'border-box',
                      marginBottom: 18,
                    }}
                  />
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => setActivateModalOpen(false)}
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
                      disabled={
                        activating ||
                        activatePhrase.trim() !== `CONFIRM_ACTIVATE_VERSION_${activeDraftVersion}` ||
                        (testResults?.overall_status === 'INCONCLUSIVE' && !ackInconclusive)
                      }
                      style={{
                        padding: '10px 18px',
                        borderRadius: 12,
                        fontSize: 13,
                        fontWeight: 800,
                        background: '#10b981',
                        border: 'none',
                        color: '#fff',
                        cursor: (
                          activating ||
                          activatePhrase.trim() !== `CONFIRM_ACTIVATE_VERSION_${activeDraftVersion}` ||
                          (testResults?.overall_status === 'INCONCLUSIVE' && !ackInconclusive)
                        ) ? 'not-allowed' : 'pointer',
                        opacity: (
                          activating ||
                          activatePhrase.trim() !== `CONFIRM_ACTIVATE_VERSION_${activeDraftVersion}` ||
                          (testResults?.overall_status === 'INCONCLUSIVE' && !ackInconclusive)
                        ) ? 0.6 : 1,
                      }}
                    >
                      {activating ? (
                        <>
                          <Loader2 size={13} className="animate-spin" /> Activating...
                        </>
                      ) : (
                        'Continue to Step-Up'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <StepUpAuthModal
        isOpen={activateStepUpOpen}
        onClose={() => setActivateStepUpOpen(false)}
        actionType="ACTIVATE_CONFIG"
        actionTitle="Authorize Production Release"
        actionDescription={`Enter your administrator password to authorize activating Configuration v${activeDraftVersion}.`}
        onSuccess={handleActivateStepUpSuccess}
      />

      {/* ── ROLLBACK CONFIG MODAL ───────────────────────────────── */}
      <AnimatePresence>
        {rollbackModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9990,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
              background: 'rgba(5, 5, 15, 0.75)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                width: '100%',
                maxWidth: 460,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 20,
                overflow: 'hidden',
                boxShadow: '0 20px 48px rgba(0, 0, 0, 0.35)',
              }}
            >
              <div style={{ height: 4, background: '#ef4444' }} />
              <div style={{ padding: '20px 24px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <RotateCcw size={20} style={{ color: '#ef4444' }} />
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Emergency Rollback to Version v{rollbackTargetVersion}
                  </h3>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 14px' }}>
                  This will immediately revert production AI tasks to the exact model state defined in version v{rollbackTargetVersion}.
                </p>

                <form onSubmit={handleRollbackSubmit}>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                      Rollback Incident Reason:
                    </label>
                    <input
                      type="text"
                      value={rollbackReason}
                      onChange={(e) => setRollbackReason(e.target.value)}
                      placeholder="e.g. Model latency degradation or schema parse errors"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: 10,
                        fontSize: 12,
                        background: 'var(--card-row-bg)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                    Type <code style={{ color: '#ef4444' }}>CONFIRM_ROLLBACK</code>:
                  </label>
                  <input
                    type="text"
                    value={rollbackPhrase}
                    onChange={(e) => setRollbackPhrase(e.target.value)}
                    placeholder="CONFIRM_ROLLBACK"
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      fontSize: 12,
                      background: 'var(--card-row-bg)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      boxSizing: 'border-box',
                      marginBottom: 18,
                    }}
                  />

                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => setRollbackModalOpen(false)}
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
                      disabled={rollingBack || rollbackPhrase.trim() !== 'CONFIRM_ROLLBACK'}
                      style={{
                        padding: '10px 18px',
                        borderRadius: 12,
                        fontSize: 13,
                        fontWeight: 800,
                        background: '#ef4444',
                        border: 'none',
                        color: '#fff',
                        cursor: (rollingBack || rollbackPhrase.trim() !== 'CONFIRM_ROLLBACK') ? 'not-allowed' : 'pointer',
                        opacity: (rollingBack || rollbackPhrase.trim() !== 'CONFIRM_ROLLBACK') ? 0.6 : 1,
                      }}
                    >
                      {rollingBack ? (
                        <>
                          <Loader2 size={13} className="animate-spin" /> Rolling Back...
                        </>
                      ) : (
                        'Continue to Step-Up'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <StepUpAuthModal
        isOpen={rollbackStepUpOpen}
        onClose={() => setRollbackStepUpOpen(false)}
        actionType="ROLLBACK_CONFIG"
        actionTitle="Authorize Emergency Rollback"
        actionDescription={`Enter your administrator password to authorize rolling back configuration to v${rollbackTargetVersion}.`}
        onSuccess={handleRollbackStepUpSuccess}
      />
    </div>
  );
}
