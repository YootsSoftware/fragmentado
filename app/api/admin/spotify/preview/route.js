import { NextResponse } from 'next/server';
import { getSessionUsername } from '../../../../../lib/server/admin-auth';
import { getSpotifyConfigFromEnv } from '../../../../../lib/server/spotify-config';

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

const ensureAuth = (request) => {
  const username = getSessionUsername(request);
  if (!username) return null;
  return username;
};

const getSpotifyTrackId = (value) => {
  const raw = String(value ?? '').trim();
  if (!raw) return '';

  if (raw.startsWith('spotify:track:')) {
    return raw.split(':')[2] ?? '';
  }

  try {
    const url = new URL(raw);
    const parts = url.pathname.split('/').filter(Boolean);
    const trackIndex = parts.findIndex((part) => part === 'track');
    if (trackIndex >= 0 && parts[trackIndex + 1]) {
      return parts[trackIndex + 1];
    }
  } catch {
    // not a URL; ignore
  }

  return '';
};

const getSpotifyAccessToken = async (clientId, clientSecret) => {
  const encoded = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${encoded}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }).toString(),
    cache: 'no-store',
  });

  const payload = await response.json();
  if (!response.ok || !payload?.access_token) {
    throw new Error(payload?.error_description || payload?.error || 'No se pudo autenticar con Spotify.');
  }
  return payload.access_token;
};

const fetchTrack = async (trackId, token, market) => {
  const url = new URL(`${SPOTIFY_API_BASE}/tracks/${encodeURIComponent(trackId)}`);
  if (market) url.searchParams.set('market', market);

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message || 'No se pudo consultar la cancion en Spotify.');
  }
  return payload;
};

export async function GET(request) {
  if (!ensureAuth(request)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sourceUrl = String(searchParams.get('url') ?? '').trim();
  const trackId = getSpotifyTrackId(sourceUrl);
  if (!trackId) {
    return NextResponse.json({ error: 'No se pudo obtener el id de track de Spotify.' }, { status: 400 });
  }

  const spotify = getSpotifyConfigFromEnv();
  const { clientId, clientSecret, market } = spotify;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'Faltan credenciales de Spotify en configuracion.' }, { status: 400 });
  }

  try {
    const token = await getSpotifyAccessToken(clientId, clientSecret);
    let track = null;
    try {
      track = await fetchTrack(trackId, token, market);
    } catch {
      track = await fetchTrack(trackId, token, '');
    }

    return NextResponse.json({
      trackId,
      previewUrl: String(track?.preview_url ?? ''),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo obtener preview desde Spotify.' },
      { status: 502 },
    );
  }
}
