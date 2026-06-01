import { PageHeader } from '../../components/shared/PageHeader';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Inbox, Clock, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { requestsApi } from '../../api/requests.api';
import StatusBadge from '../../components/shared/StatusBadge';

interface Request {
  id: string;
  type: string;
  status: string;
  subject: string;
  description: string;
  submittedBy: { firstName: string; lastName: string; email: string };
  reviewedBy?: { firstName: string; lastName: string; role: string } | null;
  reviewNotes?: string | null;
  createdAt: string;
}

const STATUS_FILTERS = ['', 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'] as const;

const TYPE_LABELS: Record<string, string> = {
  ADD_COURSE: 'Add Course',
  REMOVE_COURSE: 'Remove Course',
  ADJUST_HOURS: 'Adjust Hours',
  EXTRA_ACTIVITY: 'Extra Activity',
  OVERLOAD_REQUEST: 'Overload Request',
  WORKLOAD_DECLINED: 'Workload Declined',
};

export default function RequestReview() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<Request | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [selectMode, setSelectMode] = useState(false);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  function exitSelectMode() {
    setSelectMode(false);
    setCheckedIds(new Set());
  }

  const { data, isLoading } = useQuery({
    queryKey: ['head-requests', statusFilter],
    queryFn: () =>
      requestsApi.list({ status: statusFilter || undefined }).then((r) => r.data as Request[]),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      requestsApi.approve(id, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['head-requests'] });
      qc.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setSelected(null);
      toast.success(t('requestApproved'));
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to approve request');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      requestsApi.reject(id, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['head-requests'] });
      qc.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setSelected(null);
      toast.success(t('requestRejected'));
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to reject request');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => requestsApi.bulkRemove(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['head-requests'] });
      exitSelectMode();
      toast.success('Requests deleted');
    },
    onError: () => toast.error('Failed to delete requests'),
  });

  const requests = data ?? [];
  const allChecked = requests.length > 0 && checkedIds.size === requests.length;

  function toggleAll() {
    if (allChecked) setCheckedIds(new Set());
    else setCheckedIds(new Set(requests.map((r) => r.id)));
  }

  function toggleOne(id: string) {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleBulkDelete() {
    const ids = [...checkedIds];
    if (!window.confirm(`Delete ${ids.length} selected request(s)?`)) return;
    bulkDeleteMutation.mutate(ids);
  }

  const pending = requests.filter((r) => r.status === 'PENDING').length;
  const underReview = requests.filter((r) => r.status === 'UNDER_REVIEW').length;
  const approved = requests.filter((r) => r.status === 'APPROVED').length;
  const rejected = requests.filter((r) => r.status === 'REJECTED').length;

  return (
    <div className="space-y-4">
      <PageHeader icon={<Inbox />} title="Request Review" />
      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Pending', value: pending, icon: Clock, bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
          { label: 'Under Review', value: underReview, icon: Inbox, bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
          { label: 'Approved', value: approved, icon: CheckCircle2, bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
          { label: 'Rejected', value: rejected, icon: XCircle, bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
        ].map(({ label, value, icon: Icon, bg, text, border }) => (
          <div key={label} className={`rounded-xl border ${border} ${bg} p-4 flex items-center gap-3`}>
            <Icon className={`w-5 h-5 flex-shrink-0 ${text}`} />
            <div>
              <p className={`text-2xl font-bold leading-none ${text}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Status filter pills + bulk delete */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-2 overflow-x-auto pb-1 flex-1">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); exitSelectMode(); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                statusFilter === s
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s ? t(s) : t('all')}
            </button>
          ))}
        </div>
        {selectMode && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{checkedIds.size} selected</span>
            <button
              onClick={exitSelectMode}
              className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending || checkedIds.size === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-60 transition-colors whitespace-nowrap"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete{checkedIds.size > 0 ? ` ${checkedIds.size}` : ''}
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse border border-gray-200">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                {selectMode && (
                  <th className="px-2 py-2.5 text-center border-r border-gray-200">
                    <input type="checkbox" checked={allChecked} onChange={toggleAll} className="rounded" />
                  </th>
                )}
                {[t('academicStaff'), t('type'), t('subject'), t('status'), t('date'), t('actions')].map((h) => (
                  <th key={h} className="px-2 py-2.5 text-center font-bold text-gray-500 uppercase text-[9px] whitespace-nowrap border-r border-gray-200">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={selectMode ? 7 : 6} className="px-4 py-8 text-center text-gray-400">{t('loading')}</td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={selectMode ? 7 : 6} className="px-4 py-12 text-center text-gray-400">
                    <Inbox className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>No requests found</p>
                  </td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id} className={`border-b border-gray-200 hover:bg-gray-50 ${checkedIds.has(r.id) ? 'bg-red-50' : ''}`}>
                    {selectMode && (
                      <td className="px-2 py-2 text-center border-r border-gray-200">
                        <input type="checkbox" checked={checkedIds.has(r.id)} onChange={() => toggleOne(r.id)} className="rounded" />
                      </td>
                    )}
                    <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">
                      {r.submittedBy.firstName} {r.submittedBy.lastName}
                    </td>
                    <td className="px-2 py-2 text-center text-[11px] whitespace-nowrap border-r border-gray-200">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${r.type === 'WORKLOAD_DECLINED' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                        {TYPE_LABELS[r.type] ?? r.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200 max-w-[200px] truncate" title={r.subject}>
                      {r.subject}
                    </td>
                    <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">
                      <StatusBadge status={r.status} />
                      {(r.status === 'APPROVED' || r.status === 'REJECTED') && r.reviewedBy && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          by {r.reviewedBy.role === 'ADMIN' ? 'Admin' : 'Head'}
                        </p>
                      )}
                    </td>
                    <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-2 py-2 text-center border-r border-gray-200">
                      <div className="flex items-center justify-center gap-2">
                        {(r.status === 'PENDING' || r.status === 'UNDER_REVIEW') ? (
                          <button
                            onClick={() => { setSelected(r); setReviewNote(''); }}
                            className="text-xs text-primary-600 hover:underline font-medium whitespace-nowrap"
                          >
                            {t('review')}
                          </button>
                        ) : r.reviewNotes ? (
                          <span className="text-xs text-gray-400 italic truncate max-w-[120px] block" title={r.reviewNotes}>
                            {r.reviewNotes}
                          </span>
                        ) : null}
                        <button
                          onClick={() => { setSelectMode(true); setCheckedIds(new Set([r.id])); }}
                          title="Delete"
                          className="flex items-center justify-center w-6 h-6 rounded border border-red-200 text-red-500 bg-red-50 hover:bg-red-100 transition-colors flex-shrink-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5 sm:p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900">{t('reviewRequest')}</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  From: {selected.submittedBy.firstName} {selected.submittedBy.lastName}
                  {' · '}{TYPE_LABELS[selected.type] ?? selected.type}
                </p>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            <p className="text-sm font-medium text-gray-800 mb-2">{selected.subject}</p>
            <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto mb-4 leading-relaxed">
              {selected.description}
            </p>

            <label className="block text-xs font-medium text-gray-600 mb-1">
              {t('reviewNotes')} *
            </label>
            <textarea
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none mb-4"
              rows={3}
              placeholder={t('addNotes')}
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
            />

            <div className="flex gap-2">
              <button
                disabled={!reviewNote || approveMutation.isPending}
                onClick={() => approveMutation.mutate({ id: selected.id, notes: reviewNote })}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                {approveMutation.isPending ? 'Approving...' : t('approve')}
              </button>
              <button
                disabled={!reviewNote || rejectMutation.isPending}
                onClick={() => rejectMutation.mutate({ id: selected.id, notes: reviewNote })}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                {rejectMutation.isPending ? 'Rejecting...' : t('reject')}
              </button>
              <button
                onClick={() => setSelected(null)}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
