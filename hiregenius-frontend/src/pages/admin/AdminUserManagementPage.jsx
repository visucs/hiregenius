import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  Search, UserCheck, UserX, Shield, Users, Filter,
  ChevronDown, RefreshCw, AlertCircle, ChevronLeft, ChevronRight,
  CheckCircle, Clock, Check, Eye,
} from 'lucide-react';
import { selectUser } from '../../features/auth/authSlice';
import adminService from '../../services/adminService';
import AdminUserDetailModal from './AdminUserDetailModal';

const ROLE_CFG = {
  RECRUITER: { bg: 'rgba(129,140,248,0.12)', color: '#818cf8', border: 'rgba(129,140,248,0.28)', label: 'Recruiter', grad: 'linear-gradient(135deg,#6366f1,#818cf8)' },
  CANDIDATE: { bg: 'rgba(34,211,238,0.12)',  color: '#22d3ee', border: 'rgba(34,211,238,0.28)',  label: 'Candidate', grad: 'linear-gradient(135deg,#06b6d4,#22d3ee)' },
  ADMIN:     { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b', border: 'rgba(245,158,11,0.28)',  label: 'Admin',     grad: 'linear-gradient(135deg,#d97706,#f59e0b)' },
};

const STATUS_CFG = {
  ACTIVE:   { bg: 'rgba(74,222,128,0.12)',  color: '#4ade80', border: 'rgba(74,222,128,0.28)',  dot: '#4ade80',  label: 'Active'   },
  DISABLED: { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444', border: 'rgba(239,68,68,0.28)',   dot: '#ef4444',  label: 'Disabled' },
};

const Pill = ({ cfg, value }) => {
  const c = cfg[value] ?? { bg: 'var(--border)', color: 'var(--text-muted)', border: 'var(--border)', label: value };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
      {'dot' in c && <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.dot }} />}
      {c.label}
    </span>
  );
};

const ROLE_FILTERS = ['ALL', 'RECRUITER', 'CANDIDATE', 'ADMIN'];

