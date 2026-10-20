import React, { useState, useEffect } from 'react';
import { Ticket, Tv, ShieldCheck, Lock, Smartphone, Share2, Check } from 'lucide-react';
import { BrandConfig, DrawSchedule } from '../types';
import { isLightColor } from '../utils/storage';

interface MobileBottomNavProps {
  currentView: 'public' | 'live' | 'admin';
  onViewChange: (view: 'public' | 'live' | 'admin') => void;
  brand: BrandConfig;
  isAdminUnlocked: boolean;
  onRequestUnlockAdmin: () => void;
  nextSchedule?: DrawSchedule;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onViewChange,
  brand,
  isAdminUnlocked,
  onRequestUnlockAdmin,
  nextSchedule,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    if (typeof window !== 'undefined') {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
      setIsInstalled(!!isStandalone);

      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };

      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowShareModal(true);
    }
  };

  const handleCopyLink = () => {
    const url = (typeof window !== 'undefined' ? window.location.origin : brand.raffleUrl) || '';
    if (navigator.clipboard && url) {
      navigator.clipboard.writeText(url).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      });
    }
  };

  const isLight = isLightColor(brand.backgroundColor || '#FFFFFF');

  return (
    <>
      <nav className={`sm:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl border-t px-2 py-2 flex items-center justify-around shadow-2xl safe-area-pb transition-colors duration-200 ${
        isLight 
          ? 'bg-white/95 border-slate-200 text-slate-600'
          : 'bg-slate-900/95 border-slate-800/80 text-slate-400'
      }`}>
        {/* 1. Participar */}
        <button
          onClick={() => onViewChange('public')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer ${
            currentView === 'public'
              ? 'text-[#E30613] font-bold'
              : isLight ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className={`p-1 rounded-lg ${currentView === 'public' ? (isLight ? 'bg-red-50 text-[#E30613]' : 'bg-red-500/20 text-red-400 ring-1 ring-red-500/30') : ''}`}>
            <Ticket className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Participar</span>
        </button>

        {/* 2. Em Direto */}
        <button
          onClick={() => onViewChange('live')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer relative ${
            currentView === 'live'
              ? 'text-[#E30613] font-bold'
              : isLight ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className={`p-1 rounded-lg relative ${currentView === 'live' ? (isLight ? 'bg-red-50 text-[#E30613]' : 'bg-red-500/20 ring-1 ring-red-500/30') : ''}`}>
            <Tv className="w-5 h-5" />
            <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-[#E30613] animate-pulse"></span>
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Em Direto</span>
        </button>

        {/* 3. Instalar no Telemóvel / Partilhar */}
        <button
          onClick={handleInstallClick}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer ${
            isLight ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Instalar no telemóvel ou partilhar"
        >
          <div className={`p-1 rounded-lg ${isLight ? 'hover:bg-slate-100' : 'hover:bg-slate-800'}`}>
            {deferredPrompt && !isInstalled ? (
              <div className="relative">
                <Smartphone className="w-5 h-5 text-emerald-500" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
              </div>
            ) : (
              <Share2 className="w-5 h-5" />
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">
            {deferredPrompt && !isInstalled ? 'Instalar App' : 'Partilhar'}
          </span>
        </button>

        {/* 4. Painel Admin (visível com cadeado, exige palavra-passe se bloqueado) */}
        {isAdminUnlocked ? (
          <button
            onClick={() => onViewChange('admin')}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer ${
              currentView === 'admin'
                ? 'text-[#E30613] font-bold'
                : isLight ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-lg ${currentView === 'admin' ? (isLight ? 'bg-red-50 text-[#E30613]' : 'bg-red-500/20 ring-1 ring-red-500/30') : ''}`}>
              <ShieldCheck className="w-5 h-5 text-[#E30613]" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-bold">Admin</span>
          </button>
        ) : (
          <button
            onClick={onRequestUnlockAdmin}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer ${
              isLight ? 'text-slate-400 hover:text-slate-700' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Acesso de Administrador (requer palavra-passe)"
          >
            <div className={`p-1 rounded-lg ${isLight ? 'hover:bg-slate-100' : 'hover:bg-slate-800'}`}>
              <Lock className="w-5 h-5 text-slate-400" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Admin</span>
          </button>
        )}
      </nav>

      {/* Share / Install Modal for Mobile */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in slide-in-from-bottom duration-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Aplicação Móvel & Partilha</h3>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-xs text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Aceda ou instale o <strong className="text-white">{brand.companyName || 'SorteioLive'}</strong> diretamente no ecrã principal do seu smartphone (Android ou iPhone) para ter acesso instantâneo aos bilhetes e transmissões em direto.
            </p>

            {/* iOS Safari Tip */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <span className="font-bold text-amber-400 block">📱 No iPhone (Safari):</span>
              <span>Toque no botão <strong>Partilhar</strong> (ícone com seta para cima) e selecione <strong>"Adicionar ao Ecrã Principal"</strong>.</span>
            </div>

            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors border border-amber-500/20"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Ticket className="w-4 h-4" />}
              <span>{copiedLink ? 'Link Copiado com Sucesso!' : 'Copiar Link para o Telemóvel'}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
