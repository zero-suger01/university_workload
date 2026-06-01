import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Users, AlertTriangle, Clock, FileText } from 'lucide-react';
import { dashboardApi } from '../../api/dashboard.api';
import WorkloadDistributionChart from '../../components/dashboard/WorkloadDistributionChart';

function KpiCard({
  label, value, icon: Icon, color, textColor,
}: {
  label: string; value: number;
  icon: React.ElementType; color: string; textColor: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 sm:p-4 flex items-center gap-3">
      <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${textColor}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xl sm:text-2xl font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5 truncate">{label}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { t } = useTranslation();

  const { data: summary, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: dashboardApi.summary,
    refetchInterval: 30_000,
  });

  const semesterId = summary?.activeSemester?.id;

  const { data: distribution } = useQuery({
    queryKey: ['workload-distribution', semesterId],
    queryFn: () => dashboardApi.workloadDistribution(semesterId!),
    enabled: !!semesterId,
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {summary?.activeSemester && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg px-3 py-2 text-xs sm:text-sm text-primary-700">
          {t('currentSemester')}:{' '}
          <span className="font-semibold">{summary.activeSemester.name}</span>
        </div>
      )}

      {/* KPI Cards — 2 col on mobile, 4 on lg+ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <KpiCard label={t('totalFaculty')} value={summary?.totalFaculty ?? 0} icon={Users} color="bg-primary-50" textColor="text-primary-600" />
        <KpiCard label={t('overloaded')} value={summary?.overloadedCount ?? 0} icon={AlertTriangle} color="bg-red-50" textColor="text-red-600" />
        <KpiCard label={t('underloaded')} value={summary?.underloadedCount ?? 0} icon={Clock} color="bg-amber-50" textColor="text-amber-600" />
        <KpiCard label={t('pendingRequests')} value={summary?.pendingRequests ?? 0} icon={FileText} color="bg-purple-50" textColor="text-purple-600" />
      </div>

      {/* Academic Staff Workload Distribution */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">{t('facultyWorkloadDistribution')}</h2>

        <WorkloadDistributionChart data={distribution ?? []} />
      </div>
    </div>
  );
}
