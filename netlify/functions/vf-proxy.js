// Proxy for VerifiedFirst background-check API.
// Keeps VF credentials server-side; Flutter apps authenticate via Firebase ID tokens.
//
// POST body: { firstName, lastName, email, phone }
// Required env vars: VF_AUTH_KEY, VF_PACKAGE_ID, FIREBASE_FOOD_SA
// Optional env var:  VF_ENDPOINT (defaults to production API)

import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(Buffer.from(process.env.FIREBASE_FOOD_SA, 'base64').toString('utf-8'))
    ),
  });
}

const VF_ENDPOINT =
  process.env.VF_ENDPOINT ?? 'https://testing.api.verifiedfirst.com/external/verified-first';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let decoded;
  try {
    const auth = event.headers.authorization ?? event.headers.Authorization ?? '';
    if (!auth.startsWith('Bearer ')) throw new Error('Missing token');
    decoded = await admin.auth().verifyIdToken(auth.slice(7));
  } catch {
    return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { firstName, lastName, email, phone } = body;
  if (!firstName || !lastName || !email || !phone) {
    return {
      statusCode: 400,
      headers: CORS,
      body: JSON.stringify({ error: 'firstName, lastName, email, and phone are required' }),
    };
  }

  try {
    const res = await fetch(`${VF_ENDPOINT}/order`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${process.env.VF_AUTH_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order: {
          search_type: 'app_invitation',
          package_id: process.env.VF_PACKAGE_ID,
          reference_code: decoded.uid,
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
        },
      }),
    });

    return { statusCode: res.status, headers: CORS, body: await res.text() };
  } catch (err) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};
