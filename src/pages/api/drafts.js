// DEPRECATED: Draft functionality has been removed
// This API now always returns empty draft objects for backward compatibility
// All consultations are now editable after completion, making drafts unnecessary

export default async function handler(req, res) {
  // Solo permitir métodos GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Always return empty drafts - draft functionality has been removed
  res.status(200).json({
    success: true,
    data: {
      normalDrafts: {},
      atletaDrafts: {}
    }
  });
}