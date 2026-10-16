// Vercel Serverless Function for /api/data
export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Return standard response or process updates
  if (req.method === 'POST') {
    return res.status(200).json({
      success: true,
      data: req.body,
      savedAt: new Date().toISOString(),
    });
  }

  return res.status(200).json({
    status: 'connected',
    message: 'SorteioLive Serverless Endpoint Active',
  });
}
