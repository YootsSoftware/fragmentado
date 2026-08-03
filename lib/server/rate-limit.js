import crypto from 'node:crypto';
import { getMongoCollection } from './mongo-client';

let indexReady = false;

const getClientAddress = (request) => {
  const forwarded = String(request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim();
  return forwarded || String(request.headers.get('x-real-ip') ?? '').trim() || 'unknown';
};

export const checkRateLimit = async (request, { scope, limit, windowMs }) => {
  const collection = await getMongoCollection('rate_limits');
  if (!indexReady) {
    await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    indexReady = true;
  }

  const now = Date.now();
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const fingerprint = crypto
    .createHash('sha256')
    .update(`${scope}:${getClientAddress(request)}`)
    .digest('hex');
  const id = `${fingerprint}:${windowStart}`;

  await collection.updateOne(
    { _id: id },
    {
      $inc: { count: 1 },
      $setOnInsert: {
        scope,
        createdAt: new Date(now),
        expiresAt: new Date(windowStart + windowMs * 2),
      },
    },
    { upsert: true },
  );

  const entry = await collection.findOne({ _id: id }, { projection: { count: 1 } });
  return {
    allowed: Number(entry?.count ?? 0) <= limit,
    retryAfter: Math.max(1, Math.ceil((windowStart + windowMs - now) / 1000)),
  };
};
