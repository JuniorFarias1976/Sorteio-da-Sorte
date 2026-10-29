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

// Official Lacer Corporate Logo SVG (distinctive Lacer shield and clean bold typography)
export const DEFAULT_BRAND_LOGO = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 80" fill="none"><path d="M42 10 C76 11, 80 42, 69 66 C52 76, 24 74, 14 52 C4 28, 16 10, 42 10 Z" stroke="%23E30613" stroke-width="4.5" fill="%23E30613" fill-opacity="0.15"/><text x="42" y="49" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-weight="900" font-size="19" fill="%23E30613" letter-spacing="0.5">Lacer</text><text x="82" y="51" font-family="system-ui,-apple-system,sans-serif" font-weight="900" font-size="28" fill="%23FFFFFF" letter-spacing="1.2">LACER</text></svg>`;

export function isLightColor(hex?: string): boolean {
  if (!hex) return true;
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  if (clean.length !== 6) return true;
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  // Standard perceived luminance
  const luminance = (r * 299 + g * 587 + b * 114) / 1000;
  return luminance > 150;
}

export const DEFAULT_BRAND: BrandConfig = {
  companyName: 'Lacer - Sorteio OMD 2026',
  companySlogan: 'Higiene e Saúde Oral • Stand Lacer',
  logoUrl: DEFAULT_BRAND_LOGO,
  primaryColor: '#E30613', // Lacer Red
  secondaryColor: '#B91C1C', // Dark Lacer Red
  accentColor: '#FFFFFF', // Clean White
  backgroundColor: '#FFFFFF', // Corporate White Background
  textColor: '#0F172A', // Corporate Slate Text
  cardBackgroundColor: '#FFFFFF',
  backgroundTheme: 'white',
  raffleUrl: typeof window !== 'undefined' ? window.location.origin : 'https://sorteiolive.app',
  contactEmail: 'contacto@lacer.pt',
  adminPassword: 'admin',
  termsAndConditions: 'Sorteio autorizado e auditado em tempo real. Cada participante concorre com os seus bilhetes únicos gerados no momento da inscrição. Os vencedores devem apresentar documento oficial de identificação com fotografia e comprovar a posse do número sorteado no prazo de até 30 dias corridos.',
  roundsBannerTitle: '2 Sorteios Oficiais por Dia',
  roundsBannerSubtitle: 'O seu bilhete concorre automaticamente em todas as rondas e datas programadas!',
  showRoundsBanner: true,
  showNavbar: false, // Ocultar a barra de navegação superior por padrão (solicitado pelo utilizador)
  heroLogoSize: 'large', // Logótipo oficial central com tamanho maior
  showHeroTitle: false, // Mantém apenas o logótipo no cabeçalho como solicitado
  showNavbarBrandText: false, // Mantém apenas o logótipo na barra de navegação
  showNavbarParticipateButton: false, // Remove o botão de participar da barra superior
  formTitle: 'Garanta o seu Bilhete da Sorte',
  formSubtitle: 'Preencha os seus dados reais para receber a confirmação e o seu número',
  formButtonText: 'Participar do sorteio',
  prizesSectionTitle: 'Prémios Desta Edição',
  searchSectionTitle: 'Já se inscreveu? Consulte os seus Bilhetes',
  searchSectionSubtitle: 'Insira o seu NIF, telemóvel, e-mail ou bilhete para verificar os seus números registados',
  ticketNotice: 'Validação única: limite de 1 inscrição por e-mail',
  heroBadgeText: '',
  ticketModalTitle: 'INSCRIÇÃO CONFIRMADA COM SUCESSO!',
  ticketModalSubtitle: 'O Seu Bilhete Oficial',
};

export const DEFAULT_PRIZES: Prize[] = [
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
];

export const DEFAULT_WINNERS: DrawWinner[] = [];

export const DEFAULT_NOTIFICATIONS: NotificationLog[] = [];

export const DEFAULT_SETTINGS: NotificationSettings = {
  autoNotify24h: false,
  autoNotify1h: false,
  autoNotify15m: false,
  autoNotifyStart: false,
  emailEnabled: false,
  smsEnabled: false,
  messageTemplate: '',
};

export const DEFAULT_FORM_FIELDS: FormFieldsConfig = {
  name: { id: 'name', label: 'Nome completo', placeholder: 'Ex: Dr. João Silva', enabled: true, required: true },
  email: { id: 'email', label: 'E-mail profissional', placeholder: 'joao.silva@clinica.pt', enabled: true, required: true },
  phone: { id: 'phone', label: 'Telefone', placeholder: '912 345 678', enabled: true, required: true },
  clinic: { id: 'clinic', label: 'Clínica / Consultório', placeholder: 'Nome da Clínica ou Consultório', enabled: true, required: false },
  city: { id: 'city', label: 'Cidade', placeholder: 'Ex: Lisboa, Porto, Coimbra...', enabled: true, required: true },
  specialty: { id: 'specialty', label: 'Especialidade', placeholder: '', enabled: true, required: true },
  document: { id: 'document', label: 'NIF ou Cédula Profissional', placeholder: '', enabled: false, required: false },
};

export const DEFAULT_POSTER_CONFIG: QRCodePosterConfig = {
  title: 'PARTICIPE NO NOSSO GRANDE SORTEIO!',
  subtitle: 'Habilite-se a prémios incríveis transmitidos 100% em direto!',
  step1: 'Aponte a câmara do seu telemóvel para o Código QR acima.',
  step2: 'Preencha os seus dados reais e receba o seu Número da Sorte oficial.',
  step3: 'Assista à transmissão em direto e confirme se foi premiado!',
  footerLeft: 'Inscrição 100% Gratuita',
  footerRight: 'Sorteio Seguro & Auditado',
  showDate: true,
  showSteps: true,
};

export const DEFAULT_REPORT_CONFIG: ReportPdfConfig = {
  title: 'ATA E AUDITORIA OFICIAL DE SORTEIO',
  subtitle: 'RELATÓRIO CONSOLIDADO DE VENCEDORES HOMOLOGADOS',
  protocolPrefix: 'LACER-',
  statementText: 'Certificamos que o sorteio foi realizado em tempo real utilizando algoritmo pseudo-aleatório criptográfico auditável sem duplicidade ou favorecimento, respeitando integralmente as regras do regulamento oficial da Lacer.',
  organizerSignTitle: 'Assinatura do Responsável Lacer / Direção',
  auditorSignTitle: 'Assinatura da Comissão de Auditoria',
  includeTicket: true,
  includeWinnerName: true,
  includePrize: true,
  includePhone: true,
  includeDocument: false,
  includeClinic: true,
  includeSpecialty: true,
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

  getFormFields: () => {
    const loaded = loadFromStorage<FormFieldsConfig>(STORAGE_KEYS.FORM_FIELDS, DEFAULT_FORM_FIELDS);
    return { ...DEFAULT_FORM_FIELDS, ...loaded };
  },
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

