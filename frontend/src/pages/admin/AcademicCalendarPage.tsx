import { useState, useMemo } from 'react';
import { CustomDropdown } from '../../components/shared/CustomDropdown';
import { Plus, CalendarDays, X, Save, Eye, Maximize2, Search, PenLine } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import toast from 'react-hot-toast';

interface CalendarRow {
  startDate?: string;
  endDate?: string;
  holiday?: string;
  teachingWeek?: string;
  academic?: string;
  highlight?: 'midterm' | 'final' | 'break' | 'marks' | 'summer-vacation' | 'summer-school';
  italic?: boolean;
}

interface CalendarSection {
  term: string;
  termStyle: 'green' | 'yellow';
  rows: CalendarRow[];
}

const calendarData: CalendarSection[] = [
  {
    term: 'Fall Term',
    termStyle: 'green',
    rows: [
      { startDate: 'Mon, Jul 28, 25', academic: 'Administrative Start of the Semester' },
      { startDate: 'Mon, Aug 11, 25', endDate: 'Fri, Aug 15, 25', academic: 'Pre-registration (course selection)', italic: true },
      { startDate: 'Mon, Aug 18, 25', endDate: 'Fri, Aug 22, 25', academic: 'Fall Term Course Registration' },
      { startDate: 'Mon, Aug 25, 25', endDate: 'Fri, Aug 29, 25', academic: 'Re-admission / re-enrollment / return from ALA' },
      { academic: 'Course Retake Application' },
      { startDate: 'Mon, Sep 1, 25', endDate: 'Fri, Sep 5, 25', holiday: 'Sep 1', academic: 'Orientation Week' },
      { startDate: 'Mon, Sep 8, 25', endDate: 'Fri, Sep 12, 25', teachingWeek: 'Week 1', academic: 'Fall Semester Starts\nCourse add/drop period' },
      { startDate: 'Mon, Sep 15, 25', endDate: 'Fri, Sep 19, 25', teachingWeek: 'Week 2' },
      { startDate: 'Mon, Sep 22, 25', endDate: 'Fri, Sep 26, 25', teachingWeek: 'Week 3' },
      { startDate: 'Mon, Sep 29, 25', endDate: 'Fri, Oct 3, 25', holiday: 'Oct 1', teachingWeek: 'Week 4' },
      { startDate: 'Mon, Oct 6, 25', endDate: 'Fri, Oct 10, 25', teachingWeek: 'Week 5', academic: 'Provide Exam Papers for Peer Review' },
      { startDate: 'Mon, Oct 13, 25', endDate: 'Fri, Oct 17, 25', teachingWeek: 'Week 6', academic: 'Announcement of Exams Guideline, Exams and Proctoring Schedule' },
      { startDate: 'Mon, Oct 20, 25', endDate: 'Fri, Oct 24, 25', teachingWeek: 'Week 7', academic: 'Exam Printing Week / Faculty Meeting / Lecture Survey' },
      { startDate: 'Mon, Oct 27, 25', endDate: 'Fri, Oct 31, 25', teachingWeek: 'Week 8', academic: 'Mid Term Exams', highlight: 'midterm' },
      { startDate: 'Mon, Nov 3, 25', endDate: 'Fri, Nov 7, 25', teachingWeek: 'Week 9', academic: 'Mid-Term Marks Submission + Paper Review' },
      { startDate: 'Mon, Nov 10, 25', endDate: 'Fri, Nov 14, 25', teachingWeek: 'Week 10' },
      { startDate: 'Mon, Nov 17, 25', endDate: 'Fri, Nov 21, 25', teachingWeek: 'Week 11' },
      { startDate: 'Mon, Nov 24, 25', endDate: 'Fri, Nov 28, 25', teachingWeek: 'Week 12' },
      { startDate: 'Mon, Dec 1, 25', endDate: 'Fri, Dec 5, 25', teachingWeek: 'Week 13', academic: 'Provide Exam Papers for Peer Review' },
      { startDate: 'Mon, Dec 8, 25', endDate: 'Fri, Dec 12, 25', holiday: 'Dec 8', teachingWeek: 'Week 14', academic: 'Lecture evaluation, Announcement of Exams Guideline, Exams and Proctoring Schedule' },
      { startDate: 'Mon, Dec 15, 25', endDate: 'Fri, Dec 19, 25', teachingWeek: 'Week 15', academic: 'Exam Printing Week / Faculty Meeting / Course Evaluation\nSubmission of Resit Exams' },
      { startDate: 'Mon, Dec 22, 25', endDate: 'Fri, Dec 26, 25', teachingWeek: 'Week 16', academic: 'Final Exams', highlight: 'final' },
      { startDate: 'Mon, Dec 29, 25', endDate: 'Fri, Jan 16, 26', teachingWeek: 'Winter Break', highlight: 'break' },
      { startDate: 'Mon, Dec 29, 25', endDate: 'Fri, Jan 2, 26', teachingWeek: 'Week 17', academic: 'Final Marks Submission / Paper Review', highlight: 'marks' },
      { startDate: 'Mon, Jan 5, 26', endDate: 'Fri, Jan 9, 26', academic: 'Faculty: Course Portfolio / Grade Reports Submission' },
      { startDate: 'Mon, Jan 12, 26', endDate: 'Fri, Jan 16, 26', academic: 'Preparation for Resit Exams / Spring term Pre-registration (course selection)' },
      { startDate: 'Mon, Jan 19, 26', endDate: 'Fri, Jan 23, 26', academic: 'Fall Term Resit Exams\nAdministrative End of Semester' },
    ],
  },
  {
    term: 'Spring Term',
    termStyle: 'green',
    rows: [
      { startDate: 'Mon, Jan 12, 26', academic: 'Administrative Start of Semester' },
      { startDate: 'Mon, Jan 12, 26', endDate: 'Fri, Jan 16, 26', academic: 'Course Retake Application\nSpring Term Course Registration' },
      { startDate: 'Mon, Jan 19, 26', endDate: 'Fri, Jan 23, 26', academic: 'Re-admission / re-enrollment (return from ALA) / External Transfer Admission' },
      { startDate: 'Mon, Jan 26, 26', endDate: 'Fri, Jan 30, 26', teachingWeek: 'Week 1', academic: 'Spring Semester Starts\nCourse add/drop period' },
      { startDate: 'Mon, Feb 2, 26', endDate: 'Fri, Feb 6, 26', teachingWeek: 'Week 2' },
      { startDate: 'Mon, Feb 9, 26', endDate: 'Fri, Feb 13, 26', teachingWeek: 'Week 3' },
      { startDate: 'Mon, Feb 16, 26', endDate: 'Fri, Feb 20, 26', teachingWeek: 'Week 4' },
      { startDate: 'Mon, Feb 23, 26', endDate: 'Fri, Feb 27, 26', teachingWeek: 'Week 5', academic: 'Provide Exam Papers for Peer Review' },
      { startDate: 'Mon, Mar 2, 26', endDate: 'Fri, Mar 6, 26', teachingWeek: 'Week 6' },
      { startDate: 'Mon, Mar 9, 26', endDate: 'Fri, Mar 13, 26', holiday: '*', teachingWeek: 'Week 7', academic: 'Exam Printing Week / Faculty Meeting / Lecture Survey' },
      { startDate: 'Mon, Mar 16, 26', endDate: 'Fri, Mar 20, 26', teachingWeek: 'Week 8', academic: 'Mid Term Exams', highlight: 'midterm' },
      { startDate: 'Mon, Mar 23, 26', endDate: 'Fri, Mar 27, 26', holiday: '*', teachingWeek: 'Week 9', academic: 'Mid-Term Marks Submission + Paper Review / Application for Program Change' },
      { startDate: 'Mon, Mar 30, 26', endDate: 'Fri, Apr 3, 26', teachingWeek: 'Week 10' },
      { startDate: 'Mon, Apr 6, 26', endDate: 'Fri, Apr 10, 26', teachingWeek: 'Week 11' },
      { startDate: 'Mon, Apr 13, 26', endDate: 'Fri, Apr 17, 26', teachingWeek: 'Week 12' },
      { startDate: 'Mon, Apr 20, 26', endDate: 'Fri, Apr 24, 26', teachingWeek: 'Week 13', academic: 'Provide Exam Papers for Peer Review' },
      { startDate: 'Mon, Apr 27, 26', endDate: 'Fri, May 1, 26', teachingWeek: 'Week 14', academic: 'Lecture evaluation period, Announcement of Exams Guideline, Exams and Proctoring Schedule' },
      { startDate: 'Mon, May 4, 26', endDate: 'Fri, May 8, 26', teachingWeek: 'Week 15', academic: 'Exam Printing Week / Faculty Meeting\nSubmission of Resit Exams' },
      { startDate: 'Mon, May 11, 26', endDate: 'Fri, May 15, 26', teachingWeek: 'Week 16', academic: 'Final Exams', highlight: 'final' },
      { startDate: 'Mon, May 18, 26', endDate: 'Fri, May 22, 26', teachingWeek: 'Week 17', academic: 'Final Marks Submission / Paper Review', highlight: 'marks' },
      { startDate: 'Mon, May 25, 26', endDate: 'Fri, May 29, 26', academic: 'Faculty: Course Portfolio / Reports Submission\nPreparation for Resit Exams' },
      { startDate: 'Mon, Jun 1, 26', endDate: 'Fri, Jun 5, 26', academic: 'Spring Term Resit Exams' },
      { startDate: 'Mon, Jun 8, 26', endDate: 'Fri, Jun 12, 26', academic: 'Grading the Resit Exams, Grade announcements' },
      { startDate: 'Wed, Jul 15, 26', endDate: 'Wed, Aug 5, 26', academic: 'Program Change Application and Resolution\nExternal Transfer Application and Resolution' },
    ],
  },
  {
    term: 'Summer Program',
    termStyle: 'yellow',
    rows: [
      { startDate: 'Mon, May 25, 26', endDate: 'Mon, Aug 31, 26', teachingWeek: 'Summer Vacation', highlight: 'summer-vacation' },
      { startDate: 'Mon, Jun 15, 26', endDate: 'Wed, Jul 15, 26', teachingWeek: 'Summer School', highlight: 'summer-school' },
    ],
  },
];

