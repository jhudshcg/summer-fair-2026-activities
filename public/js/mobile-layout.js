/*
 * Summer Fair 2026 shared mobile layout and ornament positioning helpers.
 */

(() => {
  let lastBrowserChromeLogKey = "";
  let browserChromeOffsetsBound = false;

  function renderPageOrnaments() {
    if (document.querySelector(".page-ornaments")) {
      return;
    }

    const ornaments = document.createElement("div");
    ornaments.className = "page-ornaments";
    ornaments.setAttribute("aria-hidden", "true");
    ornaments.setAttribute("inert", "");

    [
      "page-ornament page-ornament--leaves",
      "page-ornament page-ornament--palm",
      "page-ornament page-ornament--parrot",
      "page-ornament page-ornament--shell",
    ].forEach((className) => {
      const ornament = document.createElement("span");
      ornament.className = className;
      ornament.setAttribute("draggable", "false");
      ornament.setAttribute("role", "presentation");
      ornaments.append(ornament);
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

  function logBrowserChromeMetrics(metrics) {
    const logKey = JSON.stringify(metrics);
    if (logKey === lastBrowserChromeLogKey) {
      return;
    }

    lastBrowserChromeLogKey = logKey;
    console.log("[summer-fair] browser chrome metrics", metrics);
  }

  function updateBrowserChromeOffsets() {
    const root = document.documentElement;
    const viewport = window.visualViewport;
    const useIosSafariFallback = usesIosSafariOrnamentFallback();
    const useApplePlatformAdjustment = usesApplePlatformOrnamentAdjustment();

    root.classList.toggle("ios-safari-ornaments-fallback", useIosSafariFallback);
    root.classList.toggle("apple-platform-ornaments", useApplePlatformAdjustment);

    if (!viewport) {
      root.style.setProperty("--browser-top-offset", "0px");
      root.style.setProperty("--browser-bottom-offset", "0px");
      root.style.setProperty("--browser-right-offset", "0px");

      logBrowserChromeMetrics({
        iosSafariFallback: useIosSafariFallback,
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        clientWidth: document.documentElement.clientWidth,
        clientHeight: document.documentElement.clientHeight,
        visualViewport: null,
        computedOffsets: { top: 0, right: 0, bottom: 0 },
      });

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

    root.style.setProperty("--browser-top-offset", `${Math.round(topOffset)}px`);
    root.style.setProperty("--browser-right-offset", `${Math.round(rightOffset)}px`);
    root.style.setProperty("--browser-bottom-offset", `${Math.round(bottomOffset)}px`);

    logBrowserChromeMetrics({
      iosSafariFallback: useIosSafariFallback,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      clientWidth: document.documentElement.clientWidth,
      clientHeight: document.documentElement.clientHeight,
      visualViewport: {
        width: Math.round(viewport.width),
        height: Math.round(viewport.height),
        offsetTop: Math.round(viewport.offsetTop),
        offsetLeft: Math.round(viewport.offsetLeft),
        pageTop: Math.round(viewport.pageTop),
        pageLeft: Math.round(viewport.pageLeft),
      },
      computedOffsets: {
        top: Math.round(topOffset),
        right: Math.round(rightOffset),
        bottom: Math.round(bottomOffset),
      },
    });
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
      viewport.addEventListener("resize", updateBrowserChromeOffsets);
      viewport.addEventListener("scroll", updateBrowserChromeOffsets);
    }

    window.addEventListener("resize", updateBrowserChromeOffsets);
    window.addEventListener("orientationchange", updateBrowserChromeOffsets);
  }

  function init() {
    renderPageOrnaments();
    bindBrowserChromeOffsets();
  }

  window.summerFairMobileLayout = {
    init,
    updateBrowserChromeOffsets,
  };
})();