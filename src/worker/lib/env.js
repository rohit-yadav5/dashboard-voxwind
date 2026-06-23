const ALLOWED = new Set(["development", "staging", "production"]);

export function runtimeEnvironment(env, url) {
  const requested = url.searchParams.get("env") || url.searchParams.get("environment") || env.APP_ENV || "production";
  const value = requested === "local" ? "development" : requested;
  return ALLOWED.has(value) ? value : "production";
}

export function cacheKey(environment, name) {
  return `public:${environment}:${name}`;
}

export function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}
