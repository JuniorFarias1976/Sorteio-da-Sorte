import { 
  doc, 
  setDoc, 
  getDoc, 
  getDocFromServer,
  deleteDoc, 
  collection, 
  getDocs, 
  onSnapshot, 
  writeBatch,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../firebase';
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
} from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate Firestore connection on application boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'system', 'brand'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration (client offline).');
    }
    return false;
  }
}

// Recursively remove undefined fields so Firestore setDoc/writeBatch never fails silently
export function sanitizeForFirestore<T>(value: T): T {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof value === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [k, v] of Object.entries(value as Record<string, any>)) {
      if (v !== undefined) {
        cleaned[k] = sanitizeForFirestore(v);
      }
    }
    return cleaned as T;
  }
  if (typeof value === 'number' && !Number.isFinite(value)) {
    return 0 as unknown as T;
  }
  return value;
}

// Helper to execute batched writes cleanly within Firestore's 500-op batch limit
async function commitOperationsInChunks(
  ops: Array<{ type: 'set'; ref: any; data: any } | { type: 'delete'; ref: any }>
): Promise<void> {
  const CHUNK_SIZE = 400;
  for (let i = 0; i < ops.length; i += CHUNK_SIZE) {
    const chunk = ops.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    for (const op of chunk) {
      if (op.type === 'set') {
        batch.set(op.ref, sanitizeForFirestore(op.data));
      } else {
        batch.delete(op.ref);
      }
    }
    await batch.commit();
  }
}

export interface FirestoreSubscribers {
  onBrandChange?: (brand: BrandConfig) => void;
  onParticipantsChange?: (participants: Participant[]) => void;
  onPrizesChange?: (prizes: Prize[]) => void;
  onSchedulesChange?: (schedules: DrawSchedule[]) => void;
  onWinnersChange?: (winners: DrawWinner[]) => void;
  onNotificationsChange?: (notifications: NotificationLog[]) => void;
  onSettingsChange?: (settings: NotificationSettings) => void;
  onFormFieldsChange?: (formFields: FormFieldsConfig) => void;
  onPosterConfigChange?: (posterConfig: QRCodePosterConfig) => void;
  onReportConfigChange?: (reportConfig: ReportPdfConfig) => void;
  onUsersChange?: (users: AppUser[]) => void;
  onLiveStateChange?: (liveState: any) => void;
  onError?: (err: Error) => void;
}

