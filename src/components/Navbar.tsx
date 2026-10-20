import React, { useState, useEffect } from 'react';
import { BrandConfig, DrawSchedule } from '../types';
import { isLightColor } from '../utils/storage';
import { Tv, ShieldCheck, Ticket, Calendar, Sparkles, Database, RefreshCw } from 'lucide-react';

interface NavbarProps {
  currentView: 'public' | 'live' | 'admin';
  onViewChange: (view: 'public' | 'live' | 'admin') => void;
  brand: BrandConfig;
  nextSchedule?: DrawSchedule;
  participantsCount: number;
  isAdminUnlocked: boolean;
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
  onToggleAdminLock,
  onRequestUnlockAdmin,
  isServerConnected = true,
  isSyncing = false,
  onManualSync,
}) => {
  const [logoTapCount, setLogoTapCount] = useState<number>(0);

  const handleLogoClick = () => {
    onViewChange('public');
    const nextCount = logoTapCount + 1;
    setLogoTapCount(nextCount);
    if (nextCount >= 3) {
      setLogoTapCount(0);
      onRequestUnlockAdmin?.();
    }
    setTimeout(() => setLogoTapCount(0), 1200);
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
        </div>

        {/* Center: Live Sync (Admin only) */}
        <div className="flex items-center gap-2">
          {isAdminUnlocked && onManualSync && (
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

        {/* Navigation Switcher Tabs (Desktop) */}
        <nav className={`hidden sm:flex items-center p-1.5 rounded-xl border text-xs sm:text-sm font-medium ${
          isLight ? 'bg-slate-100/90 border-slate-200' : 'bg-slate-950/70 border-slate-800'
        }`}>
          <button
            onClick={() => onViewChange('public')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg transition-all ${
              currentView === 'public'
                ? 'bg-[#E30613] text-white font-semibold shadow-md shadow-red-500/25'
                : isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-white' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>Participar</span>
          </button>

          {/* Admin Tab: Rendered when unlocked */}
          {isAdminUnlocked ? (
            <div className={`flex items-center gap-1 pl-1 ml-1 border-l ${isLight ? 'border-slate-300' : 'border-slate-800'}`}>
              <button
                onClick={() => onViewChange('admin')}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg transition-all ${
                  currentView === 'admin'
                    ? 'bg-[#E30613] text-white font-semibold shadow-md'
                    : isLight ? 'text-[#E30613] hover:bg-red-50' : 'text-red-400 hover:text-red-300 hover:bg-slate-800/50'
                }`}
                title="Painel de Administração"
              >
                <ShieldCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Admin [Alt+C]</span>
                <span className="sm:hidden">Admin</span>
              </button>

              <button
                onClick={onToggleAdminLock}
                className={`p-1.5 rounded-lg transition-colors ${
                  isLight ? 'text-slate-400 hover:text-red-600 hover:bg-slate-200' : 'text-slate-500 hover:text-red-400 hover:bg-slate-800'
                }`}
                title="Ocultar e Bloquear Painel de Administrador"
              >
                ✕
              </button>
            </div>
          ) : null}
        </nav>
      </div>
    </header>
  );
};
