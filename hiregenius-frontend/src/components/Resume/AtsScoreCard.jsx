import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  AlertCircle,
  FileText,
  FileCheck2,
  Layers,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Zap,
  Target,
  Check,
  X,
  Info,
  ShieldAlert,
  FileLock,
  Code,
} from 'lucide-react';

/**
 * Determine badge color and styling based on overall ATS score
 */
const getScoreGrade = (score, gradeLabel = null) => {
  const num = Number(score) || 0;
  if (num >= 80) {
    return {
      color: '#22c55e',
      border: 'rgba(34, 197, 94, 0.35)',
      bg: 'rgba(34, 197, 94, 0.12)',
      label: gradeLabel || 'Strong Match',
      desc: 'High ATS compatibility with strong structure, section headers, and keyword alignment.',
    };
  }
  if (num >= 65) {
    return {
      color: '#84cc16',
      border: 'rgba(132, 204, 22, 0.35)',
      bg: 'rgba(132, 204, 22, 0.12)',
      label: gradeLabel || 'Good Match',
      desc: 'Solid compatibility with a few recommended keyword additions or formatting improvements.',
    };
  }
  if (num >= 50) {
    return {
      color: '#f59e0b',
      border: 'rgba(245, 158, 11, 0.35)',
      bg: 'rgba(245, 158, 11, 0.12)',
      label: gradeLabel || 'Moderate',
      desc: 'Moderate alignment. Missing key job skills, bullet points, or standard sections.',
    };
  }
  return {
    color: '#ef4444',
    border: 'rgba(239, 68, 68, 0.35)',
    bg: 'rgba(239, 68, 68, 0.12)',
    label: gradeLabel || 'Needs Work',
    desc: 'Low ATS readability or missing critical job requirements and standard resume sections.',
  };
};

