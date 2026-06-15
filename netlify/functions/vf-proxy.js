// Proxy for VerifiedFirst background-check API.
// Keeps VF credentials server-side; Flutter apps authenticate via Firebase ID tokens.
//
// POST body: { firstName, lastName, email, phone }
// Required env vars: VF_AUTH_KEY, VF_PACKAGE_ID, FIREBASE_FOOD_SA

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

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response('', { status: 200, headers: CORS });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: CORS });
  }

  let decoded;
  try {
    const auth = req.headers.get('authorization') ?? '';
    if (!auth.startsWith('Bearer ')) throw new Error('Missing token');
    decoded = await admin.auth().verifyIdToken(auth.slice(7));
  } catch {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: CORS });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: CORS });
  }

  const { firstName, lastName, email, phone } = body;
  if (!firstName || !lastName || !email || !phone) {
    return new Response(
      JSON.stringify({ error: 'firstName, lastName, email, and phone are required' }),
      { status: 400, headers: CORS },
    );
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
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
        },
      }),
    });

    return new Response(await res.text(), { status: res.status, headers: CORS });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS });
  }
};
