import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, Menu, Check, CheckCheck, X, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/auth.api';
import { notificationsApi } from '../../api/notifications.api';
import LanguageSwitcher from '../shared/LanguageSwitcher';
import toast from 'react-hot-toast';

interface Props {
  title: string;
  onMenuClick: () => void;
}

export default function Header({ title: _title, onMenuClick }: Props) {
  const { t } = useTranslation();
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [detailNotif, setDetailNotif] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const prevUnreadRef = useRef<number | null>(null);
  const prevIdSetRef = useRef<Set<string>>(new Set());

  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list({ limit: 20 }).then((r) => r.data),
    refetchInterval: 10_000,
    enabled: !!user,
  });

  const notifications = notificationsData?.notifications ?? [];
  const unreadCount = notificationsData?.unreadCount ?? 0;

  // Show a toast whenever a brand-new unread notification arrives
  useEffect(() => {
    if (!notifications.length) return;
    const unread = notifications.filter((n: any) => !n.isRead);
    const newOnes = unread.filter((n: any) => !prevIdSetRef.current.has(n.id));
    // Only fire after first load (prevUnreadRef initialized)
    if (prevUnreadRef.current !== null && newOnes.length > 0) {
      newOnes.forEach((n: any) => {
        toast(n.title + (n.message ? `\n${n.message}` : ''), {
          icon: '🔔',
          duration: 5000,
          style: { fontSize: 13, maxWidth: 340 },
        });
      });
    }
    prevUnreadRef.current = unreadCount;
    prevIdSetRef.current = new Set(notifications.map((n: any) => n.id));
  }, [notifications, unreadCount]);

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      setDetailNotif(null);
      toast.success('Notification deleted');
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: () => notificationsApi.deleteAll(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications deleted');
    },
  });

  function getNotificationIcon(type: string) {
    switch (type) {
      case 'WORKLOAD_ASSIGNED':
        return <span className="text-blue-500">●</span>;
      case 'REQUEST_SUBMITTED':
        return <span className="text-yellow-500">●</span>;
      case 'REQUEST_APPROVED':
        return <span className="text-green-500">●</span>;
      case 'REQUEST_REJECTED':
        return <span className="text-red-500">●</span>;
      case 'DEADLINE_REMINDER':
        return <span className="text-orange-500">●</span>;
      default:
        return <span className="text-gray-500">●</span>;
    }
  }

  function handleNotificationClick(n: any) {
    if (!n.isRead) markReadMutation.mutate(n.id);
    setDetailNotif(n);
    setOpen(false);
  }

  async function handleLogout() {
    try {
      await authApi.logout();
    } catch {
      // ignore
    } finally {
      clearAuth();
      navigate('/login');
      toast.success(t('loggedOut'));
    }
  }

  return (
    <>
      <header className="h-14 bg-primary-900 border-b border-primary-800 flex items-center justify-between px-3 sm:px-5 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
          {/* Language switcher */}
          <LanguageSwitcher compact dark />

          {/* Notifications */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpen((v) => !v)}
              className="relative p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-md transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {open && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markAllReadMutation.mutate()}
                        className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Mark all read
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete all notifications?')) {
                            deleteAllMutation.mutate();
                          }
                        }}
                        className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete all
                      </button>
                    )}
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-gray-400">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n: any) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${
                          n.isRead ? 'opacity-60' : 'bg-primary-50/30'
                        }`}
                      >
                        <div className="mt-0.5 flex-shrink-0">{getNotificationIcon(n.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900">{n.title}</p>
                          <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-[10px] text-gray-400 mt-1">
                            {new Date(n.createdAt).toLocaleString('en-GB', {
                              timeZone: 'Asia/Tashkent',
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        {!n.isRead && (
                          <div className="mt-1 flex-shrink-0">
                            <span className="w-2 h-2 bg-primary-500 rounded-full inline-block" />
                          </div>
                        )}
                        {n.isRead && (
                          <div className="mt-1 flex-shrink-0 text-gray-300">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Desktop logout */}
          <button
            onClick={handleLogout}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {t('logout')}
          </button>
          {/* Mobile logout */}
          <button
            onClick={handleLogout}
            className="sm:hidden p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-md transition-colors"
            aria-label={t('logout')}
          >
            <LogOut className="w-4 h-4" />
          </button>

          {/* Avatar */}
          <div className="hidden sm:flex w-8 h-8 rounded-full bg-white/20 items-center justify-center">
            <span className="text-xs font-bold text-white uppercase">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
        </div>
      </header>

      {/* ── Notification Detail Modal ── */}
      {detailNotif && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                {getNotificationIcon(detailNotif.type)}
                <h3 className="text-base font-semibold text-gray-900">{detailNotif.title}</h3>
              </div>
              <button
                onClick={() => setDetailNotif(null)}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-5 py-4 overflow-y-auto">
              <p className="text-sm text-gray-700 leading-relaxed">{detailNotif.message}</p>

              {/* Timestamp */}
              <p className="text-xs text-gray-400 mt-3">
                {new Date(detailNotif.createdAt).toLocaleString('en-GB', {
                  timeZone: 'Asia/Tashkent',
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </p>

              {/* Changes list */}
              {detailNotif.metadata?.changes && detailNotif.metadata.changes.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">What Changed</h4>
                  <div className="space-y-1.5">
                    {detailNotif.metadata.changes.map((change: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-xs bg-gray-50 rounded-md px-3 py-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0" />
                        <span className="text-gray-700">{change}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Details table */}
              {detailNotif.metadata?.details && Object.keys(detailNotif.metadata.details).length > 0 && (
                <div className="mt-4">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Change Details</h4>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold text-gray-600">Field</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-600">Old Value</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-600">New Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {Object.entries(detailNotif.metadata.details).map(([field, vals]: [string, any], idx: number) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-3 py-2 font-medium text-gray-700 capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}</td>
                            <td className="px-3 py-2 text-gray-500">{vals.old === null || vals.old === undefined ? '—' : String(vals.old)}</td>
                            <td className="px-3 py-2 text-primary-700 font-medium">{vals.new === null || vals.new === undefined ? '—' : String(vals.new)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete this notification?')) {
                    deleteMutation.mutate(detailNotif.id);
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setDetailNotif(null)}
                className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
