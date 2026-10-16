// Vercel Serverless Function for /api/participants
export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const { name, email, phone, document, city } = req.body || {};
    const ticketNumber = Math.floor(10000 + Math.random() * 90000).toString();

    const participant = {
      id: `part-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: (name || '').trim() || 'Participante',
      email: (email || '').trim().toLowerCase() || 'sem-email@sorteiolive.com',
      phone: (phone || '').trim() || 'Não informado',
      document: (document || '').trim() || 'Não informado',
      city: (city || '').trim() || 'Brasil',
      ticketNumber,
      createdAt: new Date().toISOString(),
      status: 'active',
    };

    return res.status(201).json({
      success: true,
      participant,
    });
  }

  return res.status(200).json({ status: 'active' });
}
