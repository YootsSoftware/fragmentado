import { NextResponse } from 'next/server';
import { getAdmin } from '../../../../lib/server/content-store';
import { setSessionCookie, verifyPassword } from '../../../../lib/server/admin-auth';
import { checkRateLimit } from '../../../../lib/server/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const rateLimit = await checkRateLimit(request, {
    scope: 'admin-login',
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Intenta nuevamente más tarde.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } },
    );
  }

  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Aun no existe cuenta admin.' }, { status: 404 });
  }

  const body = await request.json();
  const username = String(body?.username ?? '').trim();
  const password = String(body?.password ?? '');

  if (username !== admin.username) {
    return NextResponse.json({ error: 'Credenciales invalidas.' }, { status: 401 });
  }

  const valid = verifyPassword(password, admin.passwordSalt, admin.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: 'Credenciales invalidas.' }, { status: 401 });
  }

  const response = NextResponse.json(
    { ok: true, username },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
  setSessionCookie(response, username);
  return response;
}
