import { parseJson } from "../lib/json.js";

export function decodeRow(row) {
  if (!row) return null;
  const out = { ...row };
  for (const key of Object.keys(out)) {
    if (key.endsWith("_json")) {
      const publicKey = key.slice(0, -5);
      out[publicKey] = parseJson(out[key], key.includes("tags") || key.includes("flags") || key.includes("endpoints") ? [] : {});
    }
  }
  return out;
}

export function decodeRows(rows = []) {
  return rows.map(decodeRow);
}

export async function first(db, sql, binds = []) {
  return db.prepare(sql).bind(...binds).first();
}

export async function all(db, sql, binds = []) {
  const result = await db.prepare(sql).bind(...binds).all();
  return result.results || [];
}
