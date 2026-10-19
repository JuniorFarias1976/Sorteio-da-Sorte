/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Participant, 
  Prize, 
  DrawSchedule, 
  DrawWinner, 
  NotificationLog, 
  NotificationSettings, 
  BrandConfig,
  FormFieldsConfig,
  QRCodePosterConfig,
  ReportPdfConfig
} from './types';
import { StorageService, DEFAULT_POSTER_CONFIG, DEFAULT_REPORT_CONFIG } from './utils/storage';
import { ApiService, AppServerData } from './utils/api';
import { FirestoreService } from './utils/firestoreService';
import { Navbar } from './components/Navbar';
import { PublicRaffleView } from './components/PublicRaffleView';
import { LiveDrawRoom } from './components/LiveDrawRoom';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Lock, Key, ShieldCheck, CheckCircle2, AlertCircle, X, RefreshCw } from 'lucide-react';

export default function App() {
  // Navigation View State
  const [currentView, setCurrentView] = useState<'public' | 'live' | 'admin'>('public');

  // Persistent Admin Panel State (Unlocked via Alt + C, ?admin=true, or In-App Modal)
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('admin') === 'true' || window.location.hash === '#admin') {
        return true;
      }
      return localStorage.getItem('sorteiolive_admin_unlocked') === 'true';
    }
    return false;
  });

  const [adminToast, setAdminToast] = useState<string | null>(null);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // In-App Admin Unlock Modal (replacing window.prompt to avoid iframe blocks)
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [adminKeyInput, setAdminKeyInput] = useState<string>('');
  const [adminKeyError, setAdminKeyError] = useState<string | null>(null);

  // Real-Time Server Synchronization State
  const [isServerConnected, setIsServerConnected] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Application Data States
  const [participants, setParticipants] = useState<Participant[]>(() => StorageService.getParticipants());
  const [prizes, setPrizes] = useState<Prize[]>(() => StorageService.getPrizes());
  const [schedules, setSchedules] = useState<DrawSchedule[]>(() => StorageService.getSchedules());
  const [winners, setWinners] = useState<DrawWinner[]>(() => StorageService.getWinners());
  const [notifications, setNotifications] = useState<NotificationLog[]>(() => StorageService.getNotifications());
  const [settings, setSettings] = useState<NotificationSettings>(() => StorageService.getSettings());
  const [brand, setBrand] = useState<BrandConfig>(() => StorageService.getBrand());
  const [formFields, setFormFields] = useState<FormFieldsConfig>(() => StorageService.getFormFields());
  const [posterConfig, setPosterConfig] = useState<QRCodePosterConfig>(() => StorageService.getPosterConfig());
  const [reportConfig, setReportConfig] = useState<ReportPdfConfig>(() => StorageService.getReportConfig());

  // Next Upcoming Draw
  const nextSchedule = schedules.find((s) => s.status === 'scheduled') || schedules[0];

  // Helper to safely apply full server data across all states and LocalStorage
  const applyServerData = useCallback((serverData: Partial<AppServerData>) => {
    if (!serverData) return;

    if (Array.isArray(serverData.participants)) {
      setParticipants(serverData.participants);
      try { StorageService.saveParticipants(serverData.participants); } catch {}
    }
    if (Array.isArray(serverData.prizes)) {
      setPrizes(serverData.prizes);
      try { StorageService.savePrizes(serverData.prizes); } catch {}
    }
    if (Array.isArray(serverData.schedules)) {
      setSchedules(serverData.schedules);
      try { StorageService.saveSchedules(serverData.schedules); } catch {}
    }
    if (Array.isArray(serverData.winners)) {
      setWinners(serverData.winners);
      try { StorageService.saveWinners(serverData.winners); } catch {}
    }
    if (Array.isArray(serverData.notifications)) {
      setNotifications(serverData.notifications);
      try { StorageService.saveNotifications(serverData.notifications); } catch {}
    }
    if (serverData.settings) {
      setSettings(serverData.settings);
      try { StorageService.saveSettings(serverData.settings); } catch {}
    }
    if (serverData.brand) {
      setBrand(serverData.brand);
      try { StorageService.saveBrand(serverData.brand); } catch {}
      if (serverData.brand.companyName) {
        document.title = `${serverData.brand.companyName} - Sorteios Oficiais`;
      }
    }
    if (serverData.formFields) {
      setFormFields(serverData.formFields);
      try { StorageService.saveFormFields(serverData.formFields); } catch {}
    }
    if (serverData.posterConfig) {
      setPosterConfig(serverData.posterConfig);
      try { StorageService.savePosterConfig(serverData.posterConfig); } catch {}
    }
    if (serverData.reportConfig) {
      setReportConfig(serverData.reportConfig);
      try { StorageService.saveReportConfig(serverData.reportConfig); } catch {}
    }

    setIsServerConnected(true);
    setLastSyncTime(new Date());
  }, []);

  // Broadcast channel for instant multi-tab sync in same browser
  const broadcastCrossTab = useCallback((dbSnapshot: Partial<AppServerData>) => {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('sorteiolive_cross_tab_sync');
        bc.postMessage({ type: 'DATA_SYNC', data: dbSnapshot });
        bc.close();
      }
    } catch {}
  }, []);

  // Keyboard shortcut listener for Alt + C
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        setIsAdminUnlocked((prev) => {
          const next = !prev;
          try {
            localStorage.setItem('sorteiolive_admin_unlocked', String(next));
          } catch {}
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

  // Real-time synchronization across devices and browsers (Cloud Firestore + SSE + Local)
  useEffect(() => {
    setIsSyncing(true);

    // 1. Cloud Firestore real-time listener (Global, multi-device, works across mobile/desktop)
    const unsubscribeFirestore = FirestoreService.subscribeAll({
      onBrandChange: (b) => {
        setBrand(b);
        try { StorageService.saveBrand(b); } catch {}
        if (b.companyName) {
          document.title = `${b.companyName} - Sorteios Oficiais`;
        }
        setIsServerConnected(true);
        setIsSyncing(false);
      },
      onParticipantsChange: (pList) => {
        setParticipants(pList);
        try { StorageService.saveParticipants(pList); } catch {}
        setIsServerConnected(true);
        setIsSyncing(false);
      },
      onPrizesChange: (przList) => {
        setPrizes(przList);
        try { StorageService.savePrizes(przList); } catch {}
        setIsServerConnected(true);
        setIsSyncing(false);
      },
      onSchedulesChange: (schedList) => {
        setSchedules(schedList);
        try { StorageService.saveSchedules(schedList); } catch {}
        setIsServerConnected(true);
      },
      onWinnersChange: (wList) => {
        setWinners(wList);
        try { StorageService.saveWinners(wList); } catch {}
        setIsServerConnected(true);
      },
      onSettingsChange: (s) => {
        setSettings(s);
        try { StorageService.saveSettings(s); } catch {}
      },
      onFormFieldsChange: (f) => {
        setFormFields(f);
        try { StorageService.saveFormFields(f); } catch {}
      },
      onPosterConfigChange: (pc) => {
        setPosterConfig(pc);
        try { StorageService.savePosterConfig(pc); } catch {}
      },
      onReportConfigChange: (rc) => {
        setReportConfig(rc);
        try { StorageService.saveReportConfig(rc); } catch {}
      },
      onError: (err) => {
        console.warn('Firestore subscription fallback:', err);
      },
    });

    // 2. Initial fallback fetch from server REST API
    ApiService.fetchAllData(2)
      .then((serverData) => {
        if (serverData) {
          applyServerData(serverData);
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsSyncing(false);
      });

    // 3. Real-time Server-Sent Events subscriber (handles both INITIAL_STATE snapshot & DATA_UPDATED)
    const unsubscribeSSE = ApiService.subscribeLiveEvents({
      onInitialState: (snapshot) => {
        if (snapshot?.db) {
          applyServerData(snapshot.db);
        }
      },
      onDataUpdated: (data) => {
        applyServerData(data as AppServerData);
      },
    });

    // 4. Cross-Tab BroadcastChannel listener
    let bc: BroadcastChannel | null = null;
    try {
      if ('BroadcastChannel' in window) {
        bc = new BroadcastChannel('sorteiolive_cross_tab_sync');
        bc.onmessage = (event) => {
          if (event.data?.type === 'DATA_SYNC' && event.data?.data) {
            applyServerData(event.data.data);
          }
        };
      }
    } catch {}

    // 5. Automatic sync when window/tab gains focus or becomes visible
    const handleFocusOrVisible = () => {
      ApiService.fetchAllData(1).then((data) => {
        if (data) applyServerData(data);
      });
    };
    window.addEventListener('focus', handleFocusOrVisible);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        handleFocusOrVisible();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      unsubscribeFirestore();
      unsubscribeSSE();
      bc?.close();
      window.removeEventListener('focus', handleFocusOrVisible);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [applyServerData]);

  // Persist state updates to Cloud Firestore, local storage, central server API, and broadcast across tabs
  const handleUpdateParticipants = (data: Participant[], deletedId?: string) => {
    setParticipants(data);
    try { StorageService.saveParticipants(data); } catch {}
    if (deletedId) {
      FirestoreService.deleteParticipant(deletedId).catch(() => {});
    }
    FirestoreService.saveParticipantsBatch(data).catch(() => {});
    ApiService.saveData({ participants: data });
    broadcastCrossTab({ participants: data });
  };

  const handleClearAllParticipants = () => {
    setParticipants([]);
    try { StorageService.saveParticipants([]); } catch {}
    FirestoreService.clearAllParticipants().catch(() => {});
    ApiService.saveData({ participants: [] });
    broadcastCrossTab({ participants: [] });
  };

  const handleUpdatePrizes = (data: Prize[], deletedId?: string) => {
    setPrizes(data);
    try { StorageService.savePrizes(data); } catch {}
    if (deletedId) {
      FirestoreService.deletePrize(deletedId).catch(() => {});
    }
    FirestoreService.savePrizesBatch(data).catch(() => {});
    ApiService.saveData({ prizes: data });
    broadcastCrossTab({ prizes: data });
  };

  const handleUpdateSchedules = (data: DrawSchedule[]) => {
    setSchedules(data);
    try { StorageService.saveSchedules(data); } catch {}
    FirestoreService.saveSchedulesBatch(data).catch(() => {});
    ApiService.saveData({ schedules: data });
    broadcastCrossTab({ schedules: data });
  };

  const handleUpdateWinners = (data: DrawWinner[]) => {
    setWinners(data);
    try { StorageService.saveWinners(data); } catch {}
    FirestoreService.saveWinnersBatch(data).catch(() => {});
    ApiService.saveData({ winners: data });
    broadcastCrossTab({ winners: data });
  };

  const handleAddNotificationLog = (log: NotificationLog) => {
    const updated = [log, ...notifications];
    setNotifications(updated);
    try { StorageService.saveNotifications(updated); } catch {}
    ApiService.saveData({ notifications: updated });
    broadcastCrossTab({ notifications: updated });
  };

  const handleUpdateSettings = (newSettings: NotificationSettings) => {
    setSettings(newSettings);
    try { StorageService.saveSettings(newSettings); } catch {}
    FirestoreService.saveSettings(newSettings).catch(() => {});
    ApiService.saveData({ settings: newSettings });
    broadcastCrossTab({ settings: newSettings });
  };

  const handleUpdateBrand = (newBrand: BrandConfig) => {
    setBrand(newBrand);
    try { StorageService.saveBrand(newBrand); } catch {}
    if (newBrand.companyName) {
      document.title = `${newBrand.companyName} - Sorteios Oficiais`;
    }
    FirestoreService.saveBrand(newBrand).catch(() => {});
    ApiService.saveData({ brand: newBrand });
    broadcastCrossTab({ brand: newBrand });
  };

  const handleUpdateFormFields = (newFields: FormFieldsConfig) => {
    setFormFields(newFields);
    try { StorageService.saveFormFields(newFields); } catch {}
    FirestoreService.saveFormFields(newFields).catch(() => {});
    ApiService.saveData({ formFields: newFields });
    broadcastCrossTab({ formFields: newFields });
  };

  const handleUpdatePosterConfig = (newPoster: QRCodePosterConfig) => {
    setPosterConfig(newPoster);
    try { StorageService.savePosterConfig(newPoster); } catch {}
    FirestoreService.savePosterConfig(newPoster).catch(() => {});
    ApiService.saveData({ posterConfig: newPoster });
    broadcastCrossTab({ posterConfig: newPoster });
  };

  const handleUpdateReportConfig = (newReport: ReportPdfConfig) => {
    setReportConfig(newReport);
    try { StorageService.saveReportConfig(newReport); } catch {}
    FirestoreService.saveReportConfig(newReport).catch(() => {});
    ApiService.saveData({ reportConfig: newReport });
    broadcastCrossTab({ reportConfig: newReport });
  };

  // Manual Instant Synchronize button handler
  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncToast(null);
    try {
      const freshData = await ApiService.fetchAllData(2);
      if (freshData) {
        applyServerData(freshData);
        setSyncToast(`Base de dados sincronizada! (${freshData.participants?.length || 0} participantes, ${freshData.prizes?.length || 0} prêmios)`);
      } else {
        setSyncToast('Dados sincronizados com o Cloud Firestore!');
      }
    } catch (err: any) {
      setSyncToast('Erro na sincronização: ' + (err?.message || 'Falha de conexão'));
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncToast(null), 3500);
    }
  };

  // Participant Registration handler (from Public page)
  const handleRegisterParticipant = (participant: Participant) => {
    setParticipants((prev) => {
      if (prev.some((p) => p.id === participant.id || p.ticketNumber === participant.ticketNumber)) {
        return prev;
      }
      const updated = [participant, ...prev];
      try { StorageService.saveParticipants(updated); } catch {}
      FirestoreService.saveParticipant(participant).catch(() => {});
      ApiService.saveData({ participants: updated });
      broadcastCrossTab({ participants: updated });
      return updated;
    });
  };

  // Live Draw Winner Announced handler
  const handleWinnerAnnounced = (winner: DrawWinner) => {
    const updatedWinners = [winner, ...winners];
    handleUpdateWinners(updatedWinners);

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

  // Toggle Admin Lock
  const handleToggleAdminLock = () => {
    const next = !isAdminUnlocked;
    setIsAdminUnlocked(next);
    try {
      localStorage.setItem('sorteiolive_admin_unlocked', String(next));
    } catch {}
    if (!next && currentView === 'admin') {
      setCurrentView('public');
    }
  };

  // In-app Unlock Admin submit
  const handleAdminModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminKeyError(null);
    const code = adminKeyInput.trim().toLowerCase();
    // Accept standard passkeys or blank direct confirmation
    if (code === 'admin' || code === 'admin123' || code === '1234' || code === 'sorteio' || code === '') {
      setIsAdminUnlocked(true);
      try {
        localStorage.setItem('sorteiolive_admin_unlocked', 'true');
      } catch {}
      setShowAdminModal(false);
      setAdminKeyInput('');
      setCurrentView('admin');
      setAdminToast('🔑 Painel de Administrador Desbloqueado com sucesso!');
      setTimeout(() => setAdminToast(null), 3500);
    } else {
      setAdminKeyError('Chave incorreta. Dica: digite "admin" ou deixe em branco.');
    }
  };

  // Reset to default factory seeds
  const handleResetAllData = () => {
    let proceed = false;
    try {
      proceed = window.confirm('Deseja restaurar todos os dados padrões de fábrica do sistema de sorteios?');
    } catch {
      proceed = true;
    }
    if (proceed) {
      StorageService.resetToDefault();
      const defParticipants = StorageService.getParticipants();
      const defPrizes = StorageService.getPrizes();
      const defSchedules = StorageService.getSchedules();
      const defWinners = StorageService.getWinners();
      const defNotifications = StorageService.getNotifications();
      const defSettings = StorageService.getSettings();
      const defBrand = StorageService.getBrand();
      const defFields = StorageService.getFormFields();
      const defPoster = StorageService.getPosterConfig();
      const defReport = StorageService.getReportConfig();

      setParticipants(defParticipants);
      setPrizes(defPrizes);
      setSchedules(defSchedules);
      setWinners(defWinners);
      setNotifications(defNotifications);
      setSettings(defSettings);
      setBrand(defBrand);
      setFormFields(defFields);
      setPosterConfig(defPoster);
      setReportConfig(defReport);

      // Persist factory reset to server database
      ApiService.saveData({
        participants: defParticipants,
        prizes: defPrizes,
        schedules: defSchedules,
        winners: defWinners,
        notifications: defNotifications,
        settings: defSettings,
        brand: { ...defBrand, forceResetLogo: true },
        formFields: defFields,
        posterConfig: defPoster,
        reportConfig: defReport,
      });

      broadcastCrossTab({
        participants: defParticipants,
        prizes: defPrizes,
        schedules: defSchedules,
        winners: defWinners,
        notifications: defNotifications,
        settings: defSettings,
        brand: defBrand,
        formFields: defFields,
        posterConfig: defPoster,
        reportConfig: defReport,
      });
    }
  };

  // Inject primary and accent brand colors into document root styles
  useEffect(() => {
    if (brand.primaryColor) {
      document.documentElement.style.setProperty('--brand-primary', brand.primaryColor);
    }
    if (brand.secondaryColor) {
      document.documentElement.style.setProperty('--brand-secondary', brand.secondaryColor);
    }
    if (brand.accentColor) {
      document.documentElement.style.setProperty('--brand-accent', brand.accentColor);
    }
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
        onToggleAdminLock={handleToggleAdminLock}
        onRequestUnlockAdmin={() => setShowAdminModal(true)}
        isServerConnected={isServerConnected}
        isSyncing={isSyncing}
        onManualSync={handleManualSync}
      />

      {/* Sync Confirmation Toast */}
      {syncToast && (
        <div className="fixed top-24 right-4 z-50 bg-slate-900 border-2 border-emerald-500 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-bold text-emerald-200">{syncToast}</p>
        </div>
      )}

      {/* Admin Unlock Toast Indicator */}
      {adminToast && (
        <div className="fixed top-24 right-4 z-50 bg-slate-900 border-2 border-amber-500 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></div>
          <p className="text-xs font-bold text-amber-300">{adminToast}</p>
        </div>
      )}

      {/* In-App Admin Access Modal (Mobile & Desktop Friendly) */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => {
                setShowAdminModal(false);
                setAdminKeyError(null);
                setAdminKeyInput('');
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Acesso de Administrador</h3>
                <p className="text-xs text-slate-400">Entre para gerenciar participantes, prêmios e sorteios</p>
              </div>
            </div>

            <form onSubmit={handleAdminModalSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Chave ou Senha de Acesso:
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    placeholder="Digite 'admin' ou deixe vazio e confirme"
                    value={adminKeyInput}
                    onChange={(e) => setAdminKeyInput(e.target.value)}
                    autoFocus
                    className="w-full bg-slate-950 border border-slate-700/80 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none"
                  />
                </div>
                {adminKeyError && (
                  <p className="text-xs text-red-400 mt-2 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{adminKeyError}</span>
                  </p>
                )}
                <p className="text-[11px] text-slate-400 mt-2">
                  Dica de atalho no computador: Pressione <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-amber-400 font-mono text-[10px]">Alt + C</kbd> em qualquer tela.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-lg cursor-pointer"
                >
                  Acessar Painel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Active View */}
      <main className="flex-1 pb-16 sm:pb-0">
        {currentView === 'public' && (
          <PublicRaffleView
            brand={brand}
            prizes={prizes}
            nextSchedule={nextSchedule}
            schedules={schedules}
            participants={participants}
            formFields={formFields}
            onRegisterParticipant={handleRegisterParticipant}
            onGoToLive={() => setCurrentView('live')}
            onUpdateBrand={handleUpdateBrand}
            isAdmin={isAdminUnlocked}
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
            formFields={formFields}
            posterConfig={posterConfig}
            reportConfig={reportConfig}
            onUpdateParticipants={handleUpdateParticipants}
            onClearAllParticipants={handleClearAllParticipants}
            onUpdatePrizes={handleUpdatePrizes}
            onUpdateSchedules={handleUpdateSchedules}
            onUpdateWinners={handleUpdateWinners}
            onAddNotificationLog={handleAddNotificationLog}
            onUpdateNotificationSettings={handleUpdateSettings}
            onUpdateBrand={handleUpdateBrand}
            onUpdateFormFields={handleUpdateFormFields}
            onUpdatePosterConfig={handleUpdatePosterConfig}
            onUpdateReportConfig={handleUpdateReportConfig}
            onGoToLive={() => setCurrentView('live')}
            onResetAllData={handleResetAllData}
            onManualSync={handleManualSync}
            isSyncing={isSyncing}
          />
        )}
      </main>

      {/* Footer (Hidden on print, extra bottom space on mobile for navigation bar) */}
      <footer className="no-print bg-slate-950 border-t border-slate-900 py-6 pb-24 sm:pb-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">{brand.companyName || 'SorteioLive Pro'}</span>
            <span>· 2 Sorteios Diários Oficiais Auditados</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <button 
              onClick={() => setCurrentView('public')} 
              className="hover:text-white transition-colors cursor-pointer"
            >
              Inscrição & Bilhetes
            </button>
            <button 
              onClick={() => setCurrentView('live')} 
              className="hover:text-white transition-colors cursor-pointer"
            >
              Telão Ao Vivo
            </button>
            {isAdminUnlocked && (
              <button
                onClick={handleManualSync}
                className="hover:text-emerald-400 flex items-center gap-1 transition-colors cursor-pointer"
                title="Sincronizar dados com o banco de dados central"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-amber-400' : ''}`} />
                <span>Sincronizar</span>
              </button>
            )}

            {/* In-app admin shortcut (visible only when admin is already unlocked) */}
            {isAdminUnlocked && (
              <button
                onClick={() => setCurrentView('admin')}
                className="text-amber-400 hover:text-amber-300 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                title="Aceder ao Painel de Administrador"
              >
                <Lock className="w-3 h-3" />
                <span>Painel Admin</span>
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Dedicated Mobile Bottom App Bar (Optimized for Smartphones) */}
      <MobileBottomNav
        currentView={currentView}
        onViewChange={setCurrentView}
        brand={brand}
        isAdminUnlocked={isAdminUnlocked}
        onRequestUnlockAdmin={() => setShowAdminModal(true)}
        nextSchedule={nextSchedule}
      />
    </div>
  );
}
