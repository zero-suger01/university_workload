import { PageHeader } from '../../components/shared/PageHeader';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Plus, Search, Pencil, UserX, UserCheck, Trash2, AlertTriangle, X, SlidersHorizontal, CheckCircle, PowerOff , Users} from 'lucide-react';
import api from '../../api/client';


import AddFacultyModal from '../../components/admin/AddFacultyModal';
import EditFacultyModal from '../../components/admin/EditFacultyModal';
import { useAuthStore } from '../../store/authStore';


const ACADEMIC_POSITIONS = [
  { value: 'DEAN', label: 'Dean' },
  { value: 'DIRECTOR', label: 'Director' },
  { value: 'ASSOCIATE_DIRECTOR', label: 'Associate Director' },
  { value: 'HEAD_OF_DEPARTMENT', label: 'Head of Department' },
  { value: 'ASSOCIATE_DEAN', label: 'Associate Dean' },
  { value: 'ASSISTANT_DEAN', label: 'Assistant Dean' },
  { value: 'PROFESSOR', label: 'Professor' },
  { value: 'ASSOCIATE_PROFESSOR', label: 'Associate Professor' },
  { value: 'ASSISTANT_PROFESSOR', label: 'Assistant Professor' },
  { value: 'PROFESSOR_IN_PRACTICE', label: 'Professor in Practice' },
  { value: 'VISITING_FULLTIME_PROFESSOR', label: 'Visiting Full-time Professor' },
  { value: 'VISITING_ASSOCIATE_PROFESSOR', label: 'Visiting Associate Professor' },
  { value: 'VISITING_PROFESSOR', label: 'Visiting Professor' },
  { value: 'ADJUNCT_PROFESSOR', label: 'Adjunct Professor' },
  { value: 'SENIOR_LECTURER', label: 'Senior Lecturer' },
  { value: 'LECTURER', label: 'Lecturer' },
  { value: 'TEACHING_ASSISTANT', label: 'Teaching Assistant' },
  { value: 'LAB_ASSISTANT', label: 'Lab Assistant' },
  { value: 'POSTDOC', label: 'Postdoc' },
];

interface Faculty {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  maxWeeklyHours: number;
  minWeeklyHours?: number;
  academicPosition?: string | null;
  gender?: string | null;
  employmentType?: string | null;
  programId?: string | null;
  program?: { id: string; name: string; code?: string; departmentId?: string } | null;
  department: { id: string; name: string; code: string };
  facultyDepartment?: string | null;
}

interface RelatedCounts {
  workloadRecords: number;
  workloadAssignments: number;
  submittedRequests: number;
  generatedReports: number;
  cqiReports: number;
}

