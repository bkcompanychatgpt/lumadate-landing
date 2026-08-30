import { createReadStream, existsSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { createServer } from "node:http";

const root = resolve(".");
const port = Number(process.env.PORT || 10000);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".md": "text/markdown; charset=utf-8"
};

const metaEventMap = {
  PageView: "PageView",
  StartMatch: "StartMatch",
  MatchComplete: "CompleteRegistration",
  CtaClick: "Contact",
  Lead: "Lead"
};

const tiktokEventMap = {
  PageView: "ViewContent",
  StartMatch: "ClickButton",
  MatchComplete: "CompleteRegistration",
  CtaClick: "ClickButton",
  Lead: "SubmitForm"
};

createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);

    if (request.method === "OPTIONS") {
      sendCors(response, 204);
      return;
    }

    if (url.pathname === "/api/track") {
      await handleTrack(request, response);
      return;
    }

    serveStatic(url.pathname, response);
  } catch (error) {
    sendJson(response, 500, { ok: false, error: error.message });
  }
}).listen(port, "0.0.0.0", () => {
  console.log(`Landing service running on 0.0.0.0:${port}`);
});

async function handleTrack(request, response) {
  if (request.method !== "POST") {
    sendCors(response, 405, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ ok: false, error: "Method not allowed" }));
    return;
  }

  const input = await readJson(request);
  if (!input) {
    sendJson(response, 400, { ok: false, error: "Invalid JSON" });
    return;
  }

  if (process.env.PUBLIC_EVENT_KEY && input.publicEventKey !== process.env.PUBLIC_EVENT_KEY) {
    sendJson(response, 401, { ok: false, error: "Unauthorized" });
    return;
  }

  const results = await Promise.allSettled([
    sendMeta(input),
    sendTikTok(input),
    sendGa4(input)
  ]);

  sendJson(response, 200, {
    ok: true,
    eventName: input.eventName,
    eventId: input.eventId,
    results: results.map((result) => (
      result.status === "fulfilled"
        ? result.value
        : { ok: false, error: result.reason?.message || String(result.reason) }
    ))
  });
}

function serveStatic(pathname, response) {
  const cleanPath = pathname === "/" ? "/index.html" : decodeURIComponent(pathname);
  const filePath = normalize(join(root, cleanPath));

  if (!filePath.startsWith(root) || !existsSync(filePath)) {
    sendText(response, 404, "Not found");
    return;
  }

  const type = mimeTypes[extname(filePath).toLowerCase()] || "application/octet-stream";
  response.writeHead(200, {
    "Content-Type": type,
    "Cache-Control": type.startsWith("text/html") ? "no-store" : "public, max-age=3600"
  });
  createReadStream(filePath).pipe(response);
}

function readJson(request) {
  return new Promise((resolveJson) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) request.destroy();
    });
    request.on("end", () => {
      try {
        resolveJson(JSON.parse(body || "{}"));
      } catch {
        resolveJson(null);
      }
    });
    request.on("error", () => resolveJson(null));
  });
}

async function sendMeta(input) {
  if (!process.env.META_PIXEL_ID || !process.env.META_ACCESS_TOKEN) {
    return { platform: "meta", skipped: true };
  }

  const endpoint = `https://graph.facebook.com/v20.0/${process.env.META_PIXEL_ID}/events?access_token=${encodeURIComponent(process.env.META_ACCESS_TOKEN)}`;
  return postJson("meta", endpoint, {
    data: [{
      event_name: metaEventMap[input.eventName] || input.eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: input.eventId,
      action_source: "website",
      event_source_url: input.sourceUrl,
      user_data: {
        client_user_agent: input.userAgent,
        fbp: input.fbp || undefined,
        fbc: input.fbc || undefined
      },
      custom_data: input.data || {}
    }],
    test_event_code: input.metaTestEventCode || undefined
  });
}

async function sendTikTok(input) {
  if (!process.env.TIKTOK_PIXEL_CODE || !process.env.TIKTOK_ACCESS_TOKEN) {
    return { platform: "tiktok", skipped: true };
  }

  return postJson("tiktok", "https://business-api.tiktok.com/open_api/v1.3/event/track/", {
    event_source: "web",
    event_source_id: process.env.TIKTOK_PIXEL_CODE,
    test_event_code: input.tiktokTestEventCode || undefined,
    data: [{
      event: tiktokEventMap[input.eventName] || input.eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: input.eventId,
      page: { url: input.sourceUrl, referrer: input.referrer },
      user: {
        user_agent: input.userAgent,
        ttclid: input.ttclid || undefined
      },
      properties: input.data || {}
    }]
  }, { "Access-Token": process.env.TIKTOK_ACCESS_TOKEN });
}

async function sendGa4(input) {
  if (!process.env.GA4_MEASUREMENT_ID || !process.env.GA4_API_SECRET) {
    return { platform: "ga4", skipped: true };
  }

  const endpoint = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(process.env.GA4_MEASUREMENT_ID)}&api_secret=${encodeURIComponent(process.env.GA4_API_SECRET)}`;
  return postJson("ga4", endpoint, {
    client_id: input.gclid || input.fbp || input.eventId,
    events: [{
      name: String(input.eventName || "event").toLowerCase(),
      params: {
        event_id: input.eventId,
        page_location: input.sourceUrl,
        page_referrer: input.referrer,
        ...input.data
      }
    }]
  });
}

async function postJson(platform, endpoint, payload, headers = {}) {
  const apiResponse = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(payload)
  });
  const body = await apiResponse.text();
  return { platform, ok: apiResponse.ok, status: apiResponse.status, body: body.slice(0, 500) };
}

function sendJson(response, status, body) {
  sendCors(response, status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
}

function sendText(response, status, body) {
  response.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  response.end(body);
}

function sendCors(response, status, headers = {}) {
  response.writeHead(status, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    ...headers
  });
}
