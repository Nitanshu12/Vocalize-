import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export function signAccessToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL,
  })
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET)
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function generateRefreshToken() {
  const token = crypto.randomBytes(48).toString('hex')
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000)
  return { token, tokenHash, expiresAt }
}
