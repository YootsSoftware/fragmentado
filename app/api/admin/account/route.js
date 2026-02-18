import { NextResponse } from 'next/server';
import {
  getSessionUsername,
  hashPassword,
  setSessionCookie,
  verifyPassword,
} from '../../../../lib/server/admin-auth';
import { getAdmin, setAdmin } from '../../../../lib/server/content-store';

const MIN_USERNAME_LENGTH = 4;
const MIN_PASSWORD_LENGTH = 8;

export async function PUT(request) {
  const sessionUsername = getSessionUsername(request);
  if (!sessionUsername) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'No existe cuenta admin.' }, { status: 404 });
  }

  const body = await request.json();
  const currentPassword = String(body?.currentPassword ?? '');
  const newPassword = String(body?.newPassword ?? '');
  const confirmPassword = String(body?.confirmPassword ?? '');
  const nextUsername = String(body?.username ?? '').trim();

  const passwordValid = verifyPassword(currentPassword, admin.passwordSalt, admin.passwordHash);
  if (!passwordValid) {
    return NextResponse.json({ error: 'La contrasena actual no es valida.' }, { status: 401 });
  }

  if (!nextUsername || nextUsername.length < MIN_USERNAME_LENGTH) {
    return NextResponse.json(
      { error: `Usuario minimo ${MIN_USERNAME_LENGTH} caracteres.` },
      { status: 400 },
    );
  }

  const isChangingPassword = Boolean(newPassword || confirmPassword);
  if (isChangingPassword) {
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Contrasena minima ${MIN_PASSWORD_LENGTH} caracteres.` },
        { status: 400 },
      );
    }
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'La confirmacion de contrasena no coincide.' }, { status: 400 });
    }
  }

  const nextAdmin = {
    ...admin,
    username: nextUsername,
    updatedAt: new Date().toISOString(),
  };

  if (isChangingPassword) {
    const { salt, hash } = hashPassword(newPassword);
    nextAdmin.passwordSalt = salt;
    nextAdmin.passwordHash = hash;
  }

  await setAdmin(nextAdmin);

  const response = NextResponse.json({ ok: true, username: nextUsername });
  setSessionCookie(response, nextUsername);
  return response;
}
