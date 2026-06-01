import { PageHeader } from '../../components/shared/PageHeader';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Trash2 , Inbox} from 'lucide-react';
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

const STATUS_FILTERS = ['', 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'];

const TYPE_LABELS: Record<string, string> = {
  ADD_COURSE: 'Add Course',
  REMOVE_COURSE: 'Remove Course',
  ADJUST_HOURS: 'Adjust Hours',
  EXTRA_ACTIVITY: 'Extra Activity',
  OVERLOAD_REQUEST: 'Overload Request',
  WORKLOAD_DECLINED: 'Workload Declined',
};

export default function RequestsOverview() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [selected, setSelected] = useState<Request | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  function exitSelectMode() {
    setSelectMode(false);
    setCheckedIds(new Set());
  }

  const { data, isLoading } = useQuery({
    queryKey: ['requests', statusFilter],
    queryFn: () =>
      requestsApi.list({ status: statusFilter || undefined }).then((r) => r.data as Request[]),
  });

  const rows: Request[] = data ?? [];
  const allChecked = rows.length > 0 && checkedIds.size === rows.length;

  function toggleAll() {
    if (allChecked) {
      setCheckedIds(new Set());
    } else {
      setCheckedIds(new Set(rows.map((r) => r.id)));
    }
  }

  function toggleOne(id: string) {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const approveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) => requestsApi.approve(id, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['requests'] });
      setSelected(null);
      toast.success(t('requestApproved'));
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to approve request');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) => requestsApi.reject(id, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['requests'] });
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
      qc.invalidateQueries({ queryKey: ['requests'] });
      exitSelectMode();
      toast.success('Requests deleted');
    },
    onError: () => toast.error('Failed to delete requests'),
  });

  function handleBulkDelete() {
    const ids = [...checkedIds];
    if (!window.confirm(`Delete ${ids.length} selected request(s)?`)) return;
    bulkDeleteMutation.mutate(ids);
  }

  return (
    <div className="space-y-4">
      <PageHeader icon={<Inbox />} title="Requests Overview" />
      {/* Status filters + select/delete toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-2 overflow-x-auto pb-1 flex-1">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); exitSelectMode(); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                statusFilter === s ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s ? t(s) : t('all')}
            </button>
          ))}
        </div>
        {!selectMode ? (
          <button
            onClick={() => setSelectMode(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors whitespace-nowrap"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        ) : (
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

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse border border-gray-200">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                {selectMode && (
                  <th className="px-2 py-2.5 text-center border-r border-gray-200">
                    <input type="checkbox" checked={allChecked} onChange={toggleAll} className="rounded" />
                  </th>
                )}
                {[t('faculty'), t('type'), t('subject'), t('status'), t('date'), t('actions')].map((h) => (
                  <th key={h} className="px-2 py-2.5 text-center font-bold text-gray-500 uppercase text-[9px] whitespace-nowrap border-r border-gray-200">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={selectMode ? 7 : 6} className="px-4 py-8 text-center text-gray-400">{t('loading')}</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={selectMode ? 7 : 6} className="px-4 py-8 text-center text-gray-400">No requests found</td></tr>
              ) : rows.map((r) => (
                <tr key={r.id} className={`border-b border-gray-200 hover:bg-gray-50 ${checkedIds.has(r.id) ? 'bg-red-50' : ''}`}>
                  {selectMode && (
                    <td className="px-2 py-2 text-center border-r border-gray-200">
                      <input type="checkbox" checked={checkedIds.has(r.id)} onChange={() => toggleOne(r.id)} className="rounded" />
                    </td>
                  )}
                  <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">{r.submittedBy.firstName} {r.submittedBy.lastName}</td>
                  <td className="px-2 py-2 text-center text-[11px] whitespace-nowrap border-r border-gray-200">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${r.type === 'WORKLOAD_DECLINED' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                      {TYPE_LABELS[r.type] ?? r.type.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200 max-w-[180px] truncate">{r.subject}</td>
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
                    {(r.status === 'PENDING' || r.status === 'UNDER_REVIEW') && (
                      <button
                        onClick={() => { setSelected(r); setReviewNote(''); }}
                        className="text-xs text-primary-600 hover:underline whitespace-nowrap"
                      >
                        {t('review')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold mb-1">{t('reviewRequest')}</h2>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${selected.type === 'WORKLOAD_DECLINED' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                {TYPE_LABELS[selected.type] ?? selected.type.replace(/_/g, ' ')}
              </span>
              <span className="text-sm text-gray-500">{selected.subject}</span>
            </div>
            {(selected as any).workload?.course && (
              <p className="text-xs text-gray-500 mb-2 bg-blue-50 px-3 py-1.5 rounded border border-blue-100">
                Course: <strong>{(selected as any).workload.course.courseCode}</strong> — {(selected as any).workload.course.title}
              </p>
            )}
            <p className="text-sm font-medium text-gray-600 mb-1">Professor's reason:</p>
            <p className="text-sm text-gray-700 mb-4 bg-gray-50 rounded p-3 max-h-32 overflow-y-auto">{selected.description}</p>
            <label className="label">{t('reviewNotes')} *</label>
            <textarea
              className="input mb-4"
              rows={3}
              placeholder={t('addNotes')}
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
            />
            <div className="flex gap-2 sm:gap-3 flex-wrap">
              <button
                disabled={!reviewNote}
                onClick={() => approveMutation.mutate({ id: selected.id, notes: reviewNote })}
                className="btn-primary flex-1 min-w-[80px]"
              >
                {t('approve')}
              </button>
              <button
                disabled={!reviewNote}
                onClick={() => rejectMutation.mutate({ id: selected.id, notes: reviewNote })}
                className="btn-danger flex-1 min-w-[80px]"
              >
                {t('reject')}
              </button>
              <button onClick={() => setSelected(null)} className="btn-secondary">
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
