import { 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc, 
  collection, 
  getDocs, 
  onSnapshot, 
  writeBatch,
  query,
  orderBy,
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
  ReportPdfConfig 
} from '../types';

export interface FirestoreSubscribers {
  onBrandChange?: (brand: BrandConfig) => void;
  onParticipantsChange?: (participants: Participant[]) => void;
  onPrizesChange?: (prizes: Prize[]) => void;
  onSchedulesChange?: (schedules: DrawSchedule[]) => void;
  onWinnersChange?: (winners: DrawWinner[]) => void;
  onSettingsChange?: (settings: NotificationSettings) => void;
  onFormFieldsChange?: (formFields: FormFieldsConfig) => void;
  onPosterConfigChange?: (posterConfig: QRCodePosterConfig) => void;
  onReportConfigChange?: (reportConfig: ReportPdfConfig) => void;
  onLiveStateChange?: (liveState: any) => void;
  onError?: (err: Error) => void;
}

export const FirestoreService = {
  // Subscribe to all collections & system docs in real-time
  subscribeAll(handlers: FirestoreSubscribers): () => void {
    const unsubs: Unsubscribe[] = [];

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
          (err) => handlers.onError?.(err)
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
          (err) => handlers.onError?.(err)
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
          (err) => handlers.onError?.(err)
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
          (err) => handlers.onError?.(err)
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
          (err) => handlers.onError?.(err)
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
          (err) => handlers.onError?.(err)
        )
      );

      // 7. Participants Collection Listener
      unsubs.push(
        onSnapshot(
          collection(db, 'participants'),
          (snap) => {
            if (handlers.onParticipantsChange) {
              const items = snap.docs.map((d) => d.data() as Participant);
              // Sort descending by createdAt or ticketNumber
              items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
              handlers.onParticipantsChange(items);
            }
          },
          (err) => handlers.onError?.(err)
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
          (err) => handlers.onError?.(err)
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
          (err) => handlers.onError?.(err)
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
          (err) => handlers.onError?.(err)
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
    await setDoc(doc(db, 'system', 'brand'), {
      ...brand,
      updatedAt: new Date().toISOString(),
    });
  },

  // Save Form Fields
  async saveFormFields(fields: FormFieldsConfig): Promise<void> {
    await setDoc(doc(db, 'system', 'formFields'), fields);
  },

  // Save Notification Settings
  async saveSettings(settings: NotificationSettings): Promise<void> {
    await setDoc(doc(db, 'system', 'settings'), settings);
  },

  // Save Poster Config
  async savePosterConfig(config: QRCodePosterConfig): Promise<void> {
    await setDoc(doc(db, 'system', 'posterConfig'), config);
  },

  // Save Report Config
  async saveReportConfig(config: ReportPdfConfig): Promise<void> {
    await setDoc(doc(db, 'system', 'reportConfig'), config);
  },

  // Save Live State (wheel spinning, winner announcement)
  async saveLiveState(state: any): Promise<void> {
    await setDoc(doc(db, 'system', 'liveState'), {
      ...state,
      updatedAt: new Date().toISOString(),
    });
  },

  // Register or update a single participant
  async saveParticipant(participant: Participant): Promise<void> {
    await setDoc(doc(db, 'participants', participant.id), participant);
  },

  // Delete participant
  async deleteParticipant(participantId: string): Promise<void> {
    await deleteDoc(doc(db, 'participants', participantId));
  },

  // Clear all participants from Firestore collection
  async clearAllParticipants(): Promise<void> {
    try {
      const snap = await getDocs(collection(db, 'participants'));
      if (snap.empty) return;
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    } catch (err) {
      console.error('Failed to clear participants from Firestore:', err);
    }
  },

  // Full synchronization of participants collection (handles additions, updates, and DELETIONS)
  async saveParticipantsBatch(participants: Participant[]): Promise<void> {
    try {
      const snap = await getDocs(collection(db, 'participants'));
      const keepIds = new Set(participants.map((p) => p.id));
      const batch = writeBatch(db);

      // 1. Delete documents that are no longer in the array
      snap.docs.forEach((docSnap) => {
        if (!keepIds.has(docSnap.id)) {
          batch.delete(docSnap.ref);
        }
      });

      // 2. Set/update all active participants
      for (const p of participants) {
        batch.set(doc(db, 'participants', p.id), p);
      }

      await batch.commit();
    } catch (err) {
      console.error('Failed to sync participants batch to Firestore:', err);
    }
  },

  // Save single prize
  async savePrize(prize: Prize): Promise<void> {
    await setDoc(doc(db, 'prizes', prize.id), prize);
  },

  // Delete prize
  async deletePrize(prizeId: string): Promise<void> {
    await deleteDoc(doc(db, 'prizes', prizeId));
  },

  // Clear all prizes from Firestore collection
  async clearAllPrizes(): Promise<void> {
    try {
      const snap = await getDocs(collection(db, 'prizes'));
      if (snap.empty) return;
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    } catch (err) {
      console.error('Failed to clear prizes from Firestore:', err);
    }
  },

  // Full synchronization of prizes collection (handles additions, updates, and DELETIONS)
  async savePrizesBatch(prizes: Prize[]): Promise<void> {
    try {
      const snap = await getDocs(collection(db, 'prizes'));
      const keepIds = new Set(prizes.map((p) => p.id));
      const batch = writeBatch(db);

      snap.docs.forEach((docSnap) => {
        if (!keepIds.has(docSnap.id)) {
          batch.delete(docSnap.ref);
        }
      });

      for (const p of prizes) {
        batch.set(doc(db, 'prizes', p.id), p);
      }

      await batch.commit();
    } catch (err) {
      console.error('Failed to sync prizes batch to Firestore:', err);
    }
  },

  // Save schedule
  async saveSchedule(schedule: DrawSchedule): Promise<void> {
    await setDoc(doc(db, 'schedules', schedule.id), schedule);
  },

  // Delete schedule
  async deleteSchedule(scheduleId: string): Promise<void> {
    await deleteDoc(doc(db, 'schedules', scheduleId));
  },

  // Full synchronization of schedules collection (handles additions, updates, and DELETIONS)
  async saveSchedulesBatch(schedules: DrawSchedule[]): Promise<void> {
    try {
      const snap = await getDocs(collection(db, 'schedules'));
      const keepIds = new Set(schedules.map((s) => s.id));
      const batch = writeBatch(db);

      snap.docs.forEach((docSnap) => {
        if (!keepIds.has(docSnap.id)) {
          batch.delete(docSnap.ref);
        }
      });

      for (const s of schedules) {
        batch.set(doc(db, 'schedules', s.id), s);
      }

      await batch.commit();
    } catch (err) {
      console.error('Failed to sync schedules batch to Firestore:', err);
    }
  },

  // Save winner
  async saveWinner(winner: DrawWinner): Promise<void> {
    await setDoc(doc(db, 'winners', winner.id), winner);
  },

  // Delete winner
  async deleteWinner(winnerId: string): Promise<void> {
    await deleteDoc(doc(db, 'winners', winnerId));
  },

  // Clear all winners from Firestore collection
  async clearAllWinners(): Promise<void> {
    try {
      const snap = await getDocs(collection(db, 'winners'));
      if (snap.empty) return;
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    } catch (err) {
      console.error('Failed to clear winners from Firestore:', err);
    }
  },

  // Full synchronization of winners collection (handles additions, updates, and DELETIONS)
  async saveWinnersBatch(winners: DrawWinner[]): Promise<void> {
    try {
      const snap = await getDocs(collection(db, 'winners'));
      const keepIds = new Set(winners.map((w) => w.id));
      const batch = writeBatch(db);

      snap.docs.forEach((docSnap) => {
        if (!keepIds.has(docSnap.id)) {
          batch.delete(docSnap.ref);
        }
      });

      for (const w of winners) {
        batch.set(doc(db, 'winners', w.id), w);
      }

      await batch.commit();
    } catch (err) {
      console.error('Failed to sync winners batch to Firestore:', err);
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
