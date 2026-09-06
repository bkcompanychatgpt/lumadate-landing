(function () {
  const STORAGE_KEY = "lumadate.cms.v1";
  const COUNTRY_NAMES = [
    "Brasil", "São Paulo", "Rio de Janeiro", "Salvador", "Brasília", "Curitiba", "Recife", "Fortaleza",
    "Belo Horizonte", "Porto Alegre", "Manaus", "Belém", "Goiânia", "Florianópolis", "Vitória",
    "Campinas", "Santos", "Niterói", "Ribeirão Preto", "João Pessoa", "Natal", "Maceió", "Cuiabá"
  ];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function merge(base, override) {
    if (Array.isArray(base)) return Array.isArray(override) ? override : base;
    if (!base || typeof base !== "object") return override ?? base;
    const output = { ...base };
    Object.keys(override || {}).forEach((key) => {
      output[key] = merge(base[key], override[key]);
    });
    return output;
  }

  function getCms() {
    const fallback = clone(window.DEFAULT_LANDING_CMS || {});
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return normalizeCms(merge(fallback, saved));
    } catch {
      return normalizeCms(fallback);
    }
  }

  async function loadCms(options = {}) {
    const fallback = clone(window.DEFAULT_LANDING_CMS || {});
    const serverConfig = await fetchServerCms();
    let localConfig = {};
    if (options.includeLocal !== false) {
      try {
        localConfig = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      } catch {
        localConfig = {};
      }
    }
    return normalizeCms(merge(merge(fallback, serverConfig || {}), localConfig || {}));
  }

  function normalizeCms(cms) {
    const defaultMiniImages = ["assets/avatar-alex.png", "assets/avatar-nami.png", "assets/avatar-mika.png"];
    if (cms.settings?.brandName === "LumaDate") cms.settings.brandName = "lumadate";
    if (cms.nav?.ctaText === "Open app") cms.nav.ctaText = "Cadastrar";
    if (cms.finalCta?.primaryText === "Open app") cms.finalCta.primaryText = "Cadastrar";
    if (cms.conversion?.headline === "Pixels, client scripts, and campaign data are ready to plug in.") {
      cms.conversion.eyebrow = "Comece hoje";
      cms.conversion.headline = "Conheça pessoas verificadas no Brasil prontas para planos reais.";
      cms.conversion.body = "Envie sua solicitação e veja membros compatíveis perto de você. Cada perfil é revisado, cada match é pensado para encontros reais, e suas informações ficam privadas até você decidir continuar.";
      cms.conversion.formTitle = "Cadastre-se para ver matches";
      cms.conversion.buttonText = "Cadastrar";
      cms.conversion.note = "Sua solicitação ajuda a priorizar perfis brasileiros verificados e compatíveis.";
    }
    if (!Array.isArray(cms.hero?.highlights) || !cms.hero.highlights.length) {
      cms.hero.highlights = [
        ["4.9", "avaliação média dos membros"],
        ["20K+", "membros verificados"],
        ["100%", "perfis revisados por humanos"]
      ];
    }
    if (!Array.isArray(cms.hero?.miniProfiles) || !cms.hero.miniProfiles.length) {
      cms.hero.miniProfiles = [
        { name: "Ana", city: "Rio de Janeiro", activity: "Café", image: defaultMiniImages[0] },
        { name: "Lívia", city: "São Paulo", activity: "Jantar", image: defaultMiniImages[1] },
        { name: "Marina", city: "Salvador", activity: "Cinema", image: defaultMiniImages[2] }
      ];
    }
    cms.hero.miniProfiles = cms.hero.miniProfiles.map((profile, index) => ({
      ...profile,
      image: profile.image || defaultMiniImages[index % defaultMiniImages.length]
    }));
    cms.profiles = (cms.profiles || []).map((profile, index) => ({
      ...profile,
      image: profile.image || defaultMiniImages[index % defaultMiniImages.length]
    }));
    return cms;
  }

  function saveCms(config) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }

  async function saveServerCms(config) {
    saveCms(config);
    const response = await fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config })
    });
    if (!response.ok) throw new Error("Server config save failed");
  }

  async function fetchServerCms() {
    try {
      const response = await fetch("/api/config", { cache: "no-store" });
      if (!response.ok) return null;
      const payload = await response.json();
      return payload.config || null;
    } catch {
      return null;
    }
  }

  function esc(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function attrs(url) {
    const href = esc(url || "#");
    const external = /^https?:\/\//i.test(url || "");
    return `href="${href}"${external ? ' target="_blank" rel="noreferrer"' : ""}`;
  }

  function setText(selector, text) {
    const el = document.querySelector(selector);
    if (el) el.textContent = text;
  }

  function setHtml(selector, html) {
    const el = document.querySelector(selector);
    if (el) el.innerHTML = html;
  }

  function countryOptions() {
    return COUNTRY_NAMES
      .map((name) => `<option value="${esc(name)}">${esc(name)}</option>`)
      .join("");
  }

  async function applyCms() {
    const cms = await loadCms({ includeLocal: false });
    window.LANDING_CMS = cms;
    loadTracking(cms.tracking || {});
    injectSnippet("cms-custom-head", cms.tracking?.customHeadScript, document.head);
    injectSnippet("cms-custom-body", cms.tracking?.customBodyScript, document.body);

    document.documentElement.style.setProperty("--match-bg-image", `url("${cms.images.matchBackground}")`);
    document.documentElement.style.setProperty("--hero-bg-image", `url("${cms.images.heroBackground}")`);

    if (cms.settings?.title) document.title = cms.settings.title;
    const description = document.querySelector('meta[name="description"]');
    if (description && cms.settings?.description) description.setAttribute("content", cms.settings.description);

    const accessImage = document.querySelector(".access-hero-card > img");
    if (accessImage && cms.images?.accessHero) accessImage.src = cms.images.accessHero;
    setText(".access-brand strong", cms.accessPrep?.brand || "lumadate Brasil");
    setHtml(".access-status", `<span></span>${esc(cms.accessPrep?.status || "Preparando acesso")}`);
    setText("#access-prep-title", cms.accessPrep?.title || "Seu acesso gratuito está sendo preparado");
    setText(".access-hero-copy p", cms.accessPrep?.body || "Permaneça nesta página por alguns instantes enquanto carregamos perfis brasileiros próximos de você.");
    setText(".access-hero-copy strong", cms.accessPrep?.waitText || "Tempo estimado de espera: 0s");
    setText(".access-queue strong", cms.accessPrep?.queueTitle || "Perfis na fila");
    setText(".access-queue p", cms.accessPrep?.queueNote || "Seu acesso está quase pronto");
    setText(".access-panel-tags span:first-child", cms.accessPrep?.panelBadge || "• Matches BR");
    setText(".access-panel-tags span:last-child", cms.accessPrep?.panelStatus || "Pronto");
    setText(".access-panel h2", cms.accessPrep?.panelTitle || "Abrindo encontros locais no Brasil");
    setText(".access-panel > p", cms.accessPrep?.panelBody || "Estamos organizando pessoas próximas, verificando sinais de perfil e preparando acesso seguro antes de liberar o próximo passo.");
    setText(".access-progress-labels span:first-child", cms.accessPrep?.progressStart || "Pronto");
    setText(".access-progress-labels span:last-child", cms.accessPrep?.progressEnd || "Aberto");
    if (Array.isArray(cms.accessPrep?.steps)) {
      setHtml(".access-steps", cms.accessPrep.steps.map(([num, title, body]) => `<div><span>${esc(num)}</span><p><strong>${esc(title)}</strong><small>${esc(body)}</small></p></div>`).join(""));
    }
    setText(".access-ready-note strong", cms.accessPrep?.readyTitle || "Acesso gratuito liberado");
    setText(".access-ready-note span", cms.accessPrep?.readyBody || "Abra a próxima etapa quando estiver pronto.");
    setText("#continue-to-guide", cms.accessPrep?.buttonText || "Continuar acesso gratuito");
    setText(".access-footnote", cms.accessPrep?.footnote || "Os matches estão prontos. Continue abaixo.");
    setText(".access-faq .eyebrow", cms.accessPrep?.faqEyebrow || "Dúvidas comuns");
    if (Array.isArray(cms.accessPrep?.faq)) {
      setHtml(".access-faq", `<p class="eyebrow">${esc(cms.accessPrep.faqEyebrow || "Dúvidas comuns")}</p>` + cms.accessPrep.faq.map(([q, a], index) => `<details${index === 0 ? " open" : ""}><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join(""));
    }

    setText("#start-match", cms.matchGate.buttonText);
    setText("#match-status", cms.matchGate.title);
    setText("#match-detail", cms.matchGate.detail);
    setText(".browser-guide .eyebrow", cms.browserGuide?.eyebrow || "Para a melhor experiência");
    setText("#browser-guide-title", cms.browserGuide?.headline || "Abra esta página no seu navegador antes de continuar.");
    setText(".guide-body", cms.browserGuide?.body || "Alguns navegadores dentro de aplicativos podem bloquear fotos de perfil, cadastro e o processo seguro de match. Abra este link no Safari, Chrome ou no navegador principal primeiro.");
    setText("#continue-to-match", cms.browserGuide?.buttonText || "Copiar link do match");
    setText("#copy-open-note", cms.browserGuide?.copySuccess || "O link do match foi copiado. Abra o Safari, Chrome ou seu navegador principal e cole este link para continuar.");
    if (Array.isArray(cms.browserGuide?.steps)) {
      setHtml(".guide-steps", cms.browserGuide.steps.map(([num, text]) => `<div><span>${esc(num)}</span><p>${esc(text)}</p></div>`).join(""));
    }

    const landing = document.querySelector("#landing");
    if (!landing) return;

    setText(".brand-name", cms.settings.brandName);
    setHtml(".nav-links", cms.nav.links.map(([label, url]) => `<a ${attrs(url)}>${esc(label)}</a>`).join(""));
    const navCta = document.querySelector(".nav-cta");
    if (navCta) {
      navCta.textContent = cms.nav.ctaText;
      navCta.setAttribute("href", cms.nav.ctaUrl || "#");
    }

    const heroImage = document.querySelector(".hero > img");
    if (heroImage) heroImage.src = cms.images.heroBackground;
    const wallImage = document.querySelector(".profile-wall");
    if (wallImage) wallImage.src = cms.images.heroPreview || cms.images.heroBackground;

    setText(".hero-copy .eyebrow", cms.hero.eyebrow);
    setText(".hero-copy h1", cms.hero.headline);
    setText(".hero-copy .lead", cms.hero.lead);
    setHtml(".hero-highlights", cms.hero.highlights.map(([value, label]) => (
      `<span class="highlight-pill"><strong>${esc(value)}</strong><small>${esc(label)}</small></span>`
    )).join(""));
    setHtml(".hero-copy .trust-row", cms.hero.trust.map((item) => `<span>${esc(item)}</span>`).join(""));
    setText(".preview-body .pill", cms.hero.previewCity);
    setText(".preview-body h3", cms.hero.previewName);
    setText(".preview-body p", cms.hero.previewActivity);
    setText(".preview-body a", cms.hero.previewCta);
    setHtml(".secondary-preview", cms.hero.miniProfiles.map((profile) => {
      const style = profile.image ? ` style="background-image:url('${esc(profile.image)}')"` : "";
      return `<div class="mini-profile-row"><span${style}></span><div><strong>${esc(profile.name)}</strong><small>${esc(profile.city)} · ${esc(profile.activity)}</small></div></div>`;
    }).join(""));

    setHtml(".stats-band", cms.stats.map(([num, label]) => `<div><strong>${esc(num)}</strong><span>${esc(label)}</span></div>`).join(""));
    setText("#activities .eyebrow", cms.activities.eyebrow);
    setText("#activities h2", cms.activities.headline);
    setHtml(".date-card-grid", cms.activities.cards.map(([city, title, time, applied], index) => (
      `<article class="date-card${index === 0 ? " featured-date" : ""}"><div><span class="pill">${esc(city)}</span><h3>${esc(title)}</h3><p>${esc(time)}</p></div><strong>${esc(applied)}</strong></article>`
    )).join(""));

    setText("#verified > div:first-child .eyebrow", cms.verified.eyebrow);
    setText("#verified > div:first-child h2", cms.verified.headline);
    setText("#verified > div:first-child p", cms.verified.body);
    setHtml(".check-list", cms.verified.checks.map((item) => `<span>${esc(item)}</span>`).join(""));
    setHtml(".profile-grid", cms.profiles.map((profile, index) => {
      const style = profile.image ? ` style="background-image:url('${esc(profile.image)}')"` : "";
      return `<article class="profile-card"><div class="profile-photo photo-${["a", "b", "c"][index % 3]}"${style}></div><h3>${esc(profile.name)}</h3><p>${esc(profile.city)} · ${esc(profile.activity)}</p><span>${esc(profile.badge)}</span></article>`;
    }).join(""));

    setText(".proof-copy .eyebrow", cms.proof.eyebrow);
    setText(".proof-copy h2", cms.proof.headline);
    setText(".proof-copy p", cms.proof.body);
    setHtml(".proof-list", cms.proof.bullets.map((item) => `<span>${esc(item)}</span>`).join(""));

    setText("#how .eyebrow", cms.how.eyebrow);
    setText("#how h2", cms.how.headline);
    setHtml("#how .steps", cms.how.steps.map(([num, title, body]) => `<article><span>${esc(num)}</span><h3>${esc(title)}</h3><p>${esc(body)}</p></article>`).join(""));

    setText(".conversion-copy .eyebrow", cms.conversion.eyebrow);
    setText(".conversion-copy h2", cms.conversion.headline);
    setText(".conversion-copy .conversion-body", cms.conversion.body);
    setText(".lead-form h3", cms.conversion.formTitle);
    setText(".lead-form button", cms.conversion.buttonText);
    setText(".form-note", cms.conversion.note);
    setHtml('.lead-form select[name="country"]', `<option value="">Escolha sua cidade</option>${countryOptions()}`);

    setText(".trust-section > .eyebrow", cms.trust.eyebrow);
    setText(".trust-section > h2", cms.trust.headline);
    setHtml(".trust-section .steps", cms.trust.cards.map(([tag, title, body]) => `<article><span>${esc(tag)}</span><h3>${esc(title)}</h3><p>${esc(body)}</p></article>`).join(""));

    setText(".testimonials > .eyebrow", cms.testimonials.eyebrow);
    setText(".testimonials > h2", cms.testimonials.headline);
    setHtml(".quote-grid", cms.testimonials.quotes.map(([quote, person]) => `<blockquote><p>"${esc(quote)}"</p><cite>${esc(person)}</cite></blockquote>`).join(""));

    setText("#faq > .eyebrow", cms.faq.eyebrow);
    setText("#faq > h2", cms.faq.headline);
    setHtml("#faq", `<p class="eyebrow">${esc(cms.faq.eyebrow)}</p><h2>${esc(cms.faq.headline)}</h2>` + cms.faq.items.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join(""));

    setText(".final-cta h2", cms.finalCta.headline);
    setText(".final-cta p", cms.finalCta.body);
    setHtml(".final-cta .hero-actions", `<a class="primary-btn" ${attrs(cms.finalCta.primaryUrl)}>${esc(cms.finalCta.primaryText)}</a><a class="secondary-btn" ${attrs(cms.finalCta.secondaryUrl)}>${esc(cms.finalCta.secondaryText)}</a>`);
  }

  function addScript(id, src, inline) {
    if (document.getElementById(id)) return;
    const script = document.createElement("script");
    script.id = id;
    if (src) script.src = src;
    if (inline) script.textContent = inline;
    document.head.appendChild(script);
  }

  function injectSnippet(id, snippet, target) {
    if (!snippet || document.getElementById(id)) return;
    const container = document.createElement("div");
    container.id = id;
    container.className = "cms-snippet-container";
    target.appendChild(container);

    const template = document.createElement("template");
    template.innerHTML = snippet;
    Array.from(template.content.childNodes).forEach((node) => {
      if (node.nodeName.toLowerCase() === "script") {
        const script = document.createElement("script");
        Array.from(node.attributes || []).forEach((attr) => script.setAttribute(attr.name, attr.value));
        script.textContent = node.textContent;
        container.appendChild(script);
      } else {
        container.appendChild(node.cloneNode(true));
      }
    });
  }

  function loadTracking(tracking) {
    if (tracking.googleTagId) {
      addScript("cms-gtag-src", `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(tracking.googleTagId)}`);
      addScript("cms-gtag-init", "", `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${String(tracking.googleTagId).replace(/'/g, "")}');`);
    }

    if (tracking.metaPixelId) {
      addScript("cms-meta-pixel", "", `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${String(tracking.metaPixelId).replace(/'/g, "")}');fbq('track','PageView');`);
    }

    if (tracking.tiktokPixelId) {
      addScript("cms-tiktok-pixel", "", `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=['page','track','identify','instances','debug','on','off','once','ready','alias','group','enableCookie','disableCookie'];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.load=function(e){var i='https://analytics.tiktok.com/i18n/pixel/events.js';ttq._i=ttq._i||{};ttq._i[e]=[];ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]={};var n=d.createElement('script');n.type='text/javascript';n.async=!0;n.src=i+'?sdkid='+e+'&lib='+t;var a=d.getElementsByTagName('script')[0];a.parentNode.insertBefore(n,a)};ttq.load('${String(tracking.tiktokPixelId).replace(/'/g, "")}');ttq.page();}(window,document,'ttq');`);
    }
  }

  window.LANDING_CMS_STORAGE_KEY = STORAGE_KEY;
  window.getLandingCms = getCms;
  window.loadLandingCms = loadCms;
  window.saveLandingCms = saveCms;
  window.persistLandingCms = saveServerCms;
  window.applyLandingCms = applyCms;
  document.addEventListener("DOMContentLoaded", () => {
    if (!document.querySelector(".admin-main")) applyCms();
  });
})();
