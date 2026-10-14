import React, { useState } from 'react';
import { 
  Participant, 
  Prize, 
  DrawSchedule, 
  DrawWinner, 
  NotificationLog, 
  NotificationSettings, 
  BrandConfig 
} from '../../types';
import { ParticipantsTab } from './ParticipantsTab';
import { PrizesTab } from './PrizesTab';
import { CalendarTab } from './CalendarTab';
import { NotificationsTab } from './NotificationsTab';
import { BannedUsersTab } from './BannedUsersTab';
import { QRCodeTab } from './QRCodeTab';
import { ReportsTab } from './ReportsTab';
import { BrandCustomizerTab } from './BrandCustomizerTab';

import { 
  Users, 
  Gift, 
  Calendar as CalendarIcon, 
  Bell, 
  ShieldAlert, 
  QrCode, 
  FileCheck2, 
  Palette,
  Tv,
  RotateCcw
} from 'lucide-react';
import { StorageService } from '../../utils/storage';

interface AdminDashboardProps {
  participants: Participant[];
  prizes: Prize[];
  schedules: DrawSchedule[];
  winners: DrawWinner[];
  notificationLogs: NotificationLog[];
  notificationSettings: NotificationSettings;
  brand: BrandConfig;
  onUpdateParticipants: (participants: Participant[]) => void;
  onUpdatePrizes: (prizes: Prize[]) => void;
  onUpdateSchedules: (schedules: DrawSchedule[]) => void;
  onUpdateWinners: (winners: DrawWinner[]) => void;
  onAddNotificationLog: (log: NotificationLog) => void;
  onUpdateNotificationSettings: (settings: NotificationSettings) => void;
  onUpdateBrand: (brand: BrandConfig) => void;
  onGoToLive: () => void;
  onResetAllData: () => void;
}

export type AdminTab = 
  | 'participants' 
  | 'prizes' 
  | 'calendar' 
  | 'notifications' 
  | 'banned' 
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
  onUpdateParticipants,
  onUpdatePrizes,
  onUpdateSchedules,
  onUpdateWinners,
  onAddNotificationLog,
  onUpdateNotificationSettings,
  onUpdateBrand,
  onGoToLive,
  onResetAllData,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('participants');

  const bannedCount = participants.filter((p) => p.status === 'banned').length;

  const TABS = [
    { id: 'participants' as AdminTab, label: 'Participantes & Base', icon: Users, badge: participants.length },
    { id: 'prizes' as AdminTab, label: 'Prêmios & Quantidades', icon: Gift, badge: prizes.length },
    { id: 'calendar' as AdminTab, label: 'Calendário & Horários', icon: CalendarIcon, badge: schedules.length },
    { id: 'notifications' as AdminTab, label: 'Notificações Automáticas', icon: Bell },
    { id: 'banned' as AdminTab, label: 'Usuários Banidos / Restrições', icon: ShieldAlert, badge: bannedCount > 0 ? bannedCount : undefined, badgeColor: 'bg-red-500' },
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
                        tab.badgeColor ? `${tab.badgeColor} text-white` : isActive ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Actions (Live & Reset) */}
          <div className="flex items-center gap-2 shrink-0 pl-2 border-l border-slate-800">
            <button
              onClick={onGoToLive}
              className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
              title="Abrir Telão da Live"
            >
              <Tv className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Telão da Live</span>
            </button>

            <button
              onClick={onResetAllData}
              className="p-2 text-slate-500 hover:text-amber-400 hover:bg-slate-800 rounded-xl transition-colors"
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
              onUpdateParticipants={onUpdateParticipants}
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

          {activeTab === 'banned' && (
            <BannedUsersTab
              participants={participants}
              onUpdateParticipants={onUpdateParticipants}
            />
          )}

          {activeTab === 'qrcode' && (
            <QRCodeTab
              brand={brand}
              schedules={schedules}
              onUpdateBrand={onUpdateBrand}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsTab
              winners={winners}
              brand={brand}
              onUpdateWinners={onUpdateWinners}
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
    </div>
  );
};
