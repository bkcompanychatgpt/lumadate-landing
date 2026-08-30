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
  const landing = document.querySelector("#landing");
  const startButton = document.querySelector("#start-match");
  const countdownStage = document.querySelector("#countdown-stage");
  const countdownNumber = document.querySelector("#countdown-number");
  const matchRing = document.querySelector("#match-ring");
  const matchStatus = document.querySelector("#match-status");
  const matchDetail = document.querySelector("#match-detail");
  const leadForm = document.querySelector("#lead-form");
  const toast = document.querySelector("#toast");
  const trackingConfig = cmsConfig.tracking || {};

  const states = cmsConfig.matchGate?.states || [
    ["Checking verified profiles", "The system is matching you with someone compatible. Please wait..."],
    ["Comparing city and distance", "Prioritizing active people who are available for a real meetup."],
    ["Reading activity preferences", "Coffee, dinner, movies, and city walks are being matched now."],
    ["Preparing your results", "Almost ready. Opening your personalized landing page."]
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

  function startCountdown() {
    const total = Number(config.countdownSeconds || 10);
    let remaining = total;

    if (!startButton || !countdownStage || !countdownNumber || !matchRing || !matchStatus || !matchDetail) return;

    startButton.disabled = true;
    startButton.hidden = true;
    countdownStage.hidden = false;
    countdownNumber.textContent = String(remaining);
    matchRing.style.setProperty("--progress", "0deg");
    matchStatus.textContent = cmsConfig.matchGate?.title || "Finding your match";
    matchDetail.textContent = cmsConfig.matchGate?.detail || "The system is matching you with someone compatible. Please wait...";
    track("StartMatch", { seconds: total });

    const timer = window.setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        window.clearInterval(timer);
        showLanding();
        return;
      }

      const elapsed = total - remaining;
      const state = states[Math.min(states.length - 1, Math.floor((elapsed / total) * states.length))];
      const degrees = Math.round((elapsed / total) * 360);

      countdownNumber.textContent = String(remaining);
      matchRing.style.setProperty("--progress", `${degrees}deg`);
      matchStatus.textContent = state[0];
      matchDetail.textContent = state[1];
    }, 1000);
  }

  document.addEventListener("click", (event) => {
    const cta = event.target.closest("a, button");
    if (!cta) return;
    const label = cta.textContent.trim().replace(/\s+/g, " ");
    track("CtaClick", { label, href: cta.getAttribute("href") || "" });
  });

  startButton?.addEventListener("click", startCountdown);

  leadForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(leadForm);
    track("Lead", {
      city: formData.get("city"),
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
