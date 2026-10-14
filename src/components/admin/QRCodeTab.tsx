import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { BrandConfig, DrawSchedule } from '../../types';
import { QrCode, Printer, Download, Copy, Check, ExternalLink, Sparkles } from 'lucide-react';

interface QRCodeTabProps {
  brand: BrandConfig;
  schedules: DrawSchedule[];
  onUpdateBrand: (brand: BrandConfig) => void;
}

export const QRCodeTab: React.FC<QRCodeTabProps> = ({ brand, schedules, onUpdateBrand }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [customLink, setCustomLink] = useState<string>(brand.raffleUrl || window.location.origin);
  const [copied, setCopied] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const nextEvent = schedules.find((s) => s.status === 'scheduled') || schedules[0];

  useEffect(() => {
    generateQR(customLink);
  }, [customLink]);

  const generateQR = async (text: string) => {
    try {
      const url = await QRCode.toDataURL(text, {
        width: 600,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });
      setQrCodeUrl(url);

      if (canvasRef.current) {
        QRCode.toCanvas(canvasRef.current, text, {
          width: 260,
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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(customLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPNG = () => {
    if (!qrCodeUrl) return;
    const a = document.createElement('a');
    a.href = qrCodeUrl;
    a.download = `qrcode_sorteio_${brand.companyName.replace(/\s+/g, '_')}.png`;
    a.click();
  };

  const handlePrintA4Poster = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner (Hidden on print) */}
      <div className="no-print flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <QrCode className="w-5 h-5 text-amber-400" />
            <span>Gerador de QR Code para Impressão em Papel</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Crie cartazes impressos A4 com QR Code para balcões, lojas, eventos e pontos de venda
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPNG}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Baixar PNG</span>
          </button>

          <button
            onClick={handlePrintA4Poster}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Cartaz A4</span>
          </button>
        </div>
      </div>

      {/* Configuration row (Hidden on print) */}
      <div className="no-print grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white">Configuração do Link de Acesso</h3>
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              URL de Destino do QR Code:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customLink}
                onChange={(e) => setCustomLink(e.target.value)}
                placeholder="https://meusorteio.com"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                onClick={handleCopyLink}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center gap-1.5"
                title="Copiar link"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Ao escanear com a câmera do celular, o participante será redirecionado para esta página.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-800 text-xs text-slate-400 space-y-1">
            <p className="font-semibold text-slate-300">Dicas para melhor impressão:</p>
            <ul className="list-disc list-inside space-y-0.5 text-[11px]">
              <li>Utilize papel sulfite A4 encorpado ou papel fotográfico fosco.</li>
              <li>Posicione o cartaz em local bem iluminado e na altura dos olhos dos clientes.</li>
              <li>O QR Code gerado é de altíssima densidade e pode ser lido mesmo a 2 metros de distância.</li>
            </ul>
          </div>
        </div>

        {/* Quick Preview Thumb */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-3">
            Pré-Visualização Rápida do Código
          </span>
          <div className="p-3 bg-white rounded-2xl shadow-lg border border-slate-300">
            <canvas ref={canvasRef} className="rounded-lg"></canvas>
          </div>
          <p className="text-xs text-slate-400 mt-3 font-mono">
            {customLink}
          </p>
        </div>
      </div>

      {/* Printable A4 Poster (Styled for both screen preview and print output) */}
      <div className="print-card bg-white text-slate-900 rounded-3xl p-8 sm:p-12 shadow-2xl max-w-2xl mx-auto border-4 border-amber-500 text-center relative overflow-hidden">
        {/* Decorative corner borders */}
        <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-slate-900 m-3"></div>
        <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-slate-900 m-3"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-slate-900 m-3"></div>
        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-slate-900 m-3"></div>

        {/* Company Header */}
        <div className="flex flex-col items-center justify-center mb-6">
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
            PARTICIPE DO NOSSO GRANDE SORTEIO!
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-md">
            {nextEvent ? nextEvent.title : 'Concorra a prêmios incríveis transmitidos 100% ao vivo!'}
          </p>
        </div>

        {/* Big QR Code */}
        <div className="inline-block p-4 bg-white border-2 border-slate-900 rounded-3xl shadow-xl my-2">
          {qrCodeUrl && (
            <img
              src={qrCodeUrl}
              alt="QR Code de Acesso"
              className="w-56 h-56 sm:w-64 sm:h-64 object-contain mx-auto"
            />
          )}
        </div>

        {/* Clear Instructions */}
        <div className="max-w-md mx-auto my-6 text-left bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-xs font-black uppercase tracking-wider text-amber-900 mb-2 text-center">
            COMO PARTICIPAR EM 3 PASSOS SIMPLES:
          </p>
          <div className="space-y-1.5 text-xs text-slate-800">
            <p className="flex items-start gap-2">
              <strong className="text-amber-600">1.</strong> Aponte a câmera do seu celular para o QR Code acima.
            </p>
            <p className="flex items-start gap-2">
              <strong className="text-amber-600">2.</strong> Preencha seu nome e gere seu Número da Sorte oficial.
            </p>
            <p className="flex items-start gap-2">
              <strong className="text-amber-600">3.</strong> Assista ao sorteio ao vivo e confira se foi premiado!
            </p>
          </div>
        </div>

        {/* Poster Footer */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span>Inscrição 100% Gratuita</span>
          <span className="font-mono font-bold text-slate-800">{customLink}</span>
          <span>Sorteio Seguro & Auditado</span>
        </div>
      </div>
    </div>
  );
};
