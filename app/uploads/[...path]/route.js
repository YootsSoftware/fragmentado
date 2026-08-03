import { createReadStream, promises as fs } from 'node:fs';
import { Readable } from 'node:stream';
import {
  findStoredImage,
  openStoredImage,
} from '../../../lib/server/image-storage';
import {
  getUploadContentType,
  resolveUploadPath,
} from '../../../lib/server/uploads';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const notFound = () => new Response('Archivo no encontrado.', { status: 404 });

const getRequestedRange = (rangeHeader, fileSize) => {
  if (!rangeHeader) return null;

  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
  if (!match) return false;

  let start;
  let end;

  if (!match[1]) {
    const suffixLength = Number(match[2]);
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) return false;
    start = Math.max(fileSize - suffixLength, 0);
    end = fileSize - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Number(match[2]) : fileSize - 1;
  }

  if (
    !Number.isSafeInteger(start)
    || !Number.isSafeInteger(end)
    || start < 0
    || end < start
    || start >= fileSize
  ) {
    return false;
  }

  return { start, end: Math.min(end, fileSize - 1) };
};

const createUploadResponse = async ({
  request,
  includeBody,
  fileSize,
  contentType,
  createStream,
}) => {
  const range = getRequestedRange(request.headers.get('range'), fileSize);
  if (range === false) {
    return new Response(null, {
      status: 416,
      headers: { 'Content-Range': `bytes */${fileSize}` },
    });
  }

  const headers = new Headers({
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Content-Type': contentType,
  });

  if (range) {
    const contentLength = range.end - range.start + 1;
    headers.set('Content-Length', String(contentLength));
    headers.set('Content-Range', `bytes ${range.start}-${range.end}/${fileSize}`);
    const stream = includeBody ? await createStream(range) : null;
    return new Response(stream, { status: 206, headers });
  }

  headers.set('Content-Length', String(fileSize));
  const stream = includeBody ? await createStream(null) : null;
  return new Response(stream, { status: 200, headers });
};

const getLocalUpload = async ({ request, includeBody, targetPath, contentType }) => {
  let stat;
  try {
    stat = await fs.lstat(targetPath);
  } catch {
    return null;
  }
  if (!stat.isFile()) return null;

  return createUploadResponse({
    request,
    includeBody,
    fileSize: stat.size,
    contentType,
    createStream: (range) => Readable.toWeb(createReadStream(targetPath, range || undefined)),
  });
};

const getDatabaseImage = async ({ request, includeBody, filename, contentType }) => {
  const file = await findStoredImage(filename);
  if (!file) return null;

  return createUploadResponse({
    request,
    includeBody,
    fileSize: Number(file.length),
    contentType: String(file.metadata?.contentType || contentType),
    createStream: async (range) => Readable.toWeb(await openStoredImage(
      file._id,
      range ? { start: range.start, end: range.end + 1 } : undefined,
    )),
  });
};

const getUpload = async (request, context, includeBody) => {
  const params = await context.params;
  const segments = Array.isArray(params.path) ? params.path : [];
  if (segments.length !== 2) return notFound();

  const [group, filename] = segments;
  const targetPath = resolveUploadPath(group, filename);
  const contentType = getUploadContentType(filename);
  if (!targetPath || !contentType) return notFound();

  const localResponse = await getLocalUpload({
    request,
    includeBody,
    targetPath,
    contentType,
  });
  if (localResponse) return localResponse;

  if (group === 'images') {
    const databaseResponse = await getDatabaseImage({
      request,
      includeBody,
      filename,
      contentType,
    });
    if (databaseResponse) return databaseResponse;
  }

  return notFound();
};

export const GET = (request, context) => getUpload(request, context, true);
export const HEAD = (request, context) => getUpload(request, context, false);
