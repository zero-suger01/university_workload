const fs = require('fs');

const file = 'src/pages/admin/WorkloadAssignment.tsx';
let c = fs.readFileSync(file, 'utf8');

// 1. activeTab state
c = c.replace(
  `const [activeTab, setActiveTab] = useState<'view' | 'recent'>('view');`,
  `const [activeTab, setActiveTab] = useState<'create' | 'assign' | 'view' | 'recent'>('view');`
);

// 2. shouldUnregister
c = c.replace(
  `  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({\n    resolver: zodResolver(schema),\n    defaultValues: {`,
  `  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({\n    resolver: zodResolver(schema),\n    shouldUnregister: false,\n    defaultValues: {`
);

// 3. PageHeader title
c = c.replace(
  `<PageHeader icon={<ClipboardList />} title="Workload Assignment" />`,
  `<PageHeader icon={<ClipboardList />} title="Workload" />`
);

// 4. Tabs
c = c.replace(
  `      {/* Tabs */}\n      <div className="flex gap-2 border-b border-gray-200">\n        <button\n          onClick={() => setActiveTab('view')}\n          className={\`px-4 py-2 text-sm font-medium transition-colors border-b-2 \${\n            activeTab === 'view'\n              ? 'border-primary-600 text-primary-700 bg-primary-50 rounded-t-lg'\n              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'\n          }\`}\n        >\n          Create and View Workload\n        </button>\n        <button\n          onClick={() => setActiveTab('recent')}\n          className={\`px-4 py-2 text-sm font-medium transition-colors border-b-2 \${\n            activeTab === 'recent'\n              ? 'border-primary-600 text-primary-700 bg-primary-50 rounded-t-lg'\n              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'\n          }\`}\n        >\n          Recent Assignments\n        </button>\n      </div>`,
  `      {/* Tabs */}\n      <div className="flex gap-2 border-b border-gray-200">\n        <button\n          onClick={() => setActiveTab('create')}\n          className={\`px-4 py-2 text-sm font-medium transition-colors border-b-2 \${\n            activeTab === 'create'\n              ? 'border-primary-600 text-primary-700 bg-primary-50 rounded-t-lg'\n              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'\n          }\`}\n        >\n          Create Workload\n        </button>\n        <button\n          onClick={() => setActiveTab('assign')}\n          className={\`px-4 py-2 text-sm font-medium transition-colors border-b-2 \${\n            activeTab === 'assign'\n              ? 'border-primary-600 text-primary-700 bg-primary-50 rounded-t-lg'\n              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'\n          }\`}\n        >\n          Assign Workload\n        </button>\n        <button\n          onClick={() => setActiveTab('view')}\n          className={\`px-4 py-2 text-sm font-medium transition-colors border-b-2 \${\n            activeTab === 'view'\n              ? 'border-primary-600 text-primary-700 bg-primary-50 rounded-t-lg'\n              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'\n          }\`}\n        >\n          View Workload\n        </button>\n        <button\n          onClick={() => setActiveTab('recent')}\n          className={\`px-4 py-2 text-sm font-medium transition-colors border-b-2 \${\n            activeTab === 'recent'\n              ? 'border-primary-600 text-primary-700 bg-primary-50 rounded-t-lg'\n              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'\n          }\`}\n        >\n          Recent Assignments\n        </button>\n      </div>`
);

// 5. courseCode onChange hours
c = c.replace(
  `                    const n = values.lectureGroup || 1;\n                    const o = values.tutorialGroup || 1;\n                    setValue('lectureHours', (c.weeklyLectureHours ?? 0) * n, { shouldValidate: false });\n                    setValue('seminarHours', (c.weeklyTutorialHours ?? 0) * o, { shouldValidate: false });\n                    setValue('labHours', (c.weeklyLabHours ?? 0) * o, { shouldValidate: false });`,
  `                    setValue('lectureHours', (c.weeklyLectureHours ?? 0), { shouldValidate: false });\n                    setValue('seminarHours', (c.weeklyTutorialHours ?? 0), { shouldValidate: false });\n                    setValue('labHours', (c.weeklyLabHours ?? 0), { shouldValidate: false });`
);

// 6. useEffect auto-fill
c = c.replace(
  `  // Auto-fill hours from catalog × groups whenever course or group counts change\n  // Excel: S=catalog×N(cohorts)  T=catalog×O(smallGroups)  U=catalog×O\n  useEffect(() => {\n    if (selectedCourse) {\n      const o = tutorialGroupVal || 0;  // Small Groups (O) — tutorial/lab × small groups\n      // Lecture: professor teaches all cohorts together → no multiplication\n      setValue('lectureHours', (selectedCourse.weeklyLectureHours || 0), { shouldValidate: false });\n      // Tutorial & Lab: professor teaches each small group separately → multiply\n      setValue('seminarHours', (selectedCourse.weeklyTutorialHours || 0) * o, { shouldValidate: false });\n      setValue('labHours',     (selectedCourse.weeklyLabHours     || 0) * o, { shouldValidate: false });\n    }\n  }, [selectedCourse, lectureGroupVal, tutorialGroupVal, setValue]);`,
  `  // Auto-fill hours from catalog directly (no multiplication by groups)\n  useEffect(() => {\n    if (selectedCourse) {\n      setValue('lectureHours', (selectedCourse.weeklyLectureHours || 0), { shouldValidate: false });\n      setValue('seminarHours', (selectedCourse.weeklyTutorialHours || 0), { shouldValidate: false });\n      setValue('labHours',     (selectedCourse.weeklyLabHours     || 0), { shouldValidate: false });\n    }\n  }, [selectedCourse, setValue]);`
);

