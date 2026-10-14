/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Participant, 
  Prize, 
  DrawSchedule, 
  DrawWinner, 
  NotificationLog, 
  NotificationSettings, 
  BrandConfig 
} from './types';
import { StorageService } from './utils/storage';
import { Navbar } from './components/Navbar';
import { PublicRaffleView } from './components/PublicRaffleView';
import { LiveDrawRoom } from './components/LiveDrawRoom';
import { AdminDashboard } from './components/admin/AdminDashboard';

export default function App() {
  // Navigation View State
  const [currentView, setCurrentView] = useState<'public' | 'live' | 'admin'>('public');

  // Hidden Admin Panel State (Unlocked via Alt + C)
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(false);
  const [adminToast, setAdminToast] = useState<string | null>(null);

  // Application Data States
  const [participants, setParticipants] = useState<Participant[]>(() => StorageService.getParticipants());
  const [prizes, setPrizes] = useState<Prize[]>(() => StorageService.getPrizes());
  const [schedules, setSchedules] = useState<DrawSchedule[]>(() => StorageService.getSchedules());
  const [winners, setWinners] = useState<DrawWinner[]>(() => StorageService.getWinners());
  const [notifications, setNotifications] = useState<NotificationLog[]>(() => StorageService.getNotifications());
  const [settings, setSettings] = useState<NotificationSettings>(() => StorageService.getSettings());
  const [brand, setBrand] = useState<BrandConfig>(() => StorageService.getBrand());

  // Next Upcoming Draw
  const nextSchedule = schedules.find((s) => s.status === 'scheduled') || schedules[0];

  // Shortcut Listener for Alt + C
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        setIsAdminUnlocked((prev) => {
          const next = !prev;
          if (next) {
            setCurrentView('admin');
            setAdminToast('🔑 Painel de Administrador Desbloqueado via [Alt + C]!');
          } else {
            setCurrentView((curr) => (curr === 'admin' ? 'public' : curr));
            setAdminToast('🔒 Painel de Administrador Ocultado e Bloqueado.');
          }
          setTimeout(() => setAdminToast(null), 3500);
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Persist state updates to local storage
  const handleUpdateParticipants = (data: Participant[]) => {
    setParticipants(data);
    StorageService.saveParticipants(data);
  };

  const handleUpdatePrizes = (data: Prize[]) => {
    setPrizes(data);
    StorageService.savePrizes(data);
  };

  const handleUpdateSchedules = (data: DrawSchedule[]) => {
    setSchedules(data);
    StorageService.saveSchedules(data);
  };

  const handleUpdateWinners = (data: DrawWinner[]) => {
    setWinners(data);
    StorageService.saveWinners(data);
  };

  const handleAddNotificationLog = (log: NotificationLog) => {
    const updated = [log, ...notifications];
    setNotifications(updated);
    StorageService.saveNotifications(updated);
  };

  const handleUpdateSettings = (newSettings: NotificationSettings) => {
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
  };

  const handleUpdateBrand = (newBrand: BrandConfig) => {
    setBrand(newBrand);
    StorageService.saveBrand(newBrand);
  };

  // Participant Registration handler (from Public page)
  const handleRegisterParticipant = (participant: Participant) => {
    const updated = [participant, ...participants];
    handleUpdateParticipants(updated);
  };

  // Live Draw Winner Announced handler
  const handleWinnerAnnounced = (winner: DrawWinner) => {
    // 1. Add to winners list
    const updatedWinners = [winner, ...winners];
    handleUpdateWinners(updatedWinners);

    // 2. Mark participant status as 'winner'
    const updatedParticipants = participants.map((p) =>
      p.id === winner.participantId ? { ...p, status: 'winner' as const } : p
    );
    handleUpdateParticipants(updatedParticipants);
  };

  // Increment prize drawn count
  const handlePrizeQuantityDrawn = (prizeId: string) => {
    const updatedPrizes = prizes.map((p) =>
      p.id === prizeId ? { ...p, drawnQuantity: p.drawnQuantity + 1 } : p
    );
    handleUpdatePrizes(updatedPrizes);
  };

  // Reset to default seeds
  const handleResetAllData = () => {
    if (confirm('Deseja restaurar todos os dados padrões de fábrica do sistema de sorteios?')) {
      StorageService.resetToDefault();
      setParticipants(StorageService.getParticipants());
      setPrizes(StorageService.getPrizes());
      setSchedules(StorageService.getSchedules());
      setWinners(StorageService.getWinners());
      setNotifications(StorageService.getNotifications());
      setSettings(StorageService.getSettings());
      setBrand(StorageService.getBrand());
    }
  };

  // Inject primary and accent brand colors into document root styles
  useEffect(() => {
    document.documentElement.style.setProperty('--brand-primary', brand.primaryColor);
    document.documentElement.style.setProperty('--brand-secondary', brand.secondaryColor);
    document.documentElement.style.setProperty('--brand-accent', brand.accentColor);
  }, [brand]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Main Navigation */}
      <Navbar
        currentView={currentView}
        onViewChange={setCurrentView}
        brand={brand}
        nextSchedule={nextSchedule}
        participantsCount={participants.length}
        isAdminUnlocked={isAdminUnlocked}
        onToggleAdminLock={() => {
          setIsAdminUnlocked(!isAdminUnlocked);
          if (isAdminUnlocked && currentView === 'admin') {
            setCurrentView('public');
          }
        }}
      />

      {/* Secret Toast Indicator for Alt+C */}
      {adminToast && (
        <div className="fixed top-24 right-4 z-50 bg-slate-900 border-2 border-amber-500 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></div>
          <p className="text-xs font-bold text-amber-300">{adminToast}</p>
        </div>
      )}

      {/* Main Active View */}
      <main className="flex-1">
        {currentView === 'public' && (
          <PublicRaffleView
            brand={brand}
            prizes={prizes}
            nextSchedule={nextSchedule}
            schedules={schedules}
            participants={participants}
            onRegisterParticipant={handleRegisterParticipant}
            onGoToLive={() => setCurrentView('live')}
          />
        )}

        {currentView === 'live' && (
          <LiveDrawRoom
            participants={participants}
            prizes={prizes}
            schedules={schedules}
            winners={winners}
            brand={brand}
            isAdmin={isAdminUnlocked}
            onWinnerAnnounced={handleWinnerAnnounced}
            onPrizeQuantityDrawn={handlePrizeQuantityDrawn}
          />
        )}

        {currentView === 'admin' && (
          <AdminDashboard
            participants={participants}
            prizes={prizes}
            schedules={schedules}
            winners={winners}
            notificationLogs={notifications}
            notificationSettings={settings}
            brand={brand}
            onUpdateParticipants={handleUpdateParticipants}
            onUpdatePrizes={handleUpdatePrizes}
            onUpdateSchedules={handleUpdateSchedules}
            onUpdateWinners={handleUpdateWinners}
            onAddNotificationLog={handleAddNotificationLog}
            onUpdateNotificationSettings={handleUpdateSettings}
            onUpdateBrand={handleUpdateBrand}
            onGoToLive={() => setCurrentView('live')}
            onResetAllData={handleResetAllData}
          />
        )}
      </main>

      {/* Footer (Hidden on print) */}
      <footer className="no-print bg-slate-950 border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">{brand.companyName || 'SorteioLive Pro'}</span>
            <span>· 4 Sorteios Diários Oficiais Auditados</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <button 
              onClick={() => setCurrentView('public')} 
              className="hover:text-white transition-colors"
            >
              Inscrição & Bilhetes
            </button>
            <button 
              onClick={() => setCurrentView('live')} 
              className="hover:text-white transition-colors"
            >
              Telão Ao Vivo
            </button>

            {/* Secret mobile fallback unlock trigger */}
            <button
              onClick={() => {
                const pass = prompt('Acesso Restrito: Pressione Alt+C no teclado ou digite a chave de acesso:');
                if (pass === 'admin' || pass === 'admin123' || pass === 'c') {
                  setIsAdminUnlocked(true);
                  setCurrentView('admin');
                }
              }}
              className="text-slate-600 hover:text-slate-400 text-[10px] tracking-wider transition-colors"
              title="Acesso de Moderação (Alt+C)"
            >
              [Alt+C]
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
