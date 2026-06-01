import { useState, Fragment } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { workloadsApi } from '../../api/workloads.api';
import StatusBadge from '../../components/shared/StatusBadge';
import { PageHeader } from '../../components/shared/PageHeader';
import api from '../../api/client';
import toast from 'react-hot-toast';
import { Eye, Loader2, CheckCircle, XCircle } from 'lucide-react';

const COURSE_TYPE_LABEL: Record<string, string> = { optional: 'Optional', Requires: 'Required', Both: 'Both' };

export default function MyWorkload() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);

  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set());
  const toggleCol = (k: string) => setHiddenCols(prev => { const s = new Set(prev); s.has(k) ? s.delete(k) : s.add(k); return s; });
  const col = (k: string) => !hiddenCols.has(k);

  // Decline reason state: { id: workloadId, reason: string }
  const [declining, setDeclining] = useState<{ id: string; reason: string } | null>(null);

  const COL_LABELS: Record<string, string> = {
    lang: 'Language', semester: 'Semester', program: 'Program',
    courseCode: 'Course Code', courseTitle: 'Course Title', courseType: 'Course Type',
    courseDuration: 'Duration', courseECTS: 'Course ECTS', resDept: 'Resp. Dept',
    students: 'Students', cohorts: 'Cohorts', smallGroups: 'Small Groups',
    totalSmallGroups: 'Total Groups', jointGroups: 'Joint Groups',
    lectureHours: 'Lec Hrs', tutorialHours: 'Tut Hrs', labHours: 'Lab Hrs',
    totalCovered: 'Covered',
    status: 'Status', approval: 'Approval',
  };

  const { data: semesters } = useQuery({
    queryKey: ['semesters'],
    queryFn: () => api.get('/semesters').then((r) => r.data.data),
  });

  const qc = useQueryClient();

  const { data: workloadsRaw, isLoading } = useQuery({
    queryKey: ['faculty-workloads', user?.id],
    queryFn: () => workloadsApi.list({ limit: 200 }).then((r) => r.data),
    enabled: !!user?.id,
    refetchInterval: 15_000,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/workloads/${id}/approve`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['faculty-workloads'] }); toast.success('Workload accepted'); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to accept'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.patch(`/workloads/${id}/reject`, { reason: reason.trim() || 'Declined by faculty' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['faculty-workloads'] });
      setDeclining(null);
      toast.success('Workload declined');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to decline'),
  });

  // Only show non-rejected workloads (declined ones are removed from view)
  const workloadsRawList: any[] = workloadsRaw ?? [];
  const workloads = workloadsRawList.filter(w => w.approvalStatus !== 'REJECTED');
  const currentSemester = semesters?.find((s: any) => s.isCurrent);

  const TH = ({ k, vertical = true, children }: { k: string; vertical?: boolean; children: React.ReactNode }) =>
    col(k) ? (
      <th
        title="Click to hide"
        onClick={() => toggleCol(k)}
        className={`px-1 py-3 text-center font-bold text-gray-500 uppercase text-[9px] whitespace-nowrap cursor-pointer hover:bg-red-50 hover:text-red-400 select-none transition-colors${vertical ? ' h-40 [writing-mode:vertical-rl] [transform:rotate(180deg)]' : ''}`}
      >{children}</th>
    ) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <PageHeader icon={<Eye />} title={t('myWorkload')} />
        {currentSemester && (
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {currentSemester.name} — {currentSemester.academicYear}
          </span>
        )}
      </div>


      {hiddenCols.size > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs">
          <span className="text-amber-700 font-medium shrink-0">Hidden:</span>
          {[...hiddenCols].map(k => (
            <button key={k} onClick={() => toggleCol(k)} className="px-2 py-0.5 bg-white border border-amber-300 text-amber-700 rounded hover:bg-amber-100 transition-colors">
              + {COL_LABELS[k] ?? k}
            </button>
          ))}
          <button onClick={() => setHiddenCols(new Set())} className="ml-auto text-amber-500 hover:text-amber-700 underline">Show all</button>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1400px] border-collapse border border-gray-200">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="divide-x divide-gray-200">
                <TH k="lang">Language</TH>
                <TH k="semester">Semester</TH>
                <TH k="program">Program</TH>
                <TH k="courseCode">Course Code</TH>
                <TH k="courseTitle">Course Title</TH>
                <TH k="courseType">Course Type</TH>
                <TH k="courseDuration">Duration (wks)</TH>
                <TH k="courseECTS">Course ECTS</TH>
                <TH k="resDept">Responsible Dept</TH>
                <TH k="students">Students</TH>
                <TH k="cohorts">Cohorts</TH>
                <TH k="smallGroups">Small Groups</TH>
                <TH k="totalSmallGroups">Total Small Groups</TH>
                <TH k="jointGroups">Joint Groups</TH>
                <TH k="lectureHours">Lecture hrs</TH>
                <TH k="tutorialHours">Tutorial hrs</TH>
                <TH k="labHours">Lab hrs</TH>
                <TH k="totalCovered">Total Covered</TH>
                <TH k="status">Status</TH>
                {col('approval') && (
                  <th onClick={() => toggleCol('approval')} title="Click to hide"
                    className="px-3 py-3 text-center font-bold text-gray-500 uppercase text-[9px] whitespace-nowrap sticky right-0 bg-gray-50 border-l border-gray-200 cursor-pointer hover:bg-red-50 hover:text-red-400 select-none transition-colors">
                    Approval
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={22} className="px-4 py-10 text-center text-gray-400"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></td></tr>
              ) : workloads.length === 0 ? (
                <tr><td colSpan={22} className="px-4 py-10 text-center text-gray-400">No workloads assigned yet</td></tr>
              ) : workloads.map((w: any) => (
                <Fragment key={w.id}>
                  <tr className={`divide-x divide-gray-200 border-b border-gray-200 ${
                    w.approvalStatus === 'PENDING' ? 'bg-red-50' : 'hover:bg-gray-50'
                  }`}>
                    {col('lang') && <td className="px-2 py-2.5 text-center text-[11px] text-gray-700">{w.teachingLanguage?.replace('_', '-') || '-'}</td>}
                    {col('semester') && <td className="px-2 py-2.5 text-center text-[11px] text-gray-600 whitespace-nowrap">{(w.semesterNumbers || []).map((s: number) => `Sem.${s}`).join(', ') || '-'}</td>}
                    {col('program') && <td className="px-2 py-2.5 text-center text-[11px] text-gray-700">{w.program || '-'}</td>}
                    {col('courseCode') && <td className="px-2 py-2.5 text-center text-[11px] font-mono text-gray-700 whitespace-nowrap">{w.course?.courseCode || '-'}</td>}
                    {col('courseTitle') && <td className="px-2 py-2.5 text-center text-[11px] text-gray-700 max-w-[180px] truncate">{w.course?.title || '-'}</td>}
                    {col('courseType') && <td className="px-2 py-2.5 text-center text-[11px] text-gray-700">{COURSE_TYPE_LABEL[w.courseType || ''] || '-'}</td>}
                    {col('courseDuration') && <td className="px-2 py-2.5 text-center text-[11px] text-gray-700">{w.weekCount ? `${w.weekCount}w` : '-'}</td>}
                    {col('courseECTS') && <td className="px-2 py-2.5 text-center text-[11px] text-gray-700">{w.courseECTS || '-'}</td>}
                    {col('resDept') && <td className="px-2 py-2.5 text-center text-[11px] text-gray-700 whitespace-nowrap">{w.responsibleDepartment || '-'}</td>}
                    {col('students') && <td className="px-2 py-2.5 text-center text-[11px] text-gray-700">{w.studentCount ?? '-'}</td>}
                    {col('cohorts') && <td className="px-2 py-2.5 text-center text-[11px] text-gray-700">{w.lectureGroup ?? '-'}</td>}
                    {col('smallGroups') && <td className="px-2 py-2.5 text-center text-[11px] text-gray-700">{w.tutorialGroup ?? '-'}</td>}
                    {col('totalSmallGroups') && <td className="px-2 py-2.5 text-center text-[11px] text-gray-700">{w.totalSmallGroup ?? '-'}</td>}
                    {col('jointGroups') && <td className="px-2 py-2.5 text-center text-[11px] text-gray-700">{(w.groupCodes ?? []).join(', ') || '-'}</td>}
                    {col('lectureHours') && <td className="px-2 py-2.5 text-center text-[11px] text-gray-700">{w.assignedLectureHours ?? w.lectureHours ?? 0}</td>}
                    {col('tutorialHours') && <td className="px-2 py-2.5 text-center text-[11px] text-gray-700">{w.assignedTutorialHours ?? w.seminarHours ?? 0}</td>}
                    {col('labHours') && <td className="px-2 py-2.5 text-center text-[11px] text-gray-700">{w.assignedLabHours ?? w.labHours ?? 0}</td>}
                    {col('totalCovered') && <td className="px-2 py-2.5 text-center text-[11px] text-gray-700">{(w.totalCoveredLectureHours ?? 0) + (w.totalCoveredTutorialHours ?? 0) + (w.totalCoveredLabHours ?? 0)}</td>}
                    {col('status') && <td className="px-2 py-2.5 text-center whitespace-nowrap"><StatusBadge status={w.isOverloaded ? 'OVERLOADED' : w.isUnderloaded ? 'UNDERLOADED' : 'NORMAL'} /></td>}
                    {col('approval') && (
                      <td className={`px-2 py-2.5 text-center whitespace-nowrap sticky right-0 border-l border-gray-200 ${w.approvalStatus === 'PENDING' ? 'bg-red-50' : 'bg-white'}`}>
                        {w.approvalStatus === 'PENDING' && (
                          declining?.id === w.id ? (
                            // Inline reason input
                            <div className="flex flex-col gap-1.5 min-w-[220px]">
                              <textarea
                                autoFocus
                                rows={2}
                                value={declining?.reason ?? ''}
                                onChange={e => setDeclining(d => d ? { ...d, reason: e.target.value } : d)}
                                placeholder="Reason for declining…"
                                className="w-full border border-red-300 rounded-md px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-red-400 resize-none"
                              />
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => rejectMutation.mutate({ id: w.id, reason: declining?.reason ?? '' })}
                                  disabled={rejectMutation.isPending}
                                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded-md bg-red-600 text-white text-[10px] font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
                                >
                                  {rejectMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                                  Send & Decline
                                </button>
                                <button
                                  onClick={() => setDeclining(null)}
                                  className="px-2 py-1 rounded-md border border-gray-300 text-[10px] text-gray-600 hover:bg-gray-50 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => approveMutation.mutate(w.id)}
                                disabled={approveMutation.isPending}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-600 text-white text-[10px] font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
                              >
                                {approveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                                Accept
                              </button>
                              <button
                                onClick={() => setDeclining({ id: w.id, reason: '' })}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600 text-white text-[10px] font-semibold hover:bg-red-700 transition-colors"
                              >
                                <XCircle className="w-3 h-3" />
                                Decline
                              </button>
                            </div>
                          )
                        )}
                        {w.approvalStatus === 'APPROVED' && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">✓ Accepted</span>}
                      </td>
                    )}
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
