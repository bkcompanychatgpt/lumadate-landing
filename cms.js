(function () {
  const STORAGE_KEY = "lumadate.cms.v1";
  const COUNTRY_NAMES = [
    "Brazil", "Brunei", "Malaysia", "Singapore",
    "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
    "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Bulgaria", "Burkina Faso", "Burundi",
    "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Cote d'Ivoire", "Croatia", "Cuba", "Cyprus", "Czechia",
    "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic",
    "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
    "Fiji", "Finland", "France",
    "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
    "Haiti", "Honduras", "Hungary",
    "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
    "Jamaica", "Japan", "Jordan",
    "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan",
    "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
    "Madagascar", "Malawi", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
    "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway",
    "Oman",
    "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
    "Qatar",
    "Romania", "Russia", "Rwanda",
    "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
    "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
    "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan",
    "Vanuatu", "Vatican City", "Venezuela", "Vietnam",
    "Yemen",
    "Zambia", "Zimbabwe"
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
    if (cms.nav?.ctaText === "Open app") cms.nav.ctaText = "Daftar";
    if (cms.finalCta?.primaryText === "Open app") cms.finalCta.primaryText = "Daftar";
    if (cms.conversion?.headline === "Pixels, client scripts, and campaign data are ready to plug in.") {
      cms.conversion.eyebrow = "Mula hari ini";
      cms.conversion.headline = "Temui orang disahkan yang bersedia untuk rancangan sebenar.";
      cms.conversion.body = "Hantar permintaan profil anda dan lihat ahli yang sesuai berhampiran anda. Setiap profil disemak, setiap padanan direka untuk pertemuan sebenar, dan maklumat anda kekal peribadi sehingga anda memilih untuk teruskan.";
      cms.conversion.formTitle = "Daftar untuk padanan";
      cms.conversion.buttonText = "Daftar";
      cms.conversion.note = "Permintaan anda membantu kami mengutamakan profil disahkan yang sesuai.";
    }
    if (!Array.isArray(cms.hero?.highlights) || !cms.hero.highlights.length) {
      cms.hero.highlights = [
        ["4.9", "penilaian purata ahli"],
        ["20K+", "ahli disahkan"],
        ["100%", "profil disemak manusia"]
      ];
    }
    if (!Array.isArray(cms.hero?.miniProfiles) || !cms.hero.miniProfiles.length) {
      cms.hero.miniProfiles = [
        { name: "Alex", city: "Bangkok", activity: "Kopi", image: defaultMiniImages[0] },
        { name: "Nami", city: "Singapore", activity: "Makan malam", image: defaultMiniImages[1] },
        { name: "Mika", city: "Tokyo", activity: "Filem", image: defaultMiniImages[2] }
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
    setText(".access-brand strong", cms.accessPrep?.brand || "lumadate MY");
    setHtml(".access-status", `<span></span>${esc(cms.accessPrep?.status || "Sedang menyediakan akses")}`);
    setText("#access-prep-title", cms.accessPrep?.title || "Akses percuma sedang disediakan");
    setText(".access-hero-copy p", cms.accessPrep?.body || "Kekal di halaman ini sebentar sementara kami memuatkan profil berdekatan yang sesuai untuk anda.");
    setText(".access-hero-copy strong", cms.accessPrep?.waitText || "Anggaran masa menunggu: 0s");
    setText(".access-queue strong", cms.accessPrep?.queueTitle || "Profil sedang menunggu");
    setText(".access-queue p", cms.accessPrep?.queueNote || "Akses anda hampir selesai");
    setText(".access-panel-tags span:first-child", cms.accessPrep?.panelBadge || "• Padanan MY");
    setText(".access-panel-tags span:last-child", cms.accessPrep?.panelStatus || "Sedia");
    setText(".access-panel h2", cms.accessPrep?.panelTitle || "Membuka temu janji tempatan");
    setText(".access-panel > p", cms.accessPrep?.panelBody || "Kami sedang menyusun orang berdekatan, memeriksa isyarat profil, dan menyediakan akses selamat sebelum padanan diteruskan.");
    setText(".access-progress-labels span:first-child", cms.accessPrep?.progressStart || "Sedia");
    setText(".access-progress-labels span:last-child", cms.accessPrep?.progressEnd || "Dibuka");
    if (Array.isArray(cms.accessPrep?.steps)) {
      setHtml(".access-steps", cms.accessPrep.steps.map(([num, title, body]) => `<div><span>${esc(num)}</span><p><strong>${esc(title)}</strong><small>${esc(body)}</small></p></div>`).join(""));
    }
    setText(".access-ready-note strong", cms.accessPrep?.readyTitle || "Akses percuma telah dibuka");
    setText(".access-ready-note span", cms.accessPrep?.readyBody || "Buka halaman seterusnya apabila anda sudah bersedia.");
    setText("#continue-to-guide", cms.accessPrep?.buttonText || "Teruskan akses percuma");
    setText(".access-footnote", cms.accessPrep?.footnote || "Padanan sudah sedia. Sila teruskan di bawah.");
    setText(".access-faq .eyebrow", cms.accessPrep?.faqEyebrow || "Soalan biasa");
    if (Array.isArray(cms.accessPrep?.faq)) {
      setHtml(".access-faq", `<p class="eyebrow">${esc(cms.accessPrep.faqEyebrow || "Soalan biasa")}</p>` + cms.accessPrep.faq.map(([q, a], index) => `<details${index === 0 ? " open" : ""}><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join(""));
    }

    setText("#start-match", cms.matchGate.buttonText);
    setText("#match-status", cms.matchGate.title);
    setText("#match-detail", cms.matchGate.detail);
    setText(".browser-guide .eyebrow", cms.browserGuide?.eyebrow || "Untuk pengalaman terbaik");
    setText("#browser-guide-title", cms.browserGuide?.headline || "Buka halaman ini dalam pelayar sebelum padanan.");
    setText(".guide-body", cms.browserGuide?.body || "Sesetengah pelayar dalam aplikasi boleh menghalang gambar profil, pendaftaran, dan padanan selamat. Buka pautan ini dalam Safari, Chrome, atau pelayar utama anda dahulu.");
    setText("#continue-to-match", cms.browserGuide?.buttonText || "Teruskan ke padanan");
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
    setHtml('.lead-form select[name="country"]', `<option value="">Pilih negara</option>${countryOptions()}`);

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
