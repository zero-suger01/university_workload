const fs = require('fs');

const file = 'src/pages/admin/WorkloadAssignment.tsx';
let c = fs.readFileSync(file, 'utf8');

// ── 1. Remove the {mode === 'assign' && (...)} wrapper around Academic Staff inside first card ──
// The Academic Staff is wrapped in {mode === 'assign' && (\n<div>...\n</div>\n)}
c = c.replace(
  `            {mode === 'assign' && (\n            <div>\n              <label className="block text-[10px] font-medium text-gray-500 mb-0 leading-none">Academic Staff <span className="text-red-400">*</span></label>\n              <input type="hidden" {...register('facultyId')} />\n              <div ref={facultyRef} className="relative">\n                <div className="relative">\n                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />\n                  <input type="text" value={facultySearch} onChange={(e) => { setFacultySearch(e.target.value); setShowFacultyDropdown(true); if (!e.target.value) setValue('facultyId', ''); }} onFocus={() => setShowFacultyDropdown(true)} placeholder="Select staff" className="input pl-6 pr-5 py-1 text-[11px] h-7 mt-[1px]" autoComplete="off" />\n                  {facultySearch && (<button type="button" onClick={() => { setFacultySearch(''); setValue('facultyId', ''); }} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-2.5 h-2.5" /></button>)}\n                </div>\n                {showFacultyDropdown && (\n                  <div className="absolute z-20 mt-0.5 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">\n                    {filteredFacultyOptions.length === 0 ? (<p className="px-2 py-1.5 text-[11px] text-gray-400">No professors found</p>) : (\n                      filteredFacultyOptions.map((u: { id: string; firstName: string; lastName: string; employeeId?: string }) => (\n                        <button key={u.id} type="button" onMouseDown={() => { setValue('facultyId', u.id, { shouldValidate: true }); setFacultySearch(\`\${u.firstName} \${u.lastName}\`); setShowFacultyDropdown(false); }} className="w-full text-left px-2 py-1 text-[11px] hover:bg-primary-50 hover:text-primary-700 flex items-center justify-between gap-1">\n                          <span className="font-medium">{u.firstName} {u.lastName}</span>\n                          {u.employeeId && <span className="text-[9px] text-gray-400 font-mono">{u.employeeId}</span>}\n                        </button>\n                      ))\n                    )}\n                  </div>\n                )}\n              </div>\n              {errors.facultyId && <p className="text-red-500 text-[9px] mt-0 leading-none">{t('selectFaculty')}</p>}\n            </div>\n            )}`,
  ``
);

// ── 2. Wrap the entire first card in {mode === 'create' && (...)} ──
// Find:       {/* ── Ultra-compact single-card form ── */}
//             <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-5">
// And the closing of the first card (the </div></div> after Groups-Joint Groups)
c = c.replace(
  `      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">\n        {/* ── Ultra-compact single-card form ── */}\n        <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-5">`,
  `      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">\n        {mode === 'create' && (\n        <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-5">`
);

// Close the mode wrapper after the first card ends
// The first card ends with:          </div>\n        </div>\n\n        {mode === 'assign' && (\n        <>
c = c.replace(
  `          </div>\n        </div>\n\n        {mode === 'assign' && (\n        <>`,
  `          </div>\n        </div>\n        )}\n\n        {mode === 'assign' && (\n        <div className="bg-white rounded-xl border border-gray-200 p-3">\n          <div>\n            <label className="block text-[10px] font-medium text-gray-500 mb-0 leading-none">Academic Staff <span className="text-red-400">*</span></label>\n            <input type="hidden" {...register('facultyId')} />\n            <div ref={facultyRef} className="relative">\n              <div className="relative">\n                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />\n                <input type="text" value={facultySearch} onChange={(e) => { setFacultySearch(e.target.value); setShowFacultyDropdown(true); if (!e.target.value) setValue('facultyId', ''); }} onFocus={() => setShowFacultyDropdown(true)} placeholder="Select staff" className="input pl-6 pr-5 py-1 text-[11px] h-7 mt-[1px]" autoComplete="off" />\n                {facultySearch && (<button type="button" onClick={() => { setFacultySearch(''); setValue('facultyId', ''); }} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-2.5 h-2.5" /></button>)}\n              </div>\n              {showFacultyDropdown && (\n                <div className="absolute z-20 mt-0.5 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">\n                  {filteredFacultyOptions.length === 0 ? (<p className="px-2 py-1.5 text-[11px] text-gray-400">No professors found</p>) : (\n                    filteredFacultyOptions.map((u: { id: string; firstName: string; lastName: string; employeeId?: string }) => (\n                      <button key={u.id} type="button" onMouseDown={() => { setValue('facultyId', u.id, { shouldValidate: true }); setFacultySearch(\`\${u.firstName} \${u.lastName}\`); setShowFacultyDropdown(false); }} className="w-full text-left px-2 py-1 text-[11px] hover:bg-primary-50 hover:text-primary-700 flex items-center justify-between gap-1">\n                        <span className="font-medium">{u.firstName} {u.lastName}</span>\n                        {u.employeeId && <span className="text-[9px] text-gray-400 font-mono">{u.employeeId}</span>}\n                      </button>\n                    ))\n                  )}\n                </div>\n              )}\n            </div>\n            {errors.facultyId && <p className="text-red-500 text-[9px] mt-0 leading-none">{t('selectFaculty')}</p>}\n          </div>\n        </div>\n        )}\n\n        {mode === 'assign' && (\n        <>`
);

// ── 3. Make "Create Workload →" button smaller ──
c = c.replace(
  `            {editingId ? 'Continue to Assign →' : 'Create Workload →'}\n          </button>\n        </div>\n        )}`,
  `            {editingId ? 'Continue to Assign →' : 'Create Workload →'}\n          </button>\n        </div>\n        )}`
);

// Actually change the button size - find the specific className
c = c.replace(
  `          <button type="button" onClick={() => setActiveTab('assign')} className={\`btn-primary flex items-center justify-center gap-1 py-1.5 text-[11px] \${editingId ? 'flex-1' : 'w-full'}\`}>`,
  `          <button type="button" onClick={() => setActiveTab('assign')} className={\`btn-primary flex items-center justify-center gap-1 py-1.5 text-[11px] \${editingId ? 'flex-1' : 'w-40'}\`}>`
);

fs.writeFileSync(file, c);
console.log('Done: form mode fixes');
