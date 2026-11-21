import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  FileText,
  FileCheck2,
  Layers,
  Award,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Zap,
  Target,
  ListFilter,
  Check,
  X,
  Info,
} from 'lucide-react';

/**
 * Helper to determine badge color and gradient based on overall ATS score
 */
const getScoreGrade = (score) => {
  const num = Number(score) || 0;
  if (num >= 80) {
    return {
      color: '#22c55e',
      border: 'rgba(34, 197, 94, 0.35)',
      bg: 'rgba(34, 197, 94, 0.12)',
      label: 'Excellent',
      desc: 'High ATS compatibility with strong keyword coverage and structure.',
    };
  }
  if (num >= 65) {
    return {
      color: '#84cc16',
      border: 'rgba(132, 204, 22, 0.35)',
      bg: 'rgba(132, 204, 22, 0.12)',
      label: 'Good Match',
      desc: 'Solid compatibility with a few recommended keyword and formatting tweaks.',
    };
  }
  if (num >= 50) {
    return {
      color: '#f59e0b',
      border: 'rgba(245, 158, 11, 0.35)',
      bg: 'rgba(245, 158, 11, 0.12)',
      label: 'Moderate',
      desc: 'Moderate alignment. Several key sections or keywords are missing.',
    };
  }
  return {
    color: '#ef4444',
    border: 'rgba(239, 68, 68, 0.35)',
    bg: 'rgba(239, 68, 68, 0.12)',
    label: 'Needs Work',
    desc: 'Low ATS readability or missing critical job keywords and standard sections.',
  };
};

/**
 * AtsScoreCard Component
 *
 * Displays detailed ATS evaluation for a resume:
 *  - Overall ATS Score (0-100) with rating and mode badge
 *  - Component Breakdown (Keywords, Sections, Formatting, Length)
 *  - Matched vs Missing JD Keywords
 *  - Section Detection Checklist
 *  - Formatting Signals (Bullets, Dates, Metrics, Action Verbs)
 *  - Actionable Improvement Suggestions
 *  - Parsability Advisory
 */
