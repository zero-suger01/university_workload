import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { cqiApi } from '../../api/cqi.api';
import { ClipboardCheck, CheckCircle, AlertCircle, Clock, Send, Eye, X } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SUBMITTED: 'bg-primary-100 text-primary-700',
  APPROVED: 'bg-green-100 text-green-700',
  REVISION_NEEDED: 'bg-orange-100 text-orange-700',
};

export default function CQIReviewPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [showRevisionInput, setShowRevisionInput] = useState(false);

  useEffect(() => {
    setShowRevisionInput(false);
    setRevisionNotes('');
  }, [selected?.id]);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['cqi', 'all', statusFilter],
    queryFn: () => cqiApi.getAll({ status: statusFilter || undefined }).then(r => r.data),
  });

  const { data: detail } = useQuery({
    queryKey: ['cqi', 'detail', selected?.id],
    queryFn: () => cqiApi.getById(selected.id).then(r => r.data),
    enabled: !!selected?.id,
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => cqiApi.approve(id, notes),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cqi'] }); setSelected(null); toast.success('CQI approved'); },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to approve report');
    },
  });

  const revisionMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) => cqiApi.requestRevision(id, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cqi'] });
      setSelected(null); setRevisionNotes(''); setShowRevisionInput(false);
      toast.success('Revision requested');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to send for revision');
    },
  });

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-4 gap-4">
        <PageHeader icon={<ClipboardCheck />} title="CQI Review" subtitle="Review and approve faculty CQI reports" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="APPROVED">Approved</option>
          <option value="REVISION_NEEDED">Revision Needed</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {['SUBMITTED', 'APPROVED', 'REVISION_NEEDED', 'DRAFT'].map(s => {
          const count = reports.filter((r: any) => r.status === s).length;
          const icons: Record<string, any> = { SUBMITTED: Send, APPROVED: CheckCircle, REVISION_NEEDED: AlertCircle, DRAFT: Clock };
          const Icon = icons[s];
          return (
            <button key={s} onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
              className={`bg-white rounded-xl border p-4 text-left hover:border-primary-300 transition-colors ${statusFilter === s ? 'border-primary-400 ring-1 ring-primary-400' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500 font-medium">{s.replace('_', ' ')}</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{count}</div>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No CQI reports found</div>
        ) : (
          <table className="w-full border-collapse border border-gray-200">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-2 py-2.5 text-center font-bold text-gray-500 uppercase text-[9px] whitespace-nowrap border-r border-gray-200">Course</th>
                <th className="px-2 py-2.5 text-center font-bold text-gray-500 uppercase text-[9px] whitespace-nowrap border-r border-gray-200">Faculty</th>
                <th className="px-2 py-2.5 text-center font-bold text-gray-500 uppercase text-[9px] whitespace-nowrap border-r border-gray-200">Semester</th>
                <th className="px-2 py-2.5 text-center font-bold text-gray-500 uppercase text-[9px] whitespace-nowrap border-r border-gray-200">Students</th>
                <th className="px-2 py-2.5 text-center font-bold text-gray-500 uppercase text-[9px] whitespace-nowrap border-r border-gray-200">Status</th>
                <th className="px-2 py-2.5 text-center font-bold text-gray-500 uppercase text-[9px] whitespace-nowrap border-r border-gray-200">Submitted</th>
                <th className="px-2 py-2.5 text-center font-bold text-gray-500 uppercase text-[9px] whitespace-nowrap border-r border-gray-200">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reports.map((r: any) => (
                <tr key={r.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">
                    <div>{r.course?.courseCode}</div>
                    <div>{r.course?.title}</div>
                  </td>
                  <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">
                    {r.faculty?.firstName} {r.faculty?.lastName}
                  </td>
                  <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">{r.semester?.name}</td>
                  <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">{r.studentCount}</td>
                  <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status] ?? STATUS_COLORS.DRAFT}`}>
                      {r.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">
                    {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-2 py-2 text-center border-r border-gray-200">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => setSelected(r)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50">
                        <Eye className="w-3 h-3" /> View
                      </button>
                      {r.status === 'SUBMITTED' && (
                        <>
                          <button
                            onClick={() => approveMutation.mutate({ id: r.id })}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                            <CheckCircle className="w-3 h-3" /> Approve
                          </button>
                          <button
                            onClick={() => { setSelected(r); setShowRevisionInput(true); }}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-100 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-200">
                            <AlertCircle className="w-3 h-3" /> Revise
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-auto py-8 px-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-bold">{detail?.course?.courseCode} — {detail?.course?.title}</h2>
                <p className="text-sm text-gray-500">{detail?.faculty?.firstName} {detail?.faculty?.lastName} · {detail?.semester?.name}</p>
              </div>
              <button onClick={() => { setSelected(null); setShowRevisionInput(false); setRevisionNotes(''); }}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div className="p-5 space-y-5 max-h-[70vh] overflow-auto">
              {/* Evaluation */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold mb-3">Evaluation Breakdown</h3>
                <div className="flex gap-6 text-sm">
                  <span>Midterm: <strong>{detail?.evalMidterm}%</strong></span>
                  <span>Final: <strong>{detail?.evalFinal}%</strong></span>
                  <span>Assignments: <strong>{detail?.evalAssignment}%</strong></span>
                </div>
              </div>

              {/* Student Survey */}
              {(detail?.surveyParticipation || detail?.surveySatisfaction) && (
                <div className="bg-primary-50 rounded-xl p-4">
                  <h3 className="font-semibold mb-3">Student Survey (Section F)</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <span>Participation: <strong>{detail.surveyParticipation} students</strong></span>
                    <span>Follows Syllabus: <strong>{detail.surveyFollowsSyllabus}%</strong></span>
                    <span>Satisfaction: <strong>{detail.surveySatisfaction}%</strong></span>
                    <span>Avg Score: <strong>{detail.surveyAvgScore}%</strong></span>
                  </div>
                </div>
              )}

              {/* Instructor Eval */}
              <div>
                <h3 className="font-semibold mb-3">Instructor Evaluation (Section E)</h3>
                {[
                  { q: 'Are the course processes appropriate?', a: detail?.evalQ1Answer },
                  { q: 'Do the course outcomes lend themselves to assessment?', a: detail?.evalQ2Answer },
                  { q: 'Is the designated workload appropriate?', a: detail?.evalQ3Answer },
                  { q: 'Recommendation for Improvement', a: detail?.evalQ4Answer },
                ].map(({ q, a }, i) => a ? (
                  <div key={i} className="mb-3">
                    <p className="text-sm font-medium text-gray-700">{q}</p>
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 mt-1">{a}</p>
                  </div>
                ) : null)}
              </div>

              {/* CLO Assessments */}
              {detail?.cloAssessments?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">CLO Assessment Plan (Section G)</h3>
                  <div className="overflow-auto">
                    <table className="w-full border-collapse border border-gray-200">
                      <thead className="bg-gray-50 border-b-2 border-gray-200">
                        <tr>
                          <th className="px-2 py-2.5 text-center font-bold text-gray-500 uppercase text-[9px] whitespace-nowrap border-r border-gray-200">CLO</th>
                          <th className="px-2 py-2.5 text-center font-bold text-gray-500 uppercase text-[9px] whitespace-nowrap border-r border-gray-200">Methods</th>
                          <th className="px-2 py-2.5 text-center font-bold text-gray-500 uppercase text-[9px] whitespace-nowrap border-r border-gray-200">Tools</th>
                          <th className="px-2 py-2.5 text-center font-bold text-gray-500 uppercase text-[9px] whitespace-nowrap border-r border-gray-200">PLOs (High)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {detail.cloAssessments.map((clo: any) => (
                          <tr key={clo.id} className="border-b border-gray-200">
                            <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">CLO{clo.cloNumber}<br /><span>{clo.description}</span></td>
                            <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">{clo.teachingMethods?.join(', ')}</td>
                            <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">{clo.assessmentTools?.join(', ')}</td>
                            <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">{clo.plosHigh?.join(', ')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Revision input */}
              {showRevisionInput && (
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Revision Notes (required)</label>
                  <textarea value={revisionNotes} onChange={e => setRevisionNotes(e.target.value)} rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Explain what needs to be revised..." />
                </div>
              )}
            </div>

            {/* Actions */}
            {selected.status === 'SUBMITTED' && (
              <div className="flex gap-3 p-5 border-t border-gray-200">
                <button
                  onClick={() => approveMutation.mutate({ id: selected.id })}
                  disabled={approveMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-60"
                >
                  <CheckCircle className="w-4 h-4" /> Approve
                </button>
                {!showRevisionInput ? (
                  <button onClick={() => setShowRevisionInput(true)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                    <AlertCircle className="w-4 h-4" /> Request Revision
                  </button>
                ) : (
                  <button
                    onClick={() => { if (revisionNotes.trim()) revisionMutation.mutate({ id: selected.id, notes: revisionNotes }); }}
                    disabled={!revisionNotes.trim() || revisionMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-60"
                  >
                    Send Revision Request
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
