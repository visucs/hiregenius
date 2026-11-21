import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  History,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import atsService from '../../services/atsService';

const ScanHistoryPage = () => {
  const navigate = useNavigate();
  const [scans, setScans] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await atsService.getMyScans({ page, limit: 15 });
      if (res?.data) {
        setScans(res.data.scans || []);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }
    } catch (err) {
      console.error('Failed to load ATS history:', err);
      toast.error('Could not load scan history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory(1);
  }, [fetchHistory]);

  const handleViewScan = (scanId) => {
    navigate(`/candidate/resume-score?scanId=${scanId}`);
  };

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100%' }}>
      {/* ── Forest Green Hero Header ────────────────────────── */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(150deg, #18280a 0%, #0c1505 55%, #0f1e06 100%)',
          padding: 'clamp(20px, 4vw, 32px) clamp(16px, 4vw, 36px) 0',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(rgba(107,138,58,0.10) 1.5px, transparent 1.5px)',
            backgroundSize: '26px 26px',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: -60,
            right: '12%',
            width: 280,
            height: 280,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(107,138,58,0.14) 0%, transparent 65%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.09em',
                  color: 'rgba(107,138,58,0.95)',
                  background: 'rgba(107,138,58,0.14)',
                  padding: '4px 12px',
                  borderRadius: 999,
                  border: '1px solid rgba(107,138,58,0.28)',
                }}
              >
                <History size={11} /> Historical Scans
              </span>
            </div>
            <h1
              style={{
                fontSize: 'clamp(22px, 4vw, 30px)',
                fontWeight: 900,
                color: '#fff',
                letterSpacing: '-0.04em',
                marginBottom: 6,
              }}
            >
              ATS Evaluation Scan Archive
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(190,220,140,0.60)', paddingBottom: 28 }}>
              Archive of all past candidate-triggered ATS scans, target job match scores, and versioned evaluations.
            </p>
          </motion.div>
        </div>
      </div>

      {/* ── Content Area ──────────────────────────────────── */}
      <div
        style={{
          padding: 'clamp(16px, 3vw, 24px) clamp(12px, 3vw, 36px) 60px',
          maxWidth: 1000,
          margin: '0 auto',
        }}
      >
        <div
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: '24px',
            boxShadow: '0 2px 14px rgba(0,0,0,0.03)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                All Recorded ATS Scans ({pagination.total})
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Evaluations run against your profile resume or uploaded draft resumes.
              </p>
            </div>

            <button
              onClick={() => fetchHistory(pagination.page)}
              disabled={loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-primary)',
                background: 'var(--card-row-bg)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '6px 12px',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <RefreshCw size={26} className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading scan history…</p>
            </div>
          ) : scans.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '48px 24px',
                border: '1px dashed var(--border)',
                borderRadius: 14,
              }}
            >
              <History size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 12px', opacity: 0.6 }} />
              <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                No ATS scans found
              </h4>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto 16px' }}>
                You have not performed any ATS checks yet. Run an ATS scan to see your score, keyword matches, and improvements.
              </p>
              <button
                onClick={() => navigate('/candidate/resume-score')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#fff',
                  background: 'var(--primary)',
                  border: 'none',
                  borderRadius: 10,
                  padding: '8px 18px',
                  cursor: 'pointer',
                }}
              >
                Go to Resume Score Checker <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {scans.map((scan) => {
                const score = Number(scan.overall_score || scan.result?.overallScore || 0);
                const isJob = scan.mode === 'JOB';
                const dateStr = new Date(scan.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric',
                });

                return (
                  <div
                    key={scan.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 20px',
                      borderRadius: 14,
                      background: 'var(--card-row-bg)',
                      border: '1px solid var(--border)',
                      flexWrap: 'wrap',
                      gap: 14,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: '50%',
                          background:
                            score >= 80
                              ? 'rgba(34,197,94,0.12)'
                              : score >= 60
                              ? 'rgba(245,158,11,0.12)'
                              : 'rgba(239,68,68,0.12)',
                          border: `2px solid ${
                            score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444'
                          }`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: 18,
                          color: score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444',
                        }}
                      >
                        {Math.round(score)}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '2px 7px',
                              borderRadius: 4,
                              background: isJob ? 'rgba(56,189,248,0.12)' : 'rgba(107,138,58,0.12)',
                              color: isJob ? '#38bdf8' : 'var(--primary)',
                            }}
                          >
                            {isJob ? 'Job Match' : 'General'}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            Source: {scan.source || 'PROFILE'}
                          </span>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '1px 6px', borderRadius: 4, border: '1px solid var(--border)' }}>
                            {scan.scoring_version || 'ats-v2-untuned'}
                          </span>
                        </div>

                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                          {scan.result?.targetJobTitle || (isJob ? `Target Job #${scan.job_id || ''}` : 'General ATS Benchmark')}
                        </div>

                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {dateStr}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleViewScan(scan.id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#fff',
                        background: 'var(--primary)',
                        border: 'none',
                        borderRadius: 8,
                        padding: '8px 16px',
                        cursor: 'pointer',
                        transition: 'opacity 0.15s ease',
                      }}
                    >
                      View Report <ExternalLink size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScanHistoryPage;
