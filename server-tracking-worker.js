/*
  Cloudflare Worker / serverless tracking endpoint example.

  Do not put client access tokens in the landing page. Put them in environment
  variables on your server or worker:

  META_PIXEL_ID
  META_ACCESS_TOKEN
  TIKTOK_PIXEL_CODE
  TIKTOK_ACCESS_TOKEN
  GA4_MEASUREMENT_ID
  GA4_API_SECRET
  PUBLIC_EVENT_KEY
*/

const META_EVENT_MAP = {
  PageView: "PageView",
  StartMatch: "StartMatch",
  MatchComplete: "CompleteRegistration",
  CtaClick: "Contact",
  Lead: "Lead"
};

const TIKTOK_EVENT_MAP = {
  PageView: "ViewContent",
  StartMatch: "ClickButton",
  MatchComplete: "CompleteRegistration",
  CtaClick: "ClickButton",
  Lead: "SubmitForm"
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return cors(new Response(null, { status: 204 }));
    if (request.method !== "POST") return cors(json({ error: "Method not allowed" }, 405));

    const input = await request.json().catch(() => null);
    if (!input) return cors(json({ error: "Invalid JSON" }, 400));
    if (env.PUBLIC_EVENT_KEY && input.publicEventKey !== env.PUBLIC_EVENT_KEY) {
      return cors(json({ error: "Unauthorized" }, 401));
    }

    const results = await Promise.allSettled([
      sendMeta(input, env),
      sendTikTok(input, env),
      sendGa4(input, env)
    ]);

    return cors(json({
      ok: true,
      eventName: input.eventName,
      eventId: input.eventId,
      results: results.map((result) => result.status === "fulfilled" ? result.value : { ok: false, error: result.reason?.message || String(result.reason) })
    }));
  }
};

async function sendMeta(input, env) {
  if (!env.META_PIXEL_ID || !env.META_ACCESS_TOKEN) return { platform: "meta", skipped: true };

  const url = `https://graph.facebook.com/v20.0/${env.META_PIXEL_ID}/events?access_token=${encodeURIComponent(env.META_ACCESS_TOKEN)}`;
  const payload = {
    data: [{
      event_name: META_EVENT_MAP[input.eventName] || input.eventName,
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
  };

  return postJson("meta", url, payload, {});
}

async function sendTikTok(input, env) {
  if (!env.TIKTOK_PIXEL_CODE || !env.TIKTOK_ACCESS_TOKEN) return { platform: "tiktok", skipped: true };

  const payload = {
    event_source: "web",
    event_source_id: env.TIKTOK_PIXEL_CODE,
    test_event_code: input.tiktokTestEventCode || undefined,
    data: [{
      event: TIKTOK_EVENT_MAP[input.eventName] || input.eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: input.eventId,
      page: { url: input.sourceUrl, referrer: input.referrer },
      user: {
        user_agent: input.userAgent,
        ttclid: input.ttclid || undefined
      },
      properties: input.data || {}
    }]
  };

  return postJson("tiktok", "https://business-api.tiktok.com/open_api/v1.3/event/track/", payload, {
    "Access-Token": env.TIKTOK_ACCESS_TOKEN
  });
}

async function sendGa4(input, env) {
  if (!env.GA4_MEASUREMENT_ID || !env.GA4_API_SECRET) return { platform: "ga4", skipped: true };

  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(env.GA4_MEASUREMENT_ID)}&api_secret=${encodeURIComponent(env.GA4_API_SECRET)}`;
  const payload = {
    client_id: input.gclid || input.fbp || input.eventId,
    events: [{
      name: input.eventName.toLowerCase(),
      params: {
        event_id: input.eventId,
        page_location: input.sourceUrl,
        page_referrer: input.referrer,
        ...input.data
      }
    }]
  };

  return postJson("ga4", url, payload, {});
}

async function postJson(platform, url, payload, headers) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  return {
    platform,
    ok: response.ok,
    status: response.status,
    body: text.slice(0, 500)
  };
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function cors(response) {
  const next = new Response(response.body, response);
  next.headers.set("Access-Control-Allow-Origin", "*");
  next.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  next.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return next;
}
