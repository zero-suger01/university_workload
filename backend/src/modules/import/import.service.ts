// @ts-nocheck
import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';
import { prisma } from '../../config/database';

// ─── Position Mapping ─────────────────────────────────────────────────────────
// Maps any spelling/language variant of a position to AcademicPosition enum
export function mapPosition(raw: string): string | null {
  const s = (raw ?? '').toLowerCase().trim()
    .replace(/['']/g, "'")
    .replace(/\s+/g, ' ');

  // PROFESSOR group
  if (/^(professor|prof\.|profess|профессор|professor|вп|visiting professor|adjunct)/.test(s))
    return 'PROFESSOR';

  // ASSOCIATE_PROFESSOR (Dotsent)
  if (/^(associate professor|доцент|dotsent|docent|д\.с\.|assoc\.?\s*prof)/i.test(s))
    return 'ASSOCIATE_PROFESSOR';

  // ASSISTANT_PROFESSOR (kichik dotsent)
  if (/^(assistant professor|assist\.?\s*prof|фд|фд\.)/i.test(s))
    return 'ASSISTANT_PROFESSOR';

  // SENIOR_LECTURER (Katta o'qituvchi)
  if (/^(senior lecturer|katta o['']qituvchi|старший преподаватель|ст\.?\s*пр|k\.o['']\.?)/i.test(s))
    return 'SENIOR_LECTURER';

  // LECTURER
  if (/^(lecturer|o['']qituvchi|преподаватель|пр\.|lektor|лектор)/.test(s))
    return 'LECTURER';

  // TEACHING_ASSISTANT / ASSISTENT
  if (/^(teaching assistant|assistent|асс\.|ассистент|ta\b|t\.a\.)/.test(s))
    return 'TEACHING_ASSISTANT';

  // LAB_ASSISTANT
  if (/^(lab assistant|laborant|лаборант|lab\.\s*ass)/.test(s))
    return 'LAB_ASSISTANT';

  return null;
}

// ─── Employment Type Mapping ──────────────────────────────────────────────────
export function mapEmploymentType(raw: string): string {
  const s = (raw ?? '').toLowerCase().trim();
  if (/part.?time|0\.5|yarim|неполн|совмест|совм/.test(s)) return 'PART_TIME';
  return 'FULL_TIME';
}

// ─── Department Name Matching ─────────────────────────────────────────────────
// Returns the DB department id that best matches the given name string.
// Uses case-insensitive exact match first, then partial contains.
export async function resolveDepartmentId(
  raw: string,
  deptCache: Map<string, string>,
): Promise<string | null> {
  if (!raw) return null;
  const normalized = raw.trim().toLowerCase();

  // 1. Exact match
  for (const [id, name] of deptCache) {
    if (name === normalized) return id;
  }

  // 2. Partial match: db name contains excel value OR excel value contains db name
  for (const [id, name] of deptCache) {
    if (name.includes(normalized) || normalized.includes(name)) return id;
  }

  // 3. Word-level match: all words of the shorter string appear in the longer
  const normWords = normalized.split(/\s+/);
  for (const [id, name] of deptCache) {
    const nameWords = name.split(/\s+/);
    const shorter = normWords.length <= nameWords.length ? normWords : nameWords;
    const longer  = normWords.length <= nameWords.length ? nameWords : normWords;
    if (shorter.every(w => longer.some(lw => lw.includes(w) || w.includes(lw)))) return id;
  }

  // 4. DB lookup (case-insensitive contains)
  const dept = await prisma.department.findFirst({
    where: { OR: [
      { name: { contains: raw.trim(), mode: 'insensitive' } },
      { code: { equals: raw.trim().toUpperCase() } },
    ] },
  });
  if (dept) {
    deptCache.set(dept.id, dept.name.toLowerCase());
    return dept.id;
  }
  return null;
}

// ─── Parse helper: read a row value safely ────────────────────────────────────
function cellStr(row: ExcelJS.Row, col: number): string {
  const v = row.getCell(col).value;
  if (v === null || v === undefined) return '';
  if (typeof v === 'object' && 'text' in (v as any)) return String((v as any).text);
  if (typeof v === 'object' && 'result' in (v as any)) return String((v as any).result);
  return String(v).trim();
}
function cellNum(row: ExcelJS.Row, col: number): number {
  const v = row.getCell(col).value;
  const n = parseFloat(String(v ?? '0'));
  return isNaN(n) ? 0 : n;
}

