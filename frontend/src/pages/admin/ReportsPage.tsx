import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Download, FileSpreadsheet, Trash2, Loader2, X } from 'lucide-react';
import api from '../../api/client';

async function downloadReportFile(id: string, title: string) {
  const response = await api.get(`/reports/${id}/download`, { responseType: 'blob' });
  const blob = new Blob([response.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const cleanName = `${title.trim()}.xlsx`;

  // Show native Save As dialog in Chrome/Edge
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await (window as unknown as {
        showSaveFilePicker: (opts: object) => Promise<{ createWritable: () => Promise<{ write: (b: Blob) => Promise<void>; close: () => Promise<void> }> }>;
      }).showSaveFilePicker({
        suggestedName: cleanName,
        types: [{
          description: 'Excel Spreadsheet',
          accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
        }],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (e) {
      if ((e as Error).name === 'AbortError') return; // user cancelled — do nothing
    }
  }

  // Fallback for Firefox / Safari: standard anchor download
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = cleanName;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export default function ReportsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkPending, setBulkPending] = useState(false);
  const [showCheckboxes, setShowCheckboxes] = useState(false);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }

  function enterSelectMode() { setShowCheckboxes(true); setSelectedIds(new Set()); }
  function cancelSelectMode() { setShowCheckboxes(false); setSelectedIds(new Set()); }

  function handleBulkDelete() {
    if (!window.confirm(`Delete ${selectedIds.size} selected report(s)?`)) return;
    setBulkPending(true);
    Promise.all(Array.from(selectedIds).map((id) => api.delete(`/reports/${id}`)))
      .then(() => { qc.invalidateQueries({ queryKey: ['reports'] }); toast.success(`${selectedIds.size} report(s) deleted`); cancelSelectMode(); })
      .catch(() => toast.error('Failed to delete'))
      .finally(() => setBulkPending(false));
  }

  const { data: reports, isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: () => api.get('/reports').then((r) => r.data.data),
  });

  const { data: semesters } = useQuery({
    queryKey: ['semesters'],
    queryFn: () => api.get('/semesters').then((r) => r.data.data),
  });

  const { data: departments } = useQuery({
    queryKey: ['departments-list'],
    queryFn: () => api.get('/departments', { params: { limit: 100 } }).then((r) => r.data.data),
  });

  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: { title: t('defaultReportTitle'), type: 'workload_summary', format: 'excel', semesterId: '', departmentId: '' },
  });

  const reportType = watch('type');
  const needsDepartment = reportType === 'kafedra_yuklama' || reportType === 'shtat_birligi';

  const generate = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/reports/generate', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reports'] });
      const now = new Date().toLocaleString('en-GB', {
        timeZone: 'Asia/Tashkent',
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
      toast.success(`Report generated at ${now}`);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || t('failedToGenerate')),
  });

  function handleGenerate(data: Record<string, unknown>) {
    const type = data.type as string;
    if ((type === 'kafedra_yuklama' || type === 'shtat_birligi') && !data.departmentId) {
      toast.error('Please select a department for this report type');
      return;
    }
    if ((type === 'kafedra_yuklama' || type === 'shtat_birligi') && !data.semesterId) {
      toast.error('Please select a semester for this report type');
      return;
    }
    generate.mutate(data);
  }

  async function handleDownload(id: string, title: string) {
    setDownloadingId(id);
    try {
      await downloadReportFile(id, title);
    } catch {
      toast.error(t('failedToDownload'));
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {/* Generate Form */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-900 mb-4">{t('generateReport')}</h2>
        <form onSubmit={handleSubmit(handleGenerate)} className="space-y-4">
          <div>
            <label className="label">{t('reportTitle')}</label>
            <input {...register('title')} className="input" />
          </div>
          <div>
            <label className="label">{t('reportType')}</label>
            <select
              value={watch('type')}
              onChange={(e) => setValue('type', e.target.value)}
              className="input"
            >
              <option value="workload_summary">{t('workloadSummary')}</option>
              <option value="overload">{t('overloadReport')}</option>
              <option value="department_comparison">{t('deptComparison')}</option>
              <option value="kafedra_yuklama">Kafedra Yuklama (Department Workload Register)</option>
              <option value="shtat_birligi">Shtat Birligi (Staffing Units Summary)</option>
              <option value="password_directory">Password Directory</option>
            </select>
          </div>

          {/* Department selector — required for kafedra_yuklama and shtat_birligi */}
          {needsDepartment && (
          <div>
            <label className="label">Department <span className="text-red-500">*</span></label>
            <select
              value={watch('departmentId')}
              onChange={(e) => setValue('departmentId', e.target.value)}
              className="input"
            >
              <option value="">Select department…</option>
              {(departments ?? []).map((d: { id: string; name: string }) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          )}

          <div>
            <label className="label">{t('format')}</label>
            <select
              value={watch('format')}
              onChange={(e) => setValue('format', e.target.value)}
              className="input"
            >
              <option value="excel">{t('excelFormat')}</option>
            </select>
          </div>
          <div>
            <label className="label">{t('semester')} {needsDepartment && <span className="text-red-500">*</span>}</label>
            <select
              value={watch('semesterId')}
              onChange={(e) => setValue('semesterId', e.target.value)}
              className="input"
            >
              <option value="">{t('allSemesters')}</option>
              {(semesters?.map((s: { id: string; name: string }) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              )) ?? [])}
            </select>
          </div>
          <button type="submit" disabled={generate.isPending} className="btn-primary w-full flex items-center justify-center gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            {generate.isPending ? t('generating') : t('generateReportBtn')}
          </button>
        </form>
      </div>

      {/* Generated Reports */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">{t('generatedReports')}</h2>
        </div>
        {isLoading ? (
          <p className="text-gray-400 text-sm">{t('loading')}</p>
        ) : reports?.length === 0 ? (
          <p className="text-gray-400 text-sm">{t('noReports')}</p>
        ) : (
          <>
            {showCheckboxes && (
              <div className="flex items-center gap-3 mb-2 px-3 py-2 bg-primary-50 border border-primary-200 rounded-lg">
                <span className="text-sm font-medium text-primary-700">
                  {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select items to delete'}
                </span>
                <div className="flex items-center gap-2 ml-auto">
                  <button onClick={handleBulkDelete} disabled={selectedIds.size === 0 || bulkPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50">
                    <Trash2 className="w-3.5 h-3.5" /> Delete {selectedIds.size > 0 ? selectedIds.size : ''}
                  </button>
                  <button onClick={cancelSelectMode}
                    className="flex items-center gap-1 px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700">
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                </div>
              </div>
            )}
            <div className="space-y-3">
              {reports?.map((r: { id: string; title: string; type: string; format: string; createdAt: string }) => (
                <div key={r.id} className={`flex items-center justify-between p-3 rounded-lg border ${showCheckboxes && selectedIds.has(r.id) ? 'bg-primary-50 border-primary-200' : 'bg-gray-50 border-gray-100'}`}>
                  <div className="flex items-center gap-2 min-w-0 flex-1 mr-3">
                    {showCheckboxes && (
                      <input
                        type="checkbox"
                        checked={selectedIds.has(r.id)}
                        onChange={() => toggleSelect(r.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{r.title}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(r.createdAt).toLocaleString('en-GB', {
                          timeZone: 'Asia/Tashkent',
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })} · XLSX
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDownload(r.id, r.title)}
                      disabled={downloadingId === r.id}
                      title="Download"
                      className="p-2 text-primary-600 hover:bg-primary-50 rounded-md transition-colors flex-shrink-0 disabled:opacity-50"
                    >
                      {downloadingId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => { enterSelectMode(); setSelectedIds(new Set([r.id])); }}
                      title="Delete"
                      className="flex items-center justify-center w-8 h-8 rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