const AtsScoreCard = ({
  atsData,
  loading = false,
  onRefresh = null,
  title = 'ATS Resume Match Analysis',
  subtitle = null,
}) => {
  const [showAllKeywords, setShowAllKeywords] = useState(false);
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);

  if (loading) {
    return (
      <div
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: '36px 24px',
          textAlign: 'center',
          boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ height: 3, background: 'linear-gradient(90deg, #3D5016, #6B8A3A, #a3e635)', borderRadius: '20px 20px 0 0', margin: '-36px -24px 30px -24px' }} />
        <RefreshCw size={26} className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto 14px' }} />
        <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
          Evaluating ATS Compatibility…
        </h4>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Scanning resume keywords, section headers, formatting markers, and job alignment.
        </p>
      </div>
    );
  }

  if (!atsData) {
    return null;
  }

  const {
    overall_score = 0,
    match_strength = 'Moderate',
    mode = 'general',
    score_breakdown = {},
    detected_sections = {},
    format_signals = {},
    keyword_analysis = null,
    category_prediction = null,
    suggestions = [],
    parsability = null,
    created_at = null,
  } = atsData;

  const grade = getScoreGrade(overall_score);
  const isJobSpecific = mode === 'job_specific' || Boolean(keyword_analysis?.matched_keywords);

  const matchedKeywords = keyword_analysis?.matched_keywords || [];
  const missingKeywords = keyword_analysis?.missing_keywords || [];
  const matchPercentage = keyword_analysis?.match_percentage ?? (matchedKeywords.length + missingKeywords.length > 0 ? Math.round((matchedKeywords.length / (matchedKeywords.length + missingKeywords.length)) * 100) : null);

  const displayedMatched = showAllKeywords ? matchedKeywords : matchedKeywords.slice(0, 10);
  const displayedMissing = showAllKeywords ? missingKeywords : missingKeywords.slice(0, 10);
  const displayedSuggestions = showAllSuggestions ? suggestions : suggestions.slice(0, 4);

  const formattedDate = created_at
    ? new Date(created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
      }}
    >
      {/* Top Accent Gradient */}
      <div
        style={{
          height: 4,
          background: `linear-gradient(90deg, ${grade.color}, #6B8A3A, #a3e635)`,
        }}
      />

      <div style={{ padding: 'clamp(18px, 3vw, 28px)' }}>
        {/* Header Bar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 20,
            borderBottom: '1px solid var(--border)',
            paddingBottom: 16,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: isJobSpecific ? '#38bdf8' : 'var(--primary)',
                  background: isJobSpecific ? 'rgba(56, 189, 248, 0.12)' : 'rgba(107, 138, 58, 0.14)',
                  padding: '3px 10px',
                  borderRadius: 999,
                  border: `1px solid ${isJobSpecific ? 'rgba(56, 189, 248, 0.28)' : 'rgba(107, 138, 58, 0.28)'}`,
                }}
              >
                {isJobSpecific ? <Target size={11} /> : <FileCheck2 size={11} />}
                {isJobSpecific ? 'Job-Specific Match' : 'General ATS Benchmark'}
              </span>

              {category_prediction?.predicted_category && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    background: 'var(--card-row-bg)',
                    padding: '3px 10px',
                    borderRadius: 999,
                    border: '1px solid var(--border)',
                  }}
                >
                  Role: {category_prediction.predicted_category}
                </span>
              )}
            </div>

            <h3 style={{ fontSize: 'clamp(17px, 2.5vw, 20px)', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              {title}
            </h3>
            {subtitle && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, marginBottom: 0 }}>
                {subtitle}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {formattedDate && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Analyzed {formattedDate}
              </span>
            )}
            {onRefresh && (
              <button
                onClick={onRefresh}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  background: 'var(--card-row-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '6px 12px',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
              >
                <RefreshCw size={13} />
                Re-check
              </button>
            )}
          </div>
        </div>

        {/* Hero Score Showcase */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 18,
            marginBottom: 24,
          }}
        >
          {/* Main Score Box */}
          <div
            style={{
              padding: '20px 24px',
              borderRadius: 16,
              background: 'var(--card-row-bg)',
              border: `1px solid ${grade.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: 20,
            }}
          >
            {/* Score Ring / Pill */}
            <div
              style={{
                width: 76,
                height: 76,
                borderRadius: '50%',
                background: grade.bg,
                border: `3px solid ${grade.color}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: `0 0 16px ${grade.bg}`,
              }}
            >
              <span style={{ fontSize: 24, fontWeight: 900, color: grade.color, lineHeight: 1 }}>
                {Math.round(overall_score)}
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, color: grade.color, opacity: 0.85 }}>
                / 100
              </span>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: grade.color }}>
                  {grade.label}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    background: 'var(--bg-elevated)',
                    padding: '2px 8px',
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                  }}
                >
                  {match_strength}
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                {grade.desc}
              </p>
            </div>
          </div>

          {/* Sub-Score Progress Bars */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: 16,
              background: 'var(--card-row-bg)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 10,
            }}
          >
            {isJobSpecific && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                  <span>Keyword Match</span>
                  <span style={{ color: '#38bdf8' }}>{Math.round(score_breakdown.keyword_match ?? matchPercentage ?? 0)}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 999, background: 'var(--border)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, score_breakdown.keyword_match ?? matchPercentage ?? 0)}%`, background: '#38bdf8', borderRadius: 999 }} />
                </div>
              </div>
            )}

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                <span>Sections Completeness</span>
                <span style={{ color: 'var(--primary)' }}>{Math.round(score_breakdown.sections ?? 0)}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 999, background: 'var(--border)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, score_breakdown.sections ?? 0)}%`, background: 'var(--primary)', borderRadius: 999 }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                <span>Formatting & Structure</span>
                <span style={{ color: '#a3e635' }}>{Math.round(score_breakdown.format ?? 0)}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 999, background: 'var(--border)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, score_breakdown.format ?? 0)}%`, background: '#a3e635', borderRadius: 999 }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                <span>Length & Word Density</span>
                <span style={{ color: '#f59e0b' }}>{Math.round(score_breakdown.length ?? 0)}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 999, background: 'var(--border)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, score_breakdown.length ?? 0)}%`, background: '#f59e0b', borderRadius: 999 }} />
              </div>
            </div>
          </div>
        </div>

        {/* Keywords Match Section (Only for job-specific or if keyword_analysis exists) */}
        {isJobSpecific && (
          <div
            style={{
              padding: '18px 20px',
              borderRadius: 16,
              background: 'var(--card-row-bg)',
              border: '1px solid var(--border)',
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Target size={16} style={{ color: '#38bdf8' }} />
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Target Keywords Breakdown
                </h4>
              </div>
              {matchPercentage !== null && (
                <span style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8' }}>
                  {matchPercentage}% Target Coverage ({matchedKeywords.length}/{matchedKeywords.length + missingKeywords.length})
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {/* Matched Keywords */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#22c55e', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={13} />
                  Matched in Resume ({matchedKeywords.length})
                </div>
                {matchedKeywords.length === 0 ? (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
                    No targeted keywords matched.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {displayedMatched.map((kw, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#22c55e',
                          background: 'rgba(34, 197, 94, 0.10)',
                          border: '1px solid rgba(34, 197, 94, 0.25)',
                          padding: '3px 8px',
                          borderRadius: 6,
                        }}
                      >
                        ✓ {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Missing Keywords */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#f87171', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertCircle size={13} />
                  Missing from Job Description ({missingKeywords.length})
                </div>
                {missingKeywords.length === 0 ? (
                  <p style={{ fontSize: 12, color: '#22c55e', fontWeight: 600, margin: 0 }}>
                    All essential job keywords detected in resume!
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {displayedMissing.map((kw, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#f87171',
                          background: 'rgba(248, 113, 113, 0.10)',
                          border: '1px solid rgba(248, 113, 113, 0.25)',
                          padding: '3px 8px',
                          borderRadius: 6,
                        }}
                      >
                        + {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {(matchedKeywords.length > 10 || missingKeywords.length > 10) && (
              <button
                onClick={() => setShowAllKeywords(!showAllKeywords)}
                style={{
                  marginTop: 12,
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--primary)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {showAllKeywords ? 'Show fewer keywords' : `Show all keywords (${matchedKeywords.length + missingKeywords.length})`}
                {showAllKeywords ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            )}
          </div>
        )}

        {/* Section Checks & Format Signals Dual Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16,
            marginBottom: 20,
          }}
        >
          {/* Detected Sections Checklist */}
          <div
            style={{
              padding: '16px 18px',
              borderRadius: 14,
              background: 'var(--card-row-bg)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Layers size={15} style={{ color: 'var(--primary)' }} />
              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Standard ATS Sections
              </h4>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {Object.entries(detected_sections).map(([sec, present]) => (
                <div
                  key={sec}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 11,
                    fontWeight: 500,
                    color: present ? 'var(--text-primary)' : 'var(--text-muted)',
                  }}
                >
                  {present ? (
                    <span style={{ color: '#22c55e', display: 'flex' }}><Check size={13} /></span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', opacity: 0.5, display: 'flex' }}><X size={13} /></span>
                  )}
                  <span style={{ textDecoration: present ? 'none' : 'line-through', opacity: present ? 1 : 0.65 }}>
                    {sec}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Formatting & Content Signals */}
          <div
            style={{
              padding: '16px 18px',
              borderRadius: 14,
              background: 'var(--card-row-bg)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <FileText size={15} style={{ color: '#a3e635' }} />
              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Formatting & Impact Markers
              </h4>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 500, color: format_signals.has_bullets ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {format_signals.has_bullets ? <span style={{ color: '#22c55e' }}><Check size={13} /></span> : <span style={{ opacity: 0.5 }}><X size={13} /></span>}
                <span>Bullet Points</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 500, color: format_signals.has_dates ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {format_signals.has_dates ? <span style={{ color: '#22c55e' }}><Check size={13} /></span> : <span style={{ opacity: 0.5 }}><X size={13} /></span>}
                <span>Timeline Dates</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 500, color: format_signals.quantified_impact ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {format_signals.quantified_impact ? <span style={{ color: '#22c55e' }}><Check size={13} /></span> : <span style={{ opacity: 0.5 }}><X size={13} /></span>}
                <span>Quantified Metrics</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 500, color: format_signals.action_verbs ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {format_signals.action_verbs ? <span style={{ color: '#22c55e' }}><Check size={13} /></span> : <span style={{ opacity: 0.5 }}><X size={13} /></span>}
                <span>Strong Action Verbs</span>
              </div>
            </div>

            {parsability && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text-secondary)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {parsability.page_count && <span>Pages: <strong>{parsability.page_count}</strong></span>}
                {parsability.text_density && <span>Words/Page: <strong>{Math.round(parsability.text_density)}</strong></span>}
                {parsability.has_text_layer !== undefined && <span>Selectable Text: <strong>{parsability.has_text_layer ? 'Yes' : 'No'}</strong></span>}
              </div>
            )}
          </div>
        </div>

        {/* Actionable Suggestions */}
        {suggestions && suggestions.length > 0 && (
          <div
            style={{
              padding: '16px 20px',
              borderRadius: 16,
              background: 'rgba(245, 158, 11, 0.05)',
              border: '1px solid rgba(245, 158, 11, 0.20)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Zap size={15} style={{ color: '#f59e0b' }} />
              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                ATS Optimization Recommendations
              </h4>
            </div>

            <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {displayedSuggestions.map((sug, i) => (
                <li key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  {sug}
                </li>
              ))}
            </ul>

            {suggestions.length > 4 && (
              <button
                onClick={() => setShowAllSuggestions(!showAllSuggestions)}
                style={{
                  marginTop: 10,
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#f59e0b',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {showAllSuggestions ? 'Show fewer recommendations' : `View all (${suggestions.length}) recommendations`}
                {showAllSuggestions ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AtsScoreCard;
