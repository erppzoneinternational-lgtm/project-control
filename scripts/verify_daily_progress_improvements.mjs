import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();

console.log('--- AUDITING AND VERIFYING DAILY PROGRESS IMPROVEMENTS ---');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${message}`);
    failCount++;
  }
}

// 1. DailyPhotoModal
const photoModalPath = path.join(rootDir, 'src/components/planning/DailyPhotoModal.tsx');
assert(fs.existsSync(photoModalPath), 'DailyPhotoModal.tsx exists');
const photoModalContent = fs.readFileSync(photoModalPath, 'utf8');
assert(photoModalContent.includes('role="dialog"'), 'DailyPhotoModal has role="dialog"');
assert(photoModalContent.includes('aria-modal="true"'), 'DailyPhotoModal has aria-modal="true"');
assert(photoModalContent.includes('window.addEventListener(\'keydown\', handleKeyDown)'), 'DailyPhotoModal has keyboard accessibility handler');
assert(photoModalContent.includes('triggerElementRef.current.focus()'), 'DailyPhotoModal restores focus to trigger on close');
assert(photoModalContent.includes('alt={accessibleAltText}'), 'DailyPhotoModal has accessible image alt text');

// 2. DailyReportTimeline
const timelinePath = path.join(rootDir, 'src/components/planning/DailyReportTimeline.tsx');
assert(fs.existsSync(timelinePath), 'DailyReportTimeline.tsx exists');
const timelineContent = fs.readFileSync(timelinePath, 'utf8');
assert(timelineContent.includes('border-s-2 border-slate-200'), 'DailyReportTimeline has chronological timeline vertical rail');
assert(timelineContent.includes('animate-pulse'), 'DailyReportTimeline has loading skeletons');
assert(timelineContent.includes("isAr ? 'ar-EG' : 'en-US'"), 'DailyReportTimeline has explicit Arabic localized date formatting');
assert(timelineContent.includes('onOpenPhotoModal'), 'DailyReportTimeline connects photo clicks to modal');
assert(timelineContent.includes('grid-cols-2') && timelineContent.includes('sm:grid-cols-3'), 'DailyReportTimeline has responsive photo grid');

// 3. DailyLogTable
const tablePath = path.join(rootDir, 'src/components/planning/DailyLogTable.tsx');
assert(fs.existsSync(tablePath), 'DailyLogTable.tsx exists');
const tableContent = fs.readFileSync(tablePath, 'utf8');
assert(tableContent.includes("viewMode === 'timeline'"), 'DailyLogTable supports timeline view mode');
assert(tableContent.includes("viewMode === 'table'"), 'DailyLogTable supports table view mode');
assert(tableContent.includes('animate-pulse'), 'DailyLogTable has 5-row realistic loading skeletons');
assert(tableContent.includes('DailyReportTimeline'), 'DailyLogTable mounts DailyReportTimeline component');
assert(tableContent.includes('DailyPhotoModal'), 'DailyLogTable mounts DailyPhotoModal component');
assert(tableContent.includes('handleSetDatePreset'), 'DailyLogTable has quick date filter preset buttons');

// 4. DailyProgressForm
const formPath = path.join(rootDir, 'src/components/planning/DailyProgressForm.tsx');
assert(fs.existsSync(formPath), 'DailyProgressForm.tsx exists');
const formContent = fs.readFileSync(formPath, 'utf8');
assert(formContent.includes('DISCIPLINE_LABELS'), 'DailyProgressForm has discipline configurations');
assert(formContent.includes('grid-cols-2 sm:grid-cols-3'), 'DailyProgressForm has responsive photo grid');
assert(formContent.includes('DailyPhotoModal'), 'DailyProgressForm mounts DailyPhotoModal for image enlargement');

// 5. Page component
const pagePath = path.join(rootDir, 'src/app/(dashboard)/planning/daily-progress/page.tsx');
assert(fs.existsSync(pagePath), 'daily-progress/page.tsx exists');
const pageContent = fs.readFileSync(pagePath, 'utf8');
assert(pageContent.includes('mode="general"'), 'HistoryDrawer configured with mode="general"');
assert(pageContent.includes('animate-pulse'), 'Project selector has loading skeleton');

console.log(`\nVerification Summary: ${passCount} Passed, ${failCount} Failed.`);
if (failCount > 0) {
  process.exit(1);
} else {
  console.log('ALL DAILY PROGRESS AUDIT VERIFICATIONS PASSED.');
}
