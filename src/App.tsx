/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  ReportPdfConfig,
  AppUser
} from './types';
import { StorageService, DEFAULT_POSTER_CONFIG, DEFAULT_REPORT_CONFIG, DEFAULT_FORM_FIELDS, DEFAULT_USERS, isLightColor, normalizeBrandConsentTexts } from './utils/storage';
import { ApiService, AppServerData } from './utils/api';
import { FirestoreService } from './utils/firestoreService';
import { Navbar } from './components/Navbar';
import { PublicRaffleView } from './components/PublicRaffleView';
import { LiveDrawRoom } from './components/LiveDrawRoom';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { Lock, Key, ShieldCheck, CheckCircle2, AlertCircle, X, RefreshCw, User as UserIcon, Users } from 'lucide-react';

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

  // Current authenticated user (Administrator or Standard Operator)
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    return StorageService.getCurrentUser();
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
  const [dbErrorToast, setDbErrorToast] = useState<string | null>(null);

  // In-App Admin / User Unlock Modal
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [adminUsernameInput, setAdminUsernameInput] = useState<string>('');
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
  const [users, setUsers] = useState<AppUser[]>(() => StorageService.getUsers());
  const [firestoreLiveState, setFirestoreLiveState] = useState<any>(null);

  // Refs for deletion guards, hydration tracking & sync deduplication
  const deletedUserIdsRef = useRef<Set<string>>(new Set());
  const deletedParticipantIdsRef = useRef<Set<string>>(new Set());
  const deletedWinnerIdsRef = useRef<Set<string>>(new Set());
  const processedWinnerIdsRef = useRef<Set<string>>(new Set());
  const processedPrizeWinnerIdsRef = useRef<Set<string>>(new Set());
  const hasSeededUsersRef = useRef<boolean>(false);
  const latestUsersRef = useRef<AppUser[]>(users);
  const firestoreHydratedRef = useRef<Record<string, boolean>>({});
  const lastSyncedUsersJsonRef = useRef<string>('');
  const lastSyncedParticipantsJsonRef = useRef<string>('');
  const lastSyncedPrizesJsonRef = useRef<string>('');
  const lastSyncedSchedulesJsonRef = useRef<string>('');
  const lastSyncedWinnersJsonRef = useRef<string>('');
  const lastSyncedBrandJsonRef = useRef<string>('');
  const lastSyncedSettingsJsonRef = useRef<string>('');
  const lastSyncedFormFieldsJsonRef = useRef<string>('');
  const lastSyncedPosterJsonRef = useRef<string>('');
  const lastSyncedReportJsonRef = useRef<string>('');
  const lastSyncedNotificationsJsonRef = useRef<string>('');

  useEffect(() => {
    latestUsersRef.current = users;
  }, [users]);

  const notifyPersistError = useCallback((context: string, err: unknown) => {
    console.error(`[Persistence Error] ${context}:`, err);
    const msg = err instanceof Error ? err.message : String(err || 'Erro desconhecido');
    if (msg.includes('Quota exceeded')) {
      setDbErrorToast('Quota diária da base de dados excedida. Tente novamente amanhã ou atualize o plano Firebase.');
    } else {
      setDbErrorToast(`Aviso ao gravar ${context} na nuvem. Dados guardados localmente.`);
    }
    setTimeout(() => setDbErrorToast(null), 5000);
  }, []);

  // Next Upcoming Draw
  const nextSchedule = schedules.find((s) => !s.isLocked && (s.status === 'live' || s.status === 'scheduled')) || schedules[0];

  // Helper to safely apply server data ONLY when Firestore hasn't hydrated that slice (or on live SSE/cross-tab actions)
  const applyServerData = useCallback((
    serverData: Partial<AppServerData>,
    source: 'initial' | 'focus' | 'sse' | 'crosstab' = 'initial'
  ) => {
    if (!serverData) return;
    const isStalePoll = source === 'initial' || source === 'focus';
    const shouldApplySlice = (slice: string) => !isStalePoll || !firestoreHydratedRef.current[slice];

    if (Array.isArray(serverData.participants) && shouldApplySlice('participants')) {
      if (serverData.isFactoryReset || serverData.allowParticipantDeletion) {
        const filtered = serverData.participants.filter((p) => !deletedParticipantIdsRef.current.has(p.id));
        setParticipants(filtered);
        try { StorageService.saveParticipants(filtered); } catch {}
      } else {
        setParticipants((current) => {
          const map = new Map<string, Participant>();
          for (const p of current) {
            if (p.id && deletedParticipantIdsRef.current.has(p.id)) continue;
            const key = p.id || (p.ticketNumber ? `ticket-${p.ticketNumber}` : '');
            if (key) map.set(key, p);
          }
          for (const serverP of serverData.participants!) {
            if (serverP.id && deletedParticipantIdsRef.current.has(serverP.id)) continue;
            const key = serverP.id || (serverP.ticketNumber ? `ticket-${serverP.ticketNumber}` : '');
            if (!key) continue;
            const local = map.get(key) || current.find((c) => c.id === serverP.id || c.ticketNumber === serverP.ticketNumber);
            map.set(key, {
              ...local,
              ...serverP,
              clinic: serverP.clinic?.trim() ? serverP.clinic : (local?.clinic || ''),
              specialty: (serverP.specialty?.trim() && serverP.specialty !== 'Não especificada') ? serverP.specialty : (local?.specialty || ''),
              wantsLacerVisit: serverP.wantsLacerVisit !== undefined ? serverP.wantsLacerVisit : local?.wantsLacerVisit,
              hcpDatabaseConsent: serverP.hcpDatabaseConsent !== undefined ? serverP.hcpDatabaseConsent : local?.hcpDatabaseConsent,
              marketingConsent: serverP.marketingConsent !== undefined ? serverP.marketingConsent : local?.marketingConsent,
              profilingConsent: serverP.profilingConsent !== undefined ? serverP.profilingConsent : local?.profilingConsent,
              termsAccepted: serverP.termsAccepted !== undefined ? serverP.termsAccepted : local?.termsAccepted,
            });
          }
          const merged = Array.from(map.values());
          try { StorageService.saveParticipants(merged); } catch {}
          return merged;
        });
      }
    }
    if (Array.isArray(serverData.prizes) && shouldApplySlice('prizes')) {
      setPrizes(serverData.prizes);
      try { StorageService.savePrizes(serverData.prizes); } catch {}
    }
    if (Array.isArray(serverData.schedules) && serverData.schedules.length > 0 && shouldApplySlice('schedules')) {
      const sortedSchedules = [...serverData.schedules].sort((a, b) => {
        const dateA = `${a.scheduledDate || ''}T${a.scheduledTime || ''}`;
        const dateB = `${b.scheduledDate || ''}T${b.scheduledTime || ''}`;
        return dateA.localeCompare(dateB);
      });
      setSchedules(sortedSchedules);
      try { StorageService.saveSchedules(sortedSchedules); } catch {}
    }
    if (Array.isArray(serverData.winners) && shouldApplySlice('winners')) {
      if (serverData.isFactoryReset || serverData.allowWinnerDeletion) {
        const filtered = serverData.winners.filter((w) => !deletedWinnerIdsRef.current.has(w.id));
        setWinners(filtered);
        try { StorageService.saveWinners(filtered); } catch {}
      } else {
        setWinners((current) => {
          const winnerMap = new Map<string, DrawWinner>();
          for (const w of current) {
            if (w?.id && !deletedWinnerIdsRef.current.has(w.id)) winnerMap.set(w.id, w);
          }
          for (const w of serverData.winners!) {
            if (w?.id && !deletedWinnerIdsRef.current.has(w.id)) {
              winnerMap.set(w.id, { ...(winnerMap.get(w.id) || {}), ...w });
            }
          }
          const mergedWinners = Array.from(winnerMap.values());
          try { StorageService.saveWinners(mergedWinners); } catch {}
          return mergedWinners;
        });
      }
    }
    if (Array.isArray(serverData.notifications) && shouldApplySlice('notifications')) {
      setNotifications(serverData.notifications);
      try { StorageService.saveNotifications(serverData.notifications); } catch {}
    }
    if (serverData.settings && shouldApplySlice('settings')) {
      setSettings(serverData.settings);
      try { StorageService.saveSettings(serverData.settings); } catch {}
    }
    if (serverData.brand && shouldApplySlice('brand')) {
      const normalizedBrand: BrandConfig = normalizeBrandConsentTexts(serverData.brand);
      setBrand(normalizedBrand);
      try { StorageService.saveBrand(normalizedBrand); } catch {}
      if (normalizedBrand.companyName) {
        document.title = `${normalizedBrand.companyName} - Sorteios Oficiais`;
      }
    }
    if (serverData.formFields && shouldApplySlice('formFields')) {
      const mergedFields = { ...DEFAULT_FORM_FIELDS, ...serverData.formFields };
      setFormFields(mergedFields);
      try { StorageService.saveFormFields(mergedFields); } catch {}
    }
    if (serverData.posterConfig && shouldApplySlice('posterConfig')) {
      setPosterConfig(serverData.posterConfig);
      try { StorageService.savePosterConfig(serverData.posterConfig); } catch {}
    }
    if (serverData.reportConfig && shouldApplySlice('reportConfig')) {
      setReportConfig(serverData.reportConfig);
      try { StorageService.saveReportConfig(serverData.reportConfig); } catch {}
    }
    if (Array.isArray(serverData.users) && serverData.users.length > 0 && shouldApplySlice('users')) {
      if (serverData.isFactoryReset || serverData.allowUserDeletion) {
        const filtered = serverData.users.filter((u) => !deletedUserIdsRef.current.has(u.id));
        setUsers(filtered);
        try { StorageService.saveUsers(filtered); } catch {}
      } else {
        setUsers((currentUsers) => {
          const userMap = new Map<string, AppUser>();
          for (const u of currentUsers) {
            if (u.id && !deletedUserIdsRef.current.has(u.id)) userMap.set(u.id, u);
          }
          for (const serverU of serverData.users!) {
            if (serverU.id && !deletedUserIdsRef.current.has(serverU.id)) {
              userMap.set(serverU.id, { ...(userMap.get(serverU.id) || {}), ...serverU });
            }
          }
          const merged = Array.from(userMap.values());
          try { StorageService.saveUsers(merged); } catch {}
          return merged;
        });
      }
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
    FirestoreService.testConnection();

    // 1. Cloud Firestore real-time listener (Authoritative global source across devices)
    const unsubscribeFirestore = FirestoreService.subscribeAll({
      onBrandChange: (b) => {
        firestoreHydratedRef.current.brand = true;
        const normalizedBrand: BrandConfig = normalizeBrandConsentTexts(b);
        setBrand(normalizedBrand);
        try { StorageService.saveBrand(normalizedBrand); } catch {}
        if (normalizedBrand.companyName) {
          document.title = `${normalizedBrand.companyName} - Sorteios Oficiais`;
        }
        const brandJson = JSON.stringify(normalizedBrand);
        if (brandJson !== lastSyncedBrandJsonRef.current) {
          lastSyncedBrandJsonRef.current = brandJson;
          ApiService.saveData({ brand: normalizedBrand }).catch(() => {});
        }
        setIsServerConnected(true);
        setIsSyncing(false);
      },
      onParticipantsChange: (pList) => {
        firestoreHydratedRef.current.participants = true;
        const filtered = pList.filter((p) => p?.id && !deletedParticipantIdsRef.current.has(p.id));
        setParticipants(filtered);
        try { StorageService.saveParticipants(filtered); } catch {}
        const sig = JSON.stringify(filtered.map((p) => `${p.id}:${p.status}:${p.wantsLacerVisit}:${p.hcpDatabaseConsent}`));
        if (sig !== lastSyncedParticipantsJsonRef.current) {
          lastSyncedParticipantsJsonRef.current = sig;
          ApiService.saveData({ participants: filtered, allowParticipantDeletion: true }).catch(() => {});
        }
        setIsServerConnected(true);
        setIsSyncing(false);
      },
      onPrizesChange: (przList) => {
        firestoreHydratedRef.current.prizes = true;
        if (przList.length > 0) {
          setPrizes(przList);
          try { StorageService.savePrizes(przList); } catch {}
          const sig = JSON.stringify(przList);
          if (sig !== lastSyncedPrizesJsonRef.current) {
            lastSyncedPrizesJsonRef.current = sig;
            ApiService.saveData({ prizes: przList }).catch(() => {});
          }
        }
        setIsServerConnected(true);
        setIsSyncing(false);
      },
      onSchedulesChange: (schedList) => {
        firestoreHydratedRef.current.schedules = true;
        if (Array.isArray(schedList) && schedList.length > 0) {
          const sorted = [...schedList].sort((a, b) => {
            const dateA = `${a.scheduledDate || ''}T${a.scheduledTime || ''}`;
            const dateB = `${b.scheduledDate || ''}T${b.scheduledTime || ''}`;
            return dateA.localeCompare(dateB);
          });
          setSchedules(sorted);
          try { StorageService.saveSchedules(sorted); } catch {}
          const sig = JSON.stringify(sorted);
          if (sig !== lastSyncedSchedulesJsonRef.current) {
            lastSyncedSchedulesJsonRef.current = sig;
            ApiService.saveData({ schedules: sorted }).catch(() => {});
          }
          setIsServerConnected(true);
        }
      },
      onWinnersChange: (wList) => {
        firestoreHydratedRef.current.winners = true;
        const filtered = wList.filter((w) => w?.id && !deletedWinnerIdsRef.current.has(w.id));
        setWinners(filtered);
        try { StorageService.saveWinners(filtered); } catch {}
        const winnersJson = JSON.stringify(filtered.map((w) => w.id));
        if (winnersJson !== lastSyncedWinnersJsonRef.current) {
          lastSyncedWinnersJsonRef.current = winnersJson;
          ApiService.saveData({ winners: filtered, allowWinnerDeletion: true }).catch(() => {});
        }
        setIsServerConnected(true);
      },
      onNotificationsChange: (nList) => {
        firestoreHydratedRef.current.notifications = true;
        setNotifications(nList);
        try { StorageService.saveNotifications(nList); } catch {}
        const sig = JSON.stringify(nList.map((n) => n.id));
        if (sig !== lastSyncedNotificationsJsonRef.current) {
          lastSyncedNotificationsJsonRef.current = sig;
          ApiService.saveData({ notifications: nList }).catch(() => {});
        }
      },
      onUsersChange: (uList) => {
        firestoreHydratedRef.current.users = true;
        if (uList.length === 0) {
          if (!hasSeededUsersRef.current) {
            hasSeededUsersRef.current = true;
            const seed = latestUsersRef.current.length > 0 ? latestUsersRef.current : DEFAULT_USERS;
            FirestoreService.saveUsersBatch(seed, false).catch((err) => {
              console.warn('Initial users seed to Firestore failed:', err);
            });
          }
          return;
        }
        const filtered = uList.filter((u) => u?.id && !deletedUserIdsRef.current.has(u.id));
        if (filtered.length > 0) {
          setUsers(filtered);
          try { StorageService.saveUsers(filtered); } catch {}
          const usersJson = JSON.stringify(filtered.map((u) => `${u.id}:${u.username}:${u.password || ''}:${u.role}:${u.active}:${u.name}`));
          if (usersJson !== lastSyncedUsersJsonRef.current) {
            lastSyncedUsersJsonRef.current = usersJson;
            ApiService.saveData({ users: filtered, allowUserDeletion: true }).catch(() => {});
          }
        }
        setIsServerConnected(true);
      },
      onSettingsChange: (s) => {
        firestoreHydratedRef.current.settings = true;
        setSettings(s);
        try { StorageService.saveSettings(s); } catch {}
        const sig = JSON.stringify(s);
        if (sig !== lastSyncedSettingsJsonRef.current) {
          lastSyncedSettingsJsonRef.current = sig;
          ApiService.saveData({ settings: s }).catch(() => {});
        }
      },
      onFormFieldsChange: (f) => {
        firestoreHydratedRef.current.formFields = true;
        const merged = { ...DEFAULT_FORM_FIELDS, ...f };
        setFormFields(merged);
        try { StorageService.saveFormFields(merged); } catch {}
        const sig = JSON.stringify(merged);
        if (sig !== lastSyncedFormFieldsJsonRef.current) {
          lastSyncedFormFieldsJsonRef.current = sig;
          ApiService.saveData({ formFields: merged }).catch(() => {});
        }
      },
      onPosterConfigChange: (pc) => {
        firestoreHydratedRef.current.posterConfig = true;
        setPosterConfig(pc);
        try { StorageService.savePosterConfig(pc); } catch {}
        const sig = JSON.stringify(pc);
        if (sig !== lastSyncedPosterJsonRef.current) {
          lastSyncedPosterJsonRef.current = sig;
          ApiService.saveData({ posterConfig: pc }).catch(() => {});
        }
      },
      onReportConfigChange: (rc) => {
        firestoreHydratedRef.current.reportConfig = true;
        setReportConfig(rc);
        try { StorageService.saveReportConfig(rc); } catch {}
        const sig = JSON.stringify(rc);
        if (sig !== lastSyncedReportJsonRef.current) {
          lastSyncedReportJsonRef.current = sig;
          ApiService.saveData({ reportConfig: rc }).catch(() => {});
        }
      },
      onLiveStateChange: (ls) => {
        firestoreHydratedRef.current.liveState = true;
        setFirestoreLiveState(ls);
      },
      onError: (err) => {
        console.warn('Firestore subscription fallback:', err);
      },
    });

    // 2. Initial fallback fetch from server REST API (skipped automatically for slices already hydrated by Firestore)
    ApiService.fetchAllData(2)
      .then((serverData) => {
        if (serverData) {
          applyServerData(serverData, 'initial');
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsSyncing(false);
      });

    // 3. Real-time Server-Sent Events subscriber
    const unsubscribeSSE = ApiService.subscribeLiveEvents({
      onInitialState: (snapshot) => {
        if (snapshot?.db) {
          applyServerData(snapshot.db, 'initial');
        }
      },
      onDataUpdated: (data) => {
        applyServerData(data as AppServerData, 'sse');
      },
    });

    // 4. Cross-Tab BroadcastChannel listener
    let bc: BroadcastChannel | null = null;
    try {
      if ('BroadcastChannel' in window) {
        bc = new BroadcastChannel('sorteiolive_cross_tab_sync');
        bc.onmessage = (event) => {
          if (event.data?.type === 'DATA_SYNC' && event.data?.data) {
            applyServerData(event.data.data, 'crosstab');
          }
        };
      }
    } catch {}

    // 5. Automatic sync when window/tab gains focus or becomes visible (never clobbers hydrated Firestore slices)
    const handleFocusOrVisible = () => {
      ApiService.fetchAllData(1).then((data) => {
        if (data) applyServerData(data, 'focus');
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
      deletedParticipantIdsRef.current.add(deletedId);
      setTimeout(() => deletedParticipantIdsRef.current.delete(deletedId), 10000);
      FirestoreService.deleteParticipant(deletedId).catch((err) => notifyPersistError('eliminação de participante', err));
    }
    FirestoreService.saveParticipantsBatch(data, !!deletedId).catch((err) => notifyPersistError('participantes', err));
    ApiService.saveData({ participants: data, allowParticipantDeletion: !!deletedId });
    broadcastCrossTab({ participants: data, allowParticipantDeletion: !!deletedId });
  };

  const handleClearAllParticipants = () => {
    participants.forEach((p) => {
      if (p?.id) deletedParticipantIdsRef.current.add(p.id);
    });
    setTimeout(() => deletedParticipantIdsRef.current.clear(), 10000);
    setParticipants([]);
    try { StorageService.saveParticipants([]); } catch {}
    FirestoreService.clearAllParticipants().catch((err) => notifyPersistError('limpeza de participantes', err));
    ApiService.saveData({ participants: [], allowParticipantDeletion: true });
    broadcastCrossTab({ participants: [], allowParticipantDeletion: true });
  };

  const handleUpdatePrizes = (data: Prize[], deletedId?: string) => {
    setPrizes(data);
    try { StorageService.savePrizes(data); } catch {}
    if (deletedId) {
      FirestoreService.deletePrize(deletedId).catch((err) => notifyPersistError('eliminação de prémio', err));
    }
    FirestoreService.savePrizesBatch(data).catch((err) => notifyPersistError('prémios', err));
    ApiService.saveData({ prizes: data });
    broadcastCrossTab({ prizes: data });
  };

  // Reset prize drawn count back to 0 (and optionally clear winners for that prize)
  const handleResetPrize = (prizeId: string, clearAssociatedWinners: boolean = false) => {
    let updatedPrizes: Prize[];
    if (prizeId === 'all') {
      updatedPrizes = prizes.map((p) => ({ ...p, drawnQuantity: 0 }));
    } else {
      updatedPrizes = prizes.map((p) =>
        p.id === prizeId ? { ...p, drawnQuantity: 0 } : p
      );
    }
    handleUpdatePrizes(updatedPrizes);

    if (clearAssociatedWinners) {
      const remainingWinners = prizeId === 'all'
        ? []
        : winners.filter((w) => w.prizeId !== prizeId);
      handleUpdateWinners(remainingWinners, true);
    }

    // Call server API for atomic reset & SSE broadcast
    ApiService.resetPrize(prizeId, clearAssociatedWinners).catch(() => {});
  };

  const handleUpdateSchedules = (data: DrawSchedule[]) => {
    const sorted = [...data].sort((a, b) => {
      const dateA = `${a.scheduledDate || ''}T${a.scheduledTime || ''}`;
      const dateB = `${b.scheduledDate || ''}T${b.scheduledTime || ''}`;
      return dateA.localeCompare(dateB);
    });
    setSchedules(sorted);
    try { StorageService.saveSchedules(sorted); } catch {}
    FirestoreService.saveSchedulesBatch(sorted).catch((err) => notifyPersistError('calendário', err));
    ApiService.saveData({ schedules: sorted });
    broadcastCrossTab({ schedules: sorted });
  };

  const handleUpdateWinners = (data: DrawWinner[], allowDeletion: boolean = false) => {
    setWinners(data);
    try { StorageService.saveWinners(data); } catch {}
    FirestoreService.saveWinnersBatch(data).catch((err) => notifyPersistError('vencedores', err));
    ApiService.saveData({ winners: data, allowWinnerDeletion: allowDeletion });
    broadcastCrossTab({ winners: data, allowWinnerDeletion: allowDeletion });
  };

  const handleAddNotificationLog = (log: NotificationLog) => {
    const updated = [log, ...notifications];
    setNotifications(updated);
    try { StorageService.saveNotifications(updated); } catch {}
    FirestoreService.saveNotification(log).catch((err) => notifyPersistError('notificações', err));
    ApiService.saveData({ notifications: updated });
    broadcastCrossTab({ notifications: updated });
  };

  const handleUpdateSettings = (newSettings: NotificationSettings) => {
    setSettings(newSettings);
    try { StorageService.saveSettings(newSettings); } catch {}
    FirestoreService.saveSettings(newSettings).catch((err) => notifyPersistError('definições', err));
    ApiService.saveData({ settings: newSettings });
    broadcastCrossTab({ settings: newSettings });
  };

  const handleUpdateBrand = (newBrand: BrandConfig) => {
    const normalized = normalizeBrandConsentTexts(newBrand);
    setBrand(normalized);
    try { StorageService.saveBrand(normalized); } catch {}
    if (normalized.companyName) {
      document.title = `${normalized.companyName} - Sorteios Oficiais`;
    }
    FirestoreService.saveBrand(normalized).catch((err) => notifyPersistError('personalização', err));
    ApiService.saveData({ brand: normalized });
    broadcastCrossTab({ brand: normalized });

    // Keep primary administrator password aligned if updated via brand config
    const newPwd = normalized.adminPassword?.trim();
    if (newPwd) {
      const primaryAdmin =
        users.find((u) => u.id === 'usr-admin-1') ||
        users.find((u) => u.username.toLowerCase() === 'admin');
      if (primaryAdmin && primaryAdmin.password !== newPwd) {
        const syncedUsers = users.map((u) =>
          u.id === primaryAdmin.id ? { ...u, password: newPwd } : u
        );
        setUsers(syncedUsers);
        try { StorageService.saveUsers(syncedUsers); } catch {}
        FirestoreService.saveUsersBatch(syncedUsers, false).catch(() => {});
        ApiService.saveData({ users: syncedUsers });
      }
    }
  };

  const handleUpdateFormFields = (newFields: FormFieldsConfig) => {
    setFormFields(newFields);
    try { StorageService.saveFormFields(newFields); } catch {}
    FirestoreService.saveFormFields(newFields).catch((err) => notifyPersistError('campos do formulário', err));
    ApiService.saveData({ formFields: newFields });
    broadcastCrossTab({ formFields: newFields });
  };

  const handleUpdatePosterConfig = (newPoster: QRCodePosterConfig) => {
    setPosterConfig(newPoster);
    try { StorageService.savePosterConfig(newPoster); } catch {}
    FirestoreService.savePosterConfig(newPoster).catch((err) => notifyPersistError('cartaz QR Code', err));
    ApiService.saveData({ posterConfig: newPoster });
    broadcastCrossTab({ posterConfig: newPoster });
  };

  const handleUpdateReportConfig = (newReport: ReportPdfConfig) => {
    setReportConfig(newReport);
    try { StorageService.saveReportConfig(newReport); } catch {}
    FirestoreService.saveReportConfig(newReport).catch((err) => notifyPersistError('configuração de relatório', err));
    ApiService.saveData({ reportConfig: newReport });
    broadcastCrossTab({ reportConfig: newReport });
  };

  // Manual Instant Synchronize button handler (Reconciles Cloud Firestore -> Local & Server DB)
  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncToast(null);
    try {
      const cloud = await FirestoreService.fetchAllSnapshot();
      const hasCloudData = Boolean(
        cloud.brand || cloud.participants.length > 0 || cloud.prizes.length > 0 || cloud.users.length > 0
      );

      if (hasCloudData) {
        const normBrand = cloud.brand ? normalizeBrandConsentTexts(cloud.brand) : brand;
        const resolvedFields = cloud.formFields ? { ...DEFAULT_FORM_FIELDS, ...cloud.formFields } : formFields;

        setBrand(normBrand);
        setParticipants(cloud.participants);
        if (cloud.prizes.length > 0) setPrizes(cloud.prizes);
        if (cloud.schedules.length > 0) setSchedules(cloud.schedules);
        setWinners(cloud.winners);
        if (cloud.users.length > 0) setUsers(cloud.users);
        setNotifications(cloud.notifications);
        if (cloud.settings) setSettings(cloud.settings);
        setFormFields(resolvedFields);
        if (cloud.posterConfig) setPosterConfig(cloud.posterConfig);
        if (cloud.reportConfig) setReportConfig(cloud.reportConfig);
        if (cloud.liveState) setFirestoreLiveState(cloud.liveState);

        try {
          StorageService.saveBrand(normBrand);
          StorageService.saveParticipants(cloud.participants);
          if (cloud.prizes.length > 0) StorageService.savePrizes(cloud.prizes);
          if (cloud.schedules.length > 0) StorageService.saveSchedules(cloud.schedules);
          StorageService.saveWinners(cloud.winners);
          if (cloud.users.length > 0) StorageService.saveUsers(cloud.users);
          StorageService.saveNotifications(cloud.notifications);
          if (cloud.settings) StorageService.saveSettings(cloud.settings);
          StorageService.saveFormFields(resolvedFields);
          if (cloud.posterConfig) StorageService.savePosterConfig(cloud.posterConfig);
          if (cloud.reportConfig) StorageService.saveReportConfig(cloud.reportConfig);
        } catch {}

        await ApiService.saveData({
          brand: normBrand,
          participants: cloud.participants,
          prizes: cloud.prizes.length > 0 ? cloud.prizes : prizes,
          schedules: cloud.schedules.length > 0 ? cloud.schedules : schedules,
          winners: cloud.winners,
          users: cloud.users.length > 0 ? cloud.users : users,
          notifications: cloud.notifications,
          settings: cloud.settings || settings,
          formFields: resolvedFields,
          posterConfig: cloud.posterConfig || posterConfig,
          reportConfig: cloud.reportConfig || reportConfig,
          allowParticipantDeletion: true,
          allowWinnerDeletion: true,
          allowUserDeletion: true,
        });

        setLastSyncTime(new Date());
        setSyncToast(`Base de dados sincronizada! (${cloud.participants.length} participantes, ${cloud.prizes.length || prizes.length} prémios, ${cloud.winners.length} vencedores)`);
      } else {
        const freshData = await ApiService.fetchAllData(2);
        if (freshData) {
          applyServerData(freshData, 'sse');
          setSyncToast(`Base de dados sincronizada! (${freshData.participants?.length || 0} participantes, ${freshData.prizes?.length || 0} prémios)`);
        } else {
          setSyncToast('Dados sincronizados com o Cloud Firestore!');
        }
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
      FirestoreService.saveParticipant(participant).catch((err) => notifyPersistError('registo de participante', err));
      ApiService.saveData({ participants: updated });
      broadcastCrossTab({ participants: updated });
      return updated;
    });
  };

  const isAdministrator = isAdminUnlocked && (!currentUser || currentUser.role === 'admin');

  // Lock scheduled draw slot immediately after draw execution
  const handleLockSchedule = useCallback((scheduleId: string) => {
    if (!scheduleId) return;
    setSchedules((prev) => {
      const nowIso = new Date().toISOString();
      const updated = prev.map((s) =>
        s.id === scheduleId
          ? {
              ...s,
              status: 'completed' as const,
              isLocked: true,
              manuallyUnlocked: false,
              drawnAt: s.drawnAt || nowIso,
            }
          : s
      );
      const sorted = [...updated].sort((a, b) =>
        `${a.scheduledDate || ''}T${a.scheduledTime || ''}`.localeCompare(`${b.scheduledDate || ''}T${b.scheduledTime || ''}`)
      );
      try { StorageService.saveSchedules(sorted); } catch {}
      FirestoreService.saveSchedulesBatch(sorted).catch((err) => notifyPersistError('calendário', err));
      ApiService.saveData({ schedules: sorted });
      broadcastCrossTab({ schedules: sorted });
      return sorted;
    });
  }, [broadcastCrossTab, notifyPersistError]);

  // Administrator-only unlock of a completed/locked schedule (in case of mistake)
  const handleUnlockSchedule = (scheduleId: string, clearSessionWinners: boolean = false) => {
    if (!isAdministrator) {
      setDbErrorToast('Acesso restrito: Somente o Administrador pode desbloquear um sorteio já realizado.');
      setTimeout(() => setDbErrorToast(null), 4000);
      return;
    }

    const unlockedBy = currentUser?.name || currentUser?.username || 'Administrador';
    const nowIso = new Date().toISOString();

    const updatedSchedules = schedules.map((s) =>
      s.id === scheduleId
        ? {
            ...s,
            status: 'scheduled' as const,
            isLocked: false,
            manuallyUnlocked: true,
            unlockedAt: nowIso,
            unlockedBy,
          }
        : s
    );
    handleUpdateSchedules(updatedSchedules);

    if (clearSessionWinners) {
      const sessionWinners = winners.filter((w) => w.drawId === scheduleId);
      if (sessionWinners.length > 0) {
        sessionWinners.forEach((w) => {
          if (w.id) deletedWinnerIdsRef.current.add(w.id);
        });
        setTimeout(() => deletedWinnerIdsRef.current.clear(), 10000);

        const remainingWinners = winners.filter((w) => w.drawId !== scheduleId);
        handleUpdateWinners(remainingWinners, true);

        const remainingWinnerParticipantIds = new Set(remainingWinners.map((w) => w.participantId));
        const removedParticipantIds = new Set(sessionWinners.map((w) => w.participantId));
        const updatedParticipants = participants.map((p) =>
          removedParticipantIds.has(p.id) && !remainingWinnerParticipantIds.has(p.id)
            ? { ...p, status: 'active' as const }
            : p
        );
        handleUpdateParticipants(updatedParticipants);

        const prizeDecrementMap = new Map<string, number>();
        sessionWinners.forEach((w) => {
          prizeDecrementMap.set(w.prizeId, (prizeDecrementMap.get(w.prizeId) || 0) + 1);
        });
        const updatedPrizes = prizes.map((p) => {
          const dec = prizeDecrementMap.get(p.id) || 0;
          return dec > 0 ? { ...p, drawnQuantity: Math.max(0, p.drawnQuantity - dec) } : p;
        });
        handleUpdatePrizes(updatedPrizes);
      }
      ApiService.resetLive().catch(() => {});
    }

    setAdminToast('🔓 Horário de sorteio desbloqueado pelo Administrador.');
    setTimeout(() => setAdminToast(null), 3500);
  };

  // Live Draw Winner Announced handler (idempotent across local finish + SSE reveal)
  const handleWinnerAnnounced = (winner: DrawWinner) => {
    if (processedWinnerIdsRef.current.has(winner.id) || winners.some((w) => w.id === winner.id)) {
      return;
    }
    processedWinnerIdsRef.current.add(winner.id);

    const updatedWinners = [winner, ...winners];
    handleUpdateWinners(updatedWinners);

    const updatedParticipants = participants.map((p) =>
      p.id === winner.participantId ? { ...p, status: 'winner' as const } : p
    );
    handleUpdateParticipants(updatedParticipants);

    if (winner.drawId) {
      handleLockSchedule(winner.drawId);
    }
  };

  // Increment prize drawn count (idempotent when winnerId is supplied)
  const handlePrizeQuantityDrawn = (prizeId: string, winnerId?: string) => {
    if (winnerId) {
      if (processedPrizeWinnerIdsRef.current.has(winnerId) || winners.some((w) => w.id === winnerId)) {
        return;
      }
      processedPrizeWinnerIdsRef.current.add(winnerId);
    }
    const updatedPrizes = prizes.map((p) =>
      p.id === prizeId ? { ...p, drawnQuantity: p.drawnQuantity + 1 } : p
    );
    handleUpdatePrizes(updatedPrizes);
  };

  // Update users list and synchronize to Firestore, Server API, LocalStorage, and Cross-Tab
  const handleUpdateUsers = (newUsers: AppUser[], deletedId?: string) => {
    setUsers(newUsers);
    try { StorageService.saveUsers(newUsers); } catch {}
    if (currentUser) {
      const updatedCurrent = newUsers.find((u) => u.id === currentUser.id);
      if (updatedCurrent) {
        setCurrentUser(updatedCurrent);
        StorageService.saveCurrentUser(updatedCurrent);
      }
    }
    const primaryAdmin =
      newUsers.find((u) => u.id === 'usr-admin-1') ||
      newUsers.find((u) => u.username.toLowerCase() === 'admin') ||
      newUsers.find((u) => u.role === 'admin' && u.active);
    if (primaryAdmin?.password && primaryAdmin.password !== brand.adminPassword) {
      handleUpdateBrand({ ...brand, adminPassword: primaryAdmin.password });
    }
    if (deletedId) {
      deletedUserIdsRef.current.add(deletedId);
      setTimeout(() => deletedUserIdsRef.current.delete(deletedId), 10000);
      FirestoreService.deleteUser(deletedId).catch((err) => notifyPersistError('eliminação de utilizador', err));
    }
    FirestoreService.saveUsersBatch(newUsers, !!deletedId).catch((err) => notifyPersistError('utilizadores', err));
    ApiService.saveData({ users: newUsers, allowUserDeletion: !!deletedId }).then((res) => {
      if (!res.success && !res.serverOffline) {
        notifyPersistError('utilizadores no servidor', res.error);
      }
    });
    broadcastCrossTab({ users: newUsers, allowUserDeletion: !!deletedId });
  };

  // Logout handler
  const handleLogout = () => {
    setIsAdminUnlocked(false);
    setCurrentUser(null);
    StorageService.saveCurrentUser(null);
    try {
      sessionStorage.removeItem('sorteiolive_admin_authenticated');
    } catch {}
    if (currentView === 'admin') {
      setCurrentView('public');
    }
    setAdminToast('🔒 Sessão terminada com sucesso.');
    setTimeout(() => setAdminToast(null), 3000);
  };

  // Toggle Admin Lock
  const handleToggleAdminLock = () => {
    handleLogout();
  };

  // In-app Unlock Admin / User submit (Strictly validates against active user credentials)
  const handleAdminModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminKeyError(null);
    const username = adminUsernameInput.trim().toLowerCase();
    const code = adminKeyInput.trim();

    if (!code) {
      setAdminKeyError('Por favor, introduza a palavra-passe.');
      return;
    }

    // 1. If username is provided, match strictly by username + exact stored password
    if (username) {
      const foundUser = users.find((u) => u.username.toLowerCase() === username);
      if (!foundUser) {
        setAdminKeyError(`Utilizador "${username}" não encontrado.`);
        return;
      }
      if (!foundUser.active) {
        setAdminKeyError('Esta conta de utilizador está desativada. Contacte o administrador.');
        return;
      }
      if (foundUser.password !== code) {
        setAdminKeyError('Palavra-passe incorreta para este utilizador.');
        return;
      }

      // Successful login with user credentials
      setIsAdminUnlocked(true);
      setCurrentUser(foundUser);
      StorageService.saveCurrentUser(foundUser);
      try {
        sessionStorage.setItem('sorteiolive_admin_authenticated', 'true');
      } catch {}
      setShowAdminModal(false);
      setAdminUsernameInput('');
      setAdminKeyInput('');
      setAdminToast(`🔑 Sessão iniciada como ${foundUser.name} (${foundUser.role === 'admin' ? 'Administrador' : 'Utilizador Padrão'})!`);
      setTimeout(() => setAdminToast(null), 3500);
      setCurrentView('admin');
      return;
    }

    // 2. If username is empty, match active user strictly by their current stored password
    const matchingUsers = users.filter((u) => u.active && u.password === code);
    if (matchingUsers.length > 0) {
      const matchedUser = matchingUsers.find((u) => u.role === 'admin') || matchingUsers[0];
      setIsAdminUnlocked(true);
      setCurrentUser(matchedUser);
      StorageService.saveCurrentUser(matchedUser);
      try {
        sessionStorage.setItem('sorteiolive_admin_authenticated', 'true');
      } catch {}
      setShowAdminModal(false);
      setAdminUsernameInput('');
      setAdminKeyInput('');
      setAdminToast(`🔑 Sessão iniciada como ${matchedUser.name} (${matchedUser.role === 'admin' ? 'Administrador' : 'Utilizador Padrão'})!`);
      setTimeout(() => setAdminToast(null), 3500);
      setCurrentView('admin');
      return;
    }

    // Fallback ONLY when no user accounts exist in the database
    if (users.length === 0 && brand.adminPassword?.trim() && code === brand.adminPassword.trim()) {
      const defaultAdmin: AppUser = {
        id: 'usr-admin-1',
        username: 'admin',
        name: 'Administrador Geral',
        role: 'admin',
        createdAt: new Date().toISOString(),
        active: true,
      };
      setIsAdminUnlocked(true);
      setCurrentUser(defaultAdmin);
      StorageService.saveCurrentUser(defaultAdmin);
      try {
        sessionStorage.setItem('sorteiolive_admin_authenticated', 'true');
      } catch {}
      setShowAdminModal(false);
      setAdminUsernameInput('');
      setAdminKeyInput('');
      setAdminToast('🔑 Painel de Administrador Desbloqueado com sucesso!');
      setTimeout(() => setAdminToast(null), 3500);
      setCurrentView('admin');
    } else {
      setAdminKeyError('Credenciais incorretas. Verifique o utilizador e a palavra-passe.');
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
      const defUsers = StorageService.getUsers();

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
      setUsers(defUsers);

      // Persist factory reset to Cloud Firestore
      FirestoreService.clearAllParticipants().catch(() => {});
      FirestoreService.clearAllWinners().catch(() => {});
      FirestoreService.clearAllNotifications().catch(() => {});
      FirestoreService.savePrizesBatch(defPrizes).catch(() => {});
      FirestoreService.saveSchedulesBatch(defSchedules).catch(() => {});
      FirestoreService.saveSettings(defSettings).catch(() => {});
      FirestoreService.saveBrand(defBrand).catch(() => {});
      FirestoreService.saveFormFields(defFields).catch(() => {});
      FirestoreService.savePosterConfig(defPoster).catch(() => {});
      FirestoreService.saveReportConfig(defReport).catch(() => {});
      FirestoreService.saveUsersBatch(defUsers, true).catch(() => {});
      FirestoreService.saveLiveState({
        isDrawing: false,
        prizeId: null,
        scheduleId: null,
        round: 1,
        currentDisplayTicket: '-----',
        currentDisplayName: 'AGUARDANDO SORTEIO...',
        currentDisplayCity: '',
        latestWinner: null,
        lastDrawnAt: null,
      }).catch(() => {});

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
        users: defUsers,
        isFactoryReset: true,
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
        users: defUsers,
        isFactoryReset: true,
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
          currentUser={currentUser}
        />
      )}

      {/* Sync Confirmation Toast */}
      {syncToast && (
        <div className="fixed top-24 right-4 z-50 bg-slate-900 border-2 border-emerald-500 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-bold text-emerald-200">{syncToast}</p>
        </div>
      )}

      {/* Database Error Toast */}
      {dbErrorToast && (
        <div className="fixed top-24 right-4 z-50 bg-red-700 border-2 border-red-400 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <AlertCircle className="w-5 h-5 text-white shrink-0" />
          <p className="text-xs font-bold text-white">{dbErrorToast}</p>
        </div>
      )}

      {/* Admin Unlock Toast Indicator */}
      {adminToast && (
        <div className="fixed top-24 right-4 z-50 bg-slate-900 border-2 border-amber-500 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></div>
          <p className="text-xs font-bold text-amber-300">{adminToast}</p>
        </div>
      )}

      {/* In-App Admin / User Access Modal (Mobile & Desktop Secure Login) */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`border rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <button
              onClick={() => {
                setShowAdminModal(false);
                setAdminKeyError(null);
                setAdminUsernameInput('');
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
                  Autenticação de Utilizador
                </h3>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Inicie sessão como Administrador ou Utilizador Padrão
                </p>
              </div>
            </div>

            <form onSubmit={handleAdminModalSubmit} className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Nome de Utilizador (Login):
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Ex: admin ou operador"
                    value={adminUsernameInput}
                    onChange={(e) => setAdminUsernameInput(e.target.value)}
                    autoFocus
                    className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-[#E30613] ${
                      isLight 
                        ? 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#E30613]' 
                        : 'bg-slate-950 border border-slate-700/80 text-white placeholder-slate-500 focus:border-red-500'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Palavra-passe: <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    placeholder="Introduza a palavra-passe"
                    value={adminKeyInput}
                    onChange={(e) => setAdminKeyInput(e.target.value)}
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
                  Iniciar Sessão
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
            firestoreLiveState={firestoreLiveState}
            isAdmin={isAdminUnlocked}
            isAdministrator={isAdministrator}
            currentUser={currentUser}
            onWinnerAnnounced={handleWinnerAnnounced}
            onPrizeQuantityDrawn={handlePrizeQuantityDrawn}
            onLockSchedule={handleLockSchedule}
            onUnlockSchedule={handleUnlockSchedule}
            onRequestUnlockAdmin={() => {
              if (isAdminUnlocked) {
                setCurrentView('admin');
              } else {
                setShowAdminModal(true);
              }
            }}
            onGoToAdmin={() => {
              if (isAdminUnlocked) {
                setCurrentView('admin');
              } else {
                setShowAdminModal(true);
              }
            }}
            onGoToPublic={() => setCurrentView('public')}
            onResetPrize={handleResetPrize}
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
            users={users}
            currentUser={currentUser}
            onUpdateUsers={handleUpdateUsers}
            onLogout={handleLogout}
            onUpdateParticipants={handleUpdateParticipants}
            onClearAllParticipants={handleClearAllParticipants}
            onUpdatePrizes={handleUpdatePrizes}
            onResetPrize={handleResetPrize}
            onUpdateSchedules={handleUpdateSchedules}
            onUnlockSchedule={handleUnlockSchedule}
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
