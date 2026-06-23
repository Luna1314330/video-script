import 'server-only'

import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'

const SALT_ROUNDS = 10

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET?.trim()
  if (!secret) {
    throw new Error('JWT_SECRET is not set')
  }
  return new TextEncoder().encode(secret)
}

export function isJwtConfigured(): boolean {
  return Boolean(process.env.JWT_SECRET?.trim())
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!hash) return false
  return bcrypt.compare(password, hash)
}

export async function signAccessToken(input: {
  userId: string
  phone: string
}): Promise<string> {
  const expiresIn = process.env.JWT_EXPIRES_IN?.trim() || '7d'

  return new SignJWT({ phone: input.phone })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(input.userId)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getJwtSecret())
}

export async function verifyAccessToken(
  token: string,
): Promise<{ userId: string; phone: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret())
    if (!payload.sub) return null
    return {
      userId: payload.sub,
      phone: typeof payload.phone === 'string' ? payload.phone : '',
    }
  } catch {
    return null
  }
}
