import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { BookOpen, Clock, Send } from 'lucide-react';
import { workloadsApi } from '../../api/workloads.api';
import { dashboardApi } from '../../api/dashboard.api';
import api from '../../api/client';
import StatusBadge from '../../components/shared/StatusBadge';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function FacultyDashboard() {
  const { t } = useTranslation();

  const { data: semesters } = useQuery({
    queryKey: ['semesters'],
    queryFn: () => api.get('/semesters').then((r) => r.data.data),
  });
  const current = semesters?.find((s: { isCurrent: boolean }) => s.isCurrent);

  const { data, isLoading } = useQuery({
    queryKey: ['my-workloads', current?.id],
    queryFn: () => workloadsApi.list({ semesterId: current?.id, limit: 20 }).then((r) => r.data),
    enabled: !!current?.id,
  });

  const { data: _summary } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => dashboardApi.summary(),
  });

  const allWorkloads: any[] = data ?? [];
  // Show only accepted (APPROVED) workloads on dashboard
  const workloads = allWorkloads.filter((w: any) => w.approvalStatus === 'APPROVED');
  const pendingWorkloads = allWorkloads.filter((w: any) => w.approvalStatus === 'PENDING');

  // Use assigned hours for accepted workloads
  const totalLec = workloads.reduce((s: number, w: any) => s + (w.assignedLectureHours ?? 0), 0);
  const totalTut = workloads.reduce((s: number, w: any) => s + (w.assignedTutorialHours ?? 0), 0);
  const totalLab = workloads.reduce((s: number, w: any) => s + (w.assignedLabHours ?? 0), 0);
  const totalHours = totalLec + totalTut + totalLab;

  // Most recently finished semester — shown when nothing is active so the
  // empty dashboard reads as "semester ended", not "your workload vanished"
  const lastEnded = !current
    ? semesters
        ?.filter((s: { endDate: string }) => new Date(s.endDate) < new Date())
        .sort((a: { endDate: string }, b: { endDate: string }) => +new Date(b.endDate) - +new Date(a.endDate))[0]
    : null;

  const maxHours = 36;
  const percent = Math.min(120, Math.round((totalHours / maxHours) * 100));
  const isOverloaded = totalHours > maxHours;
  const isUnderloaded = !!current && totalHours < 12;
  const gaugeColor = !current ? '#9ca3af' : isOverloaded ? '#ef4444' : isUnderloaded ? '#f59e0b' : '#10b981';

  const breakdownData = [
    { name: t('lecture'), value: totalLec },
    { name: t('seminar'), value: totalTut },
    { name: t('lab'), value: totalLab },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-4">
      {/* Semester banner */}
      {current && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg px-3 py-2 text-xs sm:text-sm text-primary-700">
          {t('currentSemester')}:{' '}
          <span className="font-semibold">{current.name}</span>
        </div>
      )}
      {semesters && !current && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg px-3 py-2 text-xs sm:text-sm text-amber-800">
          {lastEnded ? (
            <>
              <span className="font-semibold">{lastEnded.name}</span> ended on{' '}
              {new Date(lastEnded.endDate).toLocaleDateString()}. Your new workload will appear here once the next semester starts.
            </>
          ) : (
            <>No active semester yet. Your workload will appear here once a semester starts.</>
          )}
        </div>
      )}

      {/* ── Top stats — 1 col on xs, 3 col on sm+ ─────────────────────── */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { icon: BookOpen, value: workloads.length, label: 'Accepted Courses', color: 'bg-green-50', iconColor: 'text-green-600' },
          { icon: Clock, value: `${totalHours}h`, label: t('hoursPerWeek'), color: 'bg-emerald-50', iconColor: 'text-emerald-600' },
          { icon: Send, value: pendingWorkloads.length, label: 'Pending Approval', color: 'bg-amber-50', iconColor: 'text-amber-600' },
        ].map(({ icon: Icon, value, label, color, iconColor }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-2.5 sm:p-4 text-center">
            <div className={`w-7 h-7 sm:w-10 sm:h-10 rounded-lg ${color} flex items-center justify-center mx-auto mb-1.5`}>
              <Icon className={`w-3.5 h-3.5 sm:w-5 sm:h-5 ${iconColor}`} />
            </div>
            <p className="text-base sm:text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-[10px] sm:text-xs text-gray-500 leading-tight mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Charts — stacked on mobile, side-by-side on sm+ ──────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

        {/* Workload Gauge */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">{t('workloadLoad')}</h2>
          <div className="relative h-32 sm:h-40">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%" cy="100%"
                innerRadius="55%" outerRadius="85%"
                startAngle={180} endAngle={0}
                data={[{ value: percent, fill: gaugeColor }]}
              >
                <RadialBar dataKey="value" cornerRadius={4} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 leading-none">{totalHours}h</p>
              <p className="text-[10px] sm:text-xs text-gray-400">{t('ofMax', { max: maxHours })}</p>
            </div>
          </div>
          <div className="flex justify-center mt-2">
            <StatusBadge status={isOverloaded ? 'OVERLOADED' : isUnderloaded ? 'UNDERLOADED' : 'NORMAL'} />
          </div>
          <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, percent)}%`, backgroundColor: gaugeColor }}
            />
          </div>
        </div>

        {/* Activity Breakdown Pie */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">{t('activityBreakdown')}</h2>
          {breakdownData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Pie
                  data={breakdownData}
                  dataKey="value"
                  cx="50%" cy="45%"
                  innerRadius="30%" outerRadius="58%"
                >
                  {breakdownData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => [`${v}h`, '']}
                  contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
                />
                <Legend
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px' }}
                  formatter={(value) => <span style={{ color: '#6b7280' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-44 flex flex-col items-center justify-center gap-2 text-gray-400">
              <BookOpen className="w-8 h-8 opacity-30" />
              <p className="text-xs">{t('noWorkloadData')}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Accepted Workloads ───────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">Accepted Workloads</h2>
          {workloads.length > 0 && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
              ✓ {workloads.length} accepted
            </span>
          )}
        </div>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : workloads.length === 0 ? (
          <div className="py-8 text-center text-gray-400">
            <BookOpen className="w-10 h-10 opacity-25 mx-auto mb-2" />
            <p className="text-sm">No accepted workloads yet</p>
            {pendingWorkloads.length > 0 && (
              <p className="text-xs text-amber-500 mt-1">{pendingWorkloads.length} pending your approval in My Workload</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {workloads.map((w: any) => {
              const le = w.assignedLectureHours ?? 0;
              const tu = w.assignedTutorialHours ?? 0;
              const la = w.assignedLabHours ?? 0;
              const total = le + tu + la;
              return (
                <div key={w.id}
                  className="flex items-start sm:items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100 gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-bold text-green-600">✓</span>
                      <p className="text-xs sm:text-sm font-semibold text-gray-800 truncate">
                        {w.course?.courseCode}{' '}
                        <span className="font-normal text-gray-500">— {w.course?.title}</span>
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                      {le > 0 && <span className="text-[10px] text-gray-500">Le: <strong>{le}h</strong></span>}
                      {tu > 0 && <span className="text-[10px] text-gray-500">Tu: <strong>{tu}h</strong></span>}
                      {la > 0 && <span className="text-[10px] text-gray-500">La: <strong>{la}h</strong></span>}
                      {w.program && <span className="text-[10px] text-gray-400">{w.program}</span>}
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-bold text-green-700">{total}h</p>
                    <p className="text-[10px] text-gray-400">{(w.semesterNumbers ?? []).map((s: number) => `Sem.${s}`).join(', ')}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
