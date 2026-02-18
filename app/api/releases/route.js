import { NextResponse } from 'next/server';
import { getAlbums, getReleases } from '../../../lib/server/content-store';

export async function GET() {
  const [albums, releases] = await Promise.all([getAlbums(), getReleases()]);
  return NextResponse.json({ albums, releases });
}
