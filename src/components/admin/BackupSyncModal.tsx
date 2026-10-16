import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Upload, 
  Copy, 
  Check, 
  Database, 
  RefreshCw, 
  Cloud, 
  FileJson, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { ApiService } from '../../utils/api';

interface BackupSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  fullData: {
    brand: any;
    prizes: any[];
    participants: any[];
    schedules: any[];
    winners: any[];
    settings: any;
    formFields: any;
  };
  onRestoreFullData: (importedData: any) => void;
}

export const BackupSyncModal: React.FC<BackupSyncModalProps> = ({
  isOpen,
  onClose,
  fullData,
  onRestoreFullData,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [pasteCode, setPasteCode] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'export' | 'import' | 'code'>('export');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // 1. Export JSON file
  const handleDownloadBackup = () => {
    setErrorMessage(null);
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      const company = (fullData.brand?.companyName || 'sorteiolive').replace(/\s+/g, '_').toLowerCase();
      downloadAnchor.setAttribute('download', `backup_sorteio_${company}_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setImportStatus('Backup baixado com sucesso!');
      setTimeout(() => setImportStatus(null), 3500);
    } catch {
      setErrorMessage('Erro ao gerar arquivo de backup.');
      setTimeout(() => setErrorMessage(null), 3500);
    }
  };

  // 2. Import JSON file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus(null);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Arquivo JSON inválido.');
        }

        onRestoreFullData(parsed);
        setImportStatus('✅ Todas as configurações, logo, itens e participantes foram restaurados e sincronizados com sucesso!');
        setTimeout(() => {
          setImportStatus(null);
          onClose();
        }, 2000);
      } catch (err: any) {
        setErrorMessage('Falha ao importar o arquivo: ' + (err.message || 'Formato JSON inválido'));
      } finally {
        setIsImporting(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  // 3. Quick Copy base64 code
  const handleCopySyncCode = () => {
    try {
      const jsonStr = JSON.stringify(fullData);
      const encoded = btoa(encodeURIComponent(jsonStr));
      navigator.clipboard.writeText(encoded);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      // Fallback to raw JSON if btoa fails
      navigator.clipboard.writeText(JSON.stringify(fullData));
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  // 4. Restore from pasted sync code
  const handleRestoreFromCode = () => {
    setErrorMessage(null);
    if (!pasteCode.trim()) {
      setErrorMessage('Por favor, cole o código ou JSON de sincronização no campo.');
      return;
    }

    setIsImporting(true);
    try {
      let parsedData: any = null;
      try {
        const decoded = decodeURIComponent(atob(pasteCode.trim()));
        parsedData = JSON.parse(decoded);
      } catch {
        parsedData = JSON.parse(pasteCode.trim());
      }

      if (!parsedData || typeof parsedData !== 'object') {
        throw new Error('Código de sincronização inválido.');
      }

      onRestoreFullData(parsedData);
      setImportStatus('✅ Dados restaurados e sincronizados com sucesso em todos os navegadores!');
      setPasteCode('');
      setTimeout(() => {
        setImportStatus(null);
        onClose();
      }, 2000);
    } catch (err: any) {
      setErrorMessage('Erro ao restaurar: ' + (err.message || 'Código corrompido ou inválido'));
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <Database className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Backup & Sincronização Universal</span>
              </h3>
              <p className="text-xs text-slate-400">
                Transfira e restaure suas imagens, prêmios e participantes entre quaisquer navegadores e dispositivos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subtabs */}
        <div className="flex items-center gap-2 p-1 bg-slate-950 border border-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveSubTab('export')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeSubTab === 'export' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Backup</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('import')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeSubTab === 'import' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Importar Arquivo</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('code')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeSubTab === 'code' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Código de Sincronia</span>
          </button>
        </div>

        {/* Toast / Notification */}
        {importStatus && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{importStatus}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center gap-2">
            <X className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tab 1: Export */}
        {activeSubTab === 'export' && (
          <div className="space-y-4">
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <FileJson className="w-4 h-4 text-amber-400" />
                <span>O que está incluído no seu Backup:</span>
              </span>
              <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                <li>Logomarca da empresa e paleta de cores personalizada</li>
                <li>Todos os prêmios cadastrados e suas fotos comprimidas</li>
                <li>Lista de participantes registrados e números da sorte</li>
                <li>Regulamento, 4 horários diários e formulário</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={handleDownloadBackup}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-98 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Arquivo de Backup Completo (.JSON)</span>
            </button>
          </div>
        )}

        {/* Tab 2: Import */}
        {activeSubTab === 'import' && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-700 hover:border-amber-500/50 rounded-2xl p-6 text-center space-y-3 bg-slate-950/50 transition-colors">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center text-slate-300">
                <Upload className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Carregar Arquivo de Backup (.JSON)</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Selecione o arquivo baixado no seu computador para restaurar tudo no telemóvel ou outro browser
                </p>
              </div>

              <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer transition-colors shadow">
                {isImporting ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span>{isImporting ? 'Restaurando...' : 'Selecionar Arquivo .JSON'}</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  disabled={isImporting}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}

        {/* Tab 3: Code Sync */}
        {activeSubTab === 'code' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                Passo 1: Copiar do Computador
              </label>
              <button
                type="button"
                onClick={handleCopySyncCode}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? 'Código de Sincronia Copiado!' : 'Copiar Código de Sincronia'}</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                Passo 2: Colar no Telemóvel ou Outro Navegador
              </label>
              <textarea
                rows={3}
                value={pasteCode}
                onChange={(e) => setPasteCode(e.target.value)}
                placeholder="Cole o código copiado aqui para restaurar..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={handleRestoreFromCode}
                disabled={isImporting || !pasteCode.trim()}
                className="w-full mt-2 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-98 cursor-pointer shadow"
              >
                {isImporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Restaurar e Aplicar Imediatamente</span>
              </button>
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <span>Sincronização 100% segura e compatível com Vercel e Mobile</span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white underline cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
