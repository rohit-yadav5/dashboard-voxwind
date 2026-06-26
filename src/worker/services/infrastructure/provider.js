// Central resolver for provider-specific credentials.
export async function resolveProviderCredentials(env, provider) {
  if (provider === "cloudflare") {
    return {
      accountId: env.CLOUDFLARE_ACCOUNT_ID,
      apiToken: env.CLOUDFLARE_API_TOKEN
    };
  }
  // Future providers (aws, vercel, etc.) or per-workspace stored secrets
  return null;
}

// Simple orchestrator interface
import { syncCloudflare } from "./cloudflare/client.js";

export async function syncProviderResources(env, provider, siteId) {
  const credentials = await resolveProviderCredentials(env, provider);
  
  if (provider === "cloudflare") {
    return syncCloudflare(env, credentials, siteId);
  }
  
  if (provider === "mock") {
    return {
      status: "success",
      resourcesFound: 0,
      resources: [],
      error: null
    };
  }

  throw new Error(`Unsupported infrastructure provider: ${provider}`);
}