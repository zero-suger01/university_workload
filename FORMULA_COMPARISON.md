# Excel Fall2026_planning vs Website — Formula Comparison (Updated)

## Excel Formulas Extracted (Fall2026_planning tab)

| Column | Header | Formula |
|--------|--------|---------|
| E | Course code | `=VLOOKUP($F5,courseCatalog!$B:$I,2,FALSE)` |
| I | Course ECTS | `=VLOOKUP($F5,courseCatalog!$B:$M,9,FALSE)` |
| J | Semester ECTS | `=SUM(I5:I9)` |
| K | Responsible Department | `=INDEX(courseCatalog!$L:$L,MATCH($E5,courseCatalog!$C:$C,0))` |
| S | Lecture hours | `=VLOOKUP($F5,courseCatalog!$B:$M,5,FALSE)*N5` |
| T | Tutorial hours | `=VLOOKUP($F5,courseCatalog!$B:$M,6,FALSE)*O5` |
| U | Lab hours | `=VLOOKUP($F5,courseCatalog!$B:$M,7,FALSE)*O5` |
| V | Total covered hours per week | `=SUM(Y5:BF5)` |
| W | Uncovered hours | `=V5-X5` |
| X | Lectures and tutorials nº | `=SUM(S5:U5)` |
| CQ | (agg) Total Uncovered by Course | `=SUMIF(F$5:F920,$CP5,W$5:W920)` |
| CR | (agg) Total Cohorts by Course | `=SUMIF($F:$F,$CP5,$N:$N)` |
| CS | (agg) Total Small Groups by Course | `=SUMIF($F:$F,$CP5,$O:$O)` |
| CT | (agg) Total Lecture Hours by Course | `=SUMIF($F:$F,$CP5,$S:$S)` |
| CU | (agg) Total Tutorial Hours by Course | `=SUMIF($F:$F,$CP5,$T:$T)` |
| CV | (agg) Avg Uncovered per Group | `=CQ5/CV$4` |
| CW | (agg) Responsible Dept by Course | `=INDEX($K$5:$K920,MATCH($CP5,$F$5:$F920,0))` |

> **Excel Logic**: `W = V - X` = Covered - Required. **Negative = shortage** (e.g., -12, -30).

---

## Detailed Comparison Table

| # | Excel Formula | Column | Website Implementation | Status |
|---|--------------|--------|----------------------|--------|
| 1 | `VLOOKUP($F5,courseCatalog!$B:$I,2,FALSE)` | **E — Course Code** | Backend fetches `course.courseCode` by `courseId`. Frontend auto-fills from catalog. | ✅ **CORRECT** |
| 2 | `VLOOKUP($F5,courseCatalog!$B:$M,9,FALSE)` | **I — Course ECTS** | `course.ectsCredits` auto-populated in frontend + backend (`workloads.service.ts:262-264`) | ✅ **CORRECT** |
| 3 | `SUM(I5:I9)` | **J — Semester ECTS** | Frontend sums `courseECTS` of all workloads with same `semesterId` + `program` (`WorkloadAssignment.tsx:475-481`). Stored per record. | ⚠️ **PARTIALLY CORRECT** — Block-level sum in Excel vs filter-based sum in web. Value stored redundantly on each workload record. |
| 4 | `INDEX(MATCH($E5,courseCatalog!$C:$C,0))` | **K — Responsible Dept** | `course.department.name` auto-filled in frontend (`WorkloadAssignment.tsx:618`). Backend stores it on `WorkloadRecord.responsibleDepartment` (`workloads.service.ts:265-267`). In course catalog, it's a separate free-text dropdown (`Course.responsibleDepartment`). | ✅ **CORRECT** |
| 5 | `VLOOKUP($F5,courseCatalog!$B:$M,5,FALSE)*N5` | **S — Lecture Hours** | Frontend: `(weeklyLectureHours ?? 0) * lectureGroup` (`WorkloadAssignment.tsx:507`). Backend: `(course.weeklyLectureHours \|\| 0) * lectureGroups` (`workloads.service.ts:213`). | ✅ **CORRECT** |
| 6 | `VLOOKUP($F5,courseCatalog!$B:$M,6,FALSE)*O5` | **T — Tutorial Hours** | Frontend: `(weeklyTutorialHours ?? 0) * tutorialGroup` (`WorkloadAssignment.tsx:508`). Backend: `(course.weeklyTutorialHours \|\| 0) * tutorialGroups` (`workloads.service.ts:214`). | ✅ **CORRECT** |
| 7 | `VLOOKUP($F5,courseCatalog!$B:$M,7,FALSE)*O5` | **U — Lab Hours** | Frontend: `(weeklyLabHours ?? 0) * tutorialGroup` (`WorkloadAssignment.tsx:509`). Backend: `(course.weeklyLabHours \|\| 0) * labGroupsEffective` where `labGroupsEffective = planningRow?.labGroups \|\| tutorialGroups` (`workloads.service.ts:211-215`). | ✅ **CORRECT** |
| 8 | `SUM(Y5:BF5)` | **V — Total Covered Hrs** | **No direct equivalent.** Website tracks covered hours via `WorkloadRecord` (legacy) + `WorkloadAssignment` (planning). Backend `recalculatePlanningRow` unions both with `Math.max(assign, legacy)` per type. | ⚠️ **ARCHITECTURALLY DIFFERENT** — Excel uses row-based faculty column matrix (Y-BF). Website uses normalized DB records. Conceptually similar totals but different data structure. |
| 9 | `V5-X5` | **W — Uncovered Hours** | **Frontend inline edit** (`WorkloadAssignment.tsx:625,654,659`): `uncoveredHours = (covLec + covTut) - latNo` — **MISSING lab covered hours!**<br><br>**Backend `getCourseAssignments`** (`workloads.service.ts:229`): `uncovered.total = coveredTotal - requiredTotal` — ✅ Correct (negative = shortage).<br><br>**Backend `recalculatePlanningRow`** (`workload-assignments.service.ts:55`): `uncoveredHours = Math.max(0, totalRequiredHours - totalCoveredHours)` — ❌ **Clips negative to 0!** | ❌ **BUG / INCONSISTENT** |
| 10 | `SUM(S5:U5)` | **X — Lec+Tut Nº** | Frontend: `reqTotal = reqLec + reqTut + reqLab` (`WorkloadAssignment.tsx:510`). Inline edit: `latNo = lecH + tutH + labH` (`WorkloadAssignment.tsx:652`). | ✅ **CORRECT** |
| 11 | `SUMIF(F$5:F920,$CP5,W$5:W920)` | **CQ — Total Uncovered by Course** | Backend `getCourseAssignments` returns uncovered per course+semester. No per-course aggregation across all programs/languages. | ⚠️ **NOT IMPLEMENTED** |
| 12 | `SUMIF($F:$F,$CP5,$N:$N)` | **CR — Total Cohorts by Course** | Not implemented as a separate aggregation endpoint. | ⚠️ **NOT IMPLEMENTED** |
| 13 | `SUMIF($F:$F,$CP5,$O:$O)` | **CS — Total Small Groups by Course** | Not implemented as a separate aggregation endpoint. | ⚠️ **NOT IMPLEMENTED** |
| 14 | `SUMIF($F:$F,$CP5,$S:$S)` | **CT — Total Lecture Hrs by Course** | Not implemented as a separate aggregation endpoint. | ⚠️ **NOT IMPLEMENTED** |
| 15 | `SUMIF($F:$F,$CP5,$T:$T)` | **CU — Total Tutorial Hrs by Course** | Not implemented as a separate aggregation endpoint. | ⚠️ **NOT IMPLEMENTED** |
| 16 | `CQ5/CV$4` | **CV — Avg Uncovered/Group** | Not implemented. | ⚠️ **NOT IMPLEMENTED** |
| 17 | `INDEX(MATCH($CP5,$F$5:$F920,0))` | **CW — Resp. Dept by Course** | Not implemented as a per-course aggregation. `responsibleDepartment` is stored per workload record. | ⚠️ **NOT IMPLEMENTED** |

