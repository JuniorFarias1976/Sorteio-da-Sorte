import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Initial Seed Data matching default configurations
const DEFAULT_BRAND_LOGO = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="48" fill="%230f172a" stroke="%23f59e0b" stroke-width="4"/><path d="M32 30h36v18c0 10-8 18-18 18s-18-8-18-18V30z" fill="%23f59e0b"/><path d="M26 34c-4 0-8 4-8 9s4 9 8 9h6v-6h-6c-1 0-2-1-2-3s1-3 2-3h6v-6h-6zm48 0h-6v6h6c1 0 2 1 2 3s-1 3-2 3h-6v6h6c4 0 8-4 8-9s-4-9-8-9z" fill="%23fbbf24"/><path d="M46 66h8v12h-8z" fill="%23d97706"/><path d="M36 78h28v6H36z" fill="%23f59e0b"/><polygon points="50,37 52.5,43 59,43.5 54,48 55.5,54.5 50,51 44.5,54.5 46,48 41,43.5 47.5,43" fill="%23ffffff"/></svg>`;

const INITIAL_DATABASE = {
  participants: [] as any[],
  prizes: [
    {
      id: 'prz-1',
      title: 'iPhone 16 Pro Max 256GB Titânio',
      description: 'Aparelho novo na caixa lacrada com garantia Apple Brasil de 1 ano.',
      totalQuantity: 2,
      drawnQuantity: 0,
      imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80',
      estimatedValue: 9899.00,
      drawOrder: 1,
    },
    {
      id: 'prz-2',
      title: 'PlayStation 5 Slim 1TB + 2 Controles DualSense',
      description: 'Console novíssimo com jogos digitais inclusos e garantia oficial Sony.',
      totalQuantity: 3,
      drawnQuantity: 0,
      imageUrl: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&auto=format&fit=crop&q=80',
      estimatedValue: 4299.00,
      drawOrder: 2,
    },
    {
      id: 'prz-3',
      title: 'Smart TV 65" 4K OLED HDR Gaming 120Hz',
      description: 'Painel cinematográfico OLED com inteligência artificial e som Dolby Atmos.',
      totalQuantity: 1,
      drawnQuantity: 0,
      imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&auto=format&fit=crop&q=80',
      estimatedValue: 6999.00,
      drawOrder: 3,
    },
    {
      id: 'prz-4',
      title: 'Moto Honda CG 160 Start 0KM 2026',
      description: 'Motocicleta zero quilômetro emplacada com IPVA pago e tanque cheio!',
      totalQuantity: 1,
      drawnQuantity: 0,
      imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80',
      estimatedValue: 17500.00,
      drawOrder: 4,
    },
    {
      id: 'prz-5',
      title: 'Pix de R$ 5.000,00 na Conta na Hora',
      description: 'Transferência instantânea via Pix para a conta bancária do titular contemplado.',
      totalQuantity: 5,
      drawnQuantity: 0,
      imageUrl: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=600&auto=format&fit=crop&q=80',
      estimatedValue: 5000.00,
      drawOrder: 5,
    },
  ],
  schedules: [
    {
      id: 'sched-round-1',
      title: '1º Sorteio do Dia - Rodada Matutina (10:00)',
      description: 'Abertura das rodadas diárias com sorteio do primeiro lote de prêmios.',
      scheduledDate: '2026-10-18',
      scheduledTime: '10:00',
      status: 'scheduled',
      roundNumber: 1,
      roundLabel: '1ª Rodada - 10:00',
      prizeIds: ['prz-5', 'prz-2'],
      createdAt: '2026-10-10T12:00:00Z',
    },
    {
      id: 'sched-round-2',
      title: '2º Sorteio do Dia - Rodada da Tarde (14:00)',
      description: 'Segunda rodada diária com prêmios de tecnologia e Pix imediato.',
      scheduledDate: '2026-10-18',
      scheduledTime: '14:00',
      status: 'scheduled',
      roundNumber: 2,
      roundLabel: '2ª Rodada - 14:00',
      prizeIds: ['prz-3', 'prz-5'],
      createdAt: '2026-10-10T12:05:00Z',
    },
    {
      id: 'sched-round-3',
      title: '3º Sorteio do Dia - Rodada de Fim de Tarde (18:00)',
      description: 'Terceira rodada com disputa do PlayStation 5 e Smart TV.',
      scheduledDate: '2026-10-18',
      scheduledTime: '18:00',
      status: 'scheduled',
      roundNumber: 3,
      roundLabel: '3ª Rodada - 18:00',
      prizeIds: ['prz-2', 'prz-1'],
      createdAt: '2026-10-10T12:10:00Z',
    },
    {
      id: 'sched-round-4',
      title: '4º Sorteio do Dia - Grande Rodada Nobre da Noite (21:00)',
      description: 'A grande rodada final do dia com Moto Honda CG 160 0KM e iPhone 16 Pro Max!',
      scheduledDate: '2026-10-18',
      scheduledTime: '21:00',
      status: 'scheduled',
      roundNumber: 4,
      roundLabel: '4ª Rodada - 21:00 (Final)',
      prizeIds: ['prz-4', 'prz-1', 'prz-5'],
      createdAt: '2026-10-10T12:15:00Z',
    },
  ],
  winners: [] as any[],
  notifications: [
    {
      id: 'notif-1',
      channel: 'whatsapp',
      recipientCount: 13,
      sentAt: '2026-10-11T19:00:00Z',
      status: 'sent',
      timingLabel: '1 hora antes',
      eventTitle: 'Sorteio Prévia de Aquecimento',
      messageTemplate: 'Olá {nome}! O seu sorteio começa em 1 hora! Seu bilhete da sorte é {bilhete}. Acesse o telão da live no link: {link_sorteio}',
    },
  ],
  settings: {
    autoNotify24h: true,
    autoNotify1h: true,
    autoNotify15m: true,
    autoNotifyStart: true,
    whatsappEnabled: true,
    emailEnabled: true,
    smsEnabled: false,
    messageTemplate: 'Olá {nome}! 🎟️ Seu número da sorte é #{bilhete}. O sorteio "{evento}" começará em breve com prêmios incríveis! Assista ao vivo: {link_sorteio}',
  },
  brand: {
    companyName: 'Megavolt Prêmios & Sorteios',
    companySlogan: 'Transparência, emoção e grandes prêmios ao vivo',
    logoUrl: DEFAULT_BRAND_LOGO,
    primaryColor: '#f59e0b',
    secondaryColor: '#d97706',
    accentColor: '#10b981',
    backgroundTheme: 'dark',
    raffleUrl: '',
    contactEmail: 'contato@megavoltsorteios.com.br',
    termsAndConditions: 'Sorteio autorizado e auditado em tempo real. Cada participante concorre com seus bilhetes únicos gerados no momento da inscrição. Vencedores devem apresentar documento oficial com foto e comprovar posse do número sorteado no prazo de até 30 dias corridos.',
  },
  formFields: {
    name: { id: 'name', label: 'Nome Completo', placeholder: '', enabled: true, required: true },
    email: { id: 'email', label: 'E-mail', placeholder: '', enabled: true, required: true },
    phone: { id: 'phone', label: 'WhatsApp / Telefone', placeholder: '', enabled: true, required: true },
    document: { id: 'document', label: 'CPF ou Documento', placeholder: '', enabled: true, required: false },
    city: { id: 'city', label: 'Cidade / Estado', placeholder: '', enabled: true, required: false },
  },
  posterConfig: {
    title: 'PARTICIPE DO NOSSO GRANDE SORTEIO!',
    subtitle: 'Concorra a prêmios incríveis transmitidos 100% ao vivo!',
    step1: 'Aponte a câmera do seu celular para o QR Code acima.',
    step2: 'Preencha seus dados reais e receba seu Número da Sorte oficial.',
    step3: 'Assista à transmissão ao vivo e confira se foi premiado!',
    footerLeft: 'Inscrição 100% Gratuita',
    footerRight: 'Sorteio Seguro & Auditado',
    showDate: true,
    showSteps: true,
    prizeHighlight: 'iPhone 16 Pro Max • Moto Honda 0KM • PlayStation 5',
    scheduleHighlight: '4 Sorteios Hoje: 10:00 • 14:00 • 18:00 • 21:00',
  },
  reportConfig: {
    title: 'ATA E AUDITORIA OFICIAL DE SORTEIO',
    subtitle: 'RELATÓRIO CONSOLIDADO DE VENCEDORES HOMOLOGADOS',
    protocolPrefix: 'SRT-',
    statementText: 'Certificamos que o sorteio foi realizado em tempo real utilizando algoritmo pseudo-aleatório criptográfico auditável sem duplicidade ou favorecimento, respeitando integralmente as regras do regulamento divulgado aos participantes.',
    organizerSignTitle: 'Assinatura do Organizador / Diretor',
    auditorSignTitle: 'Assinatura da Comissão de Auditoria',
    includeTicket: true,
    includeWinnerName: true,
    includePrize: true,
    includePhone: true,
    includeDocument: true,
    includeEmail: true,
    includeHash: true,
    includeDate: true,
  },
};

// Ensure data folder and file exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadDB(): typeof INITIAL_DATABASE & { version: number } {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      return {
        ...INITIAL_DATABASE,
        ...parsed,
        brand: { ...INITIAL_DATABASE.brand, ...(parsed.brand || {}) },
        settings: { ...INITIAL_DATABASE.settings, ...(parsed.settings || {}) },
        posterConfig: { ...INITIAL_DATABASE.posterConfig, ...(parsed.posterConfig || {}) },
        reportConfig: { ...INITIAL_DATABASE.reportConfig, ...(parsed.reportConfig || {}) },
        formFields: { ...INITIAL_DATABASE.formFields, ...(parsed.formFields || {}) },
        version: parsed.version || Date.now(),
      };
    }
  } catch (err) {
    console.error('Error reading database file:', err);
  }
  const defaultWithVersion = { ...INITIAL_DATABASE, version: Date.now() };
  saveDB(defaultWithVersion);
  return defaultWithVersion;
}

function saveDB(data: typeof INITIAL_DATABASE & { version?: number }) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing database file:', err);
  }
}

let db = loadDB();

// Connected SSE clients for real-time live synchronization across devices
type SSEClient = { id: string; res: Response };
const sseClients: SSEClient[] = [];

function broadcastSSE(eventType: string, payload: any) {
  const message = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) {
    try {
      client.res.write(message);
    } catch {
      // client disconnected
    }
  }
}

// Live Draw in-memory state
let liveState = {
  isDrawing: false,
  prizeId: null as string | null,
  round: 1,
  countdown: null as number | null,
  currentDisplayTicket: '-----',
  currentDisplayName: 'Aguardando Sorteio...',
  currentDisplayCity: 'SorteioLive',
  latestWinner: null as any | null,
  lastDrawnAt: null as string | null,
};

async function startServer() {
  const app = express();

  // Support high payload for base64 computer-uploaded prize images
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // CORS for cross-device support (e.g. mobile access on local network)
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // API Endpoints
  // 1. Get full synchronized application data (always reload fresh from disk with no-cache headers)
  app.get('/api/data', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    db = loadDB();
    res.json(db);
  });

  // 2. Update synchronized application data (admin saves) with safe deep merge
  app.post('/api/data', (req, res) => {
    const updates = req.body;
    console.log('[DB-SAVE] Received /api/data updates for keys:', Object.keys(updates || {}));

    // Ensure we start from current disk state
    db = loadDB();

    let mergedBrand = db.brand;
    if (updates.brand) {
      let targetLogo = updates.brand.logoUrl;
      // If updates explicitly provides a logoUrl, use it
      if (!targetLogo || targetLogo === DEFAULT_BRAND_LOGO) {
        if (db.brand?.logoUrl && db.brand.logoUrl !== DEFAULT_BRAND_LOGO && !updates.brand.forceResetLogo) {
          targetLogo = db.brand.logoUrl;
        } else {
          targetLogo = targetLogo || DEFAULT_BRAND_LOGO;
        }
      }

      mergedBrand = {
        ...db.brand,
        ...updates.brand,
        logoUrl: targetLogo,
      };
    }

    db = {
      ...db,
      ...updates,
      brand: mergedBrand,
      settings: updates.settings ? { ...db.settings, ...updates.settings } : db.settings,
      posterConfig: updates.posterConfig ? { ...db.posterConfig, ...updates.posterConfig } : db.posterConfig,
      reportConfig: updates.reportConfig ? { ...db.reportConfig, ...updates.reportConfig } : db.reportConfig,
      formFields: updates.formFields ? { ...db.formFields, ...updates.formFields } : db.formFields,
      version: Date.now(),
    };

    saveDB(db);
    console.log(`[DB-SAVE] Successfully saved to database.json. Brand: "${db.brand.companyName}", Logo bytes: ${db.brand.logoUrl?.length || 0}`);
    broadcastSSE('DATA_UPDATED', db);
    res.json({ success: true, data: db, version: db.version, savedAt: new Date().toISOString() });
  });

  // Database verification & status endpoint
  app.get('/api/db/status', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    db = loadDB();
    res.json({
      success: true,
      status: 'connected',
      databaseFile: DB_FILE,
      version: db.version,
      participantsCount: db.participants.length,
      prizesCount: db.prizes.length,
      winnersCount: db.winners.length,
      brand: {
        companyName: db.brand.companyName,
        hasCustomLogo: db.brand.logoUrl !== DEFAULT_BRAND_LOGO,
        primaryColor: db.brand.primaryColor,
      },
      lastSaved: new Date(db.version).toISOString(),
    });
  });

  // 3. Register participant with server-side email duplication check
  app.post('/api/participants', (req, res) => {
    const { name, email, phone, document, city } = req.body;

    const normalizedEmail = (email || '').trim().toLowerCase();

    // Check if participant already exists with this email (if provided)
    if (normalizedEmail) {
      const existing = db.participants.find(
        (p) => p.email && p.email.trim().toLowerCase() === normalizedEmail
      );

      if (existing) {
        res.status(409).json({
          error: 'DUPLICATE_EMAIL',
          message: `O e-mail "${normalizedEmail}" já está cadastrado no sistema (Bilhete #${existing.ticketNumber})! Cada participante só pode se cadastrar uma única vez.`,
          existingParticipant: existing,
        });
        return;
      }
    }

    // Generate unique 5-digit lucky number
    const existingTickets = new Set(db.participants.map((p) => p.ticketNumber));
    let ticketNumber = '';
    do {
      ticketNumber = Math.floor(10000 + Math.random() * 90000).toString();
    } while (existingTickets.has(ticketNumber));

    const newParticipant = {
      id: `part-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: (name || '').trim() || 'Participante',
      email: normalizedEmail || 'sem-email@sorteiolive.com',
      phone: (phone || '').trim(),
      document: (document || '').trim(),
      city: (city || '').trim(),
      ticketNumber,
      createdAt: new Date().toISOString(),
      status: 'active' as const,
    };

    db.participants = [newParticipant, ...db.participants];
    db.version = Date.now();
    saveDB(db);

    broadcastSSE('DATA_UPDATED', db);
    res.status(201).json({ success: true, participant: newParticipant });
  });

  // 4. Network Info Endpoint to help mobile devices connect cleanly
  app.get('/api/network-info', (req, res) => {
    const interfaces = os.networkInterfaces();
    const ips: string[] = [];
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        if (
          iface.family === 'IPv4' && 
          !iface.internal && 
          !iface.address.startsWith('169.254.') && 
          !iface.address.startsWith('127.')
        ) {
          ips.push(iface.address);
        }
      }
    }
    const forwardedHost = (req.headers['x-forwarded-host'] as string) || req.get('host') || `localhost:${PORT}`;
    const forwardedProto = (req.headers['x-forwarded-proto'] as string) || (req.secure ? 'https' : 'http');
    const dynamicOrigin = `${forwardedProto}://${forwardedHost}`;

    res.json({
      localIp: ips[0] || 'localhost',
      allIps: ips,
      port: PORT,
      host: forwardedHost,
      origin: dynamicOrigin,
      sharedUrl: dynamicOrigin,
      developmentUrl: dynamicOrigin,
    });
  });

  // 5. Live Draw State Endpoint
  app.get('/api/live/state', (_req, res) => {
    res.json(liveState);
  });

  // 5. Admin performs draw: only admin can trigger this endpoint!
  app.post('/api/live/draw', async (req, res) => {
    const { prizeId, round } = req.body;

    const prize = db.prizes.find((p) => p.id === prizeId);
    if (!prize) {
      res.status(404).json({ error: 'PRIZE_NOT_FOUND', message: 'Prêmio não encontrado.' });
      return;
    }

    if (prize.drawnQuantity >= prize.totalQuantity) {
      res.status(400).json({
        error: 'PRIZE_EXHAUSTED',
        message: 'Este prêmio já teve todas as suas quantidades sorteadas (Esgotado)!',
      });
      return;
    }

    // Eligible participants: active status only
    const eligibleParticipants = db.participants.filter((p) => p.status === 'active');
    if (eligibleParticipants.length === 0) {
      res.status(400).json({
        error: 'NO_PARTICIPANTS',
        message: 'Nenhum participante ativo elegível disponível para o sorteio.',
      });
      return;
    }

    // Random winner pick
    const winnerIndex = Math.floor(Math.random() * eligibleParticipants.length);
    const chosenParticipant = eligibleParticipants[winnerIndex];

    const validationHash = Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 16).toString(16).toUpperCase()
    ).join('');

    const schedule = db.schedules.find((s) => s.roundNumber === round) || db.schedules[0];

    const newWinner = {
      id: `win-${Date.now()}`,
      drawId: schedule?.id || `draw-${Date.now()}`,
      drawTitle: schedule?.title || `${round}º Sorteio Oficial`,
      participantId: chosenParticipant.id,
      participantName: chosenParticipant.name,
      participantEmail: chosenParticipant.email,
      participantPhone: chosenParticipant.phone,
      participantTicket: chosenParticipant.ticketNumber,
      participantDocument: chosenParticipant.document || 'Documento Auditado',
      prizeId: prize.id,
      prizeTitle: prize.title,
      wonAt: new Date().toISOString(),
      validationHash,
    };

    // Begin live animation broadcast sequence
    liveState.isDrawing = true;
    liveState.prizeId = prizeId;
    liveState.round = round || 1;
    liveState.latestWinner = null;
    liveState.countdown = 3;

    broadcastSSE('LIVE_EVENT', {
      type: 'START_DRAW',
      prizeId,
      round,
      prizeTitle: prize.title,
    });

    // Run simulation ticks on server and push to all clients
    let remainingTicks = 28;
    const tickInterval = setInterval(() => {
      remainingTicks--;
      const randomPart =
        db.participants[Math.floor(Math.random() * db.participants.length)] || chosenParticipant;

      liveState.currentDisplayTicket = randomPart.ticketNumber;
      liveState.currentDisplayName = randomPart.name;
      liveState.currentDisplayCity = randomPart.city || 'Sorteando...';

      broadcastSSE('LIVE_EVENT', {
        type: 'TUMBLER_TICK',
        ticket: randomPart.ticketNumber,
        name: randomPart.name,
        city: randomPart.city || 'Sorteando...',
      });

      if (remainingTicks <= 0) {
        clearInterval(tickInterval);

        // Update database: increment drawnQuantity and add winner
        db.prizes = db.prizes.map((p) =>
          p.id === prizeId ? { ...p, drawnQuantity: p.drawnQuantity + 1 } : p
        );

        db.participants = db.participants.map((p) =>
          p.id === chosenParticipant.id ? { ...p, status: 'winner' as const } : p
        );

        db.winners = [newWinner, ...db.winners];
        saveDB(db);

        // Finalize liveState
        liveState.isDrawing = false;
        liveState.countdown = null;
        liveState.currentDisplayTicket = newWinner.participantTicket;
        liveState.currentDisplayName = newWinner.participantName;
        liveState.currentDisplayCity = newWinner.participantDocument || 'CONTEMPLADO';
        liveState.latestWinner = newWinner;
        liveState.lastDrawnAt = newWinner.wonAt;

        broadcastSSE('LIVE_EVENT', {
          type: 'WINNER_REVEALED',
          winner: newWinner,
          prize: db.prizes.find((p) => p.id === prizeId),
        });

        broadcastSSE('DATA_UPDATED', db);
      }
    }, 120);

    res.json({
      success: true,
      winner: newWinner,
      message: 'Sorteio iniciado com sucesso e sincronizado em todas as telas!',
    });
  });

  // 6. Admin resets live view
  app.post('/api/live/reset', (_req, res) => {
    liveState = {
      isDrawing: false,
      prizeId: null,
      round: 1,
      countdown: null,
      currentDisplayTicket: '-----',
      currentDisplayName: 'Aguardando Sorteio...',
      currentDisplayCity: 'SorteioLive',
      latestWinner: null,
      lastDrawnAt: null,
    };
    broadcastSSE('LIVE_EVENT', { type: 'LIVE_RESET' });
    res.json({ success: true, liveState });
  });

  // 7. Server-Sent Events (SSE) Stream for real-time synchronization on all devices (mobile & desktop)
  app.get('/api/live/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const clientId = `client-${Date.now()}-${Math.random()}`;
    const newClient: SSEClient = { id: clientId, res };
    sseClients.push(newClient);

    // Send initial snapshot
    res.write(`event: INITIAL_STATE\ndata: ${JSON.stringify({ liveState, db })}\n\n`);

    // Ping every 15 seconds to prevent timeout
    const heartbeat = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch {
        clearInterval(heartbeat);
      }
    }, 15000);

    req.on('close', () => {
      clearInterval(heartbeat);
      const index = sseClients.findIndex((c) => c.id === clientId);
      if (index !== -1) {
        sseClients.splice(index, 1);
      }
    });
  });

  // Mount Vite middleware for dev or serve dist in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 SorteioLive Pro Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
