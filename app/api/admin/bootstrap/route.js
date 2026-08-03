import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { getAdmin, setAdmin } from '../../../../lib/server/content-store';
import { hashPassword, setSessionCookie } from '../../../../lib/server/admin-auth';
import { checkRateLimit } from '../../../../lib/server/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const rateLimit = await checkRateLimit(request, {
    scope: 'admin-bootstrap',
    limit: 5,
    windowMs: 30 * 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Intenta nuevamente más tarde.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } },
    );
  }

  const existingAdmin = await getAdmin();
  if (existingAdmin) {
    return NextResponse.json({ error: 'La cuenta admin ya existe.' }, { status: 409 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Solicitud no válida.' }, { status: 400 });
  }

  if (process.env.NODE_ENV === 'production') {
    const expectedSecret = String(process.env.FG_ADMIN_SETUP_SECRET ?? '');
    const providedSecret = String(body.setupSecret ?? '');
    if (expectedSecret.length < 32) {
      return NextResponse.json(
        { error: 'La creación inicial no está habilitada.' },
        { status: 503 },
      );
    }
    const expectedBuffer = Buffer.from(expectedSecret);
    const providedBuffer = Buffer.from(providedSecret);
    if (
      expectedBuffer.length !== providedBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, providedBuffer)
    ) {
      return NextResponse.json({ error: 'Clave de instalación no válida.' }, { status: 403 });
    }
  }

  const username = String(body?.username ?? '').trim();
  const password = String(body?.password ?? '');

  if (username.length < 4 || password.length < 8) {
    return NextResponse.json(
      { error: 'Usuario minimo 4 caracteres y contrasena minima 8.' },
      { status: 400 },
    );
  }

  const { salt, hash } = hashPassword(password);
  await setAdmin({
    username,
    passwordSalt: salt,
    passwordHash: hash,
    createdAt: new Date().toISOString(),
  });

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
