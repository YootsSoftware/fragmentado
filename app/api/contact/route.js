import { NextResponse } from 'next/server';
import { getMongoCollection } from '../../../lib/server/mongo-client';
import { checkRateLimit } from '../../../lib/server/rate-limit';

const MAX_LENGTHS = {
  name: 100,
  organization: 140,
  email: 180,
  phone: 40,
  location: 180,
  eventDate: 30,
  eventType: 80,
  duration: 80,
  requiresAudio: 20,
  message: 2400,
};

const cleanField = (value, maxLength) =>
  String(value ?? '')
    .trim()
    .slice(0, maxLength);

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export async function POST(request) {
  const rateLimit = await checkRateLimit(request, {
    scope: 'contact',
    limit: 5,
    windowMs: 10 * 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Has enviado varias solicitudes. Intenta nuevamente más tarde.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } },
    );
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Solicitud no válida.' }, { status: 400 });
  }

  if (String(body.website ?? '').trim()) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const inquiry = Object.fromEntries(
    Object.entries(MAX_LENGTHS).map(([key, maxLength]) => [
      key,
      cleanField(body[key], maxLength),
    ]),
  );

  if (!inquiry.name || !inquiry.email || !inquiry.eventType || !inquiry.message) {
    return NextResponse.json(
      { error: 'Nombre, correo, tipo de evento y mensaje son obligatorios.' },
      { status: 400 },
    );
  }

  if (!isValidEmail(inquiry.email)) {
    return NextResponse.json({ error: 'El correo no es válido.' }, { status: 400 });
  }

  try {
    const collection = await getMongoCollection('contact_requests');
    await collection.createIndex({ createdAt: -1 });
    await collection.insertOne({
      ...inquiry,
      status: 'new',
      createdAt: new Date(),
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'No pudimos registrar la solicitud. Intenta nuevamente.' },
      { status: 503 },
    );
  }
}
