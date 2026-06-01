import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface DistributionItem {
  name: string;
  totalHours: number;
  maxHours: number;
  minHours: number;
  departmentId?: string;
  gender?: string | null;
  academicPosition?: string | null;
  employmentType?: string | null;
}

interface Props {
  data: DistributionItem[];
}

type StatusFilter = 'ALL' | 'OVERLOADED' | 'UNDERLOADED' | 'NORMAL';

const ACADEMIC_POSITIONS = [
  { value: 'TEACHING_ASSISTANT', label: 'Teaching Assistant' },
  { value: 'LAB_ASSISTANT', label: 'Lab Assistant' },
  { value: 'LECTURER', label: 'Lecturer' },
  { value: 'SENIOR_LECTURER', label: 'Senior Lecturer' },
  { value: 'ASSISTANT_PROFESSOR', label: 'Assistant Professor' },
  { value: 'ASSOCIATE_PROFESSOR', label: 'Associate Professor' },
  { value: 'PROFESSOR', label: 'Professor' },
  { value: 'PROFESSOR_IN_PRACTICE', label: 'Professor in Practice' },
  { value: 'VISITING_PROFESSOR', label: 'Visiting Professor' },
  { value: 'VISITING_FULLTIME_PROFESSOR', label: 'Visiting Full-time Professor' },
  { value: 'VISITING_ASSOCIATE_PROFESSOR', label: 'Visiting Associate Professor' },
  { value: 'ADJUNCT_PROFESSOR', label: 'Adjunct Professor' },
  { value: 'HEAD_OF_DEPARTMENT', label: 'Head of Department' },
  { value: 'ASSOCIATE_DEAN', label: 'Associate Dean' },
  { value: 'ASSISTANT_DEAN', label: 'Assistant Dean' },
  { value: 'DEAN', label: 'Dean' },
  { value: 'DIRECTOR', label: 'Director' },
  { value: 'ASSOCIATE_DIRECTOR', label: 'Associate Director' },
  { value: 'POSTDOC', label: 'Postdoc' },
];

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Status' },
  { value: 'OVERLOADED', label: 'Overloaded' },
  { value: 'UNDERLOADED', label: 'Underloaded' },
  { value: 'NORMAL', label: 'Normal' },
];

const GENDER_OPTIONS = [
  { value: 'ALL', label: 'Genders' },
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
];

const EMPLOYMENT_OPTIONS = [
  { value: 'ALL', label: 'Position Types' },
  { value: 'FULL_TIME', label: 'Full Time' },
  { value: 'PART_TIME', label: 'Part Time' },
];

const STATUS_COLORS: Record<string, string> = {
  OVERLOADED: '#EF4444',
  UNDERLOADED: '#FBBF24',
  NORMAL: '#086D7A',
  EMPTY: '#9CA3AF',
};

function getItemStatus(item: DistributionItem): string {
  if (item.totalHours > item.maxHours) return 'OVERLOADED';
  if (item.totalHours > 0 && item.totalHours < item.minHours) return 'UNDERLOADED';
  if (item.totalHours === 0) return 'EMPTY';
  return 'NORMAL';
}

interface PieDatum {
  name: string;
  value: number;
  status: string;
  maxHours: number;
  minHours: number;
  fill: string;
}

function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const p: PieDatum = payload[0].payload;
    return (
      <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl">
        <p className="font-semibold text-sm mb-0.5">{p.name}</p>
        <p>
          Assigned: <span className="font-medium">{p.value}h</span>
        </p>
        <p>
          Range: <span className="font-medium">{p.minHours}–{p.maxHours}h</span>
        </p>
        <p
          className={`mt-0.5 font-medium ${
            p.status === 'OVERLOADED'
              ? 'text-red-300'
              : p.status === 'UNDERLOADED'
              ? 'text-amber-300'
              : p.status === 'EMPTY'
              ? 'text-gray-400'
              : 'text-gray-300'
          }`}
        >
          {p.status === 'OVERLOADED' && '⚠ Overloaded'}
          {p.status === 'UNDERLOADED' && '↓ Underloaded'}
          {p.status === 'EMPTY' && 'No workload assigned'}
          {p.status === 'NORMAL' && '✓ Within range'}
        </p>
      </div>
    );
  }
  return null;
}