// 7. uncoveredHours useEffect
c = c.replace(
  `  // Sync covered fields and compute uncovered using client-side required (form groups × catalog)\n  useEffect(() => {\n    if (selectedCourse && courseAssignments) {\n      const cov = courseAssignments.covered;\n      setValue('totalCoveredLectureHours', cov.lecture, { shouldValidate: false });\n      setValue('totalCoveredTutorialHours', cov.tutorial, { shouldValidate: false });\n      setValue('totalCoveredLabHours', cov.lab, { shouldValidate: false });\n      // Required = catalog × current form group values (not server planningRow defaults)\n      const o = Number(tutorialGroupVal) || 0;\n      const clientRequired =\n        (selectedCourse.weeklyLectureHours || 0)\n        + (selectedCourse.weeklyTutorialHours || 0) * o\n        + (selectedCourse.weeklyLabHours     || 0) * o;\n      setValue('uncoveredHours', cov.total - clientRequired, { shouldValidate: false });\n    }\n  }, [selectedCourse, courseAssignments, lectureGroupVal, tutorialGroupVal, setValue]);`,
  `  // Sync covered fields and compute uncovered using catalog hours directly\n  useEffect(() => {\n    if (selectedCourse && courseAssignments) {\n      const cov = courseAssignments.covered;\n      setValue('totalCoveredLectureHours', cov.lecture, { shouldValidate: false });\n      setValue('totalCoveredTutorialHours', cov.tutorial, { shouldValidate: false });\n      setValue('totalCoveredLabHours', cov.lab, { shouldValidate: false });\n      // Required = catalog hours directly (no multiplication by groups)\n      const clientRequired =\n        (selectedCourse.weeklyLectureHours || 0)\n        + (selectedCourse.weeklyTutorialHours || 0)\n        + (selectedCourse.weeklyLabHours     || 0);\n      setValue('uncoveredHours', cov.total - clientRequired, { shouldValidate: false });\n    }\n  }, [selectedCourse, courseAssignments, setValue]);`
);

// 8. computeFormulaFields - courseTitle
c = c.replace(
  `    // Course title change → cascade to code, ECTS, dept, all hour formulas\n    if (field === 'courseTitle') {\n      const course = courses?.find((c: any) => c.title === rawVal);\n      if (course) {\n        patch.courseId = course.id;\n        patch.courseECTS = course.ectsCredits ?? 0;\n        patch.responsibleDepartment = course.department?.name ?? '';\n        const lecH = (course.weeklyLectureHours ?? 0);\n        const tutH = (course.weeklyTutorialHours ?? 0) * (row.tutorialGroup ?? 0);\n        const labH = (course.weeklyLabHours ?? 0) * (row.tutorialGroup ?? 0);\n        patch.lectureHours = lecH; patch.seminarHours = tutH; patch.labHours = labH;\n        const latNo = lecH + tutH + labH;\n        patch.lecturesAndTutorialsNo = latNo;\n        patch.uncoveredHours = ((row.totalCoveredLectureHours ?? 0) + (row.totalCoveredTutorialHours ?? 0) + (row.totalCoveredLabHours ?? 0)) - latNo;\n      }\n      return patch;\n    }`,
  `    // Course title change → cascade to code, ECTS, dept, all hour formulas\n    if (field === 'courseTitle') {\n      const course = courses?.find((c: any) => c.title === rawVal);\n      if (course) {\n        patch.courseId = course.id;\n        patch.courseECTS = course.ectsCredits ?? 0;\n        patch.responsibleDepartment = course.department?.name ?? '';\n        const lecH = (course.weeklyLectureHours ?? 0);\n        const tutH = (course.weeklyTutorialHours ?? 0);\n        const labH = (course.weeklyLabHours ?? 0);\n        patch.lectureHours = lecH; patch.seminarHours = tutH; patch.labHours = labH;\n        const latNo = lecH + tutH + labH;\n        patch.lecturesAndTutorialsNo = latNo;\n        patch.uncoveredHours = ((row.totalCoveredLectureHours ?? 0) + (row.totalCoveredTutorialHours ?? 0) + (row.totalCoveredLabHours ?? 0)) - latNo;\n      }\n      return patch;\n    }`
);

// 9. computeFormulaFields - lectureGroup/tutorialGroup
c = c.replace(
  `    if (field === 'lectureGroup' && course) { lecH = (course.weeklyLectureHours ?? 0); patch.lectureHours = lecH; }\n    if (field === 'tutorialGroup' && course) {\n      tutH = (course.weeklyTutorialHours ?? 0) * tutGroup; labH = (course.weeklyLabHours ?? 0) * tutGroup;\n      patch.seminarHours = tutH; patch.labHours = labH;\n    }`,
  `    if (field === 'lectureGroup' && course) { lecH = (course.weeklyLectureHours ?? 0); patch.lectureHours = lecH; }\n    if (field === 'tutorialGroup' && course) {\n      tutH = (course.weeklyTutorialHours ?? 0); labH = (course.weeklyLabHours ?? 0);\n      patch.seminarHours = tutH; patch.labHours = labH;\n    }`
);

// 10. openEdit
c = c.replace(
  `    setShowCreateForm(true);\n    window.scrollTo({ top: 0, behavior: 'smooth' });`,
  `    setActiveTab('create');\n    window.scrollTo({ top: 0, behavior: 'smooth' });`
);

fs.writeFileSync(file, c);
console.log('Done: basic replacements');
