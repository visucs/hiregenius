import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import {
  Search, UserCheck, UserX, Shield, Users, Filter,
  ChevronDown, RefreshCw, AlertCircle, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { selectUser } from '../../features/auth/authSlice';
import adminService from '../../services/adminService';

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

  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [actionError, setActionError]     = useState(null);
  const [updatingId, setUpdatingId]       = useState(null);

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
  }, [page, pageSize, roleFilter, debouncedSearch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle Enable / Disable Toggle
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
    } catch (err) {
      console.error('[AdminUserManagement] Update status failed:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to update account status';
      setActionError(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100%' }}>

      {/* ── Hero band ─────────────────────────────────────── */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(150deg, #1e1b4b 0%, #0f0d2e 55%, #13103a 100%)', padding: 'clamp(20px, 4vw, 32px) clamp(16px, 4vw, 36px) 36px' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(99,102,241,0.10) 1.5px, transparent 1.5px)', backgroundSize: '26px 26px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -60, right: '10%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
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

            {/* Role filter chips */}
            <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
              {ROLE_FILTERS.map((r) => {
                const active = roleFilter === r;
                const rc = ROLE_CFG[r];
                return (
                  <motion.button
                    key={r}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => { setRoleFilter(r); setPage(0); }}
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
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>No users match your filters</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Try clearing the search term or choosing a different role filter.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View (>= 768px) */}
              <div className="admin-user-table" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--card-row-bg)' }}>
                      {['User', 'Role', 'Status', 'Provider', 'Joined', 'Actions'].map((h) => (
                        <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, i) => {
                      const rc = ROLE_CFG[u.role];
                      const isSelf = currentUser?.id && Number(u.id) === Number(currentUser.id);
                      const isUpdating = updatingId === u.id;
                      const statusVal = u.active ? 'ACTIVE' : 'DISABLED';

                      return (
                        <motion.tr
                          key={u.id}
                          initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.26, delay: i * 0.03 }}
                          style={{ borderBottom: '1px solid var(--border)', opacity: u.active ? 1 : 0.60, transition: 'background 0.12s' }}
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

                          {/* Status */}
                          <td style={{ padding: '13px 20px' }}><Pill cfg={STATUS_CFG} value={statusVal} /></td>

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
                            {u.role !== 'ADMIN' ? (
                              <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleToggleStatus(u)}
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
                  const statusVal = u.active ? 'ACTIVE' : 'DISABLED';

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
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Provider: {u.authProvider || 'LOCAL'}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--card-row-border)', flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          Joined: {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : '—'}
                        </div>

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
                            {isUpdating ? <RefreshCw size={12} className="animate-spin" /> : u.active ? <><UserX size={14} />Disable Account</> : <><UserCheck size={14} />Enable Account</>}
                          </motion.button>
                        )}
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
