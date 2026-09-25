import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Briefcase, Plus, X, Edit2, Lock, Eye, Trash2,
  Calendar, MapPin, PlusCircle, AlertCircle, ChevronRight,
  TrendingUp, Search, CheckCircle2, ArrowUpRight, RefreshCw,
  DollarSign, Award, Unlock, FileText, Check, Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { selectUser } from '../../features/auth/authSlice';
import jobsService from '../../services/jobsService';

/* ─── Zod validation schema for Job form ──────────────────── */
const jobSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(255),
  company: z.string().trim().min(2, 'Company must be at least 2 characters').max(255),
  location: z.string().trim().min(2, 'Location is required').max(255),
  salary: z.string().trim().optional().or(z.literal('')),
  experience: z.string().trim().optional().or(z.literal('')),
  description: z.string().trim().min(10, 'Description must be at least 10 characters'),
  skills: z.array(z.string().min(1)).min(1, 'At least one skill is required'),
});

const STATUS_CFG = {
  OPEN:   { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.28)',  dot: '#34d399', label: 'Open'   },
  CLOSED: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.28)',   dot: '#ef4444', label: 'Closed' },
};

const StatusBadge = ({ status }) => {
  const c = STATUS_CFG[status] ?? { color: 'var(--text-muted)', bg: 'var(--border)', border: 'var(--border)', dot: 'var(--text-muted)', label: status };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.dot }} /> {c.label}
    </span>
  );
};

/* ─── Skill tag input ─────────────────────────────────────── */
const SkillTagInput = ({ value = [], onChange }) => {
  const [input, setInput] = useState('');
  const add = () => {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput('');
  };

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: value.length ? 10 : 0 }}>
        {value.map(s => (
          <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 999, background: 'rgba(107,138,58,0.12)', color: 'var(--primary)', border: '1px solid rgba(107,138,58,0.22)' }}>
            {s}
            <button type="button" onClick={() => onChange(value.filter(v => v !== s))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, display: 'flex', lineHeight: 1 }}><X size={11} /></button>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder="e.g. React, Node.js, MySQL (Press Enter)"
          id="jobs-skill-input"
          style={{ flex: 1, padding: '10px 14px', borderRadius: 12, fontSize: 13, background: 'var(--card-row-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit' }}
        />
        <button
          type="button"
          onClick={add}
          style={{ padding: '0 16px', borderRadius: 12, fontSize: 13, fontWeight: 700, background: 'rgba(107,138,58,0.12)', color: 'var(--primary)', border: '1px solid rgba(107,138,58,0.22)', cursor: 'pointer' }}
        >
          Add
        </button>
      </div>
    </div>
  );
};

/* ─── Form field ──────────────────────────────────────────── */
const Field = ({ label, error, children }) => (
  <div>
    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 7 }}>{label}</label>
    {children}
    <AnimatePresence>
      {error && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#ef4444', marginTop: 6, fontWeight: 600 }}
        ><AlertCircle size={11} />{error}</motion.p>
      )}
    </AnimatePresence>
  </div>
);

