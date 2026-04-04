'use client';

/**
 * MessagingContext — global WebSocket + messaging state.
 *
 * Connects once per session. Provides:
 *   unread        — count of unread incoming messages
 *   lastMessage   — most recent WS-delivered message (watch this to update local lists)
 *   send(content, recipientId?) — send a message
 *   broadcast(content)          — admin only
 *   markRead(userId?)           — mark conversation as read
 *   connected                   — WS connection state
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useAuth } from './AuthContext';
import api from '@/services/api';
import type { Message } from '@/types';

interface MessagingCtx {
  connected: boolean;
  unread: number;
  lastMessage: Message | null;
  send: (content: string, recipientId?: number) => void;
  broadcast: (content: string) => void;
  markRead: (userId?: number) => void;
  setUnread: (n: number) => void;
}

const MessagingContext = createContext<MessagingCtx | null>(null);

export function useMessaging() {
  const ctx = useContext(MessagingContext);
  if (!ctx) throw new Error('useMessaging must be used inside <MessagingProvider>');
  return ctx;
}

// ─── derive WS base URL from the REST base URL ───────────────────────────────
function wsBase(): string {
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  return api.replace('/api/v1', '').replace(/^http/, 'ws');
}

// ─── provider ─────────────────────────────────────────────────────────────────

export function MessagingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [connected, setConnected] = useState(false);
  const [unread, setUnread] = useState(0);
  const [lastMessage, setLastMessage] = useState<Message | null>(null);

  // ── connect ────────────────────────────────────────────────────────────────

  const connect = useCallback(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const url = `${wsBase()}/ws/messages/?token=${token}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);

    ws.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data) as Message & { type: string };
        if (data.type === 'new_message') {
          setLastMessage(data);
          // Increment unread only for incoming messages not from ourselves
          if (!data.is_mine) {
            setUnread((n) => n + 1);
          }
        }
      } catch {
        // ignore malformed frames
      }
    };

    ws.onclose = () => {
      setConnected(false);
      // Reconnect after 3 s if user is still logged in
      reconnectTimer.current = setTimeout(() => {
        if (localStorage.getItem('access_token')) connect();
      }, 3000);
    };

    ws.onerror = () => ws.close();
  }, []);

  // ── lifecycle ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (user) {
      connect();
      // Seed unread count from REST so messages sent before WS connected are counted
      const fetchUnread = user.is_staff || user.is_superuser
        ? api.getAdminUnreadCount()
        : api.getMyUnreadCount();
      fetchUnread.then(({ unread }) => setUnread(unread)).catch(() => {});
    } else {
      // User logged out — close connection
      wsRef.current?.close();
      wsRef.current = null;
      setConnected(false);
      setUnread(0);
      setLastMessage(null);
    }
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [user, connect]);

  // ── actions ───────────────────────────────────────────────────────────────

  const send = useCallback((content: string, recipientId?: number) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({
      type: 'send_message',
      content,
      ...(recipientId != null ? { recipient_id: recipientId } : {}),
    }));
  }, []);

  const broadcast = useCallback((content: string) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'send_broadcast', content }));
  }, []);

  const markRead = useCallback((userId?: number) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({
      type: 'mark_read',
      ...(userId != null ? { user_id: userId } : {}),
    }));
    // Re-fetch the true unread count instead of resetting to 0,
    // so opening one admin conversation doesn't clear other threads' badges.
    const fetchUnread = userId != null
      ? api.getAdminUnreadCount()
      : api.getMyUnreadCount();
    fetchUnread.then(({ unread }) => setUnread(unread)).catch(() => setUnread(0));
  }, []);

  return (
    <MessagingContext.Provider value={{ connected, unread, lastMessage, send, broadcast, markRead, setUnread }}>
      {children}
    </MessagingContext.Provider>
  );
}
