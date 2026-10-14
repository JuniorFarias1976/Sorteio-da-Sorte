import React, { useState } from 'react';
import { Participant } from '../../types';
import { ShieldAlert, Ban, CheckCircle, Search, UserX, AlertTriangle, Plus } from 'lucide-react';

interface BannedUsersTabProps {
  participants: Participant[];
  onUpdateParticipants: (participants: Participant[]) => void;
}

export const BannedUsersTab: React.FC<BannedUsersTabProps> = ({
  participants,
  onUpdateParticipants,
}) => {
  const [search, setSearch] = useState('');
  const [showAddBlacklistModal, setShowAddBlacklistModal] = useState(false);

  // Blacklist manual entry form
  const [bName, setBName] = useState('');
  const [bEmail, setBEmail] = useState('');
  const [bPhone, setBPhone] = useState('');
  const [bDoc, setBDoc] = useState('');
  const [bReason, setBReason] = useState('');

  const bannedParticipants = participants.filter((p) => p.status === 'banned');

  const filteredBanned = bannedParticipants.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.phone.includes(q) ||
      p.document.includes(q) ||
      (p.banReason && p.banReason.toLowerCase().includes(q))
    );
  });

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

  const handleAddBlacklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bName.trim() || !bReason.trim()) {
      alert('Preencha ao menos o nome e o motivo da restrição.');
      return;
    }

    const newBannedUser: Participant = {
      id: `banned-${Date.now()}`,
      name: bName.trim(),
      email: bEmail.trim().toLowerCase() || 'bloqueado@blacklist.com',
      phone: bPhone.trim() || '(00) 00000-0000',
      document: bDoc.trim() || 'Bloqueado',
      city: 'Restrito',
      ticketNumber: 'BLOQ-' + Math.floor(1000 + Math.random() * 9000),
      createdAt: new Date().toISOString(),
      status: 'banned',
      banReason: bReason.trim(),
      banDate: new Date().toISOString(),
    };

    onUpdateParticipants([newBannedUser, ...participants]);
    setShowAddBlacklistModal(false);
    setBName('');
    setBEmail('');
    setBPhone('');
    setBDoc('');
    setBReason('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            <span>Gestão de Usuários Banidos & Restrições ({bannedParticipants.length})</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Controle de participantes bloqueados, lista negra anti-fraude e histórico de motivos
          </p>
        </div>

        <button
          onClick={() => setShowAddBlacklistModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md transition-colors"
        >
          <UserX className="w-4 h-4" />
          <span>Inserir na Lista Negra</span>
        </button>
      </div>

      {/* Safety Notice Card */}
      <div className="bg-red-950/20 border border-red-500/30 rounded-2xl p-4 flex items-start gap-3 text-xs text-red-200">
        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold text-white">Blindagem no Telão do Sorteio:</strong>
          <p className="text-red-300/90 mt-0.5">
            Todos os usuários listados abaixo são estritamente excluídos do algoritmo da roleta ao vivo. Mesmo que possuam bilhetes emitidos anteriormente, o sistema impede a premiação e emite aviso em auditoria.
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar por nome, CPF, e-mail ou motivo de bloqueio..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      {/* Table of Banned Users */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Participante</th>
                <th className="py-3 px-4">Documento / Telefone</th>
                <th className="py-3 px-4">Motivo da Restrição</th>
                <th className="py-3 px-4">Data do Bloqueio</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredBanned.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-bold text-white text-sm">{p.name}</p>
                    <p className="text-slate-400 text-[11px]">{p.email}</p>
                    <span className="font-mono text-[10px] text-amber-500">Bilhete: #{p.ticketNumber}</span>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-mono text-slate-300">{p.document}</p>
                    <p className="text-slate-400 text-[11px]">{p.phone}</p>
                  </td>
                  <td className="py-3 px-4 max-w-xs">
                    <p className="text-red-300 bg-red-950/40 border border-red-500/20 p-2 rounded-lg text-[11px] leading-tight">
                      {p.banReason || 'Infração das normas gerais do sorteio.'}
                    </p>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                    {p.banDate ? new Date(p.banDate).toLocaleDateString('pt-BR') : 'Data não registrada'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleUnban(p.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors"
                      title="Restaurar acesso e permitir sorteio"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Reativar</span>
                    </button>
                  </td>
                </tr>
              ))}

              {filteredBanned.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    Nenhum participante com restrição ou banimento ativo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Inserir Blacklist */}
      {showAddBlacklistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-red-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <UserX className="w-5 h-5 text-red-400" />
              <span>Inserir Usuário na Lista Negra</span>
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Adicione dados de um indivíduo para impedir que ele participe ou seja premiado nos sorteios.
            </p>

            <form onSubmit={handleAddBlacklist} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Nome Completo / Apelido *
                </label>
                <input
                  type="text"
                  required
                  value={bName}
                  onChange={(e) => setBName(e.target.value)}
                  placeholder="Ex: Nome do infrator ou suspeito"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    CPF ou Documento
                  </label>
                  <input
                    type="text"
                    value={bDoc}
                    onChange={(e) => setBDoc(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={bPhone}
                    onChange={(e) => setBPhone(e.target.value)}
                    placeholder="(11) 90000-0000"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  value={bEmail}
                  onChange={(e) => setBEmail(e.target.value)}
                  placeholder="infrator@email.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Motivo da Restrição *
                </label>
                <textarea
                  rows={3}
                  required
                  value={bReason}
                  onChange={(e) => setBReason(e.target.value)}
                  placeholder="Ex: Fraude comprovada em sorteio anterior, descumprimento de regulamento..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddBlacklistModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow"
                >
                  Bloquear Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
