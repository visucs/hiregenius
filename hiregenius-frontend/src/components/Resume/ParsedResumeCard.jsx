import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  FileText,
  Briefcase,
  GraduationCap,
  Award,
  FolderGit2,
  RefreshCw,
  Clock,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Calendar,
  Layers,
} from 'lucide-react';
import candidatesService from '../../services/candidatesService';

/**
 * ParsedResumeCard
 *
 * Displays AI-parsed resume data fetched from Phase 6 Core API / AI-ML service.
 * Supports Candidate view (GET /api/candidates/me/resume/parsed)
 * and Recruiter view (GET /api/candidates/:id/resume/parsed).
 *
 * Handles 4 states gracefully:
 *  1. Loading: Animated spinner / skeleton
 *  2. Empty / Pending (HTTP 404): Gentle message stating processing is in progress or no resume on file yet.
 *  3. Error (HTTP 401/403/500): Explicit error banner with retry option.
 *  4. Populated: Structured skills tags, experience timeline, education, certifications, projects, and metadata.
 */
const ParsedResumeCard = ({
  candidateId = null,
  isRecruiter = false,
  externalData = null,
  externalLoading = false,
  onParsedLoaded = null,
  variant = 'card', // 'card' | 'embedded' | 'page'
}) => {
  const [parsedData, setParsedData] = useState(externalData);
  const [loading, setLoading] = useState(externalLoading || !externalData);
  const [statusState, setStatusState] = useState('idle'); // 'idle' | 'pending_404' | 'error' | 'success'
  const [errorMessage, setErrorMessage] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    skills: true,
    experience: true,
    education: true,
    certifications: true,
    projects: true,
  });

  const fetchParsed = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setErrorMessage(null);

    try {
      let res;
      if (isRecruiter && candidateId) {
        res = await candidatesService.getCandidateParsedResume(candidateId);
      } else {
        res = await candidatesService.getParsedResume();
      }

      const doc = res?.data ?? null;
      if (doc && doc.parsed_data) {
        setParsedData(doc);
        setStatusState('success');
        if (onParsedLoaded) onParsedLoaded(doc);
      } else {
        setParsedData(null);
        setStatusState('pending_404');
      }
    } catch (err) {
      const status = err.response?.status;
      if (status === 404) {
        // HTTP 404 means parsing is still in progress, failed silently, or no resume exists yet.
        // This is a legitimate pending state, not a red network error!
        setParsedData(null);
        setStatusState('pending_404');
      } else if (status === 403) {
        setParsedData(null);
        setStatusState('error');
        setErrorMessage(
          err.response?.data?.message ||
            'Access denied: You do not have permission to view this applicant’s parsed resume.'
        );
      } else {
        setParsedData(null);
        setStatusState('error');
        setErrorMessage(
          err.response?.data?.message || err.message || 'Failed to retrieve parsed resume analysis.'
        );
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [isRecruiter, candidateId, onParsedLoaded]);

  useEffect(() => {
    if (externalData) {
      setParsedData(externalData);
      setStatusState('success');
      setLoading(false);
    } else {
      fetchParsed();
    }
  }, [externalData, fetchParsed]);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const parsed = parsedData?.parsed_data;
  const skills = Array.isArray(parsed?.skills) ? parsed.skills : [];
  const experience = Array.isArray(parsed?.experience) ? parsed.experience : [];
  const education = Array.isArray(parsed?.education) ? parsed.education : [];
  const certifications = Array.isArray(parsed?.certifications) ? parsed.certifications : [];
  const projects = Array.isArray(parsed?.projects) ? parsed.projects : [];

  const formattedParsedAt = parsedData?.parsed_at
    ? new Date(parsedData.parsed_at).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      })
    : null;

  // ── 1. LOADING STATE ──
  if (loading && !isRefreshing) {
    return (
      <div
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: '32px 24px',
          textAlign: 'center',
          boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ height: 3, background: 'linear-gradient(90deg, #3D5016, #6B8A3A, #a3e635)', borderRadius: '20px 20px 0 0', margin: '-32px -24px 28px -24px' }} />
        <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto 12px' }} />
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
          Retrieving AI Resume Analysis…
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Loading extracted skills, education, and career experience from the AI engine.
        </p>
      </div>
    );
  }

  // ── 2. PENDING / NOT PARSED YET (HTTP 404) ──
  if (statusState === 'pending_404') {
    return (
      <div
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ height: 3, background: 'linear-gradient(90deg, #f59e0b, #d97706)', borderRadius: '20px 20px 0 0' }} />
        <div style={{ padding: '24px 24px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: 'rgba(245,158,11,0.12)',
                  border: '1px solid rgba(245,158,11,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={18} style={{ color: '#f59e0b' }} />
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em', margin: 0 }}>
                  AI Resume Analysis
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  Google Gemini & LangChain extraction pipeline
                </p>
              </div>
            </div>

            <button
              onClick={() => fetchParsed(true)}
              disabled={isRefreshing}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 10,
                background: 'var(--card-row-bg)',
                border: '1px solid var(--border)',
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--text-primary)',
                cursor: isRefreshing ? 'wait' : 'pointer',
              }}
              title="Check for completed parse"
            >
              <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
              {isRefreshing ? 'Checking…' : 'Check Status'}
            </button>
          </div>

          <div
            style={{
              padding: '20px',
              borderRadius: 14,
              background: 'rgba(245,158,11,0.04)',
              border: '1px dashed rgba(245,158,11,0.30)',
              textAlign: 'center',
            }}
          >
            <Clock size={24} style={{ color: '#f59e0b', margin: '0 auto 8px', opacity: 0.8 }} />
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
              Resume Analysis Pending or Not Yet Uploaded
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 440, margin: '0 auto 14px', lineHeight: 1.55 }}>
              {isRecruiter
                ? 'This applicant either has not uploaded a resume yet or their resume is currently being analyzed by our AI service.'
                : 'Upload or update your resume below to trigger automatic AI entity extraction. Structured skills and career insights will appear here once processing completes.'}
            </p>
            {!isRecruiter && (
              <button
                type="button"
                onClick={() => document.getElementById('resume-upload-panel')?.scrollIntoView({ behavior: 'smooth' })}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #3D5016, #6B8A3A)',
                  color: '#fff',
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(61,80,22,0.35)',
                }}
              >
                <FileText size={13} />
                Upload Resume Below
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── 3. ERROR STATE ──
  if (statusState === 'error') {
    return (
      <div
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 20,
          padding: '24px',
          boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 11,
                background: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertCircle size={18} style={{ color: '#ef4444' }} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Unable to Load AI Analysis
              </p>
              <p style={{ fontSize: 11, color: '#f87171', margin: '2px 0 0' }}>{errorMessage}</p>
            </div>
          </div>
          <button
            onClick={() => fetchParsed(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 10,
              background: 'var(--card-row-bg)',
              border: '1px solid var(--border)',
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--text-primary)',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      </div>
    );
  }

  // ── 4. POPULATED STATE ──
  return (
    <div
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ height: 3, background: 'linear-gradient(90deg, #3D5016, #6B8A3A, #a3e635)', borderRadius: '20px 20px 0 0' }} />

      {/* Header bar */}
      <div
        style={{
          padding: '18px 24px 14px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(61,80,22,0.18), rgba(163,230,53,0.14))',
              border: '1px solid rgba(107,138,58,0.30)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Sparkles size={18} style={{ color: '#a3e635' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <p style={{ fontSize: 15, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.01em', margin: 0 }}>
                AI Parsed Resume Insights
              </p>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 10,
                  fontWeight: 800,
                  color: '#34d399',
                  background: 'rgba(52,211,153,0.12)',
                  padding: '2px 8px',
                  borderRadius: 999,
                  border: '1px solid rgba(52,211,153,0.25)',
                }}
              >
                <CheckCircle2 size={11} /> Phase 6 Live
              </span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>
              Extracted from {parsedData?.original_filename || 'uploaded document'}
              {formattedParsedAt ? ` · Parsed ${formattedParsedAt}` : ''}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {parsedData?.model_version && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--primary)',
                background: 'var(--pill-badge-bg)',
                padding: '4px 10px',
                borderRadius: 999,
                border: '1px solid var(--pill-badge-border)',
              }}
              title={`Parsed using ${parsedData.model_version}`}
            >
              <Cpu size={12} /> {parsedData.model_version}
            </span>
          )}
          <button
            onClick={() => fetchParsed(true)}
            disabled={isRefreshing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 12px',
              borderRadius: 10,
              background: 'var(--card-row-bg)',
              border: '1px solid var(--border)',
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--text-primary)',
              cursor: isRefreshing ? 'wait' : 'pointer',
            }}
            title="Re-check parsed resume"
          >
            <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Body content */}
      <div style={{ padding: '20px 24px 26px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Candidate Basic Identifiers (if parsed) */}
        {(parsed?.full_name || parsed?.email || parsed?.phone) && (
          <div
            style={{
              padding: '14px 18px',
              borderRadius: 14,
              background: 'var(--card-row-bg)',
              border: '1px solid var(--card-row-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', margin: '0 0 3px' }}>
                Extracted Identity
              </p>
              <p style={{ fontSize: 15, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                {parsed.full_name || 'Candidate'}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
              {parsed.email && <span>✉️ {parsed.email}</span>}
              {parsed.phone && <span>📞 {parsed.phone}</span>}
            </div>
          </div>
        )}

        {/* ── SECTION 1: DETECTED SKILLS ── */}
        <div>
          <div
            onClick={() => toggleSection('skills')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              marginBottom: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers size={16} style={{ color: 'var(--primary)' }} />
              <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-primary)', margin: 0 }}>
                Extracted Skills ({skills.length})
              </h3>
            </div>
            {expandedSections.skills ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
          </div>

          <AnimatePresence>
            {expandedSections.skills && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden' }}
              >
                {skills.length === 0 ? (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
                    No specific skills explicitly extracted from the document text.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    {skills.map((skill, idx) => (
                      <span
                        key={`${skill}-${idx}`}
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          padding: '5px 12px',
                          borderRadius: 999,
                          background: 'rgba(107,138,58,0.12)',
                          color: 'var(--primary)',
                          border: '1px solid rgba(107,138,58,0.25)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                        }}
                      >
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--primary)' }} />
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── SECTION 2: WORK EXPERIENCE ── */}
        <div>
          <div
            onClick={() => toggleSection('experience')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              marginBottom: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Briefcase size={16} style={{ color: '#60a5fa' }} />
              <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-primary)', margin: 0 }}>
                Experience History ({experience.length})
              </h3>
            </div>
            {expandedSections.experience ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
          </div>

          <AnimatePresence>
            {expandedSections.experience && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden' }}
              >
                {experience.length === 0 ? (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
                    No work experience entries detected.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {experience.map((exp, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '14px 16px',
                          borderRadius: 14,
                          background: 'var(--card-row-bg)',
                          border: '1px solid var(--card-row-border)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                              {exp.title || 'Role'}
                            </p>
                            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)', margin: '2px 0 0' }}>
                              {exp.company || 'Company'}
                            </p>
                          </div>
                          {exp.duration && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: 11,
                                fontWeight: 700,
                                color: 'var(--text-muted)',
                                background: 'rgba(255,255,255,0.04)',
                                padding: '3px 8px',
                                borderRadius: 8,
                                border: '1px solid var(--border)',
                              }}
                            >
                              <Calendar size={11} /> {exp.duration}
                            </span>
                          )}
                        </div>
                        {exp.description && (
                          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55, marginTop: 8, whiteSpace: 'pre-line' }}>
                            {exp.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── SECTION 3: EDUCATION ── */}
        <div>
          <div
            onClick={() => toggleSection('education')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              marginBottom: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <GraduationCap size={16} style={{ color: '#a78bfa' }} />
              <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-primary)', margin: 0 }}>
                Education ({education.length})
              </h3>
            </div>
            {expandedSections.education ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
          </div>

          <AnimatePresence>
            {expandedSections.education && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden' }}
              >
                {education.length === 0 ? (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
                    No education entries detected.
                  </p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
                    {education.map((edu, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '12px 14px',
                          borderRadius: 12,
                          background: 'var(--card-row-bg)',
                          border: '1px solid var(--card-row-border)',
                        }}
                      >
                        <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                          {edu.degree || 'Degree'}
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {edu.institution || 'Institution'} {edu.year ? `· ${edu.year}` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── SECTION 4: CERTIFICATIONS & PROJECTS (IF PRESENT) ── */}
        {(certifications.length > 0 || projects.length > 0) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {/* Certifications */}
            {certifications.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Award size={15} style={{ color: '#f59e0b' }} />
                  <h3 style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-primary)', margin: 0 }}>
                    Certifications ({certifications.length})
                  </h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {certifications.map((cert, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 10,
                        background: 'var(--card-row-bg)',
                        border: '1px solid var(--card-row-border)',
                        fontSize: 12,
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <CheckCircle2 size={13} style={{ color: '#f59e0b', flexShrink: 0 }} />
                      <span>{cert}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            {projects.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <FolderGit2 size={15} style={{ color: '#34d399' }} />
                  <h3 style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-primary)', margin: 0 }}>
                    Key Projects ({projects.length})
                  </h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {projects.map((proj, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 10,
                        background: 'var(--card-row-bg)',
                        border: '1px solid var(--card-row-border)',
                      }}
                    >
                      <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                        {proj.name || 'Project'}
                      </p>
                      {proj.description && (
                        <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.45 }}>
                          {proj.description}
                        </p>
                      )}
                      {Array.isArray(proj.technologies) && proj.technologies.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                          {proj.technologies.map((t, tidx) => (
                            <span
                              key={tidx}
                              style={{
                                fontSize: 10,
                                fontWeight: 600,
                                padding: '1px 6px',
                                borderRadius: 999,
                                background: 'rgba(52,211,153,0.10)',
                                color: '#34d399',
                              }}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParsedResumeCard;
