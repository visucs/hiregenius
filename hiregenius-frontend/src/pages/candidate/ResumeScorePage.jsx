import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  FileSearch,
  RefreshCw,
  Zap,
  History,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import atsService from '../../services/atsService';
import jobsService from '../../services/jobsService';
import ParsedResumeCard from '../../components/Resume/ParsedResumeCard';
import AtsScoreCard from '../../components/Resume/AtsScoreCard';
import useResumeFileValidation from '../../hooks/useResumeFileValidation';

const ResumeScorePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('ats'); // 'ats' | 'history' | 'parsed'

  // ATS Evaluation State
  const [atsData, setAtsData] = useState(null);
  const [checkingAts, setCheckingAts] = useState(false);

  // Quota Tracking State
  const [quotaInfo, setQuotaInfo] = useState({
    remaining: null,
    limit: 10,
    resetAt: null,
  });

  // ATS Options State
  const [checkMode, setCheckMode] = useState('GENERAL'); // 'GENERAL' | 'JOB'
  const [resumeSource, setResumeSource] = useState('stored'); // 'stored' | 'upload'
  const [selectedFile, setSelectedFile] = useState(null);

  // Job Mode Target Options
  const [jobInputType, setJobInputType] = useState('select'); // 'select' | 'paste'
  const [selectedJobId, setSelectedJobId] = useState('');
  const [pastedJdText, setPastedJdText] = useState('');
  const [publicJobs, setPublicJobs] = useState([]);

  // Scan History State
  const [historyScans, setHistoryScans] = useState([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const { validateFile, fileError } = useResumeFileValidation();

  // Load scan history
  const fetchScanHistory = useCallback(async (page = 1) => {
    setLoadingHistory(true);
    try {
      const res = await atsService.getMyScans({ page, limit: 10 });
      if (res?.data) {
        setHistoryScans(res.data.scans || []);
        setHistoryTotal(res.data.pagination?.total || 0);
        setHistoryPage(page);
      }
    } catch (err) {
      console.error('Failed to load ATS scan history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // Load existing latest ATS score or scan by ID on mount
  const loadInitialScan = useCallback(async () => {
    const queryScanId = searchParams.get('scanId');
    try {
      if (queryScanId) {
        const res = await atsService.getScanById(queryScanId);
        if (res?.data) {
          setAtsData(res.data);
          setActiveTab('ats');
        }
      } else {
        // Fetch candidate's scan history to get the latest scan
        const res = await atsService.getMyScans({ page: 1, limit: 1 });
        if (res?.data?.scans && res.data.scans.length > 0) {
          setAtsData(res.data.scans[0]);
        }
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        console.error('Could not fetch saved ATS score:', err);
      }
    }
  }, [searchParams]);

  // Fetch open public jobs for job-specific match
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await jobsService.getPublicJobs({ limit: 25 });
        const list = res?.data?.jobs || (Array.isArray(res?.data) ? res.data : []);
        setPublicJobs(list);
        if (list.length > 0) {
          setSelectedJobId((curr) => curr || String(list[0].id));
        }
      } catch (err) {
        console.error('Failed to load public jobs for ATS target:', err);
      }
    };

    fetchJobs();
    loadInitialScan();
    fetchScanHistory(1);
  }, [loadInitialScan, fetchScanHistory]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (validateFile(file)) {
        setSelectedFile(file);
      } else {
        setSelectedFile(null);
        e.target.value = '';
      }
    }
  };

  const handleRunCheck = async () => {
    setCheckingAts(true);

    try {
      const formData = new FormData();
      formData.append('mode', checkMode);

      if (resumeSource === 'upload') {
        if (!selectedFile) {
          toast.error('Please choose a resume file to upload (PDF or DOCX).');
          setCheckingAts(false);
          return;
        }
        formData.append('resume', selectedFile);
      }

      if (checkMode === 'JOB') {
        if (jobInputType === 'select') {
          if (!selectedJobId) {
            toast.error('Please select an open job to compare against.');
            setCheckingAts(false);
            return;
          }
          formData.append('job_id', selectedJobId);
        } else {
          const jdClean = (pastedJdText || '').trim();
          if (jdClean.length < 30) {
            toast.error('Pasted job description must be at least 30 characters.');
            setCheckingAts(false);
            return;
          }
          if (jdClean.length > 10000) {
            toast.error('Pasted job description cannot exceed 10,000 characters.');
            setCheckingAts(false);
            return;
          }
          formData.append('job_description', jdClean);
        }
      }

      const res = await atsService.scan(formData);

      if (res?.data) {
        setAtsData(res.data);
        if (res.data.remaining !== undefined) {
          setQuotaInfo({
            remaining: res.data.remaining,
            limit: res.data.limit || 10,
            resetAt: res.data.resetAt,
          });
        }
        toast.success(
          checkMode === 'JOB'
            ? 'Job-specific ATS match calculated!'
            : 'General ATS analysis completed!'
        );
        // Refresh history in background
        fetchScanHistory(1);
      }
    } catch (err) {
      console.error('ATS check failed:', err);
      const status = err.response?.status;
      const apiMsg = err.response?.data?.message;
      const details = err.response?.data?.details;

      if (status === 409) {
        toast.error('Profile resume file was not found on server. Please upload your resume or choose "Upload New File".');
        setResumeSource('upload');
      } else if (status === 429) {
        const remaining = details?.remaining ?? 0;
        const resetAt = details?.resetAt;
        setQuotaInfo((prev) => ({
          ...prev,
          remaining,
          resetAt: resetAt || prev.resetAt,
        }));
        toast.error(apiMsg || 'Daily ATS scan quota reached. Please try again tomorrow.');
      } else if (status === 400 && apiMsg?.toLowerCase().includes('upload your resume first')) {
        toast.error('No resume on profile. Please choose "Upload New File" below.');
        setResumeSource('upload');
      } else if (status === 503 || status === 504) {
        toast.error('ATS AI analysis service is temporarily unavailable. Please try again in a few moments.');
      } else {
        toast.error(apiMsg || 'Failed to complete ATS scan.');
      }
    } finally {
      setCheckingAts(false);
    }
  };

  const handleLoadHistoricalScan = (scan) => {
    setAtsData(scan);
    setActiveTab('ats');
    setSearchParams({ scanId: scan.id });
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  const pastedLength = pastedJdText.length;
  const isPastedValid = pastedLength >= 30 && pastedLength <= 10000;

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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
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
                <Zap size={11} /> ATS Score Checker v2
              </span>

              {quotaInfo.remaining !== null && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 11,
                    fontWeight: 600,
                    color: quotaInfo.remaining > 0 ? '#4ade80' : '#f87171',
                    background: quotaInfo.remaining > 0 ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)',
                    padding: '4px 10px',
                    borderRadius: 999,
                    border: `1px solid ${quotaInfo.remaining > 0 ? 'rgba(74,222,128,0.25)' : 'rgba(248,113,113,0.25)'}`,
                  }}
                >
                  <Clock size={11} /> {quotaInfo.remaining} of {quotaInfo.limit} scans remaining today
                </span>
              )}
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
              Resume ATS Score & Match Optimizer
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(190,220,140,0.60)', paddingBottom: 24 }}>
              Transparent heuristic estimates, job-specific keyword extraction, format checks, and historical scan tracking.
            </p>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid rgba(107,138,58,0.25)', flexWrap: 'wrap' }}>
              <button
                onClick={() => setActiveTab('ats')}
                style={{
                  padding: '10px 18px',
                  fontSize: 13,
                  fontWeight: 700,
                  color: activeTab === 'ats' ? '#fff' : 'rgba(190,220,140,0.60)',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'ats' ? '2px solid #a3e635' : '2px solid transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease',
                }}
              >
                <FileSearch size={15} style={{ color: activeTab === 'ats' ? '#a3e635' : 'inherit' }} />
                ATS Score Checker
              </button>

              <button
                onClick={() => {
                  setActiveTab('history');
                  fetchScanHistory(1);
                }}
                style={{
                  padding: '10px 18px',
                  fontSize: 13,
                  fontWeight: 700,
                  color: activeTab === 'history' ? '#fff' : 'rgba(190,220,140,0.60)',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'history' ? '2px solid #a3e635' : '2px solid transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease',
                }}
              >
                <History size={15} style={{ color: activeTab === 'history' ? '#a3e635' : 'inherit' }} />
                Scan History ({historyTotal})
              </button>

              <button
                onClick={() => setActiveTab('parsed')}
                style={{
                  padding: '10px 18px',
                  fontSize: 13,
                  fontWeight: 700,
                  color: activeTab === 'parsed' ? '#fff' : 'rgba(190,220,140,0.60)',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'parsed' ? '2px solid #a3e635' : '2px solid transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease',
                }}
              >
                <Sparkles size={15} style={{ color: activeTab === 'parsed' ? '#a3e635' : 'inherit' }} />
                Extracted Skills & Profile
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Main Content Area ─────────────────────────────── */}
      <div
        style={{
          padding: 'clamp(16px, 3vw, 24px) clamp(12px, 3vw, 36px) 60px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          maxWidth: 1000,
          margin: '0 auto',
        }}
      >
        {activeTab === 'ats' ? (
          <>
            {/* ATS Scan Configuration Control Card */}
            <div
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 20,
                padding: '20px 24px',
                boxShadow: '0 2px 14px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Configure ATS Optimization Check
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                    Choose your mode, target job description, and resume file.
                  </p>
                </div>

                <button
                  onClick={handleRunCheck}
                  disabled={checkingAts || (checkMode === 'JOB' && jobInputType === 'paste' && !isPastedValid)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#fff',
                    background: checkingAts ? 'var(--text-muted)' : 'linear-gradient(135deg, #44591a, #6B8A3A)',
                    border: 'none',
                    borderRadius: 12,
                    padding: '9px 20px',
                    cursor: checkingAts ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 10px rgba(107,138,58,0.25)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {checkingAts ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Analyzing Resume…
                    </>
                  ) : (
                    <>
                      <Zap size={14} />
                      Run ATS Scan
                    </>
                  )}
                </button>
              </div>

              {/* Options Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: 18,
                  paddingTop: 16,
                  borderTop: '1px solid var(--border)',
                }}
              >
                {/* 1. Evaluation Target Mode */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                    1. Target Evaluation Mode
                  </label>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                    <button
                      type="button"
                      onClick={() => setCheckMode('GENERAL')}
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        fontSize: 12,
                        fontWeight: 600,
                        borderRadius: 10,
                        border: `1px solid ${checkMode === 'GENERAL' ? 'var(--primary)' : 'var(--border)'}`,
                        background: checkMode === 'GENERAL' ? 'rgba(107,138,58,0.12)' : 'var(--card-row-bg)',
                        color: checkMode === 'GENERAL' ? 'var(--primary)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                      }}
                    >
                      General Benchmark
                    </button>
                    <button
                      type="button"
                      onClick={() => setCheckMode('JOB')}
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        fontSize: 12,
                        fontWeight: 600,
                        borderRadius: 10,
                        border: `1px solid ${checkMode === 'JOB' ? '#38bdf8' : 'var(--border)'}`,
                        background: checkMode === 'JOB' ? 'rgba(56,189,248,0.12)' : 'var(--card-row-bg)',
                        color: checkMode === 'JOB' ? '#38bdf8' : 'var(--text-secondary)',
                        cursor: 'pointer',
                      }}
                    >
                      Target Job Match
                    </button>
                  </div>

                  {checkMode === 'JOB' && (
                    <div style={{ background: 'var(--card-row-bg)', padding: 12, borderRadius: 12, border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                        <button
                          type="button"
                          onClick={() => setJobInputType('select')}
                          style={{
                            flex: 1,
                            padding: '4px 8px',
                            fontSize: 11,
                            fontWeight: 600,
                            borderRadius: 6,
                            border: 'none',
                            background: jobInputType === 'select' ? 'var(--primary)' : 'transparent',
                            color: jobInputType === 'select' ? '#fff' : 'var(--text-muted)',
                            cursor: 'pointer',
                          }}
                        >
                          Select Open Job
                        </button>
                        <button
                          type="button"
                          onClick={() => setJobInputType('paste')}
                          style={{
                            flex: 1,
                            padding: '4px 8px',
                            fontSize: 11,
                            fontWeight: 600,
                            borderRadius: 6,
                            border: 'none',
                            background: jobInputType === 'paste' ? 'var(--primary)' : 'transparent',
                            color: jobInputType === 'paste' ? '#fff' : 'var(--text-muted)',
                            cursor: 'pointer',
                          }}
                        >
                          Paste Job Description
                        </button>
                      </div>

                      {jobInputType === 'select' ? (
                        <select
                          value={selectedJobId}
                          onChange={(e) => setSelectedJobId(e.target.value)}
                          style={{
                            width: '100%',
                            fontSize: 12,
                            padding: '7px 10px',
                            borderRadius: 8,
                            background: 'var(--bg-base)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          {publicJobs.map((j) => (
                            <option key={j.id} value={j.id}>
                              {j.title} — {j.company}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div>
                          <textarea
                            value={pastedJdText}
                            onChange={(e) => setPastedJdText(e.target.value)}
                            placeholder="Paste full job description, required qualifications, and duties here (min 30, max 10,000 characters)..."
                            rows={4}
                            style={{
                              width: '100%',
                              fontSize: 12,
                              padding: '8px 10px',
                              borderRadius: 8,
                              background: 'var(--bg-base)',
                              border: `1px solid ${pastedLength > 0 && !isPastedValid ? '#f87171' : 'var(--border)'}`,
                              color: 'var(--text-primary)',
                              resize: 'vertical',
                              boxSizing: 'border-box',
                            }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginTop: 4 }}>
                            <span style={{ color: pastedLength < 30 ? 'var(--text-muted)' : '#22c55e' }}>
                              {pastedLength < 30 ? 'Min 30 characters required' : '✓ Valid job description length'}
                            </span>
                            <span style={{ color: pastedLength > 10000 ? '#ef4444' : 'var(--text-muted)' }}>
                              {pastedLength.toLocaleString()} / 10,000
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Resume File Source */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                    2. Resume File Source
                  </label>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                    <button
                      type="button"
                      onClick={() => setResumeSource('stored')}
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        fontSize: 12,
                        fontWeight: 600,
                        borderRadius: 10,
                        border: `1px solid ${resumeSource === 'stored' ? 'var(--primary)' : 'var(--border)'}`,
                        background: resumeSource === 'stored' ? 'rgba(107,138,58,0.12)' : 'var(--card-row-bg)',
                        color: resumeSource === 'stored' ? 'var(--primary)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                      }}
                    >
                      Profile Resume
                    </button>
                    <button
                      type="button"
                      onClick={() => setResumeSource('upload')}
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        fontSize: 12,
                        fontWeight: 600,
                        borderRadius: 10,
                        border: `1px solid ${resumeSource === 'upload' ? 'var(--primary)' : 'var(--border)'}`,
                        background: resumeSource === 'upload' ? 'rgba(107,138,58,0.12)' : 'var(--card-row-bg)',
                        color: resumeSource === 'upload' ? 'var(--primary)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                      }}
                    >
                      Upload Draft Resume
                    </button>
                  </div>

                  {resumeSource === 'upload' ? (
                    <div style={{ background: 'var(--card-row-bg)', padding: 12, borderRadius: 12, border: '1px solid var(--border)' }}>
                      <input
                        type="file"
                        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={handleFileChange}
                        style={{ fontSize: 11, color: 'var(--text-primary)', width: '100%' }}
                      />
                      <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '6px 0 0 0' }}>
                        Draft resumes are checked in memory only and will not modify your saved profile resume.
                      </p>
                      {fileError && (
                        <p style={{ fontSize: 11, color: '#f87171', marginTop: 4 }}>{fileError}</p>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '6px 0' }}>
                      Using your saved candidate profile resume from MySQL storage.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Results Display Area */}
            {checkingAts ? (
              <AtsScoreCard loading={true} />
            ) : atsData ? (
              <AtsScoreCard
                atsData={atsData}
                onRefresh={handleRunCheck}
                title={
                  (atsData.result?.mode || atsData.mode || checkMode) === 'JOB'
                    ? 'Job Match & Keyword Analysis'
                    : 'General ATS Benchmark Score'
                }
                subtitle={
                  (atsData.result?.mode || atsData.mode || checkMode) === 'JOB'
                    ? 'Comparing your resume against role qualifications, experience requirements, and keywords.'
                    : 'Universal ATS compliance metrics: section headers, formatting markers, and readability.'
                }
              />
            ) : (
              <div
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px dashed var(--border)',
                  borderRadius: 20,
                  padding: '40px 24px',
                  textAlign: 'center',
                }}
              >
                <FileSearch size={32} style={{ color: 'var(--primary)', margin: '0 auto 12px', opacity: 0.8 }} />
                <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                  No ATS Scan Generated Yet
                </h4>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 440, margin: '0 auto 16px' }}>
                  Run your first evaluation above using your saved profile resume or upload a draft to view transparent ATS scores, keyword matches, and actionable suggestions.
                </p>
                <button
                  onClick={handleRunCheck}
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
                  <Zap size={14} /> Run Analysis Now
                </button>
              </div>
            )}
          </>
        ) : activeTab === 'history' ? (
          /* ── Scan History Tab ──────────────────────────────── */
          <div
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              padding: '24px',
              boxShadow: '0 2px 14px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Personal ATS Scan Archive
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  All ATS evaluations you have executed. Click "View Evaluation" to load any scan into the score checker.
                </p>
              </div>
              <button
                onClick={() => fetchScanHistory(historyPage)}
                disabled={loadingHistory}
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
                <RefreshCw size={12} className={loadingHistory ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>

            {loadingHistory ? (
              <div style={{ textAlign: 'center', padding: '36px 0' }}>
                <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto 10px' }} />
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading scan history…</p>
              </div>
            ) : historyScans.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', border: '1px dashed var(--border)', borderRadius: 12 }}>
                <History size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 10px', opacity: 0.6 }} />
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  No historical scans recorded
                </h4>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Scans you trigger in the ATS Score Checker will appear here.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {historyScans.map((scan) => {
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
                        padding: '14px 18px',
                        borderRadius: 12,
                        background: 'var(--card-row-bg)',
                        border: '1px solid var(--border)',
                        flexWrap: 'wrap',
                        gap: 12,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            background: score >= 80 ? 'rgba(34,197,94,0.12)' : score >= 60 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
                            border: `2px solid ${score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: 16,
                            color: score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444',
                          }}
                        >
                          {Math.round(score)}
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                padding: '2px 6px',
                                borderRadius: 4,
                                background: isJob ? 'rgba(56,189,248,0.12)' : 'rgba(107,138,58,0.12)',
                                color: isJob ? '#38bdf8' : 'var(--primary)',
                              }}
                            >
                              {isJob ? 'Job Match' : 'General'}
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)' }}>
                              Source: {scan.source || 'PROFILE'}
                            </span>
                          </div>

                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                            {scan.result?.targetJobTitle || (isJob ? `Job #${scan.job_id || ''}` : 'General ATS Benchmark')}
                          </div>

                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {dateStr}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleLoadHistoricalScan(scan)}
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
                          padding: '7px 14px',
                          cursor: 'pointer',
                        }}
                      >
                        Load Evaluation
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* ── Extracted Profile Tab ─────────────────────────── */
          <ParsedResumeCard />
        )}
      </div>
    </div>
  );
};

export default ResumeScorePage;
