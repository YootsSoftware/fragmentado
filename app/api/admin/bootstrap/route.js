import { NextResponse } from 'next/server';
import { getAdmin, setAdmin } from '../../../../lib/server/content-store';
import { hashPassword, setSessionCookie } from '../../../../lib/server/admin-auth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const existingAdmin = await getAdmin();
  if (existingAdmin) {
    return NextResponse.json({ error: 'La cuenta admin ya existe.' }, { status: 409 });
  }

  const body = await request.json();
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
