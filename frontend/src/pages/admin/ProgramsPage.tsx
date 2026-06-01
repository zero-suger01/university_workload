import { PageHeader } from '../../components/shared/PageHeader';
import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, BookMarked, X, Save, Trash2, Search,
  ChevronDown, ChevronRight, GraduationCap, Building2,
} from 'lucide-react';
import { CustomDropdown } from '../../components/shared/CustomDropdown';
import toast from 'react-hot-toast';
import { programsApi } from '../../api/programs.api';
import api from '../../api/client';

interface Program {
  id: string;
  name: string;
  code: string;
  degreeLevel: string;
  description?: string;
  isActive: boolean;
  departmentId: string;
  department: { id: string; name: string; code: string };
  _count?: { groups: number; planningRows: number };
}

interface Department {
  id: string;
  name: string;
  code: string;
}

const DEGREE_LEVELS = ['BACHELOR', 'MASTER', 'PHD'];

const DEGREE_BADGE: Record<string, string> = {
  BACHELOR: 'bg-blue-50 text-blue-700',
  MASTER:   'bg-purple-50 text-purple-700',
  PHD:      'bg-amber-50 text-amber-700',
};

export default function ProgramsPage({ readOnly = false }: { readOnly?: boolean }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Program | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [openSchools, setOpenSchools] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ['programs'],
    queryFn: () => programsApi.list({ limit: 200 }),
  });

  const { data: deptData } = useQuery({
    queryKey: ['departments-list'],
    queryFn: () => api.get('/departments', { params: { limit: 100 } }).then((r) => r.data.data),
  });

  const programs: Program[] = data?.data ?? [];
  const departments: Department[] = deptData ?? [];

  // Filter programs by search
  const filtered = useMemo(() => {
    if (!search) return programs;
    const q = search.toLowerCase();
    return programs.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.department.name.toLowerCase().includes(q),
    );
  }, [programs, search]);

  // Group filtered programs by department
  const bySchool = useMemo(() => {
    const map = new Map<string, { dept: Department; programs: Program[] }>();
    // Ensure all departments appear (even empty ones) when not searching
    if (!search) {
      departments.forEach((d) => map.set(d.id, { dept: d, programs: [] }));
    }
    filtered.forEach((p) => {
      if (!map.has(p.departmentId)) {
        map.set(p.departmentId, { dept: p.department, programs: [] });
      }
      map.get(p.departmentId)!.programs.push(p);
    });
    return Array.from(map.values()).sort((a, b) => a.dept.name.localeCompare(b.dept.name));
  }, [filtered, departments, search]);

  // Auto-open all schools when searching
  const effectiveOpen = useMemo<Set<string>>(() => {
    if (search) return new Set(bySchool.map((s) => s.dept.id));
    return openSchools;
  }, [search, bySchool, openSchools]);

  function toggleSchool(id: string) {
    setOpenSchools((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function openAddForm() {
    setSelected(null);
    setShowForm(true);
  }

  return (
    <div className="flex h-full gap-4">
      {/* Left panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 gap-3">
          <PageHeader icon={<GraduationCap />} title={t('academicPrograms')} />
          {!readOnly && <button onClick={openAddForm} className="btn-primary flex items-center gap-1.5 flex-shrink-0">
            <Plus className="w-4 h-4" /> {t('addProgram')}
          </button>}
        </div>

        {/* Search bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPrograms')}
            className="w-full pl-9 pr-9 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Summary */}
        {search ? (
          <p className="text-xs text-gray-500 mb-3">
            {t('programsMatching', { count: filtered.length, query: search })}
          </p>
        ) : (
          <p className="text-xs text-gray-500 mb-3">
            {t('programsAcross', { count: programs.length, schools: departments.length })}
          </p>
        )}

        {/* School sections */}
        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-gray-400">Loading...</div>
        ) : (
          <div className="space-y-2 overflow-y-auto">
            {bySchool.map(({ dept, programs: progs }) => {
              const isOpen = effectiveOpen.has(dept.id);
              return (
                <div key={dept.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {/* School header — clickable to expand */}
                  <button
                    onClick={() => !search && toggleSchool(dept.id)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-3.5 h-3.5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{dept.name}</p>
                        <p className="text-xs text-gray-400">{dept.code}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
                        {progs.length} program{progs.length !== 1 ? 's' : ''}
                      </span>
                      {search ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : isOpen ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Programs list */}
                  {isOpen && (
                    <div className="border-t border-gray-100 divide-y divide-gray-50">
                      {progs.length === 0 ? (
                        <p className="px-5 py-4 text-xs text-gray-400 italic">{t('noPrograms')}</p>
                      ) : (
                        progs.map((prog) => (
                          <div
                            key={prog.id}
                            onClick={() => { setSelected(prog); setShowForm(false); }}
                            className={`flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-primary-50 transition-colors ${
                              selected?.id === prog.id ? 'bg-primary-50 border-l-2 border-l-primary-500' : ''
                            }`}
                          >
                            <BookMarked className="w-4 h-4 text-primary-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-gray-900 text-sm">{prog.name}</span>
                                <span className="font-mono text-xs text-gray-400">{prog.code}</span>
                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${DEGREE_BADGE[prog.degreeLevel] ?? 'bg-gray-100 text-gray-600'}`}>
                                  {prog.degreeLevel}
                                </span>
                              </div>
                              {prog.description && (
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{prog.description}</p>
                              )}
                            </div>
                            <span className="text-xs text-gray-400 whitespace-nowrap">
                              {prog._count?.groups ?? 0} {t('groups')}
                            </span>
                          </div>
                        ))
                      )}
                      {!readOnly && <div className="px-5 py-2">
                        <button
                          onClick={() => {
                            setSelected(null);
                            setShowForm(true);
                          }}
                          className="text-xs text-primary-600 hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> {t('addProgramToSchool', { school: dept.name })}
                        </button>
                      </div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right panel — form */}
      {!readOnly && (selected || showForm) && (
        <div className="w-80 flex-shrink-0 bg-white rounded-xl border border-gray-200 overflow-y-auto">
          <ProgramForm
            program={selected}
            departments={deptData ?? []}
            onClose={() => { setSelected(null); setShowForm(false); }}
            onSaved={() => {
              qc.invalidateQueries({ queryKey: ['programs'] });
              setShowForm(false);
              setSelected(null);
            }}
          />
        </div>
      )}
    </div>
  );
}

function ProgramForm({
  program, departments, onClose, onSaved,
}: {
  program: Program | null;
  departments: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const getDefaultForm = (p: Program | null) => {
    if (!p) return { degreeLevel: 'BACHELOR', isActive: true };
    return {
      name: p.name,
      code: p.code,
      degreeLevel: p.degreeLevel,
      description: p.description ?? '',
      departmentId: p.departmentId,
      isActive: p.isActive,
    };
  };

  const [form, setForm] = useState<Record<string, unknown>>(() => getDefaultForm(program));

  useEffect(() => {
    setForm(getDefaultForm(program));
  }, [program]);

  const isEdit = Boolean(program);

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      program ? programsApi.update(program.id, data) : programsApi.create(data),
    onSuccess: () => {
      toast.success(isEdit ? 'Program updated' : 'Program created');
      onSaved();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to save program');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/programs/${program?.id}`),
    onSuccess: onSaved,
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error deleting program'),
  });

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900">{program ? t('editProgram') : t('newProgram')}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
      </div>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t('name')} *</label>
          <input
            value={String(form.name ?? '')}
            onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t('code')} *</label>
          <input
            value={String(form.code ?? '')}
            onChange={(e) => setForm(p => ({ ...p, code: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t('degreeLevelLabel')} *</label>
          <CustomDropdown
            value={String(form.degreeLevel ?? '')}
            options={DEGREE_LEVELS.map((d) => ({ value: d, label: d }))}
            onChange={(v) => setForm(p => ({ ...p, degreeLevel: v }))}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t('school')} *</label>
          <CustomDropdown
            value={String(form.departmentId ?? '')}
            options={[
              { value: '', label: t('selectSchool') },
              ...departments.map((d) => ({ value: d.id, label: d.name })),
            ]}
            onChange={(v) => setForm(p => ({ ...p, departmentId: v }))}
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-gray-600">{t('description')}</label>
            <span className="text-xs text-gray-400">{String(form.description ?? '').length} chars</span>
          </div>
          <textarea
            rows={6}
            placeholder="Describe the program objectives, scope, and key outcomes..."
            value={String(form.description ?? '')}
            onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y min-h-[80px] max-h-[300px] leading-relaxed"
          />
        </div>
      </div>
      <div className="flex gap-2 mt-5">
        <button
          onClick={() => {
            if (!form.name || String(form.name).trim() === '') {
              toast.error('Name is required');
              return;
            }
            if (!form.code || String(form.code).trim() === '') {
              toast.error('Code is required');
              return;
            }
            if (!form.departmentId || String(form.departmentId).trim() === '') {
              toast.error('Department is required');
              return;
            }
            mutation.mutate(form);
          }}
          disabled={mutation.isPending}
          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-60 transition-colors"
        >
          <Save className="w-4 h-4" />
          {mutation.isPending ? t('saving') : program ? t('edit') : t('add')}
        </button>
        <button onClick={onClose} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50">
          {t('cancel')}
        </button>
        {program && (
          <button
            onClick={() => {
              if (window.confirm(`Deactivate "${program.name}"? The program will be hidden but can be restored later.`)) deleteMutation.mutate();
            }}
            disabled={deleteMutation.isPending}
            className="flex items-center justify-center w-8 h-8 rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-40"
            title="Deactivate Program"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
