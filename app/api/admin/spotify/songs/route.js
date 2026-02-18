import { NextResponse } from 'next/server';
import { getSessionUsername } from '../../../../../lib/server/admin-auth';
import { getSpotifyConfigFromEnv } from '../../../../../lib/server/spotify-config';

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
const SAFE_LIMITS = [20, 10, 1];

const ensureAuth = (request) => {
  const username = getSessionUsername(request);
  if (!username) return null;
  return username;
};

const readSpotifyPayload = async (response) => {
  const raw = await response.text();
  let payload = null;
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = null;
    }
  }
  const message =
    String(payload?.error_description ?? payload?.error?.message ?? payload?.error ?? '').trim() ||
    raw.trim();
  return { payload, message };
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

  const { payload, message } = await readSpotifyPayload(response);
  if (!response.ok || !payload?.access_token) {
    if (response.status === 429) {
      const retryAfter = String(response.headers.get('retry-after') ?? '').trim();
      throw new Error(
        `Spotify limito temporalmente la solicitud.${retryAfter ? ` Reintenta en ${retryAfter}s.` : ''}`,
      );
    }
    throw new Error(message || 'No se pudo autenticar con Spotify.');
  }
  return payload.access_token;
};

const fetchArtistAlbumsByMarket = async (artistId, market, token) => {
  const albums = [];
  let offset = 0;
  let hasMore = true;
  let activeLimit = SAFE_LIMITS[0];

  while (hasMore) {
    let payload = null;
    let succeeded = false;

    for (const limit of SAFE_LIMITS) {
      const url = new URL(`${SPOTIFY_API_BASE}/artists/${encodeURIComponent(artistId)}/albums`);
      url.searchParams.set('include_groups', 'album,single');
      if (market) {
        url.searchParams.set('market', market);
      }
      url.searchParams.set('limit', String(limit));
      url.searchParams.set('offset', String(offset));

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const parsed = await readSpotifyPayload(response);
      payload = parsed.payload;

      if (response.ok) {
        activeLimit = limit;
        succeeded = true;
        break;
      }

      if (response.status === 429) {
        const retryAfter = String(response.headers.get('retry-after') ?? '').trim();
        throw new Error(
          `Spotify limito temporalmente la solicitud.${retryAfter ? ` Reintenta en ${retryAfter}s.` : ''}`,
        );
      }

      const message = String(parsed.message ?? '');
      if (!message.toLowerCase().includes('invalid limit')) {
        throw new Error(message || 'No se pudieron obtener los discos del artista.');
      }
    }

    if (!succeeded) {
      throw new Error('Spotify rechazo todos los limites para obtener discos del artista.');
    }

    const items = payload?.items ?? [];
    albums.push(...items);
    offset += activeLimit;
    hasMore = items.length === activeLimit;
  }

  const seen = new Set();
  return albums.filter((album) => {
    if (!album?.id || seen.has(album.id)) return false;
    seen.add(album.id);
    return true;
  });
};

const fetchArtistAlbums = async (artistId, market, token) => {
  const [withMarket, withoutMarket] = await Promise.all([
    fetchArtistAlbumsByMarket(artistId, market, token),
    fetchArtistAlbumsByMarket(artistId, '', token),
  ]);

  const merged = [...withMarket, ...withoutMarket];
  const seen = new Set();
  return merged.filter((album) => {
    if (!album?.id || seen.has(album.id)) return false;
    seen.add(album.id);
    return true;
  });
};

const fetchAlbumTracks = async (albumId, token) => {
  const tracks = [];
  let offset = 0;
  let hasMore = true;
  let activeLimit = SAFE_LIMITS[0];

  while (hasMore) {
    let payload = null;
    let succeeded = false;

    for (const limit of SAFE_LIMITS) {
      const url = new URL(`${SPOTIFY_API_BASE}/albums/${encodeURIComponent(albumId)}/tracks`);
      url.searchParams.set('limit', String(limit));
      url.searchParams.set('offset', String(offset));

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const parsed = await readSpotifyPayload(response);
      payload = parsed.payload;

      if (response.ok) {
        activeLimit = limit;
        succeeded = true;
        break;
      }

      if (response.status === 429) {
        const retryAfter = String(response.headers.get('retry-after') ?? '').trim();
        throw new Error(
          `Spotify limito temporalmente la solicitud.${retryAfter ? ` Reintenta en ${retryAfter}s.` : ''}`,
        );
      }

      const message = String(parsed.message ?? '');
      if (!message.toLowerCase().includes('invalid limit')) {
        throw new Error(message || 'No se pudieron obtener canciones del album.');
      }
    }

    if (!succeeded) {
      throw new Error(`Spotify rechazo todos los limites para canciones del album ${albumId}.`);
    }

    const items = payload?.items ?? [];
    tracks.push(...items);
    offset += activeLimit;
    hasMore = items.length === activeLimit;
  }

  return tracks;
};

export async function GET(request) {
  if (!ensureAuth(request)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  const spotify = getSpotifyConfigFromEnv();
  const { clientId, clientSecret, artistId, market } = spotify;

  if (!clientId || !clientSecret || !artistId) {
    return NextResponse.json(
      { error: 'Faltan datos de Spotify (client id, client secret o artist id).' },
      { status: 400 },
    );
  }

  try {
    const token = await getSpotifyAccessToken(clientId, clientSecret);
    const albums = await fetchArtistAlbums(artistId, market, token);

    const allTracks = [];
    for (const album of albums) {
      const tracks = await fetchAlbumTracks(album.id, token);
      for (const track of tracks) {
        allTracks.push({
          id: track.id,
          title: track.name,
          trackNumber: track.track_number,
          discNumber: track.disc_number,
          durationMs: track.duration_ms,
          spotifyUrl: track.external_urls?.spotify ?? '',
          previewUrl: track.preview_url ?? '',
          albumId: album.id,
          albumName: album.name,
          releaseDate: album.release_date,
          cover: album.images?.[0]?.url ?? '',
        });
      }
    }

    const deduped = [];
    const seenTrackIds = new Set();
    for (const track of allTracks) {
      if (!track.id || seenTrackIds.has(track.id)) continue;
      seenTrackIds.add(track.id);
      deduped.push(track);
    }

    deduped.sort((a, b) => String(b.releaseDate).localeCompare(String(a.releaseDate)));

    return NextResponse.json({
      artistId,
      market,
      totalAlbums: albums.length,
      totalTracks: deduped.length,
      tracks: deduped,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudieron cargar canciones de Spotify.' },
      { status: 502 },
    );
  }
}
