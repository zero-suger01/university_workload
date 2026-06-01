const fs = require('fs');

const file = 'src/pages/admin/WorkloadAssignment.tsx';
let c = fs.readFileSync(file, 'utf8');

// ── 1. Change workloadForm to a function with mode parameter ──
c = c.replace(
  `  const workloadForm = (`,
  `  const workloadForm = (mode: 'create' | 'assign') => (`
);

// ── 2. Change FormHeader based on mode ──
c = c.replace(
  `      <FormHeader\n        title={editingId ? \`\${t('edit')} Workload\` : 'Create New Workload'}\n        subtitle={editingId ? editBanner : 'Select course, groups and assign faculty'}\n        onClose={editingId ? resetForm : undefined}\n      />`,
  `      <FormHeader\n        title={editingId ? \`\${t('edit')} Workload\` : mode === 'create' ? 'Create Workload' : 'Assign Workload'}\n        subtitle={editingId ? editBanner : mode === 'create' ? 'Enter course and group information' : 'Enter hours and assign faculty'}\n        onClose={editingId ? resetForm : undefined}\n      />`
);

// ── 3. Wrap Academic Staff in mode === 'assign' conditional ──
// The Academic Staff div starts at line ~1049 and ends at line ~1072
c = c.replace(
  `            <div>\n              <label className="block text-[10px] font-medium text-gray-500 mb-0 leading-none">Academic Staff <span className="text-red-400">*</span></label>\n              <input type="hidden" {...register('facultyId')} />\n              <div ref={facultyRef} className="relative">\n                <div className="relative">\n                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />\n                  <input type="text" value={facultySearch} onChange={(e) => { setFacultySearch(e.target.value); setShowFacultyDropdown(true); if (!e.target.value) setValue('facultyId', ''); }} onFocus={() => setShowFacultyDropdown(true)} placeholder="Select staff" className="input pl-6 pr-5 py-1 text-[11px] h-7 mt-[1px]" autoComplete="off" />\n                  {facultySearch && (<button type="button" onClick={() => { setFacultySearch(''); setValue('facultyId', ''); }} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-2.5 h-2.5" /></button>)}\n                </div>\n                {showFacultyDropdown && (\n                  <div className="absolute z-20 mt-0.5 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">\n                    {filteredFacultyOptions.length === 0 ? (<p className="px-2 py-1.5 text-[11px] text-gray-400">No professors found</p>) : (\n                      filteredFacultyOptions.map((u: { id: string; firstName: string; lastName: string; employeeId?: string }) => (\n                        <button key={u.id} type="button" onMouseDown={() => { setValue('facultyId', u.id, { shouldValidate: true }); setFacultySearch(\`\${u.firstName} \${u.lastName}\`); setShowFacultyDropdown(false); }} className="w-full text-left px-2 py-1 text-[11px] hover:bg-primary-50 hover:text-primary-700 flex items-center justify-between gap-1">\n                          <span className="font-medium">{u.firstName} {u.lastName}</span>\n                          {u.employeeId && <span className="text-[9px] text-gray-400 font-mono">{u.employeeId}</span>}\n                        </button>\n                      ))\n                    )}\n                  </div>\n                )}\n              </div>\n              {errors.facultyId && <p className="text-red-500 text-[9px] mt-0 leading-none">{t('selectFaculty')}</p>}\n            </div>\n          </div>\n        </div>`,
  `            {mode === 'assign' && (\n            <div>\n              <label className="block text-[10px] font-medium text-gray-500 mb-0 leading-none">Academic Staff <span className="text-red-400">*</span></label>\n              <input type="hidden" {...register('facultyId')} />\n              <div ref={facultyRef} className="relative">\n                <div className="relative">\n                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />\n                  <input type="text" value={facultySearch} onChange={(e) => { setFacultySearch(e.target.value); setShowFacultyDropdown(true); if (!e.target.value) setValue('facultyId', ''); }} onFocus={() => setShowFacultyDropdown(true)} placeholder="Select staff" className="input pl-6 pr-5 py-1 text-[11px] h-7 mt-[1px]" autoComplete="off" />\n                  {facultySearch && (<button type="button" onClick={() => { setFacultySearch(''); setValue('facultyId', ''); }} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-2.5 h-2.5" /></button>)}\n                </div>\n                {showFacultyDropdown && (\n                  <div className="absolute z-20 mt-0.5 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">\n                    {filteredFacultyOptions.length === 0 ? (<p className="px-2 py-1.5 text-[11px] text-gray-400">No professors found</p>) : (\n                      filteredFacultyOptions.map((u: { id: string; firstName: string; lastName: string; employeeId?: string }) => (\n                        <button key={u.id} type="button" onMouseDown={() => { setValue('facultyId', u.id, { shouldValidate: true }); setFacultySearch(\`\${u.firstName} \${u.lastName}\`); setShowFacultyDropdown(false); }} className="w-full text-left px-2 py-1 text-[11px] hover:bg-primary-50 hover:text-primary-700 flex items-center justify-between gap-1">\n                          <span className="font-medium">{u.firstName} {u.lastName}</span>\n                          {u.employeeId && <span className="text-[9px] text-gray-400 font-mono">{u.employeeId}</span>}\n                        </button>\n                      ))\n                    )}\n                  </div>\n                )}\n              </div>\n              {errors.facultyId && <p className="text-red-500 text-[9px] mt-0 leading-none">{t('selectFaculty')}</p>}\n            </div>\n            )}\n          </div>\n        </div>`
);

