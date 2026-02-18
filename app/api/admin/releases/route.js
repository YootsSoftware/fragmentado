import { NextResponse } from 'next/server';
import { getReleases, setReleases } from '../../../../lib/server/content-store';
import { getSessionUsername } from '../../../../lib/server/admin-auth';

const normalizePlatform = (platform) => ({
  title: String(platform?.title ?? '').trim(),
  icon: String(platform?.icon ?? '').trim(),
  link: String(platform?.link ?? '').trim(),
});

const slugify = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const normalizeDateComparable = (value) => {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
};

const normalizeRelease = (release) => ({
  id: String(release?.id ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-'),
  albumId: String(release?.albumId ?? '').trim().toLowerCase().replace(/\s+/g, '-'),
  badge: String(release?.badge ?? '').trim(),
  title: String(release?.title ?? '').trim(),
  artist: String(release?.artist ?? '').trim(),
  year: String(release?.year ?? '').trim(),
  releaseDate: String(release?.releaseDate ?? '').trim(),
  cover: String(release?.cover ?? '').trim(),
  previewAudio: String(release?.previewAudio ?? '').trim(),
  youtube: String(release?.youtube ?? '').trim(),
  ...(String(release?.sourceSpotifyTrackId ?? '').trim()
    ? { sourceSpotifyTrackId: String(release?.sourceSpotifyTrackId ?? '').trim() }
    : {}),
  ...(String(release?.sourceSpotifyAlbumId ?? '').trim()
    ? { sourceSpotifyAlbumId: String(release?.sourceSpotifyAlbumId ?? '').trim() }
    : {}),
  ...(String(release?.sourceSpotifyAlbumName ?? '').trim()
    ? { sourceSpotifyAlbumName: String(release?.sourceSpotifyAlbumName ?? '').trim() }
    : {}),
  platforms: Array.isArray(release?.platforms)
    ? release.platforms.map(normalizePlatform).filter((p) => p.title || p.link)
    : [],
  isUpcoming: Boolean(release?.isUpcoming),
});

const ensureAuth = (request) => {
  const username = getSessionUsername(request);
  if (!username) return null;
  return username;
};

export async function GET(request) {
  if (!ensureAuth(request)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  const releases = await getReleases();
  return NextResponse.json({ releases });
}

export async function POST(request) {
  if (!ensureAuth(request)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  const body = await request.json();
  const newRelease = normalizeRelease(body?.release);
  if (!newRelease.id || !newRelease.title || !newRelease.albumId) {
    return NextResponse.json({ error: 'id, albumId y title son obligatorios.' }, { status: 400 });
  }

  const releases = await getReleases();
  if (releases.some((release) => release.id === newRelease.id)) {
    return NextResponse.json({ error: 'Ya existe un lanzamiento con ese id.' }, { status: 409 });
  }
  if (
    newRelease.sourceSpotifyTrackId &&
    releases.some((release) => release.sourceSpotifyTrackId === newRelease.sourceSpotifyTrackId)
  ) {
    return NextResponse.json({ error: 'Esta cancion de Spotify ya fue importada.' }, { status: 409 });
  }
  const hasEquivalentRelease = releases.some((release) => {
    const sameAlbumId = String(release.albumId ?? '') === String(newRelease.albumId ?? '');
    if (!sameAlbumId) return false;
    const sameTitle = slugify(release.title) === slugify(newRelease.title);
    if (!sameTitle) return false;
    const existingDate = normalizeDateComparable(release.releaseDate);
    const incomingDate = normalizeDateComparable(newRelease.releaseDate);
    if (incomingDate) return existingDate === incomingDate;
    return true;
  });
  if (hasEquivalentRelease) {
    return NextResponse.json(
      { error: 'Ya existe un lanzamiento similar (titulo, fecha y disco).' },
      { status: 409 },
    );
  }

  const nextReleases = [...releases, newRelease];
  await setReleases(nextReleases);
  return NextResponse.json({ releases: nextReleases });
}

export async function PUT(request) {
  if (!ensureAuth(request)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  const body = await request.json();
  const release = normalizeRelease(body?.release);
  if (!release.id || !release.title || !release.albumId) {
    return NextResponse.json({ error: 'id, albumId y title son obligatorios.' }, { status: 400 });
  }

  const releases = await getReleases();
  const index = releases.findIndex((item) => item.id === release.id);
  if (index === -1) {
    return NextResponse.json({ error: 'No existe ese lanzamiento.' }, { status: 404 });
  }

  const nextReleases = [...releases];
  nextReleases[index] = release;
  await setReleases(nextReleases);
  return NextResponse.json({ releases: nextReleases });
}

export async function DELETE(request) {
  if (!ensureAuth(request)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  const url = new URL(request.url);
  const id = String(url.searchParams.get('id') ?? '').trim();
  const idsParam = String(url.searchParams.get('ids') ?? '').trim();
  const ids = idsParam
    ? idsParam
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
    : [];

  if (!id && !ids.length) {
    return NextResponse.json({ error: 'id o ids requerido.' }, { status: 400 });
  }

  const releases = await getReleases();
  const targets = new Set(id ? [id] : ids);
  const nextReleases = releases.filter((release) => !targets.has(release.id));
  if (nextReleases.length === releases.length) {
    return NextResponse.json({ error: 'No existe ningun lanzamiento objetivo.' }, { status: 404 });
  }

  await setReleases(nextReleases);
  return NextResponse.json({ releases: nextReleases });
}
