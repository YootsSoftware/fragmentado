import path from 'node:path';

export const UPLOAD_GROUPS = new Set(['images', 'audio', 'video']);

const CONTENT_TYPES = new Map([
  ['jpg', 'image/jpeg'],
  ['jpeg', 'image/jpeg'],
  ['png', 'image/png'],
  ['webp', 'image/webp'],
  ['mp3', 'audio/mpeg'],
  ['wav', 'audio/wav'],
  ['m4a', 'audio/mp4'],
  ['ogg', 'audio/ogg'],
  ['mp4', 'video/mp4'],
  ['webm', 'video/webm'],
]);

export const getUploadsRoot = () => {
  const configuredRoot = String(process.env.FG_UPLOADS_DIR || '').trim();
  if (configuredRoot) return path.resolve(configuredRoot);

  const railwayVolume = String(process.env.RAILWAY_VOLUME_MOUNT_PATH || '').trim();
  if (railwayVolume) return path.resolve(railwayVolume);

  return path.join(process.cwd(), 'public', 'uploads');
};

export const getUploadContentType = (filename) => {
  const extension = path.extname(filename).slice(1).toLowerCase();
  return CONTENT_TYPES.get(extension) || null;
};

export const resolveUploadPath = (group, filename) => {
  if (!UPLOAD_GROUPS.has(group)) return null;
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(filename)) return null;
  if (!getUploadContentType(filename)) return null;

  const root = getUploadsRoot();
  const target = path.resolve(root, group, filename);
  if (!target.startsWith(`${root}${path.sep}`)) return null;

  return target;
};
