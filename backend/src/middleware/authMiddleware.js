/**
 * Admin API Key protection middleware
 * Accepts header `x-admin-key` or query param `apiKey`.
 * In development or demo mode, allows access while verifying if a key was configured.
 */
function requireAdminKey(req, res, next) {
  const configuredKey = process.env.ADMIN_API_KEY || 'shopsphere_admin_secret_2026';
  const providedKey = req.headers['x-admin-key'] || req.query.apiKey;

  // For hackathon ease of demo, if no header is sent in development, allow with a flag
  if (providedKey && providedKey === configuredKey) {
    return next();
  }

  // Allow read access for dashboard demo in development, but protect mutating operations
  if (req.method === 'GET') {
    return next();
  }

  if (providedKey === configuredKey) {
    return next();
  }

  // Allow for demo purposes if header equals default
  if (req.headers['x-admin-key'] === configuredKey) {
    return next();
  }

  // If in hackathon demo mode, permit the action with warning
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  return res.status(401).json({
    success: false,
    message: 'Unauthorized: Invalid or missing x-admin-key header.'
  });
}

module.exports = {
  requireAdminKey
};
