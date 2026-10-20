import React, { useState, useEffect } from 'react';
import { Participant, BrandConfig, FormFieldsConfig, DENTAL_SPECIALTIES } from '../../types';
import { exportParticipantsToExcel, exportParticipantsToPDF } from '../../utils/export';
import { 
  Users, 
  FileSpreadsheet, 
  FileText, 
  UserPlus, 
  Search, 
  Trash2, 
  Sparkles,
  SlidersHorizontal,
  Check,
  AlertCircle,
  X,
  Database,
  Ticket,
  Building2,
  Stethoscope,
  Briefcase,
  Eye,
  Edit2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface ParticipantsTabProps {
  participants: Participant[];
  brand: BrandConfig;
  formFields: FormFieldsConfig;
  onUpdateParticipants: (updated: Participant[], deletedId?: string) => void;
  onUpdateFormFields: (fields: FormFieldsConfig) => void;
  onClearAllParticipants?: () => void;
}

export const ParticipantsTab: React.FC<ParticipantsTabProps> = ({
  participants,
  brand,
  formFields,
  onUpdateParticipants,
  onUpdateFormFields,
  onClearAllParticipants,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'winner' | 'wants_visit' | 'marketing_yes'>('all');
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  
  // Feedback banners
  const [saveSuccessToast, setSaveSuccessToast] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Modal: Add participant
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newDoc, setNewDoc] = useState('');
  const [newClinic, setNewClinic] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newSpecialty, setNewSpecialty] = useState<string>(DENTAL_SPECIALTIES[0]);
  const [newSpecialtyOther, setNewSpecialtyOther] = useState('');
  const [newWantsLacerVisit, setNewWantsLacerVisit] = useState(false);
  const [newMarketingConsent, setNewMarketingConsent] = useState(true);
  const [customTicket, setCustomTicket] = useState('');
  const [allowExtraTicket, setAllowExtraTicket] = useState(false);

  // Modal: View full participant details
  const [viewingParticipant, setViewingParticipant] = useState<Participant | null>(null);

  // Modal: Edit participant
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editClinic, setEditClinic] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editSpecialty, setEditSpecialty] = useState<string>(DENTAL_SPECIALTIES[0]);
  const [editSpecialtyOther, setEditSpecialtyOther] = useState('');
  const [editWantsLacerVisit, setEditWantsLacerVisit] = useState(false);
  const [editMarketingConsent, setEditMarketingConsent] = useState(true);
  const [editTermsAccepted, setEditTermsAccepted] = useState(true);
  const [editTicketNumber, setEditTicketNumber] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'winner' | 'banned'>('active');

  // Modal: Confirm deletion
  const [deletingParticipant, setDeletingParticipant] = useState<Participant | null>(null);

  // Modal: Configure fields
  const [showFieldsModal, setShowFieldsModal] = useState(false);
  const [tempFields, setTempFields] = useState<FormFieldsConfig>(formFields);

  // Synchronize tempFields when formFields updates
  useEffect(() => {
    setTempFields(formFields);
  }, [formFields]);

  // Filtered list
  const filteredParticipants = participants.filter((p) => {
    const query = search.toLowerCase();
    const matchQuery =
      (p.name || '').toLowerCase().includes(query) ||
      (p.email || '').toLowerCase().includes(query) ||
      (p.phone || '').includes(query) ||
      (p.clinic || '').toLowerCase().includes(query) ||
      (p.specialty || '').toLowerCase().includes(query) ||
      (p.document || '').includes(query) ||
      (p.ticketNumber || '').toLowerCase().includes(query) ||
      (p.city || '').toLowerCase().includes(query);

    const matchStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? p.status === 'active'
        : statusFilter === 'winner'
        ? p.status === 'winner'
        : statusFilter === 'wants_visit'
        ? !!p.wantsLacerVisit
        : statusFilter === 'marketing_yes'
        ? p.marketingConsent !== false
        : true;
    return matchQuery && matchStatus;
  });

  const handleStartEdit = (p: Participant) => {
    setEditingParticipant(p);
    setEditName(p.name || '');
    setEditEmail(p.email || '');
    setEditPhone(p.phone || '');
    setEditClinic(p.clinic || '');
    setEditCity(p.city || '');
    const isStandardSpec = DENTAL_SPECIALTIES.includes(p.specialty as any);
    if (isStandardSpec) {
      setEditSpecialty(p.specialty || DENTAL_SPECIALTIES[0]);
      setEditSpecialtyOther('');
    } else if (p.specialty?.startsWith('Outra: ')) {
      setEditSpecialty('Outra');
      setEditSpecialtyOther(p.specialty.replace('Outra: ', ''));
    } else {
      setEditSpecialty(p.specialty ? 'Outra' : DENTAL_SPECIALTIES[0]);
      setEditSpecialtyOther(p.specialty || '');
    }
    setEditWantsLacerVisit(!!p.wantsLacerVisit);
    setEditMarketingConsent(p.marketingConsent !== false);
    setEditTermsAccepted(p.termsAccepted !== false);
    setEditTicketNumber(p.ticketNumber || '');
    setEditStatus(p.status || 'active');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingParticipant) return;

    const finalSpecialty = editSpecialty === 'Outra' && editSpecialtyOther.trim()
      ? `Outra: ${editSpecialtyOther.trim()}`
      : editSpecialty;

    const updatedParticipant: Participant = {
      ...editingParticipant,
      name: editName.trim() || 'Participante',
      email: editEmail.trim().toLowerCase(),
      phone: editPhone.trim(),
      clinic: editClinic.trim(),
      city: editCity.trim(),
      specialty: finalSpecialty,
      specialtyOther: editSpecialtyOther.trim(),
      wantsLacerVisit: editWantsLacerVisit,
      marketingConsent: editMarketingConsent,
      termsAccepted: editTermsAccepted,
      ticketNumber: editTicketNumber.trim() || editingParticipant.ticketNumber,
      status: editStatus,
    };

    const updatedList = participants.map((p) => p.id === editingParticipant.id ? updatedParticipant : p);
    onUpdateParticipants(updatedList);
    setEditingParticipant(null);
    setSaveSuccessToast(`Participante "${updatedParticipant.name}" (#${updatedParticipant.ticketNumber}) atualizado com sucesso na Base de Dados!`);
    setTimeout(() => setSaveSuccessToast(null), 3500);
  };

  const handleOpenAddModal = () => {
    setFormError(null);
    setNewName('');
    setNewEmail('');
    setNewPhone('');
    setNewDoc('');
    setNewClinic('');
    setNewCity('');
    setNewSpecialty(DENTAL_SPECIALTIES[0]);
    setNewSpecialtyOther('');
    setNewWantsLacerVisit(false);
    setNewMarketingConsent(true);
    setCustomTicket('');
    setAllowExtraTicket(false);
    setShowAddModal(true);
  };

  const handleAddParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validate based on configured fields
    if (formFields.name.enabled && formFields.name.required && !newName.trim()) {
      setFormError(`Por favor, preencha o campo obrigatório: ${formFields.name.label}`);
      return;
    }
    if (formFields.email.enabled && formFields.email.required && !newEmail.trim()) {
      setFormError(`Por favor, preencha o campo obrigatório: ${formFields.email.label}`);
      return;
    }
    if (formFields.phone.enabled && formFields.phone.required && !newPhone.trim()) {
      setFormError(`Por favor, preencha o campo obrigatório: ${formFields.phone.label}`);
      return;
    }
    if (formFields.document && formFields.document.enabled && formFields.document.required && !newDoc.trim()) {
      setFormError(`Por favor, preencha o campo obrigatório: ${formFields.document.label}`);
      return;
    }
    if (formFields.city.enabled && formFields.city.required && !newCity.trim()) {
      setFormError(`Por favor, preencha o campo obrigatório: ${formFields.city.label}`);
      return;
    }

    const normalizedEmail = newEmail.trim().toLowerCase();
    if (normalizedEmail && !allowExtraTicket) {
      const existing = participants.find((p) => p.email && p.email.toLowerCase().trim() === normalizedEmail);
      if (existing) {
        setFormError(
          `Aviso: O e-mail "${newEmail.trim()}" já possui o Bilhete #${existing.ticketNumber}. Se desejar emitir um bilhete adicional para ele, marque a opção "Permitir bilhete extra" abaixo.`
        );
        return;
      }
    }

    let ticket = customTicket.trim();
    if (!ticket) {
      ticket = Math.floor(10000 + Math.random() * 90000).toString();
      while (participants.some((p) => p.ticketNumber === ticket)) {
        ticket = Math.floor(10000 + Math.random() * 90000).toString();
      }
    } else {
      if (participants.some((p) => p.ticketNumber === ticket)) {
        setFormError(`O número de bilhete #${ticket} já pertence a outro participante. Escolha outro ou deixe em branco para gerar aleatório.`);
        return;
      }
    }

    const finalSpecialty = newSpecialty === 'Outra' && newSpecialtyOther.trim()
      ? `Outra: ${newSpecialtyOther.trim()}`
      : newSpecialty;

    const created: Participant = {
      id: `part-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: newName.trim() || 'Participante',
      email: normalizedEmail || 'sem-email@lacer.pt',
      phone: newPhone.trim() || 'Não informado',
      document: newDoc.trim() || '',
      clinic: newClinic.trim(),
      city: newCity.trim() || 'Portugal',
      specialty: finalSpecialty,
      specialtyOther: newSpecialtyOther.trim(),
      wantsLacerVisit: newWantsLacerVisit,
      marketingConsent: newMarketingConsent,
      termsAccepted: true,
      ticketNumber: ticket,
      createdAt: new Date().toISOString(),
      status: 'active',
    };

    onUpdateParticipants([created, ...participants]);
    setShowAddModal(false);
    setSaveSuccessToast(`Participante "${created.name}" (Bilhete #${created.ticketNumber}) gravado com sucesso na Base de Dados!`);
    setTimeout(() => setSaveSuccessToast(null), 4000);
  };

  const handleConfirmDelete = () => {
    if (!deletingParticipant) return;
    const targetId = deletingParticipant.id;
    const targetName = deletingParticipant.name;
    onUpdateParticipants(participants.filter((p) => p.id !== targetId), targetId);
    setDeletingParticipant(null);
    setSaveSuccessToast(`Participante "${targetName}" eliminado com sucesso.`);
    setTimeout(() => setSaveSuccessToast(null), 3500);
  };

  const handleConfirmClearAll = () => {
    if (onClearAllParticipants) {
      onClearAllParticipants();
    } else {
      onUpdateParticipants([]);
    }
    setShowClearAllModal(false);
    setSaveSuccessToast('Todos os participantes e exemplos foram apagados! Base limpa com sucesso.');
    setTimeout(() => setSaveSuccessToast(null), 4000);
  };

  const handleGenerateBatch = () => {
    const firstNames = ['Dr. Tiago', 'Dra. Inês', 'Dr. Gonçalo', 'Dra. Beatriz', 'Dr. Rodrigo', 'Dra. Carolina', 'Dr. Afonso', 'Dra. Leonor', 'Dr. Martim', 'Dra. Matilde'];
    const lastNames = ['Silva', 'Santos', 'Ferreira', 'Pereira', 'Oliveira', 'Costa', 'Rodrigues', 'Martins', 'Jesus', 'Sousa'];
    const clinics = ['Clínica Dentária São Bento', 'Instituto de Implantologia Lacer', 'Clínica Odontológica da Boavista', 'Centro Dentário do Marquês', 'Smile Clinic Lisboa'];
    const cities = ['Lisboa', 'Porto', 'Braga', 'Coimbra', 'Setúbal', 'Faro', 'Aveiro', 'Funchal'];
    const specialties = [
      'Cirurgia / Implantologia',
      'Periodontologia',
      'Ortodontia',
      'Odontopediatria',
      'Odontologia Geral',
      'Endodontia',
      'Odontologia Restauradora',
      'Higienista Oral'
    ];

    const newBatch: Participant[] = [];
    for (let i = 0; i < 5; i++) {
      const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
      let randomTicket = Math.floor(10000 + Math.random() * 90000).toString();
      while (participants.some((p) => p.ticketNumber === randomTicket) || newBatch.some((b) => b.ticketNumber === randomTicket)) {
        randomTicket = Math.floor(10000 + Math.random() * 90000).toString();
      }
      const phonePrefix = ['91', '92', '93', '96'][Math.floor(Math.random() * 4)];
      const phoneSuffix = Math.floor(1000000 + Math.random() * 8999999);
      const cleanFName = fName.replace('Dr. ', '').replace('Dra. ', '').toLowerCase();

      newBatch.push({
        id: `part-${Date.now()}-${i}`,
        name: `${fName} ${lName}`,
        email: `${cleanFName}.${lName.toLowerCase()}${Math.floor(Math.random() * 99)}@clinica.pt`,
        phone: `+351 ${phonePrefix}${phoneSuffix.toString().slice(0, 3)} ${phoneSuffix.toString().slice(3)}`,
        clinic: clinics[i % clinics.length],
        specialty: specialties[i % specialties.length],
        wantsLacerVisit: i % 2 === 0,
        marketingConsent: true,
        termsAccepted: true,
        document: '',
        city: cities[Math.floor(Math.random() * cities.length)],
        ticketNumber: randomTicket,
        createdAt: new Date().toISOString(),
        status: 'active',
      });
    }

    onUpdateParticipants([...newBatch, ...participants]);
    setSaveSuccessToast('5 profissionais de medicina dentária adicionados e gravados na Base de Dados!');
    setTimeout(() => setSaveSuccessToast(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {saveSuccessToast && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 p-4 rounded-2xl flex items-center justify-between text-xs font-medium shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{saveSuccessToast}</span>
          </div>
          <button onClick={() => setSaveSuccessToast(null)} className="text-emerald-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <span>Base de Dados de Participantes ({participants.length})</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Gerencie inscrições, números da sorte, aplique restrições e exporte relatórios
          </p>
        </div>

        {/* Buttons: Export & Add */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setTempFields({ ...formFields });
              setShowFieldsModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-xs font-semibold shadow transition-colors cursor-pointer"
            title="Configurar campos obrigatórios, opcionais ou ocultos do cadastro"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Campos do Formulário</span>
          </button>

          <button
            onClick={() => exportParticipantsToExcel(filteredParticipants)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold shadow transition-colors cursor-pointer"
            title="Exportar para planilha Excel"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar Excel</span>
          </button>

          <button
            onClick={() => exportParticipantsToPDF(filteredParticipants, brand)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-700 hover:bg-red-600 text-white text-xs font-semibold shadow transition-colors cursor-pointer"
            title="Exportar para documento PDF formatado"
          >
            <FileText className="w-4 h-4" />
            <span>Exportar PDF</span>
          </button>

          {participants.length > 0 && (
            <button
              onClick={() => setShowClearAllModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-950/70 hover:bg-red-900/90 text-red-300 border border-red-800/80 text-xs font-semibold shadow transition-colors cursor-pointer"
              title="Remover todos os exemplos e participantes para deixar a base e o formulário limpos"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span>Limpar Exemplos ({participants.length})</span>
            </button>
          )}

          <button
            onClick={handleGenerateBatch}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
            title="Gerar 5 participantes automáticos para simulação"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>+5 Simulação</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Novo Participante</span>
          </button>
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex items-center gap-3 shadow-md">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Inscritos</span>
            <span className="text-lg font-bold text-white font-mono">{participants.length}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex items-center gap-3 shadow-md">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Clínicas / Consultórios</span>
            <span className="text-lg font-bold text-white font-mono">{participants.filter((p) => p.clinic && p.clinic.trim()).length}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex items-center gap-3 shadow-md">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Visitas Lacer Solicitadas</span>
            <span className="text-lg font-bold text-emerald-400 font-mono">{participants.filter((p) => p.wantsLacerVisit).length}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex items-center gap-3 shadow-md">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Comercial Autorizado</span>
            <span className="text-lg font-bold text-purple-300 font-mono">{participants.filter((p) => p.marketingConsent !== false).length}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, bilhete, e-mail, telefone, clínica, especialidade ou cidade..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium cursor-pointer ${
              statusFilter === 'all' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos ({participants.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium cursor-pointer ${
              statusFilter === 'active' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Ativos ({participants.filter((p) => p.status === 'active').length})
          </button>
          <button
            onClick={() => setStatusFilter('wants_visit')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium cursor-pointer ${
              statusFilter === 'wants_visit' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-emerald-400'
            }`}
          >
            Visita Lacer ({participants.filter((p) => p.wantsLacerVisit).length})
          </button>
          <button
            onClick={() => setStatusFilter('marketing_yes')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium cursor-pointer ${
              statusFilter === 'marketing_yes' ? 'bg-purple-500 text-white font-bold' : 'text-slate-400 hover:text-purple-300'
            }`}
          >
            Comercial ({participants.filter((p) => p.marketingConsent !== false).length})
          </button>
          <button
            onClick={() => setStatusFilter('winner')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium cursor-pointer ${
              statusFilter === 'winner' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Premiados ({participants.filter((p) => p.status === 'winner').length})
          </button>
        </div>
      </div>

      {/* Participants Table */}
      {/* Participants Container: Mobile Cards (<md) & Desktop Table (>=md) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {/* Mobile View: Clean Touch Cards */}
        <div className="md:hidden divide-y divide-slate-800/80">
          {filteredParticipants.map((p) => (
            <div key={p.id} className="p-4 space-y-2.5 hover:bg-slate-800/30 transition-colors">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-amber-400 text-sm bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 inline-flex items-center gap-1">
                  <Ticket className="w-3.5 h-3.5 opacity-70" />
                  #{p.ticketNumber}
                </span>
                <div className="flex items-center gap-1.5">
                  {p.wantsLacerVisit && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
                      ✓ Visita
                    </span>
                  )}
                  {p.marketingConsent && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-300 bg-purple-500/15 px-2 py-0.5 rounded border border-purple-500/30">
                      ✓ Comercial
                    </span>
                  )}
                  {p.status === 'winner' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
                      🏆 Premiado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Ativo
                    </span>
                  )}
                </div>
              </div>

              <div>
                <p className="font-bold text-white text-sm">{p.name}</p>
                <p className="text-slate-400 text-xs">{p.email} · {p.phone}</p>
                
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-1.5">
                  {p.clinic && (
                    <span className="inline-flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      <Building2 className="w-3 h-3 text-amber-400" />
                      {p.clinic}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    📍 {p.city || 'Portugal'}
                  </span>
                  {p.specialty && (
                    <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded border border-amber-500/20">
                      <Stethoscope className="w-3 h-3 text-amber-400" />
                      {p.specialty}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-800/80 text-[11px] text-slate-500">
                  <span>{new Date(p.createdAt).toLocaleDateString('pt-PT')} {new Date(p.createdAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</span>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setViewingParticipant(p)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer"
                      title="Ver Ficha Completa"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleStartEdit(p)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors cursor-pointer"
                      title="Editar Informações"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingParticipant(p)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {participants.length === 0 ? (
            <div className="p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-amber-400">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">Formulário e Base Limpos</h4>
              <p className="text-xs text-slate-400">
                Nenhum participante registado. Pronto para receber novas inscrições pelo telemóvel ou computador.
              </p>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={handleOpenAddModal}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Registar Novo Participante</span>
                </button>
              </div>
            </div>
          ) : filteredParticipants.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              Nenhum participante encontrado para esta pesquisa.
            </div>
          ) : null}
        </div>

        {/* Desktop View: Full Data Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">Bilhete</th>
                <th className="py-3 px-3">Nome & Contacto</th>
                <th className="py-3 px-3">Clínica / Consultório</th>
                <th className="py-3 px-3">Cidade</th>
                <th className="py-3 px-3">Especialidade</th>
                <th className="py-3 px-3">Visita Lacer</th>
                <th className="py-3 px-3">Comercial / Novidades</th>
                <th className="py-3 px-3">Regulamento & RGPD</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Data Inscrição</th>
                <th className="py-3 px-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredParticipants.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3">
                    <span className="font-mono font-bold text-amber-400 text-sm bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 inline-flex items-center gap-1">
                      <Ticket className="w-3.5 h-3.5 opacity-70" />
                      #{p.ticketNumber}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <p className="font-bold text-white text-sm">{p.name}</p>
                    <p className="text-slate-400 text-[11px]">{p.email} · {p.phone}</p>
                  </td>
                  <td className="py-3 px-3 text-slate-200">
                    {p.clinic ? (
                      <span className="font-medium">{p.clinic}</span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    {p.city || '-'}
                  </td>
                  <td className="py-3 px-3">
                    {p.specialty ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {p.specialty}
                      </span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    {p.wantsLacerVisit ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
                        ✓ Sim (Visita)
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">Não</span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    {p.marketingConsent ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-300 bg-purple-500/15 px-2 py-0.5 rounded border border-purple-500/30">
                        ✓ Autorizado
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">Não</span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    {p.termsAccepted !== false ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        ✓ Aceite
                      </span>
                    ) : (
                      <span className="text-amber-400 text-[10px]">Pendente</span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    {p.status === 'winner' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
                        🏆 Premiado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Ativo
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-400 text-[11px]">
                    {new Date(p.createdAt).toLocaleDateString('pt-PT')} {new Date(p.createdAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setViewingParticipant(p)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer"
                        title="Ver Ficha Completa"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleStartEdit(p)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors cursor-pointer"
                        title="Editar Dados do Participante"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingParticipant(p)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Eliminar Participante"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {participants.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-amber-400">
                        <Users className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-white">Formulário e Base de Dados Limpos</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Nenhum participante registado. O formulário e a base de dados estão 100% limpos e prontos para receber inscrições reais.
                      </p>
                      <div className="flex items-center justify-center gap-2 pt-2">
                        <button
                          onClick={handleOpenAddModal}
                          className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow flex items-center gap-1.5 cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Registar Novo Participante</span>
                        </button>
                        <button
                          onClick={handleGenerateBatch}
                          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>+5 Simulação (Teste)</span>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-500">
                    Nenhum participante encontrado com os critérios de pesquisa selecionados.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Novo Participante */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-400" />
                <span>Registar Novo Participante Manual</span>
              </h3>
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Grave o participante diretamente na Base de Dados Oficial (<code className="text-amber-400">data/database.json</code>).
            </p>

            {/* Error Message inside modal */}
            {formError && (
              <div className="bg-red-500/15 border border-red-500/30 text-red-300 p-3 rounded-xl mb-4 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="flex-1">{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddParticipant} className="space-y-4" autoComplete="off">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Nome Completo {formFields.name.required && '*'}
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Dr. João Silva"
                  autoComplete="off"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    E-mail Profissional {formFields.email.required && '*'}
                  </label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="joao.silva@clinica.pt"
                    autoComplete="off"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Telefone / Contacto {formFields.phone.required && '*'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="912 345 678"
                    autoComplete="off"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Clínica / Consultório
                  </label>
                  <input
                    type="text"
                    value={newClinic}
                    onChange={(e) => setNewClinic(e.target.value)}
                    placeholder="Nome da Clínica"
                    autoComplete="off"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Cidade {formFields.city.required && '*'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    placeholder="Ex: Lisboa, Porto..."
                    autoComplete="off"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Especialidade Odontológica */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Especialidade Odontológica
                </label>
                <select
                  value={newSpecialty}
                  onChange={(e) => setNewSpecialty(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {DENTAL_SPECIALTIES.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </select>

                {newSpecialty === 'Outra' && (
                  <input
                    type="text"
                    value={newSpecialtyOther}
                    onChange={(e) => setNewSpecialtyOther(e.target.value)}
                    placeholder="Indique a especialidade..."
                    className="mt-2 w-full bg-slate-950 border border-amber-500/50 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                )}
              </div>

              {/* Visita Lacer e Marketing Consent */}
              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2.5 p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl cursor-pointer text-xs text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={newWantsLacerVisit}
                    onChange={(e) => setNewWantsLacerVisit(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500"
                  />
                  <span>Gostaria de agendar visita de representante da Lacer</span>
                </label>

                <label className="flex items-center gap-2.5 p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl cursor-pointer text-xs text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={newMarketingConsent}
                    onChange={(e) => setNewMarketingConsent(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500"
                  />
                  <span>Autoriza contacto sobre produtos, novidades e eventos Lacer</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    NIF / Doc (Opcional)
                  </label>
                  <input
                    type="text"
                    value={newDoc}
                    onChange={(e) => setNewDoc(e.target.value)}
                    placeholder="Opcional"
                    autoComplete="off"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    N.º do Bilhete (Opcional)
                  </label>
                  <input
                    type="text"
                    value={customTicket}
                    onChange={(e) => setCustomTicket(e.target.value)}
                    placeholder="Vazio = aleatório"
                    autoComplete="off"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Extra ticket option */}
              <label className="flex items-center gap-2 p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl cursor-pointer text-xs text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={allowExtraTicket}
                  onChange={(e) => setAllowExtraTicket(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500"
                />
                <span>Permitir bilhete extra para participante que já possua outro bilhete</span>
              </label>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Gravar na Base de Dados</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Deletion */}
      {deletingParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-400" />
              <span>Remover Participante</span>
            </h3>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              Tem a certeza de que deseja eliminar o participante <strong>{deletingParticipant.name}</strong> (Bilhete #{deletingParticipant.ticketNumber}) da base de dados do sorteio?
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingParticipant(null)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm Clear All / Remove Examples */}
      {showClearAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-red-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-400" />
              <span>Remover Todos os Exemplos</span>
            </h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Deseja realmente remover todos os <strong>{participants.length} participantes</strong> e deixar o formulário e a base de dados 100% limpos?
            </p>
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[11px] text-red-300 mb-6 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>Esta ação eliminará todos os participantes da base de dados e da memória, deixando o sistema totalmente limpo para novas inscrições reais.</span>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowClearAllModal(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAll}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Limpar Tudo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Ver Ficha Completa do Participante */}
      {viewingParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-bold text-amber-400 text-sm bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/25 inline-flex items-center gap-1.5">
                    <Ticket className="w-4 h-4" />
                    Bilhete #{viewingParticipant.ticketNumber}
                  </span>
                  {viewingParticipant.status === 'winner' ? (
                    <span className="text-[11px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                      🏆 Vencedor Homologado
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Ativo no Sorteio
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-white">{viewingParticipant.name}</h3>
                <p className="text-xs text-slate-400">Ficha oficial completa registada na base de dados</p>
              </div>

              <button
                type="button"
                onClick={() => setViewingParticipant(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Informações de Contacto & Clínica */}
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-3">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  <span>Dados de Contacto & Clínica</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Nome Completo</span>
                    <span className="text-white font-medium">{viewingParticipant.name}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">E-mail Profissional</span>
                    <a href={`mailto:${viewingParticipant.email}`} className="text-blue-400 hover:underline font-mono">
                      {viewingParticipant.email}
                    </a>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Telefone</span>
                    <a href={`tel:${viewingParticipant.phone}`} className="text-slate-200 font-mono">
                      {viewingParticipant.phone || 'Não informado'}
                    </a>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Cidade</span>
                    <span className="text-slate-200">{viewingParticipant.city || 'Portugal'}</span>
                  </div>

                  <div className="sm:col-span-2">
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Clínica / Consultório</span>
                    <span className="text-white font-semibold">
                      {viewingParticipant.clinic || 'Não indicada'}
                    </span>
                  </div>

                  {viewingParticipant.document && (
                    <div className="sm:col-span-2">
                      <span className="text-slate-500 block text-[10px] uppercase font-semibold">NIF / Cédula Profissional</span>
                      <span className="text-slate-300 font-mono">{viewingParticipant.document}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Especialidade Odontológica */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2 mb-2">
                  <Stethoscope className="w-4 h-4" />
                  <span>Especialidade</span>
                </h4>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 font-semibold text-xs">
                  <Stethoscope className="w-4 h-4 text-amber-400" />
                  <span>{viewingParticipant.specialty || 'Não especificada'}</span>
                </div>
              </div>

              {/* Visita Lacer & Consentimentos */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-3">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Visita Lacer & Consentimentos</span>
                </h4>

                <div className="space-y-2.5 text-xs">
                  {/* Visita Comercial */}
                  <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                    viewingParticipant.wantsLacerVisit 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200' 
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}>
                    <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${viewingParticipant.wantsLacerVisit ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <div>
                      <p className="font-semibold text-white">Visita de Representante Lacer à Clínica</p>
                      <p className="text-[11px] mt-0.5">
                        {viewingParticipant.wantsLacerVisit
                          ? '✓ Sim, solicitou agendamento de visita de representante da Lacer.'
                          : 'Não solicitou visita de representante.'}
                      </p>
                    </div>
                  </div>

                  {/* Regulamento & RGPD */}
                  <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                    viewingParticipant.termsAccepted !== false
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                  }`}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-white">Regulamento & Proteção de Dados (RGPD)</p>
                      <p className="text-[11px] mt-0.5 text-slate-300">
                        {viewingParticipant.termsAccepted !== false
                          ? '✓ Leu e aceitou o regulamento do sorteio e a política de privacidade da Lacer.'
                          : 'Pendente de validação de termos.'}
                      </p>
                    </div>
                  </div>

                  {/* Comercial e Marketing */}
                  <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                    viewingParticipant.marketingConsent !== false
                      ? 'bg-purple-500/10 border-purple-500/30 text-purple-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}>
                    <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${viewingParticipant.marketingConsent !== false ? 'text-purple-400' : 'text-slate-600'}`} />
                    <div>
                      <p className="font-semibold text-white">Autorização Comercial & Novidades</p>
                      <p className="text-[11px] mt-0.5">
                        {viewingParticipant.marketingConsent !== false
                          ? '✓ Autorizou a Lacer a contactar para novidades, produtos, eventos e visitas comerciais.'
                          : 'Não autorizou contactos comerciais adicionais.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Metadados */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                <span>Inscrição: {new Date(viewingParticipant.createdAt).toLocaleDateString('pt-PT')} às {new Date(viewingParticipant.createdAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</span>
                <span className="font-mono text-[10px]">ID: {viewingParticipant.id}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-5 mt-5 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setDeletingParticipant(viewingParticipant);
                  setViewingParticipant(null);
                }}
                className="px-3.5 py-2 rounded-xl text-red-400 hover:bg-red-500/10 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleStartEdit(viewingParticipant);
                    setViewingParticipant(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-slate-700"
                >
                  <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Editar Dados</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewingParticipant(null)}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar Participante */}
      {editingParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-400" />
                <span>Editar Dados do Participante</span>
              </h3>
              <button 
                type="button" 
                onClick={() => setEditingParticipant(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Atualize as informações recolhidas deste participante na base de dados.
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-4" autoComplete="off">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    E-mail Profissional *
                  </label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Clínica / Consultório
                  </label>
                  <input
                    type="text"
                    value={editClinic}
                    onChange={(e) => setEditClinic(e.target.value)}
                    placeholder="Nome da Clínica"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    placeholder="Cidade"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Especialidade Odontológica */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Especialidade
                </label>
                <select
                  value={editSpecialty}
                  onChange={(e) => setEditSpecialty(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {DENTAL_SPECIALTIES.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </select>

                {editSpecialty === 'Outra' && (
                  <input
                    type="text"
                    value={editSpecialtyOther}
                    onChange={(e) => setEditSpecialtyOther(e.target.value)}
                    placeholder="Indique a especialidade..."
                    className="mt-2 w-full bg-slate-950 border border-amber-500/50 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                )}
              </div>

              {/* Visita Lacer e Marketing Consent */}
              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2.5 p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl cursor-pointer text-xs text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={editWantsLacerVisit}
                    onChange={(e) => setEditWantsLacerVisit(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500"
                  />
                  <span>Gostaria que um representante da Lacer visitasse a sua clínica</span>
                </label>

                <label className="flex items-center gap-2.5 p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl cursor-pointer text-xs text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={editMarketingConsent}
                    onChange={(e) => setEditMarketingConsent(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500"
                  />
                  <span>Autoriza a Lacer a contactar para informação sobre produtos, novidades e eventos</span>
                </label>

                <label className="flex items-center gap-2.5 p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl cursor-pointer text-xs text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={editTermsAccepted}
                    onChange={(e) => setEditTermsAccepted(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500"
                  />
                  <span>Declara que leu e aceita o regulamento e política de privacidade Lacer (RGPD)</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    N.º do Bilhete
                  </label>
                  <input
                    type="text"
                    required
                    value={editTicketNumber}
                    onChange={(e) => setEditTicketNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="active">Ativo no Sorteio</option>
                    <option value="winner">Premiado</option>
                    <option value="banned">Banido / Cancelado</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingParticipant(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Configurar Campos do Formulário */}
      {showFieldsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <SlidersHorizontal className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white">
                  Configurar Informações dos Participantes
                </h3>
              </div>
              <button
                onClick={() => setShowFieldsModal(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕ Fechar
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-6">
              Defina quais informações são <strong>obrigatórias</strong>, quais são <strong>opcionais</strong> e quais deseja <strong>ocultar</strong> no formulário público de inscrição.
            </p>

            <div className="space-y-4">
              {(Object.keys(tempFields) as Array<keyof FormFieldsConfig>).map((key) => {
                const field = tempFields[key];
                if (!field) return null;
                return (
                  <div
                    key={key}
                    className={`p-4 rounded-2xl border transition-all ${
                      field.enabled
                        ? 'bg-slate-950 border-slate-800'
                        : 'bg-slate-950/40 border-slate-800/40 opacity-60'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          {field.label}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">({key})</span>
                      </div>

                      {/* Controls: Enabled & Required */}
                      <div className="flex items-center gap-4 text-xs">
                        <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
                          <input
                            type="checkbox"
                            checked={field.enabled}
                            onChange={(e) => {
                              setTempFields({
                                ...tempFields,
                                [key]: { ...field, enabled: e.target.checked },
                              });
                            }}
                            className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500"
                          />
                          <span>Exibir no formulário</span>
                        </label>

                        {field.enabled && (
                          <label className="flex items-center gap-1.5 cursor-pointer text-amber-400 font-medium">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) => {
                                setTempFields({
                                  ...tempFields,
                                  [key]: { ...field, required: e.target.checked },
                                });
                              }}
                              className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500"
                            />
                            <span>Obrigatório</span>
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Field label customization */}
                    {field.enabled && (
                      <div className="mt-2 pt-2 border-t border-slate-900 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-400 uppercase mb-0.5">
                            Rótulo Exibido:
                          </label>
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => {
                              setTempFields({
                                ...tempFields,
                                [key]: { ...field, label: e.target.value },
                              });
                            }}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 uppercase mb-0.5">
                            Texto Exemplo (Placeholder):
                          </label>
                          <input
                            type="text"
                            value={field.placeholder || ''}
                            onChange={(e) => {
                              setTempFields({
                                ...tempFields,
                                [key]: { ...field, placeholder: e.target.value },
                              });
                            }}
                            placeholder="Deixe vazio para campo limpo..."
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-800 mt-6">
              <button
                type="button"
                onClick={() => setShowFieldsModal(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateFormFields(tempFields);
                  setShowFieldsModal(false);
                  setSaveSuccessToast('Configuração dos campos guardada com sucesso e sincronizada com o formulário!');
                  setTimeout(() => setSaveSuccessToast(null), 3500);
                }}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Guardar Configuração</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
