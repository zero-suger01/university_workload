// @ts-nocheck
/**
 * CQI Report Word Document Generator
 * Generates a .docx file matching the _cqi-sample.docx format
 * 7 tables: Course Info → Objectives+Eval → Syllabus → Instructor Eval → Student Survey → CLO Assessment → Signatures
 */

import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType, VerticalAlign,
  HeadingLevel, PageOrientation,
} from 'docx';
import path from 'path';
import fs from 'fs';

function ensureUploads(): string {
  const dir = process.env.UPLOAD_DIR ?? './uploads';
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

const BORDER = { style: BorderStyle.SINGLE, size: 1, color: '000000' };
const ALL_BORDERS = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };
const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };

function cell(
  text: string,
  opts: {
    bold?: boolean;
    shade?: string;
    span?: number;
    width?: number;
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    fontSize?: number;
  } = {},
): TableCell {
  return new TableCell({
    columnSpan: opts.span ?? 1,
    width: opts.width ? { size: opts.width, type: WidthType.DXA } : undefined,
    shading: opts.shade
      ? { fill: opts.shade, type: ShadingType.CLEAR }
      : undefined,
    borders: ALL_BORDERS,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [
      new Paragraph({
        alignment: opts.align ?? AlignmentType.LEFT,
        children: [
          new TextRun({
            text,
            bold: opts.bold ?? false,
            size: (opts.fontSize ?? 10) * 2,
            font: 'Times New Roman',
          }),
        ],
      }),
    ],
  });
}

function sectionHeader(text: string, span = 4): TableRow {
  return new TableRow({
    children: [
      cell(text, { bold: true, shade: 'D9E1F2', span, align: AlignmentType.CENTER }),
    ],
  });
}

