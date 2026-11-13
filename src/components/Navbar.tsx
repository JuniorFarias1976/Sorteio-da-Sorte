import React, { useState, useEffect, useRef } from 'react';
import { BrandConfig, DrawSchedule, AppUser } from '../types';
import { isLightColor } from '../utils/storage';
import { Tv, ShieldCheck, Ticket, Calendar, Sparkles, Database, RefreshCw, Lock, LogOut } from 'lucide-react';

interface NavbarProps {
  currentView: 'public' | 'live' | 'admin';
  onViewChange: (view: 'public' | 'live' | 'admin') => void;
  brand: BrandConfig;
  nextSchedule?: DrawSchedule;
  participantsCount: number;
  isAdminUnlocked: boolean;
  currentUser?: AppUser | null;
  onToggleAdminLock: () => void;
  onRequestUnlockAdmin?: () => void;
  isServerConnected?: boolean;
  isSyncing?: boolean;
  onManualSync?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  brand,
  nextSchedule,
  participantsCount,
  isAdminUnlocked,
  currentUser = null,
  onToggleAdminLock,
  onRequestUnlockAdmin,
  isServerConnected = true,
  isSyncing = false,
  onManualSync,
}) => {
  const isStandardUser = currentUser?.role === 'standard';
  const [logoTapCount, setLogoTapCount] = useState<number>(0);
  const logoTimerRef = useRef<any>(null);

  const handleLogoClick = () => {
    const nextCount = logoTapCount + 1;
    if (logoTimerRef.current) {
      clearTimeout(logoTimerRef.current);
    }

    if (nextCount >= 3) {
      setLogoTapCount(0);
      onRequestUnlockAdmin?.();
    } else {
      setLogoTapCount(nextCount);
      logoTimerRef.current = setTimeout(() => {
        setLogoTapCount(0);
      }, 1600);
    }
  };

  const handleParticipateClick = () => {
    onViewChange('public');
    setTimeout(() => {
      const el = document.getElementById('formulario-inscricao');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const input = el.querySelector('input') as HTMLInputElement | null;
        if (input) {
          setTimeout(() => input.focus(), 300);
        }
      }
    }, 60);
  };

  const isLight = isLightColor(brand.backgroundColor || '#FFFFFF');

  return (
    <header className={`sticky top-0 z-40 backdrop-blur-md transition-colors duration-200 no-print safe-area-pt ${
      isLight 
        ? 'bg-white/95 border-b border-slate-200 text-slate-900 shadow-sm'
        : 'bg-slate-900/90 border-b border-slate-800 text-white shadow-xl'
    }`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-3">
        {/* Brand / Logo (Triple-click/tap discreetly unlocks Admin) */}
        <div 
          onClick={handleLogoClick}
          className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group select-none min-w-0"
          title={brand.companyName || 'SorteioLive Pro'}
        >
          {brand.logoUrl ? (
            <img
              src={brand.logoUrl}
              alt={brand.companyName}
              className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl object-contain p-1 border shadow-md group-hover:scale-105 transition-transform shrink-0 ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-800 border-slate-700/60'
              }`}
            />
          ) : (
            <div 
              style={{ backgroundColor: brand.primaryColor }}
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-bold text-white text-lg sm:text-xl shadow-lg shrink-0"
            >
              ★
            </div>
          )}
          {brand.showNavbarBrandText && (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className={`font-bold text-base sm:text-lg tracking-tight transition-colors truncate ${
                  isLight ? 'text-slate-900 group-hover:text-[#E30613]' : 'text-white group-hover:text-red-400'
                }`}>
                  {brand.companyName || 'Lacer - Sorteio OMD 2026'}
                </span>
                <span className="inline-flex items-center px-1.5 py-0.2 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-[#E30613] bg-red-50 border border-red-200 rounded shrink-0">
                  Oficial
                </span>
              </div>
              <p className={`text-[11px] sm:text-xs hidden sm:block truncate max-w-[280px] ${
                isLight ? 'text-slate-500' : 'text-slate-400'
              }`}>
                {brand.companySlogan || 'Higiene e Saúde Oral • Stand Lacer'}
              </p>
            </div>
          )}
        </div>

        {/* Center: Live Sync (Admin only, hidden for standard users) */}
        <div className="flex items-center gap-2">
          {isAdminUnlocked && !isStandardUser && onManualSync && (
            <button
              onClick={onManualSync}
              disabled={isSyncing}
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] transition-all cursor-pointer shadow-sm disabled:opacity-50 ${
                isLight 
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                  : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/60 text-slate-300 hover:text-white'
              }`}
              title="Clique para sincronizar os dados em tempo real com a base de dados central"
            >
              <RefreshCw className={`w-3 h-3 text-emerald-500 ${isSyncing ? 'animate-spin text-[#E30613]' : ''}`} />
              <span className="hidden lg:inline">{isSyncing ? 'A sincronizar...' : 'Base Sincronizada'}</span>
              <span className="lg:hidden">{isSyncing ? 'Sync...' : 'BD'}</span>
            </button>
          )}
        </div>

        {/* Mobile Actions (sm:hidden) */}
        <div className="flex sm:hidden items-center gap-1.5">
          {isAdminUnlocked ? (
            <div className={`flex items-center gap-1 p-1 rounded-xl border ${
              isLight ? 'bg-red-50 border-red-200' : 'bg-slate-800 border-slate-700'
            }`}>
              <button
                onClick={() => onViewChange('admin')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  currentView === 'admin'
                    ? 'bg-[#E30613] text-white shadow-sm'
                    : isLight ? 'text-[#E30613]' : 'text-red-400'
                }`}
              >
                {isStandardUser ? 'Painel' : 'Admin'}
              </button>
              <button
                onClick={onToggleAdminLock}
                className="px-1.5 py-1 rounded-lg text-slate-600 hover:text-red-600 transition-colors flex items-center gap-1 text-[11px] font-bold"
                title="Terminar Sessão"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onRequestUnlockAdmin}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-colors ${
                isLight
                  ? 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700'
              }`}
              title="Entrar com Palavra-passe de Administrador"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}
        </div>

        {/* Navigation Switcher Tabs (Desktop) */}
        <nav className={`hidden sm:flex items-center p-1.5 rounded-xl border text-xs sm:text-sm font-medium ${
          isLight ? 'bg-slate-100/90 border-slate-200' : 'bg-slate-950/70 border-slate-800'
        }`}>
          {brand.showNavbarParticipateButton && (
            <button
              onClick={handleParticipateClick}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg transition-all cursor-pointer ${
                currentView === 'public'
                  ? 'bg-[#E30613] text-white font-semibold shadow-md shadow-red-500/25'
                  : isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-white' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
              title="Ir para o formulário de participação"
            >
              <Ticket className="w-4 h-4" />
              <span>Participar</span>
            </button>
          )}

          {/* Admin Tab: Rendered when unlocked */}
          {isAdminUnlocked ? (
            <div className={`flex items-center gap-1 pl-1 ml-1 border-l ${isLight ? 'border-slate-300' : 'border-slate-800'}`}>
              <button
                onClick={() => onViewChange('admin')}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg transition-all cursor-pointer ${
                  currentView === 'admin'
                    ? 'bg-[#E30613] text-white font-semibold shadow-md'
                    : isLight ? 'text-[#E30613] hover:bg-red-50' : 'text-red-400 hover:text-red-300 hover:bg-slate-800/50'
                }`}
                title="Painel de Operação e Sorteio"
              >
                <ShieldCheck className="w-4 h-4" />
                {isStandardUser ? (
                  <span>Painel</span>
                ) : (
                  <>
                    <span className="hidden sm:inline">Admin [Alt+C]</span>
                    <span className="sm:hidden">Admin</span>
                  </>
                )}
              </button>

              <button
                onClick={onToggleAdminLock}
                className={`px-2 py-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer ${
                  isLight ? 'text-slate-600 hover:text-red-700 hover:bg-slate-200' : 'text-slate-400 hover:text-red-400 hover:bg-slate-800'
                }`}
                title="Terminar Sessão"
              >
                <LogOut className="w-3.5 h-3.5" />
                {isStandardUser && <span>Sair</span>}
              </button>
            </div>
          ) : (
            <button
              onClick={onRequestUnlockAdmin}
              className={`p-2 rounded-lg transition-colors text-slate-400 hover:text-[#E30613] ${
                isLight ? 'hover:bg-white' : 'hover:bg-slate-800/50'
              }`}
              title="Aceder como Administrador (Palavra-passe)"
            >
              <Lock className="w-4 h-4" />
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};
