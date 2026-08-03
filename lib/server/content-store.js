import { applyAutomaticBadges } from '../release-status';
import { getMongoCollection } from './mongo-client';

const COLLECTIONS = {
  admins: 'admins',
  settings: 'settings',
  albums: 'albums',
  releases: 'releases',
  preSaves: 'pre_saves',
  stats: 'stats',
};

const DOC_IDS = {
  admin: 'primary',
  settings: 'global',
  stats: 'global',
};

const clone = (value) => JSON.parse(JSON.stringify(value));

const defaultSettings = {
  artistName: '',
  hero: {
    mediaType: 'youtube',
    releaseId: 'donde-empieza-termina',
  },
  socials: {
    facebook: '',
    instagram: '',
    youtube: '',
    tiktok: '',
  },
};

let indexesReady = false;
let indexesPromise = null;

const ensureIndexes = async () => {
  if (indexesReady) return;
  if (indexesPromise) return indexesPromise;

  indexesPromise = (async () => {
    const [admins, albums, releases, preSaves] = await Promise.all([
      getMongoCollection(COLLECTIONS.admins),
      getMongoCollection(COLLECTIONS.albums),
      getMongoCollection(COLLECTIONS.releases),
      getMongoCollection(COLLECTIONS.preSaves),
    ]);

    // Ensure empty track IDs are not indexed as duplicates.
    await releases.updateMany(
      { sourceSpotifyTrackId: '' },
      { $unset: { sourceSpotifyTrackId: '' } },
    );

    await Promise.all([
      admins.createIndex({ username: 1 }, { unique: true }),
      albums.createIndex({ id: 1 }, { unique: true }),
      releases.createIndex({ id: 1 }, { unique: true }),
      preSaves.createIndex({ id: 1 }, { unique: true }),
      releases.createIndex(
        { sourceSpotifyTrackId: 1 },
        {
          unique: true,
          partialFilterExpression: { sourceSpotifyTrackId: { $exists: true } },
        },
      ),
    ]);

    indexesReady = true;
  })();

  try {
    await indexesPromise;
  } catch (error) {
    indexesPromise = null;
    throw error;
  }
};

const normalizeHttpUrl = (value) => {
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
  if (!raw) return '';
  if (raw.startsWith('/') && !raw.startsWith('//')) return raw;
  return normalizeHttpUrl(raw);
};

const normalizeSocialLink = normalizeHttpUrl;

const normalizeSettings = (settings) => {
  const artistName =
    String(settings?.artistName ?? defaultSettings.artistName).trim() ||
    defaultSettings.artistName;
  return {
    artistName,
    hero: {
      mediaType: settings?.hero?.mediaType === 'image' ? 'image' : 'youtube',
      releaseId:
        String(settings?.hero?.releaseId ?? defaultSettings.hero.releaseId).trim() ||
        defaultSettings.hero.releaseId,
    },
    socials: {
      facebook: normalizeSocialLink(settings?.socials?.facebook),
      instagram: normalizeSocialLink(settings?.socials?.instagram),
      youtube: normalizeSocialLink(settings?.socials?.youtube),
      tiktok: normalizeSocialLink(settings?.socials?.tiktok),
    },
  };
};

const normalizeAlbums = (albums, settings) => {
  const artistName = settings?.artistName || defaultSettings.artistName;
  if (!Array.isArray(albums)) return [];

  return albums
    .map((album) => ({
      id: String(album?.id ?? '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-'),
      title: String(album?.title ?? '').trim(),
      artist: String(album?.artist ?? artistName).trim() || artistName,
      year: String(album?.year ?? '').trim(),
    }))
    .filter((album) => album.id && album.title);
};

const normalizeReleases = (releases, albums, settings) => {
  const artistName = settings?.artistName || defaultSettings.artistName;
  if (!Array.isArray(releases)) return [];

  const defaultAlbumId = albums[0]?.id ?? '';
  const prepared = releases
    .map((release) => {
      const normalized = {
        ...release,
        albumId: String(release?.albumId ?? defaultAlbumId).trim() || defaultAlbumId,
        artist: String(release?.artist ?? artistName).trim() || artistName,
        cover: normalizeMediaUrl(release?.cover),
        previewAudio: normalizeMediaUrl(release?.previewAudio),
        youtube: normalizeHttpUrl(release?.youtube),
        platforms: Array.isArray(release?.platforms)
          ? release.platforms
              .map((platform) => ({
                title: String(platform?.title ?? '').trim(),
                icon: normalizeMediaUrl(platform?.icon),
                link: normalizeHttpUrl(platform?.link),
              }))
              .filter((platform) => platform.title && platform.link)
          : [],
      };

      const spotifyTrackId = String(normalized.sourceSpotifyTrackId ?? '').trim();
      if (!spotifyTrackId) {
        delete normalized.sourceSpotifyTrackId;
      } else {
        normalized.sourceSpotifyTrackId = spotifyTrackId;
      }

      return normalized;
    })
    .filter((release) => release.id && release.title && release.albumId);

  return applyAutomaticBadges(prepared);
};

