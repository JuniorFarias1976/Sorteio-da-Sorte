import React, { useState } from 'react';
import { DrawSchedule, Prize } from '../../types';
import { Calendar as CalendarIcon, Clock, Plus, Trash2, Tv, CheckCircle2, AlertCircle } from 'lucide-react';

interface CalendarTabProps {
  schedules: DrawSchedule[];
  prizes: Prize[];
  onUpdateSchedules: (schedules: DrawSchedule[]) => void;
  onGoToLive: () => void;
}

export const CalendarTab: React.FC<CalendarTabProps> = ({
  schedules,
  prizes,
  onUpdateSchedules,
  onGoToLive,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledDate, setScheduledDate] = useState(new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10));
  const [scheduledTime, setScheduledTime] = useState('20:00');
  const [selectedPrizeIds, setSelectedPrizeIds] = useState<string[]>([]);

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !scheduledDate || !scheduledTime) {
      alert('Preencha título, data e horário do sorteio.');
      return;
    }

    const newSchedule: DrawSchedule = {
      id: `sched-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      scheduledDate,
      scheduledTime,
      status: 'scheduled',
      prizeIds: selectedPrizeIds.length > 0 ? selectedPrizeIds : prizes.map((p) => p.id),
      createdAt: new Date().toISOString(),
    };

    onUpdateSchedules([...schedules, newSchedule]);
    setShowModal(false);
    setTitle('');
    setDescription('');
    setSelectedPrizeIds([]);
  };

  const handleDeleteSchedule = (id: string) => {
    if (confirm('Deseja excluir este agendamento de sorteio?')) {
      onUpdateSchedules(schedules.filter((s) => s.id !== id));
    }
  };

  const handleToggleStatus = (id: string, currentStatus: DrawSchedule['status']) => {
    const nextStatus: DrawSchedule['status'] =
      currentStatus === 'scheduled' ? 'live' : currentStatus === 'live' ? 'completed' : 'scheduled';

    const updated = schedules.map((s) => (s.id === id ? { ...s, status: nextStatus } : s));
    onUpdateSchedules(updated);
  };

  const togglePrizeSelect = (prizeId: string) => {
    if (selectedPrizeIds.includes(prizeId)) {
      setSelectedPrizeIds(selectedPrizeIds.filter((id) => id !== prizeId));
    } else {
      setSelectedPrizeIds([...selectedPrizeIds, prizeId]);
    }
  };

  const handleCreate4DailyRounds = () => {
    const targetDate = prompt('Para qual data deseja agendar os 4 horários diários (AAAA-MM-DD)?', scheduledDate);
    if (!targetDate) return;

    const rounds = [
      { round: 1, time: '10:00', title: '1º Sorteio do Dia - Rodada Matutina' },
      { round: 2, time: '14:00', title: '2º Sorteio do Dia - Rodada da Tarde' },
      { round: 3, time: '18:00', title: '3º Sorteio do Dia - Rodada de Fim de Tarde' },
      { round: 4, time: '21:00', title: '4º Sorteio do Dia - Grande Rodada Nobre' },
    ];

    const newSchedules: DrawSchedule[] = rounds.map((r, i) => ({
      id: `sched-${Date.now()}-${i}`,
      title: `${r.title} (${r.time})`,
      description: `Rodada ${r.round} oficial do dia com distribuição dos prêmios cadastrados.`,
      scheduledDate: targetDate,
      scheduledTime: r.time,
      status: 'scheduled',
      roundNumber: r.round,
      roundLabel: `${r.round}ª Rodada - ${r.time}`,
      prizeIds: prizes.map(p => p.id),
      createdAt: new Date().toISOString(),
    }));

    onUpdateSchedules([...schedules, ...newSchedules]);
    alert(`4 horários (10:00, 14:00, 18:00 e 21:00) foram agendados com sucesso para ${targetDate}!`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-amber-400" />
            <span>Calendário de Sorteios & Horários ({schedules.length})</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Agende os 4 horários diários no mesmo dia (10h, 14h, 18h e 21h) e controle as datas das transmissões
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCreate4DailyRounds}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-xs font-bold shadow transition-colors"
            title="Criar automaticamente as 4 rodadas (10h, 14h, 18h e 21h) no mesmo dia"
          >
            <Clock className="w-4 h-4" />
            <span>+ 4 Horários no Mesmo Dia</span>
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Agendar Novo Horário</span>
          </button>
        </div>
      </div>

      {/* Schedules List */}
      <div className="space-y-4">
        {schedules.map((schedule) => {
          const scheduleDateTime = new Date(`${schedule.scheduledDate}T${schedule.scheduledTime}:00`);
          const isPast = scheduleDateTime.getTime() < Date.now();
          const assignedPrizes = prizes.filter((p) => schedule.prizeIds.includes(p.id));

          return (
            <div
              key={schedule.id}
              className={`bg-slate-900 border rounded-2xl p-5 transition-colors shadow-lg ${
                schedule.status === 'live'
                  ? 'border-red-500/60 bg-red-950/10'
                  : schedule.status === 'completed'
                  ? 'border-emerald-500/30'
                  : 'border-slate-800'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status Badge */}
                    {schedule.status === 'live' && (
                      <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-red-500 text-white animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-white"></span>
                        Transmissão Ao Vivo
                      </span>
                    )}
                    {schedule.status === 'scheduled' && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20">
                        <Clock className="w-3 h-3" />
                        Agendado
                      </span>
                    )}
                    {schedule.status === 'completed' && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        Concluído
                      </span>
                    )}

                    <span className="text-xs text-slate-500">•</span>
                    <span className="text-xs font-mono font-bold text-white flex items-center gap-1">
                      <CalendarIcon className="w-3.5 h-3.5 text-amber-400" />
                      {scheduleDateTime.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {schedule.scheduledTime}
                    </span>

                    {schedule.roundLabel && (
                      <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                        {schedule.roundLabel}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-white">
                    {schedule.title}
                  </h3>
                  <p className="text-xs text-slate-400 max-w-2xl">
                    {schedule.description || 'Sorteio oficial transmitido via Live com prêmios exclusivos.'}
                  </p>

                  {/* Associated Prizes */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-slate-400">Prêmios em disputa:</span>
                    {assignedPrizes.map((p) => (
                      <span
                        key={p.id}
                        className="text-[11px] bg-slate-800 text-slate-200 px-2 py-0.5 rounded-md border border-slate-700"
                      >
                        {p.title}
                      </span>
                    ))}
                    {assignedPrizes.length === 0 && (
                      <span className="text-[11px] text-slate-500 italic">Todos os prêmios ativos</span>
                    )}
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleStatus(schedule.id, schedule.status)}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                  >
                    Mudar Status
                  </button>

                  <button
                    onClick={onGoToLive}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow transition-transform hover:scale-105"
                  >
                    <Tv className="w-3.5 h-3.5" />
                    <span>Abrir na Live</span>
                  </button>

                  <button
                    onClick={() => handleDeleteSchedule(schedule.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Excluir Agendamento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {schedules.length === 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-500">
            Nenhum sorteio agendado no calendário. Clique em &quot;Agendar Novo Sorteio&quot; para definir uma data.
          </div>
        )}
      </div>

      {/* Modal: Agendar Sorteio */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-amber-400" />
              <span>Agendar Novo Sorteio</span>
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Defina o dia, horário e prêmios vinculados a este sorteio.
            </p>

            <form onSubmit={handleCreateSchedule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Título do Sorteio *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Super Live de Domingo - Edição Ouro"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Descrição do Evento
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Transmissão aberta para todos os inscritos com anúncio dos vencedores..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Data do Sorteio *
                  </label>
                  <input
                    type="date"
                    required
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Horário de Início *
                  </label>
                  <input
                    type="time"
                    required
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                  Prêmios Vinculados a este Sorteio:
                </label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto p-2 bg-slate-950 rounded-xl border border-slate-800">
                  {prizes.map((p) => {
                    const isChecked = selectedPrizeIds.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-900 cursor-pointer text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePrizeSelect(p.id)}
                          className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500"
                        />
                        <span className="text-white font-medium">{p.title}</span>
                        <span className="text-slate-500 ml-auto font-mono text-[11px]">
                          ({p.totalQuantity} unid.)
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow"
                >
                  Confirmar Agendamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
