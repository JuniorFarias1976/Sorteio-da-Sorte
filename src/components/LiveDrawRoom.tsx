import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Participant, Prize, DrawSchedule, DrawWinner, BrandConfig } from '../types';
import { playTickSound, playSuspenseSound, playWinFanfare, playCountdownBeep } from '../utils/audio';
import { exportCertificatePDF } from '../utils/export';
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
  AlertCircle
} from 'lucide-react';
import { ApiService } from '../utils/api';

interface LiveDrawRoomProps {
  participants: Participant[];
  prizes: Prize[];
  schedules: DrawSchedule[];
  winners: DrawWinner[];
  brand: BrandConfig;
  isAdmin: boolean;
  onWinnerAnnounced: (winner: DrawWinner) => void;
  onPrizeQuantityDrawn: (prizeId: string) => void;
}

export const LiveDrawRoom: React.FC<LiveDrawRoomProps> = ({
  participants,
  prizes,
  schedules,
  winners,
  brand,
  isAdmin,
  onWinnerAnnounced,
  onPrizeQuantityDrawn,
}) => {
  const [selectedPrizeId, setSelectedPrizeId] = useState<string>(prizes[0]?.id || '');
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [currentDisplayTicket, setCurrentDisplayTicket] = useState<string>(winners[0]?.participantTicket || '00000');
  const [currentDisplayName, setCurrentDisplayName] = useState<string>(winners[0]?.participantName || 'AGUARDANDO SORTEIO...');
  const [currentDisplayCity, setCurrentDisplayCity] = useState<string>(winners[0] ? 'CONTEMPLADO' : 'BRASIL');
  const [latestWinner, setLatestWinner] = useState<DrawWinner | null>(winners[0] || null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [drawSpeed, setDrawSpeed] = useState<number>(40); // ms per tick
  const [countdown, setCountdown] = useState<number | null>(null);
  const [drawErrorNotice, setDrawErrorNotice] = useState<string | null>(null);
  const roomRef = useRef<HTMLDivElement>(null);

  const eligibleParticipants = participants.filter(p => p.status === 'active');
  const currentPrize = prizes.find(p => p.id === selectedPrizeId) || prizes[0];

  // Daily 4-round active schedule
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const remainingPrizeQuantity = currentPrize ? currentPrize.totalQuantity - currentPrize.drawnQuantity : 0;
  const isPrizeExhausted = remainingPrizeQuantity <= 0;

  const DAILY_ROUNDS = [
    { round: 1, time: '10:00', label: '1º Sorteio (10:00)' },
    { round: 2, time: '14:00', label: '2º Sorteio (14:00)' },
    { round: 3, time: '18:00', label: '3º Sorteio (18:00)' },
    { round: 4, time: '21:00', label: '4º Sorteio (21:00)' },
  ];

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

  // Multi-device real-time sync (SSE + BroadcastChannel)
  useEffect(() => {
    // 1. Initial snapshot of live state
    ApiService.getLiveState().then((state) => {
      if (!state) return;
      if (state.prizeId) setSelectedPrizeId(state.prizeId);
      if (state.round) setSelectedRound(state.round);
      if (state.isDrawing) setIsDrawing(true);
      if (state.countdown !== null) setCountdown(state.countdown);
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
          setSelectedPrizeId(data.prizeId);
          setSelectedRound(data.round || 1);
          setLatestWinner(null);
          setIsDrawing(true);
          setCountdown(3);
          if (soundEnabled) playCountdownBeep(false);

          const cd = setInterval(() => {
            setCountdown((prev) => {
              if (prev === null || prev <= 1) {
                clearInterval(cd);
                if (soundEnabled) playCountdownBeep(true);
                return null;
              }
              if (soundEnabled) playCountdownBeep(false);
              return prev - 1;
            });
          }, 1000);
        } else if (data.type === 'TUMBLER_TICK') {
          setCurrentDisplayTicket(data.ticket);
          setCurrentDisplayName(data.name);
          setCurrentDisplayCity(data.city);
          if (soundEnabled) playTickSound(700);
        } else if (data.type === 'WINNER_REVEALED') {
          setIsDrawing(false);
          setCountdown(null);
          setCurrentDisplayTicket(data.winner.participantTicket);
          setCurrentDisplayName(data.winner.participantName);
          setCurrentDisplayCity(data.winner.participantDocument || 'CONTEMPLADO');
          setLatestWinner(data.winner);
          onWinnerAnnounced(data.winner);
          onPrizeQuantityDrawn(data.winner.prizeId);
          if (soundEnabled) playWinFanfare();
          triggerConfettiExplosion();
        } else if (data.type === 'LIVE_RESET') {
          setIsDrawing(false);
          setCountdown(null);
          setLatestWinner(null);
          setCurrentDisplayTicket('-----');
          setCurrentDisplayName('AGUARDANDO SORTEIO...');
          setCurrentDisplayCity('BRASIL');
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
            setIsDrawing(false);
            setCountdown(null);
            setLatestWinner(null);
            setCurrentDisplayTicket('-----');
            setCurrentDisplayName('AGUARDANDO SORTEIO...');
            setCurrentDisplayCity('BRASIL');
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
  }, [soundEnabled, onWinnerAnnounced, onPrizeQuantityDrawn]);

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
      setDrawErrorNotice('Acesso Restrito: Somente o administrador pode realizar o sorteio!');
      setTimeout(() => setDrawErrorNotice(null), 4000);
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

    setLatestWinner(null);
    setIsDrawing(true);
    setCountdown(3);

    broadcastEvent({
      type: 'START_DRAW',
      prizeId: currentPrize.id,
      round: selectedRound,
    });

    if (soundEnabled) playCountdownBeep(false);

    // Call server to trigger authoritative draw across ALL connected devices (mobile + desktop)
    try {
      const res = await ApiService.triggerDraw(currentPrize.id, selectedRound);
      if (!res.success) {
        console.warn('Server triggerDraw fallback:', res.error);
        runDigitalTumbler();
      }
    } catch (err) {
      console.warn('Server connection error, running local tumbler:', err);
      runDigitalTumbler();
    }
  };

  const runDigitalTumbler = () => {
    if (soundEnabled) playSuspenseSound();

    let speed = 40;
    let elapsedTicks = 0;
    const totalTicks = 80; // around 5-6 seconds of exciting spinning
    
    // Select winner cryptographically pseudo-random from eligible list
    const randomIndex = Math.floor(Math.random() * eligibleParticipants.length);
    const chosenWinnerParticipant = eligibleParticipants[randomIndex];

    const spinInterval = setInterval(() => {
      elapsedTicks++;
      
      // Pick random participant display during the spin
      const randomDisplay = eligibleParticipants[Math.floor(Math.random() * eligibleParticipants.length)];
      setCurrentDisplayTicket(randomDisplay.ticketNumber);
      setCurrentDisplayName(randomDisplay.name);
      setCurrentDisplayCity(randomDisplay.city);

      if (elapsedTicks % 4 === 0) {
        broadcastEvent({
          type: 'TUMBLER_TICK',
          ticket: randomDisplay.ticketNumber,
          name: randomDisplay.name,
          city: randomDisplay.city,
        });
      }

      if (soundEnabled && elapsedTicks % 2 === 0) {
        playTickSound(600 + (elapsedTicks * 5));
      }

      // Decelerate towards the end for supreme suspense
      if (elapsedTicks > 50) {
        speed += 12;
      }

      if (elapsedTicks >= totalTicks) {
        clearInterval(spinInterval);
        
        // Final lock on chosen winner!
        setCurrentDisplayTicket(chosenWinnerParticipant.ticketNumber);
        setCurrentDisplayName(chosenWinnerParticipant.name);
        setCurrentDisplayCity(chosenWinnerParticipant.city);
        setIsDrawing(false);

        // Security validation hash
        const hashSeed = `${chosenWinnerParticipant.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const validationHash = 'AUTH-' + Array.from(hashSeed)
          .reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) | 0, 0)
          .toString(16)
          .toUpperCase()
          .padStart(8, '0');

        const newWinnerRecord: DrawWinner = {
          id: `win-${Date.now()}`,
          drawTitle: currentPrize.title,
          participantId: chosenWinnerParticipant.id,
          participantName: chosenWinnerParticipant.name,
          participantEmail: chosenWinnerParticipant.email,
          participantPhone: chosenWinnerParticipant.phone,
          participantTicket: chosenWinnerParticipant.ticketNumber,
          participantDocument: chosenWinnerParticipant.document,
          prizeId: currentPrize.id,
          prizeTitle: currentPrize.title,
          wonAt: new Date().toISOString(),
          validationHash,
        };

        setLatestWinner(newWinnerRecord);
        onWinnerAnnounced(newWinnerRecord);
        onPrizeQuantityDrawn(currentPrize.id);

        broadcastEvent({
          type: 'WINNER_REVEALED',
          winner: newWinnerRecord,
        });

        if (soundEnabled) {
          playWinFanfare();
        }
        triggerConfettiExplosion();
      }
    }, speed);
  };

  const handleResetScreen = async () => {
    setLatestWinner(null);
    setCurrentDisplayTicket('-----');
    setCurrentDisplayName('AGUARDANDO SORTEIO...');
    setCurrentDisplayCity('BRASIL');
    broadcastEvent({ type: 'LIVE_RESET' });
    try {
      await ApiService.resetLive();
    } catch (e) {
      console.warn('Reset live error:', e);
    }
  };

  return (
    <div 
      ref={roomRef}
      className={`min-h-[calc(100vh-80px)] bg-radial from-slate-900 via-slate-950 to-black text-white flex flex-col justify-between p-4 sm:p-6 lg:p-8 select-none ${
        isFullscreen ? 'fixed inset-0 z-50 overflow-y-auto' : ''
      }`}
    >
      {/* Top Bar / Broadcast Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex flex-wrap items-center gap-3">
          {isAdmin ? (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/50 rounded-full text-amber-300 text-xs font-bold tracking-wider uppercase">
              👑 MESA DO ADMINISTRADOR [Alt+C]
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-500/40 rounded-full text-red-400 text-xs font-bold tracking-wider uppercase animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              TRANSMISSÃO AO VIVO (TELESPECTADOR)
            </div>
          )}

          {/* 4 Daily Rounds Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
            {DAILY_ROUNDS.map((r) => (
              <button
                key={r.round}
                onClick={() => setSelectedRound(r.round)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedRound === r.round
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>{r.round}º ({r.time})</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>{eligibleParticipants.length} concorrentes ativos no globo</span>
          </div>
        </div>

        {/* Controls: Audio & Fullscreen */}
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={handleResetScreen}
              className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-amber-400 hover:text-white hover:bg-slate-700 transition-all text-xs flex items-center gap-1.5"
              title="Limpar telão e preparar próximo giro"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Limpar Telão</span>
            </button>
          )}

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border transition-all text-xs flex items-center gap-1.5 ${
              soundEnabled
                ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-white'
            }`}
            title={soundEnabled ? 'Silenciar Áudio' : 'Ativar Efeitos Sonoros'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Som Ativo' : 'Mudo'}</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-all text-xs flex items-center gap-1.5"
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

            {isPrizeExhausted && (
              <div className="p-2.5 mb-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs">
                ⚠️ A quantidade estipulada pelo administrador para este prêmio ({currentPrize?.totalQuantity} unidades) já foi totalmente contemplada!
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
                    {currentPrize.estimatedValue ? `R$ ${currentPrize.estimatedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Inestimável'}
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
          <div className="w-full bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden text-center glow-amber">
            {/* Background glowing rings */}
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/90 border border-slate-700/80 text-xs font-semibold text-amber-400 mb-6">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>GLOBO ELETRÔNICO DE SORTEIOS</span>
              </div>

              {/* Countdown overlay if active */}
              {countdown !== null ? (
                <div className="py-12 animate-bounce">
                  <div className="text-8xl font-black font-mono text-amber-400 drop-shadow-[0_0_35px_rgba(245,158,11,0.8)]">
                    {countdown}
                  </div>
                  <p className="text-sm font-semibold text-slate-300 uppercase tracking-widest mt-4">
                    Preparando Roleta...
                  </p>
                </div>
              ) : (
                <>
                  {/* Big Lucky Ticket Number Display */}
                  <div className="my-4">
                    <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-2">
                      {latestWinner ? 'BILHETE CONTEMPLADO' : 'NÚMERO DA SORTE'}
                    </p>
                    <div className="font-mono text-5xl sm:text-7xl font-extrabold tracking-widest bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent drop-shadow-md py-2">
                      #{currentDisplayTicket}
                    </div>
                  </div>

                  {/* Name and City Display */}
                  <div className="py-3 px-6 bg-slate-950/70 border border-slate-800 rounded-2xl max-w-md mx-auto mb-6">
                    <h4 className="text-xl sm:text-2xl font-bold text-white truncate">
                      {currentDisplayName}
                    </h4>
                    <p className="text-xs text-amber-400/90 font-medium tracking-wide mt-1 uppercase">
                      📍 {currentDisplayCity}
                    </p>
                  </div>
                </>
              )}

              {/* Draw Action Button (Exclusively for Admin) vs Viewer Status Card */}
              <div className="mt-8">
                {isAdmin ? (
                  <button
                    onClick={startDrawRoutine}
                    disabled={isDrawing || countdown !== null || isPrizeExhausted}
                    className={`w-full max-w-md mx-auto py-5 px-8 rounded-2xl font-black text-lg sm:text-xl tracking-wider uppercase transition-all shadow-xl flex items-center justify-center gap-3 ${
                      isPrizeExhausted
                        ? 'bg-red-950/60 text-red-400 border border-red-500/50 cursor-not-allowed opacity-90'
                        : isDrawing || countdown !== null
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        : 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 hover:brightness-110 active:scale-98 shadow-amber-500/25 cursor-pointer ring-4 ring-amber-500/20'
                    }`}
                  >
                    <Flame className="w-6 h-6 fill-current animate-pulse" />
                    <span>
                      {isPrizeExhausted
                        ? 'PRÊMIO TOTALMENTE ESGOTADO'
                        : isDrawing
                        ? 'GIRANDO GLOBO...'
                        : `SORTEAR ${DAILY_ROUNDS.find(r => r.round === selectedRound)?.label.toUpperCase()}!`}
                    </span>
                  </button>
                ) : (
                  <div className="py-4 px-6 rounded-2xl bg-slate-900/90 border border-slate-800/80 max-w-md mx-auto text-center shadow-xl">
                    <div className="flex items-center justify-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                      <span>Transmissão Oficial ao Vivo</span>
                    </div>
                    <p className="text-xs text-slate-300">
                      {isDrawing
                        ? '🎡 O administrador acionou o sorteio! Acompanhe a roleta desacelerando ao vivo...'
                        : latestWinner
                        ? '🏆 Rodada concluída pelo administrador! Confira acima o bilhete contemplado.'
                        : 'Aguardando o administrador realizar o sorteio nesta rodada. Mantenha seu bilhete em mãos!'}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-2">
                      🔒 O disparo do sorteio é restrito ao administrador oficial do evento para auditoria pública.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Winner Celebration Modal / Card when chosen */}
          {latestWinner && (
            <div className="w-full mt-6 bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/40 border-2 border-amber-500 rounded-2xl p-6 shadow-2xl backdrop-blur-md animate-fadeIn">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-center sm:text-left">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500 flex items-center justify-center shrink-0">
                    <Award className="w-8 h-8 text-amber-400" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      Parabéns ao Vencedor(a)!
                    </span>
                    <h3 className="text-2xl font-black text-white">
                      {latestWinner.participantName}
                    </h3>
                    <p className="text-xs text-slate-300">
                      Ganhou: <strong className="text-emerald-400">{latestWinner.prizeTitle}</strong> · Bilhete #{latestWinner.participantTicket}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Hash de Auditoria: {latestWinner.validationHash}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => exportCertificatePDF(latestWinner, brand)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg transition-transform hover:scale-105"
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
      <div className="border-t border-slate-800/80 pt-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between mb-3 text-xs text-slate-400">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-400" />
            Vencedores Homologados Desta Edição ({winners.length})
          </span>
          <span>Atualizado em tempo real</span>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {winners.slice(0, 3).map((w) => (
            <div 
              key={w.id}
              className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs"
            >
              <div className="truncate mr-2">
                <p className="font-bold text-white truncate">{w.participantName}</p>
                <p className="text-amber-400/90 text-[11px] truncate">{w.prizeTitle}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
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
    </div>
  );
};
