import { create } from 'zustand';
import { useAuthStore } from './auth.store';

type EventListener = (data: any) => void;

interface RealtimeState {
  ws: WebSocket | null;
  connected: boolean;
  listeners: Record<string, EventListener[]>;
  connect: () => void;
  disconnect: () => void;
  on: (event: string, callback: EventListener) => void;
  off: (event: string, callback: EventListener) => void;
  simulateEvent: (event: string, data: any) => void;
}

export const useRealtimeStore = create<RealtimeState>((set, get) => ({
  ws: null,
  connected: false,
  listeners: {},

  connect: () => {
    const { accessToken } = useAuthStore.getState();
    if (!accessToken) return;

    if (get().ws) {
      get().ws?.close();
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Using port 3000 assuming standard backend development port, adjust for prod 
    // Usually Vite proxies this or we connect directly to the backend
    const host = window.location.hostname === 'localhost' ? 'localhost:3000' : window.location.host;
    const wsUrl = `${protocol}//${host}/api/realtime?token=${accessToken}`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => set({ connected: true });
    
    ws.onclose = () => {
      set({ connected: false });
      // Reconnect after 3 seconds
      setTimeout(() => get().connect(), 3000);
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const { event: eventName, data } = payload;
        const currentListeners = get().listeners[eventName] || [];
        currentListeners.forEach(cb => cb(data));
      } catch (err) {
        console.error('Failed to parse WS message', err);
      }
    };

    set({ ws });
  },

  disconnect: () => {
    const ws = get().ws;
    if (ws) {
      ws.onclose = null; // Prevent reconnect
      ws.close();
      set({ ws: null, connected: false });
    }
  },

  on: (event: string, callback: EventListener) => {
    const listeners = { ...get().listeners };
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(callback);
    set({ listeners });
  },

  off: (event: string, callback: EventListener) => {
    const listeners = { ...get().listeners };
    if (listeners[event]) {
      listeners[event] = listeners[event].filter(cb => cb !== callback);
    }
    set({ listeners });
  },

  simulateEvent: (eventName: string, data: any) => {
    const currentListeners = get().listeners[eventName] || [];
    currentListeners.forEach(cb => cb(data));
  }
}));