// ─── Faculty Import ───────────────────────────────────────────────────────────
// Expected columns (1-based, flexible header row):
//   A: employeeId | B: lastName | C: firstName | D: email
//   E: department | F: position | G: degree | H: employmentType
//   I: maxWeeklyHours | J: phoneNumber
//
// Auto-detects header row (row with "employeeId" or "id" in first cell).
// Returns { created, updated, skipped, errors[] }
export async function importFaculty(buffer: Buffer): Promise<ImportResult> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const sh = wb.worksheets[0];
  if (!sh) throw new Error('No worksheet found in file');

  // Build department cache
  const allDepts = await prisma.department.findMany({ select: { id: true, name: true } });
  const deptCache = new Map(allDepts.map((d) => [d.id, d.name.toLowerCase()]));

  // Find header row (scan first 5 rows)
  let headerRow = 1;
  let colMap: Record<string, number> = {};
  for (let r = 1; r <= 5; r++) {
    const row = sh.getRow(r);
    const first = cellStr(row, 1).toLowerCase();
    if (first.includes('id') || first.includes('employee') || first.includes('xodim')) {
      headerRow = r;
      // Build column map from header
      row.eachCell((cell, col) => {
        const h = String(cell.value ?? '').toLowerCase().trim();
        if (h.includes('id') || h.includes('табель')) colMap.employeeId = col;
        else if (h.includes('last') || h.includes('фамил') || h.includes('famil')) colMap.lastName = col;
        else if (h.includes('first') || h.includes('имя') || h.includes('ism')) colMap.firstName = col;
        else if (h.includes('email') || h.includes('почта')) colMap.email = col;
        else if (h.includes('dept') || h.includes('depart') || h.includes('kafed') || h.includes('кафед')) colMap.department = col;
        else if (h.includes('posit') || h.includes('lavoz') || h.includes('должн')) colMap.position = col;
        else if (h.includes('degree') || h.includes('ilmiy') || h.includes('степен')) colMap.degree = col;
        else if (h.includes('employ') || h.includes('ish tur') || h.includes('тип')) colMap.employmentType = col;
        else if (h.includes('max') || h.includes('maks') || h.includes('макс')) colMap.maxWeeklyHours = col;
        else if (h.includes('phone') || h.includes('tel') || h.includes('тел')) colMap.phone = col;
        else if (h.includes('min')) colMap.minWeeklyHours = col;
      });
      break;
    }
  }

  // Fallback column positions if header not detected
  if (!colMap.employeeId) colMap = { employeeId:1, lastName:2, firstName:3, email:4, department:5, position:6, degree:7, employmentType:8, maxWeeklyHours:9, phone:10 };

  const result: ImportResult = { created: 0, updated: 0, skipped: 0, errors: [] };

  for (let r = headerRow + 1; r <= sh.rowCount; r++) {
    const row = sh.getRow(r);
    const employeeId = cellStr(row, colMap.employeeId);
    if (!employeeId) continue; // skip empty rows

    try {
      const rawDept = cellStr(row, colMap.department);
      const departmentId = await resolveDepartmentId(rawDept, deptCache);
      if (!departmentId) {
        result.errors.push(`Row ${r}: Department "${rawDept}" not found`);
        result.skipped++;
        continue;
      }

      const rawPos = cellStr(row, colMap.position);
      const academicPosition = mapPosition(rawPos);

      const lastName = cellStr(row, colMap.lastName);
      const firstName = cellStr(row, colMap.firstName);
      const email = cellStr(row, colMap.email) || `${employeeId.toLowerCase()}@university.uz`;
      const employmentType = mapEmploymentType(cellStr(row, colMap.employmentType));
      const maxWeeklyHours = colMap.maxWeeklyHours ? cellNum(row, colMap.maxWeeklyHours) || 40 : 40;
      const minWeeklyHours = colMap.minWeeklyHours ? cellNum(row, colMap.minWeeklyHours) || 12 : 12;
      const academicDegree = colMap.degree ? cellStr(row, colMap.degree) || undefined : undefined;
      const phoneNumber = colMap.phone ? cellStr(row, colMap.phone) || undefined : undefined;

      if (!lastName || !firstName) {
        result.errors.push(`Row ${r}: Missing name for employeeId "${employeeId}"`);
        result.skipped++;
        continue;
      }

      const existing = await prisma.user.findUnique({ where: { employeeId } });
      if (existing) {
        await prisma.user.update({
          where: { employeeId },
          data: {
            firstName, lastName,
            departmentId,
            ...(academicPosition && { academicPosition: academicPosition as any }),
            employmentType: employmentType as any,
            maxWeeklyHours,
            minWeeklyHours,
            ...(academicDegree && { academicDegree }),
            ...(phoneNumber && { phoneNumber }),
          },
        });
        result.updated++;
      } else {
        await prisma.user.create({
          data: {
            employeeId,
            firstName,
            lastName,
            email,
            passwordHash: '$2b$10$defaultPasswordHashForImport.xxxxx',
            role: 'FACULTY',
            departmentId,
            ...(academicPosition && { academicPosition: academicPosition as any }),
            employmentType: employmentType as any,
            maxWeeklyHours,
            minWeeklyHours,
            ...(academicDegree && { academicDegree }),
            ...(phoneNumber && { phoneNumber }),
          },
        });
        result.created++;
      }
    } catch (err: any) {
      result.errors.push(`Row ${r}: ${err.message}`);
      result.skipped++;
    }
  }

  return result;
}

