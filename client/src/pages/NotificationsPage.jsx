import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';

const TYPE_CONFIG = {
  order:      { color: 'bg-blue-500',   label: 'order',      border: 'border-blue-400' },
  payment:    { color: 'bg-green-500',  label: 'payment',    border: 'border-green-400' },
  review:     { color: 'bg-amber-500',  label: 'review',     border: 'border-amber-400' },
  moderation: { color: 'bg-purple-500', label: 'moderation', border: 'border-purple-400' },
  dispute:    { color: 'bg-red-500',    label: 'dispute',    border: 'border-red-400' },
  system:     { color: 'bg-gray-400',   label: 'system',     border: 'border-gray-300' },
};

function relativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  useEffect(() => {
    document.title = 'Notifications — GigMarket';
    return () => { document.title = 'GigMarket'; };
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch { /* silent */ }
  };

  const handleMarkRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch { /* silent */ }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && <p className="text-sm text-gray-500 mt-0.5">{unreadCount} unread</p>}
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="btn-secondary text-sm">Mark all read</button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : error ? (
        <Alert message={error} />
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No notifications yet.</div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.system;
            return (
              <div
                key={n._id}
                onClick={() => !n.isRead && handleMarkRead(n._id)}
                className={`bg-white rounded-2xl border shadow-card transition-all cursor-pointer
                  ${n.isRead
                    ? 'border-gray-100 opacity-70'
                    : `border-l-4 ${cfg.border} border-r border-t border-b border-gray-100 hover:shadow-hover`
                  }`}
              >
                <div className="p-4 flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full ${cfg.color} shrink-0 mt-1.5`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-semibold ${n.isRead ? 'text-gray-500' : 'text-gray-900'}`}>
                        {n.title}
                      </p>
                      <span className={`badge shrink-0 text-[10px] ${n.isRead ? 'bg-gray-100 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                    <p className="text-[11px] text-gray-400 mt-1.5">{relativeTime(n.createdAt)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
