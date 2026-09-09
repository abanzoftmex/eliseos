/**
 * API Proxy for Science Chago transactions
 * This avoids CORS issues by making server-to-server requests
 */

const BASE_URL = process.env.NEXT_PUBLIC_SCIENCE_CHAGO_URL || 'https://admin.scienceinmotion.com.mx';
const API_KEY = process.env.NEXT_PUBLIC_SCIENCE_CHAGO_API_KEY || 'science-chago-api-integration-key-2026';

export default async function handler(req, res) {
  const { method } = req;

  // Set CORS headers for local development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (method === 'POST') {
      const { action, ...payload } = req.body;

      if (action === 'gasto') {
        // Create gasto
        const response = await fetch(`${BASE_URL}/api/integration/sync/transacciones/gasto`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();
        return res.status(response.status).json(data);

      } else if (action === 'ingreso') {
        // Create ingreso
        const response = await fetch(`${BASE_URL}/api/integration/sync/transacciones/ingreso`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();
        return res.status(response.status).json(data);
      }

      return res.status(400).json({ success: false, error: 'Invalid action' });

    } else if (method === 'DELETE') {
      const { externalId, reason } = req.query;

      if (!externalId) {
        return res.status(400).json({ success: false, error: 'externalId is required' });
      }

      const url = new URL(`${BASE_URL}/api/integration/sync/transacciones/${encodeURIComponent(externalId)}`);
      if (reason) {
        url.searchParams.append('reason', reason);
      }

      const response = await fetch(url.toString(), {
        method: 'DELETE',
        headers: {
          'x-api-key': API_KEY
        }
      });

      const data = await response.json();
      return res.status(response.status).json(data);

    } else {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error proxying to Science Chago:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message,
      skipped: true 
    });
  }
}
