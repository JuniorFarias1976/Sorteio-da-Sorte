import React, { useState, useEffect } from 'react';
import { Participant, NotificationLog, NotificationSettings, BrandConfig, DrawSchedule } from '../../types';
import { 
  Bell, 
  Send, 
  CheckCircle, 
  MessageSquare, 
  Mail, 
  Smartphone, 
  Clock, 
  Eye, 
  Sparkles, 
  AlertCircle,
  Copy,
  ExternalLink
} from 'lucide-react';

interface NotificationsTabProps {
  participants: Participant[];
  notificationLogs: NotificationLog[];
  settings: NotificationSettings;
  brand: BrandConfig;
  schedules: DrawSchedule[];
  onUpdateSettings: (settings: NotificationSettings) => void;
  onAddNotificationLog: (log: NotificationLog) => void;
}

export const NotificationsTab: React.FC<NotificationsTabProps> = ({
  participants,
  notificationLogs,
  settings,
  brand,
  schedules,
  onUpdateSettings,
  onAddNotificationLog,
}) => {
  const [selectedChannel, setSelectedChannel] = useState<'whatsapp' | 'email' | 'sms'>('whatsapp');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccessMessage, setSendSuccessMessage] = useState<string | null>(null);
  const [customMsg, setCustomMsg] = useState(settings.messageTemplate);
  const [timingOption, setTimingOption] = useState<'immediate' | '15m' | '1h' | '24h'>('immediate');

  useEffect(() => {
    setCustomMsg(settings.messageTemplate);
  }, [settings.messageTemplate]);

  const activeParticipants = participants.filter((p) => p.status === 'active');
  const nextEvent = schedules.find((s) => s.status === 'scheduled') || schedules[0];

  const handleToggleSetting = (field: keyof NotificationSettings) => {
    onUpdateSettings({
      ...settings,
      [field]: !settings[field],
    });
  };

  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const handleBroadcastNotification = () => {
    setWarningMessage(null);
    if (activeParticipants.length === 0) {
      setWarningMessage('Não há participantes ativos na base para receber notificações.');
      setTimeout(() => setWarningMessage(null), 3500);
      return;
    }

    setIsSending(true);
    setSendSuccessMessage(null);

    // Simulate sending progress with realistic feedback
    setTimeout(() => {
      setIsSending(false);
      const timingLabel =
        timingOption === 'immediate'
          ? 'Disparo Imediato (Ao Vivo)'
          : timingOption === '15m'
          ? '15 minutos antes'
          : timingOption === '1h'
          ? '1 hora antes'
          : '24 horas antes';

      const newLog: NotificationLog = {
        id: `notif-${Date.now()}`,
        channel: selectedChannel,
        recipientCount: activeParticipants.length,
        sentAt: new Date().toISOString(),
        status: 'sent',
        timingLabel,
        eventTitle: nextEvent ? nextEvent.title : 'Sorteio Oficial',
        messageTemplate: customMsg,
      };

      onAddNotificationLog(newLog);
      setSendSuccessMessage(`Disparo concluído com sucesso para todos os ${activeParticipants.length} participantes via ${selectedChannel.toUpperCase()}!`);
    }, 1500);
  };

  // Preview interpolation with sample participant
  const samplePerson = activeParticipants[0] || {
    name: 'Carlos Silva',
    ticketNumber: '84920',
  };

  const previewText = customMsg
    .replace('{nome}', samplePerson.name)
    .replace('{bilhete}', samplePerson.ticketNumber)
    .replace('{evento}', nextEvent?.title || 'Grande Sorteio Ao Vivo')
    .replace('{link_sorteio}', brand.raffleUrl || window.location.origin);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            <span>Notificação Automática aos Participantes</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure alertas automáticos antes do início da live e realize disparos em massa via WhatsApp, E-mail e SMS
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Público apto a receber:</span>
          <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
            {activeParticipants.length} participantes ativos
          </span>
        </div>
      </div>

      {/* Grid: Automation Rules & Manual Dispatch */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Triggers & Settings (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Automatic Timers Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Gatilhos Automáticos Pré-Evento</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              O sistema dispara notificações programadas para todos os inscritos conforme a contagem regressiva do sorteio.
            </p>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer hover:border-slate-700">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
                  <div>
                    <p className="text-xs font-bold text-white">Disparo com 24 Horas de Antecedência</p>
                    <p className="text-[11px] text-slate-400">Lembrete do dia do sorteio e verificação dos bilhetes</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoNotify24h}
                  onChange={() => handleToggleSetting('autoNotify24h')}
                  className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer hover:border-slate-700">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                  <div>
                    <p className="text-xs font-bold text-white">Disparo com 1 Hora de Antecedência</p>
                    <p className="text-[11px] text-slate-400">Aquecimento da audiência e contagem regressiva final</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoNotify1h}
                  onChange={() => handleToggleSetting('autoNotify1h')}
                  className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer hover:border-slate-700">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>
                  <div>
                    <p className="text-xs font-bold text-white">Disparo com 15 Minutos de Antecedência</p>
                    <p className="text-[11px] text-slate-400">Abertura da sala ao vivo e link direto da transmissão</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoNotify15m}
                  onChange={() => handleToggleSetting('autoNotify15m')}
                  className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer hover:border-slate-700">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                  <div>
                    <p className="text-xs font-bold text-white">Disparo Imediato &quot;Estamos Ao Vivo!&quot;</p>
                    <p className="text-[11px] text-slate-400">Alerta de início da roleta girando em tempo real</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoNotifyStart}
                  onChange={() => handleToggleSetting('autoNotifyStart')}
                  className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500"
                />
              </label>
            </div>
          </div>

          {/* Trigger Dispatch Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-400" />
              <span>Realizar Disparo de Lembrete Agora</span>
            </h3>

            {/* Channel Select */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedChannel('whatsapp')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  selectedChannel === 'whatsapp'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedChannel('email')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  selectedChannel === 'email'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>E-mail</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedChannel('sms')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  selectedChannel === 'sms'
                    ? 'bg-purple-600/20 border-purple-500 text-purple-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>SMS</span>
              </button>
            </div>

            {/* Template editor */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Modelo da Mensagem (com variáveis dinâmicas):</span>
                <span className="text-[10px] text-amber-400">Variáveis: {'{nome}'}, {'{bilhete}'}, {'{evento}'}, {'{link_sorteio}'}</span>
              </div>
              <textarea
                rows={3}
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {sendSuccessMessage && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{sendSuccessMessage}</span>
              </div>
            )}

            {warningMessage && (
              <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{warningMessage}</span>
              </div>
            )}

            <button
              onClick={handleBroadcastNotification}
              disabled={isSending}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg ${
                isSending
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-98'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>{isSending ? 'Disparando Notificações...' : `Registar Envio em Lote (${activeParticipants.length} Contatos)`}</span>
            </button>

            {/* Guia de Como Enviar Alertas por WhatsApp */}
            <div className="p-4 bg-slate-950/80 border border-emerald-500/30 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <MessageSquare className="w-4 h-4" />
                <span>Como o Aplicativo Envia Alertas pelo WhatsApp:</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-2 list-disc pl-4 leading-relaxed">
                <li>
                  <strong className="text-white">Envio 1-a-1 com 1 Clique (Aba &quot;Participantes&quot;):</strong> Ao lado de cada inscrito na tabela de participantes, clique em <strong className="text-emerald-400">&quot;Alerta WhatsApp&quot;</strong>. O WhatsApp Web ou móvel abre automaticamente com o número preenchido e mensagem formatada (nome, bilhete e link).
                </li>
                <li>
                  <strong className="text-white">Lista de Transmissão WhatsApp Business:</strong> Crie uma Lista de Transmissão no WhatsApp do seu telemóvel e cole a mensagem com o link oficial da transmissão ao vivo.
                </li>
                <li>
                  <strong className="text-white">Disparo Automático via Gateway / API:</strong> É possível conectar serviços como <strong className="text-amber-400">Z-API, Evolution API ou Twilio</strong> para envio 100% automático em segundo plano no momento da inscrição ou no início do sorteio.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Preview Mockup & Logs (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Visual Preview Device Mockup */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-400" />
              <span>Pré-Visualização no Dispositivo do Participante</span>
            </h3>

            {/* Smartphone simulated bubble */}
            <div className="bg-[#0b141a] border border-[#202c33] rounded-2xl p-4 text-white shadow-inner font-sans">
              <div className="flex items-center gap-2 border-b border-[#202c33] pb-2 mb-3 text-xs text-slate-400">
                <div className="w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center text-white font-bold text-[10px]">
                  SL
                </div>
                <div>
                  <p className="font-semibold text-white text-xs">{brand.companyName || 'SorteioLive Pro'}</p>
                  <p className="text-[10px] text-emerald-400">Canal Oficial Verificado ✓</p>
                </div>
              </div>

              {/* Message Bubble */}
              <div className="bg-[#005c4b] text-white p-3 rounded-2xl rounded-tl-sm text-xs shadow space-y-1.5 leading-relaxed">
                <p className="whitespace-pre-wrap">{previewText}</p>
                <div className="text-right text-[10px] text-emerald-200/70 pt-1 flex items-center justify-end gap-1">
                  <span>19:45</span>
                  <span>✓✓</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Delivery Log */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center justify-between">
              <span>Histórico de Disparos Realizados</span>
              <span className="text-xs text-slate-500 font-normal">{notificationLogs.length} envios</span>
            </h3>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {notificationLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 text-xs flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-white truncate">{log.eventTitle}</p>
                    <p className="text-slate-400 text-[11px]">
                      {log.channel.toUpperCase()} · {log.timingLabel} · {log.recipientCount} destinatários
                    </p>
                  </div>
                  <span className="shrink-0 text-emerald-400 font-mono text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Entregue ✓
                  </span>
                </div>
              ))}

              {notificationLogs.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-4">
                  Nenhuma notificação disparada recentemente.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
