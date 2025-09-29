import { NextResponse } from 'next/server';

// Simple, reliable forwarder to NEUS API without extra env or headers
const BASE = 'https://api.neus.network';

function forwardHeaders(incoming) {
  const headers = new Headers();
  headers.set('content-type', 'application/json');
  const auth = incoming.get('authorization');
  if (auth) headers.set('authorization', auth);
  return headers;
}

export async function POST(req, { params }) {
  const targetUrl = `${BASE}/${params.path.join('/')}`;
  const res = await fetch(targetUrl, {
    method: 'POST',
    headers: forwardHeaders(req.headers),
    body: await req.text()
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') || 'application/json' }
  });
}

export async function GET(req, { params }) {
  const qs = req.nextUrl.search || '';
  const targetUrl = `${BASE}/${params.path.join('/')}${qs}`;
  const res = await fetch(targetUrl, {
    method: 'GET',
    headers: forwardHeaders(req.headers),
    cache: 'no-store'
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') || 'application/json' }
  });
}


