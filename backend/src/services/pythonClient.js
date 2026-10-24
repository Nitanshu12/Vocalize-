import { env } from '../config/env.js'

/*
 * The one place Node talks to the Python interview-service.
 *
 * Previously this error-normalising logic lived inside interview.service.js.
 * Now that profiles call the same service, it lives here so there is a single
 * definition of "how we treat upstream failures" — if that policy ever changes
 * (retries, tracing, a circuit breaker), it changes in exactly one file.
 *
 * ERROR POLICY, and why it matters:
 *   400 / 404  pass through — these describe something the CLIENT got wrong
 *              (bad interview id, unreadable resume), and the message is safe
 *              and useful to show the user.
 *   everything else becomes 502 — a Python crash or an upstream model outage is
 *              OUR problem, not the caller's. Collapsing it to "bad gateway"
 *              stops internal stack traces leaking through the API.
 */

function internalHeaders() {
  return env.INTERNAL_API_KEY ? { 'X-Internal-Key': env.INTERNAL_API_KEY } : {}
}

async function normaliseFailure(res) {
  let detail = ''
  try {
    detail = (await res.json())?.detail ?? ''
  } catch {
    // non-JSON error body — ignore and fall back to a generic message
  }
  const err = new Error(detail || `Interview service error (${res.status})`)
  err.status = res.status === 400 || res.status === 404 ? res.status : 502
  return err
}

function unavailable() {
  const err = new Error('Interview service is unavailable')
  err.status = 502
  return err
}

/** JSON request/response against the Python service. */
export async function callPythonService(path, { method = 'GET', body } = {}) {
  let res
  try {
    res = await fetch(`${env.INTERVIEW_SERVICE_URL}${path}`, {
      method,
      headers: { 'content-type': 'application/json', ...internalHeaders() },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw unavailable()
  }
  if (!res.ok) throw await normaliseFailure(res)
  return res.json()
}

/**
 * Forward an uploaded file to the Python service as multipart/form-data.
 *
 * The browser's file never touches disk: multer holds it in memory, we wrap the
 * buffer in a Blob and stream it onward. Note we do NOT set a content-type
 * header — fetch must generate it itself so it can include the multipart
 * boundary. Setting it by hand is the classic way to break file uploads.
 */
export async function uploadToPythonService(path, { buffer, filename, mimetype }) {
  const form = new FormData()
  form.append('file', new Blob([buffer], { type: mimetype || 'application/octet-stream' }), filename)

  let res
  try {
    res = await fetch(`${env.INTERVIEW_SERVICE_URL}${path}`, {
      method: 'POST',
      headers: internalHeaders(),
      body: form,
    })
  } catch {
    throw unavailable()
  }
  if (!res.ok) throw await normaliseFailure(res)
  return res.json()
}
