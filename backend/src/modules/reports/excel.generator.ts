// @ts-nocheck
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface KafedraYuklamaRow {
  rowNumber: number;
  courseName: string;
  lectureHoursPerWeek: number;   // weekly
  tutorialHoursPerWeek: number;
  labHoursPerWeek: number;
  programCode: string;
  programName: string;
  teachingLanguage: string;      // O'zbekcha / Ruscha
  formOfStudy: string;           // Kunduzgi
  studentCount: number;
  groupCount: number;            // guruh
  subgroupCount: number;         // guruhcha / podgruppa
  weekCount: number;             // 16
  lectureGroups: number;
  tutorialGroups: number;
  labGroups: number;
  // Calculated fields (auto from above)
  totalAuditoriya?: number;
  audLecture?: number;
  audTutorial?: number;
  audLab?: number;
  audSeminar?: number;
  ratingHours?: number;
  consultHours?: number;
  courseWorkHours?: number;
  practiceHours?: number;
  ipiHours?: number;
  bmiHours?: number;
  doktorantHours?: number;
  totalAll?: number;
  sem1Lecture?: number;
  sem1Tutorial?: number;
  sem1Lab?: number;
  sem2Lecture?: number;
  sem2Tutorial?: number;
  sem2Lab?: number;
}

export interface ShtatBirligiRow {
  departmentName: string;
  lectureHours: number;
  tutorialHours: number;
  labHours: number;
  seminarHours: number;
  ratingHours: number;    // auditoriya × 0.2
  consultHours: number;   // auditoriya × 0.005
  courseWorkHours: number;
  practiceHours: number;
  mdDakHours: number;
  bmiHours: number;
  doktorantHours: number;
  totalHours: number;
  staffUnitsCount: number;
  avgLoad: number;
  professorCount: number;
  docentCount: number;
  seniorLecturerCount: number;
  lecturerCount: number;
  tarifiyCount: number;
  assistantCount: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function ensureUploads(): string {
  const dir = path.resolve(process.env.UPLOAD_DIR ?? './uploads');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

const TNR = (size = 9, bold = false): Partial<ExcelJS.Font> => ({
  name: 'Times New Roman', size, bold,
});

const center: Partial<ExcelJS.Alignment> = {
  horizontal: 'center', vertical: 'middle', wrapText: true,
};

const left: Partial<ExcelJS.Alignment> = {
  horizontal: 'left', vertical: 'middle', wrapText: true,
};

const thin: Partial<ExcelJS.Border> = { style: 'thin' };
const allBorders = { top: thin, left: thin, bottom: thin, right: thin };

function headerFill(argb = 'FFD9E1F2') {
  return { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb } };
}

function applyBorderAndFont(row: ExcelJS.Row, font: Partial<ExcelJS.Font>, align = center) {
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.font = font;
    cell.border = allBorders;
    cell.alignment = align;
  });
}

// ── Workload Summary ──────────────────────────────────────────────────────────

export async function generateWorkloadExcel(
  data: Array<{
    faculty: { firstName: string; lastName: string; employeeId: string };
    department: string;
    totalHours: number;
    courseCount: number;
    isOverloaded: boolean;
    isUnderloaded: boolean;
  }>,
  semesterName: string,
): Promise<string> {
  const wb = new ExcelJS.Workbook();
  const sh = wb.addWorksheet('Workload Summary');

  sh.columns = [
    { header: 'Employee ID', key: 'employeeId', width: 15 },
    { header: 'First Name', key: 'firstName', width: 18 },
    { header: 'Last Name', key: 'lastName', width: 18 },
    { header: 'Department', key: 'department', width: 20 },
    { header: 'Total Hours', key: 'totalHours', width: 14 },
    { header: 'Courses', key: 'courseCount', width: 10 },
    { header: 'Status', key: 'status', width: 14 },
  ];

  for (const row of data) {
    const status = row.isOverloaded ? 'OVERLOADED' : row.isUnderloaded ? 'UNDERLOADED' : 'NORMAL';
    sh.addRow({
      employeeId: row.faculty.employeeId,
      firstName: row.faculty.firstName,
      lastName: row.faculty.lastName,
      department: row.department,
      totalHours: row.totalHours,
      courseCount: row.courseCount,
      status,
    });
  }

  const dir = ensureUploads();
  const fp = path.join(dir, `workload_${semesterName.replace(/\s+/g, '_')}_${Date.now()}.xlsx`);
  await wb.xlsx.writeFile(fp);
  return fp;
}

