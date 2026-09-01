import crypto from 'node:crypto';

function safeEqual(received, expected) {
  if (!received || !expected) return false;
  const left = Buffer.from(String(received));
  const right = Buffer.from(String(expected));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export function hasBearerSecret(authorization, expected) {
  if (!authorization?.startsWith('Bearer ')) return false;
  return safeEqual(authorization.slice(7), expected);
}

export function hasHeaderSecret(received, expected) {
  return safeEqual(received, expected);
}
