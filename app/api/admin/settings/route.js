import { NextResponse } from 'next/server';
import { getSessionUsername } from '../../../../lib/server/admin-auth';
import { getSettings, setSettings } from '../../../../lib/server/content-store';
import { getSpotifyConfigFromEnv } from '../../../../lib/server/spotify-config';

const ensureAuth = (request) => {
  const username = getSessionUsername(request);
  if (!username) return null;
  return username;
};

const normalizePayload = (payload) => {
  return {
    artistName: String(payload?.artistName ?? '').trim(),
    socials: {
      facebook: String(payload?.socials?.facebook ?? '').trim(),
      instagram: String(payload?.socials?.instagram ?? '').trim(),
      youtube: String(payload?.socials?.youtube ?? '').trim(),
      tiktok: String(payload?.socials?.tiktok ?? '').trim(),
    },
  };
};

export async function GET(request) {
  if (!ensureAuth(request)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  const settings = await getSettings();
  const spotify = getSpotifyConfigFromEnv();
  return NextResponse.json({
    settings,
    spotifyEnv: {
      configured: spotify.configured,
      hasClientId: Boolean(spotify.clientId),
      hasClientSecret: Boolean(spotify.clientSecret),
      artistId: spotify.artistId,
      market: spotify.market,
    },
  });
}

export async function PUT(request) {
  if (!ensureAuth(request)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  const body = await request.json();
  const payload = normalizePayload(body?.settings);

  const settings = await setSettings(payload);
  return NextResponse.json({ settings });
}
