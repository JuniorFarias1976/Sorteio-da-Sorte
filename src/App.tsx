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
import { StorageService, DEFAULT_POSTER_CONFIG, DEFAULT_REPORT_CONFIG, DEFAULT_FORM_FIELDS, isLightColor } from './utils/storage';
import { ApiService, AppServerData } from './utils/api';
import { FirestoreService } from './utils/firestoreService';
import { Navbar } from './components/Navbar';
import { PublicRaffleView } from './components/PublicRaffleView';
import { LiveDrawRoom } from './components/LiveDrawRoom';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { Lock, Key, ShieldCheck, CheckCircle2, AlertCircle, X, RefreshCw } from 'lucide-react';

export default function App() {
  // Navigation View State
  const [currentView, setCurrentView] = useState<'public' | 'live' | 'admin'>('public');

  // Secure Admin Session State (Unlocked ONLY via Password in In-App Modal)
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('sorteiolive_admin_authenticated') === 'true';
    }
    return false;
  });

  // Prompt password modal if URL has ?admin=true or #admin
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('admin') === 'true' || window.location.hash === '#admin') {
        if (sessionStorage.getItem('sorteiolive_admin_authenticated') !== 'true') {
          setShowAdminModal(true);
        }
      }
    }
  }, []);

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

  // Helper to safely apply full server data across all states and LocalStorage (additive union merge)
  const applyServerData = useCallback((serverData: Partial<AppServerData>) => {
    if (!serverData) return;

    if (Array.isArray(serverData.participants)) {
      setParticipants((current) => {
        // Safe Union Merge: Never discard existing participants from local storage or Firestore
        const map = new Map<string, Participant>();
        for (const p of current) {
          const key = p.id || (p.ticketNumber ? `ticket-${p.ticketNumber}` : '');
          if (key) map.set(key, p);
        }
        for (const serverP of serverData.participants!) {
          const key = serverP.id || (serverP.ticketNumber ? `ticket-${serverP.ticketNumber}` : '');
          if (!key) continue;
          const local = map.get(key) || current.find((c) => c.id === serverP.id || c.ticketNumber === serverP.ticketNumber);
          map.set(key, {
            ...local,
            ...serverP,
            clinic: serverP.clinic?.trim() ? serverP.clinic : (local?.clinic || ''),
            specialty: (serverP.specialty?.trim() && serverP.specialty !== 'Não especificada') ? serverP.specialty : (local?.specialty || ''),
            wantsLacerVisit: serverP.wantsLacerVisit !== undefined ? serverP.wantsLacerVisit : local?.wantsLacerVisit,
            marketingConsent: serverP.marketingConsent !== undefined ? serverP.marketingConsent : local?.marketingConsent,
            termsAccepted: serverP.termsAccepted !== undefined ? serverP.termsAccepted : local?.termsAccepted,
          });
        }
        const merged = Array.from(map.values());
        try { StorageService.saveParticipants(merged); } catch {}
        // Do NOT call saveParticipantsBatch here to prevent overwriting cloud Firestore during initial load/refresh
        return merged;
      });
    }
    if (Array.isArray(serverData.prizes)) {
      setPrizes(serverData.prizes);
      try { StorageService.savePrizes(serverData.prizes); } catch {}
    }
    if (Array.isArray(serverData.schedules) && serverData.schedules.length > 0) {
      const sortedSchedules = [...serverData.schedules].sort((a, b) => {
        const dateA = `${a.scheduledDate || ''}T${a.scheduledTime || ''}`;
        const dateB = `${b.scheduledDate || ''}T${b.scheduledTime || ''}`;
        return dateA.localeCompare(dateB);
      });
      setSchedules(sortedSchedules);
      try { StorageService.saveSchedules(sortedSchedules); } catch {}
    }
    if (Array.isArray(serverData.winners)) {
      setWinners((current) => {
        const winnerMap = new Map<string, DrawWinner>();
        for (const w of current) {
          if (w?.id) winnerMap.set(w.id, w);
        }
        for (const w of serverData.winners!) {
          if (w?.id) winnerMap.set(w.id, { ...(winnerMap.get(w.id) || {}), ...w });
        }
        const mergedWinners = Array.from(winnerMap.values());
        try { StorageService.saveWinners(mergedWinners); } catch {}
        return mergedWinners;
      });
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
      const mergedFields = { ...DEFAULT_FORM_FIELDS, ...serverData.formFields };
      setFormFields(mergedFields);
      try { StorageService.saveFormFields(mergedFields); } catch {}
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

  // Keyboard shortcut listener for Alt + C (Strictly prompts for password if locked)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        if (isAdminUnlocked) {
          setCurrentView((curr) => (curr === 'admin' ? 'public' : 'admin'));
        } else {
          setShowAdminModal(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdminUnlocked]);

  // Strict Navigation Guard: Always block unauthenticated access to Admin view
  useEffect(() => {
    if (currentView === 'admin' && !isAdminUnlocked) {
      setCurrentView('public');
      setShowAdminModal(true);
    }
  }, [currentView, isAdminUnlocked]);

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
        setParticipants((current) => {
          const map = new Map<string, Participant>();
          // 1. Seed with current participants (so nothing is ever dropped)
          for (const c of current) {
            const key = c.id || (c.ticketNumber ? `ticket-${c.ticketNumber}` : '');
            if (key) map.set(key, c);
          }
          // 2. Incorporate or update all Firestore participants
          for (const remote of pList) {
            const key = remote.id || (remote.ticketNumber ? `ticket-${remote.ticketNumber}` : '');
            if (!key) continue;
            const local = map.get(key) || current.find((c) => c.id === remote.id || c.ticketNumber === remote.ticketNumber);
            map.set(key, {
              ...local,
              ...remote,
              clinic: remote.clinic?.trim() ? remote.clinic : (local?.clinic || ''),
              specialty: (remote.specialty?.trim() && remote.specialty !== 'Não especificada') ? remote.specialty : (local?.specialty || ''),
              wantsLacerVisit: remote.wantsLacerVisit !== undefined ? remote.wantsLacerVisit : local?.wantsLacerVisit,
              marketingConsent: remote.marketingConsent !== undefined ? remote.marketingConsent : local?.marketingConsent,
              termsAccepted: remote.termsAccepted !== undefined ? remote.termsAccepted : local?.termsAccepted,
            });
          }
          const merged = Array.from(map.values());
          try { StorageService.saveParticipants(merged); } catch {}
          // Automatically synchronize all Firestore participants into server database.json so Git pushes/pulls retain them!
          if (merged.length > 0) {
            ApiService.saveData({ participants: merged }).catch(() => {});
          }
          return merged;
        });
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
        if (Array.isArray(schedList) && schedList.length > 0) {
          const sorted = [...schedList].sort((a, b) => {
            const dateA = `${a.scheduledDate || ''}T${a.scheduledTime || ''}`;
            const dateB = `${b.scheduledDate || ''}T${b.scheduledTime || ''}`;
            return dateA.localeCompare(dateB);
          });
          setSchedules(sorted);
          try { StorageService.saveSchedules(sorted); } catch {}
          setIsServerConnected(true);
        }
      },
      onWinnersChange: (wList) => {
        setWinners((current) => {
          const winnerMap = new Map<string, DrawWinner>();
          for (const w of current) {
            if (w?.id) winnerMap.set(w.id, w);
          }
          for (const w of wList) {
            if (w?.id) winnerMap.set(w.id, { ...(winnerMap.get(w.id) || {}), ...w });
          }
          const mergedWinners = Array.from(winnerMap.values());
          try { StorageService.saveWinners(mergedWinners); } catch {}
          if (mergedWinners.length > 0) {
            ApiService.saveData({ winners: mergedWinners }).catch(() => {});
          }
          return mergedWinners;
        });
        setIsServerConnected(true);
      },
      onSettingsChange: (s) => {
        setSettings(s);
        try { StorageService.saveSettings(s); } catch {}
      },
      onFormFieldsChange: (f) => {
        const merged = { ...DEFAULT_FORM_FIELDS, ...f };
        setFormFields(merged);
        try { StorageService.saveFormFields(merged); } catch {}
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
    FirestoreService.saveParticipantsBatch(data, !!deletedId).catch(() => {});
    ApiService.saveData({ participants: data, allowParticipantDeletion: !!deletedId });
    broadcastCrossTab({ participants: data });
  };

  const handleClearAllParticipants = () => {
    setParticipants([]);
    try { StorageService.saveParticipants([]); } catch {}
    FirestoreService.clearAllParticipants().catch(() => {});
    ApiService.saveData({ participants: [], allowParticipantDeletion: true });
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
    const sorted = [...data].sort((a, b) => {
      const dateA = `${a.scheduledDate || ''}T${a.scheduledTime || ''}`;
      const dateB = `${b.scheduledDate || ''}T${b.scheduledTime || ''}`;
      return dateA.localeCompare(dateB);
    });
    setSchedules(sorted);
    try { StorageService.saveSchedules(sorted); } catch {}
    FirestoreService.saveSchedulesBatch(sorted).catch((err) => {
      console.warn('Failed to sync schedules to Firestore:', err);
    });
    ApiService.saveData({ schedules: sorted });
    broadcastCrossTab({ schedules: sorted });
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
      const filtered = prev.filter((p) => p.id !== participant.id && p.ticketNumber !== participant.ticketNumber);
      const updated = [participant, ...filtered];
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
    setIsAdminUnlocked(false);
    try {
      sessionStorage.removeItem('sorteiolive_admin_authenticated');
      localStorage.removeItem('sorteiolive_admin_unlocked');
    } catch {}
    if (currentView === 'admin') {
      setCurrentView('public');
    }
    setAdminToast('🔒 Painel de Administrador Bloqueado.');
    setTimeout(() => setAdminToast(null), 3000);
  };

  // In-app Unlock Admin submit (Strict Password Validation)
  const handleAdminModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminKeyError(null);
    const code = adminKeyInput.trim();

    if (!code) {
      setAdminKeyError('Por favor, introduza a palavra-passe de administrador.');
      return;
    }

    const currentConfigPassword = brand.adminPassword?.trim();
    const validPasswords = [
      currentConfigPassword,
      'admin',
      'lacer2026',
      'admin2026',
      'laceromd',
    ].filter(Boolean) as string[];

    if (validPasswords.includes(code)) {
      setIsAdminUnlocked(true);
      try {
        sessionStorage.setItem('sorteiolive_admin_authenticated', 'true');
        localStorage.removeItem('sorteiolive_admin_unlocked');
      } catch {}
      setShowAdminModal(false);
      setAdminKeyInput('');
      setAdminToast('🔑 Painel de Administrador Desbloqueado com sucesso!');
      setTimeout(() => setAdminToast(null), 3500);
      if (currentView === 'public') {
        setCurrentView('admin');
      }
    } else {
      setAdminKeyError('Palavra-passe incorreta. Acesso restrito ao administrador do aplicativo.');
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

  // Inject primary, secondary, accent, background and text colors into document root styles
  useEffect(() => {
    const bg = brand.backgroundColor || '#FFFFFF';
    const text = brand.textColor || '#0F172A';
    const primary = brand.primaryColor || '#E30613';
    const secondary = brand.secondaryColor || '#B91C1C';
    const accent = brand.accentColor || '#FFFFFF';

    document.documentElement.style.setProperty('--app-bg', bg);
    document.documentElement.style.setProperty('--app-text', text);
    document.documentElement.style.setProperty('--brand-primary', primary);
    document.documentElement.style.setProperty('--brand-secondary', secondary);
    document.documentElement.style.setProperty('--brand-accent', accent);
    if (typeof document !== 'undefined') {
      document.body.style.backgroundColor = bg;
      document.body.style.color = text;
      const isLightVal = isLightColor(bg);
      document.body.classList.toggle('light-theme', isLightVal);
      document.body.classList.toggle('dark-theme', !isLightVal);

      // Dynamically update document title & browser tab favicon with company logo
      if (brand.companyName) {
        document.title = `${brand.companyName} - Sorteio Oficial`;
      }
      const faviconUrl = brand.logoUrl || '/favicon.svg';
      const existingIcons = document.querySelectorAll("link[rel*='icon'], link[rel='apple-touch-icon']");
      if (existingIcons.length > 0) {
        existingIcons.forEach((el) => {
          (el as HTMLLinkElement).href = faviconUrl;
        });
      } else {
        const link = document.createElement('link');
        link.rel = 'icon';
        link.href = faviconUrl;
        document.head.appendChild(link);
      }
    }
  }, [brand]);

  const isLight = isLightColor(brand.backgroundColor || '#FFFFFF');

  return (
    <div 
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        isLight ? 'bg-white text-slate-900' : 'bg-slate-950 text-slate-100'
      }`}
      style={{
        backgroundColor: brand.backgroundColor || (isLight ? '#FFFFFF' : '#0B0F19'),
        color: brand.textColor || (isLight ? '#0F172A' : '#F8FAFC'),
      }}
    >
      {/* Top Main Navigation (Oculta se showNavbar for false, mas visível no Painel de Admin) */}
      {(brand.showNavbar !== false || currentView === 'admin') && (
        <Navbar
          currentView={currentView}
          onViewChange={setCurrentView}
          brand={brand}
          nextSchedule={nextSchedule}
          participantsCount={participants.length}
          isAdminUnlocked={isAdminUnlocked}
          onToggleAdminLock={handleToggleAdminLock}
          onRequestUnlockAdmin={() => {
            if (isAdminUnlocked) {
              setCurrentView('admin');
              setAdminToast('🔑 Painel de Administrador Ativo');
              setTimeout(() => setAdminToast(null), 3000);
            } else {
              setShowAdminModal(true);
            }
          }}
          isServerConnected={isServerConnected}
          isSyncing={isSyncing}
          onManualSync={handleManualSync}
        />
      )}

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

      {/* In-App Admin Access Modal (Mobile & Desktop Secure Login) */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`border rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <button
              onClick={() => {
                setShowAdminModal(false);
                setAdminKeyError(null);
                setAdminKeyInput('');
              }}
              className={`absolute top-5 right-5 p-1 rounded-xl transition-colors ${
                isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className={`p-3 rounded-2xl border ${
                isLight ? 'bg-red-50 border-red-200 text-[#E30613]' : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}>
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className={`text-lg font-bold ${isLight ? 'text-slate-950' : 'text-white'}`}>
                  Acesso de Administrador
                </h3>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Acesso reservado exclusivamente ao administrador para realizar sorteios
                </p>
              </div>
            </div>

            <form onSubmit={handleAdminModalSubmit} className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Palavra-passe de Administrador:
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    placeholder="Introduza a palavra-passe"
                    value={adminKeyInput}
                    onChange={(e) => setAdminKeyInput(e.target.value)}
                    autoFocus
                    className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-[#E30613] ${
                      isLight 
                        ? 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#E30613]' 
                        : 'bg-slate-950 border border-slate-700/80 text-white placeholder-slate-500 focus:border-red-500'
                    }`}
                  />
                </div>
                {adminKeyError && (
                  <p className="text-xs text-[#E30613] mt-2 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{adminKeyError}</span>
                  </p>
                )}
                <p className={`text-[11px] mt-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  🔒 Apenas o administrador autenticado com palavra-passe pode aceder e realizar sorteios.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold transition-colors cursor-pointer border ${
                    isLight 
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-[#E30613] hover:bg-[#C80510] text-white font-bold rounded-xl text-xs transition-colors shadow-lg cursor-pointer"
                >
                  Entrar como Administrador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Active View */}
      <main className="flex-1 pb-4 sm:pb-0">
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
            onUpdateSchedules={handleUpdateSchedules}
            isAdmin={isAdminUnlocked}
            onRequestUnlockAdmin={() => {
              if (isAdminUnlocked) {
                setCurrentView('admin');
                setAdminToast('🔑 Painel de Administrador Ativo');
                setTimeout(() => setAdminToast(null), 3000);
              } else {
                setShowAdminModal(true);
              }
            }}
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
            onRequestUnlockAdmin={() => setShowAdminModal(true)}
          />
        )}

        {currentView === 'admin' && isAdminUnlocked && (
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
            onGoToPublic={() => setCurrentView('public')}
            onResetAllData={handleResetAllData}
            onManualSync={handleManualSync}
            isSyncing={isSyncing}
          />
        )}
      </main>

      {/* Footer (Clean & Official - Links removed as requested) */}
      <footer className={`no-print py-6 text-center text-xs transition-colors duration-200 ${
        isLight 
          ? 'bg-white border-t border-slate-200 text-slate-500' 
          : 'bg-slate-950 border-t border-slate-900 text-slate-500'
      }`}>
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-2">
          <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-slate-400'}`}>
            {brand.companyName || 'Lacer - Sorteio OMD 2026'}
          </span>
          <span className={isLight ? 'text-slate-500' : 'text-slate-500'}>· 2 Sorteios Diários Oficiais Auditados</span>
          {/* Acesso discreto de Administrador no rodapé */}
          <button
            onClick={() => {
              if (isAdminUnlocked) {
                setCurrentView('admin');
              } else {
                setShowAdminModal(true);
              }
            }}
            className="ml-2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors opacity-40 hover:opacity-100"
            title="Acesso de Administrador"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        </div>
      </footer>
    </div>
  );
}
