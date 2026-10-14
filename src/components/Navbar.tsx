import React, { useState, useEffect } from 'react';
import { BrandConfig, DrawSchedule } from '../types';
import { Tv, ShieldCheck, Ticket, Calendar, Sparkles } from 'lucide-react';

interface NavbarProps {
  currentView: 'public' | 'live' | 'admin';
  onViewChange: (view: 'public' | 'live' | 'admin') => void;
  brand: BrandConfig;
  nextSchedule?: DrawSchedule;
  participantsCount: number;
  isAdminUnlocked: boolean;
  onToggleAdminLock: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  brand,
  nextSchedule,
  participantsCount,
  isAdminUnlocked,
  onToggleAdminLock,
}) => {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    if (!nextSchedule) {
      setTimeLeft(null);
      return;
    }

    const calculateTime = () => {
      const target = new Date(`${nextSchedule.scheduledDate}T${nextSchedule.scheduledTime}:00`);
      const now = new Date();
      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [nextSchedule]);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white shadow-xl no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div 
          onClick={() => onViewChange('public')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          {brand.logoUrl ? (
            <img
              src={brand.logoUrl}
              alt={brand.companyName}
              className="w-11 h-11 rounded-xl object-contain bg-slate-800 p-1 border border-slate-700/60 shadow-md group-hover:scale-105 transition-transform"
            />
          ) : (
            <div 
              style={{ backgroundColor: brand.primaryColor }}
              className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-slate-950 text-xl shadow-lg"
            >
              ★
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white group-hover:text-amber-400 transition-colors">
                {brand.companyName || 'SorteioLive Pro'}
              </span>
              <span className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded">
                Oficial
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block truncate max-w-[280px]">
              {brand.companySlogan || 'Sorteios e premiações em tempo real'}
            </p>
          </div>
        </div>

        {/* Live Countdown Badge */}
        {nextSchedule && timeLeft && (
          <div 
            onClick={() => onViewChange('live')}
            className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl cursor-pointer transition-colors"
            title="Clique para ir para a Sala da Live"
          >
            <div className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </div>
            <div className="text-xs">
              <span className="text-slate-400 mr-1.5 font-medium">Próximo Sorteio:</span>
              <span className="font-mono font-bold text-amber-400">
                {timeLeft.days > 0 ? `${timeLeft.days}d ` : ''}
                {String(timeLeft.hours).padStart(2, '0')}:
                {String(timeLeft.minutes).padStart(2, '0')}:
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
            </div>
          </div>
        )}

        {/* Navigation Switcher Tabs */}
        <nav className="flex items-center bg-slate-950/70 p-1.5 rounded-xl border border-slate-800 text-xs sm:text-sm font-medium">
          <button
            onClick={() => onViewChange('public')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-all ${
              currentView === 'public'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>Participar</span>
          </button>

          <button
            onClick={() => onViewChange('live')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-all ${
              currentView === 'live'
                ? 'bg-red-500 text-white font-semibold shadow-lg shadow-red-500/20 animate-pulse'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span className="flex items-center gap-1.5">
              <span>Telão Live</span>
              <span className="w-2 h-2 rounded-full bg-red-400"></span>
            </span>
          </button>

          {/* Hidden Admin Tab: only rendered when unlocked via Alt+c */}
          {isAdminUnlocked && (
            <div className="flex items-center gap-1 pl-1 ml-1 border-l border-slate-800">
              <button
                onClick={() => onViewChange('admin')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-all ${
                  currentView === 'admin'
                    ? 'bg-slate-800 text-amber-400 font-semibold border border-amber-500/40 shadow-md ring-1 ring-amber-500/30'
                    : 'text-amber-400 hover:text-amber-300 hover:bg-slate-800/50'
                }`}
                title="Painel de Administrador (Desbloqueado com Alt+C)"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Admin [Alt+C]</span>
                <span className="sm:hidden">Admin</span>
              </button>

              <button
                onClick={onToggleAdminLock}
                className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                title="Ocultar e Bloquear Painel Admin"
              >
                ✕
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
