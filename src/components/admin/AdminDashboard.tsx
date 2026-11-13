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
  ReportPdfConfig,
  AppUser
} from '../../types';
import { ParticipantsTab } from './ParticipantsTab';
import { PrizesTab } from './PrizesTab';
import { CalendarTab } from './CalendarTab';
import { FormFieldsTab } from './FormFieldsTab';
import { QRCodeTab } from './QRCodeTab';
import { ReportsTab } from './ReportsTab';
import { BrandCustomizerTab } from './BrandCustomizerTab';
import { UsersTab } from './UsersTab';
import { BackupSyncModal } from './BackupSyncModal';

import { 
  Users, 
  Gift, 
  Calendar as CalendarIcon, 
  SlidersHorizontal, 
  QrCode, 
  FileCheck2, 
  Palette,
  Tv,
  RotateCcw,
  Database,
  Cloud,
  RefreshCw,
  ShieldCheck,
  User as UserIcon,
  LogOut
} from 'lucide-react';
import { isLightColor } from '../../utils/storage';

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
  users?: AppUser[];
  currentUser?: AppUser | null;
  onUpdateUsers?: (users: AppUser[], deletedId?: string) => void;
  onLogout?: () => void;
  onUpdateParticipants: (participants: Participant[], deletedId?: string) => void;
  onUpdatePrizes: (prizes: Prize[], deletedId?: string) => void;
  onResetPrize?: (prizeId: string, clearAssociatedWinners?: boolean) => void;
  onClearAllParticipants?: () => void;
  onUpdateSchedules: (schedules: DrawSchedule[]) => void;
  onUpdateWinners: (winners: DrawWinner[], allowDeletion?: boolean) => void;
  onAddNotificationLog: (log: NotificationLog) => void;
  onUpdateNotificationSettings: (settings: NotificationSettings) => void;
  onUpdateBrand: (brand: BrandConfig) => void;
  onUpdateFormFields: (fields: FormFieldsConfig) => void;
  onUpdatePosterConfig?: (config: QRCodePosterConfig) => void;
  onUpdateReportConfig?: (config: ReportPdfConfig) => void;
  onGoToLive: () => void;
  onGoToPublic?: () => void;
  onResetAllData: () => void;
  onManualSync?: () => void;
  isSyncing?: boolean;
}

