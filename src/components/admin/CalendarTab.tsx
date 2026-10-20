import React, { useState } from 'react';
import { DrawSchedule, Prize, BrandConfig } from '../../types';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  Trash2, 
  Tv, 
  CheckCircle2, 
  AlertCircle, 
  Pencil, 
  X,
  Check,
  Sparkles
} from 'lucide-react';
import { isLightColor } from '../../utils/storage';

interface CalendarTabProps {
  schedules: DrawSchedule[];
  prizes: Prize[];
  onUpdateSchedules: (schedules: DrawSchedule[]) => void;
  onGoToLive: () => void;
  brand?: BrandConfig;
}

export const CalendarTab: React.FC<CalendarTabProps> = ({
  schedules,
  prizes,
  onUpdateSchedules,
  onGoToLive,
  brand,
}) => {
  const isLight = isLightColor(brand?.backgroundColor || '#FFFFFF');

  // Modal: Agendar Novo Sorteio
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledDate, setScheduledDate] = useState(new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10));
  const [scheduledTime, setScheduledTime] = useState('10:00');
  const [selectedPrizeIds, setSelectedPrizeIds] = useState<string[]>([]);
  const [roundLabel, setRoundLabel] = useState('');

  // Modal: Editar Sorteio Existente (Data e Horário)
  const [editingSchedule, setEditingSchedule] = useState<DrawSchedule | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editScheduledDate, setEditScheduledDate] = useState('');
  const [editScheduledTime, setEditScheduledTime] = useState('');
  const [editSelectedPrizeIds, setEditSelectedPrizeIds] = useState<string[]>([]);
  const [editRoundLabel, setEditRoundLabel] = useState('');
  const [editStatus, setEditStatus] = useState<DrawSchedule['status']>('scheduled');

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingSchedule, setDeletingSchedule] = useState<DrawSchedule | null>(null);

  // Abrir Modal de Edição com os valores atuais do sorteio
  const handleOpenEdit = (schedule: DrawSchedule) => {
    setEditingSchedule(schedule);
    setEditTitle(schedule.title);
    setEditDescription(schedule.description || '');
    setEditScheduledDate(schedule.scheduledDate);
    setEditScheduledTime(schedule.scheduledTime);
    setEditSelectedPrizeIds(schedule.prizeIds || []);
    setEditRoundLabel(schedule.roundLabel || '');
    setEditStatus(schedule.status || 'scheduled');
    setFormError(null);
  };

  // Salvar Alterações de Edição
  const handleSaveEditSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!editingSchedule) return;

    if (!editTitle.trim() || !editScheduledDate || !editScheduledTime) {
      setFormError('Por favor, preencha o título, a data e o horário do sorteio.');
      return;
    }

    const updatedSchedules = schedules.map((s) => {
      if (s.id === editingSchedule.id) {
        return {
          ...s,
          title: editTitle.trim(),
          description: editDescription.trim(),
          scheduledDate: editScheduledDate,
          scheduledTime: editScheduledTime,
          roundLabel: editRoundLabel.trim() || s.roundLabel,
          status: editStatus,
          prizeIds: editSelectedPrizeIds.length > 0 ? editSelectedPrizeIds : s.prizeIds,
        };
      }
      return s;
    });

    onUpdateSchedules(updatedSchedules);
    setEditingSchedule(null);
    setToastMessage(`Sorteio "${editTitle.trim()}" atualizado com sucesso para ${editScheduledDate} às ${editScheduledTime}!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Criar Novo Agendamento
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
      roundLabel: roundLabel.trim() || undefined,
      status: 'scheduled',
      prizeIds: selectedPrizeIds.length > 0 ? selectedPrizeIds : prizes.map((p) => p.id),
      createdAt: new Date().toISOString(),
    };

    onUpdateSchedules([...schedules, newSchedule]);
    setShowModal(false);
    setTitle('');
    setDescription('');
    setRoundLabel('');
    setSelectedPrizeIds([]);
    setToastMessage(`Sorteio "${newSchedule.title}" agendado e guardado com sucesso!`);
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

  const toggleEditPrizeSelect = (prizeId: string) => {
    if (editSelectedPrizeIds.includes(prizeId)) {
      setEditSelectedPrizeIds(editSelectedPrizeIds.filter((id) => id !== prizeId));
    } else {
      setEditSelectedPrizeIds([...editSelectedPrizeIds, prizeId]);
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
      title: `${r.title}`,
      description: `Ronda ${r.round} oficial do dia (${r.time}) com distribuição de prémios Lacer.`,
      scheduledDate: targetDate,
      scheduledTime: r.time,
      status: 'scheduled',
      roundNumber: r.round,
      roundLabel: `${r.round}ª Ronda - ${r.time}`,
      prizeIds: prizes.map(p => p.id),
      createdAt: new Date().toISOString(),
    }));

    onUpdateSchedules([...schedules, ...newSchedules]);
    setToastMessage(`2 sorteios oficiais (10:00 e 16:00) foram agendados e guardados para ${targetDate}!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 p-4 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-600 hover:text-emerald-800 p-1 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Top Banner */}
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl border shadow-sm transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-[#E30613]" />
            <span>Calendário de Sorteios & Horários ({schedules.length})</span>
          </h2>
          <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
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
          const assignedPrizes = prizes.filter((p) => schedule.prizeIds.includes(p.id));

          return (
            <div
              key={schedule.id}
              className={`border rounded-2xl p-5 transition-all shadow-sm ${
                schedule.status === 'live'
                  ? isLight ? 'border-red-400 bg-red-50/50 ring-2 ring-red-500/10' : 'border-red-500/60 bg-red-950/10'
                  : schedule.status === 'completed'
                  ? isLight ? 'border-emerald-200 bg-emerald-50/20' : 'border-emerald-500/30 bg-slate-900'
                  : isLight ? 'border-slate-200 bg-white hover:border-slate-300' : 'border-slate-800 bg-slate-900'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status Badge */}
                    {schedule.status === 'live' && (
                      <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#E30613] text-white animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-white"></span>
                        Transmissão Ao Vivo
                      </span>
                    )}
                    {schedule.status === 'scheduled' && (
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold text-[#E30613] bg-red-50 border border-red-200">
                        <Clock className="w-3 h-3 text-[#E30613]" />
                        Agendado
                      </span>
                    )}
                    {schedule.status === 'completed' && (
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Concluído
                      </span>
                    )}

                    <span className={`text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>•</span>
                    
                    {/* Data formatada */}
                    <span className={`text-xs font-mono font-bold flex items-center gap-1 ${isLight ? 'text-slate-800' : 'text-white'}`}>
                      <CalendarIcon className="w-3.5 h-3.5 text-[#E30613]" />
                      {scheduleDateTime.toLocaleDateString('pt-PT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>

                    {/* Horário */}
                    <span className="text-xs font-mono font-bold text-[#E30613] flex items-center gap-1 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                      <Clock className="w-3.5 h-3.5" />
                      {schedule.scheduledTime}
                    </span>

                    {schedule.roundLabel && (
                      <span className="text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                        {schedule.roundLabel}
                      </span>
                    )}
                  </div>

                  <h3 className={`text-lg font-bold ${isLight ? 'text-slate-950' : 'text-white'}`}>
                    {schedule.title}
                  </h3>
                  <p className={`text-xs max-w-2xl ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    {schedule.description || 'Sorteio oficial transmitido em direto com prémios exclusivos.'}
                  </p>

                  {/* Associated Prizes */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Prémios em disputa:</span>
                    {assignedPrizes.map((p) => (
                      <span
                        key={p.id}
                        className={`text-[11px] px-2 py-0.5 rounded-md border font-medium ${
                          isLight 
                            ? 'bg-slate-100 text-slate-800 border-slate-200' 
                            : 'bg-slate-800 text-slate-200 border-slate-700'
                        }`}
                      >
                        {p.title}
                      </span>
                    ))}
                    {assignedPrizes.length === 0 && (
                      <span className={`text-[11px] italic ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Todos os prémios ativos</span>
                    )}
                  </div>
                </div>

                {/* Right Actions (Highlighted button to edit dates and times) */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {/* BOTÃO PARA EDITAR AS DATAS E HORAS DO SORTEIO */}
                  <button
                    onClick={() => handleOpenEdit(schedule)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer border ${
                      isLight 
                        ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300 hover:border-amber-400' 
                        : 'bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border-amber-600/40'
                    }`}
                    title="Editar a data, hora de início, título ou prémios deste sorteio"
                  >
                    <Pencil className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Editar Data/Hora</span>
                  </button>

                  <button
                    onClick={() => handleToggleStatus(schedule.id, schedule.status)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                      isLight 
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' 
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    Mudar Status
                  </button>

                  <button
                    onClick={onGoToLive}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#E30613] hover:bg-[#C80510] text-white text-xs font-bold shadow transition-transform hover:scale-105 cursor-pointer"
                  >
                    <Tv className="w-3.5 h-3.5" />
                    <span>Abrir na Live</span>
                  </button>

                  <button
                    onClick={() => setDeletingSchedule(schedule)}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
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
          <div className={`border rounded-2xl p-8 text-center text-sm ${
            isLight ? 'bg-white border-slate-200 text-slate-500' : 'bg-slate-900 border-slate-800 text-slate-400'
          }`}>
            Nenhum sorteio agendado no calendário. Clique em &quot;Agendar Novo Horário&quot; para definir uma data.
          </div>
        )}
      </div>

      {/* Modal: EDITAR Data e Horário do Sorteio */}
      {editingSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className={`border rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200 ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 text-amber-600">
                  <Pencil className="w-5 h-5" />
                </div>
                <span>Editar Data & Horário do Sorteio</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingSchedule(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className={`text-xs mb-5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Atualize a data do evento, a hora de início e os detalhes associados ao sorteio.
            </p>

            {formError && (
              <div className="bg-red-500/15 border border-red-500/30 text-[#E30613] p-3 rounded-xl mb-4 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[#E30613] shrink-0 mt-0.5" />
                <span className="flex-1">{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditSchedule} className="space-y-4" autoComplete="off">
              {/* Data e Hora em destaque */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1 flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-[#E30613]" />
                    <span>Data do Sorteio *</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={editScheduledDate}
                    onChange={(e) => setEditScheduledDate(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#E30613] ${
                      isLight 
                        ? 'bg-white border border-slate-300 text-slate-900 focus:border-[#E30613]' 
                        : 'bg-slate-900 border border-slate-700 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#E30613]" />
                    <span>Horário de Início *</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={editScheduledTime}
                    onChange={(e) => setEditScheduledTime(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2 text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-[#E30613] ${
                      isLight 
                        ? 'bg-white border border-slate-300 text-slate-900 focus:border-[#E30613]' 
                        : 'bg-slate-900 border border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Título do Sorteio *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Ex: Sorteio Manhã ou Sorteio Tarde"
                  className={`w-full rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#E30613] ${
                    isLight 
                      ? 'bg-white border border-slate-300 text-slate-900 focus:border-[#E30613]' 
                      : 'bg-slate-950 border border-slate-700 text-white'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Etiqueta da Ronda
                  </label>
                  <input
                    type="text"
                    value={editRoundLabel}
                    onChange={(e) => setEditRoundLabel(e.target.value)}
                    placeholder="Ex: 1ª Ronda - 10:00"
                    className={`w-full rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#E30613] ${
                      isLight 
                        ? 'bg-white border border-slate-300 text-slate-900 focus:border-[#E30613]' 
                        : 'bg-slate-950 border border-slate-700 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Estado do Sorteio
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as DrawSchedule['status'])}
                    className={`w-full rounded-xl px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-[#E30613] ${
                      isLight 
                        ? 'bg-white border border-slate-300 text-slate-900' 
                        : 'bg-slate-950 border border-slate-700 text-white'
                    }`}
                  >
                    <option value="scheduled">Agendado</option>
                    <option value="live">Transmissão Ao Vivo (Live)</option>
                    <option value="completed">Concluído</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Descrição do Evento
                </label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Informações adicionais para os participantes"
                  className={`w-full rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#E30613] ${
                    isLight 
                      ? 'bg-white border border-slate-300 text-slate-900' 
                      : 'bg-slate-950 border border-slate-700 text-white'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                  Prémios Associados a este Sorteio:
                </label>
                <div className={`space-y-1.5 max-h-36 overflow-y-auto p-2 rounded-xl border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}>
                  {prizes.map((p) => {
                    const isChecked = editSelectedPrizeIds.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer text-xs ${
                          isLight ? 'hover:bg-slate-200/60 text-slate-800' : 'hover:bg-slate-900 text-slate-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleEditPrizeSelect(p.id)}
                          className="rounded text-[#E30613] focus:ring-[#E30613]"
                        />
                        <span className="font-medium">{p.title}</span>
                        <span className="text-slate-500 ml-auto font-mono text-[11px]">
                          ({p.totalQuantity} unid.)
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingSchedule(null)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer border ${
                    isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'text-slate-400 hover:text-white border-slate-700'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#E30613] hover:bg-[#C80510] text-white text-xs font-bold shadow-lg shadow-red-500/25 flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Agendar Novo Sorteio */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className={`border rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <div className="p-2 rounded-xl bg-red-50 border border-red-200 text-[#E30613]">
                  <CalendarIcon className="w-5 h-5 text-[#E30613]" />
                </div>
                <span>Agendar Novo Sorteio</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className={`text-xs mb-5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Defina o dia, horário e prémios associados a este sorteio.
            </p>

            {formError && (
              <div className="bg-red-500/15 border border-red-500/30 text-[#E30613] p-3 rounded-xl mb-4 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[#E30613] shrink-0 mt-0.5" />
                <span className="flex-1">{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSchedule} className="space-y-4" autoComplete="off">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Título do Sorteio *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Sorteio Manhã (10:00)"
                  className={`w-full rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#E30613] ${
                    isLight 
                      ? 'bg-white border border-slate-300 text-slate-900 focus:border-[#E30613]' 
                      : 'bg-slate-950 border border-slate-700 text-white'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Descrição do Evento
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Informações para os participantes"
                  className={`w-full rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#E30613] ${
                    isLight 
                      ? 'bg-white border border-slate-300 text-slate-900' 
                      : 'bg-slate-950 border border-slate-700 text-white'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1 flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-[#E30613]" />
                    <span>Data do Sorteio *</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#E30613] ${
                      isLight 
                        ? 'bg-white border border-slate-300 text-slate-900' 
                        : 'bg-slate-900 border border-slate-700 text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#E30613]" />
                    <span>Horário de Início *</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2 text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-[#E30613] ${
                      isLight 
                        ? 'bg-white border border-slate-300 text-slate-900' 
                        : 'bg-slate-900 border border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Etiqueta da Ronda (Opcional)
                </label>
                <input
                  type="text"
                  value={roundLabel}
                  onChange={(e) => setRoundLabel(e.target.value)}
                  placeholder="Ex: 1ª Ronda - 10:00"
                  className={`w-full rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#E30613] ${
                    isLight 
                      ? 'bg-white border border-slate-300 text-slate-900' 
                      : 'bg-slate-950 border border-slate-700 text-white'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-2">
                  Prémios Associados a este Sorteio:
                </label>
                <div className={`space-y-1.5 max-h-36 overflow-y-auto p-2 rounded-xl border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}>
                  {prizes.map((p) => {
                    const isChecked = selectedPrizeIds.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer text-xs ${
                          isLight ? 'hover:bg-slate-200/60 text-slate-800' : 'hover:bg-slate-900 text-slate-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePrizeSelect(p.id)}
                          className="rounded text-[#E30613] focus:ring-[#E30613]"
                        />
                        <span className="font-medium">{p.title}</span>
                        <span className="text-slate-500 ml-auto font-mono text-[11px]">
                          ({p.totalQuantity} unid.)
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer border ${
                    isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'text-slate-400 hover:text-white border-slate-700'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#E30613] hover:bg-[#C80510] text-white text-xs font-bold shadow-lg shadow-red-500/25 cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Confirmar Agendamento</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Deletion */}
      {deletingSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className={`border rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5 text-red-600" />
              <span>Excluir Agendamento</span>
            </h3>
            <p className={`text-xs mb-6 leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              Tem certeza que deseja remover o agendamento <strong>{deletingSchedule.title}</strong> ({deletingSchedule.scheduledDate} às {deletingSchedule.scheduledTime}) da base de dados?
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingSchedule(null)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer border ${
                  isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'text-slate-400 hover:text-white border-slate-700'
                }`}
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
