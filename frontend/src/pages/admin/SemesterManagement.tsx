import { PageHeader } from '../../components/shared/PageHeader';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  Plus, CheckCircle, Pencil, Trash2, X, Save, PowerOff, CalendarDays,
} from 'lucide-react';
import api from '../../api/client';
import { CustomDropdown } from '../../components/shared/CustomDropdown';


interface Semester {
  id: string;
  name: string;
  academicYear: string;
  term: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isCurrent: boolean;
}

const TERM_OPTIONS = [
  { value: 1, label: 'Spring Semester' },
  { value: 2, label: 'Fall Semester' },
  { value: 3, label: 'Summer Retake' },
];

function termLabel(term: number) {
  return TERM_OPTIONS.find((t) => t.value === term)?.label ?? `Term ${term}`;
}

const EMPTY_FORM = {
  name: '',
  academicYear: '',
  term: 1,
  startDate: '',
  endDate: '',
};

interface FormState {
  name: string;
  academicYear: string;
  term: number;
  startDate: string;
  endDate: string;
}

function SemesterModal({
  semester,
  onClose,
  onSaved,
}: {
  semester: Semester | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(
    semester
      ? {
          name: semester.name,
          academicYear: semester.academicYear,
          term: semester.term,
          startDate: semester.startDate.slice(0, 10),
          endDate: semester.endDate.slice(0, 10),
        }
      : { ...EMPTY_FORM },
  );

  const mutation = useMutation({
    mutationFn: (data: FormState) => {
      const payload = {
        ...data,
        term: Number(data.term),
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
      };
      return semester
        ? api.put(`/semesters/${semester.id}`, payload)
        : api.post('/semesters', payload);
    },
    onSuccess: () => {
      toast.success(semester ? 'Semester updated' : 'Semester created');
      onSaved();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || 'Failed to save semester'),
  });

  function handleSubmit() {
    if (!form.name || String(form.name).trim() === '') {
      toast.error('Name is required');
      return;
    }
    if (!form.academicYear || !/^\d{4}-\d{4}$/.test(String(form.academicYear))) {
      toast.error('Academic year must be in format YYYY-YYYY');
      return;
    }
    if (!form.startDate) {
      toast.error('Start date is required');
      return;
    }
    if (!form.endDate) {
      toast.error('End date is required');
      return;
    }
    mutation.mutate(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-primary-600" />
            <h2 className="font-bold text-gray-900">
              {semester ? 'Edit Semester' : 'Add Semester'}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Spring 2025"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Academic Year + Term */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Academic Year *</label>
              <input
                value={form.academicYear}
                onChange={(e) => setForm((p) => ({ ...p, academicYear: e.target.value }))}
                placeholder="2025-2026"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-[10px] text-gray-400 mt-0.5">Format: YYYY-YYYY</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Term *</label>
              <CustomDropdown
                value={String(form.term)}
                onChange={(v) => setForm((p) => ({ ...p, term: Number(v) }))}
                options={TERM_OPTIONS.map((t) => ({ value: String(t.value), label: t.label }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Start + End dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start Date *</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End Date *</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 btn-secondary">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="flex-1 flex items-center justify-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {mutation.isPending ? 'Saving…' : semester ? 'Save Changes' : 'Create Semester'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface SemesterManagementProps {
  readOnly?: boolean;
}

export default function SemesterManagement({ readOnly = false }: SemesterManagementProps) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Semester | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkPending, setBulkPending] = useState(false);
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [checkboxAction, setCheckboxAction] = useState<'delete' | 'deactivate' | 'activate' | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['semesters'],
    queryFn: () => api.get('/semesters').then((r) => r.data.data as Semester[]),
  });

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const allSelected = (data?.length ?? 0) > 0 && (data ?? []).every((i) => selectedIds.has(i.id));

  function toggleSelectAll() {
    allSelected
      ? setSelectedIds(new Set())
      : setSelectedIds(new Set((data ?? []).map((i) => i.id)));
  }

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

  function handleBulkToggle(activateFlag: boolean) {
    setBulkPending(true);
    Promise.all(
      Array.from(selectedIds).map((id) =>
        api.patch(`/semesters/${id}/${activateFlag ? 'activate' : 'deactivate'}`)
      )
    )
      .then(() => {
        qc.invalidateQueries({ queryKey: ['semesters'] });
        toast.success(`${selectedIds.size} semester(s) ${activateFlag ? 'activated' : 'deactivated'}`);
        cancelSelectMode();
      })
      .catch((err: any) => toast.error(err?.response?.data?.message || 'Failed'))
      .finally(() => setBulkPending(false));
  }

  function handleBulkDelete() {
    if (!window.confirm(`Delete ${selectedIds.size} semester(s)? This cannot be undone.`)) return;
    setBulkPending(true);
    Promise.all(Array.from(selectedIds).map((id) => api.delete(`/semesters/${id}`)))
      .then(() => {
        qc.invalidateQueries({ queryKey: ['semesters'] });
        toast.success(`${selectedIds.size} semester(s) deleted`);
        cancelSelectMode();
      })
      .catch((err: any) => toast.error(err?.response?.data?.message || 'Failed to delete'))
      .finally(() => setBulkPending(false));
  }

  function openAdd() {
    setEditTarget(null);
    setShowModal(true);
  }

  function openEdit(s: Semester) {
    setEditTarget(s);
    setShowModal(true);
  }

  function handleSaved() {
    qc.invalidateQueries({ queryKey: ['semesters'] });
    setShowModal(false);
    setEditTarget(null);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <PageHeader icon={<CalendarDays />} title={t('semesters')} />
        {!readOnly && (
          <div className="flex items-center gap-2">
            <button
              onClick={openAdd}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Semester
            </button>
          </div>
        )}
      </div>

      {/* Bulk action bar */}
      {!readOnly && showCheckboxes && (
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
              <button onClick={() => handleBulkToggle(false)} disabled={selectedIds.size === 0 || bulkPending}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 disabled:opacity-50">
                <PowerOff className="w-3.5 h-3.5" /> Deactivate {selectedIds.size || ''}
              </button>
            )}
            {checkboxAction === 'activate' && (
              <button onClick={() => handleBulkToggle(true)} disabled={selectedIds.size === 0 || bulkPending}
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
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse border border-gray-200">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                {!readOnly && showCheckboxes && (
                  <th className="px-2 py-2.5 text-center border-r border-gray-200">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                )}
                {['Name', 'Academic Year', 'Term', 'Start', 'End', 'Status', ...(readOnly ? [] : ['Actions'])].map((h) => (
                  <th key={h} className="px-2 py-2.5 text-center font-bold text-gray-500 uppercase text-[9px] whitespace-nowrap border-r border-gray-200">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={readOnly ? 6 : (showCheckboxes ? 8 : 7)} className="px-4 py-8 text-center text-gray-400">{t('loading')}</td>
                </tr>
              ) : !data?.length ? (
                <tr>
                  <td colSpan={readOnly ? 6 : (showCheckboxes ? 8 : 7)} className="px-4 py-8 text-center text-gray-400">
                    No semesters yet.{!readOnly && ' Click "+ Add Semester" to create one.'}
                  </td>
                </tr>
              ) : (
                data.map((s) => (
                  <tr key={s.id} className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${!readOnly && showCheckboxes && selectedIds.has(s.id) ? 'bg-primary-50' : ''}`}>
                    {!readOnly && showCheckboxes && (
                      <td className="px-2 py-2 text-center border-r border-gray-200" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(s.id)}
                          onChange={() => toggleSelect(s.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                    )}
                    <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">{s.name}</td>
                    <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">{s.academicYear}</td>
                    <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
                        {termLabel(s.term)}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">
                      {new Date(s.startDate).toLocaleDateString()}
                    </td>
                    <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">
                      {new Date(s.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${s.isCurrent ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
                        {s.isCurrent ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    {!readOnly && (
                      <td className="px-2 py-2 text-center border-r border-gray-200">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEdit(s)}
                            title="Edit"
                            className="flex items-center justify-center w-8 h-8 rounded-lg border border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { enterSelectMode('delete'); setSelectedIds(new Set([s.id])); }}
                            title="Delete"
                            className="flex items-center justify-center w-8 h-8 rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { enterSelectMode(s.isCurrent ? 'deactivate' : 'activate'); setSelectedIds(new Set([s.id])); }}
                            title={s.isCurrent ? 'Deactivate' : 'Activate'}
                            className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-colors ${
                              s.isCurrent
                                ? 'border-amber-200 text-amber-600 bg-amber-50 hover:bg-amber-100'
                                : 'border-green-200 text-green-600 bg-green-50 hover:bg-green-100'
                            }`}
                          >
                            {s.isCurrent ? (
                              <PowerOff className="w-4 h-4" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <SemesterModal
          semester={editTarget}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
