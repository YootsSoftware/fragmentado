import { NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { getSessionUsername } from '../../../../lib/server/admin-auth';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_AUDIO_SIZE = 25 * 1024 * 1024;
const MAX_VIDEO_SIZE = 300 * 1024 * 1024;
const ALLOWED_IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_AUDIO_MIME = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/mp4',
  'audio/x-m4a',
  'audio/ogg',
  'audio/webm',
]);
const ALLOWED_VIDEO_MIME = new Set([
  'video/mp4',
  'video/webm',
]);

const safeExtFromMime = (mime) => {
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'audio/mpeg' || mime === 'audio/mp3') return 'mp3';
  if (mime === 'audio/wav' || mime === 'audio/x-wav') return 'wav';
  if (mime === 'audio/mp4' || mime === 'audio/x-m4a') return 'm4a';
  if (mime === 'audio/ogg') return 'ogg';
  if (mime === 'audio/webm') return 'webm';
  if (mime === 'video/mp4') return 'mp4';
  if (mime === 'video/webm') return 'webm';
  return 'bin';
};

export async function POST(request) {
  const username = getSessionUsername(request);
  if (!username) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'Archivo no valido.' }, { status: 400 });
  }

  const isImage = ALLOWED_IMAGE_MIME.has(file.type);
  const isAudio = ALLOWED_AUDIO_MIME.has(file.type);
  const isVideo = ALLOWED_VIDEO_MIME.has(file.type);
  if (!isImage && !isAudio && !isVideo) {
    return NextResponse.json({ error: 'Formato no permitido.' }, { status: 400 });
  }

  if (isImage && file.size > MAX_IMAGE_SIZE) {
    return NextResponse.json({ error: 'Maximo 5MB por imagen.' }, { status: 400 });
  }

  if (isAudio && file.size > MAX_AUDIO_SIZE) {
    return NextResponse.json({ error: 'Maximo 25MB por audio.' }, { status: 400 });
  }

  if (isVideo && file.size > MAX_VIDEO_SIZE) {
    return NextResponse.json({ error: 'Maximo 300MB por video.' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = safeExtFromMime(file.type);
  const filename = `${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const uploadsDir = path.join(
    process.cwd(),
    'public',
    'uploads',
    isVideo ? 'video' : isAudio ? 'audio' : 'images',
  );
  await fs.mkdir(uploadsDir, { recursive: true });

  const targetPath = path.join(uploadsDir, filename);
  await fs.writeFile(targetPath, buffer);

  return NextResponse.json({
    ok: true,
    url: `/uploads/${isVideo ? 'video' : isAudio ? 'audio' : 'images'}/${filename}`,
  });
}