function ForceDeleteModal({
  faculty,
  counts,
  onConfirm,
  onCancel,
  isPending,
}: {
  faculty: Faculty;
  counts: RelatedCounts;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const total = counts.workloadRecords + counts.workloadAssignments +
    counts.submittedRequests + counts.generatedReports + counts.cqiReports;

  const rows = [
    { label: 'Workload records', value: counts.workloadRecords },
    { label: 'Workload assignments', value: counts.workloadAssignments },
    { label: 'Submitted requests', value: counts.submittedRequests },
    { label: 'Generated reports', value: counts.generatedReports },
    { label: 'CQI reports', value: counts.cqiReports },
  ].filter((r) => r.value > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            <h2 className="font-semibold text-base">Cannot delete directly</h2>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">{faculty.firstName} {faculty.lastName}</span> has{' '}
            <span className="font-semibold text-red-600">{total} attached record{total !== 1 ? 's' : ''}</span>{' '}
            that would be permanently erased:
          </p>

          <ul className="bg-red-50 border border-red-100 rounded-lg px-4 py-3 space-y-1">
            {rows.map((r) => (
              <li key={r.label} className="flex justify-between text-sm">
                <span className="text-gray-600">{r.label}</span>
                <span className="font-semibold text-red-700">{r.value}</span>
              </li>
            ))}
          </ul>

          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-800">
            <strong>Real-world advice:</strong> Use <em>Deactivate</em> (the amber icon) instead — the user
            cannot log in but all historical data and reports are preserved. Only force-delete
            test accounts or clearly wrong entries.
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-5 py-4 border-t border-gray-100">
          <button
            onClick={onCancel}
            className="flex-1 btn-secondary"
          >
            Cancel — keep data
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {isPending ? 'Deleting…' : 'Force delete everything'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FacultyManagement() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const currentUser = useAuthStore(s => s.user);
  const isHead = currentUser?.role === 'DEPARTMENT_HEAD';
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterPosition, setFilterPosition] = useState('');
  const [filterEmploymentType, setFilterEmploymentType] = useState('');
  const [availableDepts, setAvailableDepts] = useState<string[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editFaculty, setEditFaculty] = useState<Faculty | null>(null);
  const [forceDeleteTarget, setForceDeleteTarget] = useState<{ faculty: Faculty; counts: RelatedCounts } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkPending, setBulkPending] = useState(false);
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [checkboxAction, setCheckboxAction] = useState<'delete' | 'deactivate' | 'activate' | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: allData, isLoading, isFetching } = useQuery({
    queryKey: ['users', debouncedSearch],
    queryFn: () =>
      api.get('/users', { params: { search: debouncedSearch, limit: 200 } }).then((r) => r.data.data as Faculty[]),
  });

  const hasFilters = filterGender || filterDepartment || filterPosition || filterEmploymentType;

  function clearFilters() {
    setFilterGender('');
    setFilterDepartment('');
    setFilterPosition('');
    setFilterEmploymentType('');
  }

  // Client-side filtering
  const data = (allData ?? []).filter((u) => {
    if (filterGender && u.gender !== filterGender) return false;
    if (filterDepartment && u.facultyDepartment !== filterDepartment) return false;
    if (filterPosition && u.academicPosition !== filterPosition) return false;
    if (filterEmploymentType && u.employmentType !== filterEmploymentType) return false;
    return true;
  });

  // Unique faculty departments from loaded data
  const departmentOptions = ([...new Set(
    (allData ?? []).map((u) => u.facultyDepartment).filter(Boolean)
  )] as string[]).sort();

  useEffect(() => {
    setAvailableDepts((prev) => {
      const newDepts = departmentOptions.filter((d) => !prev.includes(d));
      if (newDepts.length > 0) {
        return [...prev, ...newDepts].sort();
      }
      return prev;
    });
  }, [departmentOptions]);

  const deleteFaculty = useMutation({
    mutationFn: ({ id, force }: { id: string; force: boolean }) =>
      api.delete(`/users/${id}`, { params: { force } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setForceDeleteTarget(null);
      toast.success('Faculty member deleted');
    },
    onError: async (err: any) => {
      // 409 = has related records → fetch counts and show force-delete modal
      if (err.response?.status === 409) {
        const id = err.config.url.split('/').pop()?.split('?')[0];
        if (!id) return;
        try {
          const { data } = await api.get(`/users/${id}/related-counts`);
          const faculty = (qc.getQueryData(['users', search]) as Faculty[] | undefined)
            ?.find((u) => u.id === id);
          if (faculty) setForceDeleteTarget({ faculty, counts: data.data });
        } catch {
          toast.error('Failed to fetch related data counts');
        }
      } else {
        toast.error(err.response?.data?.message || 'Failed to delete faculty member');
      }
    },
  });

  function toggleSelect(id: string) {
    setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }
  const allSelected = data.length > 0 && data.every((i) => selectedIds.has(i.id));
  function toggleSelectAll() { allSelected ? setSelectedIds(new Set()) : setSelectedIds(new Set(data.map((i) => i.id))); }

  function enterSelectMode(action: 'delete' | 'deactivate' | 'activate') {
    setCheckboxAction(action);
    setShowCheckboxes(true);
    setSelectedIds(new Set());
  }
  function cancelSelectMode() {
    setShowCheckboxes(false);
    setCheckboxAction(null);
    setSelectedIds(new Set());
  }

  function handleBulkToggleActive(isActive: boolean) {
    setBulkPending(true);
    Promise.all(Array.from(selectedIds).map((id) => api.put(`/users/${id}`, { isActive })))
      .then(() => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success(`${selectedIds.size} staff ${isActive ? 'activated' : 'deactivated'}`); cancelSelectMode(); })
      .catch((err: any) => toast.error(err.response?.data?.message || 'Failed'))
      .finally(() => setBulkPending(false));
  }
  function handleBulkDelete() {
    if (!window.confirm(`Delete ${selectedIds.size} staff member(s)? This cannot be undone.`)) return;
    setBulkPending(true);
    // Try non-force delete first; if any has related records, the API returns 409
    Promise.all(Array.from(selectedIds).map((id) => api.delete(`/users/${id}`)))
      .then(() => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success(`${selectedIds.size} staff deleted`); cancelSelectMode(); })
      .catch((err: any) => {
        if (err.response?.status === 409) {
          toast.error('Some staff members have related records (workloads, requests, etc.). Please delete them individually to review dependencies.');
        } else {
          toast.error(err.response?.data?.message || 'Failed to delete');
        }
      })
      .finally(() => setBulkPending(false));
  }

  return (
    <div className="space-y-3">
      <PageHeader icon={<Users />} title="Academic Staff" />
      {/* Search + filters + add button */}
      <div className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 space-y-2">
        {/* Row 1: search + add */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder={t('searchFaculty')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {!isHead && (
          <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2 flex-shrink-0">
            <Plus className="w-4 h-4" /> {t('addFaculty')}
          </button>
          )}
        </div>

        {/* Row 2: filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value)}
            className="min-w-0 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          >
            <option value="">All Genders</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>

          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="min-w-0 max-w-[200px] px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          >
            <option value="">All Departments</option>
            {availableDepts.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={filterPosition}
            onChange={(e) => setFilterPosition(e.target.value)}
            className="min-w-0 max-w-[180px] px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          >
            <option value="">All Positions</option>
            {ACADEMIC_POSITIONS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>

          <select
            value={filterEmploymentType}
            onChange={(e) => setFilterEmploymentType(e.target.value)}
            className="min-w-0 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          >
            <option value="">All Employment</option>
            <option value="FULL_TIME">Full Time</option>
            <option value="PART_TIME">Part Time</option>
          </select>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}

          {hasFilters && (
            <span className="text-xs text-gray-400">
              {data.length} of {allData?.length ?? 0} shown
            </span>
          )}
        </div>
      </div>

      {showAdd && <AddFacultyModal onClose={() => setShowAdd(false)} />}
      {editFaculty && <EditFacultyModal faculty={editFaculty} onClose={() => setEditFaculty(null)} />}

      {forceDeleteTarget && (
        <ForceDeleteModal
          faculty={forceDeleteTarget.faculty}
          counts={forceDeleteTarget.counts}
          isPending={deleteFaculty.isPending}
          onCancel={() => setForceDeleteTarget(null)}
          onConfirm={() => deleteFaculty.mutate({ id: forceDeleteTarget.faculty.id, force: true })}
        />
      )}

      {showCheckboxes && (
        <div className="flex items-center gap-3 mb-3 px-3 py-2 bg-primary-50 border border-primary-200 rounded-lg">
          <span className="text-sm font-medium text-primary-700">
            {selectedIds.size > 0 ? `${selectedIds.size} selected` : `Select items to ${checkboxAction}`}
          </span>
          <div className="flex items-center gap-2 ml-auto">
            {checkboxAction === 'delete' && (
              <button onClick={handleBulkDelete} disabled={selectedIds.size === 0 || bulkPending}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50">
                <Trash2 className="w-3.5 h-3.5" /> Delete {selectedIds.size || ''}
              </button>
            )}
            {checkboxAction === 'deactivate' && (
              <button onClick={() => handleBulkToggleActive(false)} disabled={selectedIds.size === 0 || bulkPending}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 disabled:opacity-50">
                <PowerOff className="w-3.5 h-3.5" /> Deactivate {selectedIds.size || ''}
              </button>
            )}
            {checkboxAction === 'activate' && (
              <button onClick={() => handleBulkToggleActive(true)} disabled={selectedIds.size === 0 || bulkPending}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 disabled:opacity-50">
                <CheckCircle className="w-3.5 h-3.5" /> Activate {selectedIds.size || ''}
              </button>
            )}
            <button onClick={cancelSelectMode}
              className="flex items-center gap-1 px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700">
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card p-0 overflow-hidden relative">
        {isFetching && (
          <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin" />
              Searching...
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse border border-gray-200">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                {showCheckboxes && (
                  <th className="px-2 py-2.5 text-center border-r border-gray-200">
                    <input type="checkbox" checked={allSelected} onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                  </th>
                )}
                {['Employee ID', 'Name', 'Email', 'Academic Position', 'Gender', 'Employment Type', 'Responsible Department', 'Min Hours', 'Max Hours', 'Actions'].map((h) => (
                  <th key={h} className="px-2 py-2.5 text-center font-bold text-gray-500 uppercase text-[9px] whitespace-nowrap border-r border-gray-200">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={showCheckboxes ? 11 : 10} className="px-4 py-8 text-center text-gray-400">{t('loading')}</td></tr>
              ) : data?.length === 0 ? (
                <tr><td colSpan={showCheckboxes ? 11 : 10} className="px-4 py-8 text-center text-gray-400">{t('noFacultyFound')}</td></tr>
              ) : (
                data?.map((u) => (
                  <tr key={u.id} className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${showCheckboxes && selectedIds.has(u.id) ? 'bg-primary-50' : ''}`}>
                    {showCheckboxes && (
                      <td className="px-2 py-2 text-center border-r border-gray-200" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedIds.has(u.id)} onChange={() => toggleSelect(u.id)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                      </td>
                    )}
                    <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">{u.employeeId}</td>
                    <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">{u.firstName} {u.lastName}</td>
                    <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">{u.email}</td>
                    <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">
                      {u.academicPosition
                        ? (ACADEMIC_POSITIONS.find((p) => p.value === u.academicPosition)?.label ?? u.academicPosition)
                        : <span>—</span>}
                    </td>
                    <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">
                      {u.gender ? (
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          u.gender === 'MALE' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                        }`}>
                          {u.gender === 'MALE' ? 'Male' : 'Female'}
                        </span>
                      ) : <span>—</span>}
                    </td>
                    <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">
                      {u.employmentType ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {u.employmentType === 'FULL_TIME' ? 'Full Time' : 'Part Time'}
                        </span>
                      ) : <span>—</span>}
                    </td>
                    <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">{u.facultyDepartment || u.department?.name}</td>
                    <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">{u.minWeeklyHours ?? 0}h</td>
                    <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">{u.maxWeeklyHours}h</td>
                    <td className="px-2 py-2 text-center border-r border-gray-200">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setEditFaculty(u)}
                          title="Edit"
                          className="flex items-center justify-center w-8 h-8 rounded-lg border border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { enterSelectMode(u.isActive ? 'deactivate' : 'activate'); setSelectedIds(new Set([u.id])); }}
                          title={u.isActive ? 'Deactivate' : 'Activate'}
                          className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-colors ${u.isActive ? 'border-amber-200 text-amber-600 bg-amber-50 hover:bg-amber-100' : 'border-green-200 text-green-600 bg-green-50 hover:bg-green-100'}`}
                        >
                          {u.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => deleteFaculty.mutate({ id: u.id, force: false })}
                          title="Delete"
                          className="flex items-center justify-center w-8 h-8 rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
