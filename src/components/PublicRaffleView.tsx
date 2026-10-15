import React, { useState } from 'react';
import { Participant, Prize, DrawSchedule, BrandConfig, FormFieldsConfig } from '../types';
import { 
  Ticket, 
  Search, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  Gift, 
  ShieldCheck, 
  Share2, 
  Sparkles, 
  AlertCircle,
  QrCode,
  Trophy,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
import { DEFAULT_FORM_FIELDS } from '../utils/storage';
import { ApiService } from '../utils/api';

interface PublicRaffleViewProps {
  brand: BrandConfig;
  prizes: Prize[];
  nextSchedule?: DrawSchedule;
  schedules?: DrawSchedule[];
  participants: Participant[];
  formFields?: FormFieldsConfig;
  onRegisterParticipant: (participant: Participant) => void;
  onGoToLive: () => void;
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
}) => {
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [document, setDocument] = useState('');
  const [city, setCity] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  // Success ticket modal
  const [newlyCreatedTicket, setNewlyCreatedTicket] = useState<Participant | null>(null);

  // Duplicate email restriction modal
  const [duplicateEmailError, setDuplicateEmailError] = useState<Participant | null>(null);

  // Search Ticket State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Participant[] | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Phone masking
  const handlePhoneChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 11);
    if (raw.length <= 10) {
      setPhone(raw.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3'));
    } else {
      setPhone(raw.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3'));
    }
  };

  // CPF masking
  const handleDocumentChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 11);
    setDocument(raw.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4'));
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
    if (formFields.document.enabled && formFields.document.required && !document.trim()) {
      setValidationWarning(`Por favor, preencha o campo obrigatório: ${formFields.document.label}`);
      return;
    }
    if (formFields.city.enabled && formFields.city.required && !city.trim()) {
      setValidationWarning(`Por favor, preencha o campo obrigatório: ${formFields.city.label}`);
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

    try {
      // 2. Server-side registration & authoritative duplication check
      const result = await ApiService.registerParticipant({
        name: name.trim() || 'Participante',
        email: normalizedEmail,
        phone: phone.trim(),
        document: document.trim(),
        city: city.trim(),
      });

      if (!result.success) {
        if (result.error === 'DUPLICATE_EMAIL' && result.existingParticipant) {
          setDuplicateEmailError(result.existingParticipant);
          return;
        }
        // If server had duplicate or another error
        const localDuplicate = participants.find(
          (p) => p.email && p.email.toLowerCase().trim() === normalizedEmail
        );
        if (localDuplicate) {
          setDuplicateEmailError(localDuplicate);
          return;
        }
        setValidationWarning(result.error || 'Erro ao processar inscrição no servidor.');
        return;
      }

      const participant = result.participant!;
      onRegisterParticipant(participant);
      setNewlyCreatedTicket(participant);
      setDuplicateEmailError(null);

      // Reset Form
      setName('');
      setEmail('');
      setPhone('');
      setDocument('');
      setCity('');
    } catch {
      // Fallback in case of unexpected network failure
      let ticket = Math.floor(10000 + Math.random() * 90000).toString();
      while (participants.some((p) => p.ticketNumber === ticket)) {
        ticket = Math.floor(10000 + Math.random() * 90000).toString();
      }

      const fallbackParticipant: Participant = {
        id: `part-${Date.now()}`,
        name: name.trim() || 'Participante',
        email: normalizedEmail,
        phone: phone.trim() || 'Não informado',
        document: document.trim() || 'Não informado',
        city: city.trim() || 'Brasil',
        ticketNumber: ticket,
        createdAt: new Date().toISOString(),
        status: 'active',
      };

      onRegisterParticipant(fallbackParticipant);
      setNewlyCreatedTicket(fallbackParticipant);
      setDuplicateEmailError(null);

      setName('');
      setEmail('');
      setPhone('');
      setDocument('');
      setCity('');
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

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-4">
            {brand.companyName || 'SorteioLive Pro'}
          </h1>
          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal mb-8">
            {brand.companySlogan || 'Concorra a prêmios extraordinários em sorteios auditados e transmitidos 100% ao vivo.'}
          </p>

          {/* 4 Daily Draw Editions Banner */}
          <div className="mt-6 max-w-3xl mx-auto bg-slate-900/95 border-2 border-amber-500/30 p-4 sm:p-5 rounded-3xl shadow-2xl backdrop-blur-md">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                  4 Sorteios Oficiais no Mesmo Dia
                </span>
              </div>
              <span className="text-[11px] text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Data Oficial: {nextSchedule ? new Date(`${nextSchedule.scheduledDate}T00:00:00`).toLocaleDateString('pt-BR') : 'Hoje'}
              </span>
            </div>

            {/* 4 slots grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {(schedules.length >= 4 ? schedules.slice(0, 4) : [
                { id: '1', roundNumber: 1, scheduledTime: '10:00', title: '1º Sorteio', status: 'scheduled' },
                { id: '2', roundNumber: 2, scheduledTime: '14:00', title: '2º Sorteio', status: 'scheduled' },
                { id: '3', roundNumber: 3, scheduledTime: '18:00', title: '3º Sorteio', status: 'scheduled' },
                { id: '4', roundNumber: 4, scheduledTime: '21:00', title: '4º Sorteio', status: 'scheduled' },
              ]).map((sch, idx) => {
                const isLive = sch.status === 'live';
                const isCompleted = sch.status === 'completed';
                return (
                  <div
                    key={sch.id}
                    onClick={onGoToLive}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer group hover:scale-102 ${
                      isLive
                        ? 'bg-red-500/20 border-red-500 ring-2 ring-red-500/30'
                        : isCompleted
                        ? 'bg-slate-950/60 border-slate-800 opacity-60'
                        : 'bg-slate-950 border-slate-800 hover:border-amber-500/50'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-amber-400 block mb-0.5">
                      {idx + 1}ª Rodada
                    </span>
                    <div className="text-lg sm:text-xl font-mono font-black text-amber-400 group-hover:text-amber-300">
                      {sch.scheduledTime}
                    </div>
                    <span className={`inline-block mt-1 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      isLive 
                        ? 'bg-red-500 text-white animate-pulse'
                        : isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {isLive ? 'Ao Vivo Agora' : isCompleted ? 'Realizado' : 'Agendado'}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-3.5 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400">
              <span className="text-[11px]">Seu bilhete concorre automaticamente em todas as 4 rodadas diárias!</span>
              <button
                onClick={onGoToLive}
                className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 text-[11px]"
              >
                <span>Acessar Transmissão</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
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
                  Garanta seu Bilhete da Sorte
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Preencha seus dados reais para receber a confirmação e seu número
                </p>
              </div>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              {/* Duplicate Email Warning Banner */}
              {duplicateEmailError && (
                <div className="p-4 rounded-2xl bg-amber-950/40 border-2 border-amber-500/50 text-amber-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-sm text-amber-400">
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                      <span>ATENÇÃO: E-MAIL JÁ CADASTRADO NO SISTEMA!</span>
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
                      <p className="text-[11px] text-emerald-400">✓ Concorrendo em todas as 4 rodadas</p>
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

              {/* Dynamic Name Field */}
              {formFields.name.enabled && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    {formFields.name.label} {formFields.name.required ? '*' : <span className="text-slate-500 font-normal lowercase">(opcional)</span>}
                  </label>
                  <input
                    type="text"
                    required={formFields.name.required}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={formFields.name.placeholder || 'Ex: Ana Maria da Silva'}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}

              {/* Email and Phone Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Dynamic Email Field */}
                {formFields.email.enabled && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      {formFields.email.label} {formFields.email.required ? '*' : <span className="text-slate-500 font-normal lowercase">(opcional)</span>}
                    </label>
                    <input
                      type="email"
                      required={formFields.email.required}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (duplicateEmailError) setDuplicateEmailError(null);
                      }}
                      placeholder={formFields.email.placeholder || 'seuemail@exemplo.com'}
                      className={`w-full bg-slate-950 border rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                        duplicateEmailError ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-700/80'
                      }`}
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Validação única: limite de 1 inscrição por e-mail
                    </span>
                  </div>
                )}

                {/* Dynamic Phone Field */}
                {formFields.phone.enabled && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      {formFields.phone.label} {formFields.phone.required ? '*' : <span className="text-slate-500 font-normal lowercase">(opcional)</span>}
                    </label>
                    <input
                      type="tel"
                      required={formFields.phone.required}
                      value={phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder={formFields.phone.placeholder || '(11) 99999-9999'}
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                )}
              </div>

              {/* Document and City Grid */}
              {(formFields.document.enabled || formFields.city.enabled) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Dynamic Document Field */}
                  {formFields.document.enabled && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        {formFields.document.label} {formFields.document.required ? '*' : <span className="text-slate-500 font-normal lowercase">(opcional)</span>}
                      </label>
                      <input
                        type="text"
                        required={formFields.document.required}
                        value={document}
                        onChange={(e) => handleDocumentChange(e.target.value)}
                        placeholder={formFields.document.placeholder || '000.000.000-00'}
                        className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  )}

                  {/* Dynamic City Field */}
                  {formFields.city.enabled && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        {formFields.city.label} {formFields.city.required ? '*' : <span className="text-slate-500 font-normal lowercase">(opcional)</span>}
                      </label>
                      <input
                        type="text"
                        required={formFields.city.required}
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder={formFields.city.placeholder || 'Ex: São Paulo - SP'}
                        className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-400">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5 rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-amber-500"
                  />
                  <span>
                    Concordo com os regulamentos do sorteio e autorizo o envio de notificações sobre a transmissão ao vivo.
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
                <span>{isSubmitting ? 'REGISTRANDO INSCRIÇÃO...' : 'GERAR MEU NÚMERO DA SORTE'}</span>
              </button>
            </form>
          </div>

          {/* Ticket Success Confirmation Modal */}
          {newlyCreatedTicket && (
            <div className="bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-950 border-2 border-amber-500 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-amber-500/30 pb-4 mb-4">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>INSCRIÇÃO CONFIRMADA COM SUCESSO!</span>
                </div>
                <button
                  onClick={() => setNewlyCreatedTicket(null)}
                  className="text-slate-400 hover:text-white text-xs underline"
                >
                  Fechar
                </button>
              </div>

              {/* Golden Ticket Layout */}
              <div className="bg-slate-950 border border-amber-500/50 rounded-2xl p-6 text-center shadow-inner relative">
                <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-1">
                  Seu Bilhete Oficial
                </p>
                <div className="text-5xl sm:text-6xl font-black font-mono text-amber-400 tracking-wider my-2">
                  #{newlyCreatedTicket.ticketNumber}
                </div>
                <p className="text-lg font-bold text-white">
                  {newlyCreatedTicket.name}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {newlyCreatedTicket.phone} · {newlyCreatedTicket.city}
                </p>

                <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-center gap-3">
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                      `🎟️ Olá! Acabei de garantir meu bilhete #${newlyCreatedTicket.ticketNumber} no sorteio da ${brand.companyName}! Acesse para participar também: ${brand.raffleUrl}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Compartilhar no WhatsApp</span>
                  </a>

                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2"
                  >
                    <Ticket className="w-4 h-4" />
                    <span>Imprimir Comprovante</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Card: Consultar Meus Bilhetes */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Search className="w-4 h-4 text-amber-400" />
              <span>Já se inscreveu? Consulte seus Bilhetes</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Digite seu CPF, telefone ou e-mail para verificar seus números cadastrados
            </p>

            <form onSubmit={handleSearchTickets} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Digite CPF, telefone, e-mail ou bilhete..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>Buscar</span>
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
                          {p.status === 'winner' ? '🏆 CONTEMPLADO' : p.status === 'banned' ? '❌ Restrito' : '✓ Concorrendo'}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 text-center py-2">
                    Nenhum bilhete encontrado para essa pesquisa. Verifique os dados digitados.
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
              <span>Prêmios Desta Edição</span>
            </h2>
            <span className="text-xs text-slate-400">
              {prizes.length} prêmios cadastrados
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
                          {index + 1}º Prêmio
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
                        {prize.drawnQuantity} já {prize.drawnQuantity === 1 ? 'sorteado' : 'sorteados'}
                      </span>
                      <span className="font-bold text-emerald-400">
                        {prize.estimatedValue ? `R$ ${prize.estimatedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}
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
    </div>
  );
};
