import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Users, Key, BarChart3, ShieldCheck, TrendingUp } from 'lucide-react';
import { selectUser } from '../../features/auth/authSlice';

const STAT_CARDS = [
  { label: 'Total Users', value: '—', icon: Users, color: 'var(--primary)' },
  { label: 'API Keys Active', value: '—', icon: Key, color: 'var(--secondary)' },
  { label: 'Platform Health', value: '—', icon: ShieldCheck, color: 'var(--success)' },
  { label: 'Monthly Hires', value: '—', icon: BarChart3, color: '#F59E0B' },
];

/**
 * AdminDashboard — Phase 1 placeholder.
 * Role: ADMIN. Admin-only pages: user management, API key management, audit logs.
 */
const AdminDashboard = () => {
  const user = useSelector(selectUser);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        {/* Welcome */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={18} style={{ color: 'var(--danger)' }} />
            <span
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: 'var(--danger)' }}
            >
              Admin Panel
            </span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Admin Dashboard{user?.name ? ` — ${user.name}` : ''}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Full platform control. Handle with care.
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {STAT_CARDS.map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="p-5 rounded-2xl"
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div
                className="inline-flex items-center justify-center w-9 h-9 rounded-xl mb-3"
                style={{ backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` }}
              >
                <Icon size={17} style={{ color }} />
              </div>
              <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Phase note */}
        <div
          className="rounded-2xl p-5 flex items-center gap-3 text-sm"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
        >
          <TrendingUp size={18} style={{ color: 'var(--danger)', flexShrink: 0 }} />
          Phase 2 will add user management, API key rotation, and platform audit logs for admins.
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;