function getHighlightStyle(highlight?: CalendarRow['highlight']): string {
  switch (highlight) {
    case 'midterm':
      return 'bg-primary-50/80';
    case 'final':
      return 'bg-primary-100/60';
    case 'break':
      return 'bg-amber-50/80';
    case 'marks':
      return 'bg-sky-50/60';
    case 'summer-vacation':
      return 'bg-orange-50/60';
    case 'summer-school':
      return 'bg-yellow-50/60';
    default:
      return '';
  }
}

function getTermCellClass(termStyle: 'green' | 'yellow'): string {
  return termStyle === 'green'
    ? 'bg-primary-700 text-white'
    : 'bg-amber-400 text-gray-900';
}

const ACADEMIC_YEARS = ['2023–2024', '2024–2025', '2025–2026', '2026–2027', '2027–2028'];

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function formatCalendarDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const dayName = DAY_NAMES[date.getDay()];
  const monthName = MONTH_NAMES[date.getMonth()];
  const day = date.getDate();
  const yearSuffix = String(date.getFullYear()).slice(-2);
  return `${dayName}, ${monthName} ${day}, ${yearSuffix}`;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const TEACHING_WEEK_OPTIONS = [
  '',
  ...Array.from({ length: 20 }, (_, i) => `Week ${i + 1}`),
  'Winter Break',
  'Summer Break',
];

