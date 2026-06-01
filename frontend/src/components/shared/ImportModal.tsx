import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, X, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, Table2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../../api/client';

interface ImportResult { created: number; updated: number; skipped: number; errors: string[]; }
interface ColMatch { excelHeader: string; appField: string; appLabel: string; }
interface ImportModalProps { type: 'faculty' | 'courses'; onClose: () => void; onSuccess?: () => void; }

const COURSE_HEADER_MAP: Record<string, { field: string; label: string }> = {
  'course title':    { field: 'title',               label: 'Title' },
  'coursetitle':     { field: 'title',               label: 'Title' },
  'title':           { field: 'title',               label: 'Title' },
  'course code':     { field: 'courseCode',           label: 'Course Code' },
  'coursecode':      { field: 'courseCode',           label: 'Course Code' },
  'code':            { field: 'courseCode',           label: 'Course Code' },
  'subject board':   { field: 'subjectBoard',         label: 'Subject Board' },
  'subjectboard':    { field: 'subjectBoard',         label: 'Subject Board' },
  'course type':     { field: 'type',                 label: 'Type' },
  'coursetype':      { field: 'type',                 label: 'Type' },
  'type':            { field: 'type',                 label: 'Type' },
  'lecture hours':   { field: 'weeklyLectureHours',   label: 'Lecture Hrs/wk' },
  'lecturehours':    { field: 'weeklyLectureHours',   label: 'Lecture Hrs/wk' },
  'lecture':         { field: 'weeklyLectureHours',   label: 'Lecture Hrs/wk' },
  'tutorial hours':  { field: 'weeklyTutorialHours',  label: 'Tutorial Hrs/wk' },
  'tutorialhours':   { field: 'weeklyTutorialHours',  label: 'Tutorial Hrs/wk' },
  'tutorial':        { field: 'weeklyTutorialHours',  label: 'Tutorial Hrs/wk' },
  'practical hours': { field: 'weeklyTutorialHours',  label: 'Tutorial Hrs/wk' },
  'lab hours':       { field: 'weeklyLabHours',       label: 'Lab Hrs/wk' },
  'labhours':        { field: 'weeklyLabHours',       label: 'Lab Hrs/wk' },
  'lab':             { field: 'weeklyLabHours',       label: 'Lab Hrs/wk' },
  'ects credit':     { field: 'ectsCredits',          label: 'ECTS' },
  'ects credits':    { field: 'ectsCredits',          label: 'ECTS' },
  'ects':            { field: 'ectsCredits',          label: 'ECTS' },
  'us credit':       { field: 'usCreditHours',        label: 'US Credits' },
  'us credits':      { field: 'usCreditHours',        label: 'US Credits' },
  'credit units':    { field: 'creditUnits',          label: 'Credit Units' },
  'credits':         { field: 'creditUnits',          label: 'Credit Units' },
  'department':      { field: 'department',           label: 'Department' },
  'dept':            { field: 'department',           label: 'Department' },
  'degree':          { field: 'degreeLevel',          label: 'Degree' },
  'semester':        { field: 'semesterOffered',      label: 'Semester' },
  'semester offered':{ field: 'semesterOffered',      label: 'Semester' },
  'term':            { field: 'semesterOffered',      label: 'Semester' },
  'prerequisite':    { field: 'prerequisites',        label: 'Prerequisites' },
  'prerequisites':   { field: 'prerequisites',        label: 'Prerequisites' },
  'new description': { field: 'description',          label: 'Description' },
  'description':     { field: 'description',          label: 'Description' },
  'textbook':        { field: 'textbook',             label: 'Textbook' },
  'course duration': { field: 'courseDuration',       label: 'Duration' },
  'duration':        { field: 'courseDuration',       label: 'Duration' },
  'accreditation subject area': { field: 'accreditationArea', label: 'Accreditation' },
  'accreditation':   { field: 'accreditationArea',    label: 'Accreditation' },
  'part of term':    { field: 'partOfTerm',           label: 'Part of Term' },
  'part-of term:':   { field: 'partOfTerm',           label: 'Part of Term' },
  'format:':         { field: 'format',               label: 'Format' },
  'format':          { field: 'format',               label: 'Format' },
  'grade status':    { field: 'gradeStatus',          label: 'Grade Status' },
  'grade status:':   { field: 'gradeStatus',          label: 'Grade Status' },
  'maximum enrollment':  { field: 'maxStudents',      label: 'Max Enroll' },
  'maximum enrollment:': { field: 'maxStudents',      label: 'Max Enroll' },
  'max enrollment':  { field: 'maxStudents',          label: 'Max Enroll' },
  'seats avail':     { field: 'seatsAvailable',       label: 'Seats' },
  'seats avail:':    { field: 'seatsAvailable',       label: 'Seats' },
  'seats available': { field: 'seatsAvailable',       label: 'Seats' },
  'waitlist total':  { field: 'waitlistTotal',        label: 'Waitlist' },
  'waitlist total:': { field: 'waitlistTotal',        label: 'Waitlist' },
  'last day to register':  { field: 'lastDayToRegister', label: 'Last Register' },
  'last date to register': { field: 'lastDayToRegister', label: 'Last Register' },
  'last date to add/drop': { field: 'lastDayToAddDrop',  label: 'Last Add/Drop' },
  'last day to add/drop':  { field: 'lastDayToAddDrop',  label: 'Last Add/Drop' },
  'instructor info': { field: 'instructorInfo',       label: 'Instructor' },
  'instructor':      { field: 'instructorInfo',       label: 'Instructor' },
  'meeting info':    { field: 'meetingInfo',          label: 'Meeting' },
  'meeting':         { field: 'meetingInfo',          label: 'Meeting' },
  'notes':           { field: 'notes',                label: 'Notes' },
  'outcome 1':  { field: 'learningOutcome1',  label: 'Outcome 1' },
  'outcome 2':  { field: 'learningOutcome2',  label: 'Outcome 2' },
  'outcome 3':  { field: 'learningOutcome3',  label: 'Outcome 3' },
  'outcome 4':  { field: 'learningOutcome4',  label: 'Outcome 4' },
  'outcome 5':  { field: 'learningOutcome5',  label: 'Outcome 5' },
  'outcome 6':  { field: 'learningOutcome6',  label: 'Outcome 6' },
  'outcome 7':  { field: 'learningOutcome7',  label: 'Outcome 7' },
  'outcome 8':  { field: 'learningOutcome8',  label: 'Outcome 8' },
  'outcome 9':  { field: 'learningOutcome9',  label: 'Outcome 9' },
  'outcome 10': { field: 'learningOutcome10', label: 'Outcome 10' },
  'outcome 11': { field: 'learningOutcome11', label: 'Outcome 11' },
  'outcome 12': { field: 'learningOutcome12', label: 'Outcome 12' },
  'outcome 13': { field: 'learningOutcome13', label: 'Outcome 13' },
  'outcome 14': { field: 'learningOutcome14', label: 'Outcome 14' },
};