const IS = { width: '100%', minHeight: 44, padding: '10px 14px', borderRadius: 12, fontSize: 13, background: 'var(--card-row-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };

/* ════════════════════════════════════════════════════════════
   RECRUITER JOBS PAGE (REAL CORE API INTEGRATION)
════════════════════════════════════════════════════════════ */
const RecruiterJobsPage = () => {
  const loggedInUser = useSelector(selectUser);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Modals & Drawers state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null); // When not null, modal is in edit mode
  const [viewingJob, setViewingJob] = useState(null); // When not null, detail drawer is open
  const [deleteConfirmJob, setDeleteConfirmJob] = useState(null);

  // Action loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTogglingStatusId, setIsTogglingStatusId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { register, handleSubmit, control, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: '',
      company: '',
      location: '',
      salary: '',
      experience: '',
      description: '',
      skills: [],
    },
  });

  // Fetch recruiter's own jobs from Core API (GET /api/jobs/mine)
  const fetchMyJobs = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const response = await jobsService.getMyJobs({ limit: 50 });
      const jobList = response?.data?.jobs ?? [];
      setJobs(jobList);
    } catch (err) {
      console.error('[JobsPage] Failed to fetch recruiter jobs:', err);
      const msg = err.response?.data?.message || err.message || 'Unable to connect to Core API';
      setFetchError(msg);
      toast.error(`Error loading jobs: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyJobs();
  }, [fetchMyJobs]);

  // Open Post New Job modal
  const handleOpenCreate = () => {
    setEditingJob(null);
    reset({
      title: '',
      company: loggedInUser?.company || '',
      location: '',
      salary: '',
      experience: '',
      description: '',
      skills: [],
    });
    setShowFormModal(true);
  };

  // Open Edit Job modal with pre-populated values
  const handleOpenEdit = (job) => {
    setEditingJob(job);
    setValue('title', job.title);
    setValue('company', job.company);
    setValue('location', job.location || '');
    setValue('salary', job.salary || '');
    setValue('experience', job.experience || '');
    setValue('description', job.description);
    setValue('skills', Array.isArray(job.skills) ? job.skills : []);
    setShowFormModal(true);
  };

  // Open View Details drawer (fetches fresh details via GET /api/jobs/:id)
  const handleOpenView = async (job) => {
    setViewingJob(job);
    try {
      const freshRes = await jobsService.getJobById(job.id);
      if (freshRes?.data) {
        setViewingJob(freshRes.data);
      }
    } catch (err) {
      console.warn('[JobsPage] Fresh fetch detail warning:', err);
    }
  };

  // Handle Form Submit: POST /api/jobs (create) OR PUT /api/jobs/:id (update)
  const onSubmitForm = async (formData) => {
    setIsSubmitting(true);
    try {
      if (editingJob) {
        // Edit mode: PUT /api/jobs/:id
        const res = await jobsService.updateJob(editingJob.id, formData);
        const updated = res.data;
        setJobs(prev => prev.map(j => (j.id === updated.id ? updated : j)));
        if (viewingJob && viewingJob.id === updated.id) {
          setViewingJob(updated);
        }
        toast.success(`Job "${updated.title}" updated successfully!`);
      } else {
        // Create mode: POST /api/jobs
        const res = await jobsService.createJob({ ...formData, status: 'OPEN' });
        const created = res.data;
        setJobs(prev => [created, ...prev]);
        toast.success(`Job "${created.title}" posted successfully!`);
      }
      setShowFormModal(false);
      reset();
    } catch (err) {
      console.error('[JobsPage] Submit error:', err);
      const errMsg = err.response?.data?.message || err.message || 'Operation failed';
      toast.error(`Error: ${errMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Status Toggle: PATCH /api/jobs/:id/status
  const handleToggleStatus = async (job) => {
    const nextStatus = job.status === 'OPEN' ? 'CLOSED' : 'OPEN';
    setIsTogglingStatusId(job.id);
    try {
      const res = await jobsService.updateStatus(job.id, nextStatus);
      const updated = res.data;
      setJobs(prev => prev.map(j => (j.id === job.id ? updated : j)));
      if (viewingJob && viewingJob.id === job.id) {
        setViewingJob(updated);
      }
      toast.success(`Job marked as ${nextStatus}`);
    } catch (err) {
      console.error('[JobsPage] Status update error:', err);
      const msg = err.response?.data?.message || err.message || 'Could not update status';
      toast.error(`Failed: ${msg}`);
    } finally {
      setIsTogglingStatusId(null);
    }
  };

  // Handle Delete: DELETE /api/jobs/:id
  const handleConfirmDelete = async () => {
    if (!deleteConfirmJob) return;
    setIsDeleting(true);
    try {
      await jobsService.deleteJob(deleteConfirmJob.id);
      setJobs(prev => prev.filter(j => j.id !== deleteConfirmJob.id));
      if (viewingJob && viewingJob.id === deleteConfirmJob.id) {
        setViewingJob(null);
      }
      toast.success('Job deleted successfully');
      setDeleteConfirmJob(null);
    } catch (err) {
      console.error('[JobsPage] Delete error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to delete job';
      toast.error(`Delete failed: ${msg}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered jobs calculation
  const filteredJobs = jobs.filter(j => {
    const matchesStatus = statusFilter === 'ALL' || j.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      j.title.toLowerCase().includes(q) ||
      j.company.toLowerCase().includes(q) ||
      (j.location && j.location.toLowerCase().includes(q)) ||
      (Array.isArray(j.skills) && j.skills.some(s => s.toLowerCase().includes(q)));
    return matchesStatus && matchesSearch;
  });

  const openCount = jobs.filter(j => j.status === 'OPEN').length;
  const closedCount = jobs.filter(j => j.status === 'CLOSED').length;

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100%' }}>

      {/* ── Hero band ─────────────────────────────────────── */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(150deg, #18280a 0%, #0c1505 55%, #0f1e06 100%)', padding: 'clamp(20px, 4vw, 32px) clamp(16px, 4vw, 36px) 0' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(107,138,58,0.10) 1.5px, transparent 1.5px)', backgroundSize: '26px 26px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -60, right: '15%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,138,58,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(107,138,58,0.95)', background: 'rgba(107,138,58,0.14)', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(107,138,58,0.28)' }}>
                    <Briefcase size={11} /> Real Jobs • Core API
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#4ade80', background: 'rgba(74,222,128,0.10)', padding: '4px 10px', borderRadius: 999, border: '1px solid rgba(74,222,128,0.22)' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} /> Live Database
                  </span>
                </div>
                <h1 style={{ fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', marginBottom: 6 }}>My Jobs</h1>
                <p style={{ fontSize: 13, color: 'rgba(190,220,140,0.60)' }}>
                  {jobs.length} total listing{jobs.length !== 1 ? 's' : ''} · {openCount} open · {closedCount} closed
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  onClick={fetchMyJobs}
                  disabled={loading}
                  title="Refresh listings"
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 44, width: 44, borderRadius: 14, background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', cursor: loading ? 'not-allowed' : 'pointer' }}
                >
                  <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>

                <motion.button whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
                  onClick={handleOpenCreate} id="jobs-post-new"
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 44, gap: 9, padding: '12px 22px', borderRadius: 14, background: 'linear-gradient(135deg, #3D5016, #6B8A3A)', color: '#fff', fontSize: 14, fontWeight: 800, boxShadow: '0 6px 28px rgba(61,80,22,0.60)', border: '1px solid rgba(107,138,58,0.35)', cursor: 'pointer', letterSpacing: '-0.01em' }}
                >
                  <PlusCircle size={16} strokeWidth={2.5} /> Post New Job <ArrowUpRight size={14} />
                </motion.button>
              </div>
            </div>

            {/* Stat chips */}
            <div style={{ display: 'flex', gap: 10, paddingBottom: 28, flexWrap: 'wrap' }}>
              {[
                { label: 'Total Jobs',  value: jobs.length,  color: '#60a5fa' },
                { label: 'Open',        value: openCount,    color: '#34d399' },
                { label: 'Closed',      value: closedCount,  color: '#ef4444' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ padding: '8px 16px', borderRadius: 12, background: `${color}12`, border: `1px solid ${color}22`, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 18, fontWeight: 900, color }}>{value}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Search and Filter Bar ─────────────────────────── */}
      <div style={{ padding: '20px clamp(12px, 3vw, 36px) 0', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 200 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by title, company, skills..."
            style={{ width: '100%', padding: '10px 14px 10px 38px', borderRadius: 12, fontSize: 13, background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 6, background: 'var(--bg-elevated)', padding: 4, borderRadius: 12, border: '1px solid var(--border)' }}>
          {['ALL', 'OPEN', 'CLOSED'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              style={{
                padding: '6px 14px',
                borderRadius: 9,
                fontSize: 12,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: statusFilter === status ? 'var(--primary)' : 'transparent',
                color: statusFilter === status ? '#fff' : 'var(--text-muted)',
                transition: 'all 0.15s ease',
              }}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* ── Job cards grid / Loading / Error states ────────── */}
      <div style={{ padding: 'clamp(16px, 3vw, 24px) clamp(12px, 3vw, 36px) 60px' }}>
        {loading ? (
          <div style={{ padding: '80px 24px', textAlign: 'center', borderRadius: 20, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <div style={{ width: 36, height: 36, border: '3px solid rgba(107,138,58,0.20)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Loading your jobs from Core API...</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Querying database at localhost:4000/api/jobs/mine</p>
          </div>
        ) : fetchError ? (
          <div style={{ padding: '64px 24px', textAlign: 'center', borderRadius: 20, background: 'var(--bg-elevated)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <AlertCircle size={40} style={{ color: '#ef4444', margin: '0 auto 12px', display: 'block' }} />
            <p style={{ fontSize: 16, fontWeight: 800, color: '#ef4444', marginBottom: 6 }}>Failed to load jobs</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 440, margin: '0 auto 20px' }}>{fetchError}</p>
            <button
              onClick={fetchMyJobs}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, background: 'var(--primary)', color: '#fff', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer' }}
            >
              <RefreshCw size={14} /> Retry Connection
            </button>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div style={{ padding: '64px 24px', textAlign: 'center', borderRadius: 20, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <Briefcase size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px', display: 'block' }} />
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
              {searchQuery || statusFilter !== 'ALL' ? 'No matching jobs found' : 'No jobs posted yet'}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
              {searchQuery || statusFilter !== 'ALL' ? 'Try adjusting your search terms or filter.' : 'Post your first job to start receiving candidates.'}
            </p>
            <button onClick={handleOpenCreate} id="jobs-empty-cta"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', minHeight: 44, borderRadius: 12, background: 'linear-gradient(135deg, #3D5016, #6B8A3A)', color: '#fff', fontSize: 13, fontWeight: 800, border: 'none', cursor: 'pointer', boxShadow: '0 4px 18px rgba(61,80,22,0.40)' }}
            ><PlusCircle size={15} /> Post First Job</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: 16 }}>
            {filteredJobs.map((job, i) => {
              // Ownership check: user can only edit/delete/toggle their own jobs
              const isOwner = !job.recruiter_id || Number(job.recruiter_id) === Number(loggedInUser?.id || loggedInUser?.userId);

              return (
                <motion.div key={job.id}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.32, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', transition: 'all 0.18s ease', display: 'flex', flexDirection: 'column' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = 'var(--border-hover)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  {/* Card top stripe by status */}
                  <div style={{ height: 3, background: `linear-gradient(90deg, ${STATUS_CFG[job.status]?.color ?? '#888'}00, ${STATUS_CFG[job.status]?.color ?? '#888'}, ${STATUS_CFG[job.status]?.color ?? '#888'}00)` }} />

                  <div style={{ padding: '18px 20px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    {/* Header row */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {job.title}
                        </p>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{job.company}</p>
                      </div>
                      <StatusBadge status={job.status} />
                    </div>

                    {/* Meta row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                      {job.location && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                          <MapPin size={11} /> {job.location}
                        </span>
                      )}
                      {job.salary && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                          <DollarSign size={11} /> {job.salary}
                        </span>
                      )}
                      {job.experience && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                          <Award size={11} /> {job.experience}
                        </span>
                      )}
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                        <Calendar size={11} /> {new Date(job.created_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>

                    {/* Skills list */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 16, flex: 1 }}>
                      {Array.isArray(job.skills) && job.skills.slice(0, 4).map(s => (
                        <span key={s} style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: 'rgba(107,138,58,0.09)', color: 'var(--primary)', border: '1px solid rgba(107,138,58,0.18)' }}>{s}</span>
                      ))}
                      {Array.isArray(job.skills) && job.skills.length > 4 && (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', padding: '3px 6px', fontWeight: 600 }}>+{job.skills.length - 4}</span>
                      )}
                    </div>

                    {/* Action buttons with strict ownership check */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                      {/* View Details */}
                      <button
                        id={`jobs-view-${job.id}`}
                        onClick={() => handleOpenView(job)}
                        title="View Full Details"
                        style={{ width: 38, minHeight: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'var(--card-row-bg)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                      >
                        <Eye size={15} />
                      </button>

                      {/* Applicants Button */}
                      <Link
                        to={`/recruiter/candidates?jobId=${job.id}`}
                        id={`jobs-applicants-${job.id}`}
                        title="View Applicants"
                        style={{ minHeight: 38, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700, background: 'rgba(96,165,250,0.08)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.22)', textDecoration: 'none', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(96,165,250,0.16)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(96,165,250,0.08)'; }}
                      >
                        <Users size={13} /> Applicants
                      </Link>

                      {isOwner && (
                        <>
                          {/* Edit Job */}
                          <button
                            id={`jobs-edit-${job.id}`}
                            onClick={() => handleOpenEdit(job)}
                            style={{ flex: 1, minHeight: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 10px', borderRadius: 10, fontSize: 12, fontWeight: 700, background: 'rgba(107,138,58,0.08)', color: 'var(--primary)', border: '1px solid rgba(107,138,58,0.20)', cursor: 'pointer', transition: 'all 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(107,138,58,0.15)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(107,138,58,0.08)'}
                          >
                            <Edit2 size={13} /> Edit
                          </button>

                          {/* Toggle Status (Close / Reopen) */}
                          <button
                            id={`jobs-status-${job.id}`}
                            onClick={() => handleToggleStatus(job)}
                            disabled={isTogglingStatusId === job.id}
                            style={{ flex: 1, minHeight: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 10px', borderRadius: 10, fontSize: 12, fontWeight: 700, background: job.status === 'OPEN' ? 'rgba(239,68,68,0.07)' : 'rgba(52,211,153,0.08)', color: job.status === 'OPEN' ? '#ef4444' : '#10b981', border: `1px solid ${job.status === 'OPEN' ? 'rgba(239,68,68,0.20)' : 'rgba(52,211,153,0.20)'}`, cursor: isTogglingStatusId === job.id ? 'not-allowed' : 'pointer' }}
                          >
                            {isTogglingStatusId === job.id ? (
                              <RefreshCw size={13} className="animate-spin" />
                            ) : job.status === 'OPEN' ? (
                              <><Lock size={13} /> Close</>
                            ) : (
                              <><Unlock size={13} /> Reopen</>
                            )}
                          </button>

                          {/* Delete Job */}
                          <button
                            id={`jobs-delete-${job.id}`}
                            onClick={() => setDeleteConfirmJob(job)}
                            title="Delete Job"
                            style={{ width: 38, minHeight: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.20)', color: '#ef4444', cursor: 'pointer', transition: 'all 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.14)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Post New / Edit Job Modal ──────────────────────── */}
      <AnimatePresence>
        {showFormModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
              onClick={() => setShowFormModal(false)}
            />
            <motion.div initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(10px, 3vw, 20px)', pointerEvents: 'none' }}
            >
              <div style={{ width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto', borderRadius: 24, background: 'var(--bg-elevated)', border: '1px solid var(--border)', boxShadow: '0 32px 96px rgba(0,0,0,0.30)', pointerEvents: 'auto' }}>
                <div style={{ height: 3, background: 'linear-gradient(90deg, #3D5016, #6B8A3A, #a3e635)', borderRadius: '24px 24px 0 0' }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px clamp(16px, 4vw, 24px) 14px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--bg-elevated)', zIndex: 10, backdropFilter: 'blur(20px)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 11, background: 'rgba(107,138,58,0.14)', border: '1px solid rgba(107,138,58,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Briefcase size={16} style={{ color: 'var(--primary)' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                        {editingJob ? 'Edit Job Posting' : 'Post New Job'}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {editingJob ? `Updating listing #${editingJob.id}` : 'Direct Core API Phase 2 integration'}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setShowFormModal(false)} id="jobs-form-close"
                    style={{ width: 36, height: 36, minWidth: 36, borderRadius: 10, background: 'var(--card-row-bg)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}
                  ><X size={16} /></button>
                </div>

                <form onSubmit={handleSubmit(onSubmitForm)} style={{ padding: '18px clamp(16px, 4vw, 24px) 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <Field label="Job Title *" error={errors.title?.message}>
                    <input {...register('title')} id="jobs-form-title" placeholder="e.g. Senior Full Stack Engineer" style={IS} />
                  </Field>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 14 }}>
                    <Field label="Company Name *" error={errors.company?.message}>
                      <input {...register('company')} id="jobs-form-company" placeholder="e.g. Acme Tech" style={IS} />
                    </Field>
                    <Field label="Location *" error={errors.location?.message}>
                      <input {...register('location')} id="jobs-form-location" placeholder="e.g. Bengaluru / Remote" style={IS} />
                    </Field>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 14 }}>
                    <Field label="Salary Range" error={errors.salary?.message}>
                      <input {...register('salary')} id="jobs-form-salary" placeholder="e.g. ₹20,00,000 - ₹30,00,000" style={IS} />
                    </Field>
                    <Field label="Experience Required" error={errors.experience?.message}>
                      <input {...register('experience')} id="jobs-form-exp" placeholder="e.g. 3-5 years" style={IS} />
                    </Field>
                  </div>

                  <Field label="Required Skills *" error={errors.skills?.message}>
                    <Controller control={control} name="skills" render={({ field }) => (
                      <SkillTagInput value={field.value} onChange={field.onChange} />
                    )} />
                  </Field>

                  <Field label="Job Description *" error={errors.description?.message}>
                    <textarea {...register('description')} rows={4} id="jobs-form-desc" placeholder="Provide detailed role expectations, responsibilities, and qualifications…" style={{ ...IS, resize: 'vertical', lineHeight: 1.6 }} />
                  </Field>

                  <div style={{ display: 'flex', gap: 10, paddingTop: 4, flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => setShowFormModal(false)}
                      style={{ flex: '1 1 120px', minHeight: 44, padding: '11px 0', borderRadius: 12, fontSize: 13, fontWeight: 700, background: 'var(--card-row-bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    >Cancel</button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} type="submit" disabled={isSubmitting} id="jobs-form-submit"
                      style={{ flex: '1 1 150px', minHeight: 44, padding: '11px 0', borderRadius: 12, fontSize: 13, fontWeight: 800, background: isSubmitting ? 'rgba(107,138,58,0.35)' : 'linear-gradient(135deg, #3D5016, #6B8A3A)', color: '#fff', border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer', boxShadow: isSubmitting ? 'none' : '0 4px 18px rgba(61,80,22,0.40)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
                    >
                      {isSubmitting ? (
                        <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />{editingJob ? 'Updating…' : 'Posting…'}</>
                      ) : (
                        <><CheckCircle2 size={14} />{editingJob ? 'Save Changes' : 'Post Job'}</>
                      )}
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── View Job Detail Modal ──────────────────────────── */}
      <AnimatePresence>
        {viewingJob && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
              onClick={() => setViewingJob(null)}
            />
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 20 }}
              style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(10px, 3vw, 20px)', pointerEvents: 'none' }}
            >
              <div style={{ width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', borderRadius: 24, background: 'var(--bg-elevated)', border: '1px solid var(--border)', boxShadow: '0 32px 96px rgba(0,0,0,0.30)', pointerEvents: 'auto' }}>
                <div style={{ height: 3, background: 'linear-gradient(90deg, #3D5016, #6B8A3A, #a3e635)', borderRadius: '24px 24px 0 0' }} />

                <div style={{ padding: '22px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>Job #{viewingJob.id}</span>
                      <StatusBadge status={viewingJob.status} />
                    </div>
                    <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>{viewingJob.title}</h2>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{viewingJob.company}</p>
                  </div>
                  <button onClick={() => setViewingJob(null)} style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--card-row-bg)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    <X size={16} />
                  </button>
                </div>

                <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* Metadata tiles */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                    <div style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--card-row-bg)', border: '1px solid var(--border)' }}>
                      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>Location</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{viewingJob.location || 'Not specified'}</p>
                    </div>
                    <div style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--card-row-bg)', border: '1px solid var(--border)' }}>
                      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>Salary</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{viewingJob.salary || 'Negotiable'}</p>
                    </div>
                    <div style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--card-row-bg)', border: '1px solid var(--border)' }}>
                      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>Experience</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{viewingJob.experience || 'Not specified'}</p>
                    </div>
                  </div>

                  {/* Skills */}
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>Required Skills</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {Array.isArray(viewingJob.skills) && viewingJob.skills.map(s => (
                        <span key={s} style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 999, background: 'rgba(107,138,58,0.12)', color: 'var(--primary)', border: '1px solid rgba(107,138,58,0.22)' }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>Description</p>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, background: 'var(--card-row-bg)', padding: 16, borderRadius: 14, border: '1px solid var(--border)', whiteSpace: 'pre-wrap' }}>
                      {viewingJob.description}
                    </div>
                  </div>

                  {/* Timestamps */}
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                    <span>Posted: {new Date(viewingJob.created_at || Date.now()).toLocaleString()}</span>
                    <span>Recruiter: {viewingJob.recruiter_name ? `${viewingJob.recruiter_name} (#${viewingJob.recruiter_id})` : `#${viewingJob.recruiter_id}`}</span>
                  </div>
                </div>

                <div style={{ padding: '16px 24px', background: 'var(--card-row-bg)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
                  <button onClick={() => setViewingJob(null)} style={{ padding: '10px 18px', borderRadius: 11, fontSize: 13, fontWeight: 700, background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)', cursor: 'pointer' }}>
                    Close
                  </button>
                  <Link
                    to={`/recruiter/candidates?jobId=${viewingJob.id}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 11, fontSize: 13, fontWeight: 700, background: 'rgba(96,165,250,0.12)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.25)', textDecoration: 'none' }}
                  >
                    <Users size={13} /> View Applicants
                  </Link>
                  <button
                    onClick={() => {
                      const j = viewingJob;
                      setViewingJob(null);
                      handleOpenEdit(j);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 11, fontSize: 13, fontWeight: 700, background: 'rgba(107,138,58,0.12)', color: 'var(--primary)', border: '1px solid rgba(107,138,58,0.25)', cursor: 'pointer' }}
                  >
                    <Edit2 size={13} /> Edit Job
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Delete Confirmation Dialog ─────────────────────── */}
      <AnimatePresence>
        {deleteConfirmJob && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
              onClick={() => setDeleteConfirmJob(null)}
            />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              style={{ position: 'fixed', inset: 0, zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, pointerEvents: 'none' }}
            >
              <div style={{ width: '100%', maxWidth: 440, borderRadius: 20, background: 'var(--bg-elevated)', border: '1px solid var(--border)', boxShadow: '0 24px 64px rgba(0,0,0,0.30)', padding: 24, pointerEvents: 'auto', textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#ef4444' }}>
                  <Trash2 size={22} />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Delete Job Listing?</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 24 }}>
                  Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>"{deleteConfirmJob.title}"</strong>? This will soft-delete the job in the database and remove it from candidate listings.
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setDeleteConfirmJob(null)} disabled={isDeleting}
                    style={{ flex: 1, padding: '11px 0', borderRadius: 11, fontSize: 13, fontWeight: 700, background: 'var(--card-row-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)', cursor: 'pointer' }}
                  >Cancel</button>
                  <button onClick={handleConfirmDelete} disabled={isDeleting} id="jobs-delete-confirm"
                    style={{ flex: 1, padding: '11px 0', borderRadius: 11, fontSize: 13, fontWeight: 800, background: '#ef4444', color: '#fff', border: 'none', cursor: isDeleting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    {isDeleting ? <RefreshCw size={14} className="animate-spin" /> : 'Yes, Delete'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default RecruiterJobsPage;
