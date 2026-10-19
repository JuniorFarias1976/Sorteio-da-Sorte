export interface Participant {
  id: string;
  name: string;
  email: string;
  phone: string;
  document: string; // CPF or ID
  city: string;
  ticketNumber: string; // e.g., "74892" or "LUCK-1092"
  createdAt: string;
  status: 'active' | 'winner' | 'banned';
  banReason?: string;
  banDate?: string;
  notes?: string;
}

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
  participantCity?: string;
  prizeId: string;
  prizeTitle: string;
  wonAt: string;
  validationHash: string;
}

export interface NotificationLog {
  id: string;
  channel: 'whatsapp' | 'email' | 'sms';
  recipientCount: number;
  sentAt: string;
  status: 'sent' | 'pending' | 'failed';
  messageTemplate: string;
  eventTitle: string;
  timingLabel: string; // e.g. "24 horas antes", "1 hora antes", "Imediato"
}

export interface NotificationSettings {
  autoNotify24h: boolean;
  autoNotify1h: boolean;
  autoNotify15m: boolean;
  autoNotifyStart: boolean;
  whatsappEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  messageTemplate: string;
}

export interface BrandConfig {
  companyName: string;
  companySlogan: string;
  logoUrl: string;
  primaryColor: string; // e.g. '#f59e0b'
  secondaryColor: string; // e.g. '#d97706'
  accentColor: string; // e.g. '#10b981'
  backgroundTheme: 'dark' | 'midnight' | 'slate';
  raffleUrl: string;
  contactEmail: string;
  termsAndConditions: string;
  forceResetLogo?: boolean;

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
  id: 'name' | 'email' | 'phone' | 'document' | 'city';
  label: string;
  placeholder: string;
  enabled: boolean;
  required: boolean;
}

export interface FormFieldsConfig {
  name: ParticipantFieldConfig;
  email: ParticipantFieldConfig;
  phone: ParticipantFieldConfig;
  document: ParticipantFieldConfig;
  city: ParticipantFieldConfig;
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
  includeHash: boolean;
  includeDate: boolean;
}

