import React, { useState, useEffect } from 'react';
import { DrawWinner, BrandConfig, ReportPdfConfig } from '../../types';
import { exportWinnersReportPDF, exportCertificatePDF } from '../../utils/export';
import { 
  FileCheck2, 
  Download, 
  Search, 
  Award, 
  Trash2,
  SlidersHorizontal,
  Check,
  RotateCcw
} from 'lucide-react';
import { StorageService, DEFAULT_REPORT_CONFIG } from '../../utils/storage';
import { ApiService } from '../../utils/api';

interface ReportsTabProps {
  winners: DrawWinner[];
  brand: BrandConfig;
  reportConfig?: ReportPdfConfig;
  onUpdateWinners: (winners: DrawWinner[]) => void;
  onUpdateReportConfig?: (config: ReportPdfConfig) => void;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({
  winners,
  brand,
  reportConfig: propReportConfig,
  onUpdateWinners,
  onUpdateReportConfig,
}) => {
  const [search, setSearch] = useState('');
  const [reportConfig, setReportConfig] = useState<ReportPdfConfig>(() =>
    propReportConfig || StorageService.getReportConfig()
  );
  const [showConfigModal, setShowConfigModal] = useState(false);

  useEffect(() => {
    if (propReportConfig) {
      setReportConfig(propReportConfig);
    }
  }, [propReportConfig]);

  const filteredWinners = winners.filter((w) => {
    const q = search.toLowerCase();
    return (
      w.participantName.toLowerCase().includes(q) ||
      w.prizeTitle.toLowerCase().includes(q) ||
      w.participantTicket.toLowerCase().includes(q) ||
      w.validationHash.toLowerCase().includes(q)
    );
  });

  const [deletingWinner, setDeletingWinner] = useState<DrawWinner | null>(null);

  const handleConfirmDeleteWinner = () => {
    if (!deletingWinner) return;
    const targetId = deletingWinner.id;
    onUpdateWinners(winners.filter((w) => w.id !== targetId));
    setDeletingWinner(null);
  };

  const handleSaveConfig = (newCfg: ReportPdfConfig) => {
    setReportConfig(newCfg);
    StorageService.saveReportConfig(newCfg);
    onUpdateReportConfig?.(newCfg);
    ApiService.saveData({ reportConfig: newCfg });
    setShowConfigModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-amber-400" />
            <span>Relatórios & Auditoria PDF ({winners.length})</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure quais informações serão recolhidas no documento e emita atas oficiais de validação
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowConfigModal(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 text-amber-400" />
            <span>Editar Informações do PDF</span>
          </button>

          <button
            onClick={() => exportWinnersReportPDF(filteredWinners, brand, reportConfig)}
            disabled={winners.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Baixar Relatório em PDF</span>
          </button>
        </div>
      </div>

      {/* Quick Summary of Active Columns for PDF */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-400 font-semibold">Campos incluídos no PDF:</span>
          {reportConfig.includePrize && <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-mono">✓ Prémio</span>}
          {reportConfig.includeTicket && <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-mono">✓ Bilhete</span>}
          {reportConfig.includeWinnerName && <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-mono">✓ Nome</span>}
          {reportConfig.includeDocument && <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-mono">✓ NIF/Doc</span>}
          {reportConfig.includePhone && <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-mono">✓ Telemóvel</span>}
          {reportConfig.includeEmail && <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-mono">✓ E-mail</span>}
          {reportConfig.includeDate && <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-mono">✓ Data/Hora</span>}
          {reportConfig.includeHash && <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-mono">✓ Hash</span>}
        </div>
        <button
          onClick={() => setShowConfigModal(true)}
          className="text-amber-400 hover:text-amber-300 font-medium text-[11px] underline"
        >
          Personalizar campos
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar vencedor por nome, prémio, bilhete premiado ou hash..."
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
                <th className="py-3 px-4">Vencedor(a)</th>
                <th className="py-3 px-4">Prémio Conquistado</th>
                <th className="py-3 px-4">Contacto / NIF</th>
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
                        onClick={() => setDeletingWinner(w)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Excluir Registro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredWinners.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Nenhum vencedor homologado encontrado. Realize um sorteio no Telão da Live!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Editar Informações Recolhidas no Relatório PDF */}
      {showConfigModal && (
        <EditReportPdfModal
          config={reportConfig}
          onSave={handleSaveConfig}
          onClose={() => setShowConfigModal(false)}
        />
      )}

      {/* Modal: Confirm Deletion */}
      {deletingWinner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-400" />
              <span>Remover Registro de Vencedor</span>
            </h3>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              Tem certeza que deseja excluir o vencedor <strong>{deletingWinner.participantName}</strong> ({deletingWinner.prizeTitle}) da ata e do histórico de sorteios?
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingWinner(null)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteWinner}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Modal Component to Customize PDF Report Content
interface EditReportPdfModalProps {
  config: ReportPdfConfig;
  onSave: (config: ReportPdfConfig) => void;
  onClose: () => void;
}

const EditReportPdfModal: React.FC<EditReportPdfModalProps> = ({
  config,
  onSave,
  onClose,
}) => {
  const [form, setForm] = useState<ReportPdfConfig>({ ...config });

  const handleReset = () => {
    setForm(DEFAULT_REPORT_CONFIG);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl my-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">
              Editar Informações do Relatório & Auditoria PDF
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs"
          >
            ✕ Fechar
          </button>
        </div>

        <p className="text-xs text-slate-300 mb-5">
          Selecione com precisão quais dados dos vencedores serão recolhidos na tabela do PDF e personalize títulos, textos de ata e assinaturas.
        </p>

        <div className="space-y-5">
          {/* Section: Columns to Include */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
              1. Colunas e Informações a Recolher no Documento:
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'includePrize', label: 'Prémio Sorteado' },
                { id: 'includeTicket', label: 'Número do Bilhete' },
                { id: 'includeWinnerName', label: 'Nome do Vencedor' },
                { id: 'includeDocument', label: 'NIF / Documento' },
                { id: 'includePhone', label: 'Telemóvel / Telefone' },
                { id: 'includeEmail', label: 'E-mail' },
                { id: 'includeDate', label: 'Data e Hora da Ronda' },
                { id: 'includeHash', label: 'Hash de Auditoria' },
              ].map((col) => {
                const key = col.id as keyof ReportPdfConfig;
                const isChecked = !!form[key];
                return (
                  <label
                    key={col.id}
                    className={`p-3 rounded-xl border text-xs flex items-center gap-2 cursor-pointer transition-colors ${
                      isChecked
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 font-semibold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) =>
                        setForm({ ...form, [key]: e.target.checked })
                      }
                      className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500"
                    />
                    <span>{col.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Section: Document Headers */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
              2. Título e Identificação do Documento:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-1">
                  Título Principal do Relatório:
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:ring-1 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-1">
                  Subtítulo / Seção da Tabela:
                </label>
                <input
                  type="text"
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:ring-1 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-1">
                  Prefixo de Protocolo Oficial:
                </label>
                <input
                  type="text"
                  value={form.protocolPrefix}
                  onChange={(e) =>
                    setForm({ ...form, protocolPrefix: e.target.value })
                  }
                  placeholder=""
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:ring-1 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section: Legal Statement & Signatures */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
              3. Termo de Homologação e Assinaturas Oficiais:
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-1">
                  Declaração de Auditoria e Legalidade:
                </label>
                <textarea
                  rows={2}
                  value={form.statementText}
                  onChange={(e) =>
                    setForm({ ...form, statementText: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:ring-1 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase mb-1">
                    Cargo / Título da 1ª Assinatura:
                  </label>
                  <input
                    type="text"
                    value={form.organizerSignTitle}
                    onChange={(e) =>
                      setForm({ ...form, organizerSignTitle: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:ring-1 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase mb-1">
                    Cargo / Título da 2ª Assinatura:
                  </label>
                  <input
                    type="text"
                    value={form.auditorSignTitle}
                    onChange={(e) =>
                      setForm({ ...form, auditorSignTitle: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:ring-1 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-slate-800 mt-6">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrão</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => onSave(form)}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
