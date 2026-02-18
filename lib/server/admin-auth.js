import crypto from 'node:crypto';

const COOKIE_NAME = 'fg_admin_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const SECRET = process.env.FG_ADMIN_SECRET || 'fragmentado-dev-secret-change-me';
const COOKIE_SECURE_ENV = String(process.env.FG_ADMIN_COOKIE_SECURE ?? '').trim().toLowerCase();
const COOKIE_DOMAIN = String(process.env.FG_ADMIN_COOKIE_DOMAIN ?? '').trim().toLowerCase();

const resolveCookieSecure = () => {
  if (COOKIE_SECURE_ENV === 'true' || COOKIE_SECURE_ENV === '1') return true;
  if (COOKIE_SECURE_ENV === 'false' || COOKIE_SECURE_ENV === '0') return false;
  return process.env.NODE_ENV === 'production';
};

const base64UrlEncode = (input) => Buffer.from(input).toString('base64url');
const base64UrlDecode = (input) => Buffer.from(input, 'base64url').toString('utf8');

const sign = (value) =>
  crypto.createHmac('sha256', SECRET).update(value).digest('base64url');

export const hashPassword = (password, salt = crypto.randomBytes(16).toString('hex')) => {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
};

export const verifyPassword = (password, salt, expectedHash) => {
  const rawSalt = String(salt ?? '');
  const rawExpectedHash = String(expectedHash ?? '');
  if (!rawSalt || !rawExpectedHash) return false;

  try {
    const computed = crypto.scryptSync(password, rawSalt, 64).toString('hex');
    const computedBuffer = Buffer.from(computed, 'utf8');
    const expectedBuffer = Buffer.from(rawExpectedHash, 'utf8');
    if (computedBuffer.length !== expectedBuffer.length) return false;
    return crypto.timingSafeEqual(computedBuffer, expectedBuffer);
  } catch {
    return false;
  }
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
  const cookieOptions = {
    name: COOKIE_NAME,
    value: createSessionToken(username),
    httpOnly: true,
    sameSite: 'lax',
    secure: resolveCookieSecure(),
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
  if (COOKIE_DOMAIN) {
    cookieOptions.domain = COOKIE_DOMAIN;
  }
  response.cookies.set(cookieOptions);
};

export const clearSessionCookie = (response) => {
  const cookieOptions = {
    name: COOKIE_NAME,
    value: '',
    path: '/',
    expires: new Date(0),
  };
  if (COOKIE_DOMAIN) {
    cookieOptions.domain = COOKIE_DOMAIN;
  }
  response.cookies.set(cookieOptions);
};