export async function generateOverloadExcel(
  data: Array<{
    faculty: { firstName: string; lastName: string; employeeId: string };
    department: string;
    totalHours: number;
    maxHours: number;
    excessHours: number;
    courseCount: number;
  }>,
  semesterName: string,
): Promise<string> {
  const wb = new ExcelJS.Workbook();
  const sh = wb.addWorksheet('Overload Report');
  sh.columns = [
    { header: 'Employee ID', key: 'employeeId', width: 15 },
    { header: 'Name', key: 'name', width: 25 },
    { header: 'Department', key: 'department', width: 22 },
    { header: 'Total Hours', key: 'totalHours', width: 14 },
    { header: 'Max Hours', key: 'maxHours', width: 12 },
    { header: 'Excess Hours', key: 'excessHours', width: 14 },
    { header: 'Courses', key: 'courseCount', width: 10 },
  ];
  for (const row of data) {
    sh.addRow({
      employeeId: row.faculty.employeeId,
      name: `${row.faculty.firstName} ${row.faculty.lastName}`,
      department: row.department,
      totalHours: row.totalHours,
      maxHours: row.maxHours,
      excessHours: row.excessHours,
      courseCount: row.courseCount,
    });
  }
  const dir = ensureUploads();
  const fp = path.join(dir, `overload_${semesterName.replace(/\s+/g, '_')}_${Date.now()}.xlsx`);
  await wb.xlsx.writeFile(fp);
  return fp;
}

