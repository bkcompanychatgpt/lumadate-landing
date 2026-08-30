window.DEFAULT_LANDING_CMS = {
  settings: {
    brandName: "LumaDate",
    brandInitial: "L",
    title: "LumaDate - Verified Real-Life Dates",
    description: "Book verified real-life dates and social activities with human-reviewed profiles, instant booking, privacy controls, and full-funnel tracking.",
    postMatchDestination: "landing.html",
    countdownSeconds: 10,
    appStoreUrl: "#lead-form",
    googlePlayUrl: "#lead-form",
    webAppUrl: "#lead-form",
    apkUrl: "#lead-form"
  },
  tracking: {
    metaPixelId: "",
    tiktokPixelId: "",
    googleTagId: "",
    serverTrackingEndpoint: "",
    publicEventKey: "",
    metaTestEventCode: "",
    tiktokTestEventCode: "",
    customHeadScript: "",
    customBodyScript: ""
  },
  images: {
    matchBackground: "assets/profile-wall.png",
    heroBackground: "assets/profile-wall.png",
    heroPreview: "assets/profile-wall.png"
  },
  matchGate: {
    buttonText: "Click to match",
    title: "Finding your match",
    detail: "The system is matching you with someone compatible. Please wait...",
    states: [
      ["Checking verified profiles", "The system is matching you with someone compatible. Please wait..."],
      ["Comparing city and distance", "Prioritizing active people who are available for a real meetup."],
      ["Reading activity preferences", "Coffee, dinner, movies, and city walks are being matched now."],
      ["Preparing your results", "Almost ready. Opening your personalized landing page."]
    ]
  },
  nav: {
    links: [
      ["Activities", "#activities"],
      ["Verified", "#verified"],
      ["How it works", "#how"],
      ["FAQ", "#faq"]
    ],
    ctaText: "Open app",
    ctaUrl: "#lead-form"
  },
  hero: {
    eyebrow: "Verified in-person dating",
    headline: "Book a date, 100% reviewed profiles.",
    lead: "LumaDate connects you with identity-checked people for real-life dates and activities. No catfishing, no endless chat, no guessing who will show up.",
    previewName: "Illy, 25",
    previewCity: "Kuala Lumpur",
    previewActivity: "Lunch, coffee, city walk",
    previewCta: "Date her",
    badges: [
      ["Download on", "App Store", "#lead-form"],
      ["Get it on", "Google Play", "#lead-form"],
      ["Open", "Web App", "#lead-form"]
    ],
    trust: ["4.9 average rating", "20,000+ verified members", "Every profile human-reviewed"]
  },
  stats: [
    ["24,000+", "real dates booked"],
    ["100%", "identity-checked profiles"],
    ["4.9", "average member rating"],
    ["100+", "cities across Asia"]
  ],
  activities: {
    eyebrow: "Real dates, real moments",
    headline: "Every activity is better with the right person.",
    cards: [
      ["Kuala Lumpur", "Lunch and a movie", "Tomorrow · 12:00-2:00 PM", "18 applied"],
      ["Bangkok", "Coffee", "Saturday · 10:00-11:30 AM", "26 applied"],
      ["Singapore", "City walk", "This weekend · 2:00-4:00 PM", "19 applied"]
    ]
  },
  verified: {
    eyebrow: "Verified profiles",
    headline: "What you see is who you meet.",
    body: "Every profile is reviewed before it appears. Visitors get a clear promise: real photos, real identity signals, real people, and zero catfishing.",
    checks: ["Human-reviewed profiles", "Real identity signals", "Private booking history", "Public-first meetup guidance"]
  },
  profiles: [
    { name: "Alena, 26", city: "Kuala Lumpur", activity: "Coffee date", badge: "Verified", image: "" },
    { name: "Audrey, 21", city: "Bangkok", activity: "City walk", badge: "Available", image: "" },
    { name: "Nami, 22", city: "Singapore", activity: "Dinner", badge: "Reviewed", image: "" }
  ],
  proof: {
    eyebrow: "Stop wasting time",
    headline: "Your time is worth more than months of swiping.",
    body: "LumaDate is designed for people who want a clean path from interest to a respectful real-life plan.",
    bullets: ["Every profile verified and real", "Book a real date in seconds", "No games, no fake photos", "You choose when and where"]
  },
  how: {
    eyebrow: "How it works",
    headline: "Three steps to a real date.",
    steps: [
      ["01", "Browse verified profiles", "Every profile is human-reviewed before users can appear in the experience."],
      ["02", "Book instantly", "Pick a time, choose the activity, and move forward without endless messaging."],
      ["03", "Meet in real life", "Enjoy a respectful date or activity with privacy controls and clear expectations."]
    ]
  },
  conversion: {
    eyebrow: "Built for paid traffic",
    headline: "Pixels, client scripts, and campaign data are ready to plug in.",
    body: "Place a client package in vendor/customer-package.js, or paste tracking snippets into the Pixel zone in index.html. The page records UTM parameters, CTA clicks, lead submissions, matching starts, and matching completions.",
    formTitle: "Open LumaDate",
    buttonText: "Submit and see matches",
    note: "Submission fires a Lead event for ad optimization."
  },
  trust: {
    eyebrow: "Safe and private",
    headline: "Built for trust on both sides.",
    cards: [
      ["Trust", "Human review", "Real staff review identity signals to reduce bots, fakes, and profile surprises."],
      ["Privacy", "Controlled details", "Contact details stay private, and users decide what to share before meeting."],
      ["Choice", "User control", "Users choose who to meet, when to meet, and which activity feels right."]
    ]
  },
  testimonials: {
    eyebrow: "Real members, real dates",
    headline: "Loved by people who are done with fake profiles.",
    quotes: [
      ["I matched, booked, and met her the same week. No games, no ghosting, and she looked like her photos.", "Daniel · Singapore"],
      ["The verification makes the difference. Everyone I met was exactly who they said they were.", "Marcus · Kuala Lumpur"],
      ["I stopped wasting weeks swiping. Now I just book a real date and go.", "Kenji · Tokyo"]
    ]
  },
  faq: {
    eyebrow: "Good to know",
    headline: "Frequently asked questions",
    items: [
      ["Are the profiles really verified?", "Yes. The page is written around a human-review promise, identity signals, real photos, and a safer real-life meetup process."],
      ["Is this safe and private?", "The experience emphasizes privacy, public-first meetup guidance, and user control over who to meet, when, and where."],
      ["How does booking a date work?", "Visitors browse verified profiles, choose an activity and time, then continue through your configured app, web app, or external booking page."],
      ["Which cities can this support?", "The page can support city-specific campaigns across Asia. Update the city list, profile cards, and activity cards to match each ad campaign."]
    ]
  },
  finalCta: {
    headline: "Your next real date is one tap away.",
    body: "Verified people, real activities, instant booking, and a conversion flow built for serious paid traffic.",
    primaryText: "Open app",
    primaryUrl: "#lead-form",
    secondaryText: "Get the invite",
    secondaryUrl: "#lead-form"
  }
};
