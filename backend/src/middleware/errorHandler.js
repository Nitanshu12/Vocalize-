export function errorHandler(err, req, res, next) {
  console.error(err)
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Conflict', message: 'Email already registered' })
  }
  res.status(err.status ?? 500).json({
    error: err.name ?? 'InternalError',
    message: err.message ?? 'Something went wrong',
  })
}