export async function generateCQIDocx(data: {
  courseTitle: string;
  courseCode: string;
  creditUnits: string;
  ectsCredits: string;
  lectureHours: number;
  labHours: number;
  studentCount: number;
  semesterName: string;
  professors: string;
  labInstructor?: string;
  objectives: Array<{ number: number; description: string }>;
  evalMidterm: number;
  evalFinal: number;
  evalAssignment: number;
  textbooks: string[];
  syllabus: Array<{ week: number; date?: string; topic: string; tutorials?: string }>;
  evalQ1: string;
  evalQ2: string;
  evalQ3: string;
  evalQ4: string;
  surveyParticipation?: number;
  surveyFollowsSyllabus?: number;
  surveySatisfaction?: number;
  surveyAvgScore?: number;
  cloAssessments: Array<{
    cloNumber: number;
    description: string;
    teachingMethods: string[];
    assessmentTools: string[];
    perfHigh?: string;
    perfMedium?: string;
    perfLow?: string;
    plosHigh: string[];
    plosMedium: string[];
    plosLow: string[];
  }>;
  submittedDate: string;
}): Promise<string> {
  const pageW = 15840; // A4 landscape DXA
  const pageH = 11906;
  const margin = 720; // 0.5 inch
  const contentW = pageW - margin * 2;

  // ── TABLE 1: Course Header ──
  const table1 = new Table({
    width: { size: contentW, type: WidthType.DXA },
    columnWidths: [Math.floor(contentW / 4), Math.floor(contentW / 4), Math.floor(contentW / 4), Math.floor(contentW / 4)],
    rows: [
      // Title
      new TableRow({
        children: [cell('Continuous Quality Improvement Report', { bold: true, shade: '4472C4', span: 4, align: AlignmentType.CENTER, fontSize: 14 })],
      }),
      new TableRow({
        children: [
          cell('Course title', { bold: true, shade: 'D9E1F2' }),
          cell(data.courseTitle),
          cell('Course code', { bold: true, shade: 'D9E1F2' }),
          cell(data.courseCode),
        ],
      }),
      new TableRow({
        children: [
          cell('Credit units (ECTS)', { bold: true, shade: 'D9E1F2' }),
          cell(`${data.creditUnits} Credits / ${data.ectsCredits} ECTS`),
          cell('Lecture/Lab', { bold: true, shade: 'D9E1F2' }),
          cell(`${data.lectureHours} hours / ${data.labHours} hours per week`),
        ],
      }),
      new TableRow({
        children: [
          cell('Number of students', { bold: true, shade: 'D9E1F2' }),
          cell(String(data.studentCount)),
          cell('Semester/year', { bold: true, shade: 'D9E1F2' }),
          cell(data.semesterName),
        ],
      }),
      new TableRow({
        children: [
          cell('Professors', { bold: true, shade: 'D9E1F2' }),
          cell(data.professors),
          cell('Lab Instructor', { bold: true, shade: 'D9E1F2' }),
          cell(data.labInstructor ?? ''),
        ],
      }),
    ],
  });

  // ── TABLE 2: Objectives + Evaluation ──
  const objectiveRows = data.objectives.map((o) =>
    new TableRow({
      children: [
        cell(`CO ${o.number}`, { bold: true, width: Math.floor(contentW * 0.15) }),
        cell(o.description, { span: 1, width: Math.floor(contentW * 0.85) }),
      ],
    }),
  );

  const table2 = new Table({
    width: { size: contentW, type: WidthType.DXA },
    columnWidths: [Math.floor(contentW * 0.15), Math.floor(contentW * 0.85)],
    rows: [
      sectionHeader('Course Objectives', 2),
      new TableRow({
        children: [cell('CO', { bold: true, shade: 'D9E1F2' }), cell('Detailed Description', { bold: true, shade: 'D9E1F2' })],
      }),
      ...objectiveRows,
      sectionHeader('Evaluation Method', 2),
      new TableRow({
        children: [
          cell('Evaluation Method', { bold: true, shade: 'D9E1F2' }),
          cell(`Midterm: ${data.evalMidterm}% | Final: ${data.evalFinal}% | Assignments: ${data.evalAssignment}%`),
        ],
      }),
      sectionHeader('Textbooks and References', 2),
      ...data.textbooks.map((tb, i) =>
        new TableRow({
          children: [cell(`${i + 1}.`, { bold: true }), cell(tb)],
        }),
      ),
    ],
  });

  // ── TABLE 3: Syllabus ──
  const syllabusRows = data.syllabus.map((s) =>
    new TableRow({
      children: [
        cell(String(s.week), { width: Math.floor(contentW * 0.06) }),
        cell(s.date ?? '', { width: Math.floor(contentW * 0.1) }),
        cell(s.topic, { width: Math.floor(contentW * 0.5) }),
        cell(s.tutorials ?? '', { width: Math.floor(contentW * 0.34) }),
      ],
    }),
  );

  const table3 = new Table({
    width: { size: contentW, type: WidthType.DXA },
    columnWidths: [
      Math.floor(contentW * 0.06),
      Math.floor(contentW * 0.1),
      Math.floor(contentW * 0.5),
      Math.floor(contentW * 0.34),
    ],
    rows: [
      sectionHeader('Topics covered / Realization of the Syllabus', 4),
      new TableRow({
        children: [
          cell('Week', { bold: true, shade: 'D9E1F2' }),
          cell('Date', { bold: true, shade: 'D9E1F2' }),
          cell('Topics and Learning Activities', { bold: true, shade: 'D9E1F2' }),
          cell('Tutorials and Assignments', { bold: true, shade: 'D9E1F2' }),
        ],
      }),
      ...syllabusRows,
    ],
  });

  // ── TABLE 4: Section E — Instructor Evaluation ──
  const evalQAs = [
    { q: 'Are the course processes appropriate?', a: data.evalQ1 },
    { q: 'Do the course outcomes lend themselves to assessment?', a: data.evalQ2 },
    { q: 'Is the designated workload of this course appropriate? How do you know?', a: data.evalQ3 },
    { q: 'Recommendation for Improvement', a: data.evalQ4 },
  ];

  const table4 = new Table({
    width: { size: contentW, type: WidthType.DXA },
    columnWidths: [Math.floor(contentW * 0.35), Math.floor(contentW * 0.65)],
    rows: [
      sectionHeader('E. Evaluation of the course by the Instructor', 2),
      new TableRow({
        children: [cell('Question', { bold: true, shade: 'D9E1F2' }), cell('Detailed Description', { bold: true, shade: 'D9E1F2' })],
      }),
      ...evalQAs.map((qa) =>
        new TableRow({
          children: [cell(qa.q, { bold: true }), cell(qa.a ?? '')],
        }),
      ),
    ],
  });

  // ── TABLE 5: Section F — Student Survey ──
  const table5 = new Table({
    width: { size: contentW, type: WidthType.DXA },
    columnWidths: [
      Math.floor(contentW * 0.2),
      Math.floor(contentW * 0.2),
      Math.floor(contentW * 0.2),
      Math.floor(contentW * 0.2),
      Math.floor(contentW * 0.2),
    ],
    rows: [
      sectionHeader('F. Evaluation of the course by students', 5),
      new TableRow({
        children: [
          cell('Survey type', { bold: true, shade: 'D9E1F2' }),
          cell('Participation rate', { bold: true, shade: 'D9E1F2' }),
          cell('Professor follows the Syllabus', { bold: true, shade: 'D9E1F2' }),
          cell('Overall satisfaction level', { bold: true, shade: 'D9E1F2' }),
          cell('Average score in 100%', { bold: true, shade: 'D9E1F2' }),
        ],
      }),
      new TableRow({
        children: [
          cell('Lecture Survey (during the semester)'),
          cell(data.surveyParticipation != null ? `${data.surveyParticipation} students` : '-'),
          cell(data.surveyFollowsSyllabus != null ? `${data.surveyFollowsSyllabus}%` : '-'),
          cell(data.surveySatisfaction != null ? `${data.surveySatisfaction}%` : '-'),
          cell(data.surveyAvgScore != null ? `${data.surveyAvgScore}%` : '-'),
        ],
      }),
    ],
  });

  // ── TABLE 6: Section G — CLO Assessment ──
  const cloRows = data.cloAssessments.map((clo) =>
    new TableRow({
      children: [
        cell(`CLO${clo.cloNumber}: ${clo.description}`, { width: Math.floor(contentW * 0.22) }),
        cell(clo.teachingMethods.join(', '), { width: Math.floor(contentW * 0.18) }),
        cell(clo.assessmentTools.join(', '), { width: Math.floor(contentW * 0.18) }),
        cell(
          [
            clo.perfHigh ? `High: ${clo.perfHigh}` : '',
            clo.perfMedium ? `Medium: ${clo.perfMedium}` : '',
            clo.perfLow ? `Low: ${clo.perfLow}` : '',
          ].filter(Boolean).join('\n'),
          { width: Math.floor(contentW * 0.22) },
        ),
        cell(
          [
            clo.plosHigh.length ? `High: ${clo.plosHigh.join(',')}` : '',
            clo.plosMedium.length ? `Med: ${clo.plosMedium.join(',')}` : '',
            clo.plosLow.length ? `Low: ${clo.plosLow.join(',')}` : '',
          ].filter(Boolean).join('\n'),
          { width: Math.floor(contentW * 0.2) },
        ),
      ],
    }),
  );

  const table6 = new Table({
    width: { size: contentW, type: WidthType.DXA },
    columnWidths: [
      Math.floor(contentW * 0.22),
      Math.floor(contentW * 0.18),
      Math.floor(contentW * 0.18),
      Math.floor(contentW * 0.22),
      Math.floor(contentW * 0.2),
    ],
    rows: [
      sectionHeader('G. Course Learning Outcome Assessment Plan', 5),
      new TableRow({
        children: [
          cell('Course Learning Outcomes', { bold: true, shade: 'D9E1F2' }),
          cell('Teaching/Learning Method(s)', { bold: true, shade: 'D9E1F2' }),
          cell('Assessment Tool(s)', { bold: true, shade: 'D9E1F2' }),
          cell('Performance Indicators', { bold: true, shade: 'D9E1F2' }),
          cell('Competencies (PLOs)', { bold: true, shade: 'D9E1F2' }),
        ],
      }),
      ...cloRows,
    ],
  });

  // ── TABLE 7: Signatures ──
  const table7 = new Table({
    width: { size: contentW, type: WidthType.DXA },
    columnWidths: [Math.floor(contentW * 0.3), Math.floor(contentW * 0.7)],
    rows: [
      new TableRow({
        children: [
          cell('Course instructors', { bold: true, shade: 'D9E1F2' }),
          cell(data.professors),
        ],
      }),
      new TableRow({
        children: [
          cell('Date', { bold: true, shade: 'D9E1F2' }),
          cell(data.submittedDate),
        ],
      }),
    ],
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: pageW, height: pageH, orientation: PageOrientation.LANDSCAPE },
            margin: { top: margin, right: margin, bottom: margin, left: margin },
          },
        },
        children: [
          new Paragraph({ children: [new TextRun('')] }),
          table1,
          new Paragraph({ children: [new TextRun('')] }),
          table2,
          new Paragraph({ children: [new TextRun('')] }),
          table3,
          new Paragraph({ children: [new TextRun('')] }),
          table4,
          new Paragraph({ children: [new TextRun('')] }),
          table5,
          new Paragraph({ children: [new TextRun('')] }),
          table6,
          new Paragraph({ children: [new TextRun('')] }),
          table7,
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const dir = ensureUploads();
  const fp = path.join(dir, `cqi_${data.courseCode}_${Date.now()}.docx`);
  fs.writeFileSync(fp, buffer);
  return fp;
}
