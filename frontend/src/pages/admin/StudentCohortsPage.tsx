import { PageHeader } from '../../components/shared/PageHeader';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Users2, Plus, X, Save, Pencil, Trash2 } from 'lucide-react';
import { studentCohortsApi } from '../../api/student-cohorts.api';
import api from '../../api/client';
import { CustomDropdown } from '../../components/shared/CustomDropdown';

interface StudentCohort {
  id: string;
  yearOfStudy: number;
  language: string;
  studentCount: number;
  groupCodes: string[];
  program: { id: string; name: string; code: string };
  semester: { id: string; name: string };
}

const LANG_CONFIG: Record<string, { label: string; color: string }> = {
  UZB:     { label: 'UZB',     color: 'bg-green-100 text-green-700' },
  UZB_ENG: { label: 'UZB-ENG', color: 'bg-purple-100 text-purple-700' },
  RUS_ENG: { label: 'RUS-ENG', color: 'bg-primary-100 text-primary-700' },
};

export default function StudentCohortsPage() {
  const qc = useQueryClient();
  const [selectedSemester, setSelectedSemester] = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editCohort, setEditCohort] = useState<StudentCohort | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkPending, setBulkPending] = useState(false);
  const [showCheckboxes, setShowCheckboxes] = useState(false);

  const { data: semestersData } = useQuery({
    queryKey: ['semesters'],
    queryFn: () => api.get('/semesters').then((r) => r.data.data),
  });

  const { data: programsData } = useQuery({
    queryKey: ['programs-select'],
    queryFn: () => api.get('/programs', { params: { limit: 100 } }).then((r) => r.data.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['student-cohorts', selectedSemester],
    queryFn: () => studentCohortsApi.getAll(selectedSemester || undefined),
  });

  const cohorts: StudentCohort[] = data?.data ?? [];
  const programs: { id: string; name: string; code: string }[] = programsData ?? [];

  const filtered = cohorts.filter((c) => {
    if (filterProgram && c.program.id !== filterProgram) return false;
    return true;
  });

  function toggleSelect(id: string) {
    setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }

  const allSelected = filtered.length > 0 && filtered.every((item) => selectedIds.has(item.id));
  function toggleSelectAll() { allSelected ? setSelectedIds(new Set()) : setSelectedIds(new Set(filtered.map((i) => i.id))); }

  function enterSelectMode() { setShowCheckboxes(true); setSelectedIds(new Set()); }
  function cancelSelectMode() { setShowCheckboxes(false); setSelectedIds(new Set()); }

  function handleBulkDelete() {
    if (!window.confirm(`Delete ${selectedIds.size} selected item(s)? This cannot be undone.`)) return;
    setBulkPending(true);
    Promise.all(Array.from(selectedIds).map((id) => studentCohortsApi.remove(id)))
      .then(() => { qc.invalidateQueries({ queryKey: ['student-cohorts'] }); toast.success(`${selectedIds.size} item(s) deleted`); cancelSelectMode(); })
      .catch((err: any) => toast.error(err.response?.data?.message || 'Failed to delete'))
      .finally(() => setBulkPending(false));
  }

  // Group by program for footer totals
  const totalByProgram = filtered.reduce<Record<string, number>>((acc, c) => {
    const key = c.program.name;
    acc[key] = (acc[key] ?? 0) + c.studentCount;
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <PageHeader icon={<Users2 />} title="Student Cohorts" />

      {/* Filters + Add button */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 flex flex-wrap items-center gap-2">
        <select
          value={selectedSemester}
          onChange={(e) => setSelectedSemester(e.target.value)}
          className="min-w-0 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        >
          <option value="">All Semesters</option>
          {(semestersData ?? []).map((s: { id: string; name: string; academicYear: string }) => (
            <option key={s.id} value={s.id}>{s.name} — {s.academicYear}</option>
          ))}
        </select>
        <select
          value={filterProgram}
          onChange={(e) => setFilterProgram(e.target.value)}
          className="min-w-0 max-w-[220px] px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        >
          <option value="">All Programs</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
          ))}
        </select>
        {(selectedSemester || filterProgram) && (
          <button
            onClick={() => { setSelectedSemester(''); setFilterProgram(''); }}
            className="flex-shrink-0 text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
        <span className="text-xs text-gray-500 flex-shrink-0">{filtered.length} cohorts</span>
        <button
          onClick={() => { setEditCohort(null); setShowModal(true); }}
          className="btn-primary flex items-center gap-1.5 ml-auto flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Cohort
        </button>
      </div>

      {/* Bulk bar */}
      {showCheckboxes && (
        <div className="flex items-center gap-3 mb-2 px-3 py-2 bg-primary-50 border border-primary-200 rounded-lg">
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
            <button onClick={cancelSelectMode} className="flex items-center gap-1 px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700">
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <Users2 className="w-10 h-10 mb-2 opacity-30" />
            <p>No cohorts found</p>
          </div>
        ) : (
          <table className="w-full border-collapse border border-gray-200">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                {showCheckboxes && (
                  <th className="px-2 py-2.5 text-center border-r border-gray-200">
                    <input type="checkbox" checked={allSelected} onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                  </th>
                )}
                <th className="px-2 py-2.5 text-center font-bold text-gray-500 uppercase text-[9px] whitespace-nowrap border-r border-gray-200">Program</th>
                <th className="px-2 py-2.5 text-center font-bold text-gray-500 uppercase text-[9px] whitespace-nowrap border-r border-gray-200">Year</th>
                <th className="px-2 py-2.5 text-center font-bold text-gray-500 uppercase text-[9px] whitespace-nowrap border-r border-gray-200">Language</th>
                <th className="px-2 py-2.5 text-center font-bold text-gray-500 uppercase text-[9px] whitespace-nowrap border-r border-gray-200">Students</th>
                <th className="px-2 py-2.5 text-center font-bold text-gray-500 uppercase text-[9px] whitespace-nowrap border-r border-gray-200">Group Codes</th>
                <th className="px-2 py-2.5 text-center font-bold text-gray-500 uppercase text-[9px] whitespace-nowrap border-r border-gray-200">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((cohort) => {
                const langConfig = LANG_CONFIG[cohort.language] ?? { label: cohort.language, color: 'bg-gray-100 text-gray-600' };
                return (
                  <tr key={cohort.id} className={`border-b border-gray-200 hover:bg-gray-50 ${showCheckboxes && selectedIds.has(cohort.id) ? 'bg-primary-50' : ''}`}>
                    {showCheckboxes && (
                      <td className="px-2 py-2 text-center border-r border-gray-200" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedIds.has(cohort.id)} onChange={() => toggleSelect(cohort.id)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                      </td>
                    )}
                    <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">
                      <div>
                        <p>{cohort.program.name}</p>
                        <p>{cohort.program.code}</p>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                        Year {cohort.yearOfStudy}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${langConfig.color}`}>
                        {langConfig.label}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">
                      {cohort.studentCount}
                    </td>
                    <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">
                      <div className="flex flex-wrap justify-center gap-1">
                        {cohort.groupCodes.map((code) => (
                          <span key={code} className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">
                            {code}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-2 py-2 text-center border-r border-gray-200">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => { setEditCohort(cohort); setShowModal(true); }}
                          className="flex items-center justify-center w-8 h-8 rounded-lg border border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { enterSelectMode(); setSelectedIds(new Set([cohort.id])); }}
                          className="flex items-center justify-center w-8 h-8 rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer totals */}
      {Object.keys(totalByProgram).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-600 mb-2">Total Students by Program</p>
          <div className="flex flex-wrap gap-3">
            {Object.entries(totalByProgram).map(([prog, count]) => (
              <div key={prog} className="flex items-center gap-2 text-sm">
                <span className="text-gray-700">{prog}:</span>
                <span className="font-bold text-primary-600">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <CohortModal
          cohort={editCohort}
          programs={programs}
          semesters={semestersData ?? []}
          onClose={() => { setShowModal(false); setEditCohort(null); }}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ['student-cohorts'] });
            setShowModal(false);
            setEditCohort(null);
            toast.success(editCohort ? 'Cohort updated' : 'Cohort created');
          }}
        />
      )}
    </div>
  );
}

function CohortModal({
  cohort,
  programs,
  semesters,
  onClose,
  onSaved,
}: {
  cohort: StudentCohort | null;
  programs: { id: string; name: string; code: string }[];
  semesters: { id: string; name: string; academicYear: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    programId: cohort?.program.id ?? '',
    semesterId: cohort?.semester.id ?? '',
    yearOfStudy: cohort?.yearOfStudy ?? 1,
    language: cohort?.language ?? 'UZB',
    studentCount: cohort?.studentCount ?? 0,
    groupCodes: cohort?.groupCodes ?? [] as string[],
  });
  const [codeInput, setCodeInput] = useState('');

  function addCode() {
    const trimmed = codeInput.trim().toUpperCase();
    if (trimmed && !form.groupCodes.includes(trimmed)) {
      setForm((p) => ({ ...p, groupCodes: [...p.groupCodes, trimmed] }));
    }
    setCodeInput('');
  }

  function removeCode(code: string) {
    setForm((p) => ({ ...p, groupCodes: p.groupCodes.filter((c) => c !== code) }));
  }

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      cohort
        ? studentCohortsApi.update(cohort.id, data)
        : studentCohortsApi.create(data),
    onSuccess: onSaved,
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to save cohort');
    },
  });

  function handleSave() {
    // Auto-include any text still typed in the code input (user didn't click Add)
    const pendingCode = codeInput.trim().toUpperCase();
    const finalCodes = pendingCode && !form.groupCodes.includes(pendingCode)
      ? [...form.groupCodes, pendingCode]
      : form.groupCodes;

    mutation.mutate({
      programId: form.programId,
      semesterId: form.semesterId,
      yearOfStudy: form.yearOfStudy,
      language: form.language,
      studentCount: form.studentCount,
      groupCodes: finalCodes,
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-bold text-gray-900">{cohort ? 'Edit Cohort' : 'Add Cohort'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Program *</label>
            <CustomDropdown
              value={form.programId}
              onChange={(v) => setForm((p) => ({ ...p, programId: v }))}
              options={[
                { value: '', label: 'Select program...' },
                ...programs.map((p) => ({ value: p.id, label: `${p.code} — ${p.name}` })),
              ]}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Semester *</label>
            <CustomDropdown
              value={form.semesterId}
              onChange={(v) => setForm((p) => ({ ...p, semesterId: v }))}
              options={[
                { value: '', label: 'Select semester...' },
                ...semesters.map((s) => ({ value: s.id, label: `${s.name} — ${s.academicYear}` })),
              ]}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Year of Study</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={form.yearOfStudy}
                onChange={(e) => {
                  const val = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10);
                  if (!isNaN(val) && val >= 1 && val <= 6) setForm((p) => ({ ...p, yearOfStudy: val }));
                  else if (e.target.value === '') setForm((p) => ({ ...p, yearOfStudy: 1 }));
                }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Student Count</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={form.studentCount === 0 ? '' : form.studentCount}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setForm((p) => ({ ...p, studentCount: val === '' ? 0 : parseInt(val, 10) }));
                }}
                placeholder="0"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Language</label>
            <CustomDropdown
              value={form.language}
              onChange={(v) => setForm((p) => ({ ...p, language: v }))}
              options={['UZB', 'UZB_ENG', 'RUS_ENG']}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Group Codes</label>

            {/* Chip display */}
            {form.groupCodes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {form.groupCodes.map((code) => (
                  <span
                    key={code}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-50 text-primary-700 border border-primary-100 rounded text-xs font-mono font-medium"
                  >
                    {code}
                    <button
                      type="button"
                      onClick={() => removeCode(code)}
                      className="ml-0.5 text-primary-400 hover:text-red-500 leading-none text-sm"
                      title="Remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Add new code input */}
            <div className="flex gap-2">
              <input
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCode(); } }}
                placeholder="e.g. FM1, FIT2…"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="button"
                onClick={addCode}
                disabled={!codeInput.trim()}
                className="px-3 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-40"
              >
                Add
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Type a code and press Enter or click Add. Each code (FM1, FM2…) is a separate group.</p>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={handleSave}
            disabled={mutation.isPending || !form.programId || !form.semesterId}
            className="flex-1 btn-primary gap-2"
          >
            <Save className="w-4 h-4" />
            {mutation.isPending ? 'Saving...' : cohort ? 'Update' : 'Create'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
        {mutation.isError && <p className="px-6 pb-4 text-red-500 text-xs">Error saving cohort</p>}
      </div>
    </div>
  );
}