const AdminUserManagementPage = () => {
  const currentUser = useSelector(selectUser);

  const [users, setUsers]                 = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages]       = useState(0);
  const [page, setPage]                   = useState(0);
  const [pageSize]                        = useState(10);

  const [search, setSearch]               = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter]       = useState('ALL');
  const [pendingApprovalOnly, setPendingApprovalOnly] = useState(false);

  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [actionError, setActionError]     = useState(null);
  const [updatingId, setUpdatingId]       = useState(null);
  const [approvingId, setApprovingId]     = useState(null);
  const [togglingPrivilegeId, setTogglingPrivilegeId] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch users from Spring Boot Auth Service
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    setActionError(null);
    try {
      const params = {
        page,
        size: pageSize,
      };
      if (roleFilter !== 'ALL') params.role = roleFilter;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (pendingApprovalOnly) params.pendingApproval = true;

      const res = await adminService.getUsers(params);
      const pageData = res?.data?.data ?? res?.data;

      setUsers(pageData?.content ?? []);
      setTotalElements(pageData?.totalElements ?? 0);
      setTotalPages(pageData?.totalPages ?? 0);
    } catch (err) {
      console.error('[AdminUserManagement] Fetch failed:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to load user accounts';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, roleFilter, debouncedSearch, pendingApprovalOnly]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle Account Enable / Disable Toggle (is_active)
  const handleToggleStatus = async (targetUser) => {
    setActionError(null);

    // Frontend safety guards
    if (targetUser.role === 'ADMIN') {
      setActionError('Cannot modify status of administrator accounts.');
      return;
    }
    if (currentUser?.id && Number(targetUser.id) === Number(currentUser.id)) {
      setActionError('You cannot disable your own administrator account.');
      return;
    }

    const newActiveState = !targetUser.active;
    setUpdatingId(targetUser.id);

    try {
      await adminService.updateUserStatus(targetUser.id, newActiveState);
      // Optimistically update local row
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, active: newActiveState } : u))
      );
      toast.success(`Account ${newActiveState ? 'enabled' : 'disabled'} for ${targetUser.name || targetUser.email}`);
    } catch (err) {
      console.error('[AdminUserManagement] Update status failed:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to update account status';
      setActionError(msg);
      toast.error(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  // Handle Recruiter Approval (Part 2)
  const handleApproveRecruiter = async (targetUser) => {
    setActionError(null);
    setApprovingId(targetUser.id);

    try {
      await adminService.approveRecruiter(targetUser.id);
      // Optimistically mark as approved
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, adminApproved: true } : u))
      );
      toast.success(`Recruiter approved! Notification email dispatched to ${targetUser.email}`);
    } catch (err) {
      console.error('[AdminUserManagement] Recruiter approval failed:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to approve recruiter';
      setActionError(msg);
      toast.error(msg);
    } finally {
      setApprovingId(null);
    }
  };

  // Handle Granular Privilege Toggle (Part 3)
  const handleTogglePrivilege = async (targetUser, field) => {
    setActionError(null);
    setTogglingPrivilegeId(`${targetUser.id}-${field}`);

    try {
      const payload = {};
      if (field === 'canPostJobs') {
        payload.canPostJobs = !(targetUser.canPostJobs ?? true);
      } else if (field === 'canApplyToJobs') {
        payload.canApplyToJobs = !(targetUser.canApplyToJobs ?? true);
      }

      await adminService.updateUserPrivileges(targetUser.id, payload);

      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === targetUser.id) {
            return {
              ...u,
              canPostJobs: payload.canPostJobs !== undefined ? payload.canPostJobs : u.canPostJobs,
              canApplyToJobs: payload.canApplyToJobs !== undefined ? payload.canApplyToJobs : u.canApplyToJobs,
            };
          }
          return u;
        })
      );
      toast.success(`Privilege updated for ${targetUser.name || targetUser.email}`);
    } catch (err) {
      console.error('[AdminUserManagement] Privilege toggle failed:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to update privileges';
      setActionError(msg);
      toast.error(msg);
    } finally {
      setTogglingPrivilegeId(null);
    }
  };

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100%' }}>

      {/* ── Hero band ─────────────────────────────────────── */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(150deg, #1e1b4b 0%, #0f0d2e 55%, #13103a 100%)', padding: 'clamp(20px, 4vw, 32px) clamp(16px, 4vw, 36px) 36px' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(99,102,241,0.10) 1.5px, transparent 1.5px)', backgroundSize: '26px 26px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -60, right: '10%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ relative: 'relative', zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(129,140,248,0.95)', background: 'rgba(99,102,241,0.18)', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(99,102,241,0.30)' }}>
                <Users size={11} /> User Management
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#4ade80', background: 'rgba(74,222,128,0.10)', padding: '4px 10px', borderRadius: 999, border: '1px solid rgba(74,222,128,0.22)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} /> Live Auth Service
              </span>
            </div>
            <h1 style={{ fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', marginBottom: 6 }}>User Management</h1>
            <p style={{ fontSize: 13, color: 'rgba(196,200,255,0.60)' }}>
              {!loading && !error
                ? `${totalElements} registered account${totalElements === 1 ? '' : 's'} managed across the platform`
                : !loading && error
                  ? 'Could not load account data — see error below'
                  : 'Loading account data…'}
            </p>

            {/* Filter chips (Role filters + Pending Approval Toggle) */}
            <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap', alignItems: 'center' }}>
              {ROLE_FILTERS.map((r) => {
                const active = !pendingApprovalOnly && roleFilter === r;
                const rc = ROLE_CFG[r];
                return (
                  <motion.button
                    key={r}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => { setRoleFilter(r); setPendingApprovalOnly(false); setPage(0); }}
                    id={`admin-users-filter-${r.toLowerCase()}`}
                    style={{
                      padding: '8px 16px', minHeight: 40, borderRadius: 10, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                      background: active ? (rc ? rc.grad : 'rgba(255,255,255,0.18)') : 'rgba(255,255,255,0.07)',
                      color: active ? '#fff' : 'rgba(255,255,255,0.50)',
                      boxShadow: active && rc ? `0 3px 12px ${rc.color}40` : 'none',
                    }}
                  >
                    {r === 'ALL' ? 'All Roles' : ROLE_CFG[r]?.label}
                  </motion.button>
                );
              })}

              {/* Pending Approval Filter Tab */}
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => { setPendingApprovalOnly(!pendingApprovalOnly); setPage(0); }}
                id="admin-users-filter-pending-approval"
                style={{
                  padding: '8px 16px', minHeight: 40, borderRadius: 10, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: pendingApprovalOnly ? 'linear-gradient(135deg, #d97706, #f59e0b)' : 'rgba(245, 158, 11, 0.12)',
                  color: pendingApprovalOnly ? '#fff' : '#f59e0b',
                  border: pendingApprovalOnly ? 'none' : '1px solid rgba(245, 158, 11, 0.35)',
                  boxShadow: pendingApprovalOnly ? '0 3px 12px rgba(245, 158, 11, 0.40)' : 'none',
                }}
              >
                <Clock size={13} />
                Pending Approval
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────── */}
      <div style={{ padding: 'clamp(16px, 3vw, 20px) clamp(12px, 3vw, 36px) 60px' }}>

        {/* Action Error Banner */}
        <AnimatePresence>
          {actionError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 18px', borderRadius: 14, marginBottom: 16,
                background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.30)',
                color: '#ef4444', fontSize: 13, fontWeight: 600,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertCircle size={16} />
                <span>{actionError}</span>
              </div>
              <button
                onClick={() => setActionError(null)}
                style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 800, cursor: 'pointer', fontSize: 14 }}
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search bar & Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 440 }}>
            <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              id="admin-users-search"
              style={{ width: '100%', minHeight: 44, paddingLeft: 42, paddingRight: 16, paddingTop: 11, paddingBottom: 11, borderRadius: 13, fontSize: 13, background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>

          <button
            onClick={fetchUsers}
            disabled={loading}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', minHeight: 44,
              borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)',
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Table card */}
        <motion.div
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}
        >
          <div style={{ height: 3, background: 'linear-gradient(90deg, #4f46e5, #818cf8, #22d3ee)', borderRadius: '20px 20px 0 0' }} />

          {loading ? (
            <div style={{ padding: '60px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <RefreshCw size={24} className="animate-spin" style={{ color: '#818cf8' }} />
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading platform user accounts...</p>
            </div>
          ) : error ? (
            <div style={{ padding: '40px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <AlertCircle size={28} style={{ color: '#ef4444' }} />
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{error}</p>
              <button
                onClick={fetchUsers}
                style={{ padding: '8px 18px', borderRadius: 10, background: '#4f46e5', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
              >
                Retry
              </button>
            </div>
          ) : users.length === 0 ? (
            <div style={{ padding: '60px 24px', textAlign: 'center' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                {pendingApprovalOnly ? 'No recruiters currently pending approval' : 'No users match your filters'}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                {pendingApprovalOnly ? 'All recruiters are up to date and approved.' : 'Try clearing the search term or choosing a different role filter.'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View (>= 768px) */}
              <div className="admin-user-table" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--card-row-bg)' }}>
                      {['User', 'Role', 'Status & Privileges', 'Provider', 'Joined', 'Actions'].map((h) => (
                        <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, i) => {
                      const rc = ROLE_CFG[u.role];
                      const isSelf = currentUser?.id && Number(u.id) === Number(currentUser.id);
                      const isUpdating = updatingId === u.id;
                      const isApproving = approvingId === u.id;
                      const statusVal = u.active ? 'ACTIVE' : 'DISABLED';

                      const isApproved = u.adminApproved ?? u.admin_approved ?? (u.role !== 'RECRUITER');
                      const canPost = u.canPostJobs ?? u.can_post_jobs ?? true;
                      const canApply = u.canApplyToJobs ?? u.can_apply_to_jobs ?? true;

                      return (
                        <motion.tr
                          key={u.id}
                          initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.26, delay: i * 0.03 }}
                          onClick={() => setSelectedUserId(u.id)}
                          style={{ borderBottom: '1px solid var(--border)', opacity: u.active ? 1 : 0.60, transition: 'background 0.12s', cursor: 'pointer' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--card-row-bg)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          {/* User */}
                          <td style={{ padding: '13px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, background: rc?.grad ?? 'linear-gradient(135deg,#64748b,#94a3b8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 800, boxShadow: rc ? `0 2px 10px ${rc.color}30` : 'none' }}>
                                {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div>
                                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                                  {u.name}
                                  {isSelf && (
                                    <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 999, background: 'rgba(99,102,241,0.18)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}>
                                      You
                                    </span>
                                  )}
                                </p>
                                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.email}</p>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td style={{ padding: '13px 20px' }}><Pill cfg={ROLE_CFG} value={u.role} /></td>

                          {/* Status & Granular Privileges */}
                          <td style={{ padding: '13px 20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <Pill cfg={STATUS_CFG} value={statusVal} />

                                {/* Recruiter Approval Badge */}
                                {u.role === 'RECRUITER' && (
                                  isApproved ? (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.28)' }}>
                                      <CheckCircle size={10} /> Approved
                                    </span>
                                  ) : (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.35)' }}>
                                      <Clock size={10} /> Pending
                                    </span>
                                  )
                                )}
                              </div>

                              {/* Privilege Toggles (Part 3) */}
                              {u.role === 'RECRUITER' && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleTogglePrivilege(u, 'canPostJobs'); }}
                                  disabled={togglingPrivilegeId === `${u.id}-canPostJobs`}
                                  title={canPost ? 'Click to disable job posting privilege' : 'Click to enable job posting privilege'}
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700,
                                    padding: '3px 8px', borderRadius: 6, cursor: 'pointer', transition: 'all 0.15s ease',
                                    border: canPost ? '1px solid rgba(99,102,241,0.35)' : '1px solid rgba(239,68,68,0.35)',
                                    background: canPost ? 'rgba(99,102,241,0.12)' : 'rgba(239,68,68,0.12)',
                                    color: canPost ? '#818cf8' : '#f87171',
                                  }}
                                >
                                  {togglingPrivilegeId === `${u.id}-canPostJobs` ? (
                                    <RefreshCw size={10} className="animate-spin" />
                                  ) : null}
                                  Post Jobs: {canPost ? 'ON' : 'OFF'}
                                </button>
                              )}

                              {u.role === 'CANDIDATE' && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleTogglePrivilege(u, 'canApplyToJobs'); }}
                                  disabled={togglingPrivilegeId === `${u.id}-canApplyToJobs`}
                                  title={canApply ? 'Click to disable job application privilege' : 'Click to enable job application privilege'}
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700,
                                    padding: '3px 8px', borderRadius: 6, cursor: 'pointer', transition: 'all 0.15s ease',
                                    border: canApply ? '1px solid rgba(6,182,212,0.35)' : '1px solid rgba(239,68,68,0.35)',
                                    background: canApply ? 'rgba(6,182,212,0.12)' : 'rgba(239,68,68,0.12)',
                                    color: canApply ? '#22d3ee' : '#f87171',
                                  }}
                                >
                                  {togglingPrivilegeId === `${u.id}-canApplyToJobs` ? (
                                    <RefreshCw size={10} className="animate-spin" />
                                  ) : null}
                                  Apply Jobs: {canApply ? 'ON' : 'OFF'}
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Auth Provider */}
                          <td style={{ padding: '13px 20px', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                            {u.authProvider || 'LOCAL'}
                          </td>

                          {/* Joined */}
                          <td style={{ padding: '13px 20px', fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '13px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {/* 1-Click Recruiter Approval Button */}
                              {u.role === 'RECRUITER' && !isApproved && (
                                <motion.button
                                  whileTap={{ scale: 0.95 }}
                                  onClick={(e) => { e.stopPropagation(); handleApproveRecruiter(u); }}
                                  disabled={isApproving}
                                  id={`admin-users-approve-${u.id}`}
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', minHeight: 36,
                                    borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: isApproving ? 'wait' : 'pointer',
                                    border: 'none', background: 'rgba(34,197,94,0.18)', color: '#22c55e',
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(34,197,94,0.28)'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(34,197,94,0.18)'; }}
                                >
                                  {isApproving ? (
                                    <RefreshCw size={12} className="animate-spin" />
                                  ) : (
                                    <CheckCircle size={13} />
                                  )}
                                  Approve
                                </motion.button>
                              )}

                              {u.role !== 'ADMIN' ? (
                                <motion.button
                                  whileTap={{ scale: 0.95 }}
                                  onClick={(e) => { e.stopPropagation(); handleToggleStatus(u); }}
                                  disabled={isUpdating}
                                  id={`admin-users-toggle-${u.id}`}
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', minHeight: 36, borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: isUpdating ? 'wait' : 'pointer', border: 'none', transition: 'all 0.15s',
                                    background: u.active ? 'rgba(239,68,68,0.10)' : 'rgba(74,222,128,0.10)',
                                    color: u.active ? '#ef4444' : '#4ade80',
                                    opacity: isUpdating ? 0.6 : 1,
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = u.active ? 'rgba(239,68,68,0.20)' : 'rgba(74,222,128,0.20)'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = u.active ? 'rgba(239,68,68,0.10)' : 'rgba(74,222,128,0.10)'; }}
                                >
                                  {isUpdating ? (
                                    <RefreshCw size={12} className="animate-spin" />
                                  ) : u.active ? (
                                    <><UserX size={13} />Disable</>
                                  ) : (
                                    <><UserCheck size={13} />Enable</>
                                  )}
                                </motion.button>
                              ) : (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.10)', padding: '4px 10px', borderRadius: 8 }}>
                                  <Shield size={12} /> Protected
                                </span>
                              )}

                              {/* View Details Button */}
                              <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => { e.stopPropagation(); setSelectedUserId(u.id); }}
                                title="View full user details and activity"
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 11px', minHeight: 36,
                                  borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1px solid var(--border)',
                                  background: 'var(--bg-elevated)', color: 'var(--text-primary)', transition: 'all 0.15s',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#818cf8'; e.currentTarget.style.color = '#818cf8'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                              >
                                <Eye size={13} /> Details
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Stacked Cards View (< 768px) */}
              <div className="admin-user-cards" style={{ display: 'none', flexDirection: 'column', gap: 12, padding: '14px 16px' }}>
                {users.map((u) => {
                  const rc = ROLE_CFG[u.role];
                  const isUpdating = updatingId === u.id;
                  const isApproving = approvingId === u.id;
                  const statusVal = u.active ? 'ACTIVE' : 'DISABLED';

                  const isApproved = u.adminApproved ?? u.admin_approved ?? (u.role !== 'RECRUITER');
                  const canPost = u.canPostJobs ?? u.can_post_jobs ?? true;
                  const canApply = u.canApplyToJobs ?? u.can_apply_to_jobs ?? true;

                  return (
                    <div
                      key={u.id}
                      style={{
                        padding: '16px', borderRadius: 16, background: 'var(--card-row-bg)', border: '1px solid var(--border)',
                        opacity: u.active ? 1 : 0.60, display: 'flex', flexDirection: 'column', gap: 12,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                          <div style={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0, background: rc?.grad ?? 'linear-gradient(135deg,#64748b,#94a3b8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 15, fontWeight: 800 }}>
                            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</p>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</p>
                          </div>
                        </div>

                        {u.role === 'ADMIN' && <Shield size={18} style={{ color: '#f59e0b', flexShrink: 0 }} />}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <Pill cfg={ROLE_CFG} value={u.role} />
                        <Pill cfg={STATUS_CFG} value={statusVal} />

                        {u.role === 'RECRUITER' && (
                          isApproved ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.28)' }}>
                              <CheckCircle size={10} /> Approved
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.35)' }}>
                              <Clock size={10} /> Pending Approval
                            </span>
                          )
                        )}

                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Provider: {u.authProvider || 'LOCAL'}</span>
                      </div>

                      {/* Granular Privilege Controls on Mobile */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', paddingTop: 4 }}>
                        {u.role === 'RECRUITER' && (
                          <button
                            type="button"
                            onClick={() => handleTogglePrivilege(u, 'canPostJobs')}
                            disabled={togglingPrivilegeId === `${u.id}-canPostJobs`}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700,
                              padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                              border: canPost ? '1px solid rgba(99,102,241,0.35)' : '1px solid rgba(239,68,68,0.35)',
                              background: canPost ? 'rgba(99,102,241,0.12)' : 'rgba(239,68,68,0.12)',
                              color: canPost ? '#818cf8' : '#f87171',
                            }}
                          >
                            Post Jobs: {canPost ? 'ON' : 'OFF'}
                          </button>
                        )}
                        {u.role === 'CANDIDATE' && (
                          <button
                            type="button"
                            onClick={() => handleTogglePrivilege(u, 'canApplyToJobs')}
                            disabled={togglingPrivilegeId === `${u.id}-canApplyToJobs`}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700,
                              padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                              border: canApply ? '1px solid rgba(6,182,212,0.35)' : '1px solid rgba(239,68,68,0.35)',
                              background: canApply ? 'rgba(6,182,212,0.12)' : 'rgba(239,68,68,0.12)',
                              color: canApply ? '#22d3ee' : '#f87171',
                            }}
                          >
                            Apply Jobs: {canApply ? 'ON' : 'OFF'}
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--card-row-border)', flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          Joined: {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : '—'}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {u.role === 'RECRUITER' && !isApproved && (
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleApproveRecruiter(u)}
                              disabled={isApproving}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 14px', minHeight: 40, borderRadius: 10, fontSize: 12, fontWeight: 700,
                                background: 'rgba(34,197,94,0.18)', color: '#22c55e', border: 'none', cursor: 'pointer',
                              }}
                            >
                              <CheckCircle size={13} /> Approve
                            </motion.button>
                          )}

                          {/* View Details Button */}
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedUserId(u.id)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 12px', minHeight: 44,
                              borderRadius: 10, fontSize: 12, fontWeight: 700, border: '1px solid var(--border)',
                              background: 'var(--bg-elevated)', color: 'var(--text-primary)', cursor: 'pointer',
                            }}
                          >
                            <Eye size={13} /> View
                          </motion.button>

                          {u.role !== 'ADMIN' && (
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleToggleStatus(u)}
                              disabled={isUpdating}
                              id={`admin-users-mobile-toggle-${u.id}`}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', minHeight: 44, borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: isUpdating ? 'wait' : 'pointer', border: 'none', transition: 'all 0.15s',
                                background: u.active ? 'rgba(239,68,68,0.10)' : 'rgba(74,222,128,0.10)',
                                color: u.active ? '#ef4444' : '#4ade80',
                              }}
                            >
                              {isUpdating ? <RefreshCw size={12} className="animate-spin" /> : u.active ? <><UserX size={14} />Disable</> : <><UserCheck size={14} />Enable</>}
                            </motion.button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px', borderTop: '1px solid var(--border)', background: 'var(--card-row-bg)', flexWrap: 'wrap', gap: 12 }}>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                    Showing page {page + 1} of {totalPages} ({totalElements} total)
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0 || loading}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', minHeight: 36, borderRadius: 8,
                        background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)',
                        fontSize: 12, fontWeight: 600, cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.5 : 1,
                      }}
                    >
                      <ChevronLeft size={14} /> Previous
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1 || loading}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', minHeight: 36, borderRadius: 8,
                        background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)',
                        fontSize: 12, fontWeight: 600, cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', opacity: page >= totalPages - 1 ? 0.5 : 1,
                      }}
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>

      {/* User Drill-Down Detail Drawer / Modal (Part 3) */}
      <AdminUserDetailModal
        isOpen={Boolean(selectedUserId)}
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
        onUserUpdated={fetchUsers}
      />

      <style>{`
        @media (max-width: 767px) {
          .admin-user-table {
            display: none !important;
          }
          .admin-user-cards {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminUserManagementPage;
