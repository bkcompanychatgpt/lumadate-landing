(function () {
  const STORAGE_KEY = "lumadate.cms.v1";

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
      return merge(fallback, saved);
    } catch {
      return fallback;
    }
  }

  function saveCms(config) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
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

  function applyCms() {
    const cms = getCms();
    window.LANDING_CMS = cms;
    loadTracking(cms.tracking || {});
    injectSnippet("cms-custom-head", cms.tracking?.customHeadScript, document.head);
    injectSnippet("cms-custom-body", cms.tracking?.customBodyScript, document.body);

    document.documentElement.style.setProperty("--match-bg-image", `url("${cms.images.matchBackground}")`);
    document.documentElement.style.setProperty("--hero-bg-image", `url("${cms.images.heroBackground}")`);

    if (cms.settings?.title) document.title = cms.settings.title;
    const description = document.querySelector('meta[name="description"]');
    if (description && cms.settings?.description) description.setAttribute("content", cms.settings.description);

    setText("#start-match", cms.matchGate.buttonText);
    setText("#match-status", cms.matchGate.title);
    setText("#match-detail", cms.matchGate.detail);

    const landing = document.querySelector("#landing");
    if (!landing) return;

    setText(".brand span:last-child", cms.settings.brandName);
    setText(".brand-mark", cms.settings.brandInitial);
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
    setHtml(".download-row", cms.hero.badges.map(([small, strong, url], index) => (
      `<a class="store-badge${index === 2 ? " light" : ""}" ${attrs(url)}><small>${esc(small)}</small><strong>${esc(strong)}</strong></a>`
    )).join(""));
    setHtml(".hero-copy .trust-row", cms.hero.trust.map((item) => `<span>${esc(item)}</span>`).join(""));
    setText(".preview-body .pill", cms.hero.previewCity);
    setText(".preview-body h3", cms.hero.previewName);
    setText(".preview-body p", cms.hero.previewActivity);
    setText(".preview-body a", cms.hero.previewCta);

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
    setText(".conversion-copy p", cms.conversion.body);
    setText(".lead-form h3", cms.conversion.formTitle);
    setText(".lead-form button", cms.conversion.buttonText);
    setText(".form-note", cms.conversion.note);

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
    container.hidden = true;
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
  window.saveLandingCms = saveCms;
  window.applyLandingCms = applyCms;
  document.addEventListener("DOMContentLoaded", () => {
    if (!document.querySelector(".admin-main")) applyCms();
  });
})();
