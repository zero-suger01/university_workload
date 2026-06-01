import { PageHeader } from '../../components/shared/PageHeader';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Plus, Pencil, Trash2, Loader2, Users, BookOpen, Search, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import BaseModal from '../../components/shared/BaseModal';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  avgWeeklyLoad: number;
  _count: { users: number; courses: number };
}

// ─── Schema ───────────────────────────────────────────────────────────────────
const deptSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required').max(10).toUpperCase(),
  description: z.string().optional(),
  avgWeeklyLoad: z.number().min(1).max(60).default(30),
});
type DeptForm = z.infer<typeof deptSchema>;

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────
function DeptModal({
  dept,
  onClose,
}: {
  dept: Department | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const isEdit = !!dept;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DeptForm>({
    resolver: zodResolver(deptSchema),
    defaultValues: dept
      ? { name: dept.name, code: dept.code, description: dept.description ?? '', avgWeeklyLoad: dept.avgWeeklyLoad }
      : { avgWeeklyLoad: 30 },
  });

  const mutation = useMutation({
    mutationFn: (data: DeptForm) =>
      isEdit
        ? api.put(`/departments/${dept!.id}`, data).then((r) => r.data)
        : api.post('/departments', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments-admin'] });
      qc.invalidateQueries({ queryKey: ['departments'] });
      toast.success(isEdit ? t('schoolUpdated') : t('schoolCreated'));
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to save department'),
  });

  return (
    <BaseModal title={isEdit ? `${t('edit')} — ${dept!.code}` : t('addSchool')} onClose={onClose}>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">{t('schoolName')} *</label>
            <input {...register('name')} className="input" placeholder="School of Exact Sciences" />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="label">Code *</label>
            <input {...register('code')} className="input" placeholder="SES" maxLength={10} />
            {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code.message}</p>}
          </div>
          <div>
            <label className="label">{t('avgWeeklyLoad')}</label>
            <input
              {...register('avgWeeklyLoad', { valueAsNumber: true })}
              type="number"
              min={1}
              max={60}
              className="input"
            />
            {errors.avgWeeklyLoad && <p className="text-xs text-red-500 mt-1">{errors.avgWeeklyLoad.message}</p>}
          </div>
          <div className="col-span-2">
            <label className="label">Description</label>
            <textarea
              {...register('description')}
              rows={2}
              className="input resize-none"
              placeholder="Optional description..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">{t('cancel')}</button>
          <button type="submit" disabled={mutation.isPending} className="btn-primary flex items-center gap-2">
            {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {mutation.isPending ? t('saving') : t('save')}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}

// ─── Confirm delete dialog ────────────────────────────────────────────────────
function ConfirmDeleteModal({
  dept,
  onConfirm,
  onCancel,
  isPending,
}: {
  dept: Department;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const { t } = useTranslation();
  return (
    <BaseModal title={t('deleteSchool')} onClose={onCancel}>
      <div className="space-y-4">
        <p className="text-sm text-gray-700">
          {t('delete')}{' '}
          <span className="font-semibold text-gray-900">{dept.code} — {dept.name}</span>?
        </p>
        {(dept._count.users > 0 || dept._count.courses > 0) && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            {t('deleteSchoolWarning', { users: dept._count.users, courses: dept._count.courses })}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="btn-secondary">{t('cancel')}</button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60 transition-colors"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {t('delete')}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DepartmentsPage({ readOnly = false }: { readOnly?: boolean }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editDept, setEditDept] = useState<Department | null>(null);
  const [deleteDept, setDeleteDept] = useState<Department | null>(null);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkPending, setBulkPending] = useState(false);
  const [showCheckboxes, setShowCheckboxes] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['departments-admin'],
    queryFn: () => api.get('/departments').then((r) => r.data.data),
  });

  const departments: Department[] = data ?? [];
  const filtered = departments.filter((d) => {
    const q = search.toLowerCase();
    return !q || d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q);
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/departments/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments-admin'] });
      qc.invalidateQueries({ queryKey: ['departments'] });
      toast.success(t('schoolDeleted'));
      setDeleteDept(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete department');
      setDeleteDept(null);
    },
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
    Promise.all(Array.from(selectedIds).map((id) => api.delete(`/departments/${id}`)))
      .then(() => { qc.invalidateQueries({ queryKey: ['departments'] }); qc.invalidateQueries({ queryKey: ['departments-admin'] }); toast.success(`${selectedIds.size} item(s) deleted`); cancelSelectMode(); })
      .catch((err: any) => toast.error(err.response?.data?.message || 'Failed to delete'))
      .finally(() => setBulkPending(false));
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <PageHeader icon={<Building2 />} title={t('pageDepartments')} />
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchByNameOrCode')}
              className="pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-56"
            />
          </div>
          {!readOnly && <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> {t('addSchool')}
          </button>}
        </div>
      </div>

      {/* Modals */}
      {!readOnly && (showModal || editDept) && (
        <DeptModal
          dept={editDept}
          onClose={() => { setShowModal(false); setEditDept(null); }}
        />
      )}
      {deleteDept && (
        <ConfirmDeleteModal
          dept={deleteDept}
          isPending={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteDept.id)}
          onCancel={() => setDeleteDept(null)}
        />
      )}

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">{t('totalSchools')}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{departments.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Total Academic Staff</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {departments.reduce((s, d) => s + d._count.users, 0)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Total Courses</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {departments.reduce((s, d) => s + d._count.courses, 0)}
          </p>
        </div>
      </div>

      {/* Bulk bar */}
      {!readOnly && showCheckboxes && (
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
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                {showCheckboxes && (
                  <th className="px-2 py-2.5 text-center border-r border-gray-200">
                    <input type="checkbox" checked={allSelected} onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                  </th>
                )}
                {['Code', 'Name', 'Description', 'Academic Staff', 'Courses', 'Actions'].map((h) => (
                  <th key={h} className="px-2 py-2.5 text-center font-bold text-gray-500 uppercase text-[9px] whitespace-nowrap border-r border-gray-200">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={showCheckboxes ? 7 : 6} className="px-4 py-8 text-center text-gray-400">Loading...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={showCheckboxes ? 7 : 6} className="px-4 py-8 text-center text-gray-400">
                    {search ? t('noSchoolsMatch', { query: search }) : t('noSchoolsYet')}
                  </td>
                </tr>
              ) : filtered.map((d) => (
                <tr key={d.id} className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${showCheckboxes && selectedIds.has(d.id) ? 'bg-primary-50' : ''}`}>
                  {showCheckboxes && (
                    <td className="px-2 py-2 text-center border-r border-gray-200" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedIds.has(d.id)} onChange={() => toggleSelect(d.id)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                    </td>
                  )}
                  <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">{d.code}</td>
                  <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">{d.name}</td>
                  <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200 max-w-xs truncate">
                    {d.description ?? <span>—</span>}
                  </td>
                  <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3 h-3" /> {d._count.users}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">
                    <span className="inline-flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> {d._count.courses}
                    </span>
                  </td>
                  {!readOnly && <td className="px-2 py-2 text-center border-r border-gray-200">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setEditDept(d)}
                        title="Edit"
                        className="flex items-center justify-center w-8 h-8 rounded-lg border border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { enterSelectMode(); setSelectedIds(new Set([d.id])); }}
                        title="Delete"
                        className="flex items-center justify-center w-8 h-8 rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
