import { NextResponse } from 'next/server';
import { getReleases, incrementStat } from '../../../lib/server/content-store';
import { checkRateLimit } from '../../../lib/server/rate-limit';

const SAFE_SEGMENT = /^[a-z0-9][a-z0-9 _+-]{0,79}$/i;

export async function POST(request) {
  const rateLimit = await checkRateLimit(request, {
    scope: 'track-click',
    limit: 120,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } },
    );
  }

  const body = await request.json().catch(() => ({}));
  const releaseId = String(body?.releaseId ?? '').trim().toLowerCase();
  const channel = String(body?.channel ?? '').trim().toLowerCase();

  if (!SAFE_SEGMENT.test(releaseId) || !SAFE_SEGMENT.test(channel)) {
    return NextResponse.json({ error: 'Métrica no válida.' }, { status: 400 });
  }

  const releases = await getReleases();
  const release = releases.find((item) => item.id === releaseId);
  const allowedChannels = new Set([
    'youtube',
    ...(release?.platforms ?? []).map((platform) => String(platform.title ?? '').trim().toLowerCase()),
  ]);
  if (!release || !allowedChannels.has(channel)) {
    return NextResponse.json({ error: 'Métrica no válida.' }, { status: 400 });
  }

  const key = `${releaseId}:${channel}`;
  const value = await incrementStat(key);
  return NextResponse.json({ ok: true, key, value });
}
