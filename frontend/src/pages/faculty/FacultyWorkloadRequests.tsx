import { useState, Fragment } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { workloadsApi } from '../../api/workloads.api';
import { requestsApi } from '../../api/requests.api';
import StatusBadge from '../../components/shared/StatusBadge';
import { PageHeader } from '../../components/shared/PageHeader';
import toast from 'react-hot-toast';
import { ClipboardList, CheckCircle, XCircle, Loader2, Clock } from 'lucide-react';

function formatDate(d: string) {
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, '0')}.${String(dt.getMonth() + 1).padStart(2, '0')}.${dt.getFullYear()}`;
}

export default function FacultyWorkloadRequests() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [tab, setTab] = useState<'pending' | 'history'>('pending');

  // All workloads assigned to this professor
  const { data: workloadsRaw, isLoading: loadingWorkloads } = useQuery({
    queryKey: ['faculty-workloads', user?.id],
    queryFn: () => workloadsApi.list({ limit: 200 }).then((r) => r.data),
    enabled: !!user?.id,
    refetchInterval: 15_000,
  });
  const workloads: any[] = workloadsRaw ?? [];
  const pending = workloads.filter(w => w.approvalStatus === 'PENDING');
  const history = workloads.filter(w => w.approvalStatus !== 'PENDING');

  // Declined requests submitted to admin/head
  const { data: requestsData } = useQuery({
    queryKey: ['faculty-workload-decline-requests', user?.id],
    queryFn: () => requestsApi.list({ type: 'WORKLOAD_DECLINED', limit: 100 }),
    enabled: !!user?.id,
  });
  const declineRequests: any[] = requestsData?.data ?? [];

  const approveMutation = useMutation({
    mutationFn: (id: string) => workloadsApi.approve(id),
    onSuccess: () => {
      toast.success('Workload accepted');
      qc.invalidateQueries({ queryKey: ['faculty-workloads'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to accept'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => workloadsApi.reject(id, reason),
    onSuccess: () => {
      toast.success('Workload declined — request sent to admin & head');
      setRejectingId(null);
      setRejectReason('');
      qc.invalidateQueries({ queryKey: ['faculty-workloads'] });
      qc.invalidateQueries({ queryKey: ['faculty-workload-decline-requests'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to decline'),
  });

  return (
    <div className="space-y-4">
      <PageHeader icon={<ClipboardList />} title="Workload Requests" />

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button onClick={() => setTab('pending')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${tab === 'pending' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          Pending Approval
          {pending.length > 0 && <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white">{pending.length}</span>}
        </button>
        <button onClick={() => setTab('history')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'history' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          History
        </button>
      </div>

      {/* ── PENDING TAB ── */}
      {tab === 'pending' && (
        <div className="card p-0 overflow-hidden">
          {loadingWorkloads ? (
            <div className="py-10 text-center text-gray-400"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
          ) : pending.length === 0 ? (
            <div className="py-10 text-center space-y-1">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto" />
              <p className="text-sm text-gray-500">No pending workloads — you're all caught up!</p>
            </div>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Course', 'Semester', 'Program', 'Lec', 'Tut', 'Lab', 'Total hrs', 'Assigned by', 'Action'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pending.map((w: any) => (
                  <Fragment key={w.id}>
                    <tr className="bg-red-50 hover:bg-red-100 transition-colors">
                      <td className="px-3 py-3">
                        <p className="font-medium text-gray-900 text-[11px]">{w.course?.courseCode}</p>
                        <p className="text-gray-500 text-[10px] truncate max-w-[140px]">{w.course?.title}</p>
                      </td>
                      <td className="px-3 py-3 text-center text-[11px] text-gray-600 whitespace-nowrap">
                        {w.semester?.name || (w.semesterNumbers || []).map((s: number) => `Sem.${s}`).join(', ') || '-'}
                      </td>
                      <td className="px-3 py-3 text-center text-[11px] text-gray-600">{w.program || '-'}</td>
                      <td className="px-3 py-3 text-center text-[11px] text-gray-700">{w.assignedLectureHours ?? w.lectureHours ?? 0}</td>
                      <td className="px-3 py-3 text-center text-[11px] text-gray-700">{w.assignedTutorialHours ?? w.seminarHours ?? 0}</td>
                      <td className="px-3 py-3 text-center text-[11px] text-gray-700">{w.assignedLabHours ?? w.labHours ?? 0}</td>
                      <td className="px-3 py-3 text-center text-[11px] font-semibold text-gray-900">{((w.assignedLectureHours ?? w.lectureHours ?? 0) + (w.assignedTutorialHours ?? w.seminarHours ?? 0) + (w.assignedLabHours ?? w.labHours ?? 0))}h</td>
                      <td className="px-3 py-3 text-center text-[11px] text-gray-600 whitespace-nowrap">
                        {w.assignedBy ? `${w.assignedBy.firstName} ${w.assignedBy.lastName}` : '-'}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => approveMutation.mutate(w.id)} disabled={approveMutation.isPending}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
                            {approveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                            Accept
                          </button>
                          <button onClick={() => { setRejectingId(w.id); setRejectReason(''); }}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                            <XCircle className="w-3 h-3" /> Decline
                          </button>
                        </div>
                      </td>
                    </tr>
                    {/* Decline reason input */}
                    {rejectingId === w.id && (
                      <tr className="bg-red-50 border-b border-red-100">
                        <td colSpan={9} className="px-4 py-3">
                          <div className="flex items-end gap-2">
                            <div className="flex-1">
                              <label className="block text-xs font-medium text-red-700 mb-1">
                                Reason for declining <span className="text-red-400">*</span>
                                <span className="text-gray-400 font-normal ml-1">— this will be sent as a request to admin & department head</span>
                              </label>
                              <textarea rows={2} value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                                placeholder="Explain why you are declining this workload…"
                                className="w-full text-sm border border-red-200 rounded-md px-3 py-1.5 outline-none focus:ring-2 focus:ring-red-300 resize-none" />
                            </div>
                            <div className="flex gap-1.5 pb-0.5">
                              <button onClick={() => rejectMutation.mutate({ id: w.id, reason: rejectReason })}
                                disabled={rejectReason.trim().length < 3 || rejectMutation.isPending}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors">
                                {rejectMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                                Confirm Decline
                              </button>
                              <button onClick={() => { setRejectingId(null); setRejectReason(''); }}
                                className="px-3 py-1.5 text-xs text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                                Cancel
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {tab === 'history' && (
        <div className="space-y-4">
          {/* Accepted / Declined workloads */}
          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Workload Responses</p>
            </div>
            {history.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-gray-400">No history yet</p>
            ) : (
              <table className="w-full text-sm border-collapse">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Course', 'Semester', 'Total hrs', 'Your Response', 'Reason'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {history.map((w: any) => (
                    <tr key={w.id} className={`${w.approvalStatus === 'REJECTED' ? 'bg-orange-50' : 'hover:bg-gray-50'} transition-colors`}>
                      <td className="px-3 py-3">
                        <p className="font-medium text-gray-900 text-[11px]">{w.course?.courseCode}</p>
                        <p className="text-gray-500 text-[10px] truncate max-w-[140px]">{w.course?.title}</p>
                      </td>
                      <td className="px-3 py-3 text-center text-[11px] text-gray-600 whitespace-nowrap">
                        {w.semester?.name || '-'}
                      </td>
                      <td className="px-3 py-3 text-center text-[11px] font-semibold text-gray-900">{w.totalHours}h</td>
                      <td className="px-3 py-3 text-center">
                        {w.approvalStatus === 'APPROVED' && (
                          <span className="flex items-center justify-center gap-1 text-[10px] font-semibold text-green-700">
                            <CheckCircle className="w-3 h-3" /> Accepted
                          </span>
                        )}
                        {w.approvalStatus === 'REJECTED' && (
                          <span className="flex items-center justify-center gap-1 text-[10px] font-semibold text-orange-700">
                            <XCircle className="w-3 h-3" /> Declined
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center text-[11px] text-gray-500 max-w-[200px]">
                        {w.rejectionReason || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Decline requests sent to admin/head */}
          {declineRequests.length > 0 && (
            <div className="card p-0 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Decline Requests — Admin/Head Review Status</p>
              </div>
              <table className="w-full text-sm border-collapse">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Workload', 'Your Reason', 'Review Status', 'Admin Notes', 'Date'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {declineRequests.map((r: any) => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-3">
                        <p className="font-medium text-gray-900 text-sm">{r.subject}</p>
                      </td>
                      <td className="px-3 py-3 max-w-[180px]">
                        <p className="text-sm text-gray-700 line-clamp-2">{r.description}</p>
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-500">
                        {r.status === 'PENDING' || r.status === 'UNDER_REVIEW' ? (
                          <span className="flex items-center gap-1 text-amber-600 text-xs"><Clock className="w-3 h-3" /> Awaiting review</span>
                        ) : (r.reviewNotes || '—')}
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-400 whitespace-nowrap">{formatDate(r.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