/**
 * AtsScoreCard Component (ATS v2 Heuristic Engine)
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
  const [showTextPreview, setShowTextPreview] = useState(false);
  const [suggestionFilter, setSuggestionFilter] = useState('ALL'); // 'ALL' | 'CRITICAL' | 'RECOMMENDATION' | 'TIP'

  if (loading) {
    return (
      <div
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: '40px 24px',
          textAlign: 'center',
          boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ height: 3, background: 'linear-gradient(90deg, #3D5016, #6B8A3A, #a3e635)', borderRadius: '20px 20px 0 0', margin: '-40px -24px 30px -24px' }} />
        <RefreshCw size={28} className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto 14px' }} />
        <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
          Evaluating Resume ATS Compatibility…
        </h4>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 440, margin: '0 auto' }}>
          Scanning text readability, standard section headers, keyword alignment, and layout signals with ATS v2 heuristics.
        </p>
      </div>
    );
  }

  if (!atsData) {
    return null;
  }

  // Support both direct v2 payload and wrapped { success, data: { ... } }
  const data = atsData.result || atsData;

  const overallScore = Number(data.overallScore ?? data.overall_score ?? 0);
  const scoringVersion = data.scoringVersion || 'ats-v2-untuned';
  const mode = (data.mode || 'GENERAL').toUpperCase();
  const gradeLabel = data.grade || data.match_strength;
  const grade = getScoreGrade(overallScore, gradeLabel);

  const isJobMode = mode === 'JOB' || mode === 'JOB_SPECIFIC';
  const targetJobTitle = data.targetJobTitle || null;
  const unreadableReason = data.unreadableReason || null;
  const aiUnavailable = Boolean(data.aiSuggestionsUnavailable);

  // Categories (v2) or legacy score_breakdown
  const categories = data.categories || {};
  const hasCategories = Object.keys(categories).length > 0;

  // Critical Issues
  const criticalIssues = data.criticalIssues || [];

  // Keywords (v2 structured: { matched: [...], missing: [...] } or legacy { matched_keywords: [...], missing_keywords: [...] })
  const rawKeywords = data.keywords || data.keyword_analysis || {};
  const matchedKeywords = (rawKeywords.matched || rawKeywords.matched_keywords || []).map((k) =>
    typeof k === 'string' ? { keyword: k, importance: 'required', evidence: null } : k
  );
  const missingKeywords = (rawKeywords.missing || rawKeywords.missing_keywords || []).map((k) =>
    typeof k === 'string' ? { keyword: k, importance: 'required' } : k
  );

  const displayedMatched = showAllKeywords ? matchedKeywords : matchedKeywords.slice(0, 12);
  const displayedMissing = showAllKeywords ? missingKeywords : missingKeywords.slice(0, 12);

  // Suggestions (v2 structured: [{ category, tip, severity }] or strings)
  const rawSuggestions = data.suggestions || [];
  const normalizedSuggestions = rawSuggestions.map((s) =>
    typeof s === 'string' ? { category: 'General', tip: s, severity: 'recommendation' } : s
  );

  const filteredSuggestions = normalizedSuggestions.filter((s) => {
    if (suggestionFilter === 'ALL') return true;
    return (s.severity || '').toUpperCase() === suggestionFilter;
  });

  const displayedSuggestions = showAllSuggestions ? filteredSuggestions : filteredSuggestions.slice(0, 5);

  // Format Signals & Sections
  const formatSignals = data.formatSignals || data.format_signals || {};
  const sections = data.sections || {
    found: Object.keys(data.detected_sections || {}).filter((k) => data.detected_sections[k]),
    missing: Object.keys(data.detected_sections || {}).filter((k) => !data.detected_sections[k]),
  };

  const formattedDate = data.createdAt || data.created_at
    ? new Date(data.createdAt || data.created_at).toLocaleDateString('en-US', {
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: isJobMode ? '#38bdf8' : 'var(--primary)',
                  background: isJobMode ? 'rgba(56, 189, 248, 0.12)' : 'rgba(107, 138, 58, 0.14)',
                  padding: '3px 10px',
                  borderRadius: 999,
                  border: `1px solid ${isJobMode ? 'rgba(56, 189, 248, 0.28)' : 'rgba(107, 138, 58, 0.28)'}`,
                }}
              >
                {isJobMode ? <Target size={11} /> : <FileCheck2 size={11} />}
                {isJobMode ? 'Job-Specific Match' : 'General ATS Benchmark'}
              </span>

              {targetJobTitle && (
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
                  Target Role: {targetJobTitle}
                </span>
              )}

              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  background: 'var(--card-row-bg)',
                  padding: '2px 8px',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                }}
              >
                v: {scoringVersion}
              </span>
            </div>

            <h3 style={{ fontSize: 'clamp(18px, 2.5vw, 22px)', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
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

        {/* ── Transparent Heuristic Estimate Disclaimer ───────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            padding: '10px 14px',
            borderRadius: 12,
            background: 'rgba(107, 138, 58, 0.08)',
            border: '1px solid rgba(107, 138, 58, 0.22)',
            marginBottom: 20,
            fontSize: 12,
            color: 'var(--text-secondary)',
            lineHeight: 1.45,
          }}
        >
          <Info size={16} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong>Transparent Heuristic Estimate: </strong>
            This ATS score is an automated heuristic estimate, not a guarantee of employer hiring decisions. Based on scoring version{' '}
            <code style={{ fontSize: 11, background: 'rgba(0,0,0,0.06)', padding: '1px 5px', borderRadius: 4 }}>
              {scoringVersion}
            </code>
            .
          </div>
        </div>

        {/* ── Unreadable / Encrypted File Warning Banner ────────────────────────── */}
        {unreadableReason && (
          <div
            style={{
              padding: '16px 18px',
              borderRadius: 14,
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 14,
            }}
          >
            <FileLock size={22} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: '#ef4444', margin: '0 0 4px 0' }}>
                Unreadable Document: Overall Score Capped at 10
              </h4>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 8px 0', lineHeight: 1.4 }}>
                {unreadableReason}. Standard Applicant Tracking Systems cannot read plain text from image scans, encrypted files, or corrupted layers. Text-based categories cannot be assessed.
              </p>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                How to resolve:
                <ul style={{ margin: '4px 0 0 0', paddingLeft: 18, fontWeight: 400, color: 'var(--text-secondary)' }}>
                  <li>Export your resume directly from Microsoft Word, Google Docs, or LaTeX with selectable text.</li>
                  <li>Ensure the PDF does not require a password to open.</li>
                  <li>Do not use phone scanner apps that save resumes as pure image photos inside a PDF wrapper.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ── Hero Score Showcase ────────────────────────────────────────────── */}
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
            {/* Score Ring */}
            <div
              style={{
                width: 82,
                height: 82,
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
              <span style={{ fontSize: 26, fontWeight: 900, color: grade.color, lineHeight: 1 }}>
                {Math.round(overallScore)}
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, color: grade.color, opacity: 0.85 }}>
                / 100
              </span>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 17, fontWeight: 800, color: grade.color }}>
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
                  {isJobMode ? 'Job Target Mode' : 'General Benchmark'}
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                {grade.desc}
              </p>
            </div>
          </div>

          {/* Sub-Score Progress Bars / Category Summary */}
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
            {hasCategories ? (
              Object.entries(categories).map(([catName, catData]) => {
                const max = catData.max || 100;
                const score = catData.score || 0;
                const pct = max > 0 ? Math.min(100, Math.round((score / max) * 100)) : 0;
                const isAssessable = catData.status !== 'not_assessable';

                return (
                  <div key={catName}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                      <span>{catName}</span>
                      <span style={{ color: isAssessable ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {isAssessable ? `${score} / ${max}` : 'Not assessable'}
                      </span>
                    </div>
                    <div style={{ height: 6, borderRadius: 999, background: 'var(--border)', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${pct}%`,
                          background: isAssessable
                            ? pct >= 75
                              ? '#22c55e'
                              : pct >= 50
                              ? '#f59e0b'
                              : '#ef4444'
                            : 'var(--border)',
                          borderRadius: 999,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              // Fallback for legacy breakdown
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                  <span>Readability & Structure</span>
                  <span>{Math.round(overallScore)}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 999, background: 'var(--border)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, overallScore)}%`, background: 'var(--primary)', borderRadius: 999 }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Critical Issues Section (If any) ───────────────────────────────── */}
        {criticalIssues.length > 0 && (
          <div
            style={{
              padding: '16px 20px',
              borderRadius: 16,
              background: 'rgba(239, 68, 68, 0.06)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <ShieldAlert size={16} style={{ color: '#ef4444' }} />
              <h4 style={{ fontSize: 14, fontWeight: 700, color: '#ef4444', margin: 0 }}>
                Critical ATS Issues Detected ({criticalIssues.length})
              </h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {criticalIssues.map((issue, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: 'var(--bg-elevated)',
                    border: '1px solid rgba(239, 68, 68, 0.20)',
                    fontSize: 12,
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#ef4444', marginBottom: 2 }}>
                    [{issue.category || 'Format'}] {issue.issue}
                  </div>
                  {issue.fix && (
                    <div style={{ color: 'var(--text-secondary)' }}>
                      <strong>Actionable Fix: </strong> {issue.fix}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Keywords Match Section (JOB Mode) ──────────────────────────────── */}
        {isJobMode && (
          <div
            style={{
              padding: '18px 20px',
              borderRadius: 16,
              background: 'var(--card-row-bg)',
              border: '1px solid var(--border)',
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Target size={16} style={{ color: '#38bdf8' }} />
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Target Keywords & Role Coverage
                </h4>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8' }}>
                Coverage: {matchedKeywords.length} of {matchedKeywords.length + missingKeywords.length} detected
              </span>
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
                    No target keywords matched.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {displayedMatched.map((kObj, i) => (
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
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Check size={11} /> {kObj.keyword}
                        {kObj.importance === 'required' && (
                          <span style={{ fontSize: 9, opacity: 0.75, background: 'rgba(34, 197, 94, 0.2)', padding: '0 4px', borderRadius: 4 }}>
                            Req
                          </span>
                        )}
                        {kObj.evidence === 'skills' && (
                          <span style={{ fontSize: 9, color: '#f59e0b', opacity: 0.85 }} title="Listed in skills list without supporting bullet in experience">
                            (Skills only)
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Missing Keywords */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#f87171', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertCircle size={13} />
                  Missing from Resume ({missingKeywords.length})
                </div>
                {missingKeywords.length === 0 ? (
                  <p style={{ fontSize: 12, color: '#22c55e', fontWeight: 600, margin: 0 }}>
                    All essential job keywords detected in resume!
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {displayedMissing.map((kObj, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: kObj.importance === 'required' ? '#ef4444' : '#f87171',
                          background: kObj.importance === 'required' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(248, 113, 113, 0.08)',
                          border: `1px solid ${kObj.importance === 'required' ? 'rgba(239, 68, 68, 0.35)' : 'rgba(248, 113, 113, 0.20)'}`,
                          padding: '3px 8px',
                          borderRadius: 6,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        + {kObj.keyword}
                        {kObj.importance === 'required' && (
                          <span style={{ fontSize: 9, background: 'rgba(239, 68, 68, 0.2)', padding: '0 4px', borderRadius: 4 }}>
                            Required
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {(matchedKeywords.length > 12 || missingKeywords.length > 12) && (
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

        {/* ── Document Structure & Formatting Signals ────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16,
            marginBottom: 20,
          }}
        >
          {/* Section Checks */}
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
                Core Resume Sections
              </h4>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {Array.isArray(sections.found) &&
                sections.found.map((sec) => (
                  <div key={sec} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 500, color: 'var(--text-primary)' }}>
                    <span style={{ color: '#22c55e', display: 'flex' }}><Check size={13} /></span>
                    <span>{sec}</span>
                  </div>
                ))}
              {Array.isArray(sections.missing) &&
                sections.missing.map((sec) => (
                  <div key={sec} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 500, color: 'var(--text-muted)' }}>
                    <span style={{ color: '#ef4444', display: 'flex' }}><X size={13} /></span>
                    <span style={{ textDecoration: 'line-through', opacity: 0.7 }}>{sec}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Formatting & Impact Signals */}
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
                Formatting & Layout Signals
              </h4>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 11 }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Word Count: </span>
                <strong style={{ color: 'var(--text-primary)' }}>{formatSignals.wordCount ?? '—'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Page Count: </span>
                <strong style={{ color: 'var(--text-primary)' }}>{formatSignals.pageCount ?? '—'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Bullet Ratio: </span>
                <strong style={{ color: 'var(--text-primary)' }}>
                  {formatSignals.bulletRatio !== undefined ? `${Math.round(formatSignals.bulletRatio * 100)}%` : '—'}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Metrics Found: </span>
                <strong style={{ color: 'var(--text-primary)' }}>{formatSignals.quantifiedImpactCount ?? '—'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Multi-Column: </span>
                <strong style={{ color: formatSignals.hasMultiColumn ? '#f59e0b' : '#22c55e' }}>
                  {formatSignals.hasMultiColumn ? 'Detected' : 'Clean single-col'}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Tables: </span>
                <strong style={{ color: formatSignals.hasTables ? '#f59e0b' : '#22c55e' }}>
                  {formatSignals.hasTables ? 'Detected' : 'None'}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* ── Actionable AI Recommendations & Tips ────────────────────────────── */}
        {normalizedSuggestions.length > 0 && (
          <div
            style={{
              padding: '18px 20px',
              borderRadius: 16,
              background: 'rgba(245, 158, 11, 0.05)',
              border: '1px solid rgba(245, 158, 11, 0.20)',
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Zap size={16} style={{ color: '#f59e0b' }} />
                <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Actionable Recommendations & Tips
                </h4>
              </div>

              {/* Filter Tabs */}
              <div style={{ display: 'flex', gap: 4, background: 'var(--bg-elevated)', padding: 2, borderRadius: 8, border: '1px solid var(--border)' }}>
                {['ALL', 'CRITICAL', 'RECOMMENDATION', 'TIP'].map((flt) => (
                  <button
                    key={flt}
                    onClick={() => setSuggestionFilter(flt)}
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: 6,
                      border: 'none',
                      background: suggestionFilter === flt ? 'var(--primary)' : 'transparent',
                      color: suggestionFilter === flt ? '#fff' : 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    {flt === 'ALL' ? 'All' : flt.charAt(0) + flt.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {aiUnavailable && (
              <div style={{ fontSize: 11, color: '#f59e0b', fontStyle: 'italic', marginBottom: 8 }}>
                AI-personalized phrasing is currently offline. Rule-based heuristic suggestions are displayed below.
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {displayedSuggestions.map((sug, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.45,
                  }}
                >
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '2px 6px',
                      borderRadius: 4,
                      background:
                        sug.severity === 'critical'
                          ? 'rgba(239, 68, 68, 0.15)'
                          : sug.severity === 'tip'
                          ? 'rgba(107, 138, 58, 0.15)'
                          : 'rgba(245, 158, 11, 0.15)',
                      color:
                        sug.severity === 'critical'
                          ? '#ef4444'
                          : sug.severity === 'tip'
                          ? 'var(--primary)'
                          : '#f59e0b',
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    {sug.severity || 'Tip'}
                  </span>
                  <div>
                    {sug.category && <strong style={{ color: 'var(--text-primary)' }}>[{sug.category}] </strong>}
                    {sug.tip}
                  </div>
                </div>
              ))}
            </div>

            {filteredSuggestions.length > 5 && (
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
                {showAllSuggestions ? 'Show fewer recommendations' : `View all (${filteredSuggestions.length}) recommendations`}
                {showAllSuggestions ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            )}
          </div>
        )}

        {/* ── Extracted Text Preview Accordion ───────────────────────────────── */}
        {data.extractedTextPreview && (
          <div
            style={{
              borderRadius: 14,
              border: '1px solid var(--border)',
              background: 'var(--card-row-bg)',
              overflow: 'hidden',
            }}
          >
            <button
              onClick={() => setShowTextPreview(!showTextPreview)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Code size={14} style={{ color: 'var(--primary)' }} />
                ATS Extracted Text Preview (What ATS parsers see)
              </span>
              {showTextPreview ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showTextPreview && (
              <div style={{ padding: '0 16px 14px 16px', borderTop: '1px solid var(--border)' }}>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '8px 0 6px 0' }}>
                  If words are scrambled, missing, or merged together here, an ATS cannot index them.
                </p>
                <pre
                  style={{
                    fontSize: 11,
                    fontFamily: 'monospace',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: 10,
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    maxHeight: 180,
                    overflowY: 'auto',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {data.extractedTextPreview}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AtsScoreCard;
