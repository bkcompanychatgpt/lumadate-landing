(function () {
  const cmsConfig = typeof window.getLandingCms === "function" ? window.getLandingCms() : {};
  const legacyConfig = window.LANDING_CONFIG || {};
  const config = {
    ...legacyConfig,
    ...(cmsConfig.settings || {}),
    destinationAfterMatch: cmsConfig.settings?.postMatchDestination || legacyConfig.destinationAfterMatch,
    countdownSeconds: cmsConfig.settings?.countdownSeconds || legacyConfig.countdownSeconds
  };
  const matchGate = document.querySelector("#match-gate");
  const browserGuide = document.querySelector("#browser-guide");
  const continueToMatch = document.querySelector("#continue-to-match");
  const landing = document.querySelector("#landing");
  const startButton = document.querySelector("#start-match");
  const countdownStage = document.querySelector("#countdown-stage");
  const matchRing = document.querySelector("#match-ring");
  const matchStatus = document.querySelector("#match-status");
  const matchDetail = document.querySelector("#match-detail");
  const leadForm = document.querySelector("#lead-form");
  const toast = document.querySelector("#toast");
  const trackingConfig = cmsConfig.tracking || {};

  const states = cmsConfig.matchGate?.states || [
    ["Checking network signal", "Your match queue is reconnecting securely. Please stay on this page."],
    ["Caching verified profiles", "Loading real profiles and activity preferences from the nearest match node."],
    ["Restoring connection", "Almost there. Your compatible results are being prepared in the background."],
    ["Opening match results", "Connection restored. Sending you to your personalized dating page now."]
  ];

  const track = (eventName, payload = {}) => {
    const data = {
      event: eventName,
      timestamp: new Date().toISOString(),
      path: window.location.pathname,
      ...getUtmParams(),
      ...payload
    };

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(data);

    if (typeof window.fbq === "function") window.fbq("trackCustom", eventName, data);
    if (typeof window.ttq?.track === "function") window.ttq.track(eventName, data);
    if (typeof window.gtag === "function") window.gtag("event", eventName, data);
    if (typeof window.MATCH_LANDING_HOOKS?.onTrack === "function") {
      window.MATCH_LANDING_HOOKS.onTrack(eventName, data);
    }

    sendServerEvent(eventName, data);
    console.info("[landing-track]", eventName, data);
  };

  const showToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    window.setTimeout(() => toast.classList.remove("show"), 2600);
  };

  function getUtmParams() {
    const params = new URLSearchParams(window.location.search);
    const utm = {};
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach((key) => {
      const value = params.get(key);
      if (value) utm[key] = value;
    });
    return utm;
  }

  function getCookie(name) {
    return document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${name}=`))
      ?.split("=")[1] || "";
  }

  function sendServerEvent(eventName, data) {
    if (!trackingConfig.serverTrackingEndpoint) return;
    const eventId = `${eventName}.${Date.now()}.${Math.random().toString(36).slice(2)}`;
    const body = {
      eventName,
      eventId,
      publicEventKey: trackingConfig.publicEventKey || "",
      sourceUrl: window.location.href,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      fbp: getCookie("_fbp"),
      fbc: getCookie("_fbc"),
      ttclid: new URLSearchParams(window.location.search).get("ttclid") || "",
      gclid: new URLSearchParams(window.location.search).get("gclid") || "",
      metaTestEventCode: trackingConfig.metaTestEventCode || "",
      tiktokTestEventCode: trackingConfig.tiktokTestEventCode || "",
      data
    };

    fetch(trackingConfig.serverTrackingEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true
    }).catch((error) => console.warn("[server-track-error]", error));
  }

  function showLanding() {
    const destination = config.destinationAfterMatch || "#landing";
    if (destination !== "#landing") {
      track("MatchComplete", { destination });
      window.location.href = destination;
      return;
    }

    document.body.classList.add("landing-ready");
    if (matchGate) matchGate.hidden = true;
    if (landing) landing.hidden = false;
    track("MatchComplete", { destination });
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    window.scrollTo(0, 0);
  }

  function startMatchingDelay() {
    const total = Number(config.countdownSeconds || 10);

    if (!startButton || !countdownStage || !matchRing || !matchStatus || !matchDetail) return;

    startButton.disabled = true;
    startButton.hidden = true;
    countdownStage.hidden = false;
    matchRing.removeAttribute("style");
    matchStatus.textContent = cmsConfig.matchGate?.title || "Reconnecting match network";
    matchDetail.textContent = cmsConfig.matchGate?.detail || "Connection is being restored while your verified profiles are cached. Please wait...";
    track("StartMatch", { seconds: total });

    let stateIndex = 0;
    const updateState = () => {
      const state = states[Math.min(states.length - 1, stateIndex)];
      matchStatus.textContent = state[0];
      matchDetail.textContent = state[1];
      stateIndex += 1;
    };
    const intervalMs = Math.max(1200, Math.floor((total * 1000) / Math.max(states.length, 1)));
    updateState();

    const stateTimer = window.setInterval(updateState, intervalMs);
    window.setTimeout(() => {
      window.clearInterval(stateTimer);
      showLanding();
    }, total * 1000);
  }

  document.addEventListener("click", (event) => {
    const cta = event.target.closest("a, button");
    if (!cta) return;
    const label = cta.textContent.trim().replace(/\s+/g, " ");
    track("CtaClick", { label, href: cta.getAttribute("href") || "" });
  });

  startButton?.addEventListener("click", startMatchingDelay);

  continueToMatch?.addEventListener("click", () => {
    if (browserGuide) browserGuide.hidden = true;
    if (matchGate) matchGate.hidden = false;
    track("BrowserGuideContinue", {});
  });

  leadForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(leadForm);
    track("Lead", {
      country: formData.get("country"),
      hasName: Boolean(formData.get("name")),
      hasPhone: Boolean(formData.get("phone"))
    });
    leadForm.reset();
    showToast("Submitted. Your available matches will be prioritized.");
  });

  if (window.location.hash === "#landing") {
    document.body.classList.add("landing-ready");
    if (matchGate) matchGate.hidden = true;
    if (landing) landing.hidden = false;
    window.scrollTo(0, 0);
  }

  track("PageView");
})();