// ── Kafedra Yuklama — FULL GOVERNMENT FORMAT (39 columns) ─────────────────────
// Based on: NPUU_workload 2025_26.xlsx → "Kafedra yuklama 2025" sheet
export async function generateKafedraYuklamaExcel(
  departmentName: string,
  semesterLabel: string,
  academicYear: string,
  rows: KafedraYuklamaRow[],
  headSignature?: string,
  financeSignature?: string,
): Promise<string> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Workload Platform';

  const sh = wb.addWorksheet('Kafedra yuklama', {
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
  });

  // ── Row 1: University name ──
  sh.mergeCells('A1:AM1');
  sh.getCell('A1').value = "Ўзбекистон миллий педагогика университети";
  sh.getCell('A1').font = TNR(12, true);
  sh.getCell('A1').alignment = center;
  sh.getRow(1).height = 20;

  // ── Row 2: Main title ──
  sh.mergeCells('A2:AM2');
  sh.getCell('A2').value =
    `${departmentName} кафедрасининг ${academicYear} ўқув йили ${semesterLabel} семестр учун соатлар миқдори`;
  sh.getCell('A2').font = TNR(11, true);
  sh.getCell('A2').alignment = center;
  sh.getRow(2).height = 30;

  // ── Row 3: empty ──
  sh.getRow(3).height = 8;

  // ── Rows 4-5: Column headers (merged groups) ──
  // Group header row 4
  const groups: Array<{ label: string; startCol: number; endCol: number }> = [
    { label: '№', startCol: 1, endCol: 1 },
    { label: 'Фан номи', startCol: 2, endCol: 2 },
    { label: 'Маъруза соати', startCol: 3, endCol: 3 },
    { label: 'Амалий машғулот', startCol: 4, endCol: 4 },
    { label: 'Лаборатория', startCol: 5, endCol: 5 },
    { label: 'Таълим йўналиши', startCol: 6, endCol: 6 },
    { label: 'Таълим тили', startCol: 7, endCol: 7 },
    { label: 'Таълим шакли', startCol: 8, endCol: 8 },
    { label: 'Т/с', startCol: 9, endCol: 9 },
    { label: 'Гуруҳ ва паток', startCol: 10, endCol: 10 },
    { label: 'Аудитория юкламаси', startCol: 11, endCol: 15 },
    { label: 'Аудитория юкламасининг семестрларга тақсимоти', startCol: 16, endCol: 21 },
    { label: 'Рейтинг 0.2', startCol: 22, endCol: 22 },
    { label: 'Консул-тация', startCol: 23, endCol: 23 },
    { label: 'Курс иши', startCol: 24, endCol: 24 },
    { label: 'Амалиёт', startCol: 25, endCol: 25 },
    { label: 'ИПИ ва ИТИ', startCol: 26, endCol: 26 },
    { label: 'БМИ', startCol: 27, endCol: 27 },
    { label: 'Докторантга раҳбарлик', startCol: 28, endCol: 28 },
    { label: 'ЖАМИ', startCol: 29, endCol: 29 },
  ];

  const headerRow4 = sh.getRow(4);
  headerRow4.height = 50;
  for (const g of groups) {
    if (g.startCol !== g.endCol) {
      // Multi-column group: only merge row 4 across its columns.
      // Row 5 will carry per-column sub-headers for these groups.
      sh.mergeCells(4, g.startCol, 4, g.endCol);
    } else {
      // Single-column header: span both rows 4 and 5 (no sub-header needed)
      sh.mergeCells(4, g.startCol, 5, g.endCol);
    }
    const cell = headerRow4.getCell(g.startCol);
    cell.value = g.label;
    cell.font = TNR(8, true);
    cell.alignment = center;
    cell.border = allBorders;
    cell.fill = headerFill('FFD9E1F2');
  }

  // Nested headers for "Аудитория юкламаси" (cols 11-15)
  // Un-merge and set sub-headers row 5
  // First un-merge the big merge for auditoriya group (cols 11-15) in row 4
  // Then add sub-headers in row 5
  // Re-do: for cols with sub-groups, only merge row 4, put sub in row 5
  // Simple approach: use two rows, merging where single col

  // Row 5: sub-headers for multi-col groups
  const subHeaderRow5 = sh.getRow(5);
  subHeaderRow5.height = 35;

  const subHeaders: Array<{ col: number; label: string }> = [
    // Аудитория юкламаси (11-15)
    { col: 11, label: 'Жами' },
    { col: 12, label: 'Маъруза' },
    { col: 13, label: 'Амалий' },
    { col: 14, label: 'Лаборатория' },
    { col: 15, label: 'Семинар' },
    // Семестрларга тақсимоти (16-21)
    { col: 16, label: '1-сем\nМаъруза' },
    { col: 17, label: '1-сем\nАмалий' },
    { col: 18, label: '1-сем\nЛаб' },
    { col: 19, label: '2-сем\nМаъруза' },
    { col: 20, label: '2-сем\nАмалий' },
    { col: 21, label: '2-сем\nЛаб' },
  ];

  for (const sh5 of subHeaders) {
    const cell = subHeaderRow5.getCell(sh5.col);
    cell.value = sh5.label;
    cell.font = TNR(8, true);
    cell.alignment = center;
    cell.border = allBorders;
    cell.fill = headerFill('FFE2EFDA');
  }

  // Column widths
  const colWidths = [
    4,   // 1 №
    28,  // 2 Фан номи
    7,   // 3 Маъруза
    7,   // 4 Амалий
    7,   // 5 Лаб
    20,  // 6 Таълим йўналиши
    8,   // 7 Тил
    9,   // 8 Шакл
    6,   // 9 Т/с
    7,   // 10 Гуруҳ
    7,   // 11 Жами аудитория
    7,   // 12 Маъруза аудитория
    7,   // 13 Амалий аудитория
    7,   // 14 Лаб аудитория
    7,   // 15 Семинар
    7,   // 16 1-сем Маъруза
    7,   // 17 1-сем Амалий
    6,   // 18 1-сем Лаб
    7,   // 19 2-сем Маъруза
    7,   // 20 2-сем Амалий
    6,   // 21 2-сем Лаб
    7,   // 22 Рейтинг
    7,   // 23 Консультация
    7,   // 24 Курс иши
    7,   // 25 Амалиёт
    7,   // 26 ИПИ
    7,   // 27 БМИ
    7,   // 28 Докторант
    8,   // 29 ЖАМИ
  ];
  colWidths.forEach((w, i) => { sh.getColumn(i + 1).width = w; });

  // ── Data rows ──
  let totals = {
    audJami: 0, audLec: 0, audTut: 0, audLab: 0, audSem: 0,
    rating: 0, consult: 0, courseWork: 0, practice: 0,
    ipi: 0, bmi: 0, doktorant: 0, all: 0,
  };

  for (const row of rows) {
    // Calculate if not pre-calculated
    const wc = row.weekCount || 16;
    const audLec = (row.lectureHoursPerWeek || 0) * (row.lectureGroups || 0) * wc;
    const audTut = (row.tutorialHoursPerWeek || 0) * (row.tutorialGroups || 0) * wc;
    const audLab = (row.labHoursPerWeek || 0) * (row.labGroups || 0) * wc;
    const audSem = 0;
    const audJami = audLec + audTut + audLab + audSem;
    const rating = Math.round(audJami * 0.2 * 10) / 10;
    const consult = Math.round(audJami * 0.005 * 10) / 10;
    const courseWork = row.courseWorkHours || 0;
    const practice = row.practiceHours || 0;
    const ipi = row.ipiHours || 0;
    const bmi = row.bmiHours || 0;
    const doktorant = row.doktorantHours || 0;
    const all = audJami + rating + consult + courseWork + practice + ipi + bmi + doktorant;

    const dr = sh.addRow([
      row.rowNumber,
      row.courseName,
      row.lectureHoursPerWeek,
      row.tutorialHoursPerWeek,
      row.labHoursPerWeek,
      `${row.programCode} — ${row.programName}`,
      row.teachingLanguage === 'UZB' ? "O'zbek" : row.teachingLanguage === 'RUS_ENG' ? 'Rus-Ing' : "O'zbek-Ing",
      row.formOfStudy || 'Kunduzgi',
      row.studentCount,
      row.groupCount,
      audJami,
      audLec,
      audTut,
      audLab,
      audSem,
      row.sem1Lecture ?? audLec,    // 16
      row.sem1Tutorial ?? audTut,   // 17
      row.sem1Lab ?? audLab,        // 18
      row.sem2Lecture ?? 0,         // 19
      row.sem2Tutorial ?? 0,        // 20
      row.sem2Lab ?? 0,             // 21
      rating,                       // 22
      consult,                      // 23
      courseWork,                   // 24
      practice,                     // 25
      ipi,                          // 26
      bmi,                          // 27
      doktorant,                    // 28
      all,                          // 29
    ]);

    dr.height = 20;
    dr.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = TNR(9);
      cell.border = allBorders;
      cell.alignment = { vertical: 'middle', wrapText: true };
    });
    // Course name left-align
    dr.getCell(2).alignment = left;

    totals.audJami += audJami;
    totals.audLec += audLec;
    totals.audTut += audTut;
    totals.audLab += audLab;
    totals.rating += rating;
    totals.consult += consult;
    totals.courseWork += courseWork;
    totals.all += all;
  }

  // ── Totals row ──
  const tr = sh.addRow([
    '', 'ЖАМИ',
    '', '', '', '', '', '', '', '',
    totals.audJami, totals.audLec, totals.audTut, totals.audLab, 0,
    '', '', '', '', '', '',
    totals.rating, totals.consult, totals.courseWork, 0, 0, 0, 0,
    totals.all,
  ]);
  tr.height = 22;
  tr.eachCell({ includeEmpty: true }, (cell) => {
    cell.font = TNR(9, true);
    cell.border = allBorders;
    cell.alignment = center;
    cell.fill = headerFill('FFFFF2CC');
  });

  // ── Signature block ──
  const sigRow1Num = sh.lastRow.number + 2;
  sh.getRow(sigRow1Num).getCell(1).value = 'Ўқув-услубий бошқарма бошлиғи:';
  sh.getRow(sigRow1Num).getCell(1).font = TNR(9, true);
  sh.getRow(sigRow1Num).getCell(8).value = headSignature || '_______________';
  sh.getRow(sigRow1Num).getCell(8).font = TNR(9);

  const sigRow2Num = sigRow1Num + 1;
  sh.getRow(sigRow2Num).getCell(1).value = 'Режа-молия бўлими бошлиғи:';
  sh.getRow(sigRow2Num).getCell(1).font = TNR(9, true);
  sh.getRow(sigRow2Num).getCell(8).value = financeSignature || '_______________';
  sh.getRow(sigRow2Num).getCell(8).font = TNR(9);

  const dir = ensureUploads();
  const fp = path.join(dir, `kafedra_yuklama_${academicYear.replace(/\//g, '_')}_${Date.now()}.xlsx`);
  await wb.xlsx.writeFile(fp);
  return fp;
}

// ── Shtat Birligi — FULL GOVERNMENT FORMAT (21 cols) ─────────────────────────
export async function generateShtatBirligiExcel(
  universityName: string,
  departmentName: string,
  academicYear: string,
  rows: ShtatBirligiRow[],
  headSignature?: string,
  financeSignature?: string,
): Promise<string> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Workload Platform';

  const sh = wb.addWorksheet('Shtat birligi', {
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
  });

  const totalCols = 21;

  // ── Row 1: University ──
  sh.mergeCells(1, 1, 1, totalCols);
  sh.getCell('A1').value = universityName;
  sh.getCell('A1').font = TNR(12, true);
  sh.getCell('A1').alignment = center;
  sh.getRow(1).height = 22;

  // ── Row 2: Title ──
  sh.mergeCells(2, 1, 2, totalCols);
  sh.getCell('A2').value =
    `${departmentName} кафедрасининг ${academicYear} ўқув йили учун ўқув юкламалари ва лавозимлар тақсимоти`;
  sh.getCell('A2').font = TNR(11, true);
  sh.getCell('A2').alignment = center;
  sh.getRow(2).height = 30;

  // ── Row 3: empty ──
  sh.getRow(3).height = 6;

  // ── Rows 4-5: Headers ──
  // Row 4 group headers
  const groupHeaders = [
    { label: 'Т/р', r1: 4, c1: 1, r2: 5, c2: 1 },
    { label: 'Кафедра номи', r1: 4, c1: 2, r2: 5, c2: 2 },
    { label: 'Ўқув юкламалар', r1: 4, c1: 3, r2: 4, c2: 11 },
    { label: 'Кафедра штат бирлиги', r1: 4, c1: 12, r2: 5, c2: 12 },
    { label: 'Кафедра ўртача юкламаси', r1: 4, c1: 13, r2: 5, c2: 13 },
    { label: 'Лавозимлар (штат)', r1: 4, c1: 14, r2: 4, c2: 21 },
  ];

  for (const g of groupHeaders) {
    sh.mergeCells(g.r1, g.c1, g.r2, g.c2);
    const cell = sh.getRow(g.r1).getCell(g.c1);
    cell.value = g.label;
    cell.font = TNR(9, true);
    cell.alignment = center;
    cell.border = allBorders;
    cell.fill = headerFill('FFD9E1F2');
  }
  sh.getRow(4).height = 40;

  // Row 5 sub-headers
  const sub5 = [
    // Ўқув юкламалар sub (cols 3-11)
    { col: 3, label: 'Маъруза' },
    { col: 4, label: 'Амалий машғулот' },
    { col: 5, label: 'Лаборатория' },
    { col: 6, label: 'Семинар' },
    { col: 7, label: 'Рейтинг' },
    { col: 8, label: 'Курс иши' },
    { col: 9, label: 'Амалиёт' },
    { col: 10, label: 'МД/ДАК/БМИ' },
    { col: 11, label: 'ЖАМИ' },
    // Лавозимлар sub (cols 14-21)
    { col: 14, label: 'Профессор' },
    { col: 15, label: 'Доцент' },
    { col: 16, label: 'Катта ўқитувчи' },
    { col: 17, label: 'Ўқитувчи' },
    { col: 18, label: 'Ассистент' },
    { col: 19, label: 'Тасрифий' },
    { col: 20, label: 'Докторант раҳбари' },
    { col: 21, label: 'Жами' },
  ];

  sh.getRow(5).height = 40;
  for (const s of sub5) {
    const cell = sh.getRow(5).getCell(s.col);
    cell.value = s.label;
    cell.font = TNR(8, true);
    cell.alignment = center;
    cell.border = allBorders;
    cell.fill = headerFill('FFE2EFDA');
  }

  // Column widths
  const colW = [5, 30, 9, 9, 9, 9, 9, 9, 9, 9, 10, 10, 12, 10, 10, 12, 10, 10, 10, 10, 10];
  colW.forEach((w, i) => { sh.getColumn(i + 1).width = w; });

  // ── Data rows ──
  let tot = {
    lec: 0, tut: 0, lab: 0, sem: 0, rat: 0, cw: 0, prac: 0, mddak: 0, all: 0,
    units: 0, prof: 0, doc: 0, senior: 0, lect: 0,
  };

  rows.forEach((row, idx) => {
    const totalPos = row.professorCount + row.docentCount + row.seniorLecturerCount +
      row.lecturerCount + row.tarifiyCount + row.assistantCount;

    const dr = sh.addRow([
      idx + 1,
      row.departmentName,
      row.lectureHours,
      row.tutorialHours,
      row.labHours,
      row.seminarHours,
      row.ratingHours,
      row.courseWorkHours,
      row.practiceHours,
      row.mdDakHours + row.bmiHours + row.doktorantHours,
      row.totalHours,
      Math.round(row.staffUnitsCount * 100) / 100,
      Math.round(row.avgLoad * 100) / 100,
      row.professorCount,
      row.docentCount,
      row.seniorLecturerCount,
      row.lecturerCount,
      row.assistantCount,
      row.tarifiyCount,
      row.doktorantHours > 0 ? 1 : 0,
      totalPos,
    ]);

    dr.height = 22;
    dr.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = TNR(9);
      cell.border = allBorders;
      cell.alignment = { vertical: 'middle' };
    });
    dr.getCell(2).alignment = left;

    tot.lec += row.lectureHours;
    tot.tut += row.tutorialHours;
    tot.lab += row.labHours;
    tot.sem += row.seminarHours;
    tot.rat += row.ratingHours;
    tot.cw += row.courseWorkHours;
    tot.prac += row.practiceHours;
    tot.mddak += row.mdDakHours + row.bmiHours;
    tot.all += row.totalHours;
    tot.units += row.staffUnitsCount;
    tot.prof += row.professorCount;
    tot.doc += row.docentCount;
    tot.senior += row.seniorLecturerCount;
    tot.lect += row.lecturerCount;
  });

  // ── Totals row ──
  const tr = sh.addRow([
    '', 'ЖАМИ',
    tot.lec, tot.tut, tot.lab, tot.sem, tot.rat, tot.cw, tot.prac, tot.mddak,
    tot.all, tot.units, '', tot.prof, tot.doc, tot.senior, tot.lect, '', '', '',
    tot.prof + tot.doc + tot.senior + tot.lect,
  ]);
  tr.height = 22;
  tr.eachCell({ includeEmpty: true }, (cell) => {
    cell.font = TNR(9, true);
    cell.border = allBorders;
    cell.alignment = center;
    cell.fill = headerFill('FFFFF2CC');
  });

  // ── Signature block ──
  const sig1 = sh.lastRow.number + 2;
  sh.getRow(sig1).getCell(1).value = 'Ўқув-услубий бошқарма бошлиғи:';
  sh.getRow(sig1).getCell(1).font = TNR(9, true);
  sh.getRow(sig1).getCell(6).value = headSignature || 'Ғ.Абдилакимов';
  sh.getRow(sig1).getCell(6).font = TNR(9);

  const sig2 = sig1 + 2;
  sh.getRow(sig2).getCell(1).value = 'Режа-молия бўлими бошлиғи:';
  sh.getRow(sig2).getCell(1).font = TNR(9, true);
  sh.getRow(sig2).getCell(6).value = financeSignature || 'М.Махмудова';
  sh.getRow(sig2).getCell(6).font = TNR(9);

  const dir = ensureUploads();
  const fp = path.join(dir, `shtat_birligi_${academicYear.replace(/\//g, '_')}_${Date.now()}.xlsx`);
  await wb.xlsx.writeFile(fp);
  return fp;
}

