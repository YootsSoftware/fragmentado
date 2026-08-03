import { GridFSBucket } from 'mongodb';
import { getMongoDb } from './mongo-client';

const BUCKET_NAME = 'fg_images';

let bucketPromise = null;

const getImageBucket = () => {
  if (!bucketPromise) {
    bucketPromise = getMongoDb().then(
      (db) => new GridFSBucket(db, { bucketName: BUCKET_NAME }),
    );
  }
  return bucketPromise;
};

export const storeImage = async ({ filename, buffer, contentType, uploadedBy }) => {
  const bucket = await getImageBucket();

  await new Promise((resolve, reject) => {
    const stream = bucket.openUploadStream(filename, {
      metadata: {
        contentType,
        uploadedBy,
        createdAt: new Date(),
      },
    });
    stream.once('error', reject);
    stream.once('finish', resolve);
    stream.end(buffer);
  });
};

export const findStoredImage = async (filename) => {
  const bucket = await getImageBucket();
  return bucket
    .find({ filename })
    .sort({ uploadDate: -1 })
    .limit(1)
    .next();
};

export const openStoredImage = async (id, options) => {
  const bucket = await getImageBucket();
  return bucket.openDownloadStream(id, options);
};
