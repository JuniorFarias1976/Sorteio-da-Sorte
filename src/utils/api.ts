import { Participant, Prize, DrawSchedule, DrawWinner, NotificationLog, NotificationSettings, BrandConfig, FormFieldsConfig, QRCodePosterConfig, ReportPdfConfig } from '../types';

export interface AppServerData {
  participants: Participant[];
  prizes: Prize[];
  schedules: DrawSchedule[];
  winners: DrawWinner[];
  notifications: NotificationLog[];
  settings: NotificationSettings;
  brand: BrandConfig;
  formFields: FormFieldsConfig;
  posterConfig: QRCodePosterConfig;
  reportConfig: ReportPdfConfig;
}

export interface LiveState {
  isDrawing: boolean;
  prizeId: string | null;
  round: number;
  countdown: number | null;
  currentDisplayTicket: string;
  currentDisplayName: string;
  currentDisplayCity: string;
  latestWinner: DrawWinner | null;
  lastDrawnAt: string | null;
}

const API_BASE = '/api';

export const ApiService = {
  // Fetch full synchronized data from server
  async fetchAllData(): Promise<AppServerData | null> {
    try {
      const res = await fetch(`${API_BASE}/data`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Could not fetch server data, falling back to local storage:', err);
      return null;
    }
  },

  // Save updates to server so mobile and other devices immediately sync
  async saveData(updates: Partial<AppServerData>): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return res.ok;
    } catch (err) {
      console.warn('Failed to sync data to server:', err);
      return false;
    }
  },

  // Register participant with server uniqueness check
  async registerParticipant(data: {
    name: string;
    email: string;
    phone?: string;
    document?: string;
    city?: string;
  }): Promise<{ success: boolean; participant?: Participant; error?: string; existingParticipant?: Participant }> {
    try {
      const res = await fetch(`${API_BASE}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const body = await res.json();

      if (res.status === 409) {
        return {
          success: false,
          error: 'DUPLICATE_EMAIL',
          existingParticipant: body.existingParticipant,
        };
      }

      if (!res.ok) {
        return {
          success: false,
          error: body.message || 'Falha ao realizar inscrição.',
        };
      }

      return {
        success: true,
        participant: body.participant,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Erro de conexão com o servidor.',
      };
    }
  },

  // Get current live state
  async getLiveState(): Promise<LiveState | null> {
    try {
      const res = await fetch(`${API_BASE}/live/state`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  // Trigger draw (Only Admin can trigger)
  async triggerDraw(prizeId: string, round: number): Promise<{ success: boolean; winner?: DrawWinner; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/live/draw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prizeId, round }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.message || 'Erro ao sortear prêmio.' };
      }
      return { success: true, winner: data.winner };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao conectar com servidor de sorteio.' };
    }
  },

  // Reset live screen (Admin only)
  async resetLive(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/live/reset`, { method: 'POST' });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Subscribe to real-time events from server (Server-Sent Events)
  subscribeLiveEvents(handlers: {
    onLiveEvent?: (event: any) => void;
    onDataUpdated?: (data: Partial<AppServerData>) => void;
    onInitialState?: (snapshot: { liveState: LiveState; db: AppServerData }) => void;
  }): () => void {
    if (typeof window === 'undefined' || !('EventSource' in window)) {
      return () => {};
    }

    let eventSource: EventSource | null = null;
    let isClosed = false;

    const connect = () => {
      if (isClosed) return;
      try {
        eventSource = new EventSource(`${API_BASE}/live/stream`);

        eventSource.addEventListener('INITIAL_STATE', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            handlers.onInitialState?.(data);
          } catch (err) {
            console.error('Error parsing INITIAL_STATE:', err);
          }
        });

        eventSource.addEventListener('LIVE_EVENT', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            handlers.onLiveEvent?.(data);
          } catch (err) {
            console.error('Error parsing LIVE_EVENT:', err);
          }
        });

        eventSource.addEventListener('DATA_UPDATED', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            handlers.onDataUpdated?.(data);
          } catch (err) {
            console.error('Error parsing DATA_UPDATED:', err);
          }
        });

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          if (!isClosed) {
            // Reconnect after 3s
            setTimeout(connect, 3000);
          }
        };
      } catch (err) {
        console.error('Error creating EventSource:', err);
      }
    };

    connect();

    return () => {
      isClosed = true;
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    };
  },
};
