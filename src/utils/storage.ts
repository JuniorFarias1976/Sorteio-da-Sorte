import { 
  Participant, 
  Prize, 
  DrawSchedule, 
  DrawWinner, 
  NotificationLog, 
  NotificationSettings, 
  BrandConfig,
  FormFieldsConfig,
  QRCodePosterConfig,
  ReportPdfConfig 
} from '../types';

const STORAGE_KEYS = {
  PARTICIPANTS: 'sorteiolive_participants_v1',
  PRIZES: 'sorteiolive_prizes_v1',
  SCHEDULES: 'sorteiolive_schedules_v1',
  WINNERS: 'sorteiolive_winners_v1',
  NOTIFICATIONS: 'sorteiolive_notifications_v1',
  SETTINGS: 'sorteiolive_settings_v1',
  BRAND: 'sorteiolive_brand_v1',
  FORM_FIELDS: 'sorteiolive_form_fields_v1',
  POSTER: 'sorteiolive_poster_v1',
  REPORT: 'sorteiolive_report_v1',
};

// Default high-quality SVG Logo (Golden Trophy with Star & Ribbon)
export const DEFAULT_BRAND_LOGO = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="48" fill="%230f172a" stroke="%23f59e0b" stroke-width="4"/><path d="M32 30h36v18c0 10-8 18-18 18s-18-8-18-18V30z" fill="%23f59e0b"/><path d="M26 34c-4 0-8 4-8 9s4 9 8 9h6v-6h-6c-1 0-2-1-2-3s1-3 2-3h6v-6h-6zm48 0h-6v6h6c1 0 2 1 2 3s-1 3-2 3h-6v6h6c4 0 8-4 8-9s-4-9-8-9z" fill="%23fbbf24"/><path d="M46 66h8v12h-8z" fill="%23d97706"/><path d="M36 78h28v6H36z" fill="%23f59e0b"/><polygon points="50,37 52.5,43 59,43.5 54,48 55.5,54.5 50,51 44.5,54.5 46,48 41,43.5 47.5,43" fill="%23ffffff"/></svg>`;

export const DEFAULT_BRAND: BrandConfig = {
  companyName: 'Megavolt Prêmios & Sorteios',
  companySlogan: 'Transparência, emoção e grandes prêmios ao vivo',
  logoUrl: DEFAULT_BRAND_LOGO,
  primaryColor: '#f59e0b', // Amber 500
  secondaryColor: '#d97706', // Amber 600
  accentColor: '#10b981', // Emerald 500
  backgroundTheme: 'dark',
  raffleUrl: window.location.origin,
  contactEmail: 'contato@megavoltsorteios.com.br',
  termsAndConditions: 'Sorteio autorizado e auditado em tempo real. Cada participante concorre com seus bilhetes únicos gerados no momento da inscrição. Vencedores devem apresentar documento oficial com foto e comprovar posse do número sorteado no prazo de até 30 dias corridos.',
};

export const DEFAULT_PRIZES: Prize[] = [
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
    drawnQuantity: 1,
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
];

export const DEFAULT_PARTICIPANTS: Participant[] = [];

export const DEFAULT_SCHEDULES: DrawSchedule[] = [
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
];

export const DEFAULT_WINNERS: DrawWinner[] = [];

export const DEFAULT_NOTIFICATIONS: NotificationLog[] = [
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
  {
    id: 'notif-2',
    channel: 'email',
    recipientCount: 13,
    sentAt: '2026-10-11T19:45:00Z',
    status: 'sent',
    timingLabel: '15 minutos antes',
    eventTitle: 'Sorteio Prévia de Aquecimento',
    messageTemplate: 'Atenção {nome}: A sala ao vivo está aberta! Conecte-se agora para acompanhar a roleta rodar: {link_sorteio}',
  },
];

export const DEFAULT_SETTINGS: NotificationSettings = {
  autoNotify24h: true,
  autoNotify1h: true,
  autoNotify15m: true,
  autoNotifyStart: true,
  whatsappEnabled: true,
  emailEnabled: true,
  smsEnabled: false,
  messageTemplate: 'Olá {nome}! 🎟️ Seu número da sorte é #{bilhete}. O sorteio "{evento}" começará em breve com prêmios incríveis! Assista ao vivo: {link_sorteio}',
};

export const DEFAULT_FORM_FIELDS: FormFieldsConfig = {
  name: { id: 'name', label: 'Nome Completo', placeholder: 'Ex: Ana Maria da Silva', enabled: true, required: true },
  email: { id: 'email', label: 'E-mail', placeholder: 'seuemail@exemplo.com', enabled: true, required: true },
  phone: { id: 'phone', label: 'WhatsApp / Telefone', placeholder: '(11) 99999-9999', enabled: true, required: true },
  document: { id: 'document', label: 'CPF ou Documento', placeholder: '000.000.000-00', enabled: true, required: false },
  city: { id: 'city', label: 'Cidade / Estado', placeholder: 'Ex: São Paulo - SP', enabled: true, required: false },
};

export const DEFAULT_POSTER_CONFIG: QRCodePosterConfig = {
  title: 'PARTICIPE DO NOSSO GRANDE SORTEIO!',
  subtitle: 'Concorra a prêmios incríveis transmitidos 100% ao vivo!',
  step1: 'Aponte a câmera do seu celular para o QR Code acima.',
  step2: 'Preencha seus dados reais e receba seu Número da Sorte oficial.',
  step3: 'Assista à transmissão ao vivo e confira se foi premiado!',
  footerLeft: 'Inscrição 100% Gratuita',
  footerRight: 'Sorteio Seguro & Auditado',
  showDate: true,
  showSteps: true,
};

export const DEFAULT_REPORT_CONFIG: ReportPdfConfig = {
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
};

// Storage Helpers with LocalStorage persistence
export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item) as T;
  } catch (err) {
    console.error(`Failed to load ${key} from storage:`, err);
    return defaultValue;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to save ${key} to storage:`, err);
  }
}

