import { NextResponse } from 'next/server';
import { getPreSaves } from '../../../lib/server/content-store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const preSaves = (await getPreSaves()).filter((preSave) => preSave.published);
  return NextResponse.json(
    { preSaves },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    },
  );
}
