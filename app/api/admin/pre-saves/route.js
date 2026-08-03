import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getSessionUsername } from '../../../../lib/server/admin-auth';
import { getMexicoDateKey } from '../../../../lib/campaign-state';
import { getPreSaves, setPreSaves } from '../../../../lib/server/content-store';

const MAX_CAMPAIGNS = 50;

const slugify = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const normalizeUrl = (value) => {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : '';
  } catch {
    return '';
  }
};

const normalizeMediaUrl = (value) => {
  const raw = String(value ?? '').trim();
  if (raw.startsWith('/') && !raw.startsWith('//')) return raw;
  return normalizeUrl(raw);
};

const normalizePreSave = (value) => ({
  id: slugify(value?.id || value?.title),
  title: String(value?.title ?? '').trim().slice(0, 140),
  artist: String(value?.artist ?? '').trim().slice(0, 100),
  releaseDate: String(value?.releaseDate ?? '').trim(),
  description: String(value?.description ?? '').trim().slice(0, 600),
  cover: normalizeMediaUrl(value?.cover),
  background: normalizeMediaUrl(value?.background),
  published: Boolean(value?.published),
  platforms: Array.isArray(value?.platforms)
    ? value.platforms
        .slice(0, 10)
        .map((platform) => ({
          id: slugify(platform?.id || platform?.label),
          label: String(platform?.label ?? '').trim().slice(0, 60),
          link: normalizeUrl(platform?.link),
          releaseLink: normalizeUrl(platform?.releaseLink),
        }))
        .filter(
          (platform) => platform.id && platform.label && (platform.link || platform.releaseLink),
        )
    : [],
  createdAt: String(value?.createdAt ?? '').trim(),
  updatedAt: String(value?.updatedAt ?? '').trim(),
});

const validatePreSave = (preSave) => {
  if (!preSave.id || !preSave.title) return 'El titulo es obligatorio.';
  if (preSave.releaseDate && !/^\d{4}-\d{2}-\d{2}$/.test(preSave.releaseDate)) {
    return 'La fecha de lanzamiento no es valida.';
  }
  if (preSave.published && !preSave.releaseDate) {
    return 'Agrega la fecha antes de publicar la campaña.';
  }
  if (preSave.published && !preSave.cover) {
    return 'Agrega una portada antes de publicar la campaña.';
  }
  if (preSave.published && !preSave.background) {
    return 'Agrega un fondo antes de publicar la campaña.';
  }
  if (preSave.published && preSave.releaseDate > getMexicoDateKey()) {
    if (!preSave.platforms.some((platform) => platform.link)) {
      return 'Agrega al menos un enlace de pre-save antes de publicar.';
    }
  } else if (
    preSave.published
    && !preSave.platforms.some((platform) => platform.releaseLink || platform.link)
  ) {
    return 'Agrega al menos un enlace para escuchar antes de publicar.';
  }
  return '';
};

const ensureAuth = (request) => getSessionUsername(request);

export async function GET(request) {
  if (!ensureAuth(request)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }
  return NextResponse.json({ preSaves: await getPreSaves() });
}

export async function POST(request) {
  if (!ensureAuth(request)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  const body = await request.json();
  const now = new Date().toISOString();
  const preSave = normalizePreSave({ ...body?.preSave, createdAt: now, updatedAt: now });
  const validationError = validatePreSave(preSave);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const preSaves = await getPreSaves();
  if (preSaves.length >= MAX_CAMPAIGNS) {
    return NextResponse.json({ error: 'Se alcanzo el limite de campañas.' }, { status: 400 });
  }
  if (preSaves.some((item) => item.id === preSave.id)) {
    return NextResponse.json({ error: 'Ya existe una campaña con ese identificador.' }, { status: 409 });
  }

  const next = await setPreSaves([...preSaves, preSave]);
  revalidateTag('public-pre-saves');
  revalidateTag('public-content');
  return NextResponse.json({ preSaves: next });
}

export async function PUT(request) {
  if (!ensureAuth(request)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  const body = await request.json();
  const preSave = normalizePreSave({ ...body?.preSave, updatedAt: new Date().toISOString() });
  const validationError = validatePreSave(preSave);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const preSaves = await getPreSaves();
  const index = preSaves.findIndex((item) => item.id === preSave.id);
  if (index === -1) {
    return NextResponse.json({ error: 'No existe esa campaña.' }, { status: 404 });
  }

  const next = [...preSaves];
  next[index] = { ...preSave, createdAt: preSaves[index].createdAt || preSave.createdAt };
  const saved = await setPreSaves(next);
  revalidateTag('public-pre-saves');
  revalidateTag('public-content');
  return NextResponse.json({ preSaves: saved });
}

export async function DELETE(request) {
  if (!ensureAuth(request)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  const id = slugify(new URL(request.url).searchParams.get('id'));
  if (!id) return NextResponse.json({ error: 'id requerido.' }, { status: 400 });

  const preSaves = await getPreSaves();
  const next = preSaves.filter((item) => item.id !== id);
  if (next.length === preSaves.length) {
    return NextResponse.json({ error: 'No existe esa campaña.' }, { status: 404 });
  }

  const saved = await setPreSaves(next);
  revalidateTag('public-pre-saves');
  revalidateTag('public-content');
  return NextResponse.json({ preSaves: saved });
}
