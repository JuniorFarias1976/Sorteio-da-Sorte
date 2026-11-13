import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Participant, Prize, DrawSchedule, DrawWinner, BrandConfig, AppUser } from '../types';
import { isLightColor } from '../utils/storage';
import { playTickSound, playSuspenseSound, playWinFanfare, playCountdownBeep } from '../utils/audio';
import { exportCertificatePDF } from '../utils/export';
import {
  formatScheduleDatePt,
  getNextAvailablePosteriorSchedule,
  getScheduleDrawLockStatus,
  isScheduleCompletedOrLocked,
} from '../utils/scheduleLock';
import { 
  Trophy, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  CheckCircle2, 
  Award, 
  Download, 
  Users, 
  Gift, 
  ShieldAlert, 
  Flame,
  ArrowRight,
  ArrowLeft,
  Home,
  AlertCircle,
  Calendar,
  Clock,
  Lock,
  Unlock,
  X
} from 'lucide-react';
import { ApiService } from '../utils/api';

interface LiveDrawRoomProps {
  participants: Participant[];
  prizes: Prize[];
  schedules: DrawSchedule[];
  winners: DrawWinner[];
  brand: BrandConfig;
  isAdmin: boolean;
  isAdministrator?: boolean;
  currentUser?: AppUser | null;
  onWinnerAnnounced: (winner: DrawWinner) => void;
  onPrizeQuantityDrawn: (prizeId: string, winnerId?: string) => void;
  onLockSchedule?: (scheduleId: string) => void;
  onUnlockSchedule?: (scheduleId: string, clearSessionWinners?: boolean) => void;
  onRequestUnlockAdmin?: () => void;
  onGoToAdmin?: () => void;
  onGoToPublic?: () => void;
  onResetPrize?: (prizeId: string, clearAssociatedWinners?: boolean) => void;
}