export default function WorkloadDistributionChart({ data }: Props) {
  const [search, setSearch] = useState('');
  // Default to OVERLOADED so chart shows overloaded staff on load
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('OVERLOADED');
  const [genderFilter, setGenderFilter] = useState('ALL');
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [employmentFilter, setEmploymentFilter] = useState('ALL');

  const filtered = useMemo(() => {
    let list = [...data];

    if (statusFilter !== 'ALL') {
      list = list.filter((d) => {
        if (statusFilter === 'OVERLOADED') return d.totalHours > d.maxHours;
        if (statusFilter === 'UNDERLOADED') return d.totalHours > 0 && d.totalHours < d.minHours;
        return d.totalHours >= d.minHours && d.totalHours <= d.maxHours;
      });
    }

    if (genderFilter !== 'ALL') {
      list = list.filter((d) => d.gender === genderFilter);
    }

    if (positionFilter !== 'ALL') {
      list = list.filter((d) => d.academicPosition === positionFilter);
    }

    if (employmentFilter !== 'ALL') {
      list = list.filter((d) => d.employmentType === employmentFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((d) => d.name.toLowerCase().includes(q));
    }

    return list;
  }, [data, statusFilter, genderFilter, positionFilter, employmentFilter, search]);

  const pieData: PieDatum[] = useMemo(() => {
    return filtered.map((item) => {
      const status = getItemStatus(item);
      return {
        name: item.name,
        value: item.totalHours,
        status,
        maxHours: item.maxHours,
        minHours: item.minHours,
        fill: STATUS_COLORS[status] || STATUS_COLORS.NORMAL,
      };
    });
  }, [filtered]);

  const totalFilteredHours = useMemo(
    () => pieData.reduce((s, d) => s + d.value, 0),
    [pieData],
  );

  if (data.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
        No workload data for this semester
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Toolbar: search + filters + count */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[150px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name…"
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white w-32"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <select
          value={genderFilter}
          onChange={(e) => setGenderFilter(e.target.value)}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white w-28"
        >
          {GENDER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <select
          value={employmentFilter}
          onChange={(e) => setEmploymentFilter(e.target.value)}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white w-32"
        >
          {EMPLOYMENT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <select
          value={positionFilter}
          onChange={(e) => setPositionFilter(e.target.value)}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white w-40"
        >
          <option value="ALL">Academic Positions</option>
          {ACADEMIC_POSITIONS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>

        <span className="text-[11px] text-gray-400 whitespace-nowrap ml-auto">
          {filtered.length === data.length
            ? `${data.length} staff`
            : `${filtered.length} / ${data.length} staff`}
          {totalFilteredHours > 0 && (
            <span className="ml-1">· {totalFilteredHours}h total</span>
          )}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
          No staff match the current filters
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={110}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  labelLine={{ stroke: '#6B7280', strokeWidth: 0.5 }}
                  label={({ name, value, percent }) => {
                    // Only show label if slice is at least 5%
                    if (percent < 0.05) return '';
                    return `${name}: ${value}h (${(percent * 100).toFixed(0)}%)`;
                  }}
                >
                  {pieData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={_entry.fill} stroke="#fff" strokeWidth={1.5} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  formatter={(value: string, _entry: any) => (
                    <span className="text-xs text-gray-600">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Status color legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-xs text-gray-600">Overloaded</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="text-xs text-gray-600">Underloaded</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: STATUS_COLORS.NORMAL }}
              />
              <span className="text-xs text-gray-600">Normal</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-gray-400" />
              <span className="text-xs text-gray-600">No workload</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
