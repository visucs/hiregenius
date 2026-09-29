import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Check, Calendar, CalendarX,
  FileText, CheckCircle2, Clock, RefreshCw,
  Sparkles, Inbox,
} from 'lucide-react';
import toast from 'react-hot-toast';
import notificationsService from '../../services/notificationsService';

/* ─── Relative time helper ─────────────────────────────────── */
const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diffInSec = Math.floor((now - date) / 1000);

  if (diffInSec < 60) return 'Just now';
  const diffInMin = Math.floor(diffInSec / 60);
  if (diffInMin < 60) return `${diffInMin}m ago`;
  const diffInHours = Math.floor(diffInMin / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/* ─── Notification icon selector ───────────────────────────── */
const getNotificationIcon = (type) => {
  switch (type) {
    case 'INTERVIEW_SCHEDULED':
      return { icon: Calendar, color: '#38bdf8', bg: 'rgba(56,189,248,0.14)' };
    case 'INTERVIEW_CANCELLED':
      return { icon: CalendarX, color: '#f87171', bg: 'rgba(248,113,113,0.14)' };
    case 'STATUS_CHANGED':
      return { icon: CheckCircle2, color: '#34d399', bg: 'rgba(52,211,153,0.14)' };
    case 'APPLICATION_RECEIVED':
      return { icon: FileText, color: '#fbbf24', bg: 'rgba(251,191,36,0.14)' };
    default:
      return { icon: Sparkles, color: '#a3e635', bg: 'rgba(163,230,53,0.14)' };
  }
};

const NotificationsDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const dropdownRef = useRef(null);

  // 1. Fetch Notifications from Core API (GET /api/notifications/mine)
  const fetchNotifications = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await notificationsService.getMyNotifications({ limit: 30 });
      const list = res?.data?.notifications || [];
      setNotifications(list);
      const unread = list.filter((n) => !n.is_read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('[Notifications] Failed to fetch:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  // 2. Hybrid strategy: Fetch on mount + 30s background interval polling
  useEffect(() => {
    fetchNotifications();

    const intervalId = setInterval(() => {
      fetchNotifications(true); // silent background poll
    }, 30000);

    return () => clearInterval(intervalId);
  }, [fetchNotifications]);

  // 3. Refetch when opening the dropdown
  const toggleDropdown = () => {
    if (!isOpen) {
      fetchNotifications(true);
    }
    setIsOpen((prev) => !prev);
  };

  // 4. Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // 5. Mark single notification as read (PATCH /api/notifications/:id/read)
  const handleMarkAsRead = async (id, isRead) => {
    if (isRead) return; // already read
    try {
      await notificationsService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('[Notifications] Failed to mark as read:', err);
    }
  };

  // 6. Mark all as read (PATCH /api/notifications/read-all)
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await notificationsService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error('[Notifications] Failed to mark all as read:', err);
      toast.error('Failed to mark all as read');
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* ── Bell Icon Button ──────────────────────────────── */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={toggleDropdown}
        className="p-2 rounded-xl relative"
        style={{
          color: isOpen ? 'var(--primary)' : 'var(--text-secondary)',
          background: isOpen ? 'rgba(107,138,58,0.16)' : 'var(--card-row-bg)',
          border: `1px solid ${isOpen ? 'var(--primary)' : 'var(--border)'}`,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s ease',
        }}
        aria-label="Notifications"
        id="navbar-notifications-btn"
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -3,
              right: -3,
              minWidth: 16,
              height: 16,
              padding: '0 4px',
              borderRadius: 999,
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: '#fff',
              fontSize: 10,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 8px rgba(239,68,68,0.5)',
              border: '2px solid var(--bg-base)',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </motion.button>

      {/* ── Notifications Dropdown Panel ──────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 10px)',
              width: 'clamp(320px, 90vw, 380px)',
              maxHeight: '480px',
              background: 'var(--bg-elevated)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid var(--border)',
              borderRadius: 18,
              boxShadow: '0 16px 40px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.05)',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 100,
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '14px 16px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: 999,
                      background: 'rgba(107,138,58,0.18)',
                      color: 'var(--primary)',
                      border: '1px solid rgba(107,138,58,0.30)',
                    }}
                  >
                    {unreadCount} new
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => fetchNotifications(false)}
                  disabled={loading}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 4,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="Refresh"
                >
                  <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                </button>

                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    disabled={markingAll}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--primary)',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: markingAll ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Check size={12} /> Mark all read
                  </button>
                )}
              </div>
            </div>

            {/* Notification List Body */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                maxHeight: '360px',
                padding: '6px 0',
              }}
            >
              {loading && notifications.length === 0 ? (
                <div style={{ padding: '36px 20px', textAlign: 'center' }}>
                  <RefreshCw
                    size={22}
                    className="animate-spin"
                    style={{ margin: '0 auto 8px', color: 'var(--primary)' }}
                  />
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Loading updates…
                  </p>
                </div>
              ) : notifications.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <Inbox
                    size={32}
                    style={{
                      margin: '0 auto 10px',
                      color: 'var(--text-muted)',
                      opacity: 0.6,
                    }}
                  />
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: 4,
                    }}
                  >
                    No notifications yet
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    You're all caught up! Status changes and interview updates will appear here.
                  </p>
                </div>
              ) : (
                notifications.map((item) => {
                  const cfg = getNotificationIcon(item.type);
                  const Icon = cfg.icon;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleMarkAsRead(item.id, item.is_read)}
                      style={{
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        cursor: item.is_read ? 'default' : 'pointer',
                        background: item.is_read
                          ? 'transparent'
                          : 'rgba(107,138,58,0.06)',
                        borderBottom: '1px solid var(--border)',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = item.is_read
                          ? 'var(--card-row-bg)'
                          : 'rgba(107,138,58,0.12)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = item.is_read
                          ? 'transparent'
                          : 'rgba(107,138,58,0.06)';
                      }}
                    >
                      {/* Icon */}
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 10,
                          background: cfg.bg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      >
                        <Icon size={16} color={cfg.color} />
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: 12,
                            fontWeight: item.is_read ? 500 : 700,
                            color: 'var(--text-primary)',
                            lineHeight: 1.45,
                            marginBottom: 4,
                            wordBreak: 'break-word',
                          }}
                        >
                          {item.message}
                        </p>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: 10,
                            color: 'var(--text-muted)',
                          }}
                        >
                          <Clock size={10} />
                          <span>{formatTimeAgo(item.created_at)}</span>
                          {!item.is_read && (
                            <span
                              style={{
                                width: 5,
                                height: 5,
                                borderRadius: '50%',
                                background: 'var(--primary)',
                                display: 'inline-block',
                                marginLeft: 4,
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationsDropdown;
