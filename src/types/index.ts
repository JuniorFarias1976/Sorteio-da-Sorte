export interface Participant {
  id: string;
  name: string;
  email: string;
  phone: string;
  document?: string;
  clinic?: string; // Clínica / Consultório
  city: string;
  specialty?: string; // Especialidade odontológica (ou múltiplas separadas por vírgula)
  specialties?: string[]; // Lista de especialidades selecionadas
  specialtyOther?: string; // Outra especialidade indicada
  wantsLacerVisit?: boolean; // Gostaria que um representante da Lacer visitasse a sua clínica
  marketingConsent?: boolean; // Autorização para informação sobre produtos, novidades, visitas
  termsAccepted?: boolean; // Declaração de leitura e aceitação do regulamento e privacidade
  ticketNumber: string; // e.g., "74892"
  createdAt: string;
  status: 'active' | 'winner' | 'banned';
  banReason?: string;
  banDate?: string;
  notes?: string;
}

export const DENTAL_SPECIALTIES = [
  'Cirurgia / Implantologia',
  'Periodontologia',
  'Ortodontia',
  'Odontopediatria',
  'Odontologia Geral',
  'Prótese Dentária',
  'Endodontia',
  'Odontologia Restauradora',
  'Higienista Oral',
  'Assistente Dentário / Gestor de Clínica',
  'Outra',
] as const;

export type DentalSpecialty = typeof DENTAL_SPECIALTIES[number];

export interface Prize {
  id: string;
  title: string;
  description: string;
  totalQuantity: number;
  drawnQuantity: number;
  imageUrl?: string;
  estimatedValue: number;
  drawOrder: number;
}

export interface DrawSchedule {
  id: string;
  title: string;
  description: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:mm
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  prizeIds: string[];
  createdAt: string;
  roundNumber?: number; // 1, 2, 3 or 4
  roundLabel?: string; // e.g. "1ª Rodada - 10:00"
}

export interface DrawWinner {
  id: string;
  drawId?: string;
  drawTitle: string;
  participantId: string;
  participantName: string;
  participantEmail: string;
  participantPhone: string;
  participantTicket: string;
  participantDocument: string;
  participantClinic?: string;
  participantCity?: string;
  participantSpecialty?: string;
  prizeId: string;
  prizeTitle: string;
  wonAt: string;
  validationHash: string;
}

export interface NotificationLog {
  id: string;
  channel: 'email' | 'sms';
  recipientCount: number;
  sentAt: string;
  status: 'sent' | 'pending' | 'failed';
  messageTemplate: string;
  eventTitle: string;
  timingLabel: string;
}

export interface NotificationSettings {
  autoNotify24h: boolean;
  autoNotify1h: boolean;
  autoNotify15m: boolean;
  autoNotifyStart: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  messageTemplate: string;
}

export interface BrandConfig {
  companyName: string;
  companySlogan: string;
  logoUrl: string;
  primaryColor: string; // e.g. '#E30613' (Lacer Red)
  secondaryColor: string; // e.g. '#B91C1C'
  accentColor: string; // e.g. '#FFFFFF'
  backgroundColor?: string; // e.g. '#FFFFFF' (White background)
  textColor?: string; // e.g. '#0F172A' (Text color)
  cardBackgroundColor?: string; // Optional card bg override
  backgroundTheme: 'white' | 'light' | 'dark' | 'midnight' | 'slate';
  contactEmail: string;
  termsAndConditions: string;
  forceResetLogo?: boolean;
  adminPassword?: string;
  raffleUrl?: string;

  // Total application texts control
  heroBadgeText?: string;
  roundsBannerTitle?: string;
  roundsBannerSubtitle?: string;
  showRoundsBanner?: boolean;
  formTitle?: string;
  formSubtitle?: string;
  formButtonText?: string;
  prizesSectionTitle?: string;
  searchSectionTitle?: string;
  searchSectionSubtitle?: string;
  ticketNotice?: string;
  ticketModalTitle?: string;
  ticketModalSubtitle?: string;
}

export interface ParticipantFieldConfig {
  id: 'name' | 'email' | 'phone' | 'document' | 'city' | 'clinic' | 'specialty';
  label: string;
  placeholder: string;
  enabled: boolean;
  required: boolean;
}

export interface FormFieldsConfig {
  name: ParticipantFieldConfig;
  email: ParticipantFieldConfig;
  phone: ParticipantFieldConfig;
  clinic: ParticipantFieldConfig;
  city: ParticipantFieldConfig;
  specialty: ParticipantFieldConfig;
  document?: ParticipantFieldConfig;
}

export interface QRCodePosterConfig {
  title: string;
  subtitle: string;
  step1: string;
  step2: string;
  step3: string;
  footerLeft: string;
  footerRight: string;
  showDate: boolean;
  showSteps: boolean;
  prizeHighlight?: string;
  scheduleHighlight?: string;
}

export interface ReportPdfConfig {
  title: string;
  subtitle: string;
  protocolPrefix: string;
  statementText: string;
  organizerSignTitle: string;
  auditorSignTitle: string;
  includeTicket: boolean;
  includeWinnerName: boolean;
  includePrize: boolean;
  includePhone: boolean;
  includeDocument: boolean;
  includeEmail: boolean;
  includeClinic?: boolean;
  includeSpecialty?: boolean;
  includeHash: boolean;
  includeDate: boolean;
}

