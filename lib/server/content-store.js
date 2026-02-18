import { promises as fs } from 'node:fs';
import path from 'node:path';
import { defaultAlbums } from '../default-albums';
import { defaultReleases } from '../default-releases';
import { applyAutomaticBadges } from '../release-status';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'content.json');

const defaultData = {
  admin: null,
  settings: {
    artistName: 'FRAGMENTADO',
  },
  albums: defaultAlbums,
  releases: defaultReleases,
  stats: {},
};

const clone = (value) => JSON.parse(JSON.stringify(value));

const ensureFile = async () => {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify(defaultData, null, 2), 'utf8');
  }
};

const normalizeSettings = (settings) => {
  const artistName = String(settings?.artistName ?? 'FRAGMENTADO').trim() || 'FRAGMENTADO';
  return { artistName };
};

const normalizeAlbums = (albums, settings) => {
  const artistName = settings?.artistName || 'FRAGMENTADO';
  if (!Array.isArray(albums) || !albums.length) {
    return clone(defaultAlbums).map((album) => ({ ...album, artist: artistName }));
  }

  return albums
    .map((album) => ({
      id: String(album?.id ?? '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-'),
      title: String(album?.title ?? '').trim(),
      artist: artistName,
      year: String(album?.year ?? '').trim(),
    }))
    .filter((album) => album.id && album.title);
};

const normalizeReleases = (releases, albums, settings) => {
  const artistName = settings?.artistName || 'FRAGMENTADO';
  if (!Array.isArray(releases)) {
    return applyAutomaticBadges(clone(defaultReleases).map((release) => ({ ...release, artist: artistName })));
  }

  const defaultAlbumId = albums[0]?.id ?? 'relatando-historias';
  const prepared = releases.map((release) => ({
    ...release,
    albumId: String(release?.albumId ?? defaultAlbumId).trim() || defaultAlbumId,
    artist: artistName,
  }));
  return applyAutomaticBadges(prepared);
};

const readData = async () => {
  await ensureFile();
  const raw = await fs.readFile(DATA_FILE, 'utf8');

  try {
    const parsed = JSON.parse(raw);
    const settings = normalizeSettings(parsed.settings);
    const albums = normalizeAlbums(parsed.albums, settings);
    return {
      admin: parsed.admin ?? null,
      settings,
      albums,
      releases: normalizeReleases(
        Array.isArray(parsed.releases) ? parsed.releases : clone(defaultReleases),
        albums,
        settings,
      ),
      stats: parsed.stats && typeof parsed.stats === 'object' ? parsed.stats : {},
    };
  } catch {
    return clone(defaultData);
  }
};

const writeData = async (payload) => {
  await ensureFile();
  const tmpPath = `${DATA_FILE}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(payload, null, 2), 'utf8');
  await fs.rename(tmpPath, DATA_FILE);
};

export const getAlbums = async () => {
  const data = await readData();
  return data.albums;
};

export const setAlbums = async (albums) => {
  const data = await readData();
  data.albums = normalizeAlbums(albums, data.settings);

  const validIds = new Set(data.albums.map((album) => album.id));
  const fallbackId = data.albums[0]?.id ?? 'relatando-historias';
  data.releases = (data.releases ?? []).map((release) => ({
    ...release,
    albumId: validIds.has(release.albumId) ? release.albumId : fallbackId,
  }));

  await writeData(data);
  return data.albums;
};

export const getReleases = async () => {
  const data = await readData();
  return data.releases;
};

export const setReleases = async (releases) => {
  const data = await readData();
  data.releases = normalizeReleases(releases, data.albums, data.settings);
  await writeData(data);
  return data.releases;
};

export const getAdmin = async () => {
  const data = await readData();
  return data.admin;
};

export const setAdmin = async (admin) => {
  const data = await readData();
  data.admin = admin;
  await writeData(data);
  return data.admin;
};

export const getSettings = async () => {
  const data = await readData();
  return data.settings ?? clone(defaultData.settings);
};

export const setSettings = async (settings) => {
  const data = await readData();
  const nextSettings = normalizeSettings(settings);
  data.settings = nextSettings;
  data.albums = normalizeAlbums(data.albums, nextSettings);
  data.releases = normalizeReleases(data.releases, data.albums, nextSettings);
  await writeData(data);
  return data.settings;
};

export const getStats = async () => {
  const data = await readData();
  return data.stats ?? {};
};

export const incrementStat = async (key) => {
  const data = await readData();
  const current = Number(data.stats?.[key] ?? 0);
  data.stats = {
    ...(data.stats ?? {}),
    [key]: current + 1,
  };
  await writeData(data);
  return data.stats[key];
};
