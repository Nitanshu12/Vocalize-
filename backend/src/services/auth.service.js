import bcrypt from 'bcryptjs'
import { pool } from '../../../Database/postgres.js'
import { generateRefreshToken, hashToken } from './token.service.js'

const SALT_ROUNDS = 12

export async function createUser({ email, password, name }) {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
  const { rows } = await pool.query(
    `insert into users (email, password_hash, name)
     values ($1, $2, $3)
     returning id, email, name, created_at, onboarding_completed_at`,
    [email.toLowerCase(), passwordHash, name ?? null]
  )
  return rows[0]
}

export async function findUserByEmail(email) {
  const { rows } = await pool.query('select * from users where email = $1', [email.toLowerCase()])
  return rows[0] ?? null
}

export async function findUserById(id) {
  const { rows } = await pool.query(
    'select id, email, name, created_at, onboarding_completed_at from users where id = $1',
    [id]
  )
  return rows[0] ?? null
}

export async function verifyPassword(user, password) {
  return bcrypt.compare(password, user.password_hash)
}

export async function storeRefreshToken(userId, { tokenHash, expiresAt }, meta = {}) {
  const { rows } = await pool.query(
    `insert into refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address)
     values ($1, $2, $3, $4, $5)
     returning id`,
    [userId, tokenHash, expiresAt, meta.userAgent ?? null, meta.ip ?? null]
  )
  return rows[0].id
}

export async function findRefreshTokenByToken(token) {
  const tokenHash = hashToken(token)
  const { rows } = await pool.query('select * from refresh_tokens where token_hash = $1', [tokenHash])
  return rows[0] ?? null
}

// Rotation: every use of a refresh token retires it and issues a new one.
// If a retired token is ever presented again, it means it was stolen and
// replayed — the caller should treat that as a signal to kill the session.
export async function rotateRefreshToken(oldTokenRow, meta = {}) {
  const next = generateRefreshToken()
  const newId = await storeRefreshToken(oldTokenRow.user_id, next, meta)
  await pool.query('update refresh_tokens set revoked_at = now(), replaced_by_id = $1 where id = $2', [
    newId,
    oldTokenRow.id,
  ])
  return next
}

export async function revokeRefreshToken(token) {
  const tokenHash = hashToken(token)
  await pool.query('update refresh_tokens set revoked_at = now() where token_hash = $1 and revoked_at is null', [
    tokenHash,
  ])
}

export async function revokeAllUserTokens(userId) {
  await pool.query('update refresh_tokens set revoked_at = now() where user_id = $1 and revoked_at is null', [
    userId,
  ])
}
