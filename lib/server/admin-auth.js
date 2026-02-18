import crypto from 'node:crypto';

const COOKIE_NAME = 'fg_admin_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const SECRET = process.env.FG_ADMIN_SECRET || 'fragmentado-dev-secret-change-me';

const base64UrlEncode = (input) => Buffer.from(input).toString('base64url');
const base64UrlDecode = (input) => Buffer.from(input, 'base64url').toString('utf8');

const sign = (value) =>
  crypto.createHmac('sha256', SECRET).update(value).digest('base64url');

export const hashPassword = (password, salt = crypto.randomBytes(16).toString('hex')) => {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
};

export const verifyPassword = (password, salt, expectedHash) => {
  const computed = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(expectedHash));
};

export const createSessionToken = (username) => {
  const payload = {
    u: username,
    exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
};

export const readSessionToken = (token) => {
  if (!token || !token.includes('.')) return null;

  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return null;

  const expectedSignature = sign(encodedPayload);
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (sigBuffer.length !== expectedBuffer.length) return null;
  if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    if (!payload?.u || !payload?.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
};

export const getSessionUsername = (request) => {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const payload = readSessionToken(token);
  return payload?.u ?? null;
};

export const setSessionCookie = (response, username) => {
  response.cookies.set({
    name: COOKIE_NAME,
    value: createSessionToken(username),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
};

export const clearSessionCookie = (response) => {
  response.cookies.set({
    name: COOKIE_NAME,
    value: '',
    path: '/',
    expires: new Date(0),
  });
};