// ── Password Directory ────────────────────────────────────────────────────────
export async function generatePasswordDirectoryExcel(
  data: Array<{ name: string; email: string; department: string; tempPassword: string }>,
): Promise<string> {
  const wb = new ExcelJS.Workbook();
  const sh = wb.addWorksheet('Password Directory');

  sh.columns = [
    { header: 'Professor Name', key: 'name', width: 28 },
    { header: 'Email Address', key: 'email', width: 32 },
    { header: 'Department', key: 'department', width: 24 },
    { header: 'Current Password', key: 'tempPassword', width: 20 },
  ];

  // Header row styling
  const headerRow = sh.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
    cell.border = allBorders;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });
  headerRow.height = 20;

  for (const row of data) {
    const dr = sh.addRow(row);
    dr.eachCell((cell) => {
      cell.border = allBorders;
      cell.alignment = { vertical: 'middle' };
    });
    // Mark "N/A" entries in grey
    if (row.tempPassword.startsWith('N/A')) {
      dr.getCell(4).font = { italic: true, color: { argb: 'FF9CA3AF' } };
    }
  }

  // Confidentiality notice at the bottom
  const noticeRow = sh.lastRow!.number + 2;
  sh.getCell(`A${noticeRow}`).value =
    '⚠ CONFIDENTIAL — This document contains sensitive credential data. Distribute only to authorised personnel.';
  sh.getCell(`A${noticeRow}`).font = { italic: true, color: { argb: 'FFDC2626' }, size: 9 };
  sh.mergeCells(noticeRow, 1, noticeRow, 4);

  const dir = ensureUploads();
  const fp = path.join(dir, `password_directory_${Date.now()}.xlsx`);
  await wb.xlsx.writeFile(fp);
  return fp;
}

// ── Department comparison ─────────────────────────────────────────────────────
export async function generateDeptComparisonExcel(
  data: Array<{
    department: string;
    facultyCount: number;
    avgHours: number;
    totalHours: number;
    overloadedCount: number;
    underloadedCount: number;
  }>,
  semesterName: string,
): Promise<string> {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet('Dept Comparison');
  sheet.columns = [
    { header: 'Department', key: 'department', width: 25 },
    { header: 'Faculty Count', key: 'facultyCount', width: 15 },
    { header: 'Avg Hours/Week', key: 'avgHours', width: 16 },
    { header: 'Total Hours', key: 'totalHours', width: 14 },
    { header: 'Overloaded', key: 'overloadedCount', width: 13 },
    { header: 'Underloaded', key: 'underloadedCount', width: 13 },
  ];
  for (const row of data) sheet.addRow(row);
  const dir = ensureUploads();
  const fp = path.join(dir, `dept_comparison_${semesterName.replace(/\s+/g, '_')}_${Date.now()}.xlsx`);
  await wb.xlsx.writeFile(fp);
  return fp;
}
