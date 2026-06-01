import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, X, ClipboardList, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { requestsApi } from '../../api/requests.api';
import StatusBadge from '../../components/shared/StatusBadge';
import { PageHeader } from '../../components/shared/PageHeader';

interface Request {
  id: string;
  type: string;
  status: string;
  subject: string;
  description: string;
  reviewNotes?: string | null;
  createdAt: string;
}

function statusIcon(status: string) {
  switch (status) {
    case 'APPROVED':   return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case 'REJECTED':   return <XCircle className="w-4 h-4 text-red-500" />;
    case 'UNDER_REVIEW': return <AlertCircle className="w-4 h-4 text-primary-500" />;
    default:           return <Clock className="w-4 h-4 text-yellow-500" />;
  }
}

export default function MyRequests() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkPending, setBulkPending] = useState(false);
  const [showCheckboxes, setShowCheckboxes] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['my-requests'],
    queryFn: () => requestsApi.list().then((r) => r.data as Request[]),
  });

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const allSelected = (data?.length ?? 0) > 0 && (data ?? []).every((i) => selectedIds.has(i.id));
  function toggleSelectAll() {
    allSelected
      ? setSelectedIds(new Set())
      : setSelectedIds(new Set((data ?? []).map((i) => i.id)));
  }

  function enterSelectMode() { setShowCheckboxes(true); setSelectedIds(new Set()); }
  function cancelSelectMode() { setShowCheckboxes(false); setSelectedIds(new Set()); }

  function handleBulkDelete() {
    if (!window.confirm(`Delete ${selectedIds.size} request(s)?`)) return;
    setBulkPending(true);
    Promise.all(Array.from(selectedIds).map((id) => requestsApi.remove(id)))
      .then(() => {
        qc.invalidateQueries({ queryKey: ['my-requests'] });
        toast.success(`${selectedIds.size} request(s) deleted`);
        cancelSelectMode();
      })
      .catch(() => toast.error('Failed to delete some requests'))
      .finally(() => setBulkPending(false));
  }

  return (
    <div className="flex flex-col items-center min-h-full py-2">
      <div className="w-full max-w-2xl space-y-4">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <PageHeader
            icon={<ClipboardList />}
            title={t('myRequests') || 'My Requests'}
            subtitle="Track and manage your workload requests"
          />
          <Link
            to="/faculty/requests/new"
            className="btn-primary flex items-center gap-2 flex-shrink-0 mt-1"
          >
            <Plus className="w-4 h-4" />
            {t('newRequest') || 'New Request'}
          </Link>
        </div>

        {/* Bulk action bar */}
        {showCheckboxes && (
          <div className="flex items-center gap-3 px-3 py-2 bg-primary-50 border border-primary-200 rounded-lg">
            <span className="text-sm font-medium text-primary-700">
              {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select items to delete'}
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={handleBulkDelete}
                disabled={selectedIds.size === 0 || bulkPending}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete {selectedIds.size > 0 ? selectedIds.size : ''}
              </button>
              <button
                onClick={cancelSelectMode}
                className="flex items-center gap-1 px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700"
              >
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
            </div>
          </div>
        )}

        {showCheckboxes && !isLoading && (data?.length ?? 0) > 0 && (
          <div className="flex items-center gap-2 px-1">
            <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="rounded border-gray-300" />
            <span className="text-xs text-gray-500">Select all</span>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <div className="text-center space-y-2">
              <div className="w-6 h-6 border-2 border-gray-200 border-t-primary-500 rounded-full animate-spin mx-auto" />
              <p className="text-sm">{t('loading')}</p>
            </div>
          </div>
        ) : data?.length === 0 ? (
          /* Empty state */
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm py-16 px-8 text-center">
            <div className="w-16 h-16 bg-primary-50 border border-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-8 h-8 text-primary-400" />
            </div>
            <h3 className="text-base font-bold text-gray-800 mb-1">{t('noRequests') || 'No requests yet'}</h3>
            <p className="text-sm text-gray-400 mb-6">Submit your first workload request to get started</p>
            <Link
              to="/faculty/requests/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              {t('submitFirstRequest') || 'Submit Workload Request'}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {data?.map((r) => (
              <div
                key={r.id}
                className={`bg-white rounded-xl border shadow-sm transition-colors ${
                  showCheckboxes && selectedIds.has(r.id)
                    ? 'border-primary-200 bg-primary-50/40'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    {showCheckboxes && (
                      <div className="pt-0.5 flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(r.id)}
                          onChange={(e) => { e.stopPropagation(); toggleSelect(r.id); }}
                          className="rounded border-gray-300"
                        />
                      </div>
                    )}

                    {/* Status icon */}
                    <div className="mt-0.5 flex-shrink-0">
                      {statusIcon(r.status)}
                    </div>

                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-semibold rounded uppercase tracking-wide">
                          {r.type.replace(/_/g, ' ')}
                        </span>
                        <StatusBadge status={r.status} />
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 mt-1.5 leading-snug">{r.subject}</h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{r.description}</p>
                    </div>

                    {/* Delete button for pending */}
                    {r.status === 'PENDING' && (
                      <button
                        onClick={() => { enterSelectMode(); setSelectedIds(new Set([r.id])); }}
                        className="flex items-center justify-center w-8 h-8 rounded-lg border border-red-100 text-red-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors flex-shrink-0"
                        title="Delete request"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Review notes */}
                  {r.reviewNotes && (
                    <div className="mt-3 px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">
                        {t('reviewNotesLabel') || 'Review Notes'}
                      </p>
                      <p className="text-xs text-gray-700 leading-relaxed">{r.reviewNotes}</p>
                    </div>
                  )}

                  <p className="text-[10px] text-gray-400 mt-3">
                    {t('submitted') || 'Submitted'} · {new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
