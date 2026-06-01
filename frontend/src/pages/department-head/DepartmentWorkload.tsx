import { PageHeader } from '../../components/shared/PageHeader';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { BarChart2 } from 'lucide-react';
import { workloadsApi } from '../../api/workloads.api';
import StatusBadge from '../../components/shared/StatusBadge';
import { CustomDropdown } from '../../components/shared/CustomDropdown';
import api from '../../api/client';

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}

export default function DepartmentWorkload() {
  const { t } = useTranslation();

  const { data: semesters } = useQuery({
    queryKey: ['semesters'],
    queryFn: () => api.get('/semesters').then((r) => r.data.data),
  });

  const currentSemester = semesters?.find((s: { isCurrent: boolean }) => s.isCurrent);
  const [selectedId, setSelectedId] = useState<string>('');

  const activeSemesterId = selectedId || currentSemester?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['workloads-summary', activeSemesterId],
    queryFn: () => workloadsApi.summary(activeSemesterId!),
    enabled: !!activeSemesterId,
  });

  const { data: recentWorkloads } = useQuery({
    queryKey: ['workloads-all', activeSemesterId],
    queryFn: () => workloadsApi.list({ semesterId: activeSemesterId, limit: 100 }).then((r) => r.data),
    enabled: !!activeSemesterId,
  });

  return (
    <div className="space-y-4">
      <PageHeader icon={<BarChart2 />} title="Department Workload" />
      {/* Semester selector */}
      <div className="flex items-center gap-3">
        <CustomDropdown
          value={selectedId || currentSemester?.id || ''}
          onChange={setSelectedId}
          options={(semesters ?? []).map((s: { id: string; name: string; academicYear: string; isCurrent: boolean }) => ({
            value: s.id,
            label: `${s.name} — ${s.academicYear}${s.isCurrent ? ' ✓' : ''}`,
          }))}
          size="md"
          noCustom
          className="max-w-xs"
          placeholder={!semesters ? 'Loading…' : 'Select semester'}
          disabled={!semesters}
        />
        {!activeSemesterId && (
          <p className="text-sm text-amber-600">{t('noActiveSemester')}</p>
        )}
      </div>

      {/* Faculty summary table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[400px] border-collapse border border-gray-200">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                {[t('faculty'), t('department'), t('totalHours'), t('coursesCount'), t('status')].map((h) => (
                  <th key={h} className="px-2 py-2.5 text-center font-bold text-gray-500 uppercase text-[9px] whitespace-nowrap border-r border-gray-200">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">{t('loading')}</td></tr>
              ) : data?.map((row: {
                faculty: { id: string; firstName: string; lastName: string; department: { name: string } };
                totalHours: number;
                courseCount: number;
                isOverloaded: boolean;
                isUnderloaded: boolean;
              }) => (
                <tr key={row.faculty.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">{row.faculty.firstName} {row.faculty.lastName}</td>
                  <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">{row.faculty.department?.name}</td>
                  <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">{row.totalHours}h</td>
                  <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">{row.courseCount}</td>
                  <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">
                    <StatusBadge status={row.isOverloaded ? 'OVERLOADED' : row.isUnderloaded ? 'UNDERLOADED' : 'NORMAL'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Individual assignment records with creator info */}
      {recentWorkloads && (recentWorkloads as unknown[]).length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">{t('assignmentDetails')}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse border border-gray-200">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  {[t('faculty'), t('course'), t('totalHours'), t('assignedAt'), t('createdBy')].map((h) => (
                    <th key={h} className="px-2 py-2.5 text-center font-bold text-gray-500 uppercase text-[9px] whitespace-nowrap border-r border-gray-200">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {(recentWorkloads as Array<{
                  id: string;
                  faculty: { firstName: string; lastName: string };
                  course: { courseCode: string; title: string };
                  totalHours: number;
                  assignedAt: string;
                  assignedBy?: { firstName: string; lastName: string; role: string } | null;
                }>).map((w) => (
                  <tr key={w.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">{w.faculty.firstName} {w.faculty.lastName}</td>
                    <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">{w.course.courseCode} — {w.course.title}</td>
                    <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">{w.totalHours}h</td>
                    <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">{formatDate(w.assignedAt)}</td>
                    <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">
                      {w.assignedBy ? (
                        <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                          w.assignedBy.role === 'ADMIN'
                            ? 'bg-purple-50 text-purple-700'
                            : 'bg-blue-50 text-blue-700'
                        }`}>
                          {w.assignedBy.role === 'ADMIN' ? t('byAdmin') : t('byHead')}: {w.assignedBy.firstName[0]}. {w.assignedBy.lastName}
                        </span>
                      ) : (
                        <span>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
