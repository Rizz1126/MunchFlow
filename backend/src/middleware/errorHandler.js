/**
 * Global error handler middleware
 */
export function errorHandler(err, req, res, next) {
  console.error('❌ Error:', err.message);
  console.error(err.stack);

  if (err.code === 'SQLITE_CONSTRAINT' || err.code === '23505') {
    return res.status(409).json({ error: 'Data duplikat atau constraint gagal: ' + err.message });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Terjadi kesalahan pada server.',
  });
}
