import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  FileSearch,
  Target,
  FileText,
  Upload,
  RefreshCw,
  Briefcase,
  Layers,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import candidatesService from '../../services/candidatesService';
import jobsService from '../../services/jobsService';
import ParsedResumeCard from '../../components/Resume/ParsedResumeCard';
import AtsScoreCard from '../../components/Resume/AtsScoreCard';
import useResumeFileValidation from '../../hooks/useResumeFileValidation';

const ResumeScorePage = () => {
  const [activeTab, setActiveTab] = useState('ats'); // 'ats' | 'parsed'

  // ATS State
  const [atsData, setAtsData] = useState(null);
  const [loadingAts, setLoadingAts] = useState(true);
  const [checkingAts, setCheckingAts] = useState(false);
  const [atsError, setAtsError] = useState(null);

  // ATS Options State
  const [checkMode, setCheckMode] = useState('general'); // 'general' | 'job'
  const [resumeSource, setResumeSource] = useState('stored'); // 'stored' | 'upload'
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [publicJobs, setPublicJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  const { validateFile, fileError, clearFileError } = useResumeFileValidation();

  // Load existing ATS score on mount
  const fetchExistingAts = useCallback(async (jobId = null) => {
    setLoadingAts(true);
    setAtsError(null);
    try {
      const res = await candidatesService.getMyAts(jobId);
      if (res?.data) {
        setAtsData(res.data);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        // No ATS check found yet
        setAtsData(null);
      } else {
        const msg = err.response?.data?.message || 'Could not fetch saved ATS score.';
        setAtsError(msg);
      }
    } finally {
      setLoadingAts(false);
    }
  }, []);

  // Fetch open public jobs for job-specific match
  useEffect(() => {
    const fetchJobs = async () => {
      setLoadingJobs(true);
      try {
        const res = await jobsService.getPublicJobs({ limit: 20 });
        const list = res?.data?.jobs || (Array.isArray(res?.data) ? res.data : []);
        setPublicJobs(list);
        if (list.length > 0 && !selectedJobId) {
          setSelectedJobId(String(list[0].id));
        }
      } catch (err) {
        console.error('Failed to load public jobs for ATS target:', err);
      } finally {
        setLoadingJobs(false);
      }
    };

    fetchJobs();
    fetchExistingAts();
  }, [fetchExistingAts]);

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
    setAtsError(null);

    try {
      let formData = null;
      if (resumeSource === 'upload') {
        if (!selectedFile) {
          toast.error('Please choose a resume file to upload (PDF or DOCX).');
          setCheckingAts(false);
          return;
        }
        formData = new FormData();
        formData.append('resume', selectedFile);
      }

      let res;
      if (checkMode === 'job') {
        if (!selectedJobId) {
          toast.error('Please select an open job to compare against.');
          setCheckingAts(false);
          return;
        }
        res = await jobsService.checkJobAts(selectedJobId, formData);
      } else {
        res = await candidatesService.checkGeneralAts(formData);
      }

      if (res?.data) {
        setAtsData(res.data);
        toast.success(
          checkMode === 'job'
            ? 'Job-specific ATS match calculated!'
            : 'General ATS analysis completed!'
        );
      }
    } catch (err) {
      console.error('ATS check failed:', err);
      const status = err.response?.status;
      const apiMsg = err.response?.data?.message;

      if (status === 400 && apiMsg?.toLowerCase().includes('upload your resume first')) {
        toast.error('No resume on file. Please upload a resume file first.');
        setResumeSource('upload');
      } else if (status === 429) {
        toast.error('Rate limit reached (10 checks/min). Please wait a moment.');
      } else if (status === 422) {
        toast.error(apiMsg || 'Resume file is not parsable or scanned image.');
      } else if (status === 503) {
        toast.error('AI ATS analysis service is warming up. Please try again shortly.');
      } else {
        toast.error(apiMsg || 'Failed to complete ATS scan.');
      }
      setAtsError(apiMsg || 'Analysis could not be completed.');
    } finally {
      setCheckingAts(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100%' }}>
      {/* ── Olive/Forest Hero ─────────────────────────────── */}
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
                <Zap size={11} /> AI Resume Optimization
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#4ade80',
                  background: 'rgba(74,222,128,0.10)',
                  padding: '4px 10px',
                  borderRadius: 999,
                  border: '1px solid rgba(74,222,128,0.22)'
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} /> Phase 6 Active
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
              Resume ATS Score & Skills Profile
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(190,220,140,0.60)', paddingBottom: 24 }}>
              Check ATS compatibility scores, discover missing job keywords, and review parsed skills.
            </p>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid rgba(107,138,58,0.25)' }}>
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
                ATS Compatibility & Score
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
                    Run ATS Optimization Scan
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                    Benchmark formatting and sections, or target an active job for keyword match analysis.
                  </p>
                </div>

                <button
                  onClick={handleRunCheck}
                  disabled={checkingAts}
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
                      Calculate ATS Score
                    </>
                  )}
                </button>
              </div>

              {/* Options Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: 16,
                  paddingTop: 14,
                  borderTop: '1px solid var(--border)',
                }}
              >
                {/* 1. Evaluation Target */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                    1. Target Evaluation Mode
                  </label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => setCheckMode('general')}
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        fontSize: 12,
                        fontWeight: 600,
                        borderRadius: 10,
                        border: `1px solid ${checkMode === 'general' ? 'var(--primary)' : 'var(--border)'}`,
                        background: checkMode === 'general' ? 'rgba(107,138,58,0.12)' : 'var(--card-row-bg)',
                        color: checkMode === 'general' ? 'var(--primary)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                      }}
                    >
                      General Benchmark
                    </button>
                    <button
                      type="button"
                      onClick={() => setCheckMode('job')}
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        fontSize: 12,
                        fontWeight: 600,
                        borderRadius: 10,
                        border: `1px solid ${checkMode === 'job' ? '#38bdf8' : 'var(--border)'}`,
                        background: checkMode === 'job' ? 'rgba(56,189,248,0.12)' : 'var(--card-row-bg)',
                        color: checkMode === 'job' ? '#38bdf8' : 'var(--text-secondary)',
                        cursor: 'pointer',
                      }}
                    >
                      Match Open Job
                    </button>
                  </div>

                  {checkMode === 'job' && (
                    <div style={{ marginTop: 10 }}>
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
                    </div>
                  )}
                </div>

                {/* 2. Resume File Source */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                    2. Resume Source
                  </label>
                  <div style={{ display: 'flex', gap: 6 }}>
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
                      Upload New File
                    </button>
                  </div>

                  {resumeSource === 'upload' && (
                    <div style={{ marginTop: 10 }}>
                      <input
                        type="file"
                        accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={handleFileChange}
                        style={{ fontSize: 11, color: 'var(--text-primary)' }}
                      />
                      {fileError && (
                        <p style={{ fontSize: 11, color: '#f87171', marginTop: 4 }}>{fileError}</p>
                      )}
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
                title={checkMode === 'job' ? 'Job Match & Keyword Analysis' : 'General ATS Benchmark Score'}
                subtitle={
                  checkMode === 'job'
                    ? 'Comparing your resume against role qualifications and target keywords.'
                    : 'Universal ATS compliance metrics: section headers, formatting, and word density.'
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
                  Run your first scan using your saved profile resume or upload a draft to view ATS scores, keyword matches, and personalized suggestions.
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
        ) : (
          /* Extracted Profile Tab */
          <ParsedResumeCard />
        )}
      </div>
    </div>
  );
};

export default ResumeScorePage;
