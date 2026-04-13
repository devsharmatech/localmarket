/**
 * Minimal Supabase PostgREST helper for server-side route handlers.
 * Uses native fetch so we don't need extra dependencies in this repo.
 *
 * Required env vars (server-only):
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY (preferred) OR SUPABASE_ANON_KEY
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

function getKey() {
  // Using anon key as requested
  return SUPABASE_ANON_KEY;
}

export function assertSupabaseEnv() {
  const key = getKey();
  if (!SUPABASE_URL || !key) {
    const missing = [];
    if (!SUPABASE_URL) missing.push('SUPABASE_URL');
    if (!key) missing.push('SUPABASE_ANON_KEY');
    
    const errorMsg = `[Supabase] Configuration error: Missing environment variables (${missing.join(', ')}).`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
}

export async function supabaseRestGet(pathWithQuery) {
  assertSupabaseEnv();
  const key = getKey();
  const url = `${SUPABASE_URL}${pathWithQuery}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      // Avoid caching admin data at the edge during dev
      cache: 'no-store',
    });

    if (!res.ok) {
      let errorText = '';
      try {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const json = await res.json().catch(() => null);
          errorText = json ? JSON.stringify(json) : '';
        } else {
          errorText = await res.text().catch(() => '');
        }
      } catch (e) {
        errorText = res.statusText || 'Unknown error';
      }

      const statusError = `Supabase REST error (${res.status}): ${errorText || res.statusText}`;
      console.error(`[Supabase] GET Failure:`, { url, status: res.status, error: errorText });
      throw new Error(statusError);
    }

    return await res.json();
  } catch (err) {
    if (err.message && (err.message.includes('fetch failed') || err.message.includes('ENOTFOUND'))) {
      console.error(`[Supabase] Network Error during GET ${url}:`, err.message);
      if (err.message.includes('timeout') || err.message.includes('TIMEOUT')) {
        console.error('💡 Suggestion: Check if your VPS firewall allows outgoing traffic to Supabase (Port 443) and verify your SUPABASE_URL.');
      }
    } else {
      console.error(`[Supabase] Unexpected Error during GET ${url}:`, err);
    }
    throw err;
  }
}

async function supabaseRestWrite(method, pathWithQuery, body, extraHeaders = {}) {
  assertSupabaseEnv();
  const key = getKey();
  const url = `${SUPABASE_URL}${pathWithQuery}`;

  const res = await fetch(url, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Supabase REST error (${res.status}): ${text || res.statusText}`);
  }

  // Some write endpoints return empty body unless Prefer return=representation
  const text = await res.text().catch(() => '');
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function supabaseRestInsert(pathWithQuery, rows) {
  return await supabaseRestWrite('POST', pathWithQuery, rows, { Prefer: 'return=representation' });
}

export async function supabaseRestUpsert(pathWithQuery, rows) {
  // Use Prefer resolution=merge-duplicates for upsert behavior
  return await supabaseRestWrite('POST', pathWithQuery, rows, {
    Prefer: 'resolution=merge-duplicates,return=representation',
  });
}

export async function supabaseRestPost(pathWithQuery, bodyOrOptions) {
  // Handle general-purpose REST calls (legacy pattern found in some routes)
  if (bodyOrOptions && bodyOrOptions.method && bodyOrOptions.body) {
    const rawBody = typeof bodyOrOptions.body === 'string' ? JSON.parse(bodyOrOptions.body) : bodyOrOptions.body;
    return await supabaseRestWrite(bodyOrOptions.method, pathWithQuery, rawBody);
  }
  // Standard POST behavior (Insert)
  return await supabaseRestInsert(pathWithQuery, bodyOrOptions);
}

export async function supabaseRestPatch(pathWithQuery, patchBody) {
  return await supabaseRestWrite('PATCH', pathWithQuery, patchBody, { Prefer: 'return=representation' });
}

export async function supabaseRestDelete(pathWithQuery) {
  return await supabaseRestWrite('DELETE', pathWithQuery, undefined);
}

