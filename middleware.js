import { NextResponse } from 'next/server';

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function middleware(request) {
  if (!UNSAFE_METHODS.has(request.method)) return NextResponse.next();

  const fetchSite = String(request.headers.get('sec-fetch-site') ?? '').toLowerCase();
  if (fetchSite === 'cross-site' || fetchSite === 'same-site') {
    return NextResponse.json({ error: 'Origen no permitido.' }, { status: 403 });
  }

  const origin = request.headers.get('origin');
  if (origin) {
    const forwardedHost = String(request.headers.get('x-forwarded-host') ?? '').split(',')[0].trim();
    const targetHost = forwardedHost || request.headers.get('host');
    try {
      if (!targetHost || new URL(origin).host !== targetHost) {
        return NextResponse.json({ error: 'Origen no permitido.' }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: 'Origen no permitido.' }, { status: 403 });
    }
  } else if (fetchSite !== 'same-origin') {
    return NextResponse.json({ error: 'Origen no permitido.' }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/admin/:path*',
};
