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

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingSchedule, setDeletingSchedule] = useState<DrawSchedule | null>(null);

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!title.trim() || !scheduledDate || !scheduledTime) {
      setFormError('Por favor, preencha título, data e horário do sorteio.');
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
    setToastMessage(`Sorteio "${newSchedule.title}" agendado e salvo com sucesso no banco de dados!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleConfirmDelete = () => {
    if (!deletingSchedule) return;
    const targetId = deletingSchedule.id;
    onUpdateSchedules(schedules.filter((s) => s.id !== targetId));
    setDeletingSchedule(null);
    setToastMessage('Agendamento removido da base de dados.');
    setTimeout(() => setToastMessage(null), 3000);
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

  const handleCreate2DailyRounds = () => {
    const targetDate = prompt('Para qual data deseja agendar os 2 sorteios diários (AAAA-MM-DD)?', scheduledDate);
    if (!targetDate) return;

    const rounds = [
      { round: 1, time: '10:00', title: 'Sorteio Manhã' },
      { round: 2, time: '16:00', title: 'Sorteio Tarde' },
    ];

    const newSchedules: DrawSchedule[] = rounds.map((r, i) => ({
      id: `sched-${Date.now()}-${i}`,
      title: `${r.title} (${r.time})`,
      description: `Ronda ${r.round} oficial do dia (${r.time}) com distribuição de prémios.`,
      scheduledDate: targetDate,
      scheduledTime: r.time,
      status: 'scheduled',
      roundNumber: r.round,
      roundLabel: `${r.round}ª Ronda - ${r.time}`,
      prizeIds: prizes.map(p => p.id),
      createdAt: new Date().toISOString(),
    }));

    onUpdateSchedules([...schedules, ...newSchedules]);
    setToastMessage(`2 sorteios oficiais (10:00 e 16:00) foram agendados e salvos para ${targetDate}!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCreate4DailyRounds = () => {
    const targetDate = prompt('Para qual data deseja agendar os 4 horários diários (AAAA-MM-DD)?', scheduledDate);
    if (!targetDate) return;

    const rounds = [
      { round: 1, time: '10:00', title: '1º Sorteio do Dia - Ronda Matinal' },
      { round: 2, time: '14:00', title: '2º Sorteio do Dia - Ronda da Tarde' },
      { round: 3, time: '18:00', title: '3º Sorteio do Dia - Ronda de Fim de Tarde' },
      { round: 4, time: '21:00', title: '4º Sorteio do Dia - Grande Ronda da Noite' },
    ];

    const newSchedules: DrawSchedule[] = rounds.map((r, i) => ({
      id: `sched-${Date.now()}-${i}`,
      title: `${r.title} (${r.time})`,
      description: `Ronda ${r.round} oficial do dia com distribuição dos prémios registados.`,
      scheduledDate: targetDate,
      scheduledTime: r.time,
      status: 'scheduled',
      roundNumber: r.round,
      roundLabel: `${r.round}ª Ronda - ${r.time}`,
      prizeIds: prizes.map(p => p.id),
      createdAt: new Date().toISOString(),
    }));

    onUpdateSchedules([...schedules, ...newSchedules]);
    setToastMessage(`4 horários (10:00, 14:00, 18:00 e 21:00) foram agendados e guardados na base de dados para ${targetDate}!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 p-4 rounded-2xl flex items-center justify-between text-xs font-medium shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-400 hover:text-white p-1">
            ✕
          </button>
        </div>
      )}
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-[#E30613]" />
            <span>Calendário de Sorteios & Horários ({schedules.length})</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Agende os 2 sorteios diários (Manhã 10h e Tarde 16h) e controle as datas e horários com precisão
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCreate2DailyRounds}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-[#E30613] border border-red-200 text-xs font-bold shadow-sm transition-colors cursor-pointer"
            title="Criar rapidamente 2 sorteios (10:00 e 16:00) para uma data"
          >
            <Clock className="w-4 h-4 text-[#E30613]" />
            <span>+ 2 Sorteios Diários (10h & 16h)</span>
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E30613] hover:bg-[#C80510] text-white text-xs font-bold shadow-md shadow-red-600/30 transition-colors cursor-pointer"
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
                    {schedule.description || 'Sorteio oficial transmitido em direto com prémios exclusivos.'}
                  </p>

                  {/* Associated Prizes */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-slate-400">Prémios em disputa:</span>
                    {assignedPrizes.map((p) => (
                      <span
                        key={p.id}
                        className="text-[11px] bg-slate-800 text-slate-200 px-2 py-0.5 rounded-md border border-slate-700"
                      >
                        {p.title}
                      </span>
                    ))}
                    {assignedPrizes.length === 0 && (
                      <span className="text-[11px] text-slate-500 italic">Todos os prémios ativos</span>
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
                    onClick={() => setDeletingSchedule(schedule)}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
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
              Defina o dia, horário e prémios associados a este sorteio.
            </p>

            {/* Error Message inside modal */}
            {formError && (
              <div className="bg-red-500/15 border border-red-500/30 text-red-300 p-3 rounded-xl mb-4 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="flex-1">{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSchedule} className="space-y-4" autoComplete="off">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Título do Sorteio *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder=""
                  autoComplete="off"
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
                  placeholder=""
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
                  Prémios Associados a este Sorteio:
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
      {/* Modal: Confirm Deletion */}
      {deletingSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-400" />
              <span>Excluir Agendamento</span>
            </h3>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              Tem certeza que deseja remover o agendamento <strong>{deletingSchedule.title}</strong> ({deletingSchedule.scheduledDate} às {deletingSchedule.scheduledTime}) da base de dados?
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingSchedule(null)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
