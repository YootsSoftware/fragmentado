import { NextResponse } from 'next/server';
import { getAlbums, getReleases, getSettings } from '../../../lib/server/content-store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const [albums, releases, settings] = await Promise.all([
    getAlbums(),
    getReleases(),
    getSettings(),
  ]);
  return NextResponse.json(
    { albums, releases, settings },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    },
  );
}
