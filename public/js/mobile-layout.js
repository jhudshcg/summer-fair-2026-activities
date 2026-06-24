/*
 * Summer Fair 2026 shared mobile layout and ornament positioning helpers.
 */

(() => {
  let browserChromeOffsetsBound = false;
  let browserChromeUpdateQueued = false;
  const perf = window.summerFairTesting?.getPerfProbe?.() || null;
  const appliedBrowserChromeState = {
    iosSafariFallback: null,
    applePlatformAdjustment: null,
    topOffset: null,
    rightOffset: null,
    bottomOffset: null,
  };
  const ORNAMENTS = [
    { wrapClass: "page-ornament-wrap page-ornament-wrap--leaves", ornamentClass: "page-ornament page-ornament--leaves" },
    { wrapClass: "page-ornament-wrap page-ornament-wrap--palm", ornamentClass: "page-ornament page-ornament--palm" },
    { wrapClass: "page-ornament-wrap page-ornament-wrap--parrot", ornamentClass: "page-ornament page-ornament--parrot" },
    { wrapClass: "page-ornament-wrap page-ornament-wrap--shell", ornamentClass: "page-ornament page-ornament--shell" },
  ];

  function renderPageOrnaments() {
    if (document.querySelector(".page-ornaments")) {
      return;
    }

    const ornaments = document.createElement("div");
    ornaments.className = "page-ornaments";
    ornaments.setAttribute("aria-hidden", "true");
    ornaments.setAttribute("inert", "");

    // Fixed wrappers preserve the same viewport-edge crop while the inner glyph handles motion and rotation.
    ORNAMENTS.forEach(({ wrapClass, ornamentClass }) => {
      const wrap = document.createElement("span");
      wrap.className = wrapClass;
      wrap.setAttribute("draggable", "false");
      wrap.setAttribute("role", "presentation");

      const ornament = document.createElement("span");
      ornament.className = ornamentClass;
      ornament.setAttribute("draggable", "false");
      ornament.setAttribute("role", "presentation");

      wrap.append(ornament);
      ornaments.append(wrap);
    });

    document.body.prepend(ornaments);
  }

  function usesIosSafariOrnamentFallback() {
    const ua = window.navigator.userAgent;
    const platform = window.navigator.platform || "";
    const isAppleMobile = /iP(ad|hone|od)/i.test(ua) || (platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
    const isWebKit = /WebKit/i.test(ua);
    const isAlternativeIosBrowser = /(CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|YaBrowser)/i.test(ua);

    return isAppleMobile && isWebKit && !isAlternativeIosBrowser;
  }

  function usesApplePlatformOrnamentAdjustment() {
    const ua = window.navigator.userAgent;
    const platform = window.navigator.userAgentData?.platform || window.navigator.platform || "";

    return /Mac|iPhone|iPad|iPod/i.test(platform) || /Macintosh|iPhone|iPad|iPod/i.test(ua);
  }

  function updateBrowserChromeOffsets() {
    const runUpdate = () => {
      const root = document.documentElement;
      const viewport = window.visualViewport;
      const useIosSafariFallback = usesIosSafariOrnamentFallback();
      const useApplePlatformAdjustment = usesApplePlatformOrnamentAdjustment();

      perf?.increment("mobileLayout.updateBrowserChromeOffsets.calls");
      perf?.setValue("mobileLayout.visualViewportPresent", viewport ? "yes" : "no");
      perf?.setValue("mobileLayout.iosSafariFallback", useIosSafariFallback ? "yes" : "no");
      perf?.setValue("mobileLayout.applePlatformAdjustment", useApplePlatformAdjustment ? "yes" : "no");

      if (appliedBrowserChromeState.iosSafariFallback !== useIosSafariFallback) {
        root.classList.toggle("ios-safari-ornaments-fallback", useIosSafariFallback);
        appliedBrowserChromeState.iosSafariFallback = useIosSafariFallback;
      }
      if (appliedBrowserChromeState.applePlatformAdjustment !== useApplePlatformAdjustment) {
        root.classList.toggle("apple-platform-ornaments", useApplePlatformAdjustment);
        appliedBrowserChromeState.applePlatformAdjustment = useApplePlatformAdjustment;
      }

      if (!viewport) {
        if (appliedBrowserChromeState.topOffset !== 0) {
          root.style.setProperty("--browser-top-offset", "0px");
          appliedBrowserChromeState.topOffset = 0;
        }
        if (appliedBrowserChromeState.bottomOffset !== 0) {
          root.style.setProperty("--browser-bottom-offset", "0px");
          appliedBrowserChromeState.bottomOffset = 0;
        }
        if (appliedBrowserChromeState.rightOffset !== 0) {
          root.style.setProperty("--browser-right-offset", "0px");
          appliedBrowserChromeState.rightOffset = 0;
        }

        return;
      }

      const layoutWidth = Math.max(window.innerWidth, document.documentElement.clientWidth);
      const layoutHeight = Math.max(window.innerHeight, document.documentElement.clientHeight);
      const topInset = Math.max(0, viewport.offsetTop);
      const rightInset = Math.max(0, layoutWidth - (viewport.width + viewport.offsetLeft));
      const bottomInset = Math.max(0, layoutHeight - (viewport.height + viewport.offsetTop));

      // Ignore sub-pixel noise so ornaments do not drift on browsers without visible overlay chrome.
      const topOffset = topInset > 2 ? topInset : 0;
      const rightOffset = rightInset > 2 ? rightInset : 0;
      const bottomOffset = bottomInset > 2 ? bottomInset : 0;

      if (appliedBrowserChromeState.topOffset !== topOffset) {
        root.style.setProperty("--browser-top-offset", `${Math.round(topOffset)}px`);
        appliedBrowserChromeState.topOffset = topOffset;
      }
      if (appliedBrowserChromeState.rightOffset !== rightOffset) {
        root.style.setProperty("--browser-right-offset", `${Math.round(rightOffset)}px`);
        appliedBrowserChromeState.rightOffset = rightOffset;
      }
      if (appliedBrowserChromeState.bottomOffset !== bottomOffset) {
        root.style.setProperty("--browser-bottom-offset", `${Math.round(bottomOffset)}px`);
        appliedBrowserChromeState.bottomOffset = bottomOffset;
      }
    };

    return window.summerFairTesting?.measure?.("mobileLayout.updateBrowserChromeOffsets", runUpdate) ?? runUpdate();
  }

  function scheduleBrowserChromeOffsetsUpdate() {
    if (browserChromeUpdateQueued) {
      return;
    }

    browserChromeUpdateQueued = true;
    window.requestAnimationFrame(() => {
      browserChromeUpdateQueued = false;
      updateBrowserChromeOffsets();
    });
  }

  function handleVisualViewportResize() {
    perf?.increment("mobileLayout.visualViewport.resizeEvents");
    scheduleBrowserChromeOffsetsUpdate();
  }

  function handleVisualViewportScroll() {
    perf?.increment("mobileLayout.visualViewport.scrollEvents");
    scheduleBrowserChromeOffsetsUpdate();
  }

  function bindBrowserChromeOffsets() {
    if (browserChromeOffsetsBound) {
      updateBrowserChromeOffsets();
      return;
    }

    browserChromeOffsetsBound = true;
    updateBrowserChromeOffsets();

    const viewport = window.visualViewport;
    if (viewport) {
      viewport.addEventListener("resize", handleVisualViewportResize, { passive: true });
      viewport.addEventListener("scroll", handleVisualViewportScroll, { passive: true });
    }

    window.addEventListener("resize", scheduleBrowserChromeOffsetsUpdate, { passive: true });
    window.addEventListener("orientationchange", scheduleBrowserChromeOffsetsUpdate, { passive: true });
  }

  function init() {
    const runInit = () => {
      perf?.mark("mobileLayout.init.start");
      window.summerFairTesting?.measure?.("mobileLayout.renderPageOrnaments", () => {
        renderPageOrnaments();
      }) ?? renderPageOrnaments();
      window.summerFairTesting?.measure?.("mobileLayout.bindBrowserChromeOffsets", () => {
        bindBrowserChromeOffsets();
      }) ?? bindBrowserChromeOffsets();
      perf?.mark("mobileLayout.init.end");
    };

    return window.summerFairTesting?.measure?.("mobileLayout.init", runInit) ?? runInit();
  }

  window.summerFairMobileLayout = {
    init,
    updateBrowserChromeOffsets,
  };
})();