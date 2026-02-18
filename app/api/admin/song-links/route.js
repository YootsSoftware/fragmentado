import { NextResponse } from 'next/server';
import { getSessionUsername } from '../../../../lib/server/admin-auth';

const SONG_LINK_API = 'https://api.song.link/v1-alpha.1/links';

const ensureAuth = (request) => {
  const username = getSessionUsername(request);
  if (!username) return null;
  return username;
};

const buildPlatformPayload = (linksByPlatform) => {
  const spotify = linksByPlatform?.spotify?.url ?? '';
  const appleMusic = linksByPlatform?.appleMusic?.url ?? '';
  const amazonMusic = linksByPlatform?.amazonMusic?.url ?? '';
  const deezer = linksByPlatform?.deezer?.url ?? '';

  return {
    spotify,
    appleMusic,
    amazonMusic,
    deezer,
  };
};

export async function GET(request) {
  if (!ensureAuth(request)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sourceUrl = String(searchParams.get('url') ?? '').trim();

  if (!sourceUrl) {
    return NextResponse.json({ error: 'url requerida.' }, { status: 400 });
  }

  try {
    const endpoint = new URL(SONG_LINK_API);
    endpoint.searchParams.set('url', sourceUrl);

    const response = await fetch(endpoint.toString(), { cache: 'no-store' });
    const payload = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            payload?.message ||
            payload?.error ||
            'No se pudieron obtener links cruzados de song.link.',
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      links: buildPlatformPayload(payload?.linksByPlatform ?? {}),
      pageUrl: String(payload?.pageUrl ?? ''),
    });
  } catch {
    return NextResponse.json(
      { error: 'No se pudieron obtener links cruzados de song.link.' },
      { status: 502 },
    );
  }
}
