import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  CalendarDays, Clock, Link as LinkIcon, Plus, X,
  CheckCircle2, AlertCircle, Video, Users, ArrowUpRight,
  ExternalLink,
} from 'lucide-react';
import { MOCK_SCHEDULED_INTERVIEWS } from '../../mock/recruiter/schedulerMock';
import { MOCK_CANDIDATES } from '../../mock/recruiter/candidatesMock';

const scheduleSchema = z.object({
  candidateId:     z.string().min(1, 'Select a candidate'),
  date:            z.string().min(1, 'Pick a date'),
  time:            z.string().min(1, 'Pick a time'),
  durationMinutes: z.coerce.number().min(15).max(240),
  meetingLink:     z.string().url('Enter a valid URL'),
});

const STATUS_CFG = {
  SCHEDULED: { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.28)',  dot: '#60a5fa', label: 'Scheduled' },
  COMPLETED: { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.28)',  dot: '#34d399', label: 'Completed' },
  CANCELLED: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.28)',   dot: '#ef4444', label: 'Cancelled' },
};

const groupByDate = (interviews) => {
  const groups = {};
  interviews.forEach(int => {
    const d = new Date(int.scheduledAt).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    if (!groups[d]) groups[d] = [];
    groups[d].push(int);
  });
  return groups;
};

const IS = { width: '100%', padding: '10px 14px', borderRadius: 12, fontSize: 13, background: 'var(--card-row-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };
const Field = ({ label, error, children }) => (
  <div>
    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 7 }}>{label}</label>
    {children}
    <AnimatePresence>
      {error && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
        style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#ef4444', marginTop: 6, fontWeight: 600 }}
      ><AlertCircle size={11} />{error}</motion.p>}
    </AnimatePresence>
  </div>
);

