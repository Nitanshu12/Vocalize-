import { env } from '../config/env.js'
import {
  createUser,
  findUserByEmail,
  findUserById,
  verifyPassword,
  storeRefreshToken,
  findRefreshTokenByToken,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
} from '../services/auth.service.js'
import { signAccessToken, generateRefreshToken } from '../services/token.service.js'

const REFRESH_COOKIE = 'refreshToken'
const REFRESH_COOKIE_PATH = '/api/v1/auth'

function cookieOptions() {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: 'lax',
    path: REFRESH_COOKIE_PATH,
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  }
}

function requestMeta(req) {
  return { userAgent: req.headers['user-agent'], ip: req.ip }
}

async function issueSession(res, user, req) {
  const accessToken = signAccessToken(user)
  const refresh = generateRefreshToken()
  await storeRefreshToken(user.id, refresh, requestMeta(req))
  res.cookie(REFRESH_COOKIE, refresh.token, cookieOptions())
  return accessToken
}

export async function register(req, res, next) {
  try {
    const existing = await findUserByEmail(req.body.email)
    if (existing) {
      return res.status(409).json({ error: 'Conflict', message: 'Email already registered' })
    }
    const user = await createUser(req.body)
    const accessToken = await issueSession(res, user, req)
    res.status(201).json({ user, accessToken })
  } catch (err) {
    next(err)
  }
}

export async function login(req, res, next) {
  try {
    const user = await findUserByEmail(req.body.email)
    if (!user || !(await verifyPassword(user, req.body.password))) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid email or password' })
    }
    const accessToken = await issueSession(res, user, req)
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        onboarding_completed_at: user.onboarding_completed_at,
      },
      accessToken,
    })
  } catch (err) {
    next(err)
  }
}

export async function refresh(req, res, next) {
  try {
    const incoming = req.cookies[REFRESH_COOKIE]
    if (!incoming) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Missing refresh token' })
    }

    const tokenRow = await findRefreshTokenByToken(incoming)
    if (!tokenRow) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid refresh token' })
    }

    if (tokenRow.revoked_at) {
      // This token was already rotated out — someone is replaying an old
      // token. Treat it as theft: kill every session for this user.
      await revokeAllUserTokens(tokenRow.user_id)
      res.clearCookie(REFRESH_COOKIE, { path: REFRESH_COOKIE_PATH })
      return res.status(401).json({ error: 'Unauthorized', message: 'Session revoked — please log in again' })
    }

    if (new Date(tokenRow.expires_at) < new Date()) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Refresh token expired' })
    }

    const user = await findUserById(tokenRow.user_id)
    const nextRefresh = await rotateRefreshToken(tokenRow, requestMeta(req))
    const accessToken = signAccessToken(user)

    res.cookie(REFRESH_COOKIE, nextRefresh.token, cookieOptions())
    res.json({ accessToken })
  } catch (err) {
    next(err)
  }
}

export async function logout(req, res, next) {
  try {
    const incoming = req.cookies[REFRESH_COOKIE]
    if (incoming) {
      await revokeRefreshToken(incoming)
    }
    res.clearCookie(REFRESH_COOKIE, { path: REFRESH_COOKIE_PATH })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

export async function me(req, res, next) {
  try {
    const user = await findUserById(req.user.id)
    if (!user) {
      return res.status(404).json({ error: 'NotFound', message: 'User no longer exists' })
    }
    res.json({ user })
  } catch (err) {
    next(err)
  }
}
