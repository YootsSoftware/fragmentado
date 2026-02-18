import { NextResponse } from 'next/server';
import { getAdmin } from '../../../../lib/server/content-store';
import { getSessionUsername } from '../../../../lib/server/admin-auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  const admin = await getAdmin();
  const username = getSessionUsername(request);

  return NextResponse.json({
    bootstrapped: Boolean(admin),
    authenticated: Boolean(username),
    username: username ?? null,
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
      Vary: 'Cookie',
    },
  });
}
