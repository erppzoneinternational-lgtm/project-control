import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const filesToPatch = [
  {
    path: path.join(rootDir, 'public', 'pulse-engine', 'schedule-pulse-ar.html'),
    defaultLabel: 'الحالة الحالية للمشروع',
    errorLabel: 'خطأ في قراءة بيانات المشروع: ',
  },
  {
    path: path.join(rootDir, 'public', 'pulse-engine', 'schedule-pulse-en.html'),
    defaultLabel: 'Current Project Status',
    errorLabel: 'Project data parse error: ',
  },
];

for (const item of filesToPatch) {
  if (!fs.existsSync(item.path)) {
    console.error(`File not found: ${item.path}`);
    continue;
  }

  let content = fs.readFileSync(item.path, 'utf8');
  console.log(`Processing: ${item.path} (Original size: ${(content.length / 1024 / 1024).toFixed(2)} MB)`);

  // 1. Remove baked-in snapshot
  const snapshotRegex = /window\.__SNAPSHOT__\s*=\s*\{"compressed":true[^;]+;/;
  if (snapshotRegex.test(content)) {
    content = content.replace(snapshotRegex, 'window.__SNAPSHOT__ = null;');
    console.log(`  ✓ Replaced window.__SNAPSHOT__ with null`);
  } else if (content.includes('window.__SNAPSHOT__ = null;')) {
    console.log(`  ✓ window.__SNAPSHOT__ already null`);
  } else {
    console.warn(`  ! Could not match window.__SNAPSHOT__ pattern`);
  }

  // 2. Add postMessage ERP Bridge before renderArchiveManager();\n})();
  const bridgeCode = `
  // ---------------------------------------------------------------------
  // Bidirectional ERP Bridge: Listen to messages from ERP parent portal
  // Dev by Eng. Hassan A. Soliman · 01229994728
  // ---------------------------------------------------------------------
  window.addEventListener("message", function (event) {
    const data = event.data;
    if (!data || typeof data !== "object") return;

    if (data.type === "PING_PULSE_ENGINE") {
      try {
        window.parent.postMessage({ type: "PULSE_ENGINE_READY" }, "*");
      } catch (e) {}
      return;
    }

    if (data.type === "LOAD_PROJECT_XER") {
      try {
        if (typeof hideError === "function") hideError();
        const baselineText = data.baselineXer;
        const currentText = data.currentXer || baselineText;
        const baselineName = data.baselineName || "Baseline.xer";
        const currentName = data.currentName || "Update.xer";

        if (!baselineText || typeof baselineText !== "string") {
          throw new Error("Missing baseline XER data");
        }

        const baseline = XerEngine.loadFile(baselineText);
        const current = XerEngine.loadFile(currentText);

        state.baseline = baseline;
        state.baselineText = baselineText;
        state.baselineName = baselineName;
        state.baselineUnlocked = false;
        state.baselineRevisions = [];

        const mk = (current.project && current.project.dataDate)
          ? (monthKeyOfDate(current.project.dataDate) || "current")
          : "current";
        const monthLabel = (typeof labelForMonthKey === "function" && labelForMonthKey(mk) !== "—")
          ? labelForMonthKey(mk)
          : (data.monthLabel || "${item.defaultLabel}");

        state.months = [{
          monthKey: mk,
          label: monthLabel,
          text: currentText,
          name: currentName,
          loaded: current
        }];
        state.selectedMonthKey = null;

        if (typeof resetMonthAddRow === "function") resetMonthAddRow();
        finalizeBuild(false);

        // Update project header name in topbar
        const projNameEl = typeof $ === "function" ? $("topProjName") : document.getElementById("topProjName");
        if (projNameEl && data.projectName) {
          projNameEl.textContent = "— " + data.projectName;
        }

        try {
          window.parent.postMessage({
            type: "PULSE_ENGINE_PROJECT_LOADED",
            projectName: data.projectName,
            activitiesCount: current.taskIndex ? current.taskIndex.byCode.size : 0
          }, "*");
        } catch (e) {}
      } catch (err) {
        console.error("[PulseEngine] Load error:", err);
        if (typeof showError === "function") {
          showError("${item.errorLabel}" + (err.message || ""));
        }
        try {
          window.parent.postMessage({ type: "PULSE_ENGINE_ERROR", error: err.message }, "*");
        } catch (e) {}
      }
      return;
    }

    if (data.type === "CLEAR_PROJECT_DATA") {
      state.baseline = null;
      state.baselineText = null;
      state.baselineName = null;
      state.months = [];
      state.current = null;
      const elEmpty = typeof $ === "function" ? $("emptyState") : document.getElementById("emptyState");
      const elDash = typeof $ === "function" ? $("dash") : document.getElementById("dash");
      const elTopControls = typeof $ === "function" ? $("topControls") : document.getElementById("topControls");
      if (elEmpty) elEmpty.style.display = "block";
      if (elDash) elDash.classList.remove("show");
      if (elTopControls) elTopControls.style.display = "none";
      if (typeof renderArchiveManager === "function") renderArchiveManager();
      try {
        window.parent.postMessage({ type: "PULSE_ENGINE_CLEARED" }, "*");
      } catch (e) {}
    }
  });

  // Signal ready to parent immediately
  try {
    window.parent.postMessage({ type: "PULSE_ENGINE_READY" }, "*");
  } catch (e) {}
`;

  if (!content.includes('Bidirectional ERP Bridge')) {
    const targetRegex = /renderArchiveManager\(\);\s*\r?\n\}\)\(\);/;
    if (targetRegex.test(content)) {
      content = content.replace(targetRegex, `${bridgeCode}\n  renderArchiveManager();\n})();`);
      console.log(`  ✓ Injected Bidirectional ERP Bridge`);
    } else {
      console.error(`  ! Could not find anchor matching renderArchiveManager();`);
    }
  } else {
    console.log(`  ✓ ERP Bridge already present`);
  }

  fs.writeFileSync(item.path, content, 'utf8');
  console.log(`  ✓ Saved ${item.path} (New size: ${(content.length / 1024 / 1024).toFixed(2)} MB)\n`);
}