export type AdminTab = 
  | 'participants' 
  | 'prizes' 
  | 'calendar' 
  | 'fields' 
  | 'qrcode' 
  | 'reports' 
  | 'brand'
  | 'users'
  | 'live';

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
  users = [],
  currentUser = null,
  onUpdateUsers,
  onLogout,
  onUpdateParticipants,
  onUpdatePrizes,
  onResetPrize,
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
  onGoToPublic,
  onResetAllData,
  onManualSync,
  isSyncing = false,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('participants');
  const [showBackupModal, setShowBackupModal] = useState(false);

  const isStandardUser = currentUser?.role === 'standard';

  // Ensure standard user cannot be in restricted tabs
  const allowedStandardTabs: AdminTab[] = ['participants', 'prizes', 'calendar', 'reports', 'live'];
  const effectiveActiveTab = isStandardUser && !allowedStandardTabs.includes(activeTab)
    ? 'participants'
    : activeTab;

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
    if (data.users && onUpdateUsers) onUpdateUsers(data.users);
  };

  const isLight = isLightColor(brand.backgroundColor || '#FFFFFF');
  const appBg = brand.backgroundColor || (isLight ? '#FFFFFF' : '#0B0F19');
  const appTextColor = brand.textColor || (isLight ? '#0F172A' : '#F8FAFC');

  // Role-based visible tabs configuration:
  // Standard user only sees: "Participantes Inscritos", "Prêmios e Quantidades", "Calendário do Sorteios", "Relatório & Auditoria PDF", "Sorteio"
  const TABS = isStandardUser
    ? [
        { id: 'participants' as AdminTab, label: 'Participantes Inscritos', icon: Users, badge: participants.length },
        { id: 'prizes' as AdminTab, label: 'Prêmios e Quantidades', icon: Gift, badge: prizes.length },
        { id: 'calendar' as AdminTab, label: 'Calendário do Sorteios', icon: CalendarIcon, badge: schedules.length },
        { id: 'reports' as AdminTab, label: 'Relatório & Auditoria PDF', icon: FileCheck2, badge: winners.length },
        { id: 'live' as AdminTab, label: 'Sorteio', icon: Tv },
      ]
    : [
        { id: 'participants' as AdminTab, label: 'Participantes Inscritos', icon: Users, badge: participants.length },
        { id: 'prizes' as AdminTab, label: 'Prêmios e Quantidades', icon: Gift, badge: prizes.length },
        { id: 'calendar' as AdminTab, label: 'Calendário do Sorteios', icon: CalendarIcon, badge: schedules.length },
        { id: 'fields' as AdminTab, label: 'Campos do Formulário', icon: SlidersHorizontal },
        { id: 'qrcode' as AdminTab, label: 'Código QR para Impressão', icon: QrCode },
        { id: 'reports' as AdminTab, label: 'Relatório & Auditoria PDF', icon: FileCheck2, badge: winners.length },
        { id: 'brand' as AdminTab, label: 'Logótipo, Cores & Textos', icon: Palette },
        { id: 'users' as AdminTab, label: 'Utilizadores', icon: Users, badge: users.length },
        { id: 'live' as AdminTab, label: 'Sorteio', icon: Tv },
      ];

  return (
    <div 
      className={`min-h-screen py-4 sm:py-8 px-3 sm:px-6 lg:px-8 pb-12 sm:pb-8 transition-colors duration-200 ${
        isLight ? 'bg-white text-slate-900' : 'bg-slate-950 text-slate-100'
      }`}
      style={{ backgroundColor: appBg, color: appTextColor }}
    >
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Mobile Header: Voltar ao Sorteio (Admins only) */}
        {!isStandardUser && onGoToPublic && (
          <div className="sm:hidden flex items-center justify-between gap-2">
            <button
              onClick={onGoToPublic}
              className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                isLight 
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300' 
                  : 'bg-slate-900 hover:bg-slate-850 text-slate-200 border-slate-700'
              }`}
            >
              <span>← Voltar ao Sorteio (Página Pública)</span>
            </button>
          </div>
        )}

        {/* Mobile Tab Selector (< sm) */}
        <div className={`sm:hidden border rounded-2xl p-2.5 shadow-sm flex items-center justify-between gap-2 ${
          isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800'
        }`}>
          <label className={`text-xs font-bold shrink-0 flex items-center gap-1.5 ${
            isLight ? 'text-[#E30613]' : 'text-amber-400'
          }`}>
            <SlidersHorizontal className="w-4 h-4" />
            <span>Módulo:</span>
          </label>
          <select
            value={effectiveActiveTab}
            onChange={(e) => {
              const val = e.target.value as AdminTab;
              if (val === 'live') {
                onGoToLive();
              } else {
                setActiveTab(val);
              }
            }}
            className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#E30613] ${
              isLight ? 'bg-slate-50 border border-slate-200 text-slate-900' : 'bg-slate-950 border border-slate-700 text-white'
            }`}
          >
            {TABS.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.label} {tab.badge !== undefined ? `(${tab.badge})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Admin Navigation Hub (Tabs) */}
        <div className={`no-print border rounded-2xl p-2 shadow-sm flex items-center justify-between gap-2 overflow-x-auto ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center gap-1 min-w-max">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = effectiveActiveTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === 'live') {
                      onGoToLive();
                    } else {
                      setActiveTab(tab.id);
                    }
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#E30613] text-white font-bold shadow-md shadow-red-500/25'
                      : isLight 
                        ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isActive 
                          ? 'bg-white text-[#E30613] font-bold' 
                          : isLight 
                            ? 'bg-slate-100 text-slate-700' 
                            : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Actions (Admin only - hidden for standard users) */}
          {!isStandardUser && (
            <div className={`flex items-center gap-2 shrink-0 pl-2 border-l ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              {/* Logged in User Pill */}
              {currentUser && (
                <div 
                  className={`hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs shadow-sm ${
                    isLight ? 'bg-slate-100 border-slate-300' : 'bg-slate-950 border-slate-800'
                  }`}
                  title={`Sessão iniciada como ${currentUser.name} (${currentUser.role === 'admin' ? 'Administrador' : 'Utilizador Padrão'})`}
                >
                  {currentUser.role === 'admin' ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-[#E30613] shrink-0" />
                  ) : (
                    <UserIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  )}
                  <span className={`font-bold text-xs truncate max-w-[140px] ${
                    isLight ? 'text-slate-900' : 'text-slate-100'
                  }`}>
                    {currentUser.name || currentUser.username}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase ${
                    currentUser.role === 'admin'
                      ? 'bg-red-100 text-[#E30613] border border-red-200'
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}>
                    {currentUser.role === 'admin' ? 'Admin' : 'Padrão'}
                  </span>
                  {onLogout && (
                    <button
                      onClick={onLogout}
                      className={`transition-colors cursor-pointer p-0.5 ml-0.5 ${
                        isLight ? 'text-slate-600 hover:text-[#E30613]' : 'text-slate-400 hover:text-red-400'
                      }`}
                      title="Terminar Sessão"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {onManualSync ? (
                <button
                  onClick={onManualSync}
                  disabled={isSyncing}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold shadow-sm cursor-pointer transition-all disabled:opacity-50 ${
                    isLight 
                      ? 'bg-emerald-100 hover:bg-emerald-200 border-emerald-400 text-emerald-900' 
                      : 'bg-slate-950/80 hover:bg-slate-900 border-emerald-500/40 text-emerald-300'
                  }`}
                  title="Clique para sincronizar os dados em tempo real com a base de dados central"
                >
                  <Database className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-emerald-700' : 'text-emerald-400'} ${isSyncing ? 'animate-spin text-[#E30613]' : ''}`} />
                  <span className="hidden sm:inline">{isSyncing ? 'A sincronizar...' : 'BD Ativa (Sincronizar)'}</span>
                  <span className="sm:hidden">{isSyncing ? '...' : 'BD'}</span>
                </button>
              ) : (
                <div 
                  className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold shadow-sm ${
                    isLight 
                      ? 'bg-emerald-100 border-emerald-400 text-emerald-900' 
                      : 'bg-slate-950/80 border-emerald-500/30 text-emerald-300'
                  }`}
                  title="Base de dados central ativa e sincronizada"
                >
                  <Database className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
                  <span>BD Ativa</span>
                </div>
              )}

              <button
                onClick={() => setShowBackupModal(true)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all shadow-sm cursor-pointer active:scale-98 ${
                  isLight 
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300' 
                    : 'bg-slate-850 hover:bg-slate-800 text-amber-400 border-amber-500/30'
                }`}
                title="Cópia de segurança e sincronização de dados entre navegadores"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>Cópia de Segurança</span>
              </button>

              {onGoToPublic && (
                <button
                  onClick={onGoToPublic}
                  className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm cursor-pointer ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                      : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'
                  }`}
                  title="Voltar para a página pública do sorteio"
                >
                  <span>← Voltar ao Sorteio</span>
                </button>
              )}

              <button
                onClick={onGoToLive}
                className="px-3.5 py-2 bg-[#E30613] hover:bg-[#C80510] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-600/20 cursor-pointer"
                title="Abrir Ecrã de Sorteio"
              >
                <Tv className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Sorteio</span>
              </button>

              <button
                onClick={onResetAllData}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isLight ? 'text-slate-500 hover:text-[#E30613] hover:bg-slate-100' : 'text-slate-500 hover:text-amber-400 hover:bg-slate-800'
                }`}
                title="Repor dados de demonstração predefinidos"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Tab Body Content */}
        <main className="space-y-6">
          {effectiveActiveTab === 'participants' && (
            <ParticipantsTab
              participants={participants}
              brand={brand}
              formFields={formFields}
              isStandardUser={isStandardUser}
              onUpdateParticipants={onUpdateParticipants}
              onUpdateFormFields={onUpdateFormFields}
              onClearAllParticipants={onClearAllParticipants}
            />
          )}

          {effectiveActiveTab === 'prizes' && (
            <PrizesTab
              prizes={prizes}
              onUpdatePrizes={onUpdatePrizes}
              onResetPrize={onResetPrize}
              winners={winners}
              onUpdateWinners={onUpdateWinners}
            />
          )}

          {effectiveActiveTab === 'calendar' && (
            <CalendarTab
              schedules={schedules}
              prizes={prizes}
              onUpdateSchedules={onUpdateSchedules}
              onGoToLive={onGoToLive}
              brand={brand}
            />
          )}

          {effectiveActiveTab === 'fields' && !isStandardUser && (
            <FormFieldsTab
              formFields={formFields}
              onUpdateFormFields={onUpdateFormFields}
            />
          )}

          {effectiveActiveTab === 'qrcode' && !isStandardUser && (
            <QRCodeTab
              brand={brand}
              schedules={schedules}
              posterConfig={posterConfig}
              onUpdateBrand={onUpdateBrand}
              onUpdatePosterConfig={onUpdatePosterConfig}
            />
          )}

          {effectiveActiveTab === 'reports' && (
            <ReportsTab
              winners={winners}
              brand={brand}
              reportConfig={reportConfig}
              onUpdateWinners={onUpdateWinners}
              onUpdateReportConfig={onUpdateReportConfig}
            />
          )}

          {effectiveActiveTab === 'brand' && !isStandardUser && (
            <BrandCustomizerTab
              brand={brand}
              onUpdateBrand={onUpdateBrand}
              onNavigateToCalendar={() => setActiveTab('calendar')}
            />
          )}

          {effectiveActiveTab === 'users' && !isStandardUser && (
            <UsersTab
              users={users}
              brand={brand}
              currentUser={currentUser}
              onUpdateUsers={onUpdateUsers || (() => {})}
            />
          )}
        </main>
      </div>

      {/* Universal Backup & Synchronization Modal (Admin only) */}
      {!isStandardUser && (
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
            users,
          }}
          onRestoreFullData={handleRestoreFullData}
        />
      )}
    </div>
  );
};
