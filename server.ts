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

const DEFAULT_BRAND_LOGO = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 80" fill="none"><path d="M42 10 C76 11, 80 42, 69 66 C52 76, 24 74, 14 52 C4 28, 16 10, 42 10 Z" stroke="%23E30613" stroke-width="4.5" fill="%23E30613" fill-opacity="0.15"/><text x="42" y="49" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-weight="900" font-size="19" fill="%23E30613" letter-spacing="0.5">Lacer</text><text x="82" y="51" font-family="system-ui,-apple-system,sans-serif" font-weight="900" font-size="28" fill="%23FFFFFF" letter-spacing="1.2">LACER</text></svg>`;

const INITIAL_DATABASE = {
  participants: [] as any[],
  prizes: [
    {
      id: 'prz-1',
      title: 'LACER HIDRO - Irrigador bucal portátil',
      description: 'Limpeza profunda e eficaz, 3 níveis de pressão, design ergonómico e bateria recarregável.',
      totalQuantity: 4,
      drawnQuantity: 0,
      imageUrl: '/assets/lacer_hidro.jpg',
      estimatedValue: 89.90,
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
      title: 'Sorteio Manhã',
      description: 'Primeira ronda matutina oficial de sorteio de prémios.',
      scheduledDate: '2026-10-22',
      scheduledTime: '13:00',
      status: 'scheduled',
      roundNumber: 1,
      roundLabel: '1ª Ronda (Manhã) - 13:00',
      prizeIds: ['prz-1'],
      createdAt: '2026-10-18T10:00:00Z',
    },
    {
      id: 'sched-round-2',
      title: 'Sorteio Tarde',
      description: 'Segunda ronda oficial da tarde de sorteio de prémios.',
      scheduledDate: '2026-10-22',
      scheduledTime: '19:00',
      status: 'scheduled',
      roundNumber: 2,
      roundLabel: '2ª Ronda (Tarde) - 19:00',
      prizeIds: ['prz-1'],
      createdAt: '2026-10-18T10:05:00Z',
    },
    {
      id: 'sched-round-3',
      title: 'Sorteio 2.º Dia Manhã',
      description: 'Terceira ronda oficial - segundo dia matutino.',
      scheduledDate: '2026-10-23',
      scheduledTime: '13:00',
      status: 'scheduled',
      roundNumber: 1,
      roundLabel: '2º Dia (Manhã) - 13:00',
      prizeIds: ['prz-1'],
      createdAt: '2026-10-18T10:10:00Z',
    },
    {
      id: 'sched-round-4',
      title: 'Sorteio 2.º Dia Tarde',
      description: 'Quarta ronda oficial - segundo dia à tarde.',
      scheduledDate: '2026-10-23',
      scheduledTime: '19:00',
      status: 'scheduled',
      roundNumber: 2,
      roundLabel: '2º Dia (Tarde) - 19:00',
      prizeIds: ['prz-1'],
      createdAt: '2026-10-18T10:15:00Z',
    },
    {
      id: 'sched-round-5',
      title: 'Sorteio 3.º Dia Manhã',
      description: 'Quinta ronda oficial - terceiro dia matutino.',
      scheduledDate: '2026-10-24',
      scheduledTime: '13:00',
      status: 'scheduled',
      roundNumber: 1,
      roundLabel: '3º Dia (Manhã) - 13:00',
      prizeIds: ['prz-1'],
      createdAt: '2026-10-18T10:20:00Z',
    },
    {
      id: 'sched-round-6',
      title: 'Sorteio 3.º Dia Tarde',
      description: 'Sexta ronda oficial - terceiro dia à tarde.',
      scheduledDate: '2026-10-24',
      scheduledTime: '19:00',
      status: 'scheduled',
      roundNumber: 2,
      roundLabel: '3º Dia (Tarde) - 19:00',
      prizeIds: ['prz-1'],
      createdAt: '2026-10-18T10:25:00Z',
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
    messageTemplate: 'Olá {nome}! 🎟️ O seu bilhete da sorte é #{bilhete}. O sorteio "{evento}" começará em breve com prémios incríveis! Assista em direto: {link_sorteio}',
  },
  brand: {
    companyName: 'Lacer - Sorteio OMD 2026',
    companySlogan: 'Higiene e Saúde Oral • Stand Lacer',
    logoUrl: DEFAULT_BRAND_LOGO,
    primaryColor: '#E30613',
    secondaryColor: '#B91C1C',
    accentColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
    textColor: '#0F172A',
    cardBackgroundColor: '#FFFFFF',
    backgroundTheme: 'white',
    contactEmail: 'contacto@lacer.pt',
    adminPassword: 'admin',
    termsAndConditions: 'Sorteio autorizado e auditado em tempo real. Cada participante concorre com os seus bilhetes únicos gerados no momento da inscrição. Os vencedores devem apresentar documento oficial com fotografia e comprovar a posse do número sorteado no prazo de até 30 dias corridos.',
    roundsBannerTitle: '2 Sorteios Oficiais por Dia',
    roundsBannerSubtitle: 'O seu bilhete concorre automaticamente em todas as rondas e datas programadas!',
    showRoundsBanner: true,
    showNavbar: false,
    heroLogoSize: 'large',
    showHeroTitle: false,
    showNavbarBrandText: false,
    showNavbarParticipateButton: false,
    showPrizesSection: false,
    formTitle: 'PARTICIPE NO SORTEIO E PODE GANHAR UM IRRIGADOR ORAL LACER',
    showFormContactSectionTitle: false,
    formContactSectionTitle: '',
    formSubtitle: 'Preencha os seus dados reais para receber a confirmação e o seu número',
    formButtonText: 'Participar do sorteio',
    prizesSectionTitle: 'Prémios Desta Edição',
    searchSectionTitle: 'Já se inscreveu? Consulte os seus Bilhetes',
    searchSectionSubtitle: 'Insira o seu NIF, telemóvel, e-mail ou bilhete para verificar os seus números registados',
    ticketNotice: 'Validação única: limite de 1 inscrição por e-mail',
    heroBadgeText: '',
    ticketModalTitle: 'PARTICIPAÇÃO REGISTADA COM SUCESSO!',
    ticketModalSubtitle: 'O Seu Bilhete Oficial Lacer',
    regulationPdfUrl: '',
    regulationPdfName: '',
    legalTermsPdfUrl: '',
    legalTermsPdfName: '',
    hcpPrivacyPdfUrl: '',
    hcpPrivacyPdfName: '',
    rafflePrivacyPdfUrl: '',
    rafflePrivacyPdfName: '',
    showFormPrizeHighlight: true,
    showConsentVisitSection: true,
    consentVisitTitle: 'Sim, gostaria que um representante da LACER visitasse a sua clínica para lhe apresentar os nossos produtos?',
    consentHcpDatabaseText: 'Sim, concordo que os meus dados sejam armazenados na base de dados de profissionais de saúde para gerir interações científicas, incluindo consultas médicas.',
    consentCommunicationsText: 'Concordo em receber comunicações científicas e educacionais, bem como informações sobre produtos ou atividades, por e-mail ou outros meios, e que essas sejam seguidas através de tecnologias de rastreio.',
    consentProfilingText: 'Concordo com a criação de um perfil profissional que tenha em conta os meus interesses técnico-profissionais em áreas terapêuticas relevantes (perfilado).',
    consentLegalNoticeP1: 'A LACER, S.A. processará os dados pessoais fornecidos para gerir a sua participação no sorteio, incluindo, quando aplicável, a seleção e comunicação dos vencedores e a gestão da entrega dos prémios. Além disso, com base no seu consentimento, iremos: enviar-lhe, incluindo por meios eletrónicos, informações científicas e educativas, notícias, eventos e produtos, e seguir esses envios utilizando tecnologias de rastreio; criar um perfil profissional com base nos seus interesses técnicos e profissionais em áreas terapêuticas relevantes; e incluir os seus dados na base de dados de profissionais de saúde para gerir as interações consigo, incluindo consultas médicas e atividades científicas.',
    consentLegalNoticeP2: 'Também processaremos os seus dados para cumprir as obrigações legais aplicáveis ao setor farmacêutico.',
    consentLegalNoticeP3: 'Para mais informações e para saber como exercer os seus direitos de acesso, retificação, supressão, revogação do consentimento, entre outros, consulte a nossa Política de Privacidade do Sorteio e a nossa Política de Privacidade para Profissionais de Saúde.',
    consentTermsDeclaration: 'Declaro que li e aceito os Termos Legais do Sorteio e que fui informado(a) sobre o processamento dos meus dados pessoais através da Política de Privacidade do Sorteio e a nossa Política de Privacidade para Profissionais de Saúde.',
  },
  formFields: {
    name: { id: 'name', label: 'Nome Completo', placeholder: '', enabled: true, required: true },
    email: { id: 'email', label: 'E-mail', placeholder: '', enabled: true, required: true },
    phone: { id: 'phone', label: 'Telemóvel / Contacto', placeholder: '', enabled: true, required: true },
    document: { id: 'document', label: 'NIF ou Documento', placeholder: '', enabled: true, required: false },
    city: { id: 'city', label: 'Localidade / Concelho', placeholder: '', enabled: true, required: false },
  },
  posterConfig: {
    title: 'PARTICIPE NO NOSSO GRANDE SORTEIO!',
    subtitle: 'Habilite-se a prémios incríveis transmitidos 100% em direto!',
    step1: 'Aponte a câmara do seu telemóvel para o Código QR acima.',
    step2: 'Preencha os seus dados reais e receba o seu Número da Sorte oficial.',
    step3: 'Assista à transmissão em direto e confirme se foi premiado!',
    footerLeft: 'Inscrição 100% Gratuita',
    footerRight: 'Sorteio Seguro & Auditado',
    showDate: true,
    showSteps: true,
    prizeHighlight: 'iPhone 16 Pro Max • Moto Honda 0KM • PlayStation 5',
    scheduleHighlight: '4 Sorteios Hoje: 10:00 • 14:00 • 18:00 • 21:00',
  },
  reportConfig: {
    title: 'AUTO E AUDITORIA OFICIAL DE SORTEIO',
    subtitle: 'RELATÓRIO CONSOLIDADO DE VENCEDORES HOMOLOGADOS',
    protocolPrefix: 'SRT-',
    statementText: 'Certificamos que o sorteio foi realizado em tempo real utilizando algoritmo pseudo-aleatório criptográfico auditável sem duplicidade ou favorecimento, respeitando integralmente as regras do regulamento divulgado aos participantes.',
    organizerSignTitle: 'Assinatura do Organizador / Direção',
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
  users: [
    {
      id: 'usr-admin-1',
      username: 'admin',
      name: 'Administrador Geral',
      password: 'admin',
      role: 'admin',
      createdAt: '2026-01-01T00:00:00Z',
      active: true,
    },
    {
      id: 'usr-operador-1',
      username: 'operador',
      name: 'Utilizador Operador',
      password: 'lacer2026',
      role: 'standard',
      createdAt: '2026-01-01T00:00:00Z',
      active: true,
    },
  ] as any[],
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
      const mergedBrand = { ...INITIAL_DATABASE.brand, ...(parsed.brand || {}) };
      if (
        !mergedBrand.consentVisitTitle ||
        mergedBrand.consentVisitTitle.trim() ===
          'Gostaria que um representante da LACER visitasse a sua clínica para lhe apresentar os nossos produtos?'
      ) {
        mergedBrand.consentVisitTitle = INITIAL_DATABASE.brand.consentVisitTitle;
      }
      return {
        ...INITIAL_DATABASE,
        ...parsed,
        brand: mergedBrand,
        settings: { ...INITIAL_DATABASE.settings, ...(parsed.settings || {}) },
        posterConfig: { ...INITIAL_DATABASE.posterConfig, ...(parsed.posterConfig || {}) },
        reportConfig: { ...INITIAL_DATABASE.reportConfig, ...(parsed.reportConfig || {}) },
        formFields: { ...INITIAL_DATABASE.formFields, ...(parsed.formFields || {}) },
        users: Array.isArray(parsed.users) && parsed.users.length > 0 ? parsed.users : INITIAL_DATABASE.users,
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

// Schedule lock helpers (aligned with src/utils/scheduleLock.ts)
function formatScheduleDatePtServer(dateStr?: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function getScheduleSlotKeyServer(schedule: { scheduledDate?: string; scheduledTime?: string }): string {
  const datePart = (schedule.scheduledDate || '0000-00-00').trim();
  const rawTime = (schedule.scheduledTime || '00:00').trim();
  const [hh = '00', mm = '00'] = rawTime.split(':');
  return `${datePart}T${hh.padStart(2, '0')}:${mm.padStart(2, '0')}`;
}

function isScheduleLockedServer(schedule?: any): boolean {
  if (!schedule) return false;
  return schedule.isLocked === true || schedule.status === 'completed';
}

function getScheduleDrawLockStatusServer(targetSchedule: any, allSchedules: any[]) {
  const locked = (allSchedules || []).filter((s) => isScheduleLockedServer(s));
  const latestDrawnSchedule =
    locked.length > 0
      ? locked.reduce((latest, curr) =>
          getScheduleSlotKeyServer(curr) > getScheduleSlotKeyServer(latest) ? curr : latest
        )
      : null;

  if (!targetSchedule) {
    return { isLocked: false, reason: null as string | null, message: null as string | null };
  }

  if (isScheduleLockedServer(targetSchedule)) {
    return {
      isLocked: true,
      reason: 'ALREADY_DRAWN',
      message: `O sorteio agendado para ${formatScheduleDatePtServer(targetSchedule.scheduledDate)} às ${targetSchedule.scheduledTime} já foi realizado. Só é possível realizar um novo sorteio numa data ou hora posterior.`,
    };
  }

  if (targetSchedule.manuallyUnlocked === true) {
    return { isLocked: false, reason: null as string | null, message: null as string | null };
  }

  if (latestDrawnSchedule) {
    const targetKey = getScheduleSlotKeyServer(targetSchedule);
    const latestKey = getScheduleSlotKeyServer(latestDrawnSchedule);
    if (targetKey <= latestKey) {
      return {
        isLocked: true,
        reason: 'NOT_POSTERIOR',
        message: `Já foi realizado um sorteio em ${formatScheduleDatePtServer(latestDrawnSchedule.scheduledDate)} às ${latestDrawnSchedule.scheduledTime}. Um novo sorteio só pode ser realizado numa data ou hora posterior.`,
      };
    }
  }

  return { isLocked: false, reason: null as string | null, message: null as string | null };
}

// Live Draw in-memory state
let liveState = {
  isDrawing: false,
  prizeId: null as string | null,
  scheduleId: null as string | null,
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

    // Safe Union Merge for participants: never erase registered participants unless explicit deletion was requested
    let mergedParticipants = db.participants;
    if (Array.isArray(updates.participants)) {
      if (updates.isFactoryReset || updates.allowParticipantDeletion) {
        mergedParticipants = updates.participants;
      } else {
        const partMap = new Map<string, any>();
        for (const p of db.participants || []) {
          const key = p?.id || (p?.ticketNumber ? `ticket-${p.ticketNumber}` : '');
          if (key) partMap.set(key, p);
        }
        for (const p of updates.participants) {
          const key = p?.id || (p?.ticketNumber ? `ticket-${p.ticketNumber}` : '');
          if (!key) continue;
          const existing = partMap.get(key);
          partMap.set(key, { ...existing, ...p });
        }
        mergedParticipants = Array.from(partMap.values());
      }
    }

    // Safe Union Merge for winners
    let mergedWinners = db.winners;
    if (Array.isArray(updates.winners)) {
      if (updates.isFactoryReset || updates.allowWinnerDeletion) {
        mergedWinners = updates.winners;
      } else {
        const winnerMap = new Map<string, any>();
        for (const w of db.winners || []) {
          if (w?.id) winnerMap.set(w.id, w);
        }
        for (const w of updates.winners) {
          if (w?.id) {
            const existing = winnerMap.get(w.id);
            winnerMap.set(w.id, { ...existing, ...w });
          }
        }
        mergedWinners = Array.from(winnerMap.values());
      }
    }

    let mergedUsers = db.users || INITIAL_DATABASE.users;
    if (Array.isArray(updates.users)) {
      if (updates.isFactoryReset || updates.allowUserDeletion) {
        mergedUsers = updates.users.length > 0 ? updates.users : INITIAL_DATABASE.users;
      } else {
        const userMap = new Map<string, any>();
        for (const u of db.users || []) {
          if (u?.id) userMap.set(u.id, u);
        }
        for (const u of updates.users) {
          if (u?.id) {
            const existing = userMap.get(u.id);
            userMap.set(u.id, { ...existing, ...u });
          }
        }
        mergedUsers = Array.from(userMap.values());
      }
    }

    const {
      allowParticipantDeletion: _apd,
      allowWinnerDeletion: _awd,
      allowUserDeletion: _aud,
      isFactoryReset: _ifr,
      ...cleanUpdates
    } = updates || {};

    db = {
      ...db,
      ...cleanUpdates,
      participants: mergedParticipants,
      winners: mergedWinners,
      brand: mergedBrand,
      settings: updates.settings ? { ...db.settings, ...updates.settings } : db.settings,
      posterConfig: updates.posterConfig ? { ...db.posterConfig, ...updates.posterConfig } : db.posterConfig,
      reportConfig: updates.reportConfig ? { ...db.reportConfig, ...updates.reportConfig } : db.reportConfig,
      formFields: updates.formFields ? { ...db.formFields, ...updates.formFields } : db.formFields,
      users: mergedUsers,
      version: Date.now(),
    };

    saveDB(db);
    console.log(`[DB-SAVE] Successfully saved to database.json. Brand: "${db.brand.companyName}", Users: ${db.users?.length || 0}, Participants: ${db.participants?.length || 0}`);
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
      usersCount: db.users?.length || 0,
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
    const { 
      name, 
      email, 
      phone, 
      document, 
      clinic, 
      city, 
      specialty, 
      specialtyOther, 
      wantsLacerVisit, 
      hcpDatabaseConsent,
      marketingConsent, 
      profilingConsent,
      termsAccepted 
    } = req.body;

    const normalizedEmail = (email || '').trim().toLowerCase();

    // Check if participant already exists with this email (if provided)
    if (normalizedEmail) {
      const existing = db.participants.find(
        (p) => p.email && p.email.trim().toLowerCase() === normalizedEmail
      );

      if (existing) {
        res.status(409).json({
          error: 'DUPLICATE_EMAIL',
          message: `O e-mail "${normalizedEmail}" já está registado no sistema (Bilhete #${existing.ticketNumber})! Cada participante só pode se inscrever uma única vez.`,
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

    const specialtiesArray = Array.isArray(req.body.specialties)
      ? req.body.specialties
      : (specialty || '').split(',').map((s: string) => s.trim()).filter(Boolean);

    const newParticipant = {
      id: `part-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: (name || '').trim() || 'Participante',
      email: normalizedEmail || 'sem-email@lacer.pt',
      phone: (phone || '').trim(),
      document: (document || '').trim(),
      clinic: (clinic || '').trim(),
      city: (city || '').trim(),
      specialty: (specialty || '').trim(),
      specialties: specialtiesArray,
      specialtyOther: (specialtyOther || '').trim(),
      wantsLacerVisit: Boolean(wantsLacerVisit),
      hcpDatabaseConsent: Boolean(hcpDatabaseConsent),
      marketingConsent: Boolean(marketingConsent),
      profilingConsent: Boolean(profilingConsent),
      termsAccepted: Boolean(termsAccepted),
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

  const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Helper to serve a stored PDF or return fallback
  const sendPdfResponse = (res: Response, pdfRelUrl?: string, pdfName?: string, defaultFileName = 'documento.pdf') => {
    if (pdfRelUrl && pdfRelUrl.startsWith('/uploads/')) {
      const customPath = path.join(__dirname, 'public', pdfRelUrl);
      if (fs.existsSync(customPath)) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${pdfName || defaultFileName}"`);
        return res.sendFile(customPath);
      }
    }
    const fallbackPath = path.join(__dirname, 'public', 'regulamento.pdf');
    if (fs.existsSync(fallbackPath)) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${pdfName || defaultFileName}"`);
      return res.sendFile(fallbackPath);
    }
    res.status(404).send('Documento em PDF não encontrado.');
  };

  // 1. Termos Legais do Sorteio
  app.get(['/termos-legais.pdf', '/api/termos-legais.pdf', '/regulamento.pdf', '/api/regulamento.pdf'], (_req: Request, res: Response) => {
    db = loadDB();
    const url = db.brand?.legalTermsPdfUrl || db.brand?.regulationPdfUrl;
    const name = db.brand?.legalTermsPdfName || db.brand?.regulationPdfName || 'Termos_Legais_Sorteio_Lacer.pdf';
    return sendPdfResponse(res, url, name, 'Termos_Legais_Sorteio_Lacer.pdf');
  });

  // 2. Política de Privacidade para Profissionais de Saúde
  app.get(['/privacidade-profissionais.pdf', '/api/privacidade-profissionais.pdf'], (_req: Request, res: Response) => {
    db = loadDB();
    const url = db.brand?.hcpPrivacyPdfUrl;
    const name = db.brand?.hcpPrivacyPdfName || 'Politica_Privacidade_Profissionais_Saude_Lacer.pdf';
    return sendPdfResponse(res, url, name, 'Politica_Privacidade_Profissionais_Saude_Lacer.pdf');
  });

  // 3. Política de Privacidade do Sorteio
  app.get(['/privacidade-sorteio.pdf', '/api/privacidade-sorteio.pdf'], (_req: Request, res: Response) => {
    db = loadDB();
    const url = db.brand?.rafflePrivacyPdfUrl;
    const name = db.brand?.rafflePrivacyPdfName || 'Politica_Privacidade_Sorteio_Lacer.pdf';
    return sendPdfResponse(res, url, name, 'Politica_Privacidade_Sorteio_Lacer.pdf');
  });

  // Upload custom PDF endpoint supporting 3 document types:
  // - 'legal_terms' (Termos Legais do Sorteio)
  // - 'hcp_privacy' (Política de Privacidade para Profissionais de Saúde)
  // - 'raffle_privacy' (Política de Privacidade do Sorteio)
  app.post('/api/upload-pdf', (req, res) => {
    try {
      const { fileData, fileName, docType } = req.body;
      if (!fileData) {
        return res.status(400).json({ error: 'Nenhum ficheiro fornecido' });
      }

      const defaultName = docType === 'hcp_privacy'
        ? 'Politica_Privacidade_Profissionais.pdf'
        : docType === 'raffle_privacy'
        ? 'Politica_Privacidade_Sorteio.pdf'
        : 'Termos_Legais_Sorteio.pdf';

      const cleanName = (fileName || defaultName).replace(/[^a-zA-Z0-9_.-]/g, '_');
      const targetFileName = `${Date.now()}-${cleanName}`;
      const filePath = path.join(UPLOADS_DIR, targetFileName);

      const base64Content = fileData.replace(/^data:application\/pdf;base64,/, '').replace(/^data:.*;base64,/, '');
      const buffer = Buffer.from(base64Content, 'base64');
      fs.writeFileSync(filePath, buffer);

      const fileUrl = `/uploads/${targetFileName}`;
      db = loadDB();

      if (docType === 'hcp_privacy') {
        db.brand = {
          ...db.brand,
          hcpPrivacyPdfUrl: fileUrl,
          hcpPrivacyPdfName: fileName || cleanName,
        };
      } else if (docType === 'raffle_privacy') {
        db.brand = {
          ...db.brand,
          rafflePrivacyPdfUrl: fileUrl,
          rafflePrivacyPdfName: fileName || cleanName,
        };
      } else {
        // default / legal_terms
        db.brand = {
          ...db.brand,
          legalTermsPdfUrl: fileUrl,
          legalTermsPdfName: fileName || cleanName,
          regulationPdfUrl: fileUrl,
          regulationPdfName: fileName || cleanName,
        };
        // Also sync fallback public/regulamento.pdf
        const defaultPath = path.join(__dirname, 'public', 'regulamento.pdf');
        try { fs.writeFileSync(defaultPath, buffer); } catch {}
      }

      saveDB(db);
      broadcastSSE('DATA_UPDATED', db);

      console.log(`[PDF-UPLOAD] Successfully saved ${docType || 'legal_terms'} PDF: ${fileUrl} (${buffer.length} bytes)`);
      res.json({ success: true, url: fileUrl, fileName: fileName || cleanName, docType });
    } catch (err: any) {
      console.error('Error uploading PDF:', err);
      res.status(500).json({ error: 'Erro ao carregar o ficheiro PDF: ' + err.message });
    }
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

  // 5. Admin / Operator performs draw: enforces schedule lock & posterior date/time validation!
  app.post('/api/live/draw', async (req, res) => {
    const { prizeId, round, scheduleId } = req.body;
    db = loadDB();

    const schedule =
      (scheduleId ? db.schedules.find((s: any) => s.id === scheduleId) : undefined) ||
      db.schedules.find((s: any) => s.roundNumber === round) ||
      db.schedules[0];

    const lockStatus = getScheduleDrawLockStatusServer(schedule, db.schedules || []);
    if (lockStatus.isLocked) {
      res.status(423).json({
        error: 'SCHEDULE_LOCKED',
        reason: lockStatus.reason,
        message: lockStatus.message || 'Este sorteio está bloqueado. Só é possível sortear numa data ou hora posterior.',
      });
      return;
    }

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

    const nowIso = new Date().toISOString();
    const newWinner = {
      id: `win-${Date.now()}`,
      drawId: schedule?.id || `draw-${Date.now()}`,
      drawTitle: schedule
        ? `${schedule.title} (${schedule.scheduledDate} às ${schedule.scheduledTime})`
        : `${round}º Sorteio Oficial`,
      participantId: chosenParticipant.id,
      participantName: chosenParticipant.name,
      participantEmail: chosenParticipant.email,
      participantPhone: chosenParticipant.phone,
      participantTicket: chosenParticipant.ticketNumber,
      participantDocument: chosenParticipant.document || 'Documento Auditado',
      participantClinic: chosenParticipant.clinic || '',
      participantCity: chosenParticipant.city || '',
      participantSpecialty: chosenParticipant.specialty || '',
      prizeId: prize.id,
      prizeTitle: prize.title,
      wonAt: nowIso,
      validationHash,
    };

    // Immediately lock the scheduled slot to prevent duplicate draws
    if (schedule) {
      db.schedules = db.schedules.map((s: any) =>
        s.id === schedule.id
          ? {
              ...s,
              status: 'completed',
              isLocked: true,
              manuallyUnlocked: false,
              drawnAt: nowIso,
            }
          : s
      );
      db.version = Date.now();
      saveDB(db);
    }

    // Begin live animation broadcast sequence
    liveState.isDrawing = true;
    liveState.prizeId = prizeId;
    liveState.scheduleId = schedule?.id || null;
    liveState.round = schedule?.roundNumber || round || 1;
    liveState.latestWinner = null;
    liveState.countdown = null;

    broadcastSSE('LIVE_EVENT', {
      type: 'START_DRAW',
      prizeId,
      scheduleId: schedule?.id || null,
      round: schedule?.roundNumber || round || 1,
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

        // Update database: increment drawnQuantity, add winner, ensure schedule locked
        db.prizes = db.prizes.map((p) =>
          p.id === prizeId ? { ...p, drawnQuantity: p.drawnQuantity + 1 } : p
        );

        db.participants = db.participants.map((p) =>
          p.id === chosenParticipant.id ? { ...p, status: 'winner' as const } : p
        );

        if (schedule) {
          db.schedules = db.schedules.map((s: any) =>
            s.id === schedule.id
              ? {
                  ...s,
                  status: 'completed',
                  isLocked: true,
                  manuallyUnlocked: false,
                  drawnAt: nowIso,
                }
              : s
          );
        }

        db.winners = [newWinner, ...db.winners];
        db.version = Date.now();
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
      scheduleLocked: schedule?.id || null,
      message: 'Sorteio iniciado com sucesso e sincronizado em todas as telas!',
    });
  });

  // 6. Admin resets live view
  app.post('/api/live/reset', (_req, res) => {
    liveState = {
      isDrawing: false,
      prizeId: null,
      scheduleId: null,
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

  // 6b. Admin resets prize drawn counts
  app.post('/api/prizes/reset', (req, res) => {
    const { prizeId, clearWinners } = req.body || {};
    db = loadDB();

    if (prizeId === 'all') {
      db.prizes = db.prizes.map((p) => ({ ...p, drawnQuantity: 0 }));
      if (clearWinners) {
        db.winners = [];
      }
    } else if (prizeId) {
      db.prizes = db.prizes.map((p) =>
        p.id === prizeId ? { ...p, drawnQuantity: 0 } : p
      );
      if (clearWinners) {
        db.winners = db.winners.filter((w) => w.prizeId !== prizeId);
      }
    }

    db.version = Date.now();
    saveDB(db);

    // Reset live state as well
    liveState.isDrawing = false;
    liveState.countdown = null;

    broadcastSSE('DATA_UPDATED', db);
    broadcastSSE('LIVE_EVENT', { type: 'LIVE_RESET' });

    console.log(`[PRIZE-RESET] Successfully reset prize: ${prizeId} (clearWinners: ${!!clearWinners})`);
    res.json({ success: true, prizes: db.prizes, winners: db.winners });
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
