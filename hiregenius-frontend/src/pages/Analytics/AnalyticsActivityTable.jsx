/**
 * AnalyticsActivityTable.jsx — Recent resume + interview activity table.
 * Columns: Candidate | Job | Type | Score | Recommendation | Date
 * Features: search filter, pagination, horizontally scrollable on mobile.
 * Rules.md §4: loading skeleton, empty state, error state.
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronLeft, ChevronRight, AlertCircle, ArrowRight } from 'lucide-react';

const ROW_COLORS = {
  'Recommended':  { color: 'var(--success)', bg: 'rgba(34,197,94,0.10)'  },
  'Consider':     { color: 'var(--warning)', bg: 'rgba(245,158,11,0.10)'  },
  'Not a Fit':    { color: 'var(--danger)',  bg: 'rgba(239,68,68,0.10)'   },
};

const TypeBadge = ({ type }) => (
  <span style={{
    fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
    padding: '3px 8px', borderRadius: 999,
    color: type === 'Resume' ? 'var(--secondary)' : 'var(--primary)',
    background: type === 'Resume' ? 'rgba(34,211,238,0.10)' : 'rgba(99,102,241,0.10)',
    border: `1px solid ${type === 'Resume' ? 'rgba(34,211,238,0.20)' : 'rgba(99,102,241,0.20)'}`,
  }}>
    {type}
  </span>
);

const RecommendationBadge = ({ rec }) => {
  const c = ROW_COLORS[rec] || {};
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999,
      color: c.color, background: c.bg, border: `1px solid ${c.color}30`,
    }}>
      {rec}
    </span>
  );
};

const ScoreBar = ({ score }) => {
  const color = score >= 75 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--danger)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 48, height: 5, borderRadius: 999, background: 'var(--border)', overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', borderRadius: 999, background: color }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', minWidth: 28 }}>{score}</span>
    </div>
  );
};

/* Row skeleton */
const SkeletonRow = () => (
  <tr>
    {[140, 120, 70, 80, 100, 70].map((w, i) => (
      <td key={i} style={{ padding: '14px 16px' }}>
        <div style={{ height: 12, width: w, borderRadius: 6, background: 'var(--bg-surface)', position: 'relative', overflow: 'hidden' }}>
          <div className="analytics-shimmer" />
        </div>
      </td>
    ))}
  </tr>
);

const PAGE_SIZE = 8;

const AnalyticsActivityTable = ({ data, loading, error, onRetry }) => {
  const [search, setSearch] = useState('');
  const [page,   setPage]   = useState(0);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.toLowerCase();
    return data.filter(r =>
      r.candidate.toLowerCase().includes(q) ||
      r.job.toLowerCase().includes(q) ||
      r.type.toLowerCase().includes(q) ||
      r.recommendation.toLowerCase().includes(q),
    );
  }, [data, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        borderRadius: 20, overflow: 'hidden',
      }}
    >
      {/* Table header bar */}
      <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', borderBottom: '1px solid var(--border)' }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Recent Activity</h3>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>Latest resume screenings and AI interviews</p>
        </div>
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            id="activity-search"
            type="text"
            placeholder="Search candidate, job, type…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            style={{
              paddingLeft: 34, paddingRight: 14, height: 36, borderRadius: 10,
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              color: 'var(--text-primary)', fontSize: 13, outline: 'none', minWidth: 240,
            }}
          />
        </div>
      </div>

      {/* Scrollable table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
          <thead>
            <tr style={{ background: 'var(--bg-surface)' }}>
              {['Candidate', 'Job', 'Type', 'Score', 'Recommendation', 'Date'].map(h => (
                <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', textAlign: 'left', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1,2,3,4,5,6].map(i => <SkeletonRow key={i} />)
            ) : error ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px 24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <AlertCircle size={24} color="var(--danger)" />
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Failed to load activity.</p>
                    <button onClick={onRetry} style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                      Retry
                    </button>
                  </div>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px 24px', color: 'var(--text-muted)', fontSize: 13 }}>
                  No activity found{search ? ` matching "${search}"` : ' for this period'}.
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--text-primary)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {row.candidate}
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {row.job}
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <TypeBadge type={row.type} />
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <ScoreBar score={row.score} />
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <RecommendationBadge rec={row.recommendation} />
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {row.date}
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && !error && filtered.length > PAGE_SIZE && (
        <div style={{ padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface)', cursor: page === 0 ? 'default' : 'pointer', opacity: page === 0 ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i)}
                style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid', borderColor: page === i ? 'var(--primary)' : 'var(--border)', background: page === i ? 'var(--primary)' : 'var(--bg-surface)', color: page === i ? '#fff' : 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface)', cursor: page >= totalPages - 1 ? 'default' : 'pointer', opacity: page >= totalPages - 1 ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AnalyticsActivityTable;
