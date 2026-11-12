import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const configs = [
  {
    path: path.join(rootDir, 'public', 'pulse-engine', 'schedule-pulse-ar.html'),
    isAr: true,
    defaultLabel: 'الحالة الحالية للمشروع',
    errorLabel: 'خطأ في قراءة بيانات المشروع: ',
  },
  {
    path: path.join(rootDir, 'public', 'pulse-engine', 'schedule-pulse-en.html'),
    isAr: false,
    defaultLabel: 'Current Project Status',
    errorLabel: 'Project data parse error: ',
  },
];

for (const cfg of configs) {
  if (!fs.existsSync(cfg.path)) {
    console.error(`File not found: ${cfg.path}`);
    continue;
  }

  let content = fs.readFileSync(cfg.path, 'utf8');
  console.log(`Processing: ${cfg.path} (${(content.length / 1024 / 1024).toFixed(2)} MB)`);

  const bridgeReplacement = `// ---------------------------------------------------------------------
  // Bidirectional ERP Bridge: Listen to messages from ERP parent portal
  // Dev by Eng. Hassan A. Soliman · 01229994728
  // ---------------------------------------------------------------------
  function handleLoadProjectXer(data) {
    if (!data) return;
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
        : (data.monthLabel || "${cfg.defaultLabel}");

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

      if (window.parent && window.parent !== window) {
        try {
          window.parent.postMessage({
            type: "PULSE_ENGINE_PROJECT_LOADED",
            projectName: data.projectName,
            activitiesCount: current.taskIndex ? current.taskIndex.byCode.size : 0
          }, "*");
        } catch (e) {}
      }
    } catch (err) {
      console.error("[PulseEngine] Load error:", err);
      if (typeof showError === "function") {
        showError("${cfg.errorLabel}" + (err.message || ""));
      }
      if (window.parent && window.parent !== window) {
        try {
          window.parent.postMessage({ type: "PULSE_ENGINE_ERROR", error: err.message }, "*");
        } catch (e) {}
      }
    }
  }

  function handleClearProjectData() {
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
    const projNameEl = typeof $ === "function" ? $("topProjName") : document.getElementById("topProjName");
    if (projNameEl) projNameEl.textContent = "";
    if (typeof renderArchiveManager === "function") renderArchiveManager();
    if (window.parent && window.parent !== window) {
      try {
        window.parent.postMessage({ type: "PULSE_ENGINE_CLEARED" }, "*");
      } catch (e) {}
    }
  }

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
      handleLoadProjectXer(data);
      return;
    }

    if (data.type === "CLEAR_PROJECT_DATA") {
      handleClearProjectData();
      return;
    }

    if (data.type === "GET_CURRENT_SCHEDULE_DATA") {
      try {
        const baselineParsed = state.baseline;
        const actCount = baselineParsed ? (baselineParsed.taskIndex ? baselineParsed.taskIndex.byCode.size : (baselineParsed.tasks ? baselineParsed.tasks.length : 0)) : 0;
        window.parent.postMessage({
          type: "CURRENT_SCHEDULE_DATA_RESPONSE",
          baselineText: state.baselineText,
          baselineName: state.baselineName || "Baseline.xer",
          currentText: (state.current && state.current.text) || state.baselineText,
          currentName: (state.current && state.current.name) || state.baselineName || "Current.xer",
          hasBaseline: !!state.baseline,
          activitiesCount: actCount
        }, "*");
      } catch (e) {
        console.error("GET_CURRENT_SCHEDULE_DATA error:", e);
      }
      return;
    }
  });

  // ---------------------------------------------------------------------
  // Cross-Tab Synchronization Harness (BroadcastChannel + localStorage + API Fallback)
  // Ensures standalone windows automatically sync with the ERP active project in real time
  // Dev by Eng. Hassan A. Soliman · 01229994728
  // ---------------------------------------------------------------------
  (function initCrossTabSync() {
    var urlParams = null;
    try {
      urlParams = new URLSearchParams(window.location.search);
    } catch (e) {}
    var targetProjectId = urlParams ? urlParams.get("projectId") : null;
    var projectLoaded = false;

    // 1. Initial load from localStorage (instant offline sync)
    try {
      var saved = localStorage.getItem("pzone_active_pulse_project");
      if (saved) {
        var parsed = JSON.parse(saved);
        if (parsed && parsed.type === "LOAD_PROJECT_XER" && parsed.baselineXer) {
          if (!targetProjectId || parsed.projectId === targetProjectId) {
            handleLoadProjectXer(parsed);
            projectLoaded = true;
          }
        }
      }
    } catch (err) {
      console.warn("[PulseEngine] localStorage read error:", err);
    }

    // 2. Cross-tab storage event listener
    window.addEventListener("storage", function (e) {
      if (e.key === "pzone_active_pulse_project") {
        if (!e.newValue) {
          handleClearProjectData();
          return;
        }
        try {
          var payload = JSON.parse(e.newValue);
          if (payload && payload.type === "LOAD_PROJECT_XER") {
            handleLoadProjectXer(payload);
          }
        } catch (err) {
          console.error("[PulseEngine] storage event parse error:", err);
        }
      }
    });

    // 3. BroadcastChannel for instant real-time synchronization (< 5ms)
    if (typeof BroadcastChannel !== "undefined") {
      try {
        var syncChannel = new BroadcastChannel("pzone_pulse_sync");
        syncChannel.addEventListener("message", function (e) {
          var data = e.data;
          if (!data || typeof data !== "object") return;
          if (data.type === "LOAD_PROJECT_XER") {
            handleLoadProjectXer(data);
          } else if (data.type === "CLEAR_PROJECT_DATA") {
            handleClearProjectData();
          }
        });

        // Announce presence and request latest active project from ERP portal tab
        syncChannel.postMessage({
          type: "REQUEST_ACTIVE_PULSE_PROJECT",
          requestedProjectId: targetProjectId || undefined,
          timestamp: Date.now()
        });
      } catch (err) {
        console.warn("[PulseEngine] BroadcastChannel error:", err);
      }
    }

    // 4. REST API Fallback if standalone window has no project loaded yet
    if (!projectLoaded && typeof window !== "undefined" && window === window.top) {
      var apiUrl = "/api/planning/pulse-project" + (targetProjectId ? "?projectId=" + encodeURIComponent(targetProjectId) : "");
      fetch(apiUrl)
        .then(function(res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          return res.json();
        })
        .then(function(data) {
          if (data && data.success && data.baselineXer) {
            handleLoadProjectXer(data);
            try {
              localStorage.setItem("pzone_active_pulse_project", JSON.stringify(data));
            } catch (e) {}
          }
        })
        .catch(function(err) {
          console.info("[PulseEngine] API project fetch fallback:", err.message);
        });
    }
  })();

  // Signal ready to parent immediately
  if (window.parent && window.parent !== window) {
    try {
      window.parent.postMessage({ type: "PULSE_ENGINE_READY" }, "*");
    } catch (e) {}
  }
`;

  const bridgeMarker = '// Bidirectional ERP Bridge: Listen to messages from ERP parent portal';
  const startIndex = content.indexOf(bridgeMarker);
  if (startIndex === -1) {
    console.error(`Marker not found in ${cfg.path}`);
    continue;
  }

  const commentLineStart = content.lastIndexOf('// -----', startIndex);
  const actualStart = commentLineStart !== -1 ? commentLineStart : startIndex;

  let endIndex = content.lastIndexOf('renderArchiveManager();\r\n})();');
  if (endIndex === -1) {
    endIndex = content.lastIndexOf('renderArchiveManager();\n})();');
  }
  if (endIndex === -1) {
    console.error(`renderArchiveManager() not found at script end in ${cfg.path}`);
    continue;
  }

  const before = content.slice(0, actualStart);
  const after = content.slice(endIndex);

  content = before + bridgeReplacement + '\n  ' + after;

  fs.writeFileSync(cfg.path, content, 'utf8');
  console.log(`  ✓ Successfully patched ${cfg.path} (${(content.length / 1024 / 1024).toFixed(2)} MB)\n`);
}