const normalizePreSaves = (preSaves, settings) => {
  const artistName = settings?.artistName || defaultSettings.artistName || 'Fragmentado';
  if (!Array.isArray(preSaves)) return [];

  return preSaves
    .map((preSave) => ({
      id: String(preSave?.id ?? '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-'),
      title: String(preSave?.title ?? '').trim(),
      artist: String(preSave?.artist ?? artistName).trim() || artistName,
      releaseDate: String(preSave?.releaseDate ?? '').trim(),
      description: String(preSave?.description ?? '').trim(),
      cover: normalizeMediaUrl(preSave?.cover),
      background: normalizeMediaUrl(preSave?.background),
      published: Boolean(preSave?.published),
      platforms: Array.isArray(preSave?.platforms)
          ? preSave.platforms
            .map((platform) => ({
              id: String(platform?.id ?? '')
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9-]/g, '-'),
              label: String(platform?.label ?? '').trim(),
              link: normalizeHttpUrl(platform?.link),
              releaseLink: normalizeHttpUrl(platform?.releaseLink),
            }))
            .filter(
              (platform) => platform.id && platform.label && (platform.link || platform.releaseLink),
            )
          : [],
      createdAt: String(preSave?.createdAt ?? '').trim(),
      updatedAt: String(preSave?.updatedAt ?? '').trim(),
    }))
    .filter((preSave) => preSave.id && preSave.title)
    .sort((a, b) => {
      const dateOrder = String(a.releaseDate).localeCompare(String(b.releaseDate));
      if (dateOrder !== 0) return dateOrder;
      return String(b.updatedAt).localeCompare(String(a.updatedAt));
    });
};

const stripMongoId = (doc) => {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return rest;
};

export const getAlbums = async () => {
  await ensureIndexes();
  const [settings, albumsCollection] = await Promise.all([
    getSettings(),
    getMongoCollection(COLLECTIONS.albums),
  ]);

  const albums = await albumsCollection.find({}, { projection: { _id: 0 } }).toArray();
  return normalizeAlbums(albums, settings);
};

export const setAlbums = async (albums) => {
  await ensureIndexes();
  const settings = await getSettings();
  const normalized = normalizeAlbums(albums, settings);

  const albumsCollection = await getMongoCollection(COLLECTIONS.albums);
  await albumsCollection.deleteMany({});
  if (normalized.length) {
    await albumsCollection.insertMany(normalized);
  }

  const releasesCollection = await getMongoCollection(COLLECTIONS.releases);
  const validIds = new Set(normalized.map((album) => album.id));
  const fallbackId = normalized[0]?.id ?? '';

  if (fallbackId) {
    await releasesCollection.updateMany(
      { albumId: { $nin: Array.from(validIds) } },
      { $set: { albumId: fallbackId } },
    );
  }

  return normalized;
};

export const getReleases = async () => {
  await ensureIndexes();
  const [settings, albums, releasesCollection] = await Promise.all([
    getSettings(),
    getAlbums(),
    getMongoCollection(COLLECTIONS.releases),
  ]);

  const releases = await releasesCollection.find({}, { projection: { _id: 0 } }).toArray();
  return normalizeReleases(releases, albums, settings);
};

export const getPublicContent = async () => {
  await ensureIndexes();
  const [settingsCollection, albumsCollection, releasesCollection] = await Promise.all([
    getMongoCollection(COLLECTIONS.settings),
    getMongoCollection(COLLECTIONS.albums),
    getMongoCollection(COLLECTIONS.releases),
  ]);
  const [settingsDocument, albumDocuments, releaseDocuments] = await Promise.all([
    settingsCollection.findOne({ _id: DOC_IDS.settings }),
    albumsCollection.find({}, { projection: { _id: 0 } }).toArray(),
    releasesCollection.find({}, { projection: { _id: 0 } }).toArray(),
  ]);
  const settings = settingsDocument
    ? normalizeSettings(settingsDocument)
    : clone(defaultSettings);
  const albums = normalizeAlbums(albumDocuments, settings);

  return {
    settings,
    albums,
    releases: normalizeReleases(releaseDocuments, albums, settings),
  };
};

