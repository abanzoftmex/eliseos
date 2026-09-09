import { getNotasClinicas } from '../../../../../lib/firebase/notasClinicasService';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const result = await getNotasClinicas(id);
      
      if (result.success) {
        return res.status(200).json({
          success: true,
          notas: result.notas
        });
      } else {
        return res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error in API:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al obtener notas clínicas'
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