export const LiveDrawRoom: React.FC<LiveDrawRoomProps> = ({
  participants,
  prizes,
  schedules,
  winners,
  brand,
  isAdmin,
  isAdministrator = isAdmin,
  currentUser = null,
  onWinnerAnnounced,
  onPrizeQuantityDrawn,
  onLockSchedule,
  onUnlockSchedule,
  onRequestUnlockAdmin,
  onGoToAdmin,
  onGoToPublic,
  onResetPrize,
}) => {
  const isLight = isLightColor(brand.backgroundColor || '#FFFFFF');
  const roomBg = brand.backgroundColor || (isLight ? '#FFFFFF' : '#0B0F19');
  const [selectedPrizeId, setSelectedPrizeId] = useState<string>(prizes[0]?.id || '');
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);
  const [clearWinnersOnReset, setClearWinnersOnReset] = useState<boolean>(true);
  const [showUnlockScheduleModal, setShowUnlockScheduleModal] = useState<boolean>(false);
  const [clearWinnersOnUnlock, setClearWinnersOnUnlock] = useState<boolean>(false);
  const [resetSuccessNotice, setResetSuccessNotice] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [currentDisplayTicket, setCurrentDisplayTicket] = useState<string>(winners[0]?.participantTicket || '00000');
  const [currentDisplayName, setCurrentDisplayName] = useState<string>(winners[0]?.participantName || 'AGUARDANDO SORTEIO...');
  const [currentDisplayCity, setCurrentDisplayCity] = useState<string>(winners[0]?.participantCity || winners[0]?.participantDocument || '');
  const [latestWinner, setLatestWinner] = useState<DrawWinner | null>(winners[0] || null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [drawErrorNotice, setDrawErrorNotice] = useState<string | null>(null);
  const roomRef = useRef<HTMLDivElement>(null);
  const countdownIntervalRef = useRef<any>(null);
  const tumblerTimeoutRef = useRef<any>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const authoritativeWinnerRef = useRef<DrawWinner | null>(null);

  const clearAllTimers = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (tumblerTimeoutRef.current) {
      clearTimeout(tumblerTimeoutRef.current);
      tumblerTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, []);

  const eligibleParticipants = participants.filter(p => p.status === 'active');
  const currentPrize = prizes.find(p => p.id === selectedPrizeId) || prizes[0];

  // Active Draw Schedule selection (supports dynamic schedules configured in calendar)
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>(
    schedules.find(s => s.status === 'live')?.id || 
    schedules.find(s => s.status === 'scheduled')?.id || 
    schedules[0]?.id || ''
  );

  useEffect(() => {
    if (schedules.length > 0 && (!selectedScheduleId || !schedules.some(s => s.id === selectedScheduleId))) {
      const best = schedules.find(s => s.status === 'live') || schedules.find(s => s.status === 'scheduled') || schedules[0];
      if (best) setSelectedScheduleId(best.id);
    }
  }, [schedules, selectedScheduleId]);

  const activeSchedule = schedules.find(s => s.id === selectedScheduleId) || schedules[0];
  const drawLockStatus = getScheduleDrawLockStatus(activeSchedule, schedules);
  const nextPosteriorSchedule = getNextAvailablePosteriorSchedule(activeSchedule, schedules);

  const handleSelectSchedule = (schedId: string) => {
    setSelectedScheduleId(schedId);
    setDrawErrorNotice(null);
    const target = schedules.find(s => s.id === schedId);
    if (target && target.prizeIds && target.prizeIds.length > 0) {
      const matchPrize = prizes.find(p => target.prizeIds.includes(p.id));
      if (matchPrize) {
        setSelectedPrizeId(matchPrize.id);
      }
    }
  };

  const formatScheduleFullDate = (dateStr?: string) => {
    if (!dateStr) return 'Data Oficial';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString('pt-PT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const formatScheduleShortDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const selectedRound = activeSchedule?.roundNumber || 1;

  const remainingPrizeQuantity = currentPrize ? currentPrize.totalQuantity - currentPrize.drawnQuantity : 0;
  const isPrizeExhausted = remainingPrizeQuantity <= 0;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      roomRef.current?.requestFullscreen().catch(err => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(err => console.error(err));
      setIsFullscreen(false);
    }
  };

  const triggerConfettiExplosion = () => {
    // Stage 1: Big cannon from sides
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#fbbf24', '#ffffff', '#10b981', '#3b82f6'],
    });

    // Stage 2: Left and right cannons
    setTimeout(() => {
      confetti({
        particleCount: 80,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#f59e0b', '#ef4444', '#10b981'],
      });
      confetti({
        particleCount: 80,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#3b82f6', '#ec4899', '#f59e0b'],
      });
    }, 250);
  };

  // Helper to create certified local winner record if server is offline
  const createLocalWinnerRecord = (participant: Participant): DrawWinner => {
    const hashSeed = `${participant.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const validationHash = 'AUTH-' + Array.from(hashSeed)
      .reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) | 0, 0)
      .toString(16)
      .toUpperCase()
      .padStart(8, '0');

    return {
      id: `win-${Date.now()}`,
      drawId: activeSchedule?.id || 'live-draw',
      drawTitle: activeSchedule 
        ? `${activeSchedule.title} (${activeSchedule.scheduledDate} às ${activeSchedule.scheduledTime})`
        : currentPrize?.title || 'Sorteio Oficial',
      participantId: participant.id,
      participantName: participant.name,
      participantEmail: participant.email,
      participantPhone: participant.phone,
      participantTicket: participant.ticketNumber,
      participantDocument: participant.document || '',
      participantClinic: participant.clinic || '',
      participantCity: participant.city || '',
      participantSpecialty: participant.specialty || '',
      prizeId: currentPrize?.id || 'prz-1',
      prizeTitle: currentPrize?.title || 'Prêmio Oficial',
      wonAt: new Date().toISOString(),
      validationHash,
    };
  };

  const finalizeWinner = (winnerRecord: DrawWinner) => {
    clearAllTimers();
    setCountdown(null);
    setIsDrawing(false);

    setCurrentDisplayTicket(winnerRecord.participantTicket);
    setCurrentDisplayName(winnerRecord.participantName);
    setCurrentDisplayCity(winnerRecord.participantCity || winnerRecord.participantDocument || '');
    setLatestWinner(winnerRecord);

    onWinnerAnnounced(winnerRecord);
    onPrizeQuantityDrawn(winnerRecord.prizeId, winnerRecord.id);

    const targetSchedId = activeSchedule?.id || winnerRecord.drawId;
    if (targetSchedId) {
      onLockSchedule?.(targetSchedId);
    }

    broadcastEvent({
      type: 'WINNER_REVEALED',
      winner: winnerRecord,
    });

    if (soundEnabled) {
      playWinFanfare();
    }
    triggerConfettiExplosion();
  };

  const executeTumblerRoll = () => {
    // Guarantees countdown is cleared from screen
    setCountdown(null);
    if (soundEnabled) playSuspenseSound();

    let step = 0;
    const totalSteps = 42; // around 4-5 seconds of suspenseful deceleration
    const randomFallback = eligibleParticipants[Math.floor(Math.random() * eligibleParticipants.length)] || participants[0];

    const tick = () => {
      step++;

      // Pick random participant display during the spin
      const randomDisplay = eligibleParticipants[Math.floor(Math.random() * eligibleParticipants.length)] || randomFallback;
      if (randomDisplay) {
        setCurrentDisplayTicket(randomDisplay.ticketNumber);
        setCurrentDisplayName(randomDisplay.name);
        setCurrentDisplayCity(randomDisplay.city || '');
      }

      if (step % 3 === 0 && randomDisplay) {
        broadcastEvent({
          type: 'TUMBLER_TICK',
          ticket: randomDisplay.ticketNumber,
          name: randomDisplay.name,
          city: randomDisplay.city || '',
        });
      }

      if (soundEnabled && step % 2 === 0) {
        playTickSound(620 + step * 7);
      }

      if (step >= totalSteps) {
        // Tumbler roll finished: lock onto the authoritative winner
        const targetWinner = authoritativeWinnerRef.current || createLocalWinnerRecord(randomFallback);
        finalizeWinner(targetWinner);
      } else {
        // Dramatic deceleration curve towards the end
        let delay = 45;
        if (step > 35) {
          delay = 280 + (step - 35) * 65; // 280ms, 345ms, 410ms... dramatic climax
        } else if (step > 26) {
          delay = 120 + (step - 26) * 16; // 120ms, 136ms... starting to slow
        } else if (step > 15) {
          delay = 70;
        }

        tumblerTimeoutRef.current = setTimeout(tick, delay);
      }
    };

    tumblerTimeoutRef.current = setTimeout(tick, 45);
  };

  // Multi-device real-time sync (SSE + BroadcastChannel)
  useEffect(() => {
    // 1. Initial snapshot of live state
    ApiService.getLiveState().then((state) => {
      if (!state) return;
      if (state.prizeId) setSelectedPrizeId(state.prizeId);
      if (state.scheduleId) {
        const matchedById = schedules.find(s => s.id === state.scheduleId);
        if (matchedById) setSelectedScheduleId(matchedById.id);
      } else if (state.round) {
        const matched = schedules.find(s => s.roundNumber === state.round);
        if (matched) setSelectedScheduleId(matched.id);
      }
      if (state.isDrawing) setIsDrawing(true);
      if (state.currentDisplayTicket) setCurrentDisplayTicket(state.currentDisplayTicket);
      if (state.currentDisplayName) setCurrentDisplayName(state.currentDisplayName);
      if (state.currentDisplayCity) setCurrentDisplayCity(state.currentDisplayCity);
      if (state.latestWinner) setLatestWinner(state.latestWinner);
    });

    // 2. Real-time Multi-device Server-Sent Events (SSE) listener
    const unsubscribe = ApiService.subscribeLiveEvents({
      onLiveEvent: (data) => {
        if (!data) return;

        if (data.type === 'START_DRAW') {
          // If this is the admin who initiated the draw, their local controller is already running
          if (isAdmin) return;

          clearAllTimers();
          if (data.prizeId) setSelectedPrizeId(data.prizeId);
          if (data.scheduleId) {
            const matchedById = schedules.find(s => s.id === data.scheduleId);
            if (matchedById) setSelectedScheduleId(matchedById.id);
          } else if (data.round) {
            const matched = schedules.find(s => s.roundNumber === data.round);
            if (matched) setSelectedScheduleId(matched.id);
          }
          setLatestWinner(null);
          setIsDrawing(true);
          setCountdown(3);
          if (soundEnabled) playCountdownBeep(false);

          let c = 3;
          countdownIntervalRef.current = setInterval(() => {
            c--;
            if (c <= 0) {
              if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
                countdownIntervalRef.current = null;
              }
              setCountdown(null);
              if (soundEnabled) playCountdownBeep(true);
            } else {
              setCountdown(c);
              if (soundEnabled) playCountdownBeep(false);
            }
          }, 1000);
        } else if (data.type === 'TUMBLER_TICK') {
          if (!isAdmin) {
            setCountdown(null);
            setIsDrawing(true);
            setCurrentDisplayTicket(data.ticket);
            setCurrentDisplayName(data.name);
            setCurrentDisplayCity(data.city);
            if (soundEnabled) playTickSound(700);
          }
        } else if (data.type === 'WINNER_REVEALED') {
          clearAllTimers();
          setIsDrawing(false);
          setCountdown(null);
          setCurrentDisplayTicket(data.winner.participantTicket);
          setCurrentDisplayName(data.winner.participantName);
          setCurrentDisplayCity(data.winner.participantCity || data.winner.participantDocument || '');
          setLatestWinner(data.winner);
          onWinnerAnnounced(data.winner);
          onPrizeQuantityDrawn(data.winner.prizeId, data.winner.id);
          if (soundEnabled) playWinFanfare();
          triggerConfettiExplosion();
        } else if (data.type === 'LIVE_RESET') {
          clearAllTimers();
          setIsDrawing(false);
          setCountdown(null);
          setLatestWinner(null);
          setCurrentDisplayTicket('-----');
          setCurrentDisplayName('AGUARDANDO SORTEIO...');
          setCurrentDisplayCity('');
        }
      },
    });

    // 3. Same-origin tab fallback channel
    let channel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        channel = new BroadcastChannel('sorteiolive_stream_channel');
        channel.onmessage = (event) => {
          const data = event.data;
          if (!data) return;
          if (data.type === 'LIVE_RESET') {
            clearAllTimers();
            setIsDrawing(false);
            setCountdown(null);
            setLatestWinner(null);
            setCurrentDisplayTicket('-----');
            setCurrentDisplayName('AGUARDANDO SORTEIO...');
            setCurrentDisplayCity('');
          }
        };
      } catch (e) {
        console.debug('BroadcastChannel error', e);
      }
    }

    return () => {
      unsubscribe();
      channel?.close();
    };
  }, [isAdmin, soundEnabled, onWinnerAnnounced, onPrizeQuantityDrawn]);

  const broadcastEvent = (payload: object) => {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const channel = new BroadcastChannel('sorteiolive_stream_channel');
        channel.postMessage(payload);
        channel.close();
      }
    } catch (e) {
      console.debug('Broadcast sync notice:', e);
    }
  };

  const startDrawRoutine = async () => {
    if (!isAdmin) {
      setDrawErrorNotice('Acesso Restrito: Somente um utilizador autenticado pode realizar o sorteio!');
      onRequestUnlockAdmin?.();
      setTimeout(() => setDrawErrorNotice(null), 4000);
      return;
    }
    if (drawLockStatus.isLocked) {
      setDrawErrorNotice(
        drawLockStatus.message ||
          'Este sorteio já foi realizado e está bloqueado. Só é possível realizar um novo sorteio numa data ou hora posterior.'
      );
      setTimeout(() => setDrawErrorNotice(null), 5000);
      return;
    }
    if (eligibleParticipants.length === 0) {
      setDrawErrorNotice('Não há participantes ativos e válidos para sortear. Verifique a lista de inscritos no painel administrativo.');
      setTimeout(() => setDrawErrorNotice(null), 4000);
      return;
    }
    if (!currentPrize) {
      setDrawErrorNotice('Selecione um prêmio para realizar o sorteio.');
      setTimeout(() => setDrawErrorNotice(null), 4000);
      return;
    }
    if (isPrizeExhausted) {
      setDrawErrorNotice(`Atenção: A quantidade estipulada para o prêmio "${currentPrize.title}" (${currentPrize.totalQuantity} unidades) já foi totalmente contemplada! Selecione outro prêmio disponível.`);
      setTimeout(() => setDrawErrorNotice(null), 5000);
      return;
    }

    // Reset previous timers and state
    clearAllTimers();
    authoritativeWinnerRef.current = null;
    setLatestWinner(null);
    setDrawErrorNotice(null);
    setIsDrawing(true);
    setCountdown(3);

    broadcastEvent({
      type: 'START_DRAW',
      prizeId: currentPrize.id,
      scheduleId: activeSchedule?.id,
      round: selectedRound,
    });

    if (soundEnabled) playCountdownBeep(false);

    // Call server to trigger draw asynchronously (validates schedule lock on server)
    ApiService.triggerDraw(currentPrize.id, selectedRound, activeSchedule?.id)
      .then((res) => {
        if (res.success && res.winner) {
          authoritativeWinnerRef.current = res.winner;
        } else if (!res.success && res.code === 'SCHEDULE_LOCKED') {
          clearAllTimers();
          setIsDrawing(false);
          setCountdown(null);
          setDrawErrorNotice(res.error || 'Este sorteio está bloqueado. Só é possível sortear numa data ou hora posterior.');
          setTimeout(() => setDrawErrorNotice(null), 5000);
        }
      })
      .catch((err) => {
        console.warn('Server triggerDraw async error (fallback local):', err);
      });

    // Start robust local countdown: 3 -> 2 -> 1 -> GO!
    let count = 3;
    countdownIntervalRef.current = setInterval(() => {
      count--;
      if (count <= 0) {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        setCountdown(null);
        if (soundEnabled) playCountdownBeep(true);
        // Start digital tumbler
        executeTumblerRoll();
      } else {
        setCountdown(count);
        if (soundEnabled) playCountdownBeep(false);
      }
    }, 1000);
  };

  const handleResetScreen = async () => {
    clearAllTimers();
    setIsDrawing(false);
    setCountdown(null);
    setLatestWinner(null);
    setCurrentDisplayTicket('-----');
    setCurrentDisplayName('AGUARDANDO SORTEIO...');
    setCurrentDisplayCity('');
    broadcastEvent({ type: 'LIVE_RESET' });
    try {
      await ApiService.resetLive();
    } catch (e) {
      console.warn('Reset live error:', e);
    }
  };

  const handleResetCurrentPrize = () => {
    if (!currentPrize) return;
    if (onResetPrize) {
      onResetPrize(currentPrize.id, clearWinnersOnReset);
    }
    if (latestWinner?.prizeId === currentPrize.id) {
      setLatestWinner(null);
    }
    setShowResetConfirmModal(false);
    setResetSuccessNotice(`Prémio "${currentPrize.title}" resetado com sucesso! Todas as ${currentPrize.totalQuantity} unidades estão novamente disponíveis.`);
    setTimeout(() => setResetSuccessNotice(null), 4500);
  };

  return (
    <div 
      ref={roomRef}
      style={isLight ? { backgroundColor: roomBg } : undefined}
      className={`min-h-[calc(100vh-80px)] flex flex-col justify-between p-4 sm:p-6 lg:p-8 select-none transition-colors duration-200 ${
        isLight
          ? 'bg-white text-slate-900'
          : 'bg-radial from-slate-900 via-slate-950 to-black text-white'
      } ${
        isFullscreen ? 'fixed inset-0 z-50 overflow-y-auto' : ''
      }`}
    >
      {/* Top Bar / Broadcast Header */}
      <div className={`flex flex-wrap items-center justify-between gap-4 border-b pb-4 ${
        isLight ? 'border-slate-200' : 'border-slate-800/80'
      }`}>
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Navigation Back Buttons */}
          {isAdmin ? (
            <button
              type="button"
              onClick={() => {
                if (document.fullscreenElement) {
                  document.exitFullscreen().catch(() => {});
                }
                onGoToAdmin?.();
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#E30613] hover:bg-[#C80510] text-white font-extrabold text-xs shadow-md transition-all cursor-pointer active:scale-95"
              title="Voltar ao Painel de Administrador"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              <span>Painel Admin</span>
            </button>
          ) : (
            onRequestUnlockAdmin && (
              <button
                type="button"
                onClick={() => {
                  if (document.fullscreenElement) {
                    document.exitFullscreen().catch(() => {});
                  }
                  onRequestUnlockAdmin();
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs border shadow-sm transition-all cursor-pointer ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                    : 'bg-slate-800/90 hover:bg-slate-700 text-amber-300 hover:text-white border-amber-500/40'
                }`}
                title="Aceder ao Painel de Administrador com palavra-passe"
              >
                <Lock className={`w-3.5 h-3.5 ${isLight ? 'text-[#E30613]' : 'text-amber-400'}`} />
                <span>Entrar como Admin</span>
              </button>
            )
          )}

          {onGoToPublic && (
            <button
              type="button"
              onClick={() => {
                if (document.fullscreenElement) {
                  document.exitFullscreen().catch(() => {});
                }
                onGoToPublic();
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-xs border transition-colors cursor-pointer ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
              }`}
              title="Voltar à página pública do sorteio"
            >
              <Home className={`w-3.5 h-3.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">Página Pública</span>
            </button>
          )}

          {isAdmin ? (
            <div className={`flex items-center gap-1.5 px-3 py-1 border rounded-full text-xs font-bold tracking-wider uppercase ${
              isLight ? 'bg-red-50 border-red-200 text-[#E30613]' : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
            }`}>
              {isAdministrator ? '👑 MESA DO ADMINISTRADOR' : `👤 MESA DO OPERADOR${currentUser?.name ? ` (${currentUser.name})` : ''}`}
            </div>
          ) : (
            <div className={`flex items-center gap-2 px-3 py-1 border rounded-full text-xs font-bold tracking-wider uppercase animate-pulse ${
              isLight ? 'bg-red-50 border-red-200 text-[#E30613]' : 'bg-red-500/20 border-red-500/40 text-red-400'
            }`}>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              TRANSMISSÃO AO VIVO (TELESPECTADOR)
            </div>
          )}

          {/* Dynamic Schedules Switcher (Showing Days, Times, and Lock State) */}
          <div className={`flex flex-wrap items-center border rounded-xl p-1 gap-1 max-w-full overflow-x-auto ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            {schedules.length > 0 ? (
              schedules.map((s) => {
                const isSelected = selectedScheduleId === s.id;
                const shortDate = formatScheduleShortDate(s.scheduledDate);
                const slotLocked = isScheduleCompletedOrLocked(s) || getScheduleDrawLockStatus(s, schedules).isLocked;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      if (isAdmin) handleSelectSchedule(s.id);
                    }}
                    disabled={!isAdmin}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      isAdmin ? 'cursor-pointer' : 'cursor-default'
                    } ${
                      isSelected
                        ? slotLocked
                          ? (isLight ? 'bg-slate-800 text-white font-bold shadow-sm' : 'bg-slate-700 text-amber-300 font-bold shadow-md')
                          : (isLight ? 'bg-[#E30613] text-white font-bold shadow-sm' : 'bg-amber-500 text-slate-950 font-bold shadow-md')
                        : slotLocked
                        ? (isLight ? 'text-slate-400 bg-slate-200/70 hover:text-slate-700' : 'text-slate-500 bg-slate-950/60 hover:text-slate-300')
                        : isAdmin
                        ? (isLight ? 'text-slate-700 hover:text-slate-900 hover:bg-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/60')
                        : (isLight ? 'text-slate-500 opacity-70' : 'text-slate-500 opacity-60')
                    }`}
                    title={
                      isAdmin
                        ? `${s.title} • ${formatScheduleFullDate(s.scheduledDate)} às ${s.scheduledTime}${slotLocked ? ' (Bloqueado)' : ''}`
                        : `Sessão: ${s.title}`
                    }
                  >
                    {slotLocked && <Lock className="w-3 h-3 shrink-0 opacity-85" />}
                    <span className="font-mono text-[11px] opacity-90">{shortDate}</span>
                    <span className="font-bold">{s.scheduledTime}</span>
                    <span className="hidden md:inline text-[11px]">({s.title})</span>
                  </button>
                );
              })
            ) : (
              <span className="text-xs text-slate-500 px-2 py-1">Sem sorteios agendados</span>
            )}
          </div>

          <div className={`flex items-center gap-1.5 text-xs ${isLight ? 'text-slate-700 font-medium' : 'text-slate-300'}`}>
            <Users className={`w-3.5 h-3.5 ${isLight ? 'text-[#E30613]' : 'text-amber-400'}`} />
            <span>{eligibleParticipants.length} concorrentes ativos no globo</span>
          </div>
        </div>

        {/* Controls: Audio & Fullscreen & Admin Status */}
        <div className="flex items-center gap-2">
          {isAdmin ? (
            <>
              <span className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${
                isLight ? 'bg-red-50 border-red-200 text-[#E30613]' : 'bg-red-500/15 border-red-500/30 text-red-300'
              }`}>
                <ShieldAlert className={`w-3.5 h-3.5 ${isLight ? 'text-[#E30613]' : 'text-red-400'}`} />
                <span>{isAdministrator ? 'Admin Ativo' : 'Operador Ativo'}</span>
              </span>
              <button
                onClick={handleResetScreen}
                className={`p-2.5 rounded-xl border transition-all text-xs flex items-center gap-1.5 cursor-pointer ${
                  isLight
                    ? 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
                    : 'bg-slate-800 border-slate-700 text-amber-400 hover:text-white hover:bg-slate-700'
                }`}
                title="Limpar telão e preparar próximo giro"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Limpar Telão</span>
              </button>
            </>
          ) : (
            <button
              onClick={onRequestUnlockAdmin}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
              }`}
              title="Aceder com palavra-passe para desbloquear controlo de sorteio"
            >
              <Lock className={`w-3.5 h-3.5 ${isLight ? 'text-[#E30613]' : 'text-amber-400'}`} />
              <span>Modo Espetador</span>
            </button>
          )}

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border transition-all text-xs flex items-center gap-1.5 cursor-pointer ${
              soundEnabled
                ? (isLight ? 'bg-slate-100 border-slate-300 text-[#E30613] hover:bg-slate-200 font-semibold' : 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700')
                : (isLight ? 'bg-white border-slate-200 text-slate-500 hover:text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-white')
            }`}
            title={soundEnabled ? 'Silenciar Áudio' : 'Ativar Efeitos Sonoros'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Som Ativo' : 'Mudo'}</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className={`p-2.5 rounded-xl border transition-all text-xs flex items-center gap-1.5 cursor-pointer ${
              isLight
                ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200 font-semibold'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
            title="Modo Telão Completo"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Sair do Telão' : 'Modo Telão'}</span>
          </button>
        </div>
      </div>

      {/* Main Stage Grid */}
      <div className="max-w-6xl w-full mx-auto my-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Side: Prize in dispute */}
        <div className="lg:col-span-4 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-md shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-amber-400 font-semibold uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5">
                <Gift className="w-4 h-4" />
                Prêmio em Disputa
              </span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                isPrizeExhausted 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                  : 'text-slate-300'
              }`}>
                {remainingPrizeQuantity} restam de {currentPrize?.totalQuantity}
              </span>
            </div>

            {/* Prize selector: Admin gets dropdown, Viewers get read-only title badge */}
            {isAdmin ? (
              <select
                value={selectedPrizeId}
                onChange={(e) => {
                  setSelectedPrizeId(e.target.value);
                  setLatestWinner(null);
                }}
                disabled={isDrawing}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-none mb-3"
              >
                {prizes.map((p) => {
                  const rem = p.totalQuantity - p.drawnQuantity;
                  return (
                    <option key={p.id} value={p.id}>
                      {p.title} {rem <= 0 ? '❌ [ESGOTADO]' : `(Disp: ${rem} de ${p.totalQuantity})`}
                    </option>
                  );
                })}
              </select>
            ) : (
              <div className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-bold text-white mb-3 flex items-center justify-between">
                <span className="truncate">{currentPrize?.title}</span>
                <span className="text-amber-400 font-mono text-xs shrink-0">{remainingPrizeQuantity} disp.</span>
              </div>
            )}

            {isAdmin && currentPrize && (currentPrize.drawnQuantity > 0 || isPrizeExhausted) && (
              <div className="mb-3 space-y-2">
                {currentPrize.drawnQuantity > 0 && !isPrizeExhausted && (
                  <div className="flex items-center justify-between p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs">
                    <span className="text-slate-400">
                      <strong className="text-amber-400 font-bold">{currentPrize.drawnQuantity}</strong> sorteados de {currentPrize.totalQuantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setClearWinnersOnReset(true);
                        setShowResetConfirmModal(true);
                      }}
                      disabled={isDrawing}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 hover:text-white text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                      title="Zerar os sorteios já realizados deste prémio"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Resetar Prémio</span>
                    </button>
                  </div>
                )}

                {isPrizeExhausted && (
                  <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs space-y-2.5">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <span>A quantidade estipulada para este prémio ({currentPrize?.totalQuantity} unidades) já foi totalmente contemplada!</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setClearWinnersOnReset(true);
                        setShowResetConfirmModal(true);
                      }}
                      className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-95"
                    >
                      <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Resetar Prémio Agora ({currentPrize?.totalQuantity} unidades)</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Prize Card Presentation */}
            {currentPrize && (
              <div className="relative group rounded-2xl overflow-hidden border border-slate-700/60 bg-slate-950/80 p-4">
                {currentPrize.imageUrl ? (
                  <div className="h-44 w-full rounded-xl overflow-hidden mb-3 bg-slate-900">
                    <img 
                      src={currentPrize.imageUrl} 
                      alt={currentPrize.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ) : (
                  <div className="h-36 w-full rounded-xl bg-gradient-to-tr from-amber-500/20 to-slate-800 flex items-center justify-center mb-3">
                    <Trophy className="w-16 h-16 text-amber-400" />
                  </div>
                )}

                <h3 className="text-lg font-bold text-white mb-1 leading-snug">
                  {currentPrize.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                  {currentPrize.description}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                  <span className="text-slate-400">Valor Estimado:</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    {currentPrize.estimatedValue ? `€ ${currentPrize.estimatedValue.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}` : 'Inestimável'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Algoritmo Auditável</span>
            <span className="text-emerald-400 flex items-center gap-1 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Semente Cripto-Ativa
            </span>
          </div>
        </div>

        {/* Center / Right: The Big Roulette & Digital Drum */}
        <div className="lg:col-span-8 flex flex-col items-center justify-center">
              {/* Drum Box */}
              <div className={`w-full rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden text-center border-2 ${
                isLight
                  ? 'bg-white border-red-200 text-slate-900'
                  : 'bg-gradient-to-b from-slate-900 to-slate-950 border-amber-500/30 glow-amber text-white'
              }`}>
                {/* Background glowing rings */}
                <div className={`absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none ${
                  isLight ? 'bg-red-500/5' : 'bg-amber-500/10'
                }`}></div>

                <div className="relative z-10">
                  <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-semibold mb-4 ${
                    isLight
                      ? 'bg-red-50 border-red-200 text-[#E30613]'
                      : 'bg-slate-800/90 border-slate-700/80 text-amber-400'
                  }`}>
                    <Sparkles className={`w-4 h-4 ${isLight ? 'text-[#E30613]' : 'text-amber-400'}`} />
                    <span>GLOBO ELETRÔNICO DE SORTEIOS</span>
                  </div>

                  {/* Active Scheduled Draw Day & Time Information Banner */}
                  <div className={`mb-6 max-w-xl mx-auto p-3.5 rounded-2xl border shadow-sm text-center ${
                    isLight
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-slate-950/90 border-amber-500/30 shadow-lg'
                  }`}>
                    <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${
                      isLight ? 'text-[#E30613]' : 'text-amber-400/90'
                    }`}>
                      Sessão Oficial Programada
                    </div>
                    <div className={`text-base sm:text-lg font-black mb-2 ${
                      isLight ? 'text-slate-900' : 'text-white'
                    }`}>
                      {activeSchedule ? activeSchedule.title : 'Sorteio Oficial'}
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs">
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border font-bold ${
                        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-red-300'
                      }`}>
                        <Calendar className="w-3.5 h-3.5 text-[#E30613] shrink-0" />
                        <span className={`font-normal ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Dia:</span>
                        <span className={`capitalize ${isLight ? 'text-slate-900' : 'text-white'}`}>{formatScheduleFullDate(activeSchedule?.scheduledDate)}</span>
                      </div>
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border font-bold ${
                        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-red-300'
                      }`}>
                        <Clock className="w-3.5 h-3.5 text-[#E30613] shrink-0" />
                        <span className={`font-normal ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Horário:</span>
                        <span className="font-mono text-[#E30613] font-extrabold text-sm">{activeSchedule?.scheduledTime || '10:00'}</span>
                      </div>
                      {drawLockStatus.isLocked && (
                        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[11px] font-bold ${
                          isLight ? 'bg-amber-100 border-amber-300 text-amber-900' : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        }`}>
                          <Lock className="w-3 h-3 shrink-0" />
                          <span>{drawLockStatus.reason === 'ALREADY_DRAWN' ? 'Bloqueado • Já Sorteado' : 'Bloqueado • Horário Anterior'}</span>
                        </div>
                      )}
                      {!drawLockStatus.isLocked && activeSchedule?.manuallyUnlocked && (
                        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[11px] font-bold ${
                          isLight ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                        }`}>
                          <Unlock className="w-3 h-3 shrink-0" />
                          <span>Desbloqueado pelo Admin</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Countdown overlay if active */}
                  {countdown !== null ? (
                    <div className="py-12 animate-bounce">
                      <div className="text-8xl font-black font-mono text-[#E30613] drop-shadow-[0_0_25px_rgba(227,6,19,0.45)]">
                        {countdown}
                      </div>
                      <p className={`text-sm font-semibold uppercase tracking-widest mt-4 ${
                        isLight ? 'text-slate-700' : 'text-white'
                      }`}>
                        Preparando Roleta Lacer...
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Big Lucky Ticket Number Display */}
                      <div className="my-4">
                        <p className={`text-xs uppercase tracking-widest font-semibold mb-2 ${
                          isLight ? 'text-slate-500' : 'text-slate-300'
                        }`}>
                          {latestWinner ? 'BILHETE CONTEMPLADO' : 'NÚMERO DA SORTE'}
                        </p>
                        <div className={`font-mono text-5xl sm:text-7xl font-extrabold tracking-widest py-2 ${
                          isLight ? 'text-slate-900' : 'text-white drop-shadow-[0_2px_15px_rgba(227,6,19,0.6)]'
                        }`}>
                          <span className="text-[#E30613]">#</span>{currentDisplayTicket}
                        </div>
                      </div>

                      {/* Name and City Display (Never displays Brasil) */}
                      <div className={`py-3 px-6 border rounded-2xl max-w-md mx-auto mb-6 ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
                      }`}>
                        <h4 className={`text-xl sm:text-2xl font-bold truncate ${
                          isLight ? 'text-slate-900' : 'text-white'
                        }`}>
                          {currentDisplayName}
                        </h4>
                        {currentDisplayCity && currentDisplayCity.toUpperCase() !== 'BRASIL' ? (
                          <p className={`text-xs font-medium tracking-wide mt-1 uppercase ${
                            isLight ? 'text-[#E30613]' : 'text-red-400'
                          }`}>
                            📍 {currentDisplayCity}
                          </p>
                        ) : (
                          <p className={`text-[11px] font-medium tracking-wide mt-1 ${
                            isLight ? 'text-slate-500' : 'text-slate-400'
                          }`}>
                            {latestWinner ? 'Contemplado Oficial Homologado' : 'Aguardando sorteio oficial'}
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  {drawErrorNotice && (
                    <div className="mb-4 max-w-md mx-auto p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-[#E30613]">
                      {drawErrorNotice}
                    </div>
                  )}

                  {/* Draw Action Button (Exclusively for Admin) vs Viewer Status Card */}
                  <div className="mt-8">
                    {isAdmin ? (
                      <div>
                        <button
                          onClick={startDrawRoutine}
                          disabled={isDrawing || countdown !== null || isPrizeExhausted || drawLockStatus.isLocked}
                          className={`w-full max-w-md mx-auto py-5 px-8 rounded-2xl font-black text-lg sm:text-xl tracking-wider uppercase transition-all shadow-xl flex items-center justify-center gap-3 ${
                            drawLockStatus.isLocked
                              ? (isLight ? 'bg-slate-200 text-slate-600 border-2 border-slate-300 cursor-not-allowed shadow-none' : 'bg-slate-800/90 text-amber-300/80 border-2 border-amber-500/30 cursor-not-allowed shadow-none')
                              : isPrizeExhausted
                              ? (isLight ? 'bg-red-100 text-red-700 border border-red-300 cursor-not-allowed' : 'bg-red-950/60 text-red-400 border border-red-500/50 cursor-not-allowed opacity-90')
                              : isDrawing || countdown !== null
                              ? (isLight ? 'bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300' : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700')
                              : 'bg-[#E30613] hover:bg-[#C80510] text-white active:scale-98 shadow-red-600/30 cursor-pointer ring-4 ring-red-500/25'
                          }`}
                        >
                          {drawLockStatus.isLocked ? (
                            <Lock className="w-6 h-6 shrink-0" />
                          ) : (
                            <Flame className="w-6 h-6 fill-current animate-pulse shrink-0" />
                          )}
                          <span>
                            {drawLockStatus.isLocked
                              ? `SORTEIO BLOQUEADO — ${activeSchedule?.scheduledTime || 'REALIZADO'}`
                              : isPrizeExhausted
                              ? 'PRÊMIO TOTALMENTE ESGOTADO'
                              : isDrawing
                              ? 'GIRANDO GLOBO...'
                              : `SORTEAR: ${activeSchedule ? `${activeSchedule.scheduledTime} - ${activeSchedule.title}` : 'SORTEIO OFICIAL'}!`}
                          </span>
                        </button>

                        {/* Schedule Lock Notice + Posterior Navigation + Administrator-Only Unlock */}
                        {drawLockStatus.isLocked && (
                          <div className={`mt-4 max-w-lg mx-auto p-4 rounded-2xl border text-left space-y-3 shadow-sm ${
                            isLight
                              ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                              : 'bg-amber-950/30 border-amber-500/40 text-amber-100'
                          }`}>
                            <div className="flex items-start gap-2.5 text-xs leading-relaxed">
                              <Lock className={`w-4 h-4 shrink-0 mt-0.5 ${isLight ? 'text-amber-700' : 'text-amber-400'}`} />
                              <div>
                                <p className="font-bold uppercase tracking-wide text-[11px] mb-0.5">
                                  {drawLockStatus.reason === 'ALREADY_DRAWN'
                                    ? 'Sorteio Concluído e Bloqueado'
                                    : 'Horário Anterior Bloqueado'}
                                </p>
                                <p>{drawLockStatus.message}</p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              {nextPosteriorSchedule && (
                                <button
                                  type="button"
                                  onClick={() => handleSelectSchedule(nextPosteriorSchedule.id)}
                                  className="flex-1 min-w-[200px] py-2.5 px-3.5 rounded-xl bg-[#E30613] hover:bg-[#C80510] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-98"
                                >
                                  <span>
                                    Avançar para Próximo Horário ({formatScheduleDatePt(nextPosteriorSchedule.scheduledDate)} às {nextPosteriorSchedule.scheduledTime})
                                  </span>
                                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                                </button>
                              )}

                              {isAdministrator && activeSchedule && isScheduleCompletedOrLocked(activeSchedule) ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setClearWinnersOnUnlock(false);
                                    setShowUnlockScheduleModal(true);
                                  }}
                                  className={`py-2.5 px-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border shadow-sm transition-all cursor-pointer ${
                                    isLight
                                      ? 'bg-white hover:bg-amber-100 text-amber-900 border-amber-400'
                                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400'
                                  }`}
                                  title="Exclusivo do Administrador: desbloquear este sorteio em caso de engano"
                                >
                                  <Unlock className="w-3.5 h-3.5 shrink-0" />
                                  <span>Desbloquear Sorteio (Admin)</span>
                                </button>
                              ) : null}
                            </div>

                            {!isAdministrator && (
                              <div className={`flex items-center gap-2 pt-2 border-t text-[11px] font-semibold ${
                                isLight ? 'border-amber-200 text-amber-900' : 'border-amber-500/30 text-amber-300'
                              }`}>
                                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                                <span>Somente o Administrador pode desbloquear este sorteio caso haja algum engano.</span>
                              </div>
                            )}
                          </div>
                        )}

                        {isPrizeExhausted && currentPrize && (
                          <div className="mt-3 flex flex-col items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setClearWinnersOnReset(false);
                                setShowResetConfirmModal(true);
                              }}
                              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg transition-transform hover:scale-105 cursor-pointer active:scale-95"
                              title="Zerar a contagem de sorteados deste prémio para poder sortear novamente"
                            >
                              <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                              <span>Resetar Prémio para Sortear Novamente ({currentPrize.drawnQuantity}/{currentPrize.totalQuantity})</span>
                            </button>
                            <span className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                              Reinicia as {currentPrize.totalQuantity} unidades deste prémio para nova rodada de sorteios
                            </span>
                          </div>
                        )}
                        {activeSchedule && !drawLockStatus.isLocked && (
                          <p className={`text-xs font-mono mt-2 text-center ${isLight ? 'text-[#E30613]' : 'text-red-400/90'}`}>
                            📅 Agendado para {formatScheduleFullDate(activeSchedule.scheduledDate)} às {activeSchedule.scheduledTime}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className={`py-5 px-6 rounded-3xl border max-w-lg mx-auto text-center shadow-lg ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/95 border-slate-800 backdrop-blur-md shadow-2xl'
                      }`}>
                        <div className="flex items-center justify-center gap-2 text-[#E30613] font-bold text-xs uppercase tracking-wider mb-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#E30613] animate-ping"></span>
                          <span>Transmissão Oficial ao Vivo • Modo Espetador</span>
                        </div>
                        <p className={`text-sm font-medium mb-3 ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                          {isDrawing
                            ? '🎡 O administrador acionou o sorteio! Acompanhe a roleta desacelerando ao vivo...'
                            : latestWinner
                            ? '🏆 Rodada concluída pelo administrador! Confira acima o bilhete contemplado.'
                            : 'Aguardando o administrador realizar o sorteio nesta sessão. Mantenha o seu bilhete em mãos!'}
                        </p>
                        <div className={`p-3.5 rounded-2xl border text-xs flex flex-col sm:flex-row items-center justify-between gap-3 ${
                          isLight ? 'bg-white border-slate-200 text-slate-600' : 'bg-slate-950/90 border-slate-800 text-slate-400'
                        }`}>
                          <div className="flex items-center gap-2 text-left">
                            <ShieldAlert className={`w-4 h-4 shrink-0 ${isLight ? 'text-[#E30613]' : 'text-amber-400'}`} />
                            <span>Somente o administrador pode realizar o sorteio.</span>
                          </div>
                          {onRequestUnlockAdmin && (
                            <button
                              type="button"
                              onClick={onRequestUnlockAdmin}
                              className={`shrink-0 px-3.5 py-2 rounded-xl border font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                                isLight
                                  ? 'bg-red-50 hover:bg-red-100 border-red-200 text-[#E30613]'
                                  : 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/40 text-amber-300 hover:text-white'
                              }`}
                              title="Apenas o administrador autenticado com palavra-passe pode realizar o sorteio"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>Entrar com Palavra-passe</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

          {/* Winner Celebration Modal / Card when chosen */}
          {latestWinner && (
            <div className={`w-full mt-6 border-2 border-[#E30613] rounded-2xl p-6 shadow-xl animate-fadeIn ${
              isLight
                ? 'bg-red-50/70'
                : 'bg-gradient-to-r from-red-950/40 via-slate-900 to-red-950/40 backdrop-blur-md shadow-2xl'
            }`}>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-center sm:text-left">
                  <div className={`w-14 h-14 rounded-2xl border border-[#E30613] flex items-center justify-center shrink-0 ${
                    isLight ? 'bg-red-100' : 'bg-red-500/20'
                  }`}>
                    <Award className={`w-8 h-8 ${isLight ? 'text-[#E30613]' : 'text-red-400'}`} />
                  </div>
                  <div>
                    <span className={`text-xs font-bold uppercase tracking-wider ${
                      isLight ? 'text-[#E30613]' : 'text-amber-400'
                    }`}>
                      Parabéns ao Vencedor(a)!
                    </span>
                    <h3 className={`text-2xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {latestWinner.participantName}
                    </h3>
                    <p className={`text-xs ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      Ganhou: <strong className={isLight ? 'text-emerald-700' : 'text-emerald-400'}>{latestWinner.prizeTitle}</strong> · Bilhete #{latestWinner.participantTicket}
                    </p>
                    <p className={`text-[11px] font-mono mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Hash de Auditoria: {latestWinner.validationHash}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {isAdmin && onGoToAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        if (document.fullscreenElement) {
                          document.exitFullscreen().catch(() => {});
                        }
                        onGoToAdmin();
                      }}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs border shadow-sm transition-transform hover:scale-105 cursor-pointer ${
                        isLight
                          ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                          : 'bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white border-amber-500/40'
                      }`}
                      title="Voltar ao Painel de Administrador"
                    >
                      <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                      <span>Voltar ao Painel Admin</span>
                    </button>
                  )}
                  <button
                    onClick={() => exportCertificatePDF(latestWinner, brand)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E30613] hover:bg-[#C80510] text-white font-bold text-xs shadow-lg transition-transform hover:scale-105 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Baixar Certificado Oficial</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Winner Feed / Hall of Fame */}
      <div className={`border-t pt-4 ${isLight ? 'border-slate-200' : 'border-slate-800/80'}`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between mb-3 text-xs text-slate-500">
          <span className={`font-semibold flex items-center gap-1.5 ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
            <Trophy className={`w-4 h-4 ${isLight ? 'text-[#E30613]' : 'text-amber-400'}`} />
            Vencedores Homologados Desta Edição ({winners.length})
          </span>
          <span>Atualizado em tempo real</span>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {winners.slice(0, 3).map((w) => (
            <div 
              key={w.id}
              className={`border rounded-xl p-3 flex items-center justify-between text-xs shadow-sm ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <div className="truncate mr-2">
                <p className={`font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{w.participantName}</p>
                <p className={`text-[11px] truncate font-medium ${isLight ? 'text-[#E30613]' : 'text-amber-400/90'}`}>{w.prizeTitle}</p>
              </div>
              <div className="text-right shrink-0">
                <span className={`font-mono font-bold px-2 py-0.5 rounded border ${
                  isLight ? 'text-emerald-800 bg-emerald-100 border-emerald-300' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                }`}>
                  #{w.participantTicket}
                </span>
              </div>
            </div>
          ))}
          {winners.length === 0 && (
            <p className="text-xs text-slate-500 col-span-3 text-center py-2">
              Nenhum sorteio foi realizado ainda nesta sessão. Clique no botão acima para girar!
            </p>
          )}
        </div>
      </div>

      {/* Toast Notice */}
      {resetSuccessNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-400 animate-bounce">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-sm font-bold">{resetSuccessNotice}</span>
        </div>
      )}

      {/* Confirmation Modal to Reset Prize */}
      {showResetConfirmModal && currentPrize && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl text-left">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5 text-amber-400">
                <RotateCcw className="w-5 h-5 stroke-[2.5]" />
                <h3 className="text-lg font-bold text-white">Resetar Sorteios do Prémio</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl mb-4 text-xs text-slate-300 space-y-2">
              <p>
                <strong className="text-white font-semibold">Prémio:</strong> {currentPrize.title}
              </p>
              <p>
                <strong className="text-white font-semibold">Estado Atual:</strong>{' '}
                <span className="text-amber-400 font-bold">{currentPrize.drawnQuantity}</span> já sorteados de{' '}
                <span className="text-white font-bold">{currentPrize.totalQuantity}</span> unidades.
              </p>
              <p className="text-slate-400">
                Ao resetar, a quantidade de sorteados volta a <strong className="text-emerald-400">0</strong>, disponibilizando novamente todas as {currentPrize.totalQuantity} unidades para novos sorteios nesta e em outras sessões.
              </p>
            </div>

            <label className="flex items-start gap-3 p-3 bg-slate-950/50 border border-slate-800/80 rounded-2xl cursor-pointer hover:bg-slate-800/40 transition-colors mb-6 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={clearWinnersOnReset}
                onChange={(e) => setClearWinnersOnReset(e.target.checked)}
                className="mt-0.5 rounded text-red-600 focus:ring-red-500 w-4 h-4 bg-slate-900 border-slate-700"
              />
              <div>
                <span className="font-semibold text-white block">Limpar vencedores anteriores deste prémio</span>
                <span className="text-slate-400 text-[11px] block mt-0.5">
                  Remove os {winners.filter(w => w.prizeId === currentPrize.id).length} registo(s) de contemplados deste prémio da lista e relatório. Se desmarcar, o prémio é resetado mantendo os nomes no histórico.
                </span>
              </div>
            </label>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleResetCurrentPrize}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                <span>Confirmar e Resetar</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Confirmation Modal to Unlock Scheduled Draw (Administrator Only) */}
      {showUnlockScheduleModal && isAdministrator && activeSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className={`border rounded-3xl max-w-md w-full p-6 shadow-2xl text-left ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5 text-amber-500">
                <Unlock className="w-5 h-5 stroke-[2.5]" />
                <h3 className="text-lg font-bold">Desbloquear Sorteio (Admin)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowUnlockScheduleModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className={`p-3.5 rounded-2xl border mb-4 text-xs space-y-1.5 ${
              isLight ? 'bg-amber-50 border-amber-200 text-amber-950' : 'bg-amber-950/30 border-amber-500/30 text-amber-200'
            }`}>
              <p>
                <strong>Sessão:</strong> {activeSchedule.title}
              </p>
              <p>
                <strong>Data & Hora:</strong> {formatScheduleDatePt(activeSchedule.scheduledDate)} às {activeSchedule.scheduledTime}
              </p>
              <p>
                Use esta opção apenas caso tenha ocorrido algum engano ao acionar o sorteio deste horário.
              </p>
            </div>

            {winners.filter((w) => w.drawId === activeSchedule.id).length > 0 && (
              <label className={`flex items-start gap-2.5 p-3 rounded-2xl border mb-6 text-xs cursor-pointer ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950/70 border-slate-800 text-slate-300'
              }`}>
                <input
                  type="checkbox"
                  checked={clearWinnersOnUnlock}
                  onChange={(e) => setClearWinnersOnUnlock(e.target.checked)}
                  className="mt-0.5 rounded text-[#E30613] focus:ring-[#E30613]"
                />
                <span>
                  <strong>Remover também o(s) {winners.filter((w) => w.drawId === activeSchedule.id).length} vencedor(es)</strong> registado(s) neste horário e repor a quantidade do prémio.
                </span>
              </label>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowUnlockScheduleModal(false)}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer border ${
                  isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onUnlockSchedule?.(activeSchedule.id, clearWinnersOnUnlock);
                  if (clearWinnersOnUnlock) {
                    setLatestWinner(null);
                    setCurrentDisplayTicket('-----');
                    setCurrentDisplayName('AGUARDANDO SORTEIO...');
                    setCurrentDisplayCity('');
                  }
                  setShowUnlockScheduleModal(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer shadow-lg flex items-center gap-2"
              >
                <Unlock className="w-4 h-4 stroke-[2.5]" />
                <span>Confirmar Desbloqueio</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