export const FirestoreService = {
  testConnection: testFirestoreConnection,

  // Subscribe to all collections & system docs in real-time
  subscribeAll(handlers: FirestoreSubscribers): () => void {
    const unsubs: Unsubscribe[] = [];

    const reportListenerError = (path: string, err: any) => {
      console.error(`Firestore listener error on ${path}:`, err);
      handlers.onError?.(err);
    };

    try {
      // 1. Brand Document Listener
      unsubs.push(
        onSnapshot(
          doc(db, 'system', 'brand'),
          (snap) => {
            if (snap.exists() && handlers.onBrandChange) {
              handlers.onBrandChange(snap.data() as BrandConfig);
            }
          },
          (err) => reportListenerError('system/brand', err)
        )
      );

      // 2. Settings Document Listener
      unsubs.push(
        onSnapshot(
          doc(db, 'system', 'settings'),
          (snap) => {
            if (snap.exists() && handlers.onSettingsChange) {
              handlers.onSettingsChange(snap.data() as NotificationSettings);
            }
          },
          (err) => reportListenerError('system/settings', err)
        )
      );

      // 3. FormFields Document Listener
      unsubs.push(
        onSnapshot(
          doc(db, 'system', 'formFields'),
          (snap) => {
            if (snap.exists() && handlers.onFormFieldsChange) {
              handlers.onFormFieldsChange(snap.data() as FormFieldsConfig);
            }
          },
          (err) => reportListenerError('system/formFields', err)
        )
      );

      // 4. Poster Config Document Listener
      unsubs.push(
        onSnapshot(
          doc(db, 'system', 'posterConfig'),
          (snap) => {
            if (snap.exists() && handlers.onPosterConfigChange) {
              handlers.onPosterConfigChange(snap.data() as QRCodePosterConfig);
            }
          },
          (err) => reportListenerError('system/posterConfig', err)
        )
      );

      // 5. Report Config Document Listener
      unsubs.push(
        onSnapshot(
          doc(db, 'system', 'reportConfig'),
          (snap) => {
            if (snap.exists() && handlers.onReportConfigChange) {
              handlers.onReportConfigChange(snap.data() as ReportPdfConfig);
            }
          },
          (err) => reportListenerError('system/reportConfig', err)
        )
      );

      // 6. Live State Document Listener
      unsubs.push(
        onSnapshot(
          doc(db, 'system', 'liveState'),
          (snap) => {
            if (snap.exists() && handlers.onLiveStateChange) {
              handlers.onLiveStateChange(snap.data());
            }
          },
          (err) => reportListenerError('system/liveState', err)
        )
      );

      // 7. Participants Collection Listener
      unsubs.push(
        onSnapshot(
          collection(db, 'participants'),
          (snap) => {
            if (handlers.onParticipantsChange) {
              const items = snap.docs.map((d) => d.data() as Participant);
              items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
              handlers.onParticipantsChange(items);
            }
          },
          (err) => reportListenerError('participants', err)
        )
      );

      // 8. Prizes Collection Listener
      unsubs.push(
        onSnapshot(
          collection(db, 'prizes'),
          (snap) => {
            if (handlers.onPrizesChange) {
              const items = snap.docs.map((d) => d.data() as Prize);
              items.sort((a, b) => (a.drawOrder || 0) - (b.drawOrder || 0));
              handlers.onPrizesChange(items);
            }
          },
          (err) => reportListenerError('prizes', err)
        )
      );

      // 9. Schedules Collection Listener
      unsubs.push(
        onSnapshot(
          collection(db, 'schedules'),
          (snap) => {
            const items = snap.docs.map((d) => d.data() as DrawSchedule);
            items.sort((a, b) => {
              const dateA = `${a.scheduledDate || ''}T${a.scheduledTime || ''}`;
              const dateB = `${b.scheduledDate || ''}T${b.scheduledTime || ''}`;
              return dateA.localeCompare(dateB);
            });
            handlers.onSchedulesChange?.(items);
          },
          (err) => reportListenerError('schedules', err)
        )
      );

      // 10. Winners Collection Listener
      unsubs.push(
        onSnapshot(
          collection(db, 'winners'),
          (snap) => {
            if (handlers.onWinnersChange) {
              const items = snap.docs.map((d) => d.data() as DrawWinner);
              items.sort((a, b) => new Date(b.wonAt || 0).getTime() - new Date(a.wonAt || 0).getTime());
              handlers.onWinnersChange(items);
            }
          },
          (err) => reportListenerError('winners', err)
        )
      );

      // 11. Users Collection Listener
      unsubs.push(
        onSnapshot(
          collection(db, 'users'),
          (snap) => {
            if (handlers.onUsersChange) {
              const items = snap.docs.map((d) => d.data() as AppUser);
              items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
              handlers.onUsersChange(items);
            }
          },
          (err) => reportListenerError('users', err)
        )
      );

      // 12. Notifications Collection Listener
      unsubs.push(
        onSnapshot(
          collection(db, 'notifications'),
          (snap) => {
            if (handlers.onNotificationsChange) {
              const items = snap.docs.map((d) => d.data() as NotificationLog);
              items.sort((a, b) => new Date(b.sentAt || 0).getTime() - new Date(a.sentAt || 0).getTime());
              handlers.onNotificationsChange(items);
            }
          },
          (err) => reportListenerError('notifications', err)
        )
      );
    } catch (err: any) {
      handlers.onError?.(err);
    }

    return () => {
      unsubs.forEach((u) => {
        try {
          u();
        } catch {}
      });
    };
  },

  // Save Brand
  async saveBrand(brand: BrandConfig): Promise<void> {
    const path = 'system/brand';
    try {
      await setDoc(doc(db, 'system', 'brand'), sanitizeForFirestore({
        ...brand,
        updatedAt: new Date().toISOString(),
      }));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  // Save Form Fields
  async saveFormFields(fields: FormFieldsConfig): Promise<void> {
    const path = 'system/formFields';
    try {
      await setDoc(doc(db, 'system', 'formFields'), sanitizeForFirestore(fields));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  // Save Notification Settings
  async saveSettings(settings: NotificationSettings): Promise<void> {
    const path = 'system/settings';
    try {
      await setDoc(doc(db, 'system', 'settings'), sanitizeForFirestore(settings));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  // Save Poster Config
  async savePosterConfig(config: QRCodePosterConfig): Promise<void> {
    const path = 'system/posterConfig';
    try {
      await setDoc(doc(db, 'system', 'posterConfig'), sanitizeForFirestore(config));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  // Save Report Config
  async saveReportConfig(config: ReportPdfConfig): Promise<void> {
    const path = 'system/reportConfig';
    try {
      await setDoc(doc(db, 'system', 'reportConfig'), sanitizeForFirestore(config));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  // Save Live State
  async saveLiveState(state: any): Promise<void> {
    const path = 'system/liveState';
    try {
      await setDoc(doc(db, 'system', 'liveState'), sanitizeForFirestore({
        ...state,
        updatedAt: new Date().toISOString(),
      }));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  // Register or update a single participant
  async saveParticipant(participant: Participant): Promise<void> {
    const path = `participants/${participant.id}`;
    try {
      await setDoc(doc(db, 'participants', participant.id), sanitizeForFirestore(participant));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  // Delete participant
  async deleteParticipant(participantId: string): Promise<void> {
    const path = `participants/${participantId}`;
    try {
      await deleteDoc(doc(db, 'participants', participantId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  // Clear all participants from Firestore collection
  async clearAllParticipants(): Promise<void> {
    const path = 'participants';
    try {
      const snap = await getDocs(collection(db, 'participants'));
      if (snap.empty) return;
      const ops = snap.docs.map((d) => ({ type: 'delete' as const, ref: d.ref }));
      await commitOperationsInChunks(ops);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  // Safe synchronization of participants collection
  async saveParticipantsBatch(participants: Participant[], allowDelete = false): Promise<void> {
    const path = 'participants';
    try {
      const ops: Array<{ type: 'set'; ref: any; data: any } | { type: 'delete'; ref: any }> = [];
      if (allowDelete) {
        const snap = await getDocs(collection(db, 'participants'));
        const keepIds = new Set(participants.map((p) => p.id));
        snap.docs.forEach((docSnap) => {
          if (!keepIds.has(docSnap.id)) {
            ops.push({ type: 'delete', ref: docSnap.ref });
          }
        });
      }
      for (const p of participants) {
        if (p?.id) {
          ops.push({ type: 'set', ref: doc(db, 'participants', p.id), data: p });
        }
      }
      await commitOperationsInChunks(ops);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  // Save single prize
  async savePrize(prize: Prize): Promise<void> {
    const path = `prizes/${prize.id}`;
    try {
      await setDoc(doc(db, 'prizes', prize.id), sanitizeForFirestore(prize));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  // Delete prize
  async deletePrize(prizeId: string): Promise<void> {
    const path = `prizes/${prizeId}`;
    try {
      await deleteDoc(doc(db, 'prizes', prizeId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  // Clear all prizes from Firestore collection
  async clearAllPrizes(): Promise<void> {
    const path = 'prizes';
    try {
      const snap = await getDocs(collection(db, 'prizes'));
      if (snap.empty) return;
      const ops = snap.docs.map((d) => ({ type: 'delete' as const, ref: d.ref }));
      await commitOperationsInChunks(ops);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  // Full synchronization of prizes collection (handles additions, updates, and DELETIONS)
  async savePrizesBatch(prizes: Prize[]): Promise<void> {
    const path = 'prizes';
    try {
      const snap = await getDocs(collection(db, 'prizes'));
      const keepIds = new Set(prizes.map((p) => p.id));
      const ops: Array<{ type: 'set'; ref: any; data: any } | { type: 'delete'; ref: any }> = [];

      snap.docs.forEach((docSnap) => {
        if (!keepIds.has(docSnap.id)) {
          ops.push({ type: 'delete', ref: docSnap.ref });
        }
      });

      for (const p of prizes) {
        if (p?.id) {
          ops.push({ type: 'set', ref: doc(db, 'prizes', p.id), data: p });
        }
      }

      await commitOperationsInChunks(ops);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  // Save schedule
  async saveSchedule(schedule: DrawSchedule): Promise<void> {
    const path = `schedules/${schedule.id}`;
    try {
      await setDoc(doc(db, 'schedules', schedule.id), sanitizeForFirestore(schedule));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  // Delete schedule
  async deleteSchedule(scheduleId: string): Promise<void> {
    const path = `schedules/${scheduleId}`;
    try {
      await deleteDoc(doc(db, 'schedules', scheduleId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  // Full synchronization of schedules collection (handles additions, updates, and DELETIONS)
  async saveSchedulesBatch(schedules: DrawSchedule[]): Promise<void> {
    const path = 'schedules';
    try {
      const snap = await getDocs(collection(db, 'schedules'));
      const keepIds = new Set(schedules.map((s) => s.id));
      const ops: Array<{ type: 'set'; ref: any; data: any } | { type: 'delete'; ref: any }> = [];

      snap.docs.forEach((docSnap) => {
        if (!keepIds.has(docSnap.id)) {
          ops.push({ type: 'delete', ref: docSnap.ref });
        }
      });

      for (const s of schedules) {
        if (s?.id) {
          ops.push({ type: 'set', ref: doc(db, 'schedules', s.id), data: s });
        }
      }

      await commitOperationsInChunks(ops);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  // Save winner
  async saveWinner(winner: DrawWinner): Promise<void> {
    const path = `winners/${winner.id}`;
    try {
      await setDoc(doc(db, 'winners', winner.id), sanitizeForFirestore(winner));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  // Delete winner
  async deleteWinner(winnerId: string): Promise<void> {
    const path = `winners/${winnerId}`;
    try {
      await deleteDoc(doc(db, 'winners', winnerId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  // Clear all winners from Firestore collection
  async clearAllWinners(): Promise<void> {
    const path = 'winners';
    try {
      const snap = await getDocs(collection(db, 'winners'));
      if (snap.empty) return;
      const ops = snap.docs.map((d) => ({ type: 'delete' as const, ref: d.ref }));
      await commitOperationsInChunks(ops);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  // Full synchronization of winners collection (handles additions, updates, and DELETIONS)
  async saveWinnersBatch(winners: DrawWinner[]): Promise<void> {
    const path = 'winners';
    try {
      const snap = await getDocs(collection(db, 'winners'));
      const keepIds = new Set(winners.map((w) => w.id));
      const ops: Array<{ type: 'set'; ref: any; data: any } | { type: 'delete'; ref: any }> = [];

      snap.docs.forEach((docSnap) => {
        if (!keepIds.has(docSnap.id)) {
          ops.push({ type: 'delete', ref: docSnap.ref });
        }
      });

      for (const w of winners) {
        if (w?.id) {
          ops.push({ type: 'set', ref: doc(db, 'winners', w.id), data: w });
        }
      }

      await commitOperationsInChunks(ops);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  // Save single user
  async saveUser(user: AppUser): Promise<void> {
    const path = `users/${user.id}`;
    try {
      await setDoc(doc(db, 'users', user.id), sanitizeForFirestore(user));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  // Delete single user
  async deleteUser(userId: string): Promise<void> {
    const path = `users/${userId}`;
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  // Synchronize users collection (upserts users; deletes if allowDelete === true)
  async saveUsersBatch(users: AppUser[], allowDelete = false): Promise<void> {
    const path = 'users';
    try {
      const ops: Array<{ type: 'set'; ref: any; data: any } | { type: 'delete'; ref: any }> = [];
      if (allowDelete) {
        const snap = await getDocs(collection(db, 'users'));
        const keepIds = new Set(users.map((u) => u.id));
        snap.docs.forEach((docSnap) => {
          if (!keepIds.has(docSnap.id)) {
            ops.push({ type: 'delete', ref: docSnap.ref });
          }
        });
      }
      for (const u of users) {
        if (u?.id) {
          ops.push({ type: 'set', ref: doc(db, 'users', u.id), data: u });
        }
      }
      await commitOperationsInChunks(ops);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  // Save single notification log
  async saveNotification(log: NotificationLog): Promise<void> {
    const path = `notifications/${log.id}`;
    try {
      await setDoc(doc(db, 'notifications', log.id), sanitizeForFirestore(log));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  // Synchronize notifications collection
  async saveNotificationsBatch(logs: NotificationLog[]): Promise<void> {
    const path = 'notifications';
    try {
      const ops = logs
        .filter((l) => l?.id)
        .map((l) => ({ type: 'set' as const, ref: doc(db, 'notifications', l.id), data: l }));
      await commitOperationsInChunks(ops);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  // Check if a doc exists in Firestore
  async getSystemDoc(docId: string): Promise<any | null> {
    try {
      const snap = await getDoc(doc(db, 'system', docId));
      return snap.exists() ? snap.data() : null;
    } catch {
      return null;
    }
  },

  // Check email uniqueness on Firestore
  async isEmailRegistered(email: string): Promise<{ isDuplicate: boolean; existing?: Participant }> {
    try {
      const snap = await getDocs(collection(db, 'participants'));
      const normalized = email.trim().toLowerCase();
      for (const d of snap.docs) {
        const p = d.data() as Participant;
        if (p.email?.trim().toLowerCase() === normalized) {
          return { isDuplicate: true, existing: p };
        }
      }
      return { isDuplicate: false };
    } catch {
      return { isDuplicate: false };
    }
  },
};