// ── 4. Wrap Course Offering Summary in mode === 'assign' ──
c = c.replace(
  `        {/* ── Course Offering Summary ── */}\n        {selectedCourse && courseAssignments && (`,
  `        {mode === 'assign' && (\n        {/* ── Course Offering Summary ── */}\n        {selectedCourse && courseAssignments && (`
);

// Close the mode === 'assign' wrapper after Course Offering Summary ends
// It ends with:           </div>\n        )}
c = c.replace(
  `              </div>\n            )}\n          </div>\n        )}\n\n        {/* ── Hours row: 7 fields ── */}`,
  `              </div>\n            )}\n          </div>\n        )}\n        )}\n\n        {/* ── Hours row: 7 fields ── */}`
);

// ── 5. Wrap Hours row in mode === 'assign' ──
c = c.replace(
  `        {/* ── Hours row: 7 fields ── */}\n        <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-5">\n          {selectedCourse && (`,
  `        {mode === 'assign' && (\n        <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-5">\n          {selectedCourse && (`
);

// Close the mode === 'assign' wrapper after Hours row ends
// It ends with:        </div>
c = c.replace(
  `          </div>\n        </div>\n\n        {/* Action buttons */}`,
  `          </div>\n        </div>\n        )}\n\n        {/* Action buttons */}`
);

// ── 6. Fix the clientRequired calculation in Hours row ──
c = c.replace(
  `          {(() => {\n            // Required = catalog × current form group values (NOT server planningRow defaults)\n            const n = Number(lectureGroupVal) || 0;\n            const o = Number(tutorialGroupVal) || 0;\n            const clientRequired = selectedCourse\n              ? (selectedCourse.weeklyLectureHours || 0) * n\n              + (selectedCourse.weeklyTutorialHours || 0) * o\n              + (selectedCourse.weeklyLabHours     || 0) * o\n              : 0;`,
  `          {(() => {\n            // Required = catalog hours directly (no multiplication by groups)\n            const clientRequired = selectedCourse\n              ? (selectedCourse.weeklyLectureHours || 0)\n              + (selectedCourse.weeklyTutorialHours || 0)\n              + (selectedCourse.weeklyLabHours     || 0)\n              : 0;`
);

// Also fix the Course Offering Summary display that shows multiplication
c = c.replace(
  `<p className="text-[11px] font-bold text-center text-gray-800">{selectedCourse.weeklyTutorialHours}h × {tutorialGroupVal || 0} = <span className="text-blue-600">{courseAssignments.required.tutorial}h</span></p>`,
  `<p className="text-[11px] font-bold text-center text-gray-800">{selectedCourse.weeklyTutorialHours}h = <span className="text-blue-600">{courseAssignments.required.tutorial}h</span></p>`
);

