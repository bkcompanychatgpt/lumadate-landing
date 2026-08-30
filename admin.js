(function () {
  let config = window.getLandingCms();
  let activeTab = "settings";

  const tabs = [
    ["settings", "Settings"],
    ["browserGuide", "Browser Guide"],
    ["match", "Match Gate"],
    ["hero", "Hero"],
    ["stats", "Stats"],
    ["activities", "Activities"],
    ["profiles", "Profiles"],
    ["proof", "Proof"],
    ["process", "Process"],
    ["conversion", "Conversion"],
    ["trust", "Trust"],
    ["testimonials", "Testimonials"],
    ["faq", "FAQ"],
    ["tracking", "Tracking"],
    ["images", "Images"]
  ];

  const panel = document.querySelector("#panel");
  const panelTitle = document.querySelector("#panel-title");
  const tabNav = document.querySelector("#admin-tabs");
  const sidebar = document.querySelector(".admin-sidebar");
  const toast = document.querySelector("#toast");

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function get(path) {
    return path.split(".").reduce((obj, key) => obj?.[key], config);
  }

  function set(path, value) {
    const keys = path.split(".");
    let target = config;
    keys.slice(0, -1).forEach((key) => {
      target[key] = target[key] || {};
      target = target[key];
    });
    target[keys.at(-1)] = value;
  }

  function esc(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    window.setTimeout(() => toast.classList.remove("show"), 2200);
  }

  function field(path, label, type = "text") {
    const value = get(path) ?? "";
    if (type === "textarea") {
      return `<div class="field full"><label>${esc(label)}</label><textarea data-path="${esc(path)}">${esc(value)}</textarea></div>`;
    }
    return `<div class="field"><label>${esc(label)}</label><input type="${type}" data-path="${esc(path)}" value="${esc(value)}" /></div>`;
  }

  function textField(path, label) {
    return field(path, label, "text");
  }

  function numberField(path, label) {
    return field(path, label, "number");
  }

  function textarea(path, label) {
    return field(path, label, "textarea");
  }

  function imageField(path, label) {
    const value = get(path) || "";
    return `
      <div class="field full">
        <label>${esc(label)}</label>
        <img class="image-preview" src="${esc(value)}" alt="${esc(label)} preview" />
        <input data-path="${esc(path)}" value="${esc(value)}" placeholder="Image URL or asset path" />
        <label class="file-btn">Upload image<input type="file" accept="image/*" data-image-path="${esc(path)}" /></label>
      </div>
    `;
  }

  function renderTabs() {
    tabNav.innerHTML = tabs.map(([id, label]) => `<button class="${id === activeTab ? "active" : ""}" data-tab="${id}" type="button">${label}</button>`).join("");
    tabNav.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeTab = btn.dataset.tab;
        render();
      });
    });
  }

  function renderPairArray(path, labels) {
    const rows = get(path) || [];
    return `<div class="repeater" data-array="${esc(path)}" data-type="pair">${rows.map((row, index) => `
      <article class="item-card" data-index="${index}">
        <header><h3>Item ${index + 1}</h3><button type="button" data-remove="${index}">Remove</button></header>
        <div class="grid">${labels.map((label, fieldIndex) => {
          const values = Array.isArray(row) ? row : [row];
          return `<div class="field"><label>${esc(label)}</label><input data-array-field="${fieldIndex}" value="${esc(values[fieldIndex])}" /></div>`;
        }).join("")}</div>
      </article>`).join("")}
      <button type="button" data-add-array="${esc(path)}">Add item</button>
    </div>`;
  }

  function renderStringArray(path, label) {
    const rows = get(path) || [];
    return `<div class="repeater" data-string-array="${esc(path)}">${rows.map((row, index) => `
      <article class="item-card" data-index="${index}">
        <header><h3>Item ${index + 1}</h3><button type="button" data-remove-string="${index}">Remove</button></header>
        <div class="field"><label>${esc(label)}</label><input data-string-field value="${esc(row)}" /></div>
      </article>`).join("")}
      <button type="button" data-add-string="${esc(path)}">Add item</button>
    </div>`;
  }

  function renderProfiles() {
    return `<div class="repeater" data-array="profiles" data-type="profile">${config.profiles.map((profile, index) => `
      <article class="item-card" data-index="${index}">
        <header><h3>Profile ${index + 1}</h3><button type="button" data-remove="${index}">Remove</button></header>
        <div class="grid">
          <div class="field"><label>Name</label><input data-profile-field="name" value="${esc(profile.name)}" /></div>
          <div class="field"><label>City</label><input data-profile-field="city" value="${esc(profile.city)}" /></div>
          <div class="field"><label>Activity</label><input data-profile-field="activity" value="${esc(profile.activity)}" /></div>
          <div class="field"><label>Badge</label><input data-profile-field="badge" value="${esc(profile.badge)}" /></div>
          <div class="field full">
            <label>Profile image</label>
            <img class="image-preview" src="${esc(profile.image || config.images.heroPreview)}" alt="Profile preview" />
            <input data-profile-field="image" value="${esc(profile.image || "")}" placeholder="Image URL, asset path, or uploaded image data" />
            <label class="file-btn">Upload image<input type="file" accept="image/*" data-profile-image="${index}" /></label>
          </div>
        </div>
      </article>`).join("")}
      <button type="button" data-add-profile>Add profile</button>
    </div>`;
  }

  function renderMiniProfiles() {
    const rows = config.hero.miniProfiles || [];
    return `<div class="field full">
      <label>Hero phone mini profiles</label>
      <div class="repeater" data-mini-profiles>${rows.map((profile, index) => `
        <article class="item-card" data-index="${index}">
          <header><h3>Mini profile ${index + 1}</h3><button type="button" data-remove-mini-profile="${index}">Remove</button></header>
          <div class="grid">
            <div class="field"><label>Name</label><input data-mini-profile-field="name" value="${esc(profile.name)}" /></div>
            <div class="field"><label>City</label><input data-mini-profile-field="city" value="${esc(profile.city)}" /></div>
            <div class="field"><label>Activity</label><input data-mini-profile-field="activity" value="${esc(profile.activity)}" /></div>
            <div class="field full">
              <label>Avatar</label>
              <img class="image-preview square-preview" src="${esc(profile.image || config.images.heroPreview)}" alt="Mini profile preview" />
              <input data-mini-profile-field="image" value="${esc(profile.image || "")}" placeholder="Image URL, asset path, or uploaded image data" />
              <label class="file-btn">Upload avatar<input type="file" accept="image/*" data-mini-profile-image="${index}" /></label>
            </div>
          </div>
        </article>`).join("")}
        <button type="button" data-add-mini-profile>Add mini profile</button>
      </div>
    </div>`;
  }

  function renderPanel() {
    const pages = {
      settings: () => `<div class="grid">
        ${textField("settings.brandName", "Brand name")}
        ${textField("settings.brandInitial", "Brand initial")}
        ${textField("settings.title", "SEO title")}
        ${textField("settings.description", "SEO description")}
        ${textField("settings.postMatchDestination", "After-match redirect URL")}
        ${numberField("settings.countdownSeconds", "Loading duration seconds")}
        ${textField("settings.appStoreUrl", "App Store URL")}
        ${textField("settings.googlePlayUrl", "Google Play URL")}
        ${textField("settings.webAppUrl", "Web App URL")}
        ${textField("settings.apkUrl", "APK URL")}
      </div>`,
      browserGuide: () => `<div class="grid">
        ${textField("browserGuide.eyebrow", "Eyebrow")}
        ${textarea("browserGuide.headline", "Headline")}
        ${textarea("browserGuide.body", "Body")}
        ${textField("browserGuide.buttonText", "Button text")}
        ${renderPairArray("browserGuide.steps", ["Number", "Instruction"])}
      </div>`,
      match: () => `<div class="grid">
        ${textField("matchGate.buttonText", "Button text")}
        ${textField("matchGate.title", "Loading title")}
        ${textarea("matchGate.detail", "Loading message")}
        ${renderPairArray("matchGate.states", ["Status title", "Status message"])}
      </div>`,
      hero: () => `<div class="grid">
        ${textField("hero.eyebrow", "Eyebrow")}
        ${textarea("hero.headline", "Headline")}
        ${textarea("hero.lead", "Lead copy")}
        ${textField("hero.previewName", "Featured profile name")}
        ${textField("hero.previewCity", "Featured profile city")}
        ${textField("hero.previewActivity", "Featured profile activity")}
        ${textField("hero.previewCta", "Featured profile CTA")}
        ${renderPairArray("hero.highlights", ["Number / value", "Label"])}
        ${renderStringArray("hero.trust", "Trust badge text")}
        ${renderMiniProfiles()}
      </div>`,
      stats: () => renderPairArray("stats", ["Number", "Label"]),
      activities: () => `<div class="grid">
        ${textField("activities.eyebrow", "Eyebrow")}
        ${textarea("activities.headline", "Headline")}
        ${renderPairArray("activities.cards", ["City", "Activity", "Time", "Applicants"])}
      </div>`,
      profiles: renderProfiles,
      proof: () => `<div class="grid">
        ${textField("proof.eyebrow", "Eyebrow")}
        ${textarea("proof.headline", "Headline")}
        ${textarea("proof.body", "Body")}
        ${renderStringArray("proof.bullets", "Bullet text")}
      </div>`,
      process: () => `<div class="grid">
        ${textField("how.eyebrow", "Eyebrow")}
        ${textarea("how.headline", "Headline")}
        ${renderPairArray("how.steps", ["Number", "Title", "Body"])}
      </div>`,
      conversion: () => `<div class="grid">
        ${textField("conversion.eyebrow", "Eyebrow")}
        ${textarea("conversion.headline", "Headline")}
        ${textarea("conversion.body", "Body")}
        ${textField("conversion.formTitle", "Form title")}
        ${textField("conversion.buttonText", "Form button")}
        ${textField("conversion.note", "Form note")}
      </div>`,
      trust: () => `<div class="grid">
        ${textField("trust.eyebrow", "Eyebrow")}
        ${textarea("trust.headline", "Headline")}
        ${renderPairArray("trust.cards", ["Tag", "Title", "Body"])}
      </div>`,
      testimonials: () => `<div class="grid">
        ${textField("testimonials.eyebrow", "Eyebrow")}
        ${textarea("testimonials.headline", "Headline")}
        ${renderPairArray("testimonials.quotes", ["Quote", "Name / city"])}
      </div>`,
      faq: () => `<div class="grid">
        ${textField("faq.eyebrow", "Eyebrow")}
        ${textarea("faq.headline", "Headline")}
        ${renderPairArray("faq.items", ["Question", "Answer"])}
      </div>`,
      tracking: () => `<div class="grid">
        <div class="field full">
          <label>Server-side tracking note</label>
          <textarea readonly>Browser Pixel IDs run in the page. Client access tokens must stay on your server, Cloudflare Worker, or serverless API. Put your deployed API URL in Server tracking endpoint, then store Meta / TikTok / GA4 tokens as server environment variables.</textarea>
        </div>
        ${textField("tracking.metaPixelId", "Meta Pixel ID")}
        ${textField("tracking.tiktokPixelId", "TikTok Pixel ID")}
        ${textField("tracking.googleTagId", "Google Tag ID")}
        ${textField("tracking.serverTrackingEndpoint", "Server tracking endpoint")}
        ${textField("tracking.publicEventKey", "Public event key")}
        ${textField("tracking.metaTestEventCode", "Meta test event code")}
        ${textField("tracking.tiktokTestEventCode", "TikTok test event code")}
        ${textarea("tracking.customHeadScript", "Custom head script")}
        ${textarea("tracking.customBodyScript", "Custom body script")}
      </div>`,
      images: () => `<div class="grid">
        ${imageField("images.matchBackground", "Match page background")}
        ${imageField("images.heroBackground", "Landing hero background / profile wall")}
        ${imageField("images.heroPreview", "App preview image")}
      </div>`
    };
    return pages[activeTab]();
  }

  function syncScalarInputs() {
    panel.querySelectorAll("[data-path]").forEach((input) => {
      const value = input.type === "number" ? Number(input.value) : input.value;
      set(input.dataset.path, value);
    });
  }

  function syncArrays() {
    panel.querySelectorAll("[data-array]").forEach((wrap) => {
      const path = wrap.dataset.array;
      const rows = Array.from(wrap.querySelectorAll(".item-card")).map((card) => {
        const arrayFields = Array.from(card.querySelectorAll("[data-array-field]"));
        if (!arrayFields.length) return null;
        return arrayFields
          .sort((a, b) => Number(a.dataset.arrayField) - Number(b.dataset.arrayField))
          .map((input) => input.value);
      }).filter(Boolean);
      set(path, rows);
    });

    panel.querySelectorAll("[data-string-array]").forEach((wrap) => {
      const path = wrap.dataset.stringArray;
      const rows = Array.from(wrap.querySelectorAll("[data-string-field]")).map((input) => input.value);
      set(path, rows);
    });

    const profileCards = panel.querySelectorAll('[data-array="profiles"] .item-card');
    if (profileCards.length) {
      config.profiles = Array.from(profileCards).map((card) => {
        const profile = {};
        card.querySelectorAll("[data-profile-field]").forEach((input) => {
          profile[input.dataset.profileField] = input.value;
        });
        return profile;
      });
    }

    const miniProfileCards = panel.querySelectorAll("[data-mini-profiles] .item-card");
    if (miniProfileCards.length) {
      config.hero.miniProfiles = Array.from(miniProfileCards).map((card) => {
        const profile = {};
        card.querySelectorAll("[data-mini-profile-field]").forEach((input) => {
          profile[input.dataset.miniProfileField] = input.value;
        });
        return profile;
      });
    }
  }

  function syncPanel() {
    syncScalarInputs();
    syncArrays();
  }

  function bindPanel() {
    panel.querySelectorAll("input, textarea").forEach((input) => {
      input.addEventListener("input", syncPanel);
    });

    panel.querySelectorAll("[data-add-array]").forEach((btn) => {
      btn.addEventListener("click", () => {
        syncPanel();
        const path = btn.dataset.addArray;
        const list = get(path) || [];
        const length = Array.isArray(list[0]) ? list[0].length : 1;
        list.push(Array.from({ length }, () => ""));
        set(path, list);
        render();
      });
    });

    panel.querySelectorAll("[data-add-string]").forEach((btn) => {
      btn.addEventListener("click", () => {
        syncPanel();
        const list = get(btn.dataset.addString) || [];
        list.push("");
        set(btn.dataset.addString, list);
        render();
      });
    });

    panel.querySelectorAll("[data-remove]").forEach((btn) => {
      btn.addEventListener("click", () => {
        syncPanel();
        const wrap = btn.closest("[data-array]");
        const list = get(wrap.dataset.array) || [];
        list.splice(Number(btn.dataset.remove), 1);
        set(wrap.dataset.array, list);
        render();
      });
    });

    panel.querySelectorAll("[data-remove-string]").forEach((btn) => {
      btn.addEventListener("click", () => {
        syncPanel();
        const wrap = btn.closest("[data-string-array]");
        const list = get(wrap.dataset.stringArray) || [];
        list.splice(Number(btn.dataset.removeString), 1);
        set(wrap.dataset.stringArray, list);
        render();
      });
    });

    panel.querySelector("[data-add-profile]")?.addEventListener("click", () => {
      syncPanel();
      config.profiles.push({ name: "New profile", city: "City", activity: "Activity", badge: "Verified", image: "" });
      render();
    });

    panel.querySelector("[data-add-mini-profile]")?.addEventListener("click", () => {
      syncPanel();
      config.hero.miniProfiles = config.hero.miniProfiles || [];
      config.hero.miniProfiles.push({ name: "New", city: "City", activity: "Activity", image: "" });
      render();
    });

    panel.querySelectorAll("[data-remove-mini-profile]").forEach((btn) => {
      btn.addEventListener("click", () => {
        syncPanel();
        config.hero.miniProfiles.splice(Number(btn.dataset.removeMiniProfile), 1);
        render();
      });
    });

    panel.querySelectorAll("[data-image-path]").forEach((input) => {
      input.addEventListener("change", async () => {
        const dataUrl = await fileToDataUrl(input.files[0]);
        set(input.dataset.imagePath, dataUrl);
        render();
      });
    });

    panel.querySelectorAll("[data-profile-image]").forEach((input) => {
      input.addEventListener("change", async () => {
        const dataUrl = await fileToDataUrl(input.files[0]);
        config.profiles[Number(input.dataset.profileImage)].image = dataUrl;
        render();
      });
    });

    panel.querySelectorAll("[data-mini-profile-image]").forEach((input) => {
      input.addEventListener("change", async () => {
        const dataUrl = await fileToDataUrl(input.files[0]);
        config.hero.miniProfiles[Number(input.dataset.miniProfileImage)].image = dataUrl;
        render();
      });
    });
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function render() {
    renderTabs();
    panelTitle.textContent = tabs.find(([id]) => id === activeTab)?.[1] || "Content";
    panel.innerHTML = renderPanel();
    bindPanel();
  }

  document.querySelector("#save-btn").addEventListener("click", async () => {
    syncPanel();
    try {
      await (window.persistLandingCms ? window.persistLandingCms(config) : Promise.resolve(window.saveLandingCms(config)));
      showToast("Saved to server. Refresh mobile and desktop to see changes.");
    } catch {
      window.saveLandingCms(config);
      showToast("Saved in this browser only. Server save failed.");
    }
  });

  document.querySelector("#preview-btn").addEventListener("click", () => {
    syncPanel();
    window.saveLandingCms(config);
    window.open("app.html", "_blank");
  });

  document.querySelector("#export-btn").addEventListener("click", () => {
    syncPanel();
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${config.settings.brandName || "landing"}-config.json`;
    link.click();
    URL.revokeObjectURL(url);
  });

  document.querySelector("#import-file").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    config = JSON.parse(await file.text());
    if (window.persistLandingCms) await window.persistLandingCms(config);
    else window.saveLandingCms(config);
    render();
    showToast("Imported and saved.");
  });

  document.querySelector("#reset-btn").addEventListener("click", async () => {
    if (!confirm("Reset all admin changes to default?")) return;
    localStorage.removeItem(window.LANDING_CMS_STORAGE_KEY);
    config = clone(window.DEFAULT_LANDING_CMS);
    if (window.persistLandingCms) await window.persistLandingCms(config);
    render();
    showToast("Reset complete.");
  });

  let touchY = 0;
  sidebar.addEventListener("wheel", (event) => {
    const maxScroll = sidebar.scrollHeight - sidebar.clientHeight;
    if (maxScroll <= 0) return;
    sidebar.scrollTop += event.deltaY;
    event.preventDefault();
  }, { passive: false });

  sidebar.addEventListener("touchstart", (event) => {
    touchY = event.touches[0]?.clientY || 0;
  }, { passive: true });

  sidebar.addEventListener("touchmove", (event) => {
    const nextY = event.touches[0]?.clientY || touchY;
    const maxScroll = sidebar.scrollHeight - sidebar.clientHeight;
    if (maxScroll <= 0) return;
    sidebar.scrollTop += touchY - nextY;
    touchY = nextY;
    event.preventDefault();
  }, { passive: false });

  render();
  if (!localStorage.getItem(window.LANDING_CMS_STORAGE_KEY) && window.loadLandingCms) {
    window.loadLandingCms({ includeLocal: false }).then((serverConfig) => {
      config = serverConfig;
      render();
    });
  }
})();