function analyseExcel(file: File): Promise<{ sheetName: string; matched: ColMatch[]; unmatched: string[]; rowCount: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: 'array' });
        const sheetName =
          wb.SheetNames.find((n) => n.toLowerCase().replace(/\s/g, '') === 'coursecatalog') ??
          wb.SheetNames[0];
        if (!sheetName) { reject(new Error('No sheet found')); return; }
        const rows = XLSX.utils.sheet_to_json<string[]>(wb.Sheets[sheetName], { header: 1 }) as string[][];
        if (!rows.length) { reject(new Error('Sheet is empty')); return; }

        const matched: ColMatch[] = [];
        const unmatched: string[] = [];
        const seen = new Set<string>();

        for (const raw of rows[0]) {
          if (!raw?.toString().trim()) continue;
          const key = raw.toString().toLowerCase().trim().replace(/\s+/g, ' ');
          const m = COURSE_HEADER_MAP[key];
          if (m && !seen.has(m.field)) {
            matched.push({ excelHeader: raw.toString(), appField: m.field, appLabel: m.label });
            seen.add(m.field);
          } else if (!m) {
            unmatched.push(raw.toString());
          }
        }
        resolve({ sheetName, matched, unmatched, rowCount: rows.length - 1 });
      } catch (err: any) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export default function ImportModal({ type, onClose, onSuccess }: ImportModalProps) {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile]             = useState<File | null>(null);
  const [loading, setLoading]       = useState(false);
  const [analysing, setAnalysing]   = useState(false);
  const [result, setResult]         = useState<ImportResult | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [preview, setPreview]       = useState<{ sheetName: string; matched: ColMatch[]; unmatched: string[]; rowCount: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const endpoint = type === 'faculty' ? '/import/faculty' : '/import/courses';
  const title    = type === 'faculty' ? t('import.facultyTitle') : t('import.coursesTitle');

  const handleFile = useCallback(async (f: File) => {
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext ?? '')) { setError(t('import.invalidFormat')); return; }
    setFile(f); setResult(null); setError(null); setPreview(null);
    if (type === 'courses') {
      setAnalysing(true);
      try { setPreview(await analyseExcel(f)); }
      catch (err: any) { setError(`Could not read file: ${err.message}`); }
      finally { setAnalysing(false); }
    }
  }, [t, type]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const f = e.dataTransfer.files[0]; if (f) handleFile(f);
  }, [handleFile]);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true); setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await api.post(endpoint, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(res.data.data as ImportResult);
      onSuccess?.();
    } catch (err: any) {
      setError(err.response?.data?.message ?? err.message ?? t('import.uploadError'));
    } finally { setLoading(false); }
  };

  const reset = () => { setFile(null); setResult(null); setError(null); setPreview(null); if (inputRef.current) inputRef.current.value = ''; };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!result && (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'}`}
            >
              <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              {analysing ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 size={36} className="text-primary-500 animate-spin" />
                  <p className="text-sm text-gray-600">Analysing column headers…</p>
                </div>
              ) : file ? (
                <div className="flex flex-col items-center gap-2">
                  <FileSpreadsheet size={36} className="text-green-500" />
                  <p className="font-medium text-gray-800 text-sm">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                  <button onClick={(e) => { e.stopPropagation(); reset(); }} className="text-xs text-red-500 hover:underline">Remove file</button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload size={36} className="text-gray-400" />
                  <p className="font-medium text-gray-600">{t('import.dropHere')}</p>
                  <p className="text-sm text-gray-400">{t('import.orClick')}</p>
                  <p className="text-xs text-gray-400">.xlsx · .xls · .csv</p>
                </div>
              )}
            </div>
          )}

          {/* Column matching preview */}
          {preview && !result && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-primary-50 rounded-lg">
                <Table2 size={16} className="text-primary-600 flex-shrink-0" />
                <span className="text-xs text-primary-700">
                  Sheet <strong>"{preview.sheetName}"</strong> · <strong>{preview.rowCount}</strong> rows ·{' '}
                  <strong className="text-green-700">{preview.matched.length}</strong> columns matched
                  {preview.unmatched.length > 0 && <span className="text-gray-500"> · {preview.unmatched.length} unrecognised</span>}
                </span>
              </div>

              {preview.matched.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Matched columns</p>
                  <div className="border border-gray-200 rounded-lg overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-[11px] border-collapse">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr className="divide-x divide-gray-200">
                          <th className="px-3 py-1.5 text-left font-semibold text-gray-500">Excel Header</th>
                          <th className="px-3 py-1.5 text-left font-semibold text-gray-500">App Column</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {preview.matched.map((m) => (
                          <tr key={m.appField} className="divide-x divide-gray-100">
                            <td className="px-3 py-1 text-gray-600 font-mono">{m.excelHeader}</td>
                            <td className="px-3 py-1 text-green-700 font-medium">
                              <span className="flex items-center gap-1"><CheckCircle size={11} className="text-green-500" />{m.appLabel}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {preview.unmatched.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Unrecognised (skipped)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {preview.unmatched.map((h) => (
                      <span key={h} className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-mono">{h}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {type === 'faculty' && !result && !file && (
            <div className="bg-primary-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-primary-700 mb-1">{t('import.expectedColumns')}</p>
              <p className="text-xs text-primary-600">employeeId · lastName · firstName · email · department · position · degree · employmentType · maxWeeklyHours</p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg text-sm text-red-700">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" /><span>{error}</span>
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600"><CheckCircle size={20} /><span className="font-semibold">{t('import.complete')}</span></div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-green-50 rounded-lg p-3 text-center"><p className="text-2xl font-bold text-green-600">{result.created}</p><p className="text-xs text-green-700">{t('import.created')}</p></div>
                <div className="bg-primary-50 rounded-lg p-3 text-center"><p className="text-2xl font-bold text-primary-600">{result.updated}</p><p className="text-xs text-primary-700">{t('import.updated')}</p></div>
                <div className="bg-gray-50 rounded-lg p-3 text-center"><p className="text-2xl font-bold text-gray-500">{result.skipped}</p><p className="text-xs text-gray-500">{t('import.skipped')}</p></div>
              </div>
              {result.errors.length > 0 && (
                <div className="bg-amber-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                  <p className="text-xs font-semibold text-amber-700 mb-2">{t('import.errors', { count: result.errors.length })}</p>
                  <ul className="space-y-1">{result.errors.map((e, i) => (<li key={i} className="text-xs text-amber-700 flex gap-1"><span>•</span><span>{e}</span></li>))}</ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 pb-5 pt-3 border-t flex justify-end gap-3 flex-shrink-0">
          {result ? (
            <>
              <button onClick={reset} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">{t('import.importAnother')}</button>
              <button onClick={onClose} className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700">{t('common.close')}</button>
            </>
          ) : (
            <>
              <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">{t('common.cancel')}</button>
              <button
                onClick={handleUpload}
                disabled={!file || loading || analysing || (type === 'courses' && !!preview && preview.matched.length === 0)}
                className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                {loading ? t('import.uploading') : (type === 'courses' && preview ? `Import ${preview.rowCount} rows (${preview.matched.length} cols)` : t('import.upload'))}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