// ─── Course Catalog Import ─────────────────────────────────────────────────────
// Uses SheetJS for reliable reading, finds "courseCatalog" sheet by name,
// auto-maps headers, upserts all rows with full field coverage.
export async function importCourses(buffer: Buffer): Promise<ImportResult> {
  const result: ImportResult = { created: 0, updated: 0, skipped: 0, errors: [] };

  // SheetJS reads all Excel formats reliably
  const wb = XLSX.read(buffer, { type: 'buffer' });

  // Find courseCatalog sheet (case-insensitive), fall back to first sheet
  const sheetName =
    wb.SheetNames.find((n) => n.toLowerCase().replace(/\s/g, '') === 'coursecatalog') ??
    wb.SheetNames[0];
  if (!sheetName) { result.errors.push('No sheet found in file'); return result; }

  // Read all rows as arrays (row 0 = headers)
  const rows = XLSX.utils.sheet_to_json<any[]>(wb.Sheets[sheetName], { header: 1, defval: '' });
  if (rows.length < 2) { result.errors.push(`Sheet "${sheetName}" has no data rows`); return result; }

  const norm = (s: any) => String(s ?? '').toLowerCase().trim().replace(/\s+/g, ' ');

  // ── Header → field map ────────────────────────────────────────────────────
  const HEADER_MAP: Record<string, string> = {
    'course title':'title','coursetitle':'title','title':'title',
    'course code':'courseCode','coursecode':'courseCode','code':'courseCode',
    'subject board':'subjectBoard','subjectboard':'subjectBoard',
    'course type':'type','coursetype':'type','type':'type',
    'lecture hours':'weeklyLectureHours','lecturehours':'weeklyLectureHours','lecture':'weeklyLectureHours',
    'tutorial hours':'weeklyTutorialHours','tutorialhours':'weeklyTutorialHours','tutorial':'weeklyTutorialHours','practical hours':'weeklyTutorialHours',
    'lab hours':'weeklyLabHours','labhours':'weeklyLabHours','lab':'weeklyLabHours',
    'ects credit':'ectsCredits','ects credits':'ectsCredits','ects':'ectsCredits',
    'us credit':'usCreditHours','us credits':'usCreditHours',
    'credit units':'creditUnits','credits':'creditUnits',
    'department':'department','dept':'department',
    'degree':'degreeLevel',
    'semester':'semesterOffered','semester offered':'semesterOffered','term':'semesterOffered',
    'prerequisite':'prerequisites','prerequisites':'prerequisites',
    'new description':'description','description':'description',
    'textbook':'textbook',
    'course duration':'courseDuration','duration':'courseDuration',
    'accreditation subject area':'accreditationArea','accreditation':'accreditationArea',
    'part of term':'partOfTerm','part-of term:':'partOfTerm','part of term:':'partOfTerm',
    'format':'format','format:':'format',
    'grade status':'gradeStatus','grade status:':'gradeStatus',
    'maximum enrollment':'maxStudents','maximum enrollment:':'maxStudents','max enrollment':'maxStudents',
    'seats avail':'seatsAvailable','seats avail:':'seatsAvailable','seats available':'seatsAvailable',
    'waitlist total':'waitlistTotal','waitlist total:':'waitlistTotal',
    'last day to register':'lastDayToRegister','last date to register':'lastDayToRegister',
    'last date to add/drop':'lastDayToAddDrop','last day to add/drop':'lastDayToAddDrop',
    'instructor info':'instructorInfo','instructor':'instructorInfo',
    'meeting info':'meetingInfo','meeting':'meetingInfo',
    'notes':'notes',
    'outcome 1':'learningOutcome1','outcome 2':'learningOutcome2','outcome 3':'learningOutcome3',
    'outcome 4':'learningOutcome4','outcome 5':'learningOutcome5','outcome 6':'learningOutcome6',
    'outcome 7':'learningOutcome7','outcome 8':'learningOutcome8','outcome 9':'learningOutcome9',
    'outcome 10':'learningOutcome10','outcome 11':'learningOutcome11','outcome 12':'learningOutcome12',
    'outcome 13':'learningOutcome13','outcome 14':'learningOutcome14',
  };

  // Build column index map from header row
  const colMap: Record<string, number> = {};
  const headerRow = rows[0] as any[];
  headerRow.forEach((h: any, idx: number) => {
    const key = norm(h);
    const field = HEADER_MAP[key];
    if (field && colMap[field] === undefined) colMap[field] = idx;
  });

  console.log(`[import] Sheet:"${sheetName}" rows:${rows.length-1} matched:${Object.keys(colMap).join(',')}`);

  if (!colMap.courseCode && !colMap.title) {
    result.errors.push('No recognised headers found (courseCode / title columns missing)');
    return result;
  }

  // Helpers
  const getStr = (row: any[], field: string) => String(row[colMap[field]] ?? '').trim();
  const getNum = (row: any[], field: string) => { const v = parseFloat(String(row[colMap[field]] ?? '')); return isNaN(v) ? 0 : v; };

  const mapCourseType = (s: string) => {
    const l = s.toLowerCase();
    if (/lab/.test(l)) return 'LAB';
    if (/sem|tut|practical|amal/.test(l)) return 'SEMINAR';
    if (/both|mixed/.test(l)) return 'BOTH';
    return 'LECTURE';
  };
  const mapDegree = (s: string) => {
    const l = s.toLowerCase();
    if (/undergrad|bachelor|bakalavr/.test(l)) return 'BACHELOR';
    if (/master|magistr/.test(l)) return 'MASTER';
    if (/phd|doctor/.test(l)) return 'PHD';
    return null;
  };

  const PRISMA_FIELDS = new Set(['title','type','description','creditUnits','weeklyHours','weeklyLectureHours','weeklyTutorialHours','weeklyLabHours','maxStudents','ectsCredits','usCreditHours','subjectBoard','prerequisites','textbook','courseDuration','semesterOffered','degreeLevel','learningOutcome1','learningOutcome2','learningOutcome3','learningOutcome4','learningOutcome5','learningOutcome6','learningOutcome7','departmentId']);
  const EXTRA_FIELDS = ['learningOutcome8','learningOutcome9','learningOutcome10','learningOutcome11','learningOutcome12','learningOutcome13','learningOutcome14','accreditationArea','partOfTerm','format','gradeStatus','seatsAvailable','waitlistTotal','lastDayToRegister','lastDayToAddDrop','instructorInfo','meetingInfo','notes'];

  const allDepts = await prisma.department.findMany({ select: { id: true, name: true } });
  const deptCache = new Map(allDepts.map((d) => [d.id, d.name.toLowerCase()]));

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as any[];
    const courseCode = colMap.courseCode !== undefined ? getStr(row, 'courseCode') : '';
    const title      = colMap.title      !== undefined ? getStr(row, 'title')      : '';
    if (!courseCode && !title) continue;

    try {
      const rawDept = colMap.department !== undefined ? getStr(row, 'department') : '';
      const departmentId = await resolveDepartmentId(rawDept, deptCache);
      if (!departmentId) { result.errors.push(`Row ${i+1}: dept "${rawDept}" not found`); result.skipped++; continue; }
      if (!title) { result.errors.push(`Row ${i+1}: missing title`); result.skipped++; continue; }

      const lecH = colMap.weeklyLectureHours  !== undefined ? getNum(row,'weeklyLectureHours')  : 0;
      const tutH = colMap.weeklyTutorialHours !== undefined ? getNum(row,'weeklyTutorialHours') : 0;
      const labH = colMap.weeklyLabHours      !== undefined ? getNum(row,'weeklyLabHours')      : 0;
      const rawType   = colMap.type       !== undefined ? getStr(row,'type')       : '';
      const rawDegree = colMap.degreeLevel !== undefined ? getStr(row,'degreeLevel') : '';

      const prismaData: Record<string,any> = {
        title,
        type: mapCourseType(rawType) as any,
        weeklyLectureHours: lecH, weeklyTutorialHours: tutH, weeklyLabHours: labH,
        weeklyHours: lecH + tutH + labH,
        creditUnits: (colMap.creditUnits !== undefined ? getNum(row,'creditUnits') : 0) || (colMap.ectsCredits !== undefined ? getNum(row,'ectsCredits') : 0) || 3,
        departmentId,
      };

      const os = (f: string) => colMap[f] !== undefined ? (getStr(row,f) || undefined) : undefined;
      const on = (f: string) => colMap[f] !== undefined ? (getNum(row,f) || undefined) : undefined;

      if (os('subjectBoard'))    prismaData.subjectBoard    = os('subjectBoard');
      if (os('description'))     prismaData.description     = os('description');
      if (os('prerequisites'))   prismaData.prerequisites   = os('prerequisites');
      if (os('textbook'))        prismaData.textbook        = os('textbook');
      if (os('courseDuration'))  prismaData.courseDuration  = os('courseDuration');
      if (os('semesterOffered')) prismaData.semesterOffered = os('semesterOffered');
      if (on('ectsCredits'))     prismaData.ectsCredits     = on('ectsCredits');
      if (on('usCreditHours'))   prismaData.usCreditHours   = on('usCreditHours');
      if (on('maxStudents'))     prismaData.maxStudents     = on('maxStudents');
      if (rawDegree) { const dl = mapDegree(rawDegree); if (dl) prismaData.degreeLevel = dl as any; }
      for (let n = 1; n <= 7; n++) { const f=`learningOutcome${n}`; if (os(f)) prismaData[f]=os(f); }

      // Upsert
      let courseId: string;
      const existing = await prisma.course.findUnique({ where: { courseCode } });
      if (existing) {
        await prisma.course.update({ where: { courseCode }, data: prismaData });
        courseId = existing.id; result.updated++;
      } else {
        const created = await prisma.course.create({ data: { courseCode, ...prismaData } });
        courseId = created.id; result.created++;
      }

      // Extra fields via raw SQL
      const extraSets: string[] = []; const extraVals: any[] = []; let pi = 1;
      for (const field of EXTRA_FIELDS) {
        if (colMap[field] === undefined) continue;
        const isNum = ['seatsAvailable','waitlistTotal'].includes(field);
        const val = isNum ? (getNum(row,field)||null) : (getStr(row,field)||null);
        if (!val) continue;
        extraSets.push(`"${field}" = $${pi++}`); extraVals.push(val);
      }
      if (extraSets.length > 0) {
        extraVals.push(courseId);
        await prisma.$executeRawUnsafe(`UPDATE "Course" SET ${extraSets.join(', ')} WHERE id = $${pi}`, ...extraVals);
      }
    } catch (err: any) {
      result.errors.push(`Row ${i+1}: ${err.message}`); result.skipped++;
    }
  }

  return result;
}

export interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}
