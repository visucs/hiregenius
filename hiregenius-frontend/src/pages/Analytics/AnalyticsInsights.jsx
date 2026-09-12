import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, TrendingDown, Star, Lightbulb, ChevronRight } from 'lucide-react';

const deriveInsights = ({ summary, skillDistribution, interviewOutcomes, hiringTrend }) => {
  const insights = [];

  if (summary?.avgResumeScore) {
    const { value, trend } = summary.avgResumeScore;
    if (trend > 0) {
      insights.push({ icon: TrendingUp, color: '#34d399', bg: 'rgba(52,211,153,0.10)', border: 'rgba(52,211,153,0.22)', text: `Your average resume score improved by ${trend}% this period — candidates are better matched to your job descriptions.` });
    } else if (trend < 0) {
      insights.push({ icon: TrendingDown, color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.22)', text: `Average resume score dipped ${Math.abs(trend)}% this period. Consider reviewing your job description to attract better-matched candidates.` });
    }
  }

  if (skillDistribution?.length) {
    const top = skillDistribution[0];
    const second = skillDistribution[1];
    insights.push({ icon: Star, color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.22)', text: `${top.skill} and ${second?.skill || 'Python'} are your most in-demand skills — ${top.count} and ${second?.count || 0} matching candidates screened this period.` });
  }

  if (summary?.interviewSuccessRate) {
    const { value, trend } = summary.interviewSuccessRate;
    if (trend < -2) {
      insights.push({ icon: TrendingDown, color: '#ef4444', bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.22)', text: `Interview success rate is ${value}% — down ${Math.abs(trend)}% vs last period. Review AI-interview question difficulty or candidate targeting.` });
    } else if (trend > 2) {
      insights.push({ icon: TrendingUp, color: '#34d399', bg: 'rgba(52,211,153,0.10)', border: 'rgba(52,211,153,0.22)', text: `Interview success rate reached ${value}% — up ${trend}% vs last period. Your candidate pre-screening quality is improving.` });
    }
  }

  if (hiringTrend?.length >= 2) {
    const last = hiringTrend[hiringTrend.length - 1]?.hires ?? 0;
    const prev = hiringTrend[hiringTrend.length - 2]?.hires ?? 0;
    if (last > prev) {
      insights.push({ icon: TrendingUp, color: '#60a5fa', bg: 'rgba(96,165,250,0.10)', border: 'rgba(96,165,250,0.22)', text: `Hires increased in the most recent period (${prev} → ${last}). Momentum is building — keep the pipeline warm.` });
    }
  }

  return insights.slice(0, 3);
};

const AnalyticsInsights = ({ summary, skillDistribution, interviewOutcomes, hiringTrend, loading }) => {
  if (loading) return null;
  const insights = deriveInsights({ summary, skillDistribution, interviewOutcomes, hiringTrend });
  if (!insights.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
      }}
    >
      {/* Top stripe */}
      <div style={{ height: 3, background: 'linear-gradient(90deg, #3D5016, #6B8A3A, #a3e635, #6B8A3A)', borderRadius: '20px 20px 0 0' }} />

      {/* Header */}
      <div style={{ padding: '16px 22px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: 'linear-gradient(135deg, rgba(107,138,58,0.25), rgba(163,230,53,0.15))', border: '1px solid rgba(107,138,58,0.30)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={17} style={{ color: '#a3e635' }} />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>AI Insights</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Computed from this page's data · No extra API call</p>
          </div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#a3e635', background: 'rgba(163,230,53,0.10)', padding: '4px 10px', borderRadius: 999, border: '1px solid rgba(163,230,53,0.22)' }}>
          {insights.length} insights
        </span>
      </div>

      {/* Insight rows */}
      <div style={{ padding: '12px 16px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {insights.map(({ icon: Icon, color, bg, border, text }, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.28, delay: i * 0.07 }}
            style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', borderRadius: 14, background: bg, border: `1px solid ${border}`, cursor: 'default', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; }}
          >
            <div style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, marginTop: 1, background: `${color}18`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={14} style={{ color }} />
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--text-secondary)', margin: 0, flex: 1 }}>{text}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default AnalyticsInsights;
