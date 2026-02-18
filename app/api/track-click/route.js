import { NextResponse } from 'next/server';
import { incrementStat } from '../../../lib/server/content-store';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const releaseId = String(body?.releaseId ?? '').trim();
  const channel = String(body?.channel ?? '').trim();

  if (!releaseId || !channel) {
    return NextResponse.json({ error: 'releaseId y channel son requeridos.' }, { status: 400 });
  }

  const key = `${releaseId}:${channel}`;
  const value = await incrementStat(key);
  return NextResponse.json({ ok: true, key, value });
}
