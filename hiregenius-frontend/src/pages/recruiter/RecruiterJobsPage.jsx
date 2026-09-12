import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Briefcase, Plus, X, Edit2, Lock, Eye, Users,
  Calendar, MapPin, PlusCircle, AlertCircle, ChevronRight,
  TrendingUp, Search, CheckCircle2, ArrowUpRight,
} from 'lucide-react';
import { MOCK_JOBS } from '../../mock/recruiter/jobsMock';

const jobSchema = z.object({
  title:           z.string().min(3, 'At least 3 characters'),
  company:         z.string().min(2, 'Required'),
  location:        z.string().min(2, 'Required'),
  salaryMin:       z.coerce.number().min(0),
  salaryMax:       z.coerce.number().min(0),
  experienceYears: z.coerce.number().min(0).max(30),
  description:     z.string().min(20, 'At least 20 characters'),
}).refine(d => d.salaryMax >= d.salaryMin, { message: 'Max ≥ Min', path: ['salaryMax'] });

const STATUS_CFG = {
  OPEN:   { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.28)',  dot: '#34d399', label: 'Open'   },
  CLOSED: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.28)',   dot: '#ef4444', label: 'Closed' },
  DRAFT:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.28)',  dot: '#f59e0b', label: 'Draft'  },
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
const SkillTagInput = ({ value, onChange }) => {
  const [input, setInput] = useState('');
  const add = () => { if (input.trim() && !value.includes(input.trim())) onChange([...value, input.trim()]); setInput(''); };
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
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder="Type skill, press Enter" id="jobs-skill-input"
          style={{ flex: 1, padding: '10px 14px', borderRadius: 12, fontSize: 13, background: 'var(--card-row-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit' }}
        />
        <button type="button" onClick={add}
          style={{ padding: '0 16px', borderRadius: 12, fontSize: 13, fontWeight: 700, background: 'rgba(107,138,58,0.12)', color: 'var(--primary)', border: '1px solid rgba(107,138,58,0.22)', cursor: 'pointer' }}
        >Add</button>
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

const IS = { width: '100%', padding: '10px 14px', borderRadius: 12, fontSize: 13, background: 'var(--card-row-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };

/* ════════════════════════════════════════════════════════════
   JOBS PAGE
════════════════════════════════════════════════════════════ */
const RecruiterJobsPage = () => {
  const [jobs, setJobs] = useState(MOCK_JOBS);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    resolver: zodResolver(jobSchema),
    defaultValues: { title: '', company: '', location: '', salaryMin: 0, salaryMax: 0, experienceYears: 0, description: '' },
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 700));
    setJobs(prev => [{ id: `job-${Date.now()}`, ...data, skills: data.skills ?? [], status: 'OPEN', applicantCount: 0, postedAt: new Date().toISOString(), recruiterId: 'rec-001' }, ...prev]);
    setIsSubmitting(false); setShowForm(false); reset();
  };

  const openCount  = jobs.filter(j => j.status === 'OPEN').length;
  const totalApps  = jobs.reduce((a, j) => a + (j.applicantCount ?? 0), 0);

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100%' }}>

      {/* ── Hero band ─────────────────────────────────────── */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(150deg, #18280a 0%, #0c1505 55%, #0f1e06 100%)', padding: '32px 36px 0' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(107,138,58,0.10) 1.5px, transparent 1.5px)', backgroundSize: '26px 26px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -60, right: '15%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,138,58,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 24 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(107,138,58,0.95)', background: 'rgba(107,138,58,0.14)', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(107,138,58,0.28)' }}>
                    <Briefcase size={11} /> Job Listings
                  </span>
                </div>
                <h1 style={{ fontSize: 30, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', marginBottom: 6 }}>My Jobs</h1>
                <p style={{ fontSize: 13, color: 'rgba(190,220,140,0.60)' }}>{jobs.length} listing{jobs.length !== 1 ? 's' : ''} · {openCount} open · {totalApps} total applicants</p>
              </div>
              <motion.button whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
                onClick={() => setShowForm(true)} id="jobs-post-new"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '12px 22px', borderRadius: 14, background: 'linear-gradient(135deg, #3D5016, #6B8A3A)', color: '#fff', fontSize: 14, fontWeight: 800, boxShadow: '0 6px 28px rgba(61,80,22,0.60)', border: '1px solid rgba(107,138,58,0.35)', cursor: 'pointer', letterSpacing: '-0.01em' }}
              >
                <PlusCircle size={16} strokeWidth={2.5} /> Post New Job <ArrowUpRight size={14} />
              </motion.button>
            </div>

            {/* Stat chips */}
            <div style={{ display: 'flex', gap: 10, paddingBottom: 28, flexWrap: 'wrap' }}>
              {[
                { label: 'Total Jobs',  value: jobs.length,  color: '#60a5fa' },
                { label: 'Open',        value: openCount,    color: '#34d399' },
                { label: 'Applicants',  value: totalApps,    color: '#f59e0b' },
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

      {/* ── Job cards grid ────────────────────────────────── */}
      <div style={{ padding: '24px 36px 60px' }}>
        {jobs.length === 0 ? (
          <div style={{ padding: '64px 24px', textAlign: 'center', borderRadius: 20, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <Briefcase size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px', display: 'block' }} />
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>No jobs yet</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Post your first job to start receiving applications.</p>
            <button onClick={() => setShowForm(true)} id="jobs-empty-cta"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 12, background: 'linear-gradient(135deg, #3D5016, #6B8A3A)', color: '#fff', fontSize: 13, fontWeight: 800, border: 'none', cursor: 'pointer', boxShadow: '0 4px 18px rgba(61,80,22,0.40)' }}
            ><PlusCircle size={15} /> Post First Job</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {jobs.map((job, i) => (
              <motion.div key={job.id}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.32, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', transition: 'all 0.18s ease', cursor: 'default' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = 'var(--border-hover)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                {/* Card top stripe by status */}
                <div style={{ height: 3, background: `linear-gradient(90deg, ${STATUS_CFG[job.status]?.color ?? '#888'}00, ${STATUS_CFG[job.status]?.color ?? '#888'}, ${STATUS_CFG[job.status]?.color ?? '#888'}00)` }} />

                <div style={{ padding: '18px 20px 16px' }}>
                  {/* Header row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em', marginBottom: 3 }}>{job.title}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{job.company}</p>
                    </div>
                    <StatusBadge status={job.status} />
                  </div>

                  {/* Meta row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                      <MapPin size={11} /> {job.location}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                      <Users size={11} /> {job.applicantCount} applicants
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                      <Calendar size={11} /> {new Date(job.postedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>

                  {/* Skill chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 16 }}>
                    {job.skills.slice(0, 4).map(s => (
                      <span key={s} style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: 'rgba(107,138,58,0.09)', color: 'var(--primary)', border: '1px solid rgba(107,138,58,0.18)' }}>{s}</span>
                    ))}
                    {job.skills.length > 4 && <span style={{ fontSize: 11, color: 'var(--text-muted)', padding: '3px 6px', fontWeight: 600 }}>+{job.skills.length - 4}</span>}
                  </div>

                  {/* Action row */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button id={`jobs-edit-${job.id}`}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 0', borderRadius: 11, fontSize: 12, fontWeight: 700, background: 'rgba(107,138,58,0.08)', color: 'var(--primary)', border: '1px solid rgba(107,138,58,0.20)', cursor: 'pointer', transition: 'all 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(107,138,58,0.15)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(107,138,58,0.08)'}
                    ><Edit2 size={13} /> Edit</button>
                    <button id={`jobs-close-${job.id}`}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 0', borderRadius: 11, fontSize: 12, fontWeight: 700, background: 'rgba(239,68,68,0.07)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.20)', cursor: 'pointer', transition: 'all 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.13)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.07)'}
                    ><Lock size={13} /> {job.status === 'CLOSED' ? 'Reopen' : 'Close'}</button>
                    <button id={`jobs-view-${job.id}`}
                      style={{ width: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 11, background: 'var(--card-row-bg)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                    ><Eye size={14} /></button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── Post New Job Modal ─────────────────────────────── */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
              onClick={() => setShowForm(false)}
            />
            <motion.div initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, pointerEvents: 'none' }}
            >
              <div style={{ width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', borderRadius: 24, background: 'var(--bg-elevated)', border: '1px solid var(--border)', boxShadow: '0 32px 96px rgba(0,0,0,0.30)', pointerEvents: 'auto' }}>
                <div style={{ height: 3, background: 'linear-gradient(90deg, #3D5016, #6B8A3A, #a3e635)', borderRadius: '24px 24px 0 0' }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px 14px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--bg-elevated)', zIndex: 10, backdropFilter: 'blur(20px)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 11, background: 'rgba(107,138,58,0.14)', border: '1px solid rgba(107,138,58,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Briefcase size={16} style={{ color: 'var(--primary)' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Post New Job</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Fill in the details to attract candidates</p>
                    </div>
                  </div>
                  <button onClick={() => setShowForm(false)} id="jobs-form-close"
                    style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--card-row-bg)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}
                  ><X size={16} /></button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <Field label="Job Title *" error={errors.title?.message}>
                    <input {...register('title')} id="jobs-form-title" placeholder="e.g. Senior Backend Developer" style={IS} />
                  </Field>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <Field label="Company *" error={errors.company?.message}><input {...register('company')} id="jobs-form-company" style={IS} /></Field>
                    <Field label="Location *" error={errors.location?.message}><input {...register('location')} id="jobs-form-location" placeholder="City / Remote" style={IS} /></Field>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                    <Field label="Min Salary (₹)" error={errors.salaryMin?.message}><input {...register('salaryMin')} type="number" id="jobs-form-smin" style={IS} /></Field>
                    <Field label="Max Salary (₹)" error={errors.salaryMax?.message}><input {...register('salaryMax')} type="number" id="jobs-form-smax" style={IS} /></Field>
                    <Field label="Exp (yrs)" error={errors.experienceYears?.message}><input {...register('experienceYears')} type="number" id="jobs-form-exp" style={IS} /></Field>
                  </div>
                  <Field label="Required Skills">
                    <Controller control={control} name="skills" defaultValue={[]} render={({ field }) => <SkillTagInput value={field.value} onChange={field.onChange} />} />
                  </Field>
                  <Field label="Description *" error={errors.description?.message}>
                    <textarea {...register('description')} rows={4} id="jobs-form-desc" placeholder="Describe the role, responsibilities…" style={{ ...IS, resize: 'vertical', lineHeight: 1.6 }} />
                  </Field>
                  <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                    <button type="button" onClick={() => setShowForm(false)}
                      style={{ flex: 1, padding: '11px 0', borderRadius: 12, fontSize: 13, fontWeight: 700, background: 'var(--card-row-bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    >Cancel</button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} type="submit" disabled={isSubmitting} id="jobs-form-submit"
                      style={{ flex: 1, padding: '11px 0', borderRadius: 12, fontSize: 13, fontWeight: 800, background: isSubmitting ? 'rgba(107,138,58,0.35)' : 'linear-gradient(135deg, #3D5016, #6B8A3A)', color: '#fff', border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer', boxShadow: isSubmitting ? 'none' : '0 4px 18px rgba(61,80,22,0.40)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
                    >
                      {isSubmitting ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Posting…</> : <><CheckCircle2 size={14} />Post Job</>}
                    </motion.button>
                  </div>
                </form>
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
