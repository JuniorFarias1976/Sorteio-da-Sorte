import React, { useState } from 'react';
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
} from '../../types';
import { ParticipantsTab } from './ParticipantsTab';
import { PrizesTab } from './PrizesTab';
import { CalendarTab } from './CalendarTab';
import { NotificationsTab } from './NotificationsTab';
import { FormFieldsTab } from './FormFieldsTab';
import { QRCodeTab } from './QRCodeTab';
import { ReportsTab } from './ReportsTab';
import { BrandCustomizerTab } from './BrandCustomizerTab';
import { BackupSyncModal } from './BackupSyncModal';

import { 
  Users, 
  Gift, 
  Calendar as CalendarIcon, 
  Bell, 
  SlidersHorizontal, 
  QrCode, 
  FileCheck2, 
  Palette,
  Tv,
  RotateCcw,
  Database,
  Cloud,
  RefreshCw
} from 'lucide-react';

interface AdminDashboardProps {
  participants: Participant[];
  prizes: Prize[];
  schedules: DrawSchedule[];
  winners: DrawWinner[];
  notificationLogs: NotificationLog[];
  notificationSettings: NotificationSettings;
  brand: BrandConfig;
  formFields: FormFieldsConfig;
  posterConfig?: QRCodePosterConfig;
  reportConfig?: ReportPdfConfig;
  onUpdateParticipants: (participants: Participant[], deletedId?: string) => void;
  onUpdatePrizes: (prizes: Prize[], deletedId?: string) => void;
  onClearAllParticipants?: () => void;
  onUpdateSchedules: (schedules: DrawSchedule[]) => void;
  onUpdateWinners: (winners: DrawWinner[]) => void;
  onAddNotificationLog: (log: NotificationLog) => void;
  onUpdateNotificationSettings: (settings: NotificationSettings) => void;
  onUpdateBrand: (brand: BrandConfig) => void;
  onUpdateFormFields: (fields: FormFieldsConfig) => void;
  onUpdatePosterConfig?: (config: QRCodePosterConfig) => void;
  onUpdateReportConfig?: (config: ReportPdfConfig) => void;
  onGoToLive: () => void;
  onResetAllData: () => void;
  onManualSync?: () => void;
  isSyncing?: boolean;
}

