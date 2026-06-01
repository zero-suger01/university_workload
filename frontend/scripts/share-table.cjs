const fs = require('fs');

const file = 'src/pages/admin/WorkloadAssignment.tsx';
let c = fs.readFileSync(file, 'utf8');

// 1. Change View tab condition to also include Assign tab
c = c.replace(
  `      {activeTab === 'view' && (\n        <div className="space-y-4">\n          {/* Filters Toolbar */}`,
  `      {(activeTab === 'view' || activeTab === 'assign') && (\n        <div className="space-y-4">\n          {activeTab === 'assign' && workloadForm('assign')}\n          {/* Filters Toolbar */}`
);

// 2. Remove the old Assign tab block (form + compact table)
// Find from:      {/* Create and Assign tabs render the form */}
// Through the end of the compact table block
const startMarker = `      {/* Create and Assign tabs render the form */}\n      {activeTab === 'create' && workloadForm('create')}\n      {activeTab === 'assign' && (`;
const startIdx = c.indexOf(startMarker);
if (startIdx !== -1) {
  // Find the end of the assign block - it should be followed by Recent Assignments
  const endMarker = `\n      {/* ── Recent Assignments ── */}`;
  const endIdx = c.indexOf(endMarker, startIdx);
  if (endIdx !== -1) {
    c = c.slice(0, startIdx) + `      {/* Create tab renders the form */}\n      {activeTab === 'create' && workloadForm('create')}` + c.slice(endIdx);
  }
}

fs.writeFileSync(file, c);
console.log('Done: shared table between View and Assign tabs');
