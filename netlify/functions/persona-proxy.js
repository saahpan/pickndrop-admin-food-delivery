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

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };

  let decoded;
  try {
    decoded = await verifyDriver(event.headers.authorization ?? event.headers.Authorization);
  } catch {
    return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const uid = decoded.uid;
  const q = event.queryStringParameters ?? {};
  const action = q.action;

  const personaHeaders = {
    Authorization: `Bearer ${process.env.PERSONA_API_KEY}`,
    'Persona-Version': PERSONA_VERSION,
  };

  try {
    // ── List inquiries for a reference ID ────────────────────────────────────
    if (event.httpMethod === 'GET' && action === 'list') {
      const ref = q.referenceId ?? '';
      // Drivers may only list their own inquiries (referenceId starts with their uid)
      if (!ref || !ref.startsWith(uid)) {
        return { statusCode: 403, headers: CORS, body: JSON.stringify({ error: 'Forbidden' }) };
      }
      const res = await fetch(
        `${PERSONA_BASE}/inquiries?filter%5Breference-id%5D=${encodeURIComponent(ref)}`,
        { headers: personaHeaders }
      );
      return { statusCode: res.status, headers: CORS, body: await res.text() };
    }

    // ── Create a new inquiry ──────────────────────────────────────────────────
    if (event.httpMethod === 'POST' && action === 'create') {
      const body = JSON.parse(event.body || '{}');
      const { templateId, referenceId } = body;
      if (!templateId || !referenceId || !referenceId.startsWith(uid)) {
        return { statusCode: 403, headers: CORS, body: JSON.stringify({ error: 'Forbidden' }) };
      }
      const res = await fetch(`${PERSONA_BASE}/inquiries`, {
        method: 'POST',
        headers: { ...personaHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: { attributes: { 'inquiry-template-id': templateId, 'reference-id': referenceId } },
        }),
      });
      return { statusCode: res.status, headers: CORS, body: await res.text() };
    }

    // ── Poll inquiry status ───────────────────────────────────────────────────
    if (event.httpMethod === 'GET' && action === 'get') {
      const { inquiryId } = q;
      if (!inquiryId) {
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'inquiryId required' }) };
      }
      const res = await fetch(`${PERSONA_BASE}/inquiries/${inquiryId}`, { headers: personaHeaders });
      return { statusCode: res.status, headers: CORS, body: await res.text() };
    }

    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Unknown action' }) };
  } catch (err) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};
