import React, { useState, useEffect } from 'react';
import { Participant, Prize, DrawSchedule, BrandConfig, FormFieldsConfig, DENTAL_SPECIALTIES } from '../types';
import { 
  Ticket, 
  Search, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  Gift, 
  ShieldCheck, 
  Copy, 
  Sparkles, 
  AlertCircle,
  QrCode,
  Trophy,
  ArrowRight,
  AlertTriangle,
  Check,
  FileText,
  ExternalLink,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DEFAULT_FORM_FIELDS, StorageService, DEFAULT_BRAND_LOGO, isLightColor } from '../utils/storage';
import { FirestoreService } from '../utils/firestoreService';
import { ApiService } from '../utils/api';
import { exportRegulationPDF } from '../utils/export';

interface PublicRaffleViewProps {
  brand: BrandConfig;
  prizes: Prize[];
  nextSchedule?: DrawSchedule;
  schedules?: DrawSchedule[];
  participants: Participant[];
  formFields?: FormFieldsConfig;
  onRegisterParticipant: (participant: Participant) => void;
  onGoToLive: () => void;
  onUpdateBrand?: (brand: BrandConfig) => void;
  isAdmin?: boolean;
}

export const PublicRaffleView: React.FC<PublicRaffleViewProps> = ({
  brand,
  prizes,
  nextSchedule,
  schedules = [],
  participants,
  formFields = DEFAULT_FORM_FIELDS,
  onRegisterParticipant,
  onGoToLive,
  onUpdateBrand,
  isAdmin = false,
}) => {
  const formatScheduleFullDate = (dateStr?: string) => {
    if (!dateStr) return 'Data Oficial';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString('pt-PT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Group schedules by scheduledDate to display 2 draws per day
  const schedulesByDate = schedules.reduce<Record<string, DrawSchedule[]>>((acc, sch) => {
    const dateKey = sch.scheduledDate || '2026-10-22';
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(sch);
    return acc;
  }, {});

  const scheduledDates = Object.keys(schedulesByDate).sort();
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [clinic, setClinic] = useState('');
  const [city, setCity] = useState('');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [specialtyOther, setSpecialtyOther] = useState('');
  const [wantsLacerVisit, setWantsLacerVisit] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [document, setDocument] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  const handleToggleSpecialty = (spec: string) => {
    setSelectedSpecialties((prev) => {
      if (prev.includes(spec)) {
        return prev.filter((s) => s !== spec);
      } else {
        return [...prev, spec];
      }
    });
  };

  // Success ticket modal
  const [newlyCreatedTicket, setNewlyCreatedTicket] = useState<Participant | null>(null);
  const [copiedTicket, setCopiedTicket] = useState(false);

  // Trigger celebration confetti when participant successfully registers
  useEffect(() => {
    if (newlyCreatedTicket) {
      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#2563eb', '#10b981', '#f59e0b', '#ffffff'],
        });
      } catch {}
    }
  }, [newlyCreatedTicket]);

  const handleCopyTicket = (ticketNum: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(ticketNum).then(() => {
        setCopiedTicket(true);
        setTimeout(() => setCopiedTicket(false), 2500);
      });
    }
  };

  // Duplicate email restriction modal
  const [duplicateEmailError, setDuplicateEmailError] = useState<Participant | null>(null);

  // Terms and conditions modal
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Search Ticket State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Participant[] | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Phone handling - clean and flexible for Portugal (9 digits) and international numbers
  const handlePhoneChange = (val: string) => {
    // Keep digits, spaces and +
    const clean = val.replace(/[^\d+ -]/g, '').slice(0, 16);
    setPhone(clean);
  };

  // Document handling - flexible for NIF (9 digits) and Cartão de Cidadão / BI
  const handleDocumentChange = (val: string) => {
    const clean = val.replace(/[^\w -]/g, '').slice(0, 18);
    setDocument(clean);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationWarning(null);

    // Dynamic field validation based on admin configuration
    if (formFields.name.enabled && formFields.name.required && !name.trim()) {
      setValidationWarning(`Por favor, preencha o campo obrigatório: ${formFields.name.label}`);
      return;
    }
    if (formFields.email.enabled && formFields.email.required && !email.trim()) {
      setValidationWarning(`Por favor, preencha o campo obrigatório: ${formFields.email.label}`);
      return;
    }
    if (formFields.phone.enabled && formFields.phone.required && !phone.trim()) {
      setValidationWarning(`Por favor, preencha o campo obrigatório: ${formFields.phone.label}`);
      return;
    }
    if (formFields.clinic?.enabled && formFields.clinic?.required && !clinic.trim()) {
      setValidationWarning(`Por favor, preencha o campo obrigatório: ${formFields.clinic.label}`);
      return;
    }
    if (formFields.city?.enabled && formFields.city?.required && !city.trim()) {
      setValidationWarning(`Por favor, preencha o campo obrigatório: ${formFields.city.label}`);
      return;
    }
    // Especialidade is always required for dental professionals (at least 1 option)
    if (selectedSpecialties.length === 0) {
      setValidationWarning('Por favor, selecione pelo menos uma Especialidade Odontológica.');
      return;
    }
    if (selectedSpecialties.includes('Outra') && !specialtyOther.trim()) {
      setValidationWarning('Por favor, indique a sua especialidade no campo "Outra".');
      return;
    }
    if (formFields.document && formFields.document.enabled && formFields.document.required && !document.trim()) {
      setValidationWarning(`Por favor, preencha o campo obrigatório: ${formFields.document.label}`);
      return;
    }
    if (!acceptedTerms) {
      setValidationWarning('É obrigatório declarar que leu e aceita o regulamento e a política de privacidade da Lacer.');
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Client-side rapid duplicate check
    if (normalizedEmail) {
      const existingUser = participants.find(
        (p) => p.email && p.email.toLowerCase().trim() === normalizedEmail
      );
      if (existingUser) {
        setDuplicateEmailError(existingUser);
        return;
      }
    }

    setIsSubmitting(true);

    const processedSpecialties = selectedSpecialties.map((s) =>
      s === 'Outra' && specialtyOther.trim() ? `Outra: ${specialtyOther.trim()}` : s
    );
    const finalSpecialty = processedSpecialties.join(', ');

    try {
      // 2. Server-side registration & authoritative duplication check
      const result = await ApiService.registerParticipant({
        name: name.trim() || 'Participante',
        email: normalizedEmail,
        phone: phone.trim(),
        document: document.trim(),
        clinic: clinic.trim(),
        city: city.trim(),
        specialty: finalSpecialty,
        specialties: processedSpecialties,
        specialtyOther: specialtyOther.trim(),
        wantsLacerVisit,
        marketingConsent,
        termsAccepted: acceptedTerms,
      });

      if (!result.success) {
        if (result.error === 'DUPLICATE_EMAIL' && result.existingParticipant) {
          setDuplicateEmailError(result.existingParticipant);
          return;
        }

        // Check if already in local participants
        const localDuplicate = participants.find(
          (p) => p.email && p.email.toLowerCase().trim() === normalizedEmail
        );
        if (localDuplicate) {
          setDuplicateEmailError(localDuplicate);
          return;
        }

        // Resilient fallback for static hosting (e.g. Vercel) or serverless environments
        console.warn('Backend server unavailable or static host. Registering participant locally via fallback.');
        let ticket = Math.floor(10000 + Math.random() * 90000).toString();
        while (participants.some((p) => p.ticketNumber === ticket)) {
          ticket = Math.floor(10000 + Math.random() * 90000).toString();
        }

        const fallbackParticipant: Participant = {
          id: `part-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          name: name.trim() || 'Participante',
          email: normalizedEmail,
          phone: phone.trim() || 'Não informado',
          document: document.trim() || '',
          clinic: clinic.trim(),
          city: city.trim() || 'Portugal',
          specialty: finalSpecialty,
          specialtyOther: specialtyOther.trim(),
          wantsLacerVisit,
          marketingConsent,
          termsAccepted: acceptedTerms,
          ticketNumber: ticket,
          createdAt: new Date().toISOString(),
          status: 'active',
        };

        onRegisterParticipant(fallbackParticipant);
        setNewlyCreatedTicket(fallbackParticipant);
        setDuplicateEmailError(null);
        setValidationWarning(null);

        setName('');
        setEmail('');
        setPhone('');
        setClinic('');
        setCity('');
        setSelectedSpecialties([]);
        setSpecialtyOther('');
        setWantsLacerVisit(false);
        setMarketingConsent(false);
        setDocument('');
        setAcceptedTerms(false);
        return;
      }

      const baseParticipant = result.participant!;
      const participant: Participant = {
        ...baseParticipant,
        clinic: (baseParticipant.clinic && baseParticipant.clinic.trim()) || clinic.trim() || '',
        city: (baseParticipant.city && baseParticipant.city.trim()) || city.trim() || 'Portugal',
        specialty: (baseParticipant.specialty && baseParticipant.specialty.trim() && baseParticipant.specialty !== 'Não especificada')
          ? baseParticipant.specialty
          : finalSpecialty,
        specialtyOther: baseParticipant.specialtyOther || specialtyOther.trim(),
        wantsLacerVisit: baseParticipant.wantsLacerVisit !== undefined ? Boolean(baseParticipant.wantsLacerVisit) : Boolean(wantsLacerVisit),
        marketingConsent: baseParticipant.marketingConsent !== undefined ? Boolean(baseParticipant.marketingConsent) : Boolean(marketingConsent),
        termsAccepted: baseParticipant.termsAccepted !== undefined ? Boolean(baseParticipant.termsAccepted) : Boolean(acceptedTerms),
      };

      onRegisterParticipant(participant);
      setNewlyCreatedTicket(participant);
      setDuplicateEmailError(null);
      setValidationWarning(null);

      // Reset Form
      setName('');
      setEmail('');
      setPhone('');
      setClinic('');
      setCity('');
      setSelectedSpecialties([]);
      setSpecialtyOther('');
      setWantsLacerVisit(false);
      setMarketingConsent(false);
      setDocument('');
      setAcceptedTerms(false);
    } catch {
      // Fallback in case of unexpected network failure
      let ticket = Math.floor(10000 + Math.random() * 90000).toString();
      while (participants.some((p) => p.ticketNumber === ticket)) {
        ticket = Math.floor(10000 + Math.random() * 90000).toString();
      }

      const fallbackParticipant: Participant = {
        id: `part-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: name.trim() || 'Participante',
        email: normalizedEmail,
        phone: phone.trim() || 'Não informado',
        document: document.trim() || '',
        clinic: clinic.trim(),
        city: city.trim() || 'Portugal',
        specialty: finalSpecialty,
        specialties: processedSpecialties,
        specialtyOther: specialtyOther.trim(),
        wantsLacerVisit,
        marketingConsent,
        termsAccepted: acceptedTerms,
        ticketNumber: ticket,
        createdAt: new Date().toISOString(),
        status: 'active',
      };

      onRegisterParticipant(fallbackParticipant);
      setNewlyCreatedTicket(fallbackParticipant);
      setDuplicateEmailError(null);
      setValidationWarning(null);

      setName('');
      setEmail('');
      setPhone('');
      setClinic('');
      setCity('');
      setSelectedSpecialties([]);
      setSpecialtyOther('');
      setWantsLacerVisit(false);
      setMarketingConsent(false);
      setDocument('');
      setAcceptedTerms(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearchTickets = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const query = searchQuery.trim().toLowerCase().replace(/[^\w]/g, '');
    const results = participants.filter((p) => {
      const matchDoc = (p.document || '').replace(/[^\w]/g, '').includes(query);
      const matchPhone = (p.phone || '').replace(/[^\w]/g, '').includes(query);
      const matchTicket = (p.ticketNumber || '').toLowerCase().includes(query);
      const matchEmail = (p.email || '').toLowerCase().includes(searchQuery.trim().toLowerCase());
      return matchDoc || matchPhone || matchTicket || matchEmail;
    });

    setSearchResults(results);
    setHasSearched(true);
  };

  const isLight = isLightColor(brand.backgroundColor || '#FFFFFF');
  const appBg = brand.backgroundColor || (isLight ? '#FFFFFF' : '#0B0F19');
  const appTextColor = brand.textColor || (isLight ? '#0F172A' : '#F8FAFC');

  return (
    <div 
      className={`min-h-screen pb-20 transition-colors duration-200 ${
        isLight ? 'bg-white text-slate-900' : 'bg-slate-950 text-slate-100'
      }`}
      style={{ backgroundColor: appBg, color: appTextColor }}
    >
      {/* Hero Header */}
      <section className={`relative overflow-hidden border-b py-12 sm:py-20 px-4 sm:px-6 lg:px-8 text-center transition-colors duration-200 ${
        isLight 
          ? 'border-slate-200 bg-gradient-to-b from-red-50/60 via-white to-white' 
          : 'border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950'
      }`}>
        {/* Glow ambient */}
        <div 
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[350px] rounded-full blur-[120px] opacity-20 pointer-events-none"
          style={{ backgroundColor: brand.primaryColor }}
        ></div>

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Hero Badge */}
          {brand.heroBadgeText && (
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold mb-6 shadow-sm border ${
              isLight 
                ? 'bg-red-50 text-[#E30613] border-red-200' 
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}>
              <Sparkles className="w-3.5 h-3.5 text-[#E30613]" />
              <span>{brand.heroBadgeText}</span>
            </div>
          )}

          {/* Logo */}
          <div className="flex justify-center mb-6">
            {brand.logoUrl ? (
              <img
                src={brand.logoUrl}
                alt={brand.companyName}
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-contain p-2 border-2 shadow-2xl ${
                  isLight ? 'bg-white border-red-100' : 'bg-slate-900 border-slate-700/80'
                }`}
              />
            ) : (
              <div 
                style={{ backgroundColor: brand.primaryColor }}
                className="w-20 h-20 rounded-3xl flex items-center justify-center text-white font-black text-3xl shadow-2xl"
              >
                ★
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-3 mb-3">
            <h1 className={`text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight ${
              isLight ? 'text-slate-950' : 'text-white'
            }`}>
              {brand.companyName || 'Lacer - Sorteio OMD 2026'}
            </h1>
          </div>

          <div className="max-w-2xl mx-auto mb-8">
            {brand.companySlogan !== undefined && brand.companySlogan !== '' ? (
              <p className={`text-base sm:text-xl font-normal leading-relaxed ${
                isLight ? 'text-slate-600' : 'text-slate-300'
              }`}>
                {brand.companySlogan}
              </p>
            ) : null}
          </div>

          {/* Official 2 Draws Per Day Schedule Banner */}
          {brand.showRoundsBanner !== false && (
            <div className={`mt-8 max-w-4xl mx-auto border-2 p-5 sm:p-6 rounded-3xl shadow-2xl backdrop-blur-md text-left transition-colors ${
              isLight 
                ? 'bg-white border-red-200 shadow-red-900/5 text-slate-900' 
                : 'bg-slate-900/95 border-red-600/30 shadow-2xl text-slate-100'
            }`}>
              <div className={`flex flex-wrap items-center justify-between gap-3 border-b pb-3.5 mb-4 ${
                isLight ? 'border-slate-100' : 'border-slate-800'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl border ${
                    isLight ? 'bg-red-50 border-red-200 text-[#E30613]' : 'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}>
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`text-sm sm:text-base font-extrabold uppercase tracking-wider ${
                      isLight ? 'text-slate-950' : 'text-white'
                    }`}>
                      {brand.roundsBannerTitle || '2 Sorteios Oficiais por Dia'}
                    </h3>
                    <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Datas e horários oficiais das rondas de prémios no stand Lacer
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-xl border ${
                    isLight 
                      ? 'bg-red-50 text-[#E30613] border-red-200 font-semibold' 
                      : 'text-red-300 bg-red-500/10 border-red-500/30'
                  }`}>
                    <Calendar className="w-3.5 h-3.5 text-[#E30613]" />
                    <span>{nextSchedule ? `Próximo: ${nextSchedule.scheduledTime} (${nextSchedule.scheduledDate.slice(5)})` : '2 Sorteios / Dia'}</span>
                  </span>
                </div>
              </div>

              {/* Day by Day Grid with 2 Draws per day */}
              <div className="space-y-4">
                {(scheduledDates.length > 0 ? scheduledDates : ['2026-10-22', '2026-10-23']).map((dateStr, dayIndex) => {
                  const daySchedules = schedulesByDate[dateStr] || [
                    { id: `fb-${dayIndex}-1`, title: 'Sorteio Manhã', scheduledTime: '10:00', status: 'scheduled', roundNumber: 1, scheduledDate: dateStr, description: '', prizeIds: [], createdAt: '' },
                    { id: `fb-${dayIndex}-2`, title: 'Sorteio Tarde', scheduledTime: '16:00', status: 'scheduled', roundNumber: 2, scheduledDate: dateStr, description: '', prizeIds: [], createdAt: '' },
                  ];

                  return (
                    <div key={dateStr} className={`border rounded-2xl p-4 transition-colors ${
                      isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-950/70 border-slate-800/90'
                    }`}>
                      {/* Day Header */}
                      <div className={`flex items-center justify-between mb-3 pb-2 border-b ${
                        isLight ? 'border-slate-200/80' : 'border-slate-800/60'
                      }`}>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-lg border font-bold text-xs uppercase font-mono ${
                            isLight ? 'bg-red-50 border-red-200 text-[#E30613]' : 'bg-red-500/15 border-red-500/30 text-red-300'
                          }`}>
                            {dayIndex + 1}º Dia
                          </span>
                          <span className={`text-xs sm:text-sm font-bold capitalize ${
                            isLight ? 'text-slate-900' : 'text-white'
                          }`}>
                            {formatScheduleFullDate(dateStr)}
                          </span>
                        </div>
                        <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          {daySchedules.length} sorteios agendados
                        </span>
                      </div>

                      {/* Draws of the Day (2 draws per day) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {daySchedules.map((sch) => {
                          const isLive = sch.status === 'live';
                          const isCompleted = sch.status === 'completed';
                          const assignedPrize = sch.prizeIds && sch.prizeIds.length > 0 
                            ? prizes.find(p => sch.prizeIds.includes(p.id)) 
                            : null;

                          return (
                            <div
                              key={sch.id}
                              onClick={onGoToLive}
                              className={`p-3.5 rounded-xl border transition-all cursor-pointer group flex items-center justify-between gap-3 ${
                                isLive
                                  ? isLight 
                                    ? 'bg-red-50/90 border-[#E30613] ring-2 ring-red-500/20 shadow-md' 
                                    : 'bg-red-500/20 border-red-500 ring-2 ring-red-500/30'
                                  : isCompleted
                                  ? isLight ? 'bg-slate-100/70 border-slate-200 opacity-60' : 'bg-slate-900/60 border-slate-800/80 opacity-60'
                                  : isLight 
                                    ? 'bg-white border-slate-200 hover:border-[#E30613] hover:shadow-md' 
                                    : 'bg-slate-900/90 border-slate-800 hover:border-red-500/50 hover:bg-slate-850'
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-xs font-bold transition-colors truncate ${
                                    isLight ? 'text-slate-900 group-hover:text-[#E30613]' : 'text-white group-hover:text-red-400'
                                  }`}>
                                    {sch.title}
                                  </span>
                                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ${
                                    isLive 
                                      ? 'bg-[#E30613] text-white animate-pulse'
                                      : isCompleted
                                      ? 'bg-emerald-500/20 text-emerald-600'
                                      : isLight ? 'bg-slate-100 text-slate-700 border border-slate-200' : 'bg-slate-800 text-red-300 border border-slate-700'
                                  }`}>
                                    {isLive ? 'Ao Vivo' : isCompleted ? 'Realizado' : 'Agendado'}
                                  </span>
                                </div>
                                {assignedPrize && (
                                  <p className={`text-[11px] truncate flex items-center gap-1 ${
                                    isLight ? 'text-slate-500' : 'text-slate-400'
                                  }`}>
                                    <Trophy className="w-3 h-3 text-[#E30613] shrink-0" />
                                    <span className="truncate">{assignedPrize.title}</span>
                                  </p>
                                )}
                              </div>

                              <div className="text-right shrink-0">
                                <span className={`text-[10px] uppercase tracking-wider block font-semibold ${
                                  isLight ? 'text-slate-500' : 'text-slate-400'
                                }`}>
                                  Horário
                                </span>
                                <span className={`text-xl sm:text-2xl font-mono font-black text-[#E30613] transition-colors`}>
                                  {sch.scheduledTime}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className={`mt-4 pt-3 border-t flex flex-wrap items-center justify-between gap-2 text-xs ${
                isLight ? 'border-slate-100 text-slate-500' : 'border-slate-800/80 text-slate-400'
              }`}>
                <span className="text-[11px]">{brand.roundsBannerSubtitle || 'O seu bilhete concorre automaticamente em todas as rondas e datas programadas!'}</span>
                <button
                  onClick={onGoToLive}
                  className="text-[#E30613] hover:underline font-bold flex items-center gap-1.5 text-xs cursor-pointer group transition-colors"
                >
                  <span>Aceder à Transmissão em Direto</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Registration Form + Search Bilhetes (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          {/* Card: Formulário de Inscrição */}
          <div className={`border-2 rounded-3xl p-6 sm:p-8 shadow-xl transition-colors ${
            isLight ? 'bg-white border-red-100/90 text-slate-900 shadow-red-950/5' : 'bg-slate-900/90 border-slate-800 text-slate-100 shadow-xl'
          }`}>
            <div className="flex items-center gap-3 mb-6">
              <div 
                style={{ backgroundColor: `${brand.primaryColor}15`, color: brand.primaryColor }}
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold"
              >
                <Ticket className="w-5 h-5" />
              </div>
              <div>
                <h2 className={`text-xl sm:text-2xl font-bold ${isLight ? 'text-slate-950' : 'text-white'}`}>
                  {brand.formTitle || 'Garanta o seu Bilhete da Sorte'}
                </h2>
                <p className={`text-xs sm:text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  {brand.formSubtitle || 'Preencha os seus dados reais para receber a confirmação e o seu número'}
                </p>
              </div>
            </div>

            <form onSubmit={handleRegister} className="space-y-4" autoComplete="off">
              {/* Duplicate Email Warning Banner */}
              {duplicateEmailError && (
                <div className="p-4 rounded-2xl bg-red-950/40 border-2 border-red-500/50 text-red-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-sm text-red-400">
                      <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                      <span>ATENÇÃO: E-MAIL JÁ REGISTADO NO SISTEMA!</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDuplicateEmailError(null)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-xs text-slate-300">
                    O e-mail <strong className="text-white">{duplicateEmailError.email}</strong> já possui inscrição confirmada neste sorteio. Cada participante só pode se cadastrar <strong>uma única vez</strong>.
                  </p>
                  <div className="p-3 bg-slate-950 rounded-xl border border-red-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block font-semibold">
                        Seu Bilhete Cadastrado:
                      </span>
                      <span className="text-xl font-black font-mono text-red-400">
                        #{duplicateEmailError.ticketNumber}
                      </span>
                    </div>
                    <div className="text-right text-xs">
                      <p className="font-bold text-white">{duplicateEmailError.name}</p>
                      <p className="text-[11px] text-emerald-400">✓ Concorrendo em todos os sorteios programados</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setNewlyCreatedTicket(duplicateEmailError);
                        setDuplicateEmailError(null);
                      }}
                      className="px-3 py-1.5 bg-[#E30613] text-white rounded-lg text-xs font-bold hover:bg-[#C80510] transition-colors"
                    >
                      Visualizar Meu Bilhete
                    </button>
                  </div>
                </div>
              )}

              {/* Validation Warning */}
              {validationWarning && (
                <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-500/50 text-red-200 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{validationWarning}</span>
                  </div>
                  <button type="button" onClick={() => setValidationWarning(null)} className="text-red-400 hover:text-white">✕</button>
                </div>
              )}

              {/* SEÇÃO 1: Dados de contacto */}
              <div className="space-y-4">
                <div className={`border-b pb-2 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                  <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
                    isLight ? 'text-[#E30613]' : 'text-red-400'
                  }`}>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                      isLight ? 'bg-red-50 text-[#E30613]' : 'bg-red-500/20 text-red-400'
                    }`}>1</span>
                    <span>Dados de contacto</span>
                  </h4>
                </div>

                {/* Nome completo */}
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                    isLight ? 'text-slate-700' : 'text-slate-300'
                  }`}>
                    Nome completo <span className="text-[#E30613]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={formFields.name.placeholder || 'Ex: Dr. João Silva'}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    className={`w-full rounded-xl px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#E30613] ${
                      isLight 
                        ? 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#E30613]' 
                        : 'bg-slate-950 border border-slate-700/80 text-white placeholder-slate-600 focus:border-red-500'
                    }`}
                  />
                </div>

                {/* E-mail profissional e Telefone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                      isLight ? 'text-slate-700' : 'text-slate-300'
                    }`}>
                      E-mail profissional <span className="text-[#E30613]">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (duplicateEmailError) setDuplicateEmailError(null);
                      }}
                      placeholder={formFields.email.placeholder || 'joao.silva@clinica.pt'}
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      className={`w-full rounded-xl px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#E30613] ${
                        duplicateEmailError 
                          ? 'border-red-500 ring-2 ring-red-500/20' 
                          : isLight 
                          ? 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#E30613]' 
                          : 'bg-slate-950 border border-slate-700/80 text-white placeholder-slate-600 focus:border-red-500'
                      }`}
                    />
                    <span className={`text-[10px] mt-1 block ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                      {brand.ticketNotice || 'Validação única: limite de 1 inscrição por e-mail'}
                    </span>
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                      isLight ? 'text-slate-700' : 'text-slate-300'
                    }`}>
                      Telefone <span className="text-[#E30613]">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder={formFields.phone.placeholder || '912 345 678'}
                      autoComplete="off"
                      className={`w-full rounded-xl px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#E30613] ${
                        isLight 
                          ? 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#E30613]' 
                          : 'bg-slate-950 border border-slate-700/80 text-white placeholder-slate-600 focus:border-red-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Clínica / Consultório e Cidade */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                      isLight ? 'text-slate-700' : 'text-slate-300'
                    }`}>
                      Clínica / Consultório
                    </label>
                    <input
                      type="text"
                      value={clinic}
                      onChange={(e) => setClinic(e.target.value)}
                      placeholder="Nome da Clínica ou Consultório"
                      autoComplete="off"
                      className={`w-full rounded-xl px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#E30613] ${
                        isLight 
                          ? 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#E30613]' 
                          : 'bg-slate-950 border border-slate-700/80 text-white placeholder-slate-600 focus:border-red-500'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                      isLight ? 'text-slate-700' : 'text-slate-300'
                    }`}>
                      Cidade <span className="text-[#E30613]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder={formFields.city.placeholder || 'Ex: Lisboa, Porto, Coimbra...'}
                      autoComplete="off"
                      className={`w-full rounded-xl px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#E30613] ${
                        isLight 
                          ? 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#E30613]' 
                          : 'bg-slate-950 border border-slate-700/80 text-white placeholder-slate-600 focus:border-red-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Document / NIF if enabled */}
                {formFields.document?.enabled && (
                  <div>
                    <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                      isLight ? 'text-slate-700' : 'text-slate-300'
                    }`}>
                      {formFields.document.label} {formFields.document.required ? '*' : <span className="text-slate-400 font-normal lowercase">(opcional)</span>}
                    </label>
                    <input
                      type="text"
                      required={formFields.document.required}
                      value={document}
                      onChange={(e) => handleDocumentChange(e.target.value)}
                      placeholder={formFields.document.placeholder || ''}
                      autoComplete="off"
                      className={`w-full rounded-xl px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#E30613] ${
                        isLight 
                          ? 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#E30613]' 
                          : 'bg-slate-950 border border-slate-700/80 text-white placeholder-slate-600 focus:border-red-500'
                      }`}
                    />
                  </div>
                )}
              </div>

              {/* SEÇÃO 2: Especialidade (Multi-seleção) */}
              <div className={`space-y-3 pt-4 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
                    isLight ? 'text-[#E30613]' : 'text-red-400'
                  }`}>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                      isLight ? 'bg-red-50 text-[#E30613]' : 'bg-red-500/20 text-red-400'
                    }`}>2</span>
                    <span>Especialidade(s)</span>
                    <span className="text-[#E30613]">*</span>
                  </h4>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${
                    isLight ? 'bg-red-50 text-[#E30613] border-red-200' : 'text-red-300 bg-red-500/10 border-red-500/20'
                  }`}>
                    Pode selecionar mais de uma ({selectedSpecialties.length} selecionada{selectedSpecialties.length === 1 ? '' : 's'})
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DENTAL_SPECIALTIES.map((spec) => {
                    const isSelected = selectedSpecialties.includes(spec);
                    return (
                      <label
                        key={spec}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? isLight 
                              ? 'bg-red-50 border-2 border-[#E30613] text-[#E30613] font-bold shadow-sm'
                              : 'bg-red-500/15 border-red-500 text-white font-semibold ring-1 ring-red-500/30 shadow-sm'
                            : isLight 
                              ? 'bg-slate-50 border-slate-200 text-slate-800 hover:border-red-300 hover:bg-red-50/20'
                              : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        <input
                          type="checkbox"
                          value={spec}
                          checked={isSelected}
                          onChange={() => handleToggleSpecialty(spec)}
                          className="w-4 h-4 rounded text-[#E30613] border-slate-300 focus:ring-red-500 cursor-pointer"
                        />
                        <span className="flex-1">{spec}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#E30613] shrink-0" />}
                      </label>
                    );
                  })}
                </div>

                {/* Se 'Outra' for selecionada, campo de texto específico */}
                {selectedSpecialties.includes('Outra') && (
                  <div className="mt-2.5 animate-in fade-in duration-200">
                    <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-1 ${
                      isLight ? 'text-[#E30613]' : 'text-red-400'
                    }`}>
                      Outra Especialidade:
                    </label>
                    <input
                      type="text"
                      required
                      value={specialtyOther}
                      onChange={(e) => setSpecialtyOther(e.target.value)}
                      placeholder="Indique a sua especialidade..."
                      className={`w-full rounded-xl px-4 py-2.5 text-xs transition-all focus:outline-none focus:ring-2 focus:ring-[#E30613] ${
                        isLight 
                          ? 'bg-white border-2 border-red-200 text-slate-900 placeholder-slate-400' 
                          : 'bg-slate-950 border border-red-500/50 text-white placeholder-slate-600'
                      }`}
                    />
                  </div>
                )}
              </div>

              {/* SEÇÃO 3: Visita do representante Lacer */}
              <div className={`pt-4 border-t space-y-2 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                <h4 className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  Gostaria que um representante da Lacer visitasse a sua clínica para apresentar os nossos produtos?
                </h4>
                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer text-xs transition-all ${
                  isLight 
                    ? 'bg-slate-50 border-slate-200 text-slate-700 hover:border-red-300 hover:bg-red-50/20' 
                    : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}>
                  <input
                    type="checkbox"
                    checked={wantsLacerVisit}
                    onChange={(e) => setWantsLacerVisit(e.target.checked)}
                    className="w-4 h-4 rounded text-[#E30613] border-slate-300 focus:ring-red-500"
                  />
                  <span>Sim, gostaria de agendar uma visita.</span>
                </label>
              </div>

              {/* SEÇÃO 4: Consentimentos e Regulamento */}
              <div className={`pt-4 border-t space-y-3.5 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                {/* Consentimento Obrigatório */}
                <div className="space-y-1.5">
                  <label className={`flex items-start gap-3 cursor-pointer text-xs ${
                    isLight ? 'text-slate-700' : 'text-slate-300'
                  }`}>
                    <input
                      type="checkbox"
                      required
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="mt-0.5 w-4 h-4 shrink-0 rounded text-[#E30613] border-slate-300 focus:ring-red-500"
                    />
                    <span className="leading-relaxed">
                      Declaro que li e aceito o regulamento do sorteio e a política de privacidade da Lacer, e autorizo o tratamento dos meus dados pessoais para a gestão da minha participação no sorteio, nos termos da legislação aplicável de proteção de dados. <span className="text-[#E30613] font-bold">*</span>
                    </span>
                  </label>
                  <div className="pl-7 pt-1">
                    <a
                      href="/regulamento.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        try {
                          exportRegulationPDF(brand);
                        } catch (err) {
                          console.error('Error generating PDF:', err);
                        }
                      }}
                      className="text-[#E30613] hover:underline text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer group transition-all"
                      title="Abrir e descarregar documento oficial em formato PDF"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#E30613] group-hover:scale-110 transition-transform shrink-0" />
                      <span>Consulte o regulamento completo do sorteio e a política de privacidade</span>
                      <span className="inline-flex items-center text-[10px] font-mono font-bold bg-red-50 text-[#E30613] border border-red-200 px-1 py-0.2 rounded no-underline">
                        PDF
                      </span>
                      <ExternalLink className="w-3 h-3 text-[#E30613] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
                    </a>
                  </div>
                </div>

                {/* Consentimento Opcional Marketing */}
                <label className={`flex items-start gap-3 cursor-pointer text-xs pt-1 ${
                  isLight ? 'text-slate-600 hover:text-slate-800' : 'text-slate-400 hover:text-slate-300'
                }`}>
                  <input
                    type="checkbox"
                    checked={marketingConsent}
                    onChange={(e) => setMarketingConsent(e.target.checked)}
                    className="mt-0.5 w-4 h-4 shrink-0 rounded text-[#E30613] border-slate-300 focus:ring-red-500"
                  />
                  <span className="leading-relaxed">
                    Autorizo a Lacer a contactar-me para receber informação sobre produtos, novidades, eventos e visitas comerciais.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={!acceptedTerms || isSubmitting}
                className="w-full py-4 px-6 rounded-2xl font-black text-white text-base shadow-xl shadow-red-600/30 bg-[#E30613] hover:bg-[#C80510] active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-5 h-5 fill-current" />
                <span>
                  {isSubmitting 
                    ? 'A REGISTAR PARTICIPAÇÃO...' 
                    : 'Participar do sorteio'}
                </span>
              </button>
            </form>
          </div>

          {/* Nova Tela de Sucesso: Apresentada ao clicar em 'Participar do sorteio' */}
          {newlyCreatedTicket && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
              <div className={`border-2 rounded-3xl p-6 sm:p-10 max-w-2xl w-full shadow-2xl relative my-auto animate-in zoom-in-95 duration-200 ${
                isLight 
                  ? 'bg-white border-red-500 text-slate-900 shadow-red-950/20' 
                  : 'bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-red-600/70 text-white'
              }`}>
                {/* Botão Fechar no canto superior */}
                <button
                  type="button"
                  onClick={() => setNewlyCreatedTicket(null)}
                  className={`absolute top-5 right-5 p-2 rounded-xl transition-colors cursor-pointer ${
                    isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Fechar e voltar"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Ícone de Sucesso */}
                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 flex items-center justify-center mx-auto mb-5 shadow-xl animate-bounce ${
                  isLight 
                    ? 'bg-red-50 border-[#E30613] text-[#E30613] shadow-red-500/20' 
                    : 'bg-red-500/20 border-red-500 text-red-500 shadow-red-500/30'
                }`}>
                  <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />
                </div>

                {/* Bloco de Mensagens Obrigatórias */}
                <div className="text-center space-y-3 mb-6">
                  <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight ${
                    isLight ? 'text-slate-950' : 'text-white'
                  }`}>
                    Participação registada com sucesso!
                  </h2>

                  <p className={`text-base sm:text-lg font-bold ${
                    isLight ? 'text-slate-800' : 'text-white'
                  }`}>
                    Obrigado por participar no sorteio de um Irrigador Oral Lacer.
                  </p>

                  <p className="text-3xl sm:text-4xl font-black text-[#E30613] tracking-wider py-1 drop-shadow-sm">
                    Boa sorte!
                  </p>

                  <p className={`text-xs sm:text-sm max-w-lg mx-auto leading-relaxed ${
                    isLight ? 'text-slate-600' : 'text-slate-300'
                  }`}>
                    O vencedor será contactado através dos dados fornecidos no formulário.
                  </p>

                  <div className={`p-3.5 sm:p-4 rounded-2xl border text-center max-w-lg mx-auto shadow-inner ${
                    isLight ? 'bg-red-50/80 border-red-200' : 'bg-red-950/30 border-red-500/40'
                  }`}>
                    <p className={`text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 ${
                      isLight ? 'text-[#E30613]' : 'text-red-100'
                    }`}>
                      <span className="text-[#E30613]">📍</span>
                      <span>Visite a nossa equipa no stand e descubra as novidades Lacer.</span>
                    </p>
                  </div>
                </div>

                {/* Golden Ticket Layout */}
                <div className={`border rounded-2xl p-5 text-center shadow-inner relative mb-6 ${
                  isLight ? 'bg-slate-50 border-red-200' : 'bg-slate-950 border-red-500/50'
                }`}>
                  <p className={`text-xs uppercase tracking-widest font-semibold mb-1 ${
                    isLight ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    O Seu Número da Sorte Oficial
                  </p>
                  <div className="text-4xl sm:text-5xl font-black font-mono text-[#E30613] tracking-wider my-2">
                    #{newlyCreatedTicket.ticketNumber}
                  </div>
                  <p className={`text-base sm:text-lg font-bold ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}>
                    {newlyCreatedTicket.name}
                  </p>
                  {newlyCreatedTicket.clinic && (
                    <p className={`text-xs font-medium mt-0.5 ${
                      isLight ? 'text-[#E30613]' : 'text-red-300'
                    }`}>
                      🏥 {newlyCreatedTicket.clinic}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center justify-center gap-2 text-xs mt-2">
                    {newlyCreatedTicket.specialty && (
                      <span className={`px-2 py-0.5 rounded-lg border ${
                        isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}>
                        🩺 {newlyCreatedTicket.specialty}
                      </span>
                    )}
                    <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>📍 {newlyCreatedTicket.city}</span>
                    <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>📱 {newlyCreatedTicket.phone}</span>
                  </div>

                  <div className={`mt-4 pt-3 border-t flex flex-wrap items-center justify-center gap-2 ${
                    isLight ? 'border-slate-200' : 'border-slate-800'
                  }`}>
                    <button
                      type="button"
                      onClick={() => handleCopyTicket(newlyCreatedTicket.ticketNumber)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer transition-colors border ${
                        isLight 
                          ? 'bg-white hover:bg-slate-100 text-[#E30613] border-red-200' 
                          : 'bg-slate-800 hover:bg-slate-700 text-red-400 border-red-500/30'
                      }`}
                    >
                      {copiedTicket ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedTicket ? 'Número Copiado!' : 'Copiar Número do Bilhete'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => window.print()}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer border ${
                        isLight 
                          ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300' 
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      }`}
                    >
                      <Ticket className="w-4 h-4" />
                      <span>Imprimir Comprovativo</span>
                    </button>
                  </div>
                </div>

                {/* Seção: Logótipo da Empresa (Definido pelo Administrador no Painel de Controlo) */}
                <div className={`pt-4 border-t text-center space-y-2.5 ${
                  isLight ? 'border-slate-200' : 'border-slate-800/80'
                }`}>
                  <span className={`text-[11px] font-bold uppercase tracking-wider block ${
                    isLight ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    Logótipo da Empresa
                  </span>

                  <div className="flex flex-col items-center justify-center">
                    <div className={`p-3.5 rounded-2xl border shadow-lg inline-flex items-center justify-center max-h-24 min-h-[70px] min-w-[150px] ${
                      isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-slate-700/80'
                    }`}>
                      <img
                        src={brand.logoUrl || DEFAULT_BRAND_LOGO}
                        alt={brand.companyName || 'Logo da Empresa'}
                        className="max-h-16 max-w-[220px] object-contain rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* Ação de Fecho / Conclusão */}
                <div className={`mt-6 pt-5 border-t flex flex-col sm:flex-row gap-3 ${
                  isLight ? 'border-slate-200' : 'border-slate-800'
                }`}>
                  <button
                    type="button"
                    onClick={() => setNewlyCreatedTicket(null)}
                    className="flex-1 py-3 px-5 bg-[#E30613] hover:bg-[#C80510] text-white font-bold rounded-xl text-sm transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Concluir e Voltar ao Início</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Card: Consultar Meus Bilhetes */}
          <div className={`border rounded-3xl p-6 shadow-lg transition-colors ${
            isLight ? 'bg-white border-slate-200 text-slate-900 shadow-sm' : 'bg-slate-900/60 border-slate-800/80 text-slate-100'
          }`}>
            <h3 className={`text-lg font-bold mb-2 flex items-center gap-2 ${
              isLight ? 'text-slate-950' : 'text-white'
            }`}>
              <Search className="w-4 h-4 text-[#E30613]" />
              <span>{brand.searchSectionTitle || 'Já se inscreveu? Consulte os seus Bilhetes'}</span>
            </h3>
            <p className={`text-xs mb-4 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              {brand.searchSectionSubtitle || 'Insira o seu NIF, telemóvel, e-mail ou bilhete para verificar os seus números registados'}
            </p>

            <form onSubmit={handleSearchTickets} className="flex gap-2" autoComplete="off">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Insira NIF, telemóvel, e-mail ou número de bilhete..."
                className={`flex-1 rounded-xl px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-[#E30613] ${
                  isLight 
                    ? 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#E30613]' 
                    : 'bg-slate-950 border border-slate-700 text-white placeholder-slate-600 focus:border-red-500'
                }`}
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#E30613] hover:bg-[#C80510] text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-md shadow-red-600/20"
              >
                <Search className="w-4 h-4" />
                <span>Pesquisar</span>
              </button>
            </form>

            {/* Results display */}
            {hasSearched && (
              <div className={`mt-4 pt-4 border-t space-y-2 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                {searchResults && searchResults.length > 0 ? (
                  searchResults.map((p: Participant) => (
                    <div
                      key={p.id}
                      className={`border rounded-xl p-3 flex items-center justify-between text-xs ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <div>
                        <p className={`font-bold ${isLight ? 'text-slate-950' : 'text-white'}`}>{p.name}</p>
                        <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{p.phone} · {p.city}</p>
                      </div>
                      <div className="text-right">
                        <span className={`font-mono font-bold text-sm px-2 py-1 rounded border ${
                          isLight 
                            ? 'text-[#E30613] bg-red-50 border-red-200' 
                            : 'text-red-400 bg-red-500/10 border-red-500/20'
                        }`}>
                          #{p.ticketNumber}
                        </span>
                        <p className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                          {p.status === 'winner' ? '🏆 CONTEMPLADO' : p.status === 'banned' ? '❌ Restrito' : '✓ A Concorrer'}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className={`text-xs text-center py-2 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                    Nenhum bilhete encontrado para esta pesquisa. Verifique os dados inseridos.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Prizes Showcase (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className={`text-xl font-bold flex items-center gap-2 ${
              isLight ? 'text-slate-950' : 'text-white'
            }`}>
              <Trophy className="w-5 h-5 text-[#E30613]" />
              <span>{brand.prizesSectionTitle || 'Prémios Desta Edição'}</span>
            </h2>
            <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {prizes.length} prémios registados
            </span>
          </div>

          <div className="space-y-4">
            {prizes.map((prize, index) => {
              const remaining = prize.totalQuantity - prize.drawnQuantity;
              const isExhausted = remaining <= 0;

              return (
                <div
                  key={prize.id}
                  className={`border rounded-2xl p-4 flex gap-4 transition-all ${
                    isLight 
                      ? `bg-white border-slate-200 shadow-sm ${isExhausted ? 'opacity-70' : 'hover:border-red-200 hover:shadow-md'}` 
                      : `bg-slate-900/80 ${isExhausted ? 'border-slate-800 opacity-75' : 'border-slate-800 hover:border-slate-700'}`
                  }`}
                >
                  {prize.imageUrl ? (
                    <img
                      src={prize.imageUrl}
                      alt={prize.title}
                      className={`w-24 h-24 rounded-xl object-cover shrink-0 border ${
                        isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
                      }`}
                    />
                  ) : (
                    <div className={`w-24 h-24 rounded-xl flex items-center justify-center shrink-0 ${
                      isLight ? 'bg-red-50 text-[#E30613]' : 'bg-slate-800 text-red-400'
                    }`}>
                      <Gift className="w-8 h-8" />
                    </div>
                  )}

                  <div className="flex flex-col justify-between flex-1 min-w-0">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                          isLight 
                            ? 'text-[#E30613] bg-red-50 border-red-200' 
                            : 'text-red-400 bg-red-500/10 border-red-500/20'
                        }`}>
                          {index + 1}º Prémio
                        </span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                          isExhausted 
                            ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                            : isLight 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {isExhausted ? 'Esgotado nesta edição' : `${remaining} de ${prize.totalQuantity} disponíveis`}
                        </span>
                      </div>
                      <h4 className={`text-sm font-bold leading-tight line-clamp-2 ${
                        isLight ? 'text-slate-950' : 'text-white'
                      }`}>
                        {prize.title}
                      </h4>
                      <p className={`text-xs line-clamp-1 mt-1 ${
                        isLight ? 'text-slate-600' : 'text-slate-400'
                      }`}>
                        {prize.description}
                      </p>
                    </div>

                    <div className={`mt-2 pt-2 border-t flex items-center justify-between text-xs font-mono ${
                      isLight ? 'border-slate-100' : 'border-slate-800/80'
                    }`}>
                      <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                        {prize.drawnQuantity} já {prize.drawnQuantity === 1 ? 'atribuído' : 'atribuídos'}
                      </span>
                      <span className={`font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                        {prize.estimatedValue ? `€ ${prize.estimatedValue.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}` : ''}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Transparency & Security Card */}
          <div className={`border rounded-2xl p-5 text-xs space-y-2 ${
            isLight 
              ? 'bg-white border-slate-200 text-slate-600 shadow-sm' 
              : 'bg-slate-900/50 border-slate-800/80 text-slate-400'
          }`}>
            <div className={`flex items-center gap-2 font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Sorteio Seguro & Auditado</span>
            </div>
            <p className={isLight ? 'text-slate-600' : 'text-slate-400'}>
              Todos os participantes concorrem em igualdade de condições. Os sorteios são gravados e autenticados com hash criptográfico de validação imediata.
            </p>
          </div>
        </div>
      </div>

      {/* Modal: Regulamento e Termos Oficiais do Sorteio */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className={`border rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-100'
          }`}>
            <div className={`flex items-center justify-between border-b pb-4 mb-4 ${
              isLight ? 'border-slate-200 text-slate-900' : 'border-slate-800 text-white'
            }`}>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#E30613]" />
                <h3 className="text-base sm:text-lg font-bold">Regulamento Oficial & Condições do Sorteio</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className={`p-1 text-xs cursor-pointer rounded-lg ${
                  isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                ✕ Fechar
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs sm:text-sm leading-relaxed">
              <div className={`p-4 rounded-2xl border font-sans whitespace-pre-line ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-300'
              }`}>
                {brand.termsAndConditions || 'Sorteio autorizado e auditado em tempo real. Cada participante concorre com os seus bilhetes únicos gerados no momento da inscrição. Os vencedores devem apresentar documento oficial de identificação com fotografia e comprovar a posse do número sorteado no prazo de até 30 dias corridos.'}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                <div className={`p-3 rounded-xl border ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950/60 border-slate-800 text-slate-400'
                }`}>
                  <span className={`font-bold block mb-0.5 ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>Empresa Organizadora:</span>
                  <span>{brand.companyName || 'Sorteio Lacer OMD 2026'}</span>
                </div>
                <div className={`p-3 rounded-xl border ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950/60 border-slate-800 text-slate-400'
                }`}>
                  <span className={`font-bold block mb-0.5 ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>Contacto / Suporte:</span>
                  <span>{brand.contactEmail || 'contacto@sorteiolive.pt'}</span>
                </div>
              </div>
            </div>

            <div className={`mt-5 pt-4 border-t flex items-center justify-between ${
              isLight ? 'border-slate-200' : 'border-slate-800'
            }`}>
              <button
                type="button"
                onClick={() => exportRegulationPDF(brand)}
                className={`px-4 py-2 border font-semibold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors ${
                  isLight 
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
                title="Descarregar documento oficial em formato PDF"
              >
                <FileText className="w-3.5 h-3.5 text-[#E30613]" />
                <span>Descarregar PDF Oficial</span>
              </button>

              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="px-5 py-2.5 bg-[#E30613] hover:bg-[#C80510] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-lg"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
