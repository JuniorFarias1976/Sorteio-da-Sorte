import React, { useState } from 'react';
import { Participant, BrandConfig } from '../../types';
import { exportParticipantsToExcel, exportParticipantsToPDF } from '../../utils/export';
import { 
  Users, 
  FileSpreadsheet, 
  FileText, 
  UserPlus, 
  Search, 
  Filter, 
  Ban, 
  CheckCircle, 
  Trash2, 
  Edit3, 
  Download,
  Upload,
  Ticket,
  Sparkles
} from 'lucide-react';

interface ParticipantsTabProps {
  participants: Participant[];
  brand: BrandConfig;
  onUpdateParticipants: (updated: Participant[]) => void;
}

export const ParticipantsTab: React.FC<ParticipantsTabProps> = ({
  participants,
  brand,
  onUpdateParticipants,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'winner' | 'banned'>('all');
  
  // Modal: Add participant
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newDoc, setNewDoc] = useState('');
  const [newCity, setNewCity] = useState('');
  const [customTicket, setCustomTicket] = useState('');

  // Ban action prompt
  const [banModalTarget, setBanModalTarget] = useState<Participant | null>(null);
  const [banReasonInput, setBanReasonInput] = useState('');

  // Filtered list
  const filteredParticipants = participants.filter((p) => {
    const query = search.toLowerCase();
    const matchQuery =
      p.name.toLowerCase().includes(query) ||
      p.email.toLowerCase().includes(query) ||
      p.phone.includes(query) ||
      p.document.includes(query) ||
      p.ticketNumber.toLowerCase().includes(query) ||
      p.city.toLowerCase().includes(query);

    const matchStatus = statusFilter === 'all' ? true : p.status === statusFilter;
    return matchQuery && matchStatus;
  });

  const handleAddParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim() || !newPhone.trim()) {
      alert('Preencha os campos obrigatórios (Nome, E-mail e Telefone).');
      return;
    }

    let ticket = customTicket.trim();
    if (!ticket) {
      ticket = Math.floor(10000 + Math.random() * 90000).toString();
      while (participants.some((p) => p.ticketNumber === ticket)) {
        ticket = Math.floor(10000 + Math.random() * 90000).toString();
      }
    }

    const created: Participant = {
      id: `part-${Date.now()}`,
      name: newName.trim(),
      email: newEmail.trim().toLowerCase(),
      phone: newPhone.trim(),
      document: newDoc.trim() || 'Não informado',
      city: newCity.trim() || 'Brasil',
      ticketNumber: ticket,
      createdAt: new Date().toISOString(),
      status: 'active',
    };

    onUpdateParticipants([created, ...participants]);
    setShowAddModal(false);
    setNewName('');
    setNewEmail('');
    setNewPhone('');
    setNewDoc('');
    setNewCity('');
    setCustomTicket('');
  };

  const handleConfirmBan = () => {
    if (!banModalTarget) return;
    const updated = participants.map((p) => {
      if (p.id === banModalTarget.id) {
        return {
          ...p,
          status: 'banned' as const,
          banReason: banReasonInput.trim() || 'Restrição imposta pela moderação administrativa.',
          banDate: new Date().toISOString(),
        };
      }
      return p;
    });
    onUpdateParticipants(updated);
    setBanModalTarget(null);
    setBanReasonInput('');
  };

  const handleUnban = (id: string) => {
    const updated = participants.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          status: 'active' as const,
          banReason: undefined,
          banDate: undefined,
        };
      }
      return p;
    });
    onUpdateParticipants(updated);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja remover este participante do banco de dados?')) {
      onUpdateParticipants(participants.filter((p) => p.id !== id));
    }
  };

  const handleGenerateBatch = () => {
    const firstNames = ['Matheus', 'Camila', 'Rafael', 'Larissa', 'Gabriel', 'Beatriz', 'Lucas', 'Mariana', 'Diego', 'Juliana'];
    const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes'];
    const cities = ['São Paulo - SP', 'Rio de Janeiro - RJ', 'Belo Horizonte - MG', 'Curitiba - PR', 'Porto Alegre - RS', 'Salvador - BA', 'Fortaleza - CE'];

    const newBatch: Participant[] = [];
    for (let i = 0; i < 5; i++) {
      const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const randomTicket = Math.floor(10000 + Math.random() * 90000).toString();
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
  };

  return (
    <div className="space-y-6">
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
            onClick={() => exportParticipantsToExcel(filteredParticipants)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold shadow transition-colors"
            title="Exportar para planilha Excel"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar Excel</span>
          </button>

          <button
            onClick={() => exportParticipantsToPDF(filteredParticipants, brand)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-700 hover:bg-red-600 text-white text-xs font-semibold shadow transition-colors"
            title="Exportar para documento PDF formatado"
          >
            <FileText className="w-4 h-4" />
            <span>Exportar PDF</span>
          </button>

          <button
            onClick={handleGenerateBatch}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
            title="Gerar 5 participantes automáticos para simulação"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>+5 Simulação</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md transition-colors"
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
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
              statusFilter === 'all' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos ({participants.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
              statusFilter === 'active' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Ativos ({participants.filter((p) => p.status === 'active').length})
          </button>
          <button
            onClick={() => setStatusFilter('winner')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
              statusFilter === 'winner' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Premiados ({participants.filter((p) => p.status === 'winner').length})
          </button>
          <button
            onClick={() => setStatusFilter('banned')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
              statusFilter === 'banned' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Banidos ({participants.filter((p) => p.status === 'banned').length})
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
                    <span className="font-mono font-bold text-amber-400 text-sm bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      #{p.ticketNumber}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-bold text-white text-sm">{p.name}</p>
                    <p className="text-slate-400 text-[11px]">{p.email} · {p.phone}</p>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">
                    {p.document}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {p.city}
                  </td>
                  <td className="py-3 px-4">
                    {p.status === 'active' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        <CheckCircle className="w-3 h-3" />
                        Ativo
                      </span>
                    )}
                    {p.status === 'winner' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
                        🏆 Contemplado
                      </span>
                    )}
                    {p.status === 'banned' && (
                      <span 
                        title={p.banReason || 'Banido por infração'} 
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 cursor-help"
                      >
                        <Ban className="w-3 h-3" />
                        Banido
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {new Date(p.createdAt).toLocaleDateString('pt-BR')} {new Date(p.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {p.status === 'banned' ? (
                        <button
                          onClick={() => handleUnban(p.id)}
                          className="px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium text-[11px]"
                          title="Remover Restrição e Reativar"
                        >
                          Desbanir
                        </button>
                      ) : (
                        <button
                          onClick={() => setBanModalTarget(p)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Restringir / Banir Participante"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Remover Registro"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredParticipants.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Nenhum participante encontrado com os critérios de busca selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Novo Participante */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-amber-400" />
              <span>Cadastrar Novo Participante Manual</span>
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Adicione um participante manualmente à base de dados do sorteio.
            </p>

            <form onSubmit={handleAddParticipant} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    E-mail *
                  </label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    WhatsApp / Telefone *
                  </label>
                  <input
                    type="text"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    CPF ou Documento
                  </label>
                  <input
                    type="text"
                    value={newDoc}
                    onChange={(e) => setNewDoc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Cidade / UF
                  </label>
                  <input
                    type="text"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Bilhete Específico (Opcional - deixe vazio para gerar automático)
                </label>
                <input
                  type="text"
                  value={customTicket}
                  onChange={(e) => setCustomTicket(e.target.value)}
                  placeholder="Ex: 55443"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow"
                >
                  Salvar Participante
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Banimento */}
      {banModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-red-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 text-red-400 mb-3">
              <Ban className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">
                Restringir / Banir Participante
              </h3>
            </div>
            <p className="text-xs text-slate-300 mb-4">
              Você está prestes a bloquear <strong>{banModalTarget.name}</strong> (Bilhete #{banModalTarget.ticketNumber}).
              Participantes banidos são impedidos de serem sorteados no telão da live e bloqueados no sistema.
            </p>

            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
              Motivo do Banimento *
            </label>
            <textarea
              rows={3}
              value={banReasonInput}
              onChange={(e) => setBanReasonInput(e.target.value)}
              placeholder="Ex: CPF inválido, suspeita de bot, violação das diretrizes do sorteio..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setBanModalTarget(null)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmBan}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow"
              >
                Confirmar Banimento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