/* ── Edit Calendar Modal ───────────────────────────────────────── */
function EditCalendarModal({
  calendarStore,
  onClose,
  onCreateYear,
  onAddEntry,
}: {
  calendarStore: Record<string, CalendarSection[]>;
  onClose: () => void;
  onCreateYear: (year: string) => void;
  onAddEntry: (year: string, term: string, entry: CalendarRow) => void;
}) {
  const existingYears = Object.keys(calendarStore);
  const availableYears = ACADEMIC_YEARS.filter((y) => !existingYears.includes(y));

  const [year, setYear] = useState(existingYears[0] || '2025–2026');
  const [showCreateYear, setShowCreateYear] = useState(false);
  const [newYear, setNewYear] = useState(availableYears[0] || '');

  const [term, setTerm] = useState('');
  const [isPeriod, setIsPeriod] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [holidayMonth, setHolidayMonth] = useState('');
  const [holidayDay, setHolidayDay] = useState('');
  const [teachingWeek, setTeachingWeek] = useState('');
  const [academic, setAcademic] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!term || !startDate) {
      toast.error('Term and start date are required');
      return;
    }

    const holiday = holidayMonth && holidayDay
      ? `${holidayMonth} ${holidayDay}`
      : undefined;

    const entry: CalendarRow = {
      startDate: formatCalendarDate(startDate),
      endDate: isPeriod && endDate ? formatCalendarDate(endDate) : undefined,
      holiday,
      teachingWeek: teachingWeek || undefined,
      academic: academic || undefined,
    };

    onAddEntry(year, term, entry);
    toast.success('Calendar entry saved');
    onClose();
  };

  const handleCreateYear = () => {
    if (!newYear) return;
    onCreateYear(newYear);
    setYear(newYear);
    setShowCreateYear(false);
    toast.success(`Calendar for ${newYear} created`);
  };

  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500';
  const labelCls = 'block text-xs font-semibold text-gray-600 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <PenLine className="w-4 h-4 text-primary-600" />
            <h2 className="font-bold text-gray-900">Edit Calendar</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {/* Academic Year */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={labelCls}>Academic Year *</label>
              {availableYears.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowCreateYear((v) => !v)}
                  className="text-xs font-medium text-primary-600 hover:text-primary-700"
                >
                  {showCreateYear ? 'Cancel' : '+ Create New Calendar'}
                </button>
              )}
            </div>

            {showCreateYear ? (
              <div className="flex items-center gap-2">
                <CustomDropdown
                  value={newYear}
                  onChange={(v) => setNewYear(v)}
                  options={availableYears}
                  className={`${inputCls} flex-1`}
                />
                <button
                  type="button"
                  onClick={handleCreateYear}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Create
                </button>
              </div>
            ) : (
              <CustomDropdown
                value={year}
                onChange={(v) => setYear(v)}
                options={existingYears}
                className={inputCls}
              />
            )}
          </div>

          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Add Entry</p>

            {/* Term */}
            <div>
              <label className={labelCls}>Term *</label>
              <CustomDropdown
                value={term}
                onChange={(v) => setTerm(v)}
                options={[
                  { value: '', label: 'Select term…' },
                  { value: 'Fall Term', label: 'Fall Term' },
                  { value: 'Spring Term', label: 'Spring Term' },
                  { value: 'Summer Program', label: 'Summer Program' },
                ]}
                className={inputCls}
              />
            </div>
          </div>

          {/* Dates */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={labelCls}>Dates *</label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPeriod}
                  onChange={(e) => setIsPeriod(e.target.checked)}
                  className="w-3.5 h-3.5 rounded accent-primary-600"
                />
                <span className="text-xs text-gray-500">Period (start → end)</span>
              </label>
            </div>
            <div className={`grid gap-2 ${isPeriod ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <div>
                <span className="text-[10px] text-gray-400 mb-0.5 block">{isPeriod ? 'Start date' : 'Date'}</span>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} required />
              </div>
              {isPeriod && (
                <div>
                  <span className="text-[10px] text-gray-400 mb-0.5 block">End date</span>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} min={startDate} />
                </div>
              )}
            </div>
          </div>

          {/* Holidays */}
          <div>
            <label className={labelCls}>Holidays</label>
            <div className="grid grid-cols-2 gap-2">
              <CustomDropdown
                value={holidayMonth}
                onChange={(v) => setHolidayMonth(v)}
                options={[{ value: '', label: 'Month' }, ...MONTHS.map((m) => ({ value: m, label: m }))]}
                className={inputCls}
              />
              <CustomDropdown
                value={holidayDay}
                onChange={(v) => setHolidayDay(v)}
                options={[
                  { value: '', label: 'Day' },
                  ...Array.from({ length: 31 }, (_, i) => i + 1).map((d) => ({ value: String(d), label: String(d) })),
                ]}
                className={inputCls}
              />
            </div>
          </div>

          {/* Teaching Weeks */}
          <div>
            <label className={labelCls}>Teaching Week</label>
            <CustomDropdown
              value={teachingWeek}
              onChange={(v) => setTeachingWeek(v)}
              options={TEACHING_WEEK_OPTIONS.map((w) => ({ value: w, label: w || '— None —' }))}
              className={inputCls}
            />
          </div>

          {/* Academic */}
          <div>
            <label className={labelCls}>Academic</label>
            <textarea
              value={academic}
              onChange={(e) => setAcademic(e.target.value)}
              rows={3}
              placeholder="Describe the academic event or activity…"
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">Cancel</button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" /> Save Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Shared calendar table ─────────────────────────────────────── */
function CalendarTable({ data, compact = false }: { data: CalendarSection[]; compact?: boolean }) {
  const fontSize = compact ? 'text-[11px]' : 'text-sm';

  const thCls = `px-2 py-2.5 text-center font-bold text-gray-500 uppercase text-[9px] whitespace-nowrap border-r border-gray-200`;

  return (
    <table className={`w-full ${fontSize} border-collapse border border-gray-200`}>
      <thead className="bg-gray-50 border-b-2 border-gray-200 sticky top-0 z-10">
        <tr>
          <th className={`${thCls} w-14`}>Term</th>
          <th className={`${thCls} w-[200px]`}>Dates</th>
          <th className={`${thCls} w-20`}>Holidays</th>
          <th className={`${thCls} w-28`}>Teaching Weeks</th>
          <th className={thCls}>Academic</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {data.map((section) =>
          section.rows.map((row, rowIndex) => {
            const highlightStyle = getHighlightStyle(row.highlight);
            const academicLines = row.academic ? row.academic.split('\n') : [];
            const multiLine = academicLines.length > 1;

            return (
              <tr
                key={`${section.term}-${rowIndex}`}
                className={`border-b border-gray-200 hover:bg-gray-50/50 transition-colors ${highlightStyle}`}
              >
                {rowIndex === 0 && (
                  <td
                    rowSpan={section.rows.length}
                    className={`border-r border-gray-200 text-center align-middle px-1 py-2 font-bold uppercase text-[11px] tracking-wide ${getTermCellClass(section.termStyle)}`}
                    style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                  >
                    {section.term}
                  </td>
                )}
                <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">
                  {row.startDate && row.endDate ? (
                    <div className="flex items-center justify-center gap-1.5">
                      <span>{row.startDate}</span>
                      <span className="text-gray-300 text-[10px]">→</span>
                      <span>{row.endDate}</span>
                    </div>
                  ) : (
                    <span>{row.startDate || '—'}</span>
                  )}
                </td>
                <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">
                  {row.holiday && (
                    <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-red-50 text-red-600 text-[10px] font-semibold">
                      {row.holiday}
                    </span>
                  )}
                </td>
                <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">
                  {row.teachingWeek && (
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                        row.teachingWeek.includes('Week')
                          ? 'bg-primary-50 text-primary-700'
                          : row.teachingWeek.includes('Break') || row.teachingWeek.includes('Vacation')
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {row.teachingWeek}
                    </span>
                  )}
                </td>
                <td className="px-2 py-2 text-[11px] text-gray-700 text-left border-r border-gray-200">
                  {multiLine ? (
                    <div className={`space-y-0.5 ${row.italic ? 'italic' : ''}`}>
                      {academicLines.map((line, i) => (
                        <p key={i} className="leading-snug">
                          {line}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <span className={row.italic ? 'italic' : ''}>
                      {academicLines[0] ?? ''}
                    </span>
                  )}
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}

function Footnotes() {
  return (
    <div className="mt-4 space-y-1.5 border-t border-gray-200 pt-3">
      <p className="text-[10px] text-gray-500 leading-snug italic">
        * all holidays that are marked on the state calendar are considered day offs. However, the missed classes will be covered as make-up classes or during the remaining classes in the corresponding semester
      </p>
      <p className="text-[10px] text-gray-500 leading-snug italic">
        * the scheduled dates above are subject to change by the university administration
      </p>
    </div>
  );
}

/* ── Full-screen view modal ────────────────────────────────────── */
function FullScreenModal({ year, data, onClose }: { year: string; data: CalendarSection[]; onClose: () => void }) {
  const startYear = year.split('–')[0];
  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <Maximize2 className="w-4 h-4 text-primary-600" />
          <div>
            <h2 className="text-base font-bold text-gray-900">Academic Calendar {year}</h2>
            <p className="text-xs text-gray-400">Approved by the Academic Council in June, {startYear}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-700 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 transition-colors"
        >
          <X className="w-4 h-4 text-primary-600" /> Close
        </button>
      </div>

      {/* Scrollable table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <CalendarTable data={data} />
        <Footnotes />
      </div>
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────────────── */
export default function AcademicCalendarPage({ readOnly = false }: { readOnly?: boolean }) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [selectedYear, setSelectedYear] = useState('2025–2026');
  const [searchQuery, setSearchQuery] = useState('');
  const [calendarStore, setCalendarStore] = useState<Record<string, CalendarSection[]>>({
    '2025–2026': calendarData,
  });

  const startYear = selectedYear.split('–')[0];
  const yearData = calendarStore[selectedYear] || [];

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return yearData;
    const q = searchQuery.toLowerCase();
    return yearData
      .map((section) => ({
        ...section,
        rows: section.rows.filter((row) => {
          const text = [
            row.startDate,
            row.endDate,
            row.holiday,
            row.teachingWeek,
            row.academic,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          return text.includes(q);
        }),
      }))
      .filter((section) => section.rows.length > 0);
  }, [searchQuery, yearData]);

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex flex-col items-center px-6 py-4 border-b border-gray-200 flex-shrink-0 gap-3">
        <div className="w-full">
          <PageHeader icon={<CalendarDays />} title="Academic Calendar" subtitle={`Academic Year ${selectedYear} · Approved by the Academic Council in June, ${startYear}`} />
        </div>
        <div className="flex items-center justify-start gap-2 flex-wrap w-full">
          {/* Year filter */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-sm text-gray-500">Year:</span>
            <CustomDropdown
              value={selectedYear}
              onChange={(v) => setSelectedYear(v)}
              options={ACADEMIC_YEARS}
              size="md"
              noCustom
              className="w-36"
            />
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[140px] max-w-[224px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search…"
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Clear
            </button>
          )}

          {/* View Table */}
          <button
            onClick={() => setShowFullScreen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-primary-700 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 transition-colors"
          >
            <Eye className="w-4 h-4 text-primary-600" />
            View Table
          </button>
          {/* Edit Calendar */}
          {!readOnly && <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
          >
            <PenLine className="w-4 h-4" />
            Edit Calendar
          </button>}
        </div>
      </div>

      {/* Table container */}
      <div className="flex-1 overflow-x-auto overflow-y-auto px-6 py-4" style={{ maxHeight: 'calc(100vh - 220px)' }}>
        {yearData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <CalendarDays className="w-10 h-10 mb-3 text-gray-300" />
            <p className="font-medium text-gray-500">No calendar data available</p>
            <p className="text-sm mt-1">
              Academic Year {selectedYear} has not been created yet.
            </p>
            {!readOnly && <button
              onClick={() => setShowEditModal(true)}
              className="mt-3 flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 transition-colors"
            >
              <PenLine className="w-4 h-4" />
              Create Calendar for {selectedYear}
            </button>}
          </div>
        ) : filteredData.length > 0 ? (
          <>
            <CalendarTable data={filteredData} compact />
            <Footnotes />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Search className="w-10 h-10 mb-3 text-gray-300" />
            <p className="font-medium text-gray-500">No results found</p>
            <p className="text-sm mt-1">Try adjusting your search query</p>
          </div>
        )}
      </div>

      {!readOnly && showEditModal && (
        <EditCalendarModal
          calendarStore={calendarStore}
          onClose={() => setShowEditModal(false)}
          onCreateYear={(year) => {
            setCalendarStore((prev) => {
              if (prev[year]) return prev;
              return { ...prev, [year]: [] };
            });
            setSelectedYear(year);
          }}
          onAddEntry={(year, term, entry) => {
            setCalendarStore((prev) => {
              const sections = prev[year] ? [...prev[year]] : [];
              const sectionIndex = sections.findIndex((s) => s.term === term);
              if (sectionIndex >= 0) {
                sections[sectionIndex] = {
                  ...sections[sectionIndex],
                  rows: [...sections[sectionIndex].rows, entry],
                };
              } else {
                const termStyle: 'green' | 'yellow' =
                  term === 'Summer Program' ? 'yellow' : 'green';
                sections.push({ term, termStyle, rows: [entry] });
              }
              return { ...prev, [year]: sections };
            });
          }}
        />
      )}
      {showFullScreen && (
        <FullScreenModal
          year={selectedYear}
          data={filteredData}
          onClose={() => setShowFullScreen(false)}
        />
      )}
    </div>
  );
}
