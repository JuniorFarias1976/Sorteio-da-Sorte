import React, { useState, useEffect } from 'react';
import { Participant, BrandConfig, FormFieldsConfig } from '../../types';
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
  Ticket
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'winner'>('all');
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
  const [newCity, setNewCity] = useState('');
  const [customTicket, setCustomTicket] = useState('');
  const [allowExtraTicket, setAllowExtraTicket] = useState(false);

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
      (p.document || '').includes(query) ||
      (p.ticketNumber || '').toLowerCase().includes(query) ||
      (p.city || '').toLowerCase().includes(query);

    const matchStatus = statusFilter === 'all' ? true : p.status === statusFilter;
    return matchQuery && matchStatus;
  });

  const handleOpenAddModal = () => {
    setFormError(null);
    setNewName('');
    setNewEmail('');
    setNewPhone('');
    setNewDoc('');
    setNewCity('');
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
    if (formFields.document.enabled && formFields.document.required && !newDoc.trim()) {
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

    const created: Participant = {
      id: `part-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: newName.trim() || 'Participante',
      email: normalizedEmail || 'sem-email@sorteiolive.com',
      phone: newPhone.trim() || 'Não informado',
      document: newDoc.trim() || 'Não informado',
      city: newCity.trim() || 'Brasil',
      ticketNumber: ticket,
      createdAt: new Date().toISOString(),
      status: 'active',
    };

    onUpdateParticipants([created, ...participants]);
    setShowAddModal(false);
    setSaveSuccessToast(`Participante "${created.name}" (Bilhete #${created.ticketNumber}) gravado com sucesso no Banco de Dados!`);
    setTimeout(() => setSaveSuccessToast(null), 4000);
  };

  const handleConfirmDelete = () => {
    if (!deletingParticipant) return;
    const targetId = deletingParticipant.id;
    const targetName = deletingParticipant.name;
    onUpdateParticipants(participants.filter((p) => p.id !== targetId), targetId);
    setDeletingParticipant(null);
    setSaveSuccessToast(`Participante "${targetName}" removido com sucesso.`);
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
    const firstNames = ['Matheus', 'Camila', 'Rafael', 'Larissa', 'Gabriel', 'Beatriz', 'Lucas', 'Mariana', 'Diego', 'Juliana'];
    const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes'];
    const cities = ['São Paulo - SP', 'Rio de Janeiro - RJ', 'Belo Horizonte - MG', 'Curitiba - PR', 'Porto Alegre - RS', 'Salvador - BA', 'Fortaleza - CE'];

    const newBatch: Participant[] = [];
    for (let i = 0; i < 5; i++) {
      const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
      let randomTicket = Math.floor(10000 + Math.random() * 90000).toString();
      while (participants.some((p) => p.ticketNumber === randomTicket) || newBatch.some((b) => b.ticketNumber === randomTicket)) {
        randomTicket = Math.floor(10000 + Math.random() * 90000).toString();
      }
      const phoneDDD = Math.floor(11 + Math.random() * 80);
      const phoneNum = Math.floor(900000000 + Math.random() * 99999999);

      newBatch.push({
        id: `part-${Date.now()}-${i}`,
        name: `${fName} ${lName}`,
        email: `${fName.toLowerCase()}.${lName.toLowerCase()}${Math.floor(Math.random() * 99)}@gmail.com`,
        phone: `(${phoneDDD}) ${phoneNum.toString().slice(0, 5)}-${phoneNum.toString().slice(5)}`,
        document: `${Math.floor(100 + Math.random() * 899)}.${Math.floor(100 + Math.random() * 899)}.${Math.floor(100 + Math.random() * 899)}-${Math.floor(10 + Math.random() * 89)}`,
        city: cities[Math.floor(Math.random() * cities.length)],
        ticketNumber: randomTicket,
        createdAt: new Date().toISOString(),
        status: 'active',
      });
    }

    onUpdateParticipants([...newBatch, ...participants]);
    setSaveSuccessToast('5 participantes de simulação adicionados e sincronizados com a Base de Dados!');
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

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, bilhete, e-mail, telefone, CPF ou cidade..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Bilhete</th>
                <th className="py-3 px-4">Nome & Contato</th>
                <th className="py-3 px-4">CPF / Documento</th>
                <th className="py-3 px-4">Localidade</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Data Inscrição</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredParticipants.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-amber-400 text-sm bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 inline-flex items-center gap-1">
                      <Ticket className="w-3.5 h-3.5 opacity-70" />
                      #{p.ticketNumber}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-bold text-white text-sm">{p.name}</p>
                    <p className="text-slate-400 text-[11px]">{p.email} · {p.phone}</p>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">
                    {p.document || 'Não informado'}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {p.city || 'Não informado'}
                  </td>
                  <td className="py-3 px-4">
                    {p.status === 'winner' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
                        🏆 Contemplado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Ativo
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {new Date(p.createdAt).toLocaleDateString('pt-BR')} {new Date(p.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setDeletingParticipant(p)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Excluir Participante"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}

              {participants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-amber-400">
                        <Users className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-white">Formulário e Base de Dados Limpos</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Nenhum participante de exemplo cadastrado. O formulário e o banco de dados estão 100% limpos e prontos para receber inscrições reais.
                      </p>
                      <div className="flex items-center justify-center gap-2 pt-2">
                        <button
                          onClick={handleOpenAddModal}
                          className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow flex items-center gap-1.5 cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Cadastrar Novo Participante</span>
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
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Nenhum participante encontrado com os critérios de busca selecionados.
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
                <span>Cadastrar Novo Participante Manual</span>
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

            <form onSubmit={handleAddParticipant} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Nome Completo {formFields.name.required && '*'}
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Carlos Eduardo Silva"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    E-mail {formFields.email.required && '*'}
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    WhatsApp / Telefone {formFields.phone.required && '*'}
                  </label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    CPF ou Documento {formFields.document.required && '*'}
                  </label>
                  <input
                    type="text"
                    value={newDoc}
                    onChange={(e) => setNewDoc(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Cidade / UF {formFields.city.required && '*'}
                  </label>
                  <input
                    type="text"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    placeholder="Ex: São Paulo - SP"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Número do Bilhete (Opcional - deixe vazio para gerar automático)
                </label>
                <input
                  type="text"
                  value={customTicket}
                  onChange={(e) => setCustomTicket(e.target.value)}
                  placeholder="Ex: 55443"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Extra ticket option */}
              <label className="flex items-center gap-2 p-3 bg-slate-950/60 border border-slate-800 rounded-xl cursor-pointer text-xs text-slate-300 hover:text-white">
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
              Tem certeza que deseja excluir o participante <strong>{deletingParticipant.name}</strong> (Bilhete #{deletingParticipant.ticketNumber}) da base de dados do sorteio?
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
                <span>Sim, Excluir</span>
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
              Deseja realmente remover todos os <strong>{participants.length} participantes</strong> e deixar o formulário e o banco de dados 100% limpos?
            </p>
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[11px] text-red-300 mb-6 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>Esta ação excluirá todos os participantes da nuvem (Firestore), do arquivo local e da memória, deixando o sistema zerado para novos cadastros reais.</span>
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
                  setSaveSuccessToast('Configuração dos campos salva com sucesso e sincronizada com o formulário!');
                  setTimeout(() => setSaveSuccessToast(null), 3500);
                }}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Configuração</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
