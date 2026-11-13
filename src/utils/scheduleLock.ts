import { DrawSchedule } from '../types';

export interface ScheduleLockStatus {
  isLocked: boolean;
  reason: 'ALREADY_DRAWN' | 'NOT_POSTERIOR' | null;
  message: string | null;
  blockingSchedule: DrawSchedule | null;
  latestDrawnSchedule: DrawSchedule | null;
}

export function formatScheduleDatePt(dateStr?: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export function getScheduleSlotKey(
  schedule: Pick<DrawSchedule, 'scheduledDate' | 'scheduledTime'>
): string {
  const datePart = (schedule.scheduledDate || '0000-00-00').trim();
  const rawTime = (schedule.scheduledTime || '00:00').trim();
  const [hh = '00', mm = '00'] = rawTime.split(':');
  const timePart = `${hh.padStart(2, '0')}:${mm.padStart(2, '0')}`;
  return `${datePart}T${timePart}`;
}

export function isScheduleCompletedOrLocked(schedule?: DrawSchedule | null): boolean {
  if (!schedule) return false;
  return schedule.isLocked === true || schedule.status === 'completed';
}

export function getLatestLockedSchedule(schedules: DrawSchedule[]): DrawSchedule | null {
  const locked = schedules.filter((s) => isScheduleCompletedOrLocked(s));
  if (locked.length === 0) return null;
  return locked.reduce((latest, curr) =>
    getScheduleSlotKey(curr) > getScheduleSlotKey(latest) ? curr : latest
  );
}

export function getScheduleDrawLockStatus(
  targetSchedule: DrawSchedule | undefined | null,
  allSchedules: DrawSchedule[]
): ScheduleLockStatus {
  const latestDrawnSchedule = getLatestLockedSchedule(allSchedules);

  if (!targetSchedule) {
    return {
      isLocked: false,
      reason: null,
      message: null,
      blockingSchedule: null,
      latestDrawnSchedule,
    };
  }

  // 1. If this exact scheduled slot was already drawn and not unlocked by an administrator
  if (isScheduleCompletedOrLocked(targetSchedule)) {
    return {
      isLocked: true,
      reason: 'ALREADY_DRAWN',
      message: `O sorteio agendado para ${formatScheduleDatePt(targetSchedule.scheduledDate)} às ${targetSchedule.scheduledTime} já foi realizado. Só é possível realizar um novo sorteio numa data ou hora posterior.`,
      blockingSchedule: targetSchedule,
      latestDrawnSchedule,
    };
  }

  // 2. If an administrator explicitly unlocked this slot due to a mistake, allow drawing it again
  if (targetSchedule.manuallyUnlocked === true) {
    return {
      isLocked: false,
      reason: null,
      message: null,
      blockingSchedule: null,
      latestDrawnSchedule,
    };
  }

  // 3. Otherwise, require target schedule date/time to be strictly posterior to the latest drawn schedule
  if (latestDrawnSchedule) {
    const targetKey = getScheduleSlotKey(targetSchedule);
    const latestKey = getScheduleSlotKey(latestDrawnSchedule);
    if (targetKey <= latestKey) {
      return {
        isLocked: true,
        reason: 'NOT_POSTERIOR',
        message: `Já foi realizado um sorteio em ${formatScheduleDatePt(latestDrawnSchedule.scheduledDate)} às ${latestDrawnSchedule.scheduledTime}. Um novo sorteio só pode ser realizado numa data ou hora posterior.`,
        blockingSchedule: latestDrawnSchedule,
        latestDrawnSchedule,
      };
    }
  }

  return {
    isLocked: false,
    reason: null,
    message: null,
    blockingSchedule: null,
    latestDrawnSchedule,
  };
}

export function getNextAvailablePosteriorSchedule(
  currentSchedule: DrawSchedule | undefined | null,
  allSchedules: DrawSchedule[]
): DrawSchedule | null {
  const sorted = [...allSchedules].sort((a, b) =>
    getScheduleSlotKey(a).localeCompare(getScheduleSlotKey(b))
  );
  const currentKey = currentSchedule ? getScheduleSlotKey(currentSchedule) : '';
  return (
    sorted.find((s) => {
      if (currentSchedule && s.id === currentSchedule.id) return false;
      const status = getScheduleDrawLockStatus(s, allSchedules);
      if (status.isLocked) return false;
      return !currentKey || getScheduleSlotKey(s) > currentKey;
    }) ||
    sorted.find((s) => !getScheduleDrawLockStatus(s, allSchedules).isLocked) ||
    null
  );
}
