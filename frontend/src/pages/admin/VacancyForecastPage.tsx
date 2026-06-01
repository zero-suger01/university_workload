import { PageHeader } from '../../components/shared/PageHeader';
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  UserPlus, TrendingDown, CheckCircle2,
  BarChart2, RefreshCw, Settings2, X, Save,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend,
} from 'recharts';
import { vacancyApi } from '../../api/vacancy.api';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';

interface DeptForecast {
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  avgWeeklyLoad: number;
  avgLoadUsed: number;
  totalRequired: number;
  totalCovered: number;
  uncoveredHours: number;
  staffNeeded: number;
  coveragePercent: number;
}

interface ForecastData {
  semester: { id: string; name: string; academicYear: string };
  summary: { totalRequired: number; totalCovered: number; totalUncovered: number; totalStaffNeeded: number };
  byDepartment: DeptForecast[];
}

interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  avgWeeklyLoad: number;
}

// ─── Department Load Settings Modal ──────────────────────────────────────────
function DeptLoadModal({
  depts,
  onClose,
}: {
  depts: Department[];
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [values, setValues] = useState<Record<string, number>>(
    Object.fromEntries(depts.map((d) => [d.id, d.avgWeeklyLoad])),
  );
  const [saving, setSaving] = useState<string | null>(null);

  async function save(id: string) {
    setSaving(id);
    try {
      await api.put(`/departments/${id}`, { avgWeeklyLoad: values[id] });
      qc.invalidateQueries({ queryKey: ['departments-all'] });
      toast.success('Load norm saved');
    } catch {
      toast.error('Failed to save load norm');
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div>
            <h2 className="font-bold text-gray-900">Department Load Norms</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Set weekly teaching hours per full-time staff. Used in vacancy forecasting.
            </p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
        </div>
        <div className="p-5 space-y-3 max-h-[70vh] overflow-auto">
          {depts.map((dept) => (
            <div key={dept.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">{dept.name}</p>
                <p className="text-xs text-gray-400">{dept.code}</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={values[dept.id]}
                  onChange={(e) => setValues((p) => ({ ...p, [dept.id]: Number(e.target.value) }))}
                  className="w-16 border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-xs text-gray-500 whitespace-nowrap">h/week</span>
                <button
                  onClick={() => save(dept.id)}
                  disabled={saving === dept.id || values[dept.id] === dept.avgWeeklyLoad}
                  className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {saving === dept.id ? '...' : <Save className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 pb-5 pt-2">
          <p className="text-xs text-gray-400">
            Formula: Staff Needed = ⌈Uncovered Hours ÷ (avgWeeklyLoad × semester weeks)⌉
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function VacancyForecastPage() {
  const [selectedSemester, setSelectedSemester] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';

  const { data: semestersData } = useQuery({
    queryKey: ['semesters'],
    queryFn: () => api.get('/semesters').then((r) => r.data.data),
  });

  // Auto-select the active semester on first load
  useEffect(() => {
    if (semestersData && !selectedSemester) {
      const active = (semestersData as Array<{ id: string; isActive?: boolean }>).find((s) => s.isActive);
      if (active) setSelectedSemester(active.id);
      else if (semestersData.length > 0) setSelectedSemester(semestersData[0].id);
    }
  }, [semestersData, selectedSemester]);

  const { data: depts } = useQuery<Department[]>({
    queryKey: ['departments-all'],
    queryFn: () => api.get('/departments').then((r) => r.data.data),
  });

  const { data: forecast, isLoading, refetch } = useQuery<ForecastData>({
    queryKey: ['vacancy-forecast', selectedSemester],
    queryFn: () => vacancyApi.forecast(selectedSemester),
    enabled: !!selectedSemester,
  });

  const chartData = forecast?.byDepartment.map((d) => ({
    name: d.departmentCode,
    fullName: d.departmentName,
    covered: Math.round(d.totalCovered),
    uncovered: Math.round(d.uncoveredHours),
    staffNeeded: d.staffNeeded,
    coverage: d.coveragePercent,
  })) ?? [];

  const coverageColor = (pct: number) =>
    pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';
  const coverageClass = (pct: number) =>
    pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-600';
  const riskLabel = (pct: number) =>
    pct < 50 ? { text: 'High', cls: 'bg-red-100 text-red-700' }
      : pct < 80 ? { text: 'Medium', cls: 'bg-yellow-100 text-yellow-700' }
        : { text: 'Low', cls: 'bg-green-100 text-green-700' };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <PageHeader icon={<UserPlus />} title="Load Stat - Forecast" />
        <div className="flex items-center gap-2">
          {isAdmin && depts && (
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              <Settings2 className="w-4 h-4" /> Load Norms
            </button>
          )}
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="w-52"
          >
            <option value="">Select Semester</option>
            {(semestersData ?? []).map((s: { id: string; name: string; academicYear: string }) => (
              <option key={s.id} value={s.id}>{s.name} — {s.academicYear}</option>
            ))}
          </select>
          {selectedSemester && (
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" /> Recalculate
            </button>
          )}
        </div>
      </div>

      {!selectedSemester ? (
        <div className="flex items-center justify-center h-64 text-gray-400">
          <div className="text-center">
            <UserPlus className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>Select a semester to calculate vacancy forecast</p>
          </div>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center h-64 text-gray-400">Calculating forecast...</div>
      ) : forecast ? (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Total Required Hours', value: Math.round(forecast.summary.totalRequired).toLocaleString(), icon: BarChart2, bg: 'bg-gray-50 border-gray-200', text: 'text-gray-900', icon_c: 'text-gray-500' },
              { label: 'Covered Hours', value: Math.round(forecast.summary.totalCovered).toLocaleString(), icon: CheckCircle2, bg: 'bg-green-50 border-green-200', text: 'text-green-700', icon_c: 'text-green-500' },
              { label: 'Uncovered Hours', value: Math.round(forecast.summary.totalUncovered).toLocaleString(), icon: TrendingDown, bg: forecast.summary.totalUncovered > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200', text: forecast.summary.totalUncovered > 0 ? 'text-red-700' : 'text-green-700', icon_c: forecast.summary.totalUncovered > 0 ? 'text-red-500' : 'text-green-500' },
              { label: 'Staff Needed', value: String(forecast.summary.totalStaffNeeded), icon: UserPlus, bg: forecast.summary.totalStaffNeeded > 0 ? 'bg-rose-50 border-rose-200' : 'bg-green-50 border-green-200', text: forecast.summary.totalStaffNeeded > 0 ? 'text-rose-700' : 'text-green-700', icon_c: forecast.summary.totalStaffNeeded > 0 ? 'text-rose-500' : 'text-green-500' },
            ].map((k) => (
              <div key={k.label} className={`rounded-xl p-4 border ${k.bg}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-500">{k.label}</p>
                  <k.icon className={`w-4 h-4 ${k.icon_c}`} />
                </div>
                <p className={`text-2xl font-bold ${k.text}`}>{k.value}</p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-800 text-sm mb-4">Hours Coverage by Department</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 0, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    formatter={(val, name) => [val, name === 'covered' ? 'Covered' : 'Uncovered']}
                    labelFormatter={(label) => chartData.find((d) => d.name === label)?.fullName ?? label}
                  />
                  <Legend formatter={(v) => v === 'covered' ? 'Covered' : 'Uncovered'} />
                  <Bar dataKey="covered" stackId="a" fill="#22c55e" />
                  <Bar dataKey="uncovered" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-800 text-sm mb-4">Coverage % by Department</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 0, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip formatter={(val) => [`${val}%`, 'Coverage']} labelFormatter={(label) => chartData.find((d) => d.name === label)?.fullName ?? label} />
                  <Bar dataKey="coverage" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={coverageColor(entry.coverage)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Per-department detail cards with progress bars */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Department-Level Forecast</h3>
              <p className="text-xs text-gray-400">
                Staff needed = ⌈Uncovered ÷ (norm h/week × weeks)⌉
              </p>
            </div>
            {forecast.byDepartment.map((dept) => {
              const risk = riskLabel(dept.coveragePercent);
              const weekCount = dept.avgLoadUsed
                ? Math.round(dept.avgLoadUsed / (dept.avgWeeklyLoad || 30))
                : 16;
              return (
                <div key={dept.departmentId} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{dept.departmentName}</span>
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{dept.departmentCode}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${risk.cls}`}>
                          {risk.text} Risk
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Load norm: <strong>{dept.avgWeeklyLoad ?? 30}h/week</strong> × {weekCount} weeks
                        = {dept.avgLoadUsed}h/staff
                      </p>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Required</p>
                        <p className="font-bold text-gray-900">{Math.round(dept.totalRequired).toLocaleString()}h</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Covered</p>
                        <p className="font-bold text-green-600">{Math.round(dept.totalCovered).toLocaleString()}h</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Uncovered</p>
                        <p className={`font-bold ${dept.uncoveredHours > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                          {Math.round(dept.uncoveredHours).toLocaleString()}h
                        </p>
                      </div>
                      {dept.staffNeeded > 0 && (
                        <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-2 text-center flex-shrink-0">
                          <p className="text-xs text-rose-500 font-medium">Staff Needed</p>
                          <p className="text-2xl font-extrabold text-rose-700">+{dept.staffNeeded}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Full-width progress bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-500">
                        Coverage: {Math.round(dept.totalCovered).toLocaleString()}h of {Math.round(dept.totalRequired).toLocaleString()}h
                      </span>
                      <span className={`font-bold ${coverageClass(dept.coveragePercent)}`}>
                        {dept.coveragePercent}%
                      </span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, dept.coveragePercent)}%`,
                          backgroundColor: coverageColor(dept.coveragePercent),
                        }}
                      />
                    </div>
                    {/* Segment labels */}
                    <div className="flex items-center gap-4 mt-1.5">
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <span className="w-2 h-2 bg-green-500 rounded-full inline-block" />
                        Covered
                      </span>
                      {dept.uncoveredHours > 0 && (
                        <span className="flex items-center gap-1 text-xs text-red-600">
                          <span className="w-2 h-2 bg-red-400 rounded-full inline-block" />
                          Uncovered ({Math.round(dept.uncoveredHours)}h)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : null}

      {showSettings && depts && (
        <DeptLoadModal depts={depts} onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
