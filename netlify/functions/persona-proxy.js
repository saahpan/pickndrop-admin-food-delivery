// Proxy for Persona identity-verification API.
// Keeps the Persona API key server-side; Flutter apps authenticate via Firebase ID tokens.
//
// Supported actions (query param):
//   GET  ?action=list&referenceId=<uid|uid_license>  — list inquiries for a driver
//   POST ?action=create  body: { templateId, referenceId }  — create inquiry
//   GET  ?action=get&inquiryId=<inq_...>              — poll inquiry status
//
// Required env vars: PERSONA_API_KEY, FIREBASE_FOOD_SA (base64 service-account JSON)

import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(Buffer.from(process.env.FIREBASE_FOOD_SA, 'base64').toString('utf-8'))
    ),
  });
}

const PERSONA_BASE = 'https://withpersona.com/api/v1';
const PERSONA_VERSION = '2023-01-05';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

async function verifyDriver(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) throw new Error('Missing token');
  return admin.auth().verifyIdToken(authHeader.slice(7));
}

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('', { status: 200, headers: CORS });
  }

  let decoded;
  try {
    decoded = await verifyDriver(req.headers.get('authorization') ?? req.headers.get('Authorization'));
  } catch {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: CORS });
  }

  const uid = decoded.uid;
  const url = new URL(req.url);
  const q = Object.fromEntries(url.searchParams);
  const action = q.action;

  const personaHeaders = {
    Authorization: `Bearer ${process.env.PERSONA_API_KEY}`,
    'Persona-Version': PERSONA_VERSION,
  };

  try {
    // ── List inquiries ───────────────────────────────────────────────────────
    if (req.method === 'GET' && action === 'list') {
      const ref = q.referenceId ?? '';
      if (!ref || !ref.startsWith(uid)) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: CORS });
      }
      const res = await fetch(
        `${PERSONA_BASE}/inquiries?filter%5Breference-id%5D=${encodeURIComponent(ref)}`,
        { headers: personaHeaders }
      );
      return new Response(await res.text(), { status: res.status, headers: CORS });
    }

    // ── Create inquiry ───────────────────────────────────────────────────────
    if (req.method === 'POST' && action === 'create') {
      const body = await req.json();
      const { templateId, referenceId } = body;
      if (!templateId || !referenceId || !referenceId.startsWith(uid)) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: CORS });
      }
      const res = await fetch(`${PERSONA_BASE}/inquiries`, {
        method: 'POST',
        headers: { ...personaHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: { attributes: { 'inquiry-template-id': templateId, 'reference-id': referenceId } },
        }),
      });
      return new Response(await res.text(), { status: res.status, headers: CORS });
    }

    // ── Poll inquiry status ──────────────────────────────────────────────────
    if (req.method === 'GET' && action === 'get') {
      const { inquiryId } = q;
      if (!inquiryId) {
        return new Response(JSON.stringify({ error: 'inquiryId required' }), { status: 400, headers: CORS });
      }
      const res = await fetch(`${PERSONA_BASE}/inquiries/${inquiryId}`, { headers: personaHeaders });
      return new Response(await res.text(), { status: res.status, headers: CORS });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: CORS });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS });
  }
};
