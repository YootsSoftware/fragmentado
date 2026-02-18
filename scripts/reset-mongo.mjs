import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const uri = String(process.env.MONGODB_URI ?? '').trim();
const dbName = String(process.env.MONGODB_DB_NAME ?? 'fragmentado').trim() || 'fragmentado';

if (!uri) {
  console.error('Falta MONGODB_URI en variables de entorno.');
  process.exit(1);
}

let MongoClient;
try {
  ({ MongoClient } = await import('mongodb'));
} catch {
  console.error('Falta dependencia "mongodb". Ejecuta: npm install mongodb');
  process.exit(1);
}

const client = new MongoClient(uri, { maxPoolSize: 5, serverSelectionTimeoutMS: 10000 });
const collections = ['admins', 'settings', 'albums', 'releases', 'stats', 'app_content'];

try {
  await client.connect();
  const db = client.db(dbName);

  for (const name of collections) {
    await db.collection(name).deleteMany({});
  }

  console.log(`Base limpiada en ${dbName}. Colecciones vaciadas: ${collections.join(', ')}`);
} finally {
  await client.close();
}
