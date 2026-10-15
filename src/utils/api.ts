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
      if (!res.ok) return null;
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) return null;
      return await res.json();
    } catch (err) {
      console.warn('Could not fetch server data, falling back to local storage:', err);
      return null;
    }
  },

  // Save updates to server so mobile and other devices immediately sync
  async saveData(updates: Partial<AppServerData>): Promise<{ success: boolean; error?: string; serverOffline?: boolean }> {
    try {
      const res = await fetch(`${API_BASE}/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        return { success: false, serverOffline: true };
      }
      return { success: true };
    } catch (err: any) {
      console.warn('Failed to sync data to server (running in local/offline mode):', err?.message);
      return { success: false, serverOffline: true };
    }
  },

  // Get real-time database health and verification
  async getDbStatus(): Promise<{
    success: boolean;
    status: string;
    version: number;
    participantsCount: number;
    prizesCount: number;
    winnersCount: number;
    brand: {
      companyName: string;
      hasCustomLogo: boolean;
      primaryColor: string;
    };
    lastSaved: string;
  } | null> {
    try {
      const res = await fetch(`${API_BASE}/db/status`);
      if (!res.ok) return null;
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  // Register participant with server uniqueness check & resilient offline fallback
  async registerParticipant(data: {
    name: string;
    email: string;
    phone?: string;
    document?: string;
    city?: string;
  }): Promise<{ 
    success: boolean; 
    participant?: Participant; 
    error?: string; 
    existingParticipant?: Participant;
    serverOffline?: boolean;
  }> {
    try {
      const res = await fetch(`${API_BASE}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const contentType = res.headers.get('content-type') || '';

      // If server returned non-JSON (like 404 HTML on Vercel static deployment or proxy error)
      if (!contentType.includes('application/json')) {
        return {
          success: false,
          serverOffline: true,
          error: 'SERVER_UNAVAILABLE',
        };
      }

      const body = await res.json();

      if (res.status === 409) {
        return {
          success: false,
          error: 'DUPLICATE_EMAIL',
          existingParticipant: body?.existingParticipant,
        };
      }

      if (!res.ok) {
        return {
          success: false,
          error: body?.message || 'Falha ao realizar inscrição no servidor.',
        };
      }

      return {
        success: true,
        participant: body.participant,
      };
    } catch {
      return {
        success: false,
        serverOffline: true,
        error: 'SERVER_UNAVAILABLE',
      };
    }
  },

  // Get current live state
  async getLiveState(): Promise<LiveState | null> {
    try {
      const res = await fetch(`${API_BASE}/live/state`);
      if (!res.ok) return null;
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) return null;
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

  // Get network and server host info to construct ideal mobile QR links
  async getNetworkInfo(): Promise<{
    localIp: string;
    allIps: string[];
    port: number;
    host: string;
    origin: string;
    sharedUrl: string;
    developmentUrl: string;
  } | null> {
    try {
      const res = await fetch(`${API_BASE}/network-info`);
      if (!res.ok) return null;
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) return null;
      return await res.json();
    } catch {
      return null;
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
