import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { getPublicContent } from '../../../lib/server/content-store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const getCachedPublicContent = unstable_cache(
  getPublicContent,
  ['fragmentado-public-content'],
  { revalidate: 60, tags: ['public-content'] },
);

export async function GET() {
  const { albums, releases, settings } = await getCachedPublicContent();
  return NextResponse.json(
    { albums, releases, settings },
    {
      headers: {
        'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
      },
    },
  );
}