c = c.replace(
  `<p className="text-[11px] font-bold text-center text-gray-800">{selectedCourse.weeklyLabHours}h × {tutorialGroupVal || 0} = <span className="text-blue-600">{courseAssignments.required.lab}h</span></p>`,
  `<p className="text-[11px] font-bold text-center text-gray-800">{selectedCourse.weeklyLabHours}h = <span className="text-blue-600">{courseAssignments.required.lab}h</span></p>`
);

// ── 7. Change action buttons to be mode-dependent ──
c = c.replace(
  `        {/* Action buttons */}\n        <div className="flex gap-2 pt-0.5">\n          {editingId && (<button type="button" onClick={resetForm} className="btn-secondary flex-1 py-1.5 text-[11px]">{t('cancel')}</button>)}\n          <button type="submit" disabled={isPending} className={\`btn-primary flex items-center justify-center gap-1 py-1.5 text-[11px] \${editingId ? 'flex-1' : 'w-full'}\`}>\n            {isPending && <Loader2 className="w-3 h-3 animate-spin" />}\n            {editingId ? t('save') : t('assignWorkloadBtn')}\n          </button>\n        </div>`,
  `        {/* Action buttons */}\n        {mode === 'create' && (\n        <div className="flex gap-2 pt-0.5">\n          {editingId && (<button type="button" onClick={resetForm} className="btn-secondary flex-1 py-1.5 text-[11px]">{t('cancel')}</button>)}\n          <button type="button" onClick={() => setActiveTab('assign')} className={\`btn-primary flex items-center justify-center gap-1 py-1.5 text-[11px] \${editingId ? 'flex-1' : 'w-full'}\`}>\n            {editingId ? 'Continue to Assign →' : 'Continue to Assign →'}\n          </button>\n        </div>\n        )}\n        {mode === 'assign' && (\n        <div className="flex gap-2 pt-0.5">\n          <button type="button" onClick={() => setActiveTab('create')} className="btn-secondary flex-1 py-1.5 text-[11px]">← Back</button>\n          <button type="submit" disabled={isPending} className="btn-primary flex items-center justify-center gap-1 py-1.5 text-[11px] flex-1">\n            {isPending && <Loader2 className="w-3 h-3 animate-spin" />}\n            {editingId ? t('save') : 'Assign Workload'}\n          </button>\n        </div>\n        )}`
);

// ── 8. Restructure return statement: replace view tab form references ──
// Remove: {activeTab === 'view' && showCreateForm && ( ... {workloadForm} ... )}
c = c.replace(
  `      {/* ── Create Workload form inside View tab ── */}\n      {activeTab === 'view' && showCreateForm && (\n        <div className="mt-4">\n          {workloadForm}\n        </div>\n      )}`,
  `      {/* Create and Assign tabs render the form */}\n      {activeTab === 'create' && workloadForm('create')}\n      {activeTab === 'assign' && workloadForm('assign')}`
);

// ── 9. Remove View Table button from filters toolbar ──
c = c.replace(
  `                <button\n                  onClick={() => setShowViewTableModal(true)}\n                  className="px-3 py-2 text-sm font-medium text-primary-700 bg-primary-50 border border-primary-200 hover:bg-primary-100 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap"\n                >\n                  <Eye className="w-3.5 h-3.5 text-primary-600" />\n                  View Table\n                </button>\n                <button`,
  `                <button`
);

// ── 10. In view tab, remove the !showCreateForm wrapper so table is always shown ──
// Find and replace the conditional rendering in the view tab
c = c.replace(
  `          {!showCreateForm && (\n          <>\n          {/* Results count */}`,
  `          {/* Results count */}`
);

// Find the closing of that conditional
c = c.replace(
  `          </>\n          )}\n        </div>\n      )}\n\n      {/* Create and Assign tabs render the form */}`,
  `        </div>\n      )}\n\n      {/* Create and Assign tabs render the form */}`
);

fs.writeFileSync(file, c);
console.log('Done: form splitting and tab restructuring');
