import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, User, Mail, Shield, CheckCircle, Clock, AlertTriangle,
  Briefcase, FileText, Calendar, ExternalLink, Trash2, RefreshCw,
  Check, ShieldAlert,
} from 'lucide-react';
import toast from 'react-hot-toast';
import adminService from '../../services/adminService';

const ROLE_CFG = {
  RECRUITER: { bg: 'rgba(129,140,248,0.12)', color: '#818cf8', border: 'rgba(129,140,248,0.28)', label: 'Recruiter' },
  CANDIDATE: { bg: 'rgba(34,211,238,0.12)',  color: '#22d3ee', border: 'rgba(34,211,238,0.28)',  label: 'Candidate' },
  ADMIN:     { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b', border: 'rgba(245,158,11,0.28)',  label: 'Admin' },
};

export default function AdminUserDetailModal({
  isOpen,
  userId,
  onClose,
  onUserUpdated,
}) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
      fetchDetail();
    } else {
      setDetail(null);
      setError(null);
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
    }
  }, [isOpen, userId]);

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getUserDetail(userId);
      setDetail(res?.data?.data ?? res?.data);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load user details';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!detail || actionLoading) return;
    setActionLoading(true);
    try {
      const nextActive = !detail.isActive;
      await adminService.updateUserStatus(detail.id, nextActive);
      setDetail(prev => ({ ...prev, isActive: nextActive }));
      toast.success(`User ${nextActive ? 'activated' : 'deactivated'} successfully`);
      if (onUserUpdated) onUserUpdated();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveRecruiter = async () => {
    if (!detail || actionLoading) return;
    setActionLoading(true);
    try {
      await adminService.approveRecruiter(detail.id);
      setDetail(prev => ({ ...prev, adminApproved: true }));
      toast.success('Recruiter account approved!');
      if (onUserUpdated) onUserUpdated();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve recruiter');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTogglePrivilege = async (privKey) => {
    if (!detail || actionLoading) return;
    setActionLoading(true);
    try {
      const payload = {};
      if (privKey === 'canPostJobs') {
        payload.canPostJobs = !detail.canPostJobs;
      } else if (privKey === 'canApplyToJobs') {
        payload.canApplyToJobs = !detail.canApplyToJobs;
      }
      await adminService.updateUserPrivileges(detail.id, payload);
      setDetail(prev => ({ ...prev, ...payload }));
      toast.success('User privileges updated');
      if (onUserUpdated) onUserUpdated();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update privileges');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!detail || deleting) return;
    if (deleteConfirmText.trim().toLowerCase() !== detail.email.toLowerCase()) {
      toast.error(`Please type "${detail.email}" exactly to confirm.`);
      return;
    }

    setDeleting(true);
    try {
      await adminService.deleteUser(detail.id);
      toast.success(`Account for ${detail.name || detail.email} has been permanently deleted.`);
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
      onClose();
      if (onUserUpdated) onUserUpdated();
    } catch (err) {
      console.error('[AdminUserDetail] Deletion failed:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to delete user account';
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen) return null;

  const roleMeta = detail ? ROLE_CFG[detail.role] || ROLE_CFG.CANDIDATE : ROLE_CFG.CANDIDATE;

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
          display: 'flex',
          justifyContent: 'flex-end',
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(6px)',
        }}
      >
        {/* Backdrop click */}
        <div onClick={onClose} style={{ position: 'absolute', inset: 0 }} />

        {/* Slide-over Drawer */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: 620,
            height: '100%',
            background: 'var(--bg-elevated)',
            borderLeft: '1px solid var(--border)',
            boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.50)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1,
            color: 'var(--text-primary)',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'rgba(99, 102, 241, 0.14)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#818cf8',
                }}
              >
                <User size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>User Details</h3>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                  Account inspection & management
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              type="button"
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'var(--card-row-bg)',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Body Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 12 }}>
                <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading user activity details…</p>
              </div>
            ) : error ? (
              <div style={{ padding: '16px 20px', borderRadius: 14, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171' }}>
                <p style={{ fontWeight: 700, margin: '0 0 4px' }}>Error loading user details</p>
                <p style={{ fontSize: 12, margin: 0 }}>{error}</p>
              </div>
            ) : detail ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* 1. Identity Card */}
                <div
                  style={{
                    padding: '18px 20px',
                    borderRadius: 16,
                    background: 'var(--card-row-bg)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 14,
                      background: 'linear-gradient(135deg, #3D5016, #6B8A3A)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: 20,
                      fontWeight: 900,
                      flexShrink: 0,
                    }}
                  >
                    {detail.name ? detail.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <h4 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                        {detail.name}
                      </h4>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: 999,
                          background: roleMeta.bg,
                          color: roleMeta.color,
                          border: `1px solid ${roleMeta.border}`,
                        }}
                      >
                        {roleMeta.label}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 8px', wordBreak: 'break-all' }}>
                      {detail.email}
                    </p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {detail.isActive ? (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(74,222,128,0.12)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.30)' }}>
                          ● Active
                        </span>
                      ) : (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.30)' }}>
                          ● Disabled
                        </span>
                      )}

                      {detail.emailVerified ? (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' }}>
                          ✓ Email Verified
                        </span>
                      ) : (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)' }}>
                          ⚠ Unverified Email
                        </span>
                      )}

                      {detail.role === 'RECRUITER' && (
                        detail.adminApproved ? (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' }}>
                            ✓ Admin Approved
                          </span>
                        ) : (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)' }}>
                            ⏳ Pending Approval
                          </span>
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Quick Action Controls */}
                <div style={{ padding: '16px 20px', borderRadius: 16, background: 'var(--card-row-bg)', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 12 }}>
                    Admin Controls
                  </p>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={handleToggleStatus}
                      disabled={actionLoading}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 14px',
                        borderRadius: 10,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: actionLoading ? 'wait' : 'pointer',
                        border: detail.isActive ? '1px solid rgba(239,68,68,0.35)' : '1px solid rgba(74,222,128,0.35)',
                        background: detail.isActive ? 'rgba(239,68,68,0.12)' : 'rgba(74,222,128,0.12)',
                        color: detail.isActive ? '#ef4444' : '#4ade80',
                      }}
                    >
                      {detail.isActive ? 'Deactivate Account' : 'Activate Account'}
                    </button>

                    {detail.role === 'RECRUITER' && !detail.adminApproved && (
                      <button
                        type="button"
                        onClick={handleApproveRecruiter}
                        disabled={actionLoading}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '8px 14px',
                          borderRadius: 10,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: actionLoading ? 'wait' : 'pointer',
                          background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                          color: '#fff',
                          border: 'none',
                        }}
                      >
                        <Check size={14} /> Approve Recruiter
                      </button>
                    )}

                    {detail.role === 'RECRUITER' && (
                      <button
                        type="button"
                        onClick={() => handleTogglePrivilege('canPostJobs')}
                        disabled={actionLoading}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '8px 14px',
                          borderRadius: 10,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: actionLoading ? 'wait' : 'pointer',
                          border: detail.canPostJobs ? '1px solid rgba(99,102,241,0.35)' : '1px solid rgba(239,68,68,0.35)',
                          background: detail.canPostJobs ? 'rgba(99,102,241,0.12)' : 'rgba(239,68,68,0.12)',
                          color: detail.canPostJobs ? '#818cf8' : '#f87171',
                        }}
                      >
                        Job Posting: {detail.canPostJobs ? 'Enabled' : 'Disabled'}
                      </button>
                    )}

                    {detail.role === 'CANDIDATE' && (
                      <button
                        type="button"
                        onClick={() => handleTogglePrivilege('canApplyToJobs')}
                        disabled={actionLoading}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '8px 14px',
                          borderRadius: 10,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: actionLoading ? 'wait' : 'pointer',
                          border: detail.canApplyToJobs ? '1px solid rgba(34,211,238,0.35)' : '1px solid rgba(239,68,68,0.35)',
                          background: detail.canApplyToJobs ? 'rgba(34,211,238,0.12)' : 'rgba(239,68,68,0.12)',
                          color: detail.canApplyToJobs ? '#22d3ee' : '#f87171',
                        }}
                      >
                        Applying: {detail.canApplyToJobs ? 'Enabled' : 'Disabled'}
                      </button>
                    )}
                  </div>
                </div>

                {/* 3. Account Metadata Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  <div style={{ padding: '12px 16px', borderRadius: 12, background: 'var(--card-row-bg)', border: '1px solid var(--border)' }}>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 4px' }}>User ID</p>
                    <p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>#{detail.id}</p>
                  </div>
                  <div style={{ padding: '12px 16px', borderRadius: 12, background: 'var(--card-row-bg)', border: '1px solid var(--border)' }}>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 4px' }}>Member Since</p>
                    <p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>
                      {detail.createdAt ? new Date(detail.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* 4. Role-Specific Activity Breakdown */}
                {detail.role === 'RECRUITER' && detail.recruiterActivity && (
                  <div style={{ padding: '18px 20px', borderRadius: 16, background: 'var(--card-row-bg)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <p style={{ fontSize: 13, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Briefcase size={15} style={{ color: '#818cf8' }} />
                        Recruiter Activity
                      </p>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {detail.recruiterActivity.totalJobsPosted} Jobs Posted · {detail.recruiterActivity.totalApplicationsReceived} Applications Received
                      </span>
                    </div>

                    <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
                      Recent Jobs Posted
                    </p>
                    {detail.recruiterActivity.recentJobs?.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {detail.recruiterActivity.recentJobs.map(job => (
                          <div
                            key={job.id}
                            style={{
                              padding: '10px 14px',
                              borderRadius: 10,
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid var(--border)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 12,
                            }}
                          >
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 2px' }}>{job.title}</p>
                              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                                {job.company} · {new Date(job.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <span style={{
                                fontSize: 10,
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: 999,
                                background: job.status === 'OPEN' ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.08)',
                                color: job.status === 'OPEN' ? '#4ade80' : 'var(--text-muted)',
                              }}>
                                {job.status}
                              </span>
                              <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '3px 0 0' }}>
                                {job.applicationCount} applications
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
                        No jobs posted yet by this recruiter.
                      </p>
                    )}
                  </div>
                )}

                {detail.role === 'CANDIDATE' && detail.candidateActivity && (
                  <div style={{ padding: '18px 20px', borderRadius: 16, background: 'var(--card-row-bg)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <p style={{ fontSize: 13, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FileText size={15} style={{ color: '#22d3ee' }} />
                        Candidate Activity
                      </p>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {detail.candidateActivity.totalApplicationsSubmitted} Total Applications
                      </span>
                    </div>

                    {/* Resume info */}
                    <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Stored Resume</span>
                      {detail.candidateActivity.resume?.hasResume ? (
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#34d399', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle size={12} /> {detail.candidateActivity.resume.originalFilename || 'Uploaded on file'}
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          No resume uploaded
                        </span>
                      )}
                    </div>

                    <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
                      Recent Applications
                    </p>
                    {detail.candidateActivity.recentApplications?.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {detail.candidateActivity.recentApplications.map(app => (
                          <div
                            key={app.id}
                            style={{
                              padding: '10px 14px',
                              borderRadius: 10,
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid var(--border)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 12,
                            }}
                          >
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 2px' }}>{app.jobTitle}</p>
                              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                                {app.company} · Applied {new Date(app.appliedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <span style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 999,
                              background: 'rgba(99,102,241,0.12)',
                              color: '#818cf8',
                            }}>
                              {app.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
                        No applications submitted yet.
                      </p>
                    )}
                  </div>
                )}

                {/* 5. Danger Zone - Permanent Deletion (Guarded Cascade) */}
                <div
                  style={{
                    padding: '18px 20px',
                    borderRadius: 16,
                    background: 'rgba(239, 68, 68, 0.04)',
                    border: '1px solid rgba(239, 68, 68, 0.20)',
                    marginTop: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <ShieldAlert size={16} style={{ color: '#ef4444' }} />
                    <h5 style={{ fontSize: 13, fontWeight: 800, margin: 0, color: '#ef4444' }}>
                      Permanent Account Deletion (Danger Zone)
                    </h5>
                  </div>

                  {detail.role === 'ADMIN' ? (
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                      Administrator accounts are protected and cannot be deleted.
                    </p>
                  ) : !showDeleteConfirm ? (
                    <>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 14px', lineHeight: 1.5 }}>
                        Permanently removes this account and cascades deletion to profiles, notifications, and auth tokens.
                        Deletion is blocked if there are active job postings or in-progress candidate applications.
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '8px 16px',
                          borderRadius: 10,
                          fontSize: 12,
                          fontWeight: 700,
                          background: 'rgba(239, 68, 68, 0.12)',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.35)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.22)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'; }}
                      >
                        <Trash2 size={13} /> Delete Account Permanently
                      </button>
                    </>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        padding: '14px',
                        borderRadius: 12,
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                      }}
                    >
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', margin: '0 0 6px' }}>
                        Are you sure you want to permanently delete this user?
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '0 0 10px', lineHeight: 1.4 }}>
                        This action cannot be undone. To confirm, please type{' '}
                        <code style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.08)', color: '#fff', fontWeight: 700 }}>
                          {detail.email}
                        </code>{' '}
                        below:
                      </p>
                      <input
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder={`Type ${detail.email}`}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: 8,
                          fontSize: 12,
                          background: 'var(--bg-elevated)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-primary)',
                          outline: 'none',
                          marginBottom: 12,
                          boxSizing: 'border-box',
                        }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => {
                            setShowDeleteConfirm(false);
                            setDeleteConfirmText('');
                          }}
                          disabled={deleting}
                          style={{
                            padding: '6px 14px',
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 600,
                            background: 'transparent',
                            border: '1px solid var(--border)',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleDeleteUser}
                          disabled={deleting || deleteConfirmText.trim().toLowerCase() !== detail.email.toLowerCase()}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '6px 16px',
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 700,
                            background: '#ef4444',
                            border: 'none',
                            color: '#fff',
                            cursor: (deleting || deleteConfirmText.trim().toLowerCase() !== detail.email.toLowerCase()) ? 'not-allowed' : 'pointer',
                            opacity: (deleting || deleteConfirmText.trim().toLowerCase() !== detail.email.toLowerCase()) ? 0.5 : 1,
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {deleting ? (
                            <RefreshCw size={12} className="animate-spin" />
                          ) : (
                            <Trash2 size={12} />
                          )}
                          Confirm Permanent Deletion
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
