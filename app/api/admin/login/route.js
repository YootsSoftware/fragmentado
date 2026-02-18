import { NextResponse } from 'next/server';
import { getAdmin } from '../../../../lib/server/content-store';
import { setSessionCookie, verifyPassword } from '../../../../lib/server/admin-auth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
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
