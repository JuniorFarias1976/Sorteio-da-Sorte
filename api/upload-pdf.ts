// Vercel Serverless Function for /api/upload-pdf
export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const { fileData, fileName } = req.body || {};
    if (!fileData) {
      return res.status(400).json({ error: 'Nenhum ficheiro fornecido' });
    }

    return res.status(200).json({
      success: true,
      url: fileData, // In serverless environments without persistent disk, return data URL directly
      fileName: fileName || 'regulamento.pdf',
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
