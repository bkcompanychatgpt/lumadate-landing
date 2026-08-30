# LumaDate Landing Page

This is a static landing page package for paid traffic and client delivery. It includes:

- Minimal click-to-match gate
- 10-second full-page matching countdown
- Hard redirect to `app.html` after matching
- Admin dashboard for editing copy, images, links, tracking, and campaign data
- Full English conversion landing page
- UTM capture
- Meta Pixel / TikTok Pixel / Google Tag / affiliate tracking install zone
- Client JavaScript package slot
- CTA, Lead, StartMatch, and MatchComplete events
- Responsive mobile and desktop layout

## Files

- `index.html`: page structure, SEO, and pixel install zone
- `landing.html`: the full landing page visitors see after the countdown, served publicly as `app.html` on Render
- `styles.css`: visual design and responsive layout
- `script.js`: matching countdown, routing, lead form, and tracking events
- `admin.html`: local admin dashboard
- `admin.js`: admin form logic, import/export, image uploads
- `cms.js`: reads saved admin settings and renders the landing page
- `site-config.js`: default editable content
- `server-tracking-worker.js`: server-side tracking endpoint example for token-based API callbacks
- `server.js`: Render web service server for static pages and `/api/track`
- `render.yaml`: Render Blueprint for deploying the landing page and backend together
- `assets/hero-meetup.png`: hero visual
- `assets/profile-wall.png`: profile wall visual
- `vendor/customer-package.js`: client package slot
- `vendor/package-loader.js`: optional multi-file client package loader
- `vendor/client-package/manifest.json`: client package manifest for CSS, JS, and HTML snippets

## Admin Dashboard

Open:

```text
admin.html
```

The admin dashboard can edit:

- Brand name, SEO title, SEO description, and redirect URL
- Match button text, countdown seconds, countdown message, and countdown status steps
- Hero headline, body copy, app download buttons, trust badges, and preview profile
- Stats, activity cards, profile cards, testimonials, FAQ, trust blocks, and final CTA
- Match background, hero background, app preview image, and individual profile images
- Meta Pixel ID, TikTok Pixel ID, Google Tag ID, and custom script fields
- Server tracking endpoint, public event key, and test event codes
- Campaign configuration import/export as JSON

Saved changes are stored in the browser through `localStorage`. Use Export JSON to move a campaign setup to another browser or machine.

## Pixel And Tracking

The landing package supports these tracking paths:

- Meta Pixel ID
- TikTok Pixel ID
- Google Tag ID
- Server tracking endpoint for token-based callbacks
- Public event key for simple endpoint protection
- Meta test event code
- TikTok test event code
- Custom head script
- Custom body script
- Client package file at `vendor/customer-package.js`

The page fires these events:

- `PageView`
- `StartMatch`
- `MatchComplete`
- `CtaClick`
- `Lead`

Important: access tokens must not be placed inside `index.html`, `landing.html`, `site-config.js`, or the admin dashboard. Tokens belong on a server, serverless function, or Cloudflare Worker.

## Token-Based Server Tracking

If a client gives you a Meta Conversions API token, TikTok Events API token, or Google Measurement Protocol secret:

1. Deploy this project to Render as a Web Service, or deploy `server-tracking-worker.js` to another serverless platform.
2. Put the client tokens in Render environment variables or your serverless environment.
3. Open `admin.html`.
4. Go to `Tracking`.
5. Use `/api/track` in `Server tracking endpoint` when deploying this project on Render.
6. Enter the same non-secret value in `Public event key` and your server environment variable `PUBLIC_EVENT_KEY`.
7. Save changes.

Recommended server environment variables:

```text
META_PIXEL_ID=
META_ACCESS_TOKEN=
TIKTOK_PIXEL_CODE=
TIKTOK_ACCESS_TOKEN=
GA4_MEASUREMENT_ID=
GA4_API_SECRET=
PUBLIC_EVENT_KEY=
```

The landing page sends every event to both browser pixels and the server endpoint. The server endpoint then forwards the event to Meta, TikTok, and GA4 without exposing client tokens in the browser.

## Deploy On Render

This project is ready for Render as a Web Service:

```text
Build Command: npm install
Start Command: npm start
```

Render will provide a default `*.onrender.com` domain after deployment. The app binds to `0.0.0.0` and uses Render's `PORT` environment variable.

Add these environment variables in Render when the client provides token-based tracking:

```text
PUBLIC_EVENT_KEY=
META_PIXEL_ID=
META_ACCESS_TOKEN=
TIKTOK_PIXEL_CODE=
TIKTOK_ACCESS_TOKEN=
GA4_MEASUREMENT_ID=
GA4_API_SECRET=
```

What this package can guarantee locally:

- The landing page collects events.
- Browser pixels fire when their IDs are configured.
- Events are POSTed to `Server tracking endpoint` when it is configured.
- The provided worker shows where Meta / TikTok / GA4 tokens must be stored and how events are forwarded.

What must be verified after deployment:

- The client's token is valid.
- The client's ad account, pixel, dataset, or event source has permission for that token.
- The deployed server endpoint is reachable over HTTPS.
- Meta Events Manager, TikTok Events Manager, or GA4 DebugView receives the test events.

## Install A Client Package

If the client gives you a single `.js` file, replace:

```text
vendor/customer-package.js
```

That file is loaded on both `index.html` and `landing.html`. It can listen to landing events through:

```js
window.MATCH_LANDING_HOOKS = {
  onTrack(eventName, payload) {
    // Send eventName and payload to the client package.
  }
};
```

If the client gives you a full package with CSS, JS, or HTML:

1. Put the files inside `vendor/client-package/`.
2. Edit `vendor/client-package/manifest.json`.
3. Set `"enabled": true`.
4. List their CSS files under `css`.
5. List their JS files under `js`.
6. Put required HTML snippets under `html`.

Example:

```json
{
  "enabled": true,
  "css": ["vendor/client-package/client.css"],
  "js": ["vendor/client-package/client.js"],
  "html": [
    {
      "target": "body-end",
      "content": "<div id=\"client-widget\"></div>"
    }
  ]
}
```

If the client gives you a script snippet, paste it under this comment in `index.html` and `landing.html`, or paste it in the admin `Tracking` custom script fields:

```html
<!-- Pixel / tracking install zone -->
```

## Change The Post-Match Destination

Open `index.html` and edit:

```js
destinationAfterMatch: "app.html"
```

To send users to an external landing page after the 10-second match, use:

```js
destinationAfterMatch: "https://example.com"
```

## Local Preview

Open `index.html` directly, or run a local server:

```bash
npx serve .
```
