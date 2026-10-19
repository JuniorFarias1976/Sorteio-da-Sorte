import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { BrandConfig, DrawSchedule, QRCodePosterConfig } from '../../types';
import { 
  QrCode, 
  Printer, 
  Download, 
  Copy, 
  Check, 
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  Trophy,
  Clock,
  Save
} from 'lucide-react';
import { StorageService, DEFAULT_POSTER_CONFIG } from '../../utils/storage';
import { ApiService } from '../../utils/api';

interface QRCodeTabProps {
  brand: BrandConfig;
  schedules: DrawSchedule[];
  posterConfig?: QRCodePosterConfig;
  onUpdateBrand: (brand: BrandConfig) => void;
  onUpdatePosterConfig?: (config: QRCodePosterConfig) => void;
}

export const QRCodeTab: React.FC<QRCodeTabProps> = ({ 
  brand, 
  schedules, 
  posterConfig: propPosterConfig,
  onUpdateBrand,
  onUpdatePosterConfig 
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [customLink, setCustomLink] = useState<string>(brand.raffleUrl || (typeof window !== 'undefined' ? window.location.origin : ''));
  const [copied, setCopied] = useState<boolean>(false);
  const [showEditor, setShowEditor] = useState<boolean>(true);
  const [networkInfo, setNetworkInfo] = useState<{
    localIp: string;
    allIps: string[];
    port: number;
    host: string;
    origin: string;
    sharedUrl: string;
    developmentUrl: string;
  } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Poster Config State
  const [posterConfig, setPosterConfig] = useState<QRCodePosterConfig>(() =>
    propPosterConfig || StorageService.getPosterConfig()
  );

  useEffect(() => {
    if (propPosterConfig) {
      setPosterConfig(propPosterConfig);
    }
  }, [propPosterConfig]);

  const nextEvent = schedules.find((s) => s.status === 'scheduled') || schedules[0];

  useEffect(() => {
    // Detect network info from server to provide friendly link options
    ApiService.getNetworkInfo().then((info) => {
      if (!info) return;
      setNetworkInfo(info);
      // If brand raffleUrl is not set or points to localhost, default to current origin
      if (!brand.raffleUrl || brand.raffleUrl.includes('localhost') || brand.raffleUrl.includes('127.0.0.1')) {
        let bestUrl = window.location.origin;
        if (info.sharedUrl && (window.location.hostname.includes('run.app') || window.location.hostname.includes('google'))) {
          bestUrl = info.sharedUrl;
        } else if (
          info.localIp && 
          !info.localIp.startsWith('169.254.') && 
          info.localIp !== 'localhost' && 
          window.location.hostname === 'localhost'
        ) {
          bestUrl = `http://${info.localIp}:${info.port}`;
        }
        setCustomLink(bestUrl);
      }
    });
  }, []);

  useEffect(() => {
    if (brand.raffleUrl && brand.raffleUrl !== customLink) {
      setCustomLink(brand.raffleUrl);
    }
  }, [brand.raffleUrl]);

  useEffect(() => {
    if (customLink) {
      generateQR(customLink);
    }
  }, [customLink]);

  const generateQR = async (text: string) => {
    try {
      const url = await QRCode.toDataURL(text, {
        width: 800,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });
      setQrCodeUrl(url);

      if (canvasRef.current) {
        QRCode.toCanvas(canvasRef.current, text, {
          width: 220,
          margin: 1,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        });
      }
    } catch (err) {
      console.error('Failed to generate QR Code:', err);
    }
  };

  const [savedLinkSuccess, setSavedLinkSuccess] = useState(false);

  const handleLinkChange = (newLink: string) => {
    setCustomLink(newLink);
  };

  const handleSaveLink = (linkToSave?: string) => {
    const targetLink = (linkToSave !== undefined ? linkToSave : customLink).trim();
    setCustomLink(targetLink);
    const updatedBrand = { ...brand, raffleUrl: targetLink };
    onUpdateBrand(updatedBrand);
    setSavedLinkSuccess(true);
    setTimeout(() => setSavedLinkSuccess(false), 2500);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(customLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPNG = () => {
    if (!qrCodeUrl) return;
    const a = document.createElement('a');
    a.href = qrCodeUrl;
    a.download = `qrcode_sorteio_${(brand.companyName || 'sorteio').replace(/\s+/g, '_')}.png`;
    a.click();
  };

  const handlePrintA4Poster = () => {
    window.print();
  };

  const handleUpdateConfig = (updates: Partial<QRCodePosterConfig>) => {
    const updated = { ...posterConfig, ...updates };
    setPosterConfig(updated);
    StorageService.savePosterConfig(updated);
    onUpdatePosterConfig?.(updated);
    ApiService.saveData({ posterConfig: updated });
  };

  const handleResetPoster = () => {
    setPosterConfig(DEFAULT_POSTER_CONFIG);
    StorageService.savePosterConfig(DEFAULT_POSTER_CONFIG);
    onUpdatePosterConfig?.(DEFAULT_POSTER_CONFIG);
    ApiService.saveData({ posterConfig: DEFAULT_POSTER_CONFIG });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner (Hidden on print) */}
      <div className="no-print flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <QrCode className="w-5 h-5 text-amber-400" />
            <span>QR Code & Cartaz para Impressão em Papel</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Insira e edite todas as informações que serão impressas no cartaz A4 e gere o código de acesso rápido
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowEditor(!showEditor)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
              showEditor
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>{showEditor ? 'Ocultar Painel de Edição' : 'Editar Informações do Cartaz'}</span>
          </button>

          <button
            onClick={handleDownloadPNG}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Baixar PNG</span>
          </button>

          <button
            onClick={handlePrintA4Poster}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Cartaz A4</span>
          </button>
        </div>
      </div>

      {/* Editor Panel (Hidden on print) */}
      {showEditor && (
        <div className="no-print bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Personalizar Informações Exibidas no Impresso
              </h3>
            </div>
            <button
              onClick={handleResetPoster}
              className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Padrão</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. URL */}
            <div className="md:col-span-2 lg:col-span-3 bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Link de Destino do QR Code (Endereço que o celular abre):
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Ao escanear pelo celular, ele abrirá este endereço. Todas as alterações e inscrições são sincronizadas automaticamente.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={customLink}
                  onChange={(e) => handleLinkChange(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:ring-2 focus:ring-amber-500 outline-none font-mono font-medium shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => handleSaveLink()}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow transition-all active:scale-98"
                  title="Salvar Link na Base de Dados"
                >
                  {savedLinkSuccess ? <Check className="w-4 h-4 text-emerald-950" /> : <Save className="w-4 h-4" />}
                  <span>{savedLinkSuccess ? 'Salvo no Banco!' : 'Gravar Link'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0 cursor-pointer border border-slate-700"
                  title="Copiar Link"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>

              {/* Quick Preset Buttons for Mobile Scanning */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="text-slate-500 text-[11px] font-medium">Atalhos rápidos para celular:</span>
                
                {networkInfo?.localIp && networkInfo.localIp !== 'localhost' && (
                  <button
                    type="button"
                    onClick={() => handleSaveLink(`http://${networkInfo.localIp}:${networkInfo.port}`)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-mono cursor-pointer transition-colors"
                  >
                    📶 Wi-Fi Local (Celular): http://{networkInfo.localIp}:{networkInfo.port}
                  </button>
                )}

                {networkInfo?.sharedUrl && (
                  <button
                    type="button"
                    onClick={() => handleSaveLink(networkInfo.sharedUrl)}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-mono cursor-pointer transition-colors"
                  >
                    🌐 URL Pública de Prévia (Internet)
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleSaveLink(typeof window !== 'undefined' ? window.location.origin : '')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-mono cursor-pointer transition-colors"
                >
                  💻 URL Atual do Navegador
                </button>
              </div>

              {customLink.includes('localhost') && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex items-center gap-2">
                  <span>💡</span>
                  <span>
                    <strong>Dica para o telemóvel:</strong> Se estiver a escanear com a câmera do celular na mesma rede Wi-Fi, clique no botão <strong>"Wi-Fi Local"</strong> ou <strong>"URL Pública"</strong> acima para o celular conseguir se conectar ao seu computador.
                  </span>
                </div>
              )}
            </div>

            {/* 2. Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Título Principal do Cartaz:
              </label>
              <input
                type="text"
                value={posterConfig.title}
                onChange={(e) => handleUpdateConfig({ title: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:ring-1 focus:ring-amber-500 outline-none"
              />
            </div>

            {/* 3. Subtitle */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Subtítulo / Chamada de Destaque:
              </label>
              <input
                type="text"
                value={posterConfig.subtitle}
                onChange={(e) => handleUpdateConfig({ subtitle: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:ring-1 focus:ring-amber-500 outline-none"
              />
            </div>

            {/* 4. Highlight Prizes */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Destaque dos Prêmios:
              </label>
              <input
                type="text"
                value={posterConfig.prizeHighlight || 'iPhone 16 Pro Max · PlayStation 5 · Smart TV · Moto 0km · Pix'}
                onChange={(e) => handleUpdateConfig({ prizeHighlight: e.target.value })}
                placeholder="Ex: iPhone, PS5, Smart TV, Pix..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:ring-1 focus:ring-amber-500 outline-none"
              />
            </div>

            {/* 5. Schedule highlight */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Texto dos 4 Horários Diários:
              </label>
              <input
                type="text"
                value={posterConfig.scheduleHighlight || '4 Sorteios no mesmo dia: 10:00 · 14:00 · 18:00 · 21:00'}
                onChange={(e) => handleUpdateConfig({ scheduleHighlight: e.target.value })}
                placeholder="Ex: 4 rodadas diárias..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:ring-1 focus:ring-amber-500 outline-none"
              />
            </div>

            {/* 6. Footer Left */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Texto do Rodapé Esquerdo:
              </label>
              <input
                type="text"
                value={posterConfig.footerLeft}
                onChange={(e) => handleUpdateConfig({ footerLeft: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:ring-1 focus:ring-amber-500 outline-none"
              />
            </div>

            {/* 7. Steps 1 */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Passo 1 (Instrução):
              </label>
              <input
                type="text"
                value={posterConfig.step1}
                onChange={(e) => handleUpdateConfig({ step1: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:ring-1 focus:ring-amber-500 outline-none"
              />
            </div>

            {/* 8. Steps 2 */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Passo 2 (Instrução):
              </label>
              <input
                type="text"
                value={posterConfig.step2}
                onChange={(e) => handleUpdateConfig({ step2: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:ring-1 focus:ring-amber-500 outline-none"
              />
            </div>

            {/* 9. Steps 3 */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Passo 3 (Instrução):
              </label>
              <input
                type="text"
                value={posterConfig.step3}
                onChange={(e) => handleUpdateConfig({ step3: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:ring-1 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-slate-800 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={posterConfig.showSteps}
                onChange={(e) => handleUpdateConfig({ showSteps: e.target.checked })}
                className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-amber-500"
              />
              <span>Exibir caixa com os 3 passos de instrução</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={posterConfig.showDate}
                onChange={(e) => handleUpdateConfig({ showDate: e.target.checked })}
                className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-amber-500"
              />
              <span>Exibir banner da data e horários oficiais</span>
            </label>
          </div>
        </div>
      )}

      {/* Printable A4 Poster (Styled for both screen preview and print output) */}
      <div className="print-card bg-white text-slate-900 rounded-3xl p-8 sm:p-12 shadow-2xl max-w-2xl mx-auto border-4 border-amber-500 text-center relative overflow-hidden">
        {/* Decorative corner borders */}
        <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-slate-900 m-3"></div>
        <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-slate-900 m-3"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-slate-900 m-3"></div>
        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-slate-900 m-3"></div>

        {/* Company Header */}
        <div className="flex flex-col items-center justify-center mb-5">
          {brand.logoUrl && (
            <img
              src={brand.logoUrl}
              alt={brand.companyName}
              className="w-16 h-16 object-contain mb-2"
            />
          )}
          <span className="text-xs font-black uppercase tracking-widest text-amber-600">
            {brand.companyName || 'SorteioLive Pro'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 mt-1 uppercase tracking-tight">
            {posterConfig.title || 'PARTICIPE DO NOSSO GRANDE SORTEIO!'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-md font-medium">
            {posterConfig.subtitle || 'Concorra a prêmios incríveis transmitidos 100% ao vivo!'}
          </p>

          {/* Schedule Banner in Print */}
          {posterConfig.showDate && (
            <div className="mt-3 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-300 text-xs font-bold text-amber-900 inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>
                {posterConfig.scheduleHighlight || '4 Sorteios no Mesmo Dia: 10:00 · 14:00 · 18:00 · 21:00'}
              </span>
            </div>
          )}
        </div>

        {/* Big QR Code */}
        <div className="inline-block p-4 bg-white border-2 border-slate-900 rounded-3xl shadow-xl my-2">
          {qrCodeUrl ? (
            <img
              src={qrCodeUrl}
              alt="QR Code de Acesso"
              className="w-56 h-56 sm:w-64 sm:h-64 object-contain mx-auto"
            />
          ) : (
            <canvas ref={canvasRef} className="rounded-lg mx-auto"></canvas>
          )}
        </div>

        {/* Prize Highlights on Poster */}
        {posterConfig.prizeHighlight && (
          <div className="max-w-md mx-auto my-3 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 flex items-center justify-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="truncate">{posterConfig.prizeHighlight}</span>
          </div>
        )}

        {/* Clear Instructions */}
        {posterConfig.showSteps && (
          <div className="max-w-md mx-auto my-4 text-left bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="text-xs font-black uppercase tracking-wider text-amber-900 mb-2 text-center">
              COMO PARTICIPAR EM 3 PASSOS SIMPLES:
            </p>
            <div className="space-y-1.5 text-xs text-slate-800">
              <p className="flex items-start gap-2">
                <strong className="text-amber-600 shrink-0">1.</strong> {posterConfig.step1}
              </p>
              <p className="flex items-start gap-2">
                <strong className="text-amber-600 shrink-0">2.</strong> {posterConfig.step2}
              </p>
              <p className="flex items-start gap-2">
                <strong className="text-amber-600 shrink-0">3.</strong> {posterConfig.step3}
              </p>
            </div>
          </div>
        )}

        {/* Poster Footer */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span>{posterConfig.footerLeft || 'Inscrição 100% Gratuita'}</span>
          <span className="font-mono font-bold text-slate-800">{customLink}</span>
          <span>{posterConfig.footerRight || 'Sorteio Seguro & Auditado'}</span>
        </div>
      </div>
    </div>
  );
};
