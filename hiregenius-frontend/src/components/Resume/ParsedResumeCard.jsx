import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Upload,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  X,
  FileCheck,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import candidatesService from '../../services/candidatesService';
import atsService from '../../services/atsService';

/**
 * ParsedResumeCard
 *
 * Displays AI-parsed resume data and Google Gemini predictive insights.
 * Supports:
 *  1. Candidate Profile parsed data from MongoDB (GET /api/candidates/me/resume/parsed)
 *  2. Rich ATS v2 & Gemini predictive recommendations from ATS scan (atsData)
 *  3. Interactive Drag-and-Drop Resume Upload directly inside this panel (saves to profile & runs AI analysis)
 *  4. Recruiter view (GET /api/candidates/:id/resume/parsed)
 */
const ParsedResumeCard = ({
  candidateId = null,
  isRecruiter = false,
  externalData = null,
  externalLoading = false,
  onParsedLoaded = null,
  variant = 'card', // 'card' | 'embedded' | 'page'
  atsData = null,
  onGoToChecker = null,
  onScanCompleted = null,
}) => {
  const [parsedData, setParsedData] = useState(externalData);
  const [loading, setLoading] = useState(externalLoading || !externalData);
  const [statusState, setStatusState] = useState('idle'); // 'idle' | 'pending_404' | 'error' | 'success'
  const [errorMessage, setErrorMessage] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [showTextPreview, setShowTextPreview] = useState(false);
  const [showUploadDropzone, setShowUploadDropzone] = useState(false);

  // Drag and Drop Upload State
  const [isDragging, setIsDragging] = useState(false);
  const [dropFile, setDropFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef(null);

  const [expandedSections, setExpandedSections] = useState({
    predictions: true,
    skills: true,
    experience: true,
    education: true,
    certifications: true,
    projects: true,
    signals: true,
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

  // ── Drag & Drop Handlers ───────────────────────────────────────────────
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];
    const isDocx = file.name.endsWith('.docx') || file.name.endsWith('.pdf');

    if (!allowed.includes(file.type) && !isDocx) {
      toast.error('Only PDF or DOCX resume documents are accepted.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds the 5MB limit.');
      return;
    }

    setDropFile(file);
  };

  const handleUploadAndAnalyze = async () => {
    if (!dropFile) {
      toast.error('Please select or drop a resume file first.');
      return;
    }

    setUploadingFile(true);
    const toastId = toast.loading('Uploading resume and analyzing with Google Gemini…');

    try {
      // 1. Save to candidate profile
      const profileFormData = new FormData();
      profileFormData.append('resume', dropFile);
      await candidatesService.uploadResume(profileFormData).catch((err) => {
        console.warn('Profile resume upload warning:', err?.message);
      });

      // 2. Run ATS Scan for immediate Gemini predictive insights
      const scanFormData = new FormData();
      scanFormData.append('resume', dropFile);
      scanFormData.append('mode', 'GENERAL');
      const scanRes = await atsService.scan(scanFormData);

      toast.success('Resume analyzed successfully with Google Gemini!', { id: toastId });
      setDropFile(null);
      setShowUploadDropzone(false);

      if (scanRes?.data) {
        if (onScanCompleted) {
          onScanCompleted(scanRes.data);
        }
      }

      // Re-fetch profile parsed resume
      await fetchParsed(true);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to analyze resume';
      toast.error(`Analysis failed: ${msg}`, { id: toastId });
    } finally {
      setUploadingFile(false);
    }
  };

  // ── Normalize Data from either MongoDB Parsed Resume OR ATS Scan ───────
  const parsed = parsedData?.parsed_data;
  const scanResult = atsData?.result || atsData;

  const hasParsedProfile = Boolean(parsed && (parsed.skills?.length || parsed.experience?.length || parsed.education?.length));
  const hasAtsInsights = Boolean(scanResult && (scanResult.overallScore !== undefined || scanResult.overall_score !== undefined || scanResult.issues?.length || scanResult.matchedKeywords?.length));

  // Extract skills from either source
  const skills = Array.isArray(parsed?.skills) && parsed.skills.length > 0
    ? parsed.skills
    : Array.isArray(scanResult?.matchedKeywords)
    ? scanResult.matchedKeywords
    : [];

  const experience = Array.isArray(parsed?.experience) ? parsed.experience : [];
  const education = Array.isArray(parsed?.education) ? parsed.education : [];
  const certifications = Array.isArray(parsed?.certifications) ? parsed.certifications : [];
  const projects = Array.isArray(parsed?.projects) ? parsed.projects : [];

  // ATS v2 & Gemini Insights
  const overallScore = scanResult?.overallScore ?? scanResult?.overall_score ?? null;
  const grade = scanResult?.grade || (overallScore >= 80 ? 'Good Match' : overallScore >= 60 ? 'Fair Match' : 'Needs Work');
  const issues = Array.isArray(scanResult?.issues) ? scanResult.issues : [];
  const missingRequired = Array.isArray(scanResult?.missingKeywords?.required) ? scanResult.missingKeywords.required : [];
  const missingPreferred = Array.isArray(scanResult?.missingKeywords?.preferred) ? scanResult.missingKeywords.preferred : [];
  const signals = scanResult?.signals || {};
  const extractedTextPreview = scanResult?.extractedTextPreview || '';

  const filteredIssues = issues.filter((iss) => {
    if (filterSeverity === 'all') return true;
    if (filterSeverity === 'critical') return iss.severity === 'critical';
    if (filterSeverity === 'recommendation') return iss.severity === 'recommendation' || iss.severity === 'warning';
    if (filterSeverity === 'tip') return iss.severity === 'tip';
    return true;
  });

  const formattedParsedAt = parsedData?.parsed_at || scanResult?.scanned_at || atsData?.created_at
    ? new Date(parsedData?.parsed_at || scanResult?.scanned_at || atsData?.created_at).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      })
    : null;

  // ── Render Dropzone Component ──────────────────────────────────────────
  const renderDropzone = (isCompact = false) => (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        padding: isCompact ? '20px' : '28px 24px',
        borderRadius: 16,
        background: isDragging
          ? 'rgba(163,230,53,0.12)'
          : dropFile
          ? 'rgba(56,189,248,0.06)'
          : 'rgba(107,138,58,0.06)',
        border: `2px dashed ${
          isDragging ? '#a3e635' : dropFile ? '#38bdf8' : 'rgba(107,138,58,0.35)'
        }`,
        textAlign: 'center',
        transition: 'all 0.2s ease',
        position: 'relative',
        cursor: 'pointer',
      }}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />

      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: dropFile ? 'rgba(56,189,248,0.14)' : 'rgba(107,138,58,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 10px',
        }}
      >
        {dropFile ? <FileCheck size={22} style={{ color: '#38bdf8' }} /> : <Upload size={22} style={{ color: 'var(--primary)' }} />}
      </div>

      {dropFile ? (
        <div>
          <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 2 }}>
            Selected: {dropFile.name}
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14 }}>
            {(dropFile.size / 1024).toFixed(1)} KB · Ready to analyze
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleUploadAndAnalyze();
              }}
              disabled={uploadingFile}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '9px 20px',
                borderRadius: 10,
                background: 'linear-gradient(135deg, #3D5016, #6B8A3A, #a3e635)',
                color: '#fff',
                border: 'none',
                fontSize: 12,
                fontWeight: 800,
                cursor: uploadingFile ? 'wait' : 'pointer',
                boxShadow: '0 3px 12px rgba(61,80,22,0.40)',
              }}
            >
              {uploadingFile ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {uploadingFile ? 'Analyzing with Gemini…' : 'Upload & Generate AI Insights'}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setDropFile(null);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '8px 12px',
                borderRadius: 10,
                background: 'var(--card-row-bg)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border)',
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              <X size={12} /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
            Drag & Drop your Resume here, or <span style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Browse</span>
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Supports PDF and DOCX format (Max 5MB) · Analyzes with Google Gemini & LangChain
          </p>
        </div>
      )}
    </div>
  );

  // ── 1. LOADING STATE ──
  if (loading && !isRefreshing && !hasAtsInsights) {
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
        <RefreshCw size={26} className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto 12px' }} />
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
          Retrieving AI Resume Analysis…
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Loading extracted skills, actionable suggestions, and career insights from the AI engine.
        </p>
      </div>
    );
  }

  // ── 2. ERROR STATE (only if neither profile nor ATS insights exist) ──
  if (statusState === 'error' && !hasAtsInsights) {
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

        {!isRecruiter && (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
              Or upload your resume directly here:
            </p>
            {renderDropzone()}
          </div>
        )}
      </div>
    );
  }

  // ── 3. PENDING STATE (Neither Profile nor ATS Insights exist yet) ──
  if (!hasParsedProfile && !hasAtsInsights) {
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
        <div style={{ height: 3, background: 'linear-gradient(90deg, #6B8A3A, #a3e635, #38bdf8)', borderRadius: '20px 20px 0 0' }} />
        <div style={{ padding: '24px 24px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, rgba(61,80,22,0.20), rgba(163,230,53,0.18))',
                  border: '1px solid rgba(107,138,58,0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={20} style={{ color: '#a3e635' }} />
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.01em', margin: 0 }}>
                  AI Resume Analysis & Predictive Insights
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  Google Gemini & LangChain entity extraction pipeline
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
              padding: '24px',
              borderRadius: 16,
              background: 'rgba(245,158,11,0.03)',
              border: '1px dashed rgba(245,158,11,0.25)',
              textAlign: 'center',
              marginBottom: 20,
            }}
          >
            <Clock size={28} style={{ color: '#f59e0b', margin: '0 auto 10px', opacity: 0.85 }} />
            <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
              {isRecruiter ? 'Candidate Resume Analysis Pending' : 'Upload Resume to Generate AI Insights'}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 460, margin: '0 auto 18px', lineHeight: 1.6 }}>
              {isRecruiter
                ? 'This applicant either has not uploaded a resume yet or their resume is currently being analyzed by our AI service.'
                : 'Drag and drop or select your resume below. Google Gemini will extract your skills, analyze formatting, and predict exact actionable recommendations to boost your match rate.'}
            </p>

            {!isRecruiter && renderDropzone()}
          </div>
        </div>
      </div>
    );
  }

  // ── 4. POPULATED STATE (Shows Gemini Predictive Insights & Extracted Profile) ──
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
      <div style={{ height: 3, background: 'linear-gradient(90deg, #3D5016, #6B8A3A, #a3e635, #38bdf8)', borderRadius: '20px 20px 0 0' }} />

      {/* ── Top Header Bar ────────────────────────────────────────── */}
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
              background: 'linear-gradient(135deg, rgba(61,80,22,0.25), rgba(163,230,53,0.18))',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <p style={{ fontSize: 15, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.01em', margin: 0 }}>
                Gemini AI Resume Insights & Predictive Roadmap
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
                <CheckCircle2 size={11} /> AI Insights Live
              </span>
              {overallScore !== null && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 11,
                    fontWeight: 800,
                    color: overallScore >= 80 ? '#a3e635' : overallScore >= 60 ? '#f59e0b' : '#ef4444',
                    background: overallScore >= 80 ? 'rgba(163,230,53,0.12)' : overallScore >= 60 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
                    padding: '2px 8px',
                    borderRadius: 999,
                    border: `1px solid ${overallScore >= 80 ? 'rgba(163,230,53,0.25)' : overallScore >= 60 ? 'rgba(245,158,11,0.25)' : 'rgba(239,68,68,0.25)'}`,
                  }}
                >
                  Health: {Math.round(overallScore)}/100 · {grade}
                </span>
              )}
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>
              Extracted from {parsedData?.original_filename || atsData?.source || 'evaluated resume'}
              {formattedParsedAt ? ` · Evaluated ${formattedParsedAt}` : ''}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {!isRecruiter && (
            <button
              onClick={() => setShowUploadDropzone((prev) => !prev)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 12px',
                borderRadius: 10,
                background: showUploadDropzone ? 'var(--primary)' : 'var(--card-row-bg)',
                border: '1px solid var(--border)',
                fontSize: 12,
                fontWeight: 700,
                color: showUploadDropzone ? '#fff' : 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Upload a new version to re-evaluate"
            >
              <Upload size={12} /> {showUploadDropzone ? 'Close Upload' : 'Upload New Version'}
            </button>
          )}

          {onGoToChecker && (
            <button
              onClick={onGoToChecker}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 14px',
                borderRadius: 10,
                background: 'linear-gradient(135deg, #3D5016, #6B8A3A)',
                border: 'none',
                fontSize: 12,
                fontWeight: 800,
                color: '#fff',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(61,80,22,0.30)',
              }}
            >
              <ArrowRight size={13} /> View Full ATS Card
            </button>
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
            title="Refresh analysis"
          >
            <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* ── Optional Collapsible Drag & Drop Zone ─────────────────── */}
      <AnimatePresence>
        {showUploadDropzone && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.15)' }}
          >
            {renderDropzone(true)}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Body Content ─────────────────────────────────────────── */}
      <div style={{ padding: '20px 24px 26px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── SECTION A: GEMINI PREDICTIVE IMPROVEMENTS (WHAT TO FIX) ── */}
        {issues.length > 0 && (
          <div
            style={{
              borderRadius: 16,
              background: 'var(--card-row-bg)',
              border: '1px solid var(--card-row-border)',
              padding: '18px 20px',
            }}
          >
            <div
              onClick={() => toggleSection('predictions')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                marginBottom: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <TrendingUp size={18} style={{ color: '#a3e635' }} />
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                    Gemini Predictions: What to Improve in Your Resume ({issues.length})
                  </h3>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '1px 0 0' }}>
                    Diagnostic AI suggestions to increase shortlist odds for recruiters and ATS filters
                  </p>
                </div>
              </div>
              {expandedSections.predictions ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
            </div>

            <AnimatePresence>
              {expandedSections.predictions && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  {/* Severity Filter Tabs */}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                    {[
                      { id: 'all', label: `All (${issues.length})` },
                      { id: 'critical', label: `Critical (${issues.filter((i) => i.severity === 'critical').length})` },
                      { id: 'recommendation', label: `Recommendations (${issues.filter((i) => i.severity === 'recommendation' || i.severity === 'warning').length})` },
                      { id: 'tip', label: `Tips (${issues.filter((i) => i.severity === 'tip').length})` },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setFilterSeverity(tab.id)}
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: 8,
                          border: 'none',
                          cursor: 'pointer',
                          background: filterSeverity === tab.id ? 'var(--primary)' : 'var(--bg-elevated)',
                          color: filterSeverity === tab.id ? '#fff' : 'var(--text-muted)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Issues List with Actionable Fixes */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {filteredIssues.map((iss, idx) => {
                      const isCrit = iss.severity === 'critical';
                      const isTip = iss.severity === 'tip';
                      return (
                        <div
                          key={idx}
                          style={{
                            padding: '14px 16px',
                            borderRadius: 12,
                            background: isCrit
                              ? 'rgba(239,68,68,0.06)'
                              : isTip
                              ? 'rgba(56,189,248,0.05)'
                              : 'rgba(245,158,11,0.05)',
                            border: `1px solid ${
                              isCrit
                                ? 'rgba(239,68,68,0.22)'
                                : isTip
                                ? 'rgba(56,189,248,0.20)'
                                : 'rgba(245,158,11,0.22)'
                            }`,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 800,
                                  textTransform: 'uppercase',
                                  padding: '2px 7px',
                                  borderRadius: 5,
                                  background: isCrit ? 'rgba(239,68,68,0.15)' : isTip ? 'rgba(56,189,248,0.15)' : 'rgba(245,158,11,0.15)',
                                  color: isCrit ? '#ef4444' : isTip ? '#38bdf8' : '#f59e0b',
                                }}
                              >
                                {iss.severity}
                              </span>
                              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
                                {iss.category}
                              </span>
                            </div>
                          </div>

                          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: iss.fix ? 8 : 0, lineHeight: 1.5 }}>
                            {iss.message}
                          </p>

                          {iss.fix && (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 7,
                                padding: '8px 12px',
                                borderRadius: 8,
                                background: 'rgba(163,230,53,0.08)',
                                border: '1px solid rgba(163,230,53,0.22)',
                              }}
                            >
                              <Lightbulb size={14} style={{ color: '#a3e635', flexShrink: 0, marginTop: 2 }} />
                              <p style={{ fontSize: 12, color: 'rgba(217,249,157,0.92)', margin: 0, lineHeight: 1.5 }}>
                                <strong style={{ color: '#a3e635' }}>Recommended Fix: </strong>
                                {iss.fix}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── SECTION B: EXTRACTED SKILLS & RECOMMENDED ADDITIONS ── */}
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
                Extracted Skills & Keywords ({skills.length})
              </h3>
            </div>
            {expandedSections.skills ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
          </div>

          <AnimatePresence>
            {expandedSections.skills && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                {skills.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
                    {skills.map((skill, idx) => (
                      <span
                        key={idx}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          fontSize: 12,
                          fontWeight: 700,
                          padding: '5px 12px',
                          borderRadius: 8,
                          background: 'rgba(163,230,53,0.10)',
                          color: '#a3e635',
                          border: '1px solid rgba(163,230,53,0.22)',
                        }}
                      >
                        <Check size={12} /> {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 12 }}>
                    No recognized technical skills detected in the document.
                  </p>
                )}

                {/* Missing Recommended Keywords (if in Job Match mode) */}
                {(missingRequired.length > 0 || missingPreferred.length > 0) && (
                  <div
                    style={{
                      padding: '14px 16px',
                      borderRadius: 12,
                      background: 'rgba(245,158,11,0.04)',
                      border: '1px dashed rgba(245,158,11,0.25)',
                    }}
                  >
                    <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
                      Recommended Target Keywords to Add:
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {missingRequired.map((kw, idx) => (
                        <span
                          key={`req-${idx}`}
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '3px 9px',
                            borderRadius: 6,
                            background: 'rgba(239,68,68,0.10)',
                            color: '#ef4444',
                            border: '1px solid rgba(239,68,68,0.25)',
                          }}
                        >
                          + {kw} (Required)
                        </span>
                      ))}
                      {missingPreferred.map((kw, idx) => (
                        <span
                          key={`pref-${idx}`}
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '3px 9px',
                            borderRadius: 6,
                            background: 'rgba(56,189,248,0.10)',
                            color: '#38bdf8',
                            border: '1px solid rgba(56,189,248,0.25)',
                          }}
                        >
                          + {kw} (Preferred)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── SECTION C: STRUCTURAL & IMPACT SIGNALS ── */}
        {signals && Object.keys(signals).length > 0 && (
          <div>
            <div
              onClick={() => toggleSection('signals')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                marginBottom: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Cpu size={16} style={{ color: 'var(--primary)' }} />
                <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-primary)', margin: 0 }}>
                  Resume Formatting & Impact Signals
                </h3>
              </div>
              {expandedSections.signals ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
            </div>

            <AnimatePresence>
              {expandedSections.signals && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                    <div style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--card-row-bg)', border: '1px solid var(--border)' }}>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 4px' }}>Quantified Impact</p>
                      <p style={{ fontSize: 16, fontWeight: 900, color: (signals.quantified_metrics_count || 0) > 0 ? '#a3e635' : '#f59e0b', margin: 0 }}>
                        {signals.quantified_metrics_count || 0} metrics found
                      </p>
                    </div>

                    <div style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--card-row-bg)', border: '1px solid var(--border)' }}>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 4px' }}>Word Count</p>
                      <p style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                        {signals.word_count || 0} words
                      </p>
                    </div>

                    <div style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--card-row-bg)', border: '1px solid var(--border)' }}>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 4px' }}>Bullet Points Ratio</p>
                      <p style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                        {Math.round((signals.bullet_ratio || 0) * 100)}% structured
                      </p>
                    </div>

                    <div style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--card-row-bg)', border: '1px solid var(--border)' }}>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 4px' }}>Layout Parsability</p>
                      <p style={{ fontSize: 14, fontWeight: 900, color: signals.multi_column ? '#ef4444' : '#34d399', margin: 0 }}>
                        {signals.multi_column ? '⚠️ Multi-Column' : '✓ Single Column Clean'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── SECTION D: EXTRACTED TEXT ACCORDION ── */}
        {extractedTextPreview && (
          <div style={{ borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => setShowTextPreview((prev) => !prev)}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'var(--card-row-bg)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={15} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>
                  View Extracted Text Layer (What ATS Sees)
                </span>
              </div>
              {showTextPreview ? <ChevronUp size={15} color="var(--text-muted)" /> : <ChevronDown size={15} color="var(--text-muted)" />}
            </button>

            {showTextPreview && (
              <div style={{ padding: '14px 16px', background: 'rgba(0,0,0,0.25)', maxHeight: 220, overflowY: 'auto' }}>
                <pre style={{ fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'monospace' }}>
                  {extractedTextPreview}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* ── SECTION E: CANDIDATE PROFILE RESUME DETAILS (If MongoDB profile exists) ── */}
        {hasParsedProfile && (
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Work Experience */}
            {experience.length > 0 && (
              <div>
                <div onClick={() => toggleSection('experience')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Briefcase size={16} style={{ color: 'var(--primary)' }} />
                    <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-primary)', margin: 0 }}>
                      Work Experience ({experience.length})
                    </h3>
                  </div>
                  {expandedSections.experience ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                </div>

                <AnimatePresence>
                  {expandedSections.experience && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {experience.map((exp, idx) => (
                          <div key={idx} style={{ padding: '12px 16px', borderRadius: 12, background: 'var(--card-row-bg)', border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
                              <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                                {exp.job_title || 'Position'} {exp.company ? `@ ${exp.company}` : ''}
                              </p>
                              {exp.duration && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{exp.duration}</span>}
                            </div>
                            {exp.description && (
                              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0', lineHeight: 1.5 }}>
                                {exp.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Education */}
            {education.length > 0 && (
              <div>
                <div onClick={() => toggleSection('education')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <GraduationCap size={16} style={{ color: 'var(--primary)' }} />
                    <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-primary)', margin: 0 }}>
                      Education ({education.length})
                    </h3>
                  </div>
                  {expandedSections.education ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                </div>

                <AnimatePresence>
                  {expandedSections.education && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {education.map((edu, idx) => (
                          <div key={idx} style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--card-row-bg)', border: '1px solid var(--border)' }}>
                            <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                              {edu.degree || 'Degree'} {edu.institution ? `· ${edu.institution}` : ''}
                            </p>
                            {edu.year && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{edu.year}</span>}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default ParsedResumeCard;
