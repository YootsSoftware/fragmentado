import { NextResponse } from 'next/server';
import { getAlbums, getReleases, setAlbums } from '../../../../lib/server/content-store';
import { getSessionUsername } from '../../../../lib/server/admin-auth';

const normalizeAlbum = (album) => ({
  id: String(album?.id ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-'),
  title: String(album?.title ?? '').trim(),
  artist: String(album?.artist ?? '').trim(),
  year: String(album?.year ?? '').trim(),
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

  const albums = await getAlbums();
  return NextResponse.json({ albums });
}

export async function POST(request) {
  if (!ensureAuth(request)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  const body = await request.json();
  const album = normalizeAlbum(body?.album);
  if (!album.id || !album.title) {
    return NextResponse.json({ error: 'id y title son obligatorios.' }, { status: 400 });
  }

  const albums = await getAlbums();
  if (albums.some((item) => item.id === album.id)) {
    return NextResponse.json({ error: 'Ya existe un disco con ese id.' }, { status: 409 });
  }

  const next = [...albums, album];
  await setAlbums(next);
  return NextResponse.json({ albums: next });
}

export async function PUT(request) {
  if (!ensureAuth(request)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  const body = await request.json();
  const album = normalizeAlbum(body?.album);
  if (!album.id || !album.title) {
    return NextResponse.json({ error: 'id y title son obligatorios.' }, { status: 400 });
  }

  const albums = await getAlbums();
  const index = albums.findIndex((item) => item.id === album.id);
  if (index === -1) {
    return NextResponse.json({ error: 'No existe ese disco.' }, { status: 404 });
  }

  const next = [...albums];
  next[index] = album;
  await setAlbums(next);
  return NextResponse.json({ albums: next });
}

export async function DELETE(request) {
  if (!ensureAuth(request)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  const id = String(new URL(request.url).searchParams.get('id') ?? '').trim();
  if (!id) {
    return NextResponse.json({ error: 'id requerido.' }, { status: 400 });
  }

  const releases = await getReleases();
  if (releases.some((release) => release.albumId === id)) {
    return NextResponse.json(
      { error: 'No puedes eliminar un disco con canciones asociadas.' },
      { status: 409 },
    );
  }

  const albums = await getAlbums();
  const next = albums.filter((item) => item.id !== id);
  if (next.length === albums.length) {
    return NextResponse.json({ error: 'No existe ese disco.' }, { status: 404 });
  }

  await setAlbums(next);
  return NextResponse.json({ albums: next });
}
