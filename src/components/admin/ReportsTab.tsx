import React, { useState } from 'react';
import { DrawWinner, BrandConfig } from '../../types';
import { exportWinnersReportPDF, exportCertificatePDF } from '../../utils/export';
import { 
  FileCheck2, 
  Download, 
  Search, 
  Award, 
  ShieldCheck, 
  Calendar, 
  ExternalLink,
  CheckCircle2,
  Trash2
} from 'lucide-react';

interface ReportsTabProps {
  winners: DrawWinner[];
  brand: BrandConfig;
  onUpdateWinners: (winners: DrawWinner[]) => void;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({
  winners,
  brand,
  onUpdateWinners,
}) => {
  const [search, setSearch] = useState('');

  const filteredWinners = winners.filter((w) => {
    const q = search.toLowerCase();
    return (
      w.participantName.toLowerCase().includes(q) ||
      w.prizeTitle.toLowerCase().includes(q) ||
      w.participantTicket.toLowerCase().includes(q) ||
      w.validationHash.toLowerCase().includes(q)
    );
  });

  const handleDeleteWinner = (id: string) => {
    if (confirm('Deseja excluir este registro de vencedor da ata de auditoria?')) {
      onUpdateWinners(winners.filter((w) => w.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-amber-400" />
            <span>Ata de Auditoria & Relatórios de Vencedores ({winners.length})</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Emita documentos PDF oficiais com semente de autenticidade, histórico de contemplados e certificados individuais
          </p>
        </div>

        <button
          onClick={() => exportWinnersReportPDF(filteredWinners, brand)}
          disabled={winners.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md transition-colors disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>Exportar Relatório Geral em PDF</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar ganhador por nome, prêmio, bilhete premiado ou hash..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {/* Winners List / Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Bilhete</th>
                <th className="py-3 px-4">Ganhador(a)</th>
                <th className="py-3 px-4">Prêmio Conquistado</th>
                <th className="py-3 px-4">Contato / CPF</th>
                <th className="py-3 px-4">Data do Sorteio</th>
                <th className="py-3 px-4">Hash de Auditoria</th>
                <th className="py-3 px-4 text-right">Certificado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredWinners.map((w) => (
                <tr key={w.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-amber-400 text-sm bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      #{w.participantTicket}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-bold text-white text-sm">{w.participantName}</p>
                    <p className="text-slate-400 text-[11px]">{w.participantEmail}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-emerald-400">
                      {w.prizeTitle}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-mono text-slate-300">{w.participantPhone}</p>
                    <p className="text-[11px] text-slate-500">{w.participantDocument || 'CPF Verificado'}</p>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                    {new Date(w.wonAt).toLocaleDateString('pt-BR')} às {new Date(w.wonAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-[10px] text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                      {w.validationHash}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => exportCertificatePDF(w, brand)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition-transform hover:scale-105"
                        title="Baixar Certificado Individual em PDF"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>Certificado</span>
                      </button>

                      <button
                        onClick={() => handleDeleteWinner(w.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
                        title="Excluir Registro"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredWinners.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Nenhum vencedor registrado até o momento. Realize um sorteio no Telão da Live para gerar vencedores.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