export type AdminTab = 
  | 'participants' 
  | 'prizes' 
  | 'calendar' 
  | 'fields'
  | 'notifications' 
  | 'qrcode' 
  | 'reports' 
  | 'brand';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  participants,
  prizes,
  schedules,
  winners,
  notificationLogs,
  notificationSettings,
  brand,
  formFields,
  posterConfig,
  reportConfig,
  onUpdateParticipants,
  onUpdatePrizes,
  onClearAllParticipants,
  onUpdateSchedules,
  onUpdateWinners,
  onAddNotificationLog,
  onUpdateNotificationSettings,
  onUpdateBrand,
  onUpdateFormFields,
  onUpdatePosterConfig,
  onUpdateReportConfig,
  onGoToLive,
  onResetAllData,
  onManualSync,
  isSyncing = false,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('participants');
  const [showBackupModal, setShowBackupModal] = useState(false);

  const handleRestoreFullData = (data: any) => {
    if (data.brand) onUpdateBrand(data.brand);
    if (data.prizes) onUpdatePrizes(data.prizes);
    if (data.participants) onUpdateParticipants(data.participants);
    if (data.schedules) onUpdateSchedules(data.schedules);
    if (data.winners) onUpdateWinners(data.winners);
    if (data.settings) onUpdateNotificationSettings(data.settings);
    if (data.formFields) onUpdateFormFields(data.formFields);
    if (data.posterConfig && onUpdatePosterConfig) onUpdatePosterConfig(data.posterConfig);
    if (data.reportConfig && onUpdateReportConfig) onUpdateReportConfig(data.reportConfig);
  };

  const TABS = [
    { id: 'participants' as AdminTab, label: 'Participantes & Base', icon: Users, badge: participants.length },
    { id: 'prizes' as AdminTab, label: 'Prêmios & Quantidades', icon: Gift, badge: prizes.length },
    { id: 'calendar' as AdminTab, label: 'Calendário & 4 Horários', icon: CalendarIcon, badge: schedules.length },
    { id: 'fields' as AdminTab, label: 'Campos do Formulário', icon: SlidersHorizontal },
    { id: 'notifications' as AdminTab, label: 'Notificações Automáticas', icon: Bell },
    { id: 'qrcode' as AdminTab, label: 'QR Code para Impressão', icon: QrCode },
    { id: 'reports' as AdminTab, label: 'Relatórios & Auditoria PDF', icon: FileCheck2, badge: winners.length },
    { id: 'brand' as AdminTab, label: 'Logo & Cores da Marca', icon: Palette },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Admin Navigation Hub (Tabs) */}
        <div className="no-print bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-xl flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1 min-w-max">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isActive ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Actions (Live & Reset & DB Status) */}
          <div className="flex items-center gap-2 shrink-0 pl-2 border-l border-slate-800">
            {onManualSync ? (
              <button
                onClick={onManualSync}
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-emerald-500/40 hover:border-emerald-500/80 text-[11px] text-emerald-300 font-mono shadow-inner cursor-pointer transition-all disabled:opacity-50"
                title="Clique para sincronizar os dados em tempo real com o banco de dados central (data/database.json)"
              >
                <Database className={`w-3.5 h-3.5 text-emerald-400 shrink-0 ${isSyncing ? 'animate-spin text-amber-400' : ''}`} />
                <span className="hidden sm:inline">{isSyncing ? 'Sincronizando...' : 'DB Ativo (Sincronizar)'}</span>
                <span className="sm:hidden">{isSyncing ? '...' : 'DB'}</span>
              </button>
            ) : (
              <div 
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950/80 border border-emerald-500/30 text-[11px] text-emerald-300 font-mono shadow-inner"
                title="Banco de dados central ativo e sincronizado em data/database.json"
              >
                <Database className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>DB Ativo</span>
              </div>
            )}

            <button
              onClick={() => setShowBackupModal(true)}
              className="px-3 py-1.5 bg-slate-850 hover:bg-slate-800 text-amber-400 hover:text-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-amber-500/30 transition-all shadow cursor-pointer active:scale-98"
              title="Backup e Sincronização direta de dados e imagens entre quaisquer navegadores"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Backup & Sync</span>
            </button>

            <button
              onClick={onGoToLive}
              className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer"
              title="Abrir Telão da Live"
            >
              <Tv className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Telão da Live</span>
            </button>

            <button
              onClick={onResetAllData}
              className="p-2 text-slate-500 hover:text-amber-400 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Restaurar dados de demonstração padrão"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Body Content */}
        <main className="space-y-6">
          {activeTab === 'participants' && (
            <ParticipantsTab
              participants={participants}
              brand={brand}
              formFields={formFields}
              onUpdateParticipants={onUpdateParticipants}
              onUpdateFormFields={onUpdateFormFields}
              onClearAllParticipants={onClearAllParticipants}
            />
          )}

          {activeTab === 'prizes' && (
            <PrizesTab
              prizes={prizes}
              onUpdatePrizes={onUpdatePrizes}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarTab
              schedules={schedules}
              prizes={prizes}
              onUpdateSchedules={onUpdateSchedules}
              onGoToLive={onGoToLive}
            />
          )}

          {activeTab === 'fields' && (
            <FormFieldsTab
              formFields={formFields}
              onUpdateFormFields={onUpdateFormFields}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsTab
              participants={participants}
              notificationLogs={notificationLogs}
              settings={notificationSettings}
              brand={brand}
              schedules={schedules}
              onUpdateSettings={onUpdateNotificationSettings}
              onAddNotificationLog={onAddNotificationLog}
            />
          )}

          {activeTab === 'qrcode' && (
            <QRCodeTab
              brand={brand}
              schedules={schedules}
              posterConfig={posterConfig}
              onUpdateBrand={onUpdateBrand}
              onUpdatePosterConfig={onUpdatePosterConfig}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsTab
              winners={winners}
              brand={brand}
              reportConfig={reportConfig}
              onUpdateWinners={onUpdateWinners}
              onUpdateReportConfig={onUpdateReportConfig}
            />
          )}

          {activeTab === 'brand' && (
            <BrandCustomizerTab
              brand={brand}
              onUpdateBrand={onUpdateBrand}
            />
          )}
        </main>
      </div>

      {/* Universal Backup & Synchronization Modal */}
      <BackupSyncModal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        fullData={{
          brand,
          prizes,
          participants,
          schedules,
          winners,
          settings: notificationSettings,
          formFields,
        }}
        onRestoreFullData={handleRestoreFullData}
      />
    </div>
  );
};
