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
import { DEFAULT_FORM_FIELDS, StorageService, DEFAULT_BRAND_LOGO } from '../utils/storage';
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Hero Header */}
      <section className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 py-12 sm:py-20 px-4 sm:px-6 lg:px-8 text-center">
        {/* Glow ambient */}
        <div 
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[350px] rounded-full blur-[120px] opacity-25 pointer-events-none"
          style={{ backgroundColor: brand.primaryColor }}
        ></div>

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Hero Badge */}
          {brand.heroBadgeText && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs sm:text-sm font-semibold mb-6 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{brand.heroBadgeText}</span>
            </div>
          )}

          {/* Logo */}
          <div className="flex justify-center mb-6">
            {brand.logoUrl ? (
              <img
                src={brand.logoUrl}
                alt={brand.companyName}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-contain bg-slate-900 p-2 border-2 border-slate-700/80 shadow-2xl"
              />
            ) : (
              <div 
                style={{ backgroundColor: brand.primaryColor }}
                className="w-20 h-20 rounded-3xl flex items-center justify-center text-slate-950 font-black text-3xl shadow-2xl"
              >
                ★
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-3 mb-3">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white">
              {brand.companyName || 'Sorteio Lacer OMD 2026'}
            </h1>
          </div>

          <div className="max-w-2xl mx-auto mb-8">
            {brand.companySlogan !== undefined && brand.companySlogan !== '' ? (
              <p className="text-base sm:text-xl text-slate-300 font-normal leading-relaxed">
                {brand.companySlogan}
              </p>
            ) : null}
          </div>

          {/* Official 2 Draws Per Day Schedule Banner */}
          {brand.showRoundsBanner !== false && (
            <div className="mt-8 max-w-4xl mx-auto bg-slate-900/95 border-2 border-amber-500/30 p-5 sm:p-6 rounded-3xl shadow-2xl backdrop-blur-md text-left">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3.5 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-white uppercase tracking-wider">
                      {brand.roundsBannerTitle || '2 Sorteios Oficiais por Dia'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Datas e horários oficiais das rondas de prémios
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs text-amber-300 font-mono bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/25">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
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
                    <div key={dateStr} className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-4">
                      {/* Day Header */}
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/60">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold text-xs uppercase font-mono">
                            {dayIndex + 1}º Dia
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-white capitalize">
                            {formatScheduleFullDate(dateStr)}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
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
                                  ? 'bg-red-500/20 border-red-500 ring-2 ring-red-500/30'
                                  : isCompleted
                                  ? 'bg-slate-900/60 border-slate-800/80 opacity-60'
                                  : 'bg-slate-900/90 border-slate-800 hover:border-amber-500/50 hover:bg-slate-850'
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                                    {sch.title}
                                  </span>
                                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ${
                                    isLive 
                                      ? 'bg-red-500 text-white animate-pulse'
                                      : isCompleted
                                      ? 'bg-emerald-500/20 text-emerald-400'
                                      : 'bg-slate-800 text-amber-400/90 border border-slate-700'
                                  }`}>
                                    {isLive ? 'Ao Vivo' : isCompleted ? 'Realizado' : 'Agendado'}
                                  </span>
                                </div>
                                {assignedPrize && (
                                  <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                                    <Trophy className="w-3 h-3 text-amber-400 shrink-0" />
                                    <span className="truncate">{assignedPrize.title}</span>
                                  </p>
                                )}
                              </div>

                              <div className="text-right shrink-0">
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                                  Horário
                                </span>
                                <span className="text-xl sm:text-2xl font-mono font-black text-amber-400 group-hover:text-amber-300">
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

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                <span className="text-[11px]">{brand.roundsBannerSubtitle || 'O seu bilhete concorre automaticamente em todas as rondas e datas programadas!'}</span>
                <button
                  onClick={onGoToLive}
                  className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1.5 text-xs cursor-pointer group"
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
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div 
                style={{ backgroundColor: `${brand.primaryColor}20`, color: brand.primaryColor }}
                className="w-10 h-10 rounded-xl flex items-center justify-center"
              >
                <Ticket className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  {brand.formTitle || 'Garanta o seu Bilhete da Sorte'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  {brand.formSubtitle || 'Preencha os seus dados reais para receber a confirmação e o seu número'}
                </p>
              </div>
            </div>

            <form onSubmit={handleRegister} className="space-y-4" autoComplete="off">
              {/* Duplicate Email Warning Banner */}
              {duplicateEmailError && (
                <div className="p-4 rounded-2xl bg-amber-950/40 border-2 border-amber-500/50 text-amber-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-sm text-amber-400">
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
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
                  <div className="p-3 bg-slate-950 rounded-xl border border-amber-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block font-semibold">
                        Seu Bilhete Cadastrado:
                      </span>
                      <span className="text-xl font-black font-mono text-amber-400">
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
                      className="px-3 py-1.5 bg-amber-500 text-slate-950 rounded-lg text-xs font-bold hover:bg-amber-400 transition-colors"
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
                <div className="border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-mono">1</span>
                    <span>Dados de contacto</span>
                  </h4>
                </div>

                {/* Nome completo */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Nome completo <span className="text-amber-400">*</span>
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
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* E-mail profissional e Telefone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      E-mail profissional <span className="text-amber-400">*</span>
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
                      className={`w-full bg-slate-950 border rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                        duplicateEmailError ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-700/80'
                      }`}
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      {brand.ticketNotice || 'Validação única: limite de 1 inscrição por e-mail'}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Telefone <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder={formFields.phone.placeholder || '912 345 678'}
                      autoComplete="off"
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Clínica / Consultório e Cidade */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Clínica / Consultório
                    </label>
                    <input
                      type="text"
                      value={clinic}
                      onChange={(e) => setClinic(e.target.value)}
                      placeholder="Nome da Clínica ou Consultório"
                      autoComplete="off"
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Cidade <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder={formFields.city.placeholder || 'Ex: Lisboa, Porto, Coimbra...'}
                      autoComplete="off"
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Document / NIF if enabled */}
                {formFields.document?.enabled && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      {formFields.document.label} {formFields.document.required ? '*' : <span className="text-slate-500 font-normal lowercase">(opcional)</span>}
                    </label>
                    <input
                      type="text"
                      required={formFields.document.required}
                      value={document}
                      onChange={(e) => handleDocumentChange(e.target.value)}
                      placeholder={formFields.document.placeholder || ''}
                      autoComplete="off"
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                )}
              </div>

              {/* SEÇÃO 2: Especialidade (Multi-seleção) */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-mono">2</span>
                    <span>Especialidade(s)</span>
                    <span className="text-amber-400">*</span>
                  </h4>
                  <span className="text-[11px] text-amber-300/80 font-medium bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    Pode selecionar mais de uma opção ({selectedSpecialties.length} selecionada{selectedSpecialties.length === 1 ? '' : 's'})
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
                            ? 'bg-amber-500/15 border-amber-500 text-white font-semibold ring-1 ring-amber-500/30 shadow-sm'
                            : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        <input
                          type="checkbox"
                          value={spec}
                          checked={isSelected}
                          onChange={() => handleToggleSpecialty(spec)}
                          className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700 focus:ring-amber-500 cursor-pointer"
                        />
                        <span className="flex-1">{spec}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      </label>
                    );
                  })}
                </div>

                {/* Se 'Outra' for selecionada, campo de texto específico */}
                {selectedSpecialties.includes('Outra') && (
                  <div className="mt-2.5 animate-in fade-in duration-200">
                    <label className="block text-[11px] font-semibold text-amber-400 uppercase tracking-wider mb-1">
                      Outra Especialidade:
                    </label>
                    <input
                      type="text"
                      required
                      value={specialtyOther}
                      onChange={(e) => setSpecialtyOther(e.target.value)}
                      placeholder="Indique a sua especialidade..."
                      className="w-full bg-slate-950 border border-amber-500/50 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                )}
              </div>

              {/* SEÇÃO 3: Visita do representante Lacer */}
              <div className="pt-4 border-t border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-slate-200">
                  Gostaria que um representante da Lacer visitasse a sua clínica para apresentar os nossos produtos?
                </h4>
                <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 cursor-pointer text-xs text-slate-300 transition-all">
                  <input
                    type="checkbox"
                    checked={wantsLacerVisit}
                    onChange={(e) => setWantsLacerVisit(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500"
                  />
                  <span>Sim, gostaria de agendar uma visita.</span>
                </label>
              </div>

              {/* SEÇÃO 4: Consentimentos e Regulamento */}
              <div className="pt-4 border-t border-slate-800 space-y-3.5">
                {/* Consentimento Obrigatório */}
                <div className="space-y-1.5">
                  <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      required
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="mt-0.5 w-4 h-4 shrink-0 rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="leading-relaxed">
                      Declaro que li e aceito o regulamento do sorteio e a política de privacidade da Lacer, e autorizo o tratamento dos meus dados pessoais para a gestão da minha participação no sorteio, nos termos da legislação aplicável de proteção de dados. <span className="text-amber-400 font-bold">*</span>
                    </span>
                  </label>
                  <div className="pl-7 pt-1">
                    <a
                      href="/regulamento.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        // Trigger immediate official PDF generation / download as well
                        try {
                          exportRegulationPDF(brand);
                        } catch (err) {
                          console.error('Error generating PDF:', err);
                        }
                      }}
                      className="text-amber-400 hover:text-amber-300 text-xs font-semibold underline decoration-amber-400/80 hover:decoration-amber-300 inline-flex items-center gap-1.5 cursor-pointer group transition-all"
                      title="Abrir e descarregar documento oficial em formato PDF"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
                      <span>Consulte o regulamento completo do sorteio e a política de privacidade</span>
                      <span className="inline-flex items-center text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1 py-0.2 rounded no-underline">
                        PDF
                      </span>
                      <ExternalLink className="w-3 h-3 text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
                    </a>
                  </div>
                </div>

                {/* Consentimento Opcional Marketing */}
                <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-400 hover:text-slate-300 pt-1">
                  <input
                    type="checkbox"
                    checked={marketingConsent}
                    onChange={(e) => setMarketingConsent(e.target.checked)}
                    className="mt-0.5 w-4 h-4 shrink-0 rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500"
                  />
                  <span className="leading-relaxed">
                    Autorizo a Lacer a contactar-me para receber informação sobre produtos, novidades, eventos e visitas comerciais.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={!acceptedTerms || isSubmitting}
                style={{ backgroundColor: brand.primaryColor }}
                className="w-full py-4 px-6 rounded-xl font-bold text-slate-950 text-base shadow-lg hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
              <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-emerald-500/60 rounded-3xl p-6 sm:p-10 max-w-2xl w-full shadow-2xl relative my-auto animate-in zoom-in-95 duration-200">
                {/* Botão Fechar no canto superior */}
                <button
                  type="button"
                  onClick={() => setNewlyCreatedTicket(null)}
                  className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Fechar e voltar"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Ícone de Sucesso */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto text-emerald-400 mb-5 shadow-xl shadow-emerald-500/20 animate-bounce">
                  <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />
                </div>

                {/* Bloco de Mensagens Obrigatórias */}
                <div className="text-center space-y-3 mb-6">
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                    Participação registada com sucesso!
                  </h2>

                  <p className="text-base sm:text-lg font-bold text-emerald-400">
                    Obrigado por participar no sorteio de um Irrigador Oral Lacer.
                  </p>

                  <p className="text-2xl sm:text-3xl font-black text-amber-400 tracking-wider py-1">
                    Boa sorte!
                  </p>

                  <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
                    O vencedor será contactado através dos dados fornecidos no formulário.
                  </p>

                  <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/90 border border-slate-800 text-center max-w-lg mx-auto shadow-inner">
                    <p className="text-xs sm:text-sm text-amber-200 font-semibold flex items-center justify-center gap-2">
                      <span className="text-amber-400">📍</span>
                      <span>Visite a nossa equipa no stand e descubra as novidades Lacer.</span>
                    </p>
                  </div>
                </div>

                {/* Golden Ticket Layout */}
                <div className="bg-slate-950 border border-amber-500/50 rounded-2xl p-5 text-center shadow-inner relative mb-6">
                  <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-1">
                    O Seu Número da Sorte Oficial
                  </p>
                  <div className="text-4xl sm:text-5xl font-black font-mono text-amber-400 tracking-wider my-2">
                    #{newlyCreatedTicket.ticketNumber}
                  </div>
                  <p className="text-base sm:text-lg font-bold text-white">
                    {newlyCreatedTicket.name}
                  </p>
                  {newlyCreatedTicket.clinic && (
                    <p className="text-xs text-amber-300 font-medium mt-0.5">
                      🏥 {newlyCreatedTicket.clinic}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400 mt-2">
                    {newlyCreatedTicket.specialty && (
                      <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300">
                        🩺 {newlyCreatedTicket.specialty}
                      </span>
                    )}
                    <span>📍 {newlyCreatedTicket.city}</span>
                    <span>📱 {newlyCreatedTicket.phone}</span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyTicket(newlyCreatedTicket.ticketNumber)}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer transition-colors border border-amber-500/30"
                    >
                      {copiedTicket ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedTicket ? 'Número Copiado!' : 'Copiar Número do Bilhete'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Ticket className="w-4 h-4" />
                      <span>Imprimir Comprovativo</span>
                    </button>
                  </div>
                </div>

                {/* Seção: Logótipo da Empresa (Definido pelo Administrador no Painel de Controlo) */}
                <div className="pt-4 border-t border-slate-800/80 text-center space-y-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Logótipo da Empresa
                  </span>

                  <div className="flex flex-col items-center justify-center">
                    <div className="p-3.5 rounded-2xl bg-white/5 border border-slate-700/80 shadow-lg inline-flex items-center justify-center max-h-24 min-h-[70px] min-w-[150px]">
                      <img
                        src={brand.logoUrl || DEFAULT_BRAND_LOGO}
                        alt={brand.companyName || 'Logo da Empresa'}
                        className="max-h-16 max-w-[220px] object-contain rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* Ação de Fecho / Conclusão */}
                <div className="mt-6 pt-5 border-t border-slate-800 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => setNewlyCreatedTicket(null)}
                    className="flex-1 py-3 px-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Concluir e Voltar ao Início</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Card: Consultar Meus Bilhetes */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Search className="w-4 h-4 text-amber-400" />
              <span>{brand.searchSectionTitle || 'Já se inscreveu? Consulte os seus Bilhetes'}</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {brand.searchSectionSubtitle || 'Insira o seu NIF, telemóvel, e-mail ou bilhete para verificar os seus números registados'}
            </p>

            <form onSubmit={handleSearchTickets} className="flex gap-2" autoComplete="off">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Insira NIF, telemóvel, e-mail ou número de bilhete..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>Pesquisar</span>
              </button>
            </form>

            {/* Results display */}
            {hasSearched && (
              <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
                {searchResults && searchResults.length > 0 ? (
                  searchResults.map((p: Participant) => (
                    <div
                      key={p.id}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-white">{p.name}</p>
                        <p className="text-slate-400 text-[11px]">{p.phone} · {p.city}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-amber-400 text-sm bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                          #{p.ticketNumber}
                        </span>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {p.status === 'winner' ? '🏆 CONTEMPLADO' : p.status === 'banned' ? '❌ Restrito' : '✓ A Concorrer'}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 text-center py-2">
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
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>{brand.prizesSectionTitle || 'Prémios Desta Edição'}</span>
            </h2>
            <span className="text-xs text-slate-400">
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
                  className={`bg-slate-900/80 border rounded-2xl p-4 flex gap-4 transition-colors ${
                    isExhausted ? 'border-slate-800 opacity-75' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {prize.imageUrl ? (
                    <img
                      src={prize.imageUrl}
                      alt={prize.title}
                      className="w-24 h-24 rounded-xl object-cover bg-slate-950 shrink-0 border border-slate-800"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 text-amber-400">
                      <Gift className="w-8 h-8" />
                    </div>
                  )}

                  <div className="flex flex-col justify-between flex-1 min-w-0">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                          {index + 1}º Prémio
                        </span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                          isExhausted 
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {isExhausted ? 'Esgotado nesta edição' : `${remaining} de ${prize.totalQuantity} disponíveis`}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white leading-tight line-clamp-2">
                        {prize.title}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-1">
                        {prize.description}
                      </p>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                      <span className="text-[10px] text-slate-500">
                        {prize.drawnQuantity} já {prize.drawnQuantity === 1 ? 'atribuído' : 'atribuídos'}
                      </span>
                      <span className="font-bold text-emerald-400">
                        {prize.estimatedValue ? `€ ${prize.estimatedValue.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}` : ''}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Transparency & Security Card */}
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-2 font-bold text-white">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Sorteio Seguro & Auditado</span>
            </div>
            <p>
              Todos os participantes concorrem em igualdade de condições. Os sorteios são gravados e autenticados com hash criptográfico de validação imediata.
            </p>
          </div>
        </div>
      </div>



      {/* Modal: Regulamento e Termos Oficiais do Sorteio */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-2 text-white">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h3 className="text-base sm:text-lg font-bold">Regulamento Oficial & Condições do Sorteio</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="text-slate-400 hover:text-white p-1 text-xs cursor-pointer rounded-lg hover:bg-slate-800"
              >
                ✕ Fechar
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs sm:text-sm text-slate-300 leading-relaxed">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-sans whitespace-pre-line">
                {brand.termsAndConditions || 'Sorteio autorizado e auditado em tempo real. Cada participante concorre com os seus bilhetes únicos gerados no momento da inscrição. Os vencedores devem apresentar documento oficial de identificação com fotografia e comprovar a posse do número sorteado no prazo de até 30 dias corridos.'}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400">
                  <span className="font-bold text-slate-200 block mb-0.5">Empresa Organizadora:</span>
                  <span>{brand.companyName || 'Sorteio Lacer OMD 2026'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400">
                  <span className="font-bold text-slate-200 block mb-0.5">Contacto / Suporte:</span>
                  <span>{brand.contactEmail || 'contacto@sorteiolive.pt'}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => exportRegulationPDF(brand)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Descarregar documento oficial em formato PDF"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Descarregar PDF Oficial</span>
              </button>

              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-lg"
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
