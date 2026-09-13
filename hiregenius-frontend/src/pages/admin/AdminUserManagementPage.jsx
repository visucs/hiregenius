import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, UserCheck, UserX, Shield, Users, Filter, ChevronDown } from 'lucide-react';
import { MOCK_USERS } from '../../mock/admin/adminMock';

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
  const [users, setUsers] = useState(MOCK_USERS);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const filtered = users.filter(u => {
    const q  = search.toLowerCase();
    const mq = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const mr = roleFilter === 'ALL' || u.role === roleFilter;
    return mq && mr;
  });

  const toggleStatus = id => setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE' } : u));

  const counts = { ALL: users.length, RECRUITER: users.filter(u => u.role === 'RECRUITER').length, CANDIDATE: users.filter(u => u.role === 'CANDIDATE').length, ADMIN: users.filter(u => u.role === 'ADMIN').length };

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
            </div>
            <h1 style={{ fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', marginBottom: 6 }}>User Management</h1>
            <p style={{ fontSize: 13, color: 'rgba(196,200,255,0.60)' }}>{users.length} registered accounts across the platform</p>

            {/* Role filter chips */}
            <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
              {ROLE_FILTERS.map(r => {
                const active = roleFilter === r;
                const rc = ROLE_CFG[r];
                return (
                  <motion.button key={r} whileTap={{ scale: 0.96 }}
                    onClick={() => setRoleFilter(r)}
                    id={`admin-users-filter-${r.toLowerCase()}`}
                    style={{ padding: '8px 16px', minHeight: 40, borderRadius: 10, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                      background: active ? (rc ? rc.grad : 'rgba(255,255,255,0.18)') : 'rgba(255,255,255,0.07)',
                      color: active ? '#fff' : 'rgba(255,255,255,0.50)',
                      boxShadow: active && rc ? `0 3px 12px ${rc.color}40` : 'none',
                    }}
                  >
                    {r === 'ALL' ? `All (${counts.ALL})` : `${ROLE_CFG[r]?.label} (${counts[r]})`}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────── */}
      <div style={{ padding: 'clamp(16px, 3vw, 20px) clamp(12px, 3vw, 36px) 60px' }}>
        {/* Search bar */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          style={{ position: 'relative', marginBottom: 16, maxWidth: 440 }}
        >
          <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…"
            id="admin-users-search"
            style={{ width: '100%', minHeight: 44, paddingLeft: 42, paddingRight: 16, paddingTop: 11, paddingBottom: 11, borderRadius: 13, fontSize: 13, background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
        </motion.div>

        {/* Table card */}
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, ease: [0.22,1,0.36,1] }}
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}
        >
          <div style={{ height: 3, background: 'linear-gradient(90deg, #4f46e5, #818cf8, #22d3ee)', borderRadius: '20px 20px 0 0' }} />

          {filtered.length === 0 ? (
            <div style={{ padding: '60px 24px', textAlign: 'center' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>No users match your filters</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View (>= 768px) */}
              <div className="admin-user-table" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--card-row-bg)' }}>
                      {['User', 'Role', 'Status', 'Joined', 'Last Login', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u, i) => {
                      const rc = ROLE_CFG[u.role];
                      return (
                        <motion.tr key={u.id}
                          initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.26, delay: i * 0.04 }}
                          style={{ borderBottom: '1px solid var(--border)', opacity: u.status === 'DISABLED' ? 0.60 : 1, transition: 'background 0.12s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--card-row-bg)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          {/* User */}
                          <td style={{ padding: '13px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, background: rc?.grad ?? 'linear-gradient(135deg,#64748b,#94a3b8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 800, boxShadow: rc ? `0 2px 10px ${rc.color}30` : 'none' }}>
                                {u.name.charAt(0)}
                              </div>
                              <div>
                                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{u.name}</p>
                                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '13px 20px' }}><Pill cfg={ROLE_CFG} value={u.role} /></td>
                          <td style={{ padding: '13px 20px' }}><Pill cfg={STATUS_CFG} value={u.status} /></td>
                          <td style={{ padding: '13px 20px', fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}</td>
                          <td style={{ padding: '13px 20px', fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}</td>
                          <td style={{ padding: '13px 20px' }}>
                            {u.role !== 'ADMIN' && (
                              <motion.button whileTap={{ scale: 0.95 }}
                                onClick={() => toggleStatus(u.id)}
                                id={`admin-users-toggle-${u.id}`}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', minHeight: 36, borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                                  background: u.status === 'ACTIVE' ? 'rgba(239,68,68,0.10)' : 'rgba(74,222,128,0.10)',
                                  color: u.status === 'ACTIVE' ? '#ef4444' : '#4ade80',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = u.status === 'ACTIVE' ? 'rgba(239,68,68,0.20)' : 'rgba(74,222,128,0.20)'}
                                onMouseLeave={e => e.currentTarget.style.background = u.status === 'ACTIVE' ? 'rgba(239,68,68,0.10)' : 'rgba(74,222,128,0.10)'}
                              >
                                {u.status === 'ACTIVE' ? <><UserX size={13} />Disable</> : <><UserCheck size={13} />Enable</>}
                              </motion.button>
                            )}
                            {u.role === 'ADMIN' && <Shield size={16} style={{ color: '#f59e0b', display: 'block', margin: '0 auto' }} />}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Stacked Cards View (< 768px) */}
              <div className="admin-user-cards" style={{ display: 'none', flexDirection: 'column', gap: 12, padding: '14px 16px' }}>
                {filtered.map((u) => {
                  const rc = ROLE_CFG[u.role];
                  return (
                    <div key={u.id}
                      style={{
                        padding: '16px', borderRadius: 16, background: 'var(--card-row-bg)', border: '1px solid var(--border)',
                        opacity: u.status === 'DISABLED' ? 0.60 : 1, display: 'flex', flexDirection: 'column', gap: 12,
                      }}
                    >
                      {/* Top: Avatar, Name, Email, Action */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                          <div style={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0, background: rc?.grad ?? 'linear-gradient(135deg,#64748b,#94a3b8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 15, fontWeight: 800 }}>
                            {u.name.charAt(0)}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</p>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</p>
                          </div>
                        </div>

                        {u.role === 'ADMIN' ? (
                          <Shield size={18} style={{ color: '#f59e0b', flexShrink: 0 }} />
                        ) : null}
                      </div>

                      {/* Middle: Role & Status pills */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <Pill cfg={ROLE_CFG} value={u.role} />
                        <Pill cfg={STATUS_CFG} value={u.status} />
                      </div>

                      {/* Bottom: Dates & Action */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--card-row-border)', flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          <span>Joined: {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                          {u.lastLoginAt && <span style={{ marginLeft: 8 }}>· Login: {new Date(u.lastLoginAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>}
                        </div>

                        {u.role !== 'ADMIN' && (
                          <motion.button whileTap={{ scale: 0.95 }}
                            onClick={() => toggleStatus(u.id)}
                            id={`admin-users-mobile-toggle-${u.id}`}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', minHeight: 44, borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                              background: u.status === 'ACTIVE' ? 'rgba(239,68,68,0.10)' : 'rgba(74,222,128,0.10)',
                              color: u.status === 'ACTIVE' ? '#ef4444' : '#4ade80',
                            }}
                          >
                            {u.status === 'ACTIVE' ? <><UserX size={14} />Disable Account</> : <><UserCheck size={14} />Enable Account</>}
                          </motion.button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
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
