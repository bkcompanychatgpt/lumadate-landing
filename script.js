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
  const accessPrep = document.querySelector("#access-prep");
  const browserGuide = document.querySelector("#browser-guide");
  const continueToGuide = document.querySelector("#continue-to-guide");
  const continueToMatch = document.querySelector("#continue-to-match");
  const copyOpenNote = document.querySelector("#copy-open-note");
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
    ["Verificando a conexão", "Sua fila de matches está sendo conectada com segurança. Permaneça nesta página."],
    ["Carregando perfis verificados", "Perfis reais e opções de encontro no Brasil estão sendo preparados."],
    ["Restaurando acesso", "Quase pronto. Seus resultados estão sendo preparados em segundo plano."],
    ["Abrindo seus matches", "A conexão foi restaurada. Você será enviado para a página de encontros agora."]
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

  function getBrowserOpenUrl() {
    return cmsConfig.browserGuide?.copyUrl || "https://lumadate.com/?step=match";
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (error) {
      console.warn("[clipboard-api-error]", error);
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, text.length);

    try {
      return document.execCommand("copy");
    } catch (error) {
      console.warn("[clipboard-fallback-error]", error);
      return false;
    } finally {
      textarea.remove();
    }
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
    matchStatus.textContent = cmsConfig.matchGate?.title || "Reconectando a rede de matches";
    matchDetail.textContent = cmsConfig.matchGate?.detail || "A conexão está sendo restaurada enquanto perfis verificados são carregados. Aguarde...";
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
    const label = cta.textContent.trim().replace(/\s+/g, " " );
    track("CtaClick", { label, href: cta.getAttribute("href") || "" });
  });

  startButton?.addEventListener("click", startMatchingDelay);

  continueToGuide?.addEventListener("click", () => {
    if (accessPrep) accessPrep.hidden = true;
    if (browserGuide) browserGuide.hidden = false;
    document.body.classList.remove("prep-ready");
    document.body.classList.add("guide-ready");
    window.scrollTo(0, 0);
    window.requestAnimationFrame(() => window.scrollTo(0, 0));
    window.setTimeout(() => window.scrollTo(0, 0), 60);
    track("AccessPrepContinue", {});
  });

  continueToMatch?.addEventListener("click", async () => {
    const url = getBrowserOpenUrl();
    const copied = await copyText(url);
    const successMessage = cmsConfig.browserGuide?.copySuccess || "O link do match foi copiado. Abra o Safari, Chrome ou seu navegador principal e cole este link para continuar.";
    const fallbackMessage = `Copie este link e cole no Safari, Chrome ou no seu navegador principal: ${url}`;

    continueToMatch.classList.add("copied");
    continueToMatch.textContent = copied ? "Link copiado" : "Copiar este link";

    if (copyOpenNote) {
      copyOpenNote.hidden = false;
      copyOpenNote.textContent = copied ? successMessage : fallbackMessage;
    }

    showToast(copied ? "Link do match copiado." : "Copie o link manualmente.");
    track("BrowserGuideCopyLink", { copied, url });
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
    showToast("Enviado. Seus matches disponíveis terão prioridade.");
  });

  const params = new URLSearchParams(window.location.search);
  if (params.get("step") === "match") {
    if (accessPrep) accessPrep.hidden = true;
    if (browserGuide) browserGuide.hidden = true;
    if (matchGate) matchGate.hidden = false;
    document.body.classList.remove("prep-ready", "guide-ready", "landing-ready");
    window.scrollTo(0, 0);
    track("MatchLinkOpen", {});
  } else if (window.location.hash === "#landing") {
    document.body.classList.add("landing-ready");
    if (matchGate) matchGate.hidden = true;
    if (landing) landing.hidden = false;
    window.scrollTo(0, 0);
  }

  track("PageView");
})();
