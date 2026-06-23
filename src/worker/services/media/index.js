import { id } from "../../lib/ids.js";

export function buildUploadIntent({ environment, fileName, mimeType }) {
  return {
    id: id("media"),
    environment,
    bucket: "voxwind-media",
    objectKey: `${environment}/${Date.now()}-${safeName(fileName || "upload.bin")}`,
    mimeType: mimeType || "application/octet-stream",
    status: "upload_pending",
    uploadUrl: null
  };
}

export async function createSignedUploadUrl(_env, intent) {
  // Placeholder for a later phase. Cloudflare R2 signed uploads can be
  // implemented here without changing the admin route contract.
  return {
    ...intent,
    uploadUrl: null,
    strategy: "r2-signed-url-pending"
  };
}

function safeName(value) {
  return String(value).replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120);
}