export const setReleases = async (releases) => {
  await ensureIndexes();
  const [settings, albums, releasesCollection] = await Promise.all([
    getSettings(),
    getAlbums(),
    getMongoCollection(COLLECTIONS.releases),
  ]);

  const normalized = normalizeReleases(releases, albums, settings);

  await releasesCollection.deleteMany({});
  if (normalized.length) {
    await releasesCollection.insertMany(normalized);
  }

  return normalized;
};

export const getPreSaves = async () => {
  await ensureIndexes();
  const [settings, collection] = await Promise.all([
    getSettings(),
    getMongoCollection(COLLECTIONS.preSaves),
  ]);
  const preSaves = await collection.find({}, { projection: { _id: 0 } }).toArray();
  return normalizePreSaves(preSaves, settings);
};

export const setPreSaves = async (preSaves) => {
  await ensureIndexes();
  const [settings, collection] = await Promise.all([
    getSettings(),
    getMongoCollection(COLLECTIONS.preSaves),
  ]);
  const normalized = normalizePreSaves(preSaves, settings);

  await collection.deleteMany({});
  if (normalized.length) await collection.insertMany(normalized);

  return normalized;
};

export const getAdmin = async () => {
  await ensureIndexes();
  const collection = await getMongoCollection(COLLECTIONS.admins);
  const admin = await collection.findOne({ _id: DOC_IDS.admin });
  return stripMongoId(admin);
};

export const setAdmin = async (admin) => {
  await ensureIndexes();
  const payload = admin && typeof admin === 'object' ? admin : null;
  const collection = await getMongoCollection(COLLECTIONS.admins);

  if (!payload) {
    await collection.deleteOne({ _id: DOC_IDS.admin });
    return null;
  }

  await collection.updateOne(
    { _id: DOC_IDS.admin },
    { $set: { ...payload, _id: DOC_IDS.admin } },
    { upsert: true },
  );

  return stripMongoId(await collection.findOne({ _id: DOC_IDS.admin }));
};

export const getSettings = async () => {
  await ensureIndexes();
  const collection = await getMongoCollection(COLLECTIONS.settings);
  const settings = await collection.findOne({ _id: DOC_IDS.settings });
  if (!settings) return clone(defaultSettings);
  return normalizeSettings(settings);
};

export const setSettings = async (settings) => {
  await ensureIndexes();
  const nextSettings = normalizeSettings(settings);
  const settingsCollection = await getMongoCollection(COLLECTIONS.settings);

  await settingsCollection.updateOne(
    { _id: DOC_IDS.settings },
    { $set: { ...nextSettings, _id: DOC_IDS.settings } },
    { upsert: true },
  );

  const [albumsCollection, releasesCollection, preSavesCollection] = await Promise.all([
    getMongoCollection(COLLECTIONS.albums),
    getMongoCollection(COLLECTIONS.releases),
    getMongoCollection(COLLECTIONS.preSaves),
  ]);

  await Promise.all([
    albumsCollection.updateMany({}, { $set: { artist: nextSettings.artistName } }),
    releasesCollection.updateMany({}, { $set: { artist: nextSettings.artistName } }),
    preSavesCollection.updateMany({}, { $set: { artist: nextSettings.artistName } }),
  ]);

  return nextSettings;
};

export const getStats = async () => {
  await ensureIndexes();
  const collection = await getMongoCollection(COLLECTIONS.stats);
  const statsDoc = await collection.findOne({ _id: DOC_IDS.stats });
  if (!statsDoc || typeof statsDoc.values !== 'object' || !statsDoc.values) return {};
  return statsDoc.values;
};

export const setStats = async (stats) => {
  await ensureIndexes();
  const values = stats && typeof stats === 'object' ? stats : {};
  const collection = await getMongoCollection(COLLECTIONS.stats);

  await collection.updateOne(
    { _id: DOC_IDS.stats },
    { $set: { _id: DOC_IDS.stats, values } },
    { upsert: true },
  );

  return values;
};

export const incrementStat = async (key) => {
  await ensureIndexes();
  const statKey = String(key ?? '').trim();
  if (!statKey) return 0;

  const collection = await getMongoCollection(COLLECTIONS.stats);
  await collection.updateOne(
    { _id: DOC_IDS.stats },
    { $inc: { [`values.${statKey}`]: 1 } },
    { upsert: true },
  );

  const doc = await collection.findOne({ _id: DOC_IDS.stats });
  return Number(doc?.values?.[statKey] ?? 0);
};
