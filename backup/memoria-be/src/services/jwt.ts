import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';
import type { VerifyOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export interface AccessTokenPayload {
  sub: string;
  email: string;
}

export interface RefreshTokenPayload {
  sub: string;
  email: string;
}

function getAccessSecret(): Secret {
  if (env.JWT_ACCESS_TOKEN_SECRET) return env.JWT_ACCESS_TOKEN_SECRET;
  if (env.JWT_SECRET) return env.JWT_SECRET;
  throw new Error('JWT access secret not configured');
}

function getRefreshSecret(): Secret {
  if (!env.JWT_REFRESH_TOKEN_SECRET) {
    throw new Error('JWT refresh secret not configured');
  }
  return env.JWT_REFRESH_TOKEN_SECRET;
}

function accessSignOptions(): SignOptions {
  if (env.jwtPairMode) {
    const opts: SignOptions = {
      expiresIn: `${env.JWT_ACCESS_TOKEN_EXPIRES_IN_MINUTES}m`,
    };
    if (env.JWT_ACCESS_TOKEN_ISSUER) opts.issuer = env.JWT_ACCESS_TOKEN_ISSUER;
    return opts;
  }
  return {
    expiresIn: env.JWT_EXPIRES_IN ?? '7d',
  } as SignOptions;
}

function accessVerifyOptions(): VerifyOptions {
  const opts: VerifyOptions = {};
  if (env.jwtPairMode && env.JWT_ACCESS_TOKEN_ISSUER) {
    opts.issuer = env.JWT_ACCESS_TOKEN_ISSUER;
  }
  return opts;
}

export function signAccessToken(user: { id: string; email: string }): string {
  const secret = getAccessSecret();
  const opts = accessSignOptions();
  return jwt.sign({ sub: user.id, email: user.email }, secret, opts);
}

export function signRefreshToken(user: { id: string; email: string }): string {
  const opts: SignOptions = {
    expiresIn: `${env.JWT_REFRESH_TOKEN_EXPIRES_IN_HRS}h`,
  };
  if (env.JWT_REFRESH_TOKEN_ISSUER) opts.issuer = env.JWT_REFRESH_TOKEN_ISSUER;
  return jwt.sign({ sub: user.id, email: user.email, typ: 'refresh' }, getRefreshSecret(), opts);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, getAccessSecret(), accessVerifyOptions()) as jwt.JwtPayload & {
    email?: string;
  };
  const sub = decoded.sub;
  const email = decoded.email;
  if (typeof sub !== 'string' || typeof email !== 'string') {
    throw new Error('Invalid token payload');
  }
  return { sub, email };
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const verifyOpts: VerifyOptions = {};
  if (env.JWT_REFRESH_TOKEN_ISSUER) {
    verifyOpts.issuer = env.JWT_REFRESH_TOKEN_ISSUER;
  }
  const decoded = jwt.verify(token, getRefreshSecret(), verifyOpts) as jwt.JwtPayload & {
    email?: string;
    typ?: string;
  };
  if (decoded.typ !== 'refresh') {
    throw new Error('Not a refresh token');
  }
  const sub = decoded.sub;
  const email = decoded.email;
  if (typeof sub !== 'string' || typeof email !== 'string') {
    throw new Error('Invalid refresh token payload');
  }
  return { sub, email };
}
