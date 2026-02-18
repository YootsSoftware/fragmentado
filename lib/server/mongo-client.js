const getMongoPackage = async () => {
  try {
    return await import('mongodb');
  } catch {
    throw new Error('Falta la dependencia "mongodb". Ejecuta: npm install mongodb');
  }
};

const uri = String(process.env.MONGODB_URI ?? '').trim();
const dbName = String(process.env.MONGODB_DB_NAME ?? 'fragmentado').trim() || 'fragmentado';

let cachedClient = null;
let cachedDb = null;

export const isMongoConfigured = () => Boolean(uri);

export const getMongoDb = async () => {
  if (!uri) {
    throw new Error('MONGODB_URI no esta configurado.');
  }
  if (cachedDb) return cachedDb;

  const { MongoClient } = await getMongoPackage();
  if (!cachedClient) {
    cachedClient = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
    });
    await cachedClient.connect();
  }

  cachedDb = cachedClient.db(dbName);
  return cachedDb;
};

export const getMongoCollection = async (name) => {
  const db = await getMongoDb();
  return db.collection(name);
};