---

## Critical Bugs (Confirmed — Still Present)

### 🔴 Bug 1: Uncovered Hours Missing Lab Coverage (Frontend)
**File**: `frontend/src/pages/admin/WorkloadAssignment.tsx` — lines 625, 654, 659

```tsx
// Line 625 — when courseTitle changes:
patch.uncoveredHours = ((row.totalCoveredLectureHours ?? 0) + (row.totalCoveredTutorialHours ?? 0)) - latNo;
// BUG: missing + (row.totalCoveredLabHours ?? 0)

// Line 654 — when lecture/tutorial/lab hours change:
patch.uncoveredHours = (covLec + covTut) - latNo;
// BUG: missing + covLab

// Line 659 — when lecturesAndTutorialsNo changes:
patch.uncoveredHours = (covLec + covTut) - Number(val);
// BUG: missing + covLab
```

**Impact**: If a course has lab hours, the inline edit will show more shortage than actually exists.

---

### 🔴 Bug 2: Uncovered Hours Clipped to Zero (Backend PlanningRow)
**File**: `backend/src/modules/workload-assignments/workload-assignments.service.ts` — line 55

```ts
const uncoveredHours = Math.max(0, totalRequiredHours - totalCoveredHours);
```

**Excel behavior**: `W = V - X` can be **negative** (e.g., -12, -30), which means **shortage**.

**Website behavior**: `Math.max(0, ...)` clips all negatives to `0`.

**Impact**: PlanningRow in DB never stores negative uncovered hours. The `SemesterPlanningPage` and vacancy forecast will show `0` shortage even when there is one.

---

### 🟡 Bug 3: Missing `totalCoveredLabHours` in Form State
**File**: `frontend/src/pages/admin/WorkloadAssignment.tsx` — lines 520-522

The form stores `totalCoveredLectureHours` and `totalCoveredTutorialHours` but **does NOT store `totalCoveredLabHours`**. Lab covered hours are invisible in the workload assignment UI.

---

## Summary

| Category | Count |
|----------|-------|
| ✅ Correct | 6 |
| ⚠️ Partially Correct / Different Architecture | 2 |
| ❌ Bug / Inconsistent | 1 |
| ⚠️ Not Implemented (CQ-CW aggregations) | 6 |

**Overall**: The 6 core per-row formulas (Course Code, ECTS, Lecture, Tutorial, Lab, Lec+Tut Nº) are implemented correctly. The main problems are:
1. **Uncovered Hours** has 3 different implementations that don't agree with each other
2. **Course-level aggregation formulas** (CQ-CW) are not implemented at all
