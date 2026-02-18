import { NextResponse } from 'next/server';
import { getAlbums, getReleases, getSettings } from '../../../lib/server/content-store';

export async function GET() {
  const [albums, releases, settings] = await Promise.all([
    getAlbums(),
    getReleases(),
    getSettings(),
  ]);
  return NextResponse.json({ albums, releases, settings });
}
