/**
 * Minimal Supabase PostgREST helper for server-side route handlers.
 * Uses native fetch so we don't need extra dependencies.
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
    throw new Error(
      'Missing SUPABASE_URL and/or SUPABASE_ANON_KEY environment variables.'
    );
  }
}

export async function supabaseRestGet(pathWithQuery: string, options: RequestInit = {}) {
  assertSupabaseEnv();
  const key = getKey();
  const url = `${SUPABASE_URL}${pathWithQuery}`;

  // If the caller provides caching instructions, we skip the default 'no-store'
  const hasCacheInstruction = options.cache || options.next;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      apikey: key!,
      Authorization: `Bearer ${key!}`,
      'Content-Type': 'application/json',
    },
    cache: hasCacheInstruction ? undefined : 'no-store',
    ...options,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Supabase REST error (${res.status}): ${text || res.statusText}`);
  }

  return await res.json();
}

export async function supabaseRestPatch(path: string, data: any) {
  assertSupabaseEnv();
  const key = getKey();
  const url = `${SUPABASE_URL}${path}`;

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      apikey: key!,
      Authorization: `Bearer ${key!}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Supabase REST error (${res.status}): ${text || res.statusText}`);
  }

  return await res.json();
}

export async function supabaseRestUpsert(path: string, data: any[]) {
  assertSupabaseEnv();
  const key = getKey();
  const url = `${SUPABASE_URL}${path}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: key!,
      Authorization: `Bearer ${key!}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Supabase REST error (${res.status}): ${text || res.statusText}`);
  }

  return await res.json();
}

// Plain INSERT (no upsert conflict resolution)
export async function supabaseRestInsert(path: string, data: Record<string, any> | any[]) {
  assertSupabaseEnv();
  const key = getKey();
  const url = `${SUPABASE_URL}${path}`;
  const body = Array.isArray(data) ? data : [data];

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: key!,
      Authorization: `Bearer ${key!}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Supabase REST error (${res.status}): ${text || res.statusText}`);
  }

  return await res.json();
}
