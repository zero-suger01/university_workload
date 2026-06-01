const fs = require('fs');

const file = 'src/pages/admin/WorkloadAssignment.tsx';
let c = fs.readFileSync(file, 'utf8');

// Fix 1: Wrap Course Offering Summary mode block in a fragment
// Replace the opening
 c = c.replace(
  `        {mode === 'assign' && (\n        {/* ── Course Offering Summary ── */}\n        {selectedCourse && courseAssignments && (`,
  `        {mode === 'assign' && (\n        <>\n        {selectedCourse && courseAssignments && (`
 );

// Replace the closing - find the specific pattern
 c = c.replace(
  `              </div>\n            )}\n          </div>\n        )}\n        )}\n\n        {/* ── Hours row: 7 fields ── */}`,
  `              </div>\n            )}\n          </div>\n        </>\n        )}\n\n        {/* ── Hours row: 7 fields ── */}`
 );

// Fix 2: Wrap Hours row mode block properly  
// The opening is already: {mode === 'assign' && (\n        <div className="bg-white rounded-xl...
// That's fine since it starts with a div, not an expression
// But we need to make sure the closing is correct

// Let's find and fix any stray closing patterns
// The hours row ends with:          </div>\n        </div>\n        )}
c = c.replace(
  `          </div>\n        </div>\n        )}\n\n        {/* Action buttons */}`,
  `          </div>\n        </div>\n        )}\n\n        {/* Action buttons */}`
);

fs.writeFileSync(file, c);
console.log('Done: syntax fixes');
