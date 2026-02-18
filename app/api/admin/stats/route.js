import { NextResponse } from 'next/server';
import { getSessionUsername } from '../../../../lib/server/admin-auth';
import { getStats } from '../../../../lib/server/content-store';

export async function GET(request) {
  const username = getSessionUsername(request);
  if (!username) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  const stats = await getStats();
  return NextResponse.json({ stats });
}