export const StorageService = {
  getParticipants: () => loadFromStorage<Participant[]>(STORAGE_KEYS.PARTICIPANTS, DEFAULT_PARTICIPANTS),
  saveParticipants: (data: Participant[]) => saveToStorage(STORAGE_KEYS.PARTICIPANTS, data),

  getPrizes: () => loadFromStorage<Prize[]>(STORAGE_KEYS.PRIZES, DEFAULT_PRIZES),
  savePrizes: (data: Prize[]) => saveToStorage(STORAGE_KEYS.PRIZES, data),

  getSchedules: () => loadFromStorage<DrawSchedule[]>(STORAGE_KEYS.SCHEDULES, DEFAULT_SCHEDULES),
  saveSchedules: (data: DrawSchedule[]) => saveToStorage(STORAGE_KEYS.SCHEDULES, data),

  getWinners: () => loadFromStorage<DrawWinner[]>(STORAGE_KEYS.WINNERS, DEFAULT_WINNERS),
  saveWinners: (data: DrawWinner[]) => saveToStorage(STORAGE_KEYS.WINNERS, data),

  getNotifications: () => loadFromStorage<NotificationLog[]>(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS),
  saveNotifications: (data: NotificationLog[]) => saveToStorage(STORAGE_KEYS.NOTIFICATIONS, data),

  getSettings: () => loadFromStorage<NotificationSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS),
  saveSettings: (data: NotificationSettings) => saveToStorage(STORAGE_KEYS.SETTINGS, data),

  getBrand: () => loadFromStorage<BrandConfig>(STORAGE_KEYS.BRAND, DEFAULT_BRAND),
  saveBrand: (data: BrandConfig) => saveToStorage(STORAGE_KEYS.BRAND, data),

  getFormFields: () => loadFromStorage<FormFieldsConfig>(STORAGE_KEYS.FORM_FIELDS, DEFAULT_FORM_FIELDS),
  saveFormFields: (data: FormFieldsConfig) => saveToStorage(STORAGE_KEYS.FORM_FIELDS, data),

  getPosterConfig: () => loadFromStorage<QRCodePosterConfig>(STORAGE_KEYS.POSTER, DEFAULT_POSTER_CONFIG),
  savePosterConfig: (data: QRCodePosterConfig) => saveToStorage(STORAGE_KEYS.POSTER, data),

  getReportConfig: () => loadFromStorage<ReportPdfConfig>(STORAGE_KEYS.REPORT, DEFAULT_REPORT_CONFIG),
  saveReportConfig: (data: ReportPdfConfig) => saveToStorage(STORAGE_KEYS.REPORT, data),

  resetToDefault: () => {
    localStorage.removeItem(STORAGE_KEYS.PARTICIPANTS);
    localStorage.removeItem(STORAGE_KEYS.PRIZES);
    localStorage.removeItem(STORAGE_KEYS.SCHEDULES);
    localStorage.removeItem(STORAGE_KEYS.WINNERS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.BRAND);
    localStorage.removeItem(STORAGE_KEYS.FORM_FIELDS);
    localStorage.removeItem(STORAGE_KEYS.POSTER);
    localStorage.removeItem(STORAGE_KEYS.REPORT);
  },
};

