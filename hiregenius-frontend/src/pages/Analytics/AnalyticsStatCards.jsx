import { motion } from 'framer-motion';
import { FileSearch, TrendingUp, TrendingDown, MessageSquare, CheckCircle2, Briefcase, Star } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { animate } from 'framer-motion';

const CARDS = [
  { key: 'totalResumesScreened', label: 'Resumes Screened',      icon: FileSearch,    suffix: '',  color: '#60a5fa', delta: '+12.4%' },
  { key: 'avgResumeScore',       label: 'Avg. Resume Score',      icon: Star,          suffix: '%', color: '#f59e0b', delta: '+3.1%'  },
  { key: 'totalInterviews',      label: 'Interviews Conducted',   icon: MessageSquare, suffix: '',  color: '#a78bfa', delta: '+8.7%'  },
  { key: 'interviewSuccessRate', label: 'Interview Success Rate', icon: CheckCircle2,  suffix: '%', color: '#34d399', delta: '-2.5%'  },
  { key: 'activeJobPostings',    label: 'Active Job Postings',    icon: Briefcase,     suffix: '',  color: '#ec4899', delta: '—'       },
];

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } } };
const itemV   = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } } };

const CountUp = ({ target, suffix }) => {
  const [val, setVal] = useState(0);
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const ctrl = animate(0, target, { duration: 1.4, ease: [0.22, 1, 0.36, 1], onUpdate: v => setVal(Math.round(v)) });
    return () => ctrl.stop();
  }, [target]);
  return <>{val}{suffix}</>;
};

const Skeleton = () => (
  <div style={{ height: 120, borderRadius: '18px 18px 0 0', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', position: 'relative' }}>
    <div className="analytics-shimmer" />
  </div>
);

const AnalyticsStatCards = ({ summary, loading }) => {
  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, paddingBottom: 0 }} className="stat-cards-grid">
        {[1,2,3,4,5].map(i => <Skeleton key={i} />)}
      </div>
    );
  }

  return (
    <motion.div
      variants={stagger} initial="hidden" animate="show"
      style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}
      className="stat-cards-grid"
    >
      {CARDS.map(({ key, label, icon: Icon, suffix, color, delta }) => {
        const data  = summary?.[key] ?? { value: 0, trend: 0 };
        const { value, trend } = data;
        const isUp  = trend >= 0;
        const TIcon = isUp ? TrendingUp : TrendingDown;
        const trendColor = trend === 0 ? 'rgba(255,255,255,0.35)' : isUp ? '#34d399' : '#ef4444';

        return (
          <motion.div key={key} variants={itemV}
            style={{
              background: 'rgba(255,255,255,0.065)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: '18px 18px 0 0',
              padding: '20px 20px 24px',
              display: 'flex', flexDirection: 'column', gap: 14,
              position: 'relative', overflow: 'hidden', cursor: 'default',
              transition: 'background 0.18s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.10)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.065)'}
          >
            {/* Top color stripe */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}00, ${color}99, ${color}00)` }} />

            {/* Icon + trend */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: `${color}18`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={17} style={{ color }} />
              </div>
              {trend !== 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, color: trendColor, background: `${trendColor}16`, padding: '3px 8px', borderRadius: 999, border: `1px solid ${trendColor}25` }}>
                  <TIcon size={10} />{isUp ? '+' : ''}{trend}%
                </span>
              )}
              {trend === 0 && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.30)', fontWeight: 600 }}>No change</span>}
            </div>

            {/* Number */}
            <div>
              <div style={{ fontSize: 36, fontWeight: 900, color: '#fff', letterSpacing: '-0.06em', lineHeight: 1 }}>
                <CountUp target={value} suffix={suffix} />
              </div>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(190,220,140,0.55)', marginTop: 5 }}>{label}</div>
            </div>

            {/* Trend label */}
            <div style={{ fontSize: 10, color: trendColor, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              {trend !== 0 && <><TIcon size={10} />{isUp ? '+' : ''}{trend}% vs last period</>}
              {trend === 0 && 'No change vs last period'}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default AnalyticsStatCards;
