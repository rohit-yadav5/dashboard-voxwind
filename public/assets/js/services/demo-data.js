export const tools = [
  {
    id: "tool_echo",
    name: "Echo",
    slug: "echo",
    description: "Text-to-speech generation with translation support.",
    icon: "E",
    category: "Audio",
    status: "live",
    visibility: "public",
    featured: true,
    order: 1,
    urls: { public: "https://echo.voxwind.com", docs: "", admin: "" },
    apiEndpoints: ["/echo/tts", "/echo/translate"],
    limits: { textCharacters: 1000, requestsPerHour: 20 },
    featureFlags: ["echo.enabled", "echo.translate"],
    tags: ["tts", "audio", "google"]
  },
  {
    id: "tool_flow",
    name: "Flow",
    slug: "flow",
    description: "Peer-to-peer browser file transfer over WebRTC.",
    icon: "F",
    category: "Transfer",
    status: "beta",
    visibility: "public",
    featured: false,
    order: 2,
    urls: { public: "https://flow.voxwind.com", docs: "", admin: "" },
    apiEndpoints: ["/flow/share/sessions", "/flow/share/code/lookup"],
    limits: { sessionTtlSeconds: 600, codeTtlSeconds: 120 },
    featureFlags: ["flow.enabled", "flow.code_join"],
    tags: ["webrtc", "files"]
  },
  {
    id: "tool_placeholder",
    name: "Draft Tool",
    slug: "draft-tool",
    description: "Example future tool registration record.",
    icon: "D",
    category: "Utility",
    status: "draft",
    visibility: "private",
    featured: false,
    order: 3,
    urls: { public: "", docs: "", admin: "" },
    apiEndpoints: [],
    limits: {},
    featureFlags: ["draft_tool.enabled"],
    tags: ["planned"]
  }
];

export const users = [];

export const featureFlags = [
  { key: "echo.enabled", description: "Echo public access", enabled: true, scope: "tool:echo" },
  { key: "flow.enabled", description: "Flow public access", enabled: true, scope: "tool:flow" },
  { key: "signup.enabled", description: "Allow new signups", enabled: true, scope: "auth" },
  { key: "dashboard.media_uploads", description: "Enable R2 media upload UI", enabled: false, scope: "dashboard" }
];

export const announcements = [
  { id: "ann_1", title: "Flow beta is available", status: "draft", audience: "public", startsAt: "2026-06-01" },
  { id: "ann_2", title: "Dashboard foundation in progress", status: "published", audience: "internal", startsAt: "2026-05-26" }
];

export const homepageSections = [
  { id: "hero", name: "Hero", type: "hero", status: "published", order: 1 },
  { id: "featured_tools", name: "Featured tools", type: "tool_grid", status: "published", order: 2 },
  { id: "announcement_band", name: "Announcement band", type: "announcement", status: "draft", order: 3 }
];

export const seoPages = [
  { path: "/", title: "VoxWind — Free Online Web Tools", status: "published" },
  { path: "/projects.html", title: "Projects — VoxWind", status: "published" },
  { path: "https://echo.voxwind.com/", title: "Echo — Free Text to Speech", status: "published" },
  { path: "https://flow.voxwind.com/", title: "Flow — Peer-to-Peer File Transfer", status: "draft" }
];

export const analytics = {
  totals: {
    users: 1280,
    toolUsage: 84200,
    apiRequests: 314000,
    activeTools: 2
  },
  growth: [12, 18, 16, 24, 31, 29, 44, 52, 49, 61, 68, 76],
  topTools: [
    { name: "Echo", usage: 68400 },
    { name: "Flow", usage: 15800 },
    { name: "Draft Tool", usage: 0 }
  ],
  events: [
    "Tool config snapshot published",
    "Echo usage limit reviewed",
    "New owner session created",
    "Homepage draft updated"
  ]
};