/* ════════════════════════════════════════════════════════════
   SCHEDULER PAGE
════════════════════════════════════════════════════════════ */
const RecruiterSchedulerPage = () => {
  const [interviews, setInterviews] = useState(MOCK_SCHEDULED_INTERVIEWS);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const grouped = groupByDate(interviews.filter(i => i.status !== 'CANCELLED'));
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(scheduleSchema),
    defaultValues: { durationMinutes: 45 },
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 700));
    const candidate = MOCK_CANDIDATES.find(c => c.id === data.candidateId);
    setInterviews(prev => [{ id: `si-${Date.now()}`, candidateId: data.candidateId, candidateName: candidate?.name ?? 'Unknown', jobId: candidate?.appliedJobId ?? '', jobTitle: candidate?.appliedJobTitle ?? '', scheduledAt: `${data.date}T${data.time}:00Z`, durationMinutes: data.durationMinutes, meetingLink: data.meetingLink, status: 'SCHEDULED' }, ...prev]);
    setIsSubmitting(false); setShowForm(false); reset();
  };

  const upcoming  = interviews.filter(i => i.status === 'SCHEDULED').length;
  const completed = interviews.filter(i => i.status === 'COMPLETED').length;

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
                    <CalendarDays size={11} /> Interview Scheduler
                  </span>
                </div>
                <h1 style={{ fontSize: 30, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', marginBottom: 6 }}>Interview Scheduler</h1>
                <p style={{ fontSize: 13, color: 'rgba(190,220,140,0.60)' }}>Manage and track all scheduled candidate interviews</p>
              </div>
              <motion.button whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
                onClick={() => setShowForm(true)} id="scheduler-new"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '12px 22px', borderRadius: 14, background: 'linear-gradient(135deg, #3D5016, #6B8A3A)', color: '#fff', fontSize: 14, fontWeight: 800, boxShadow: '0 6px 28px rgba(61,80,22,0.60)', border: '1px solid rgba(107,138,58,0.35)', cursor: 'pointer', letterSpacing: '-0.01em' }}
              >
                <Plus size={16} strokeWidth={2.5} /> Schedule Interview <ArrowUpRight size={14} />
              </motion.button>
            </div>

            {/* Stat chips */}
            <div style={{ display: 'flex', gap: 10, paddingBottom: 28, flexWrap: 'wrap' }}>
              {[
                { label: 'Total',     value: interviews.length, color: '#94a3b8' },
                { label: 'Upcoming',  value: upcoming,          color: '#60a5fa' },
                { label: 'Completed', value: completed,         color: '#34d399' },
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

      {/* ── Interviews by date ────────────────────────────── */}
      <div style={{ padding: '24px 36px 60px' }}>
        {Object.keys(grouped).length === 0 ? (
          <div style={{ padding: '64px 24px', textAlign: 'center', borderRadius: 20, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <CalendarDays size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px', display: 'block' }} />
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>No interviews scheduled</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Schedule your first interview to start tracking candidates.</p>
            <button onClick={() => setShowForm(true)} id="scheduler-empty-cta"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 12, background: 'linear-gradient(135deg, #3D5016, #6B8A3A)', color: '#fff', fontSize: 13, fontWeight: 800, border: 'none', cursor: 'pointer', boxShadow: '0 4px 18px rgba(61,80,22,0.40)' }}
            ><Plus size={15} /> Schedule First Interview</button>
          </div>
        ) : (
          Object.entries(grouped).map(([date, group]) => (
            <div key={date} style={{ marginBottom: 24 }}>
              {/* Date separator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{date}</span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', background: 'rgba(107,138,58,0.10)', padding: '3px 10px', borderRadius: 999, border: '1px solid rgba(107,138,58,0.22)', whiteSpace: 'nowrap' }}>{group.length} interview{group.length !== 1 ? 's' : ''}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {group.map((int, i) => {
                  const sc = STATUS_CFG[int.status] ?? STATUS_CFG.SCHEDULED;
                  const timeStr = new Date(int.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <motion.div key={int.id}
                      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                      style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '18px 22px', borderRadius: 18, background: 'var(--bg-elevated)', border: '1px solid var(--border)', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', transition: 'all 0.16s ease' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateX(0)'; }}
                    >
                      {/* Time block */}
                      <div style={{ textAlign: 'center', minWidth: 56, flexShrink: 0 }}>
                        <p style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>{timeStr.split(':')[0]}</p>
                        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>:{timeStr.split(':')[1]}</p>
                      </div>

                      {/* Vertical divider */}
                      <div style={{ width: 2, height: 44, borderRadius: 999, background: `linear-gradient(to bottom, ${sc.color}80, ${sc.color}20)`, flexShrink: 0 }} />

                      {/* Avatar */}
                      <div style={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #3D5016, #6B8A3A)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 15, fontWeight: 800, boxShadow: '0 3px 10px rgba(61,80,22,0.35)' }}>
                        {int.candidateName.charAt(0)}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                          <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{int.candidateName}</p>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                            <span style={{ width: 4, height: 4, borderRadius: '50%', background: sc.dot, display: 'inline-block' }} />{sc.label}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{int.jobTitle}</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                            <Clock size={11} /> {int.durationMinutes} min
                          </span>
                        </div>
                      </div>

                      {/* Join button */}
                      {int.status === 'SCHEDULED' && (
                        <a href={int.meetingLink} target="_blank" rel="noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 12, background: 'rgba(96,165,250,0.10)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.28)', fontSize: 12, fontWeight: 700, textDecoration: 'none', transition: 'all 0.15s', flexShrink: 0 }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(96,165,250,0.18)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(96,165,250,0.10)'}
                        >
                          <Video size={13} /> Join <ExternalLink size={11} />
                        </a>
                      )}
                      {int.status === 'COMPLETED' && (
                        <CheckCircle2 size={20} style={{ color: '#34d399', flexShrink: 0 }} />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Schedule Interview Modal ───────────────────────── */}
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
              <div style={{ width: '100%', maxWidth: 480, borderRadius: 24, background: 'var(--bg-elevated)', border: '1px solid var(--border)', boxShadow: '0 32px 96px rgba(0,0,0,0.30)', pointerEvents: 'auto' }}>
                <div style={{ height: 3, background: 'linear-gradient(90deg, #3D5016, #6B8A3A, #60a5fa)', borderRadius: '24px 24px 0 0' }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px 14px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 11, background: 'rgba(96,165,250,0.14)', border: '1px solid rgba(96,165,250,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CalendarDays size={16} style={{ color: '#60a5fa' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Schedule Interview</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Set up a meeting with a candidate</p>
                    </div>
                  </div>
                  <button onClick={() => setShowForm(false)} id="scheduler-form-close"
                    style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--card-row-bg)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}
                  ><X size={16} /></button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <Field label="Candidate *" error={errors.candidateId?.message}>
                    <select {...register('candidateId')} id="scheduler-form-candidate" style={IS}>
                      <option value="">Select candidate…</option>
                      {MOCK_CANDIDATES.map(c => <option key={c.id} value={c.id}>{c.name} — {c.appliedJobTitle}</option>)}
                    </select>
                  </Field>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <Field label="Date *" error={errors.date?.message}><input {...register('date')} type="date" id="scheduler-form-date" style={IS} /></Field>
                    <Field label="Time *" error={errors.time?.message}><input {...register('time')} type="time" id="scheduler-form-time" style={IS} /></Field>
                  </div>
                  <Field label="Duration (minutes)" error={errors.durationMinutes?.message}>
                    <input {...register('durationMinutes')} type="number" id="scheduler-form-duration" style={IS} />
                  </Field>
                  <Field label="Meeting Link *" error={errors.meetingLink?.message}>
                    <input {...register('meetingLink')} type="url" id="scheduler-form-link" placeholder="https://meet.google.com/…" style={IS} />
                  </Field>
                  <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                    <button type="button" onClick={() => setShowForm(false)}
                      style={{ flex: 1, padding: '11px 0', borderRadius: 12, fontSize: 13, fontWeight: 700, background: 'var(--card-row-bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    >Cancel</button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} type="submit" disabled={isSubmitting} id="scheduler-form-submit"
                      style={{ flex: 1, padding: '11px 0', borderRadius: 12, fontSize: 13, fontWeight: 800, background: isSubmitting ? 'rgba(96,165,250,0.25)' : 'linear-gradient(135deg, #1e40af, #3b82f6)', color: '#fff', border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer', boxShadow: isSubmitting ? 'none' : '0 4px 18px rgba(59,130,246,0.40)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
                    >
                      {isSubmitting ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Scheduling…</> : <><CheckCircle2 size={14} />Schedule</>}
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

export default RecruiterSchedulerPage;
