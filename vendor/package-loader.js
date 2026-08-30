(function () {
  const manifestUrl = "vendor/client-package/manifest.json";

  function injectCss(href) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }

  function injectScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = false;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  function injectHtml(html, target = "body-end") {
    const container = document.createElement("div");
    container.setAttribute("data-client-package-html", target);
    container.innerHTML = html;
    if (target === "body-start") {
      document.body.prepend(container);
    } else {
      document.body.appendChild(container);
    }
  }

  async function loadPackage() {
    const response = await fetch(manifestUrl, { cache: "no-store" });
    if (!response.ok) return;
    const manifest = await response.json();
    if (manifest.enabled === false) return;

    (manifest.css || []).forEach(injectCss);
    (manifest.html || []).forEach((item) => injectHtml(item.content || "", item.target));

    for (const src of manifest.js || []) {
      await injectScript(src);
    }

    if (typeof window.CLIENT_PACKAGE?.init === "function") {
      window.CLIENT_PACKAGE.init({
        cms: window.LANDING_CMS,
        track(eventName, payload) {
          if (typeof window.MATCH_LANDING_HOOKS?.onTrack === "function") {
            window.MATCH_LANDING_HOOKS.onTrack(eventName, payload);
          }
        }
      });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    loadPackage().catch((error) => console.warn("[client-package-loader]", error));
  });
})();
