import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import { getSessionUsername } from '../../../../lib/server/admin-auth';
import { getMongoCollection } from '../../../../lib/server/mongo-client';

const ALLOWED_STATUSES = new Set(['new', 'contacted', 'closed']);

const serializeInquiry = (inquiry) => ({
  id: String(inquiry._id),
  name: String(inquiry.name ?? ''),
  organization: String(inquiry.organization ?? ''),
  email: String(inquiry.email ?? ''),
  phone: String(inquiry.phone ?? ''),
  location: String(inquiry.location ?? ''),
  eventDate: String(inquiry.eventDate ?? ''),
  eventType: String(inquiry.eventType ?? ''),
  duration: String(inquiry.duration ?? ''),
  requiresAudio: String(inquiry.requiresAudio ?? ''),
  message: String(inquiry.message ?? ''),
  status: ALLOWED_STATUSES.has(inquiry.status) ? inquiry.status : 'new',
  createdAt:
    inquiry.createdAt instanceof Date
      ? inquiry.createdAt.toISOString()
      : String(inquiry.createdAt ?? ''),
  updatedAt:
    inquiry.updatedAt instanceof Date
      ? inquiry.updatedAt.toISOString()
      : String(inquiry.updatedAt ?? ''),
});

const ensureAuth = (request) => getSessionUsername(request);

export async function GET(request) {
  if (!ensureAuth(request)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  try {
    const collection = await getMongoCollection('contact_requests');
    await collection.createIndex({ status: 1, createdAt: -1 });
    const inquiries = await collection.find({}).sort({ createdAt: -1 }).limit(250).toArray();
    return NextResponse.json({ inquiries: inquiries.map(serializeInquiry) });
  } catch {
    return NextResponse.json(
      { error: 'No se pudieron cargar las solicitudes.' },
      { status: 503 },
    );
  }
}

export async function PATCH(request) {
  if (!ensureAuth(request)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const id = String(body?.id ?? '').trim();
  const status = String(body?.status ?? '').trim();
  if (!ObjectId.isValid(id) || !ALLOWED_STATUSES.has(status)) {
    return NextResponse.json({ error: 'Solicitud o estado no válido.' }, { status: 400 });
  }

  try {
    const collection = await getMongoCollection('contact_requests');
    const _id = new ObjectId(id);
    const result = await collection.updateOne(
      { _id },
      { $set: { status, updatedAt: new Date() } },
    );
    if (!result.matchedCount) {
      return NextResponse.json({ error: 'La solicitud no existe.' }, { status: 404 });
    }
    const inquiry = await collection.findOne({ _id });
    return NextResponse.json({ inquiry: serializeInquiry(inquiry) });
  } catch {
    return NextResponse.json(
      { error: 'No se pudo actualizar la solicitud.' },
      { status: 503 },
    );
  }
}
