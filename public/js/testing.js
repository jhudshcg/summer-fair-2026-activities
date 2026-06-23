/*
 * Summer Fair 2026 shared testing helpers.
 * Query-param driven perf instrumentation lives here so shared app/runtime files stay focused.
 */

(() => {
  function createPerfProbe() {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("perf")) {
      return null;
    }

    if (window.__summerFairPerf?.enabled) {
      return window.__summerFairPerf;
    }

    const startTime = performance.now();
    const state = {
      counts: {},
      durations: {},
      marks: {},
      values: {},
    };
    let panel = null;

    function round(value) {
      return Math.round(value * 10) / 10;
    }

    function getNavigationMetrics() {
      const entry = performance.getEntriesByType("navigation")[0];
      if (!entry) {
        return [];
      }

      return [
        ["nav.domContentLoaded", round(entry.domContentLoadedEventEnd)],
        ["nav.load", round(entry.loadEventEnd)],
        ["nav.responseEnd", round(entry.responseEnd)],
      ];
    }

    function render() {
      if (!document.body) {
        return;
      }

      if (!panel) {
        panel = document.createElement("details");
        panel.className = "summer-fair-perf-panel";
        panel.open = true;
        panel.innerHTML = `
          <summary>Perf</summary>
          <pre data-perf-output></pre>
        `;
        Object.assign(panel.style, {
          position: "fixed",
          top: "calc(env(safe-area-inset-top, 0px) + 12px)",
          right: "12px",
          bottom: "auto",
          zIndex: "9999",
          width: "min(88vw, 28rem)",
          maxHeight: "min(60vh, 28rem)",
          overflow: "auto",
          padding: "0.4rem 0.6rem",
          borderRadius: "14px",
          background: "rgba(23, 50, 51, 0.94)",
          color: "#f7fff9",
          boxShadow: "0 12px 32px rgba(0, 0, 0, 0.24)",
          font: "12px/1.4 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        });
        const summary = panel.querySelector("summary");
        Object.assign(summary.style, {
          cursor: "pointer",
          fontWeight: "700",
          marginBottom: "0.35rem",
        });
        document.body.append(panel);
      }

      const output = panel.querySelector("[data-perf-output]");
      const sections = [];
      const markEntries = Object.entries(state.marks).sort((first, second) => first[1] - second[1]);
      const durationEntries = Object.entries(state.durations).sort((first, second) => second[1] - first[1]);
      const countEntries = Object.entries(state.counts).sort((first, second) => second[1] - first[1]);
      const valueEntries = Object.entries(state.values);

      sections.push("Marks (ms from script start)");
      markEntries.forEach(([name, value]) => sections.push(`${name}: ${round(value)}`));

      sections.push("\nDurations (ms total)");
      durationEntries.forEach(([name, value]) => sections.push(`${name}: ${round(value)}`));

      sections.push("\nCounts");
      countEntries.forEach(([name, value]) => sections.push(`${name}: ${value}`));

      sections.push("\nValues");
      valueEntries.forEach(([name, value]) => sections.push(`${name}: ${value}`));

      const navigationMetrics = getNavigationMetrics();
      if (navigationMetrics.length) {
        sections.push("\nNavigation");
        navigationMetrics.forEach(([name, value]) => sections.push(`${name}: ${value}`));
      }

      output.textContent = sections.join("\n");
    }

    const probe = {
      enabled: true,
      mark(name) {
        state.marks[name] = round(performance.now() - startTime);
      },
      increment(name, amount = 1) {
        state.counts[name] = (state.counts[name] || 0) + amount;
      },
      addDuration(name, duration) {
        state.durations[name] = (state.durations[name] || 0) + duration;
      },
      setValue(name, value) {
        state.values[name] = value;
      },
      render,
    };

    window.__summerFairPerf = probe;
    return probe;
  }

  const perf = createPerfProbe();

  function getPerfProbe() {
    return perf?.enabled ? perf : null;
  }

  function measure(name, callback) {
    const probe = getPerfProbe();
    if (!probe) {
      return callback();
    }

    const startedAt = performance.now();
    try {
      return callback();
    } finally {
      probe.addDuration(name, performance.now() - startedAt);
    }
  }

  window.summerFairTesting = {
    getPerfProbe,
    measure,
  };

  window.addEventListener("load", () => {
    const probe = getPerfProbe();
    if (!probe) {
      return;
    }

    probe.mark("window.load");
    probe.render();
  }, { once: true });
})();