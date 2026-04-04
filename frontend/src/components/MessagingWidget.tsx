'use client';

/**
 * FloatingMessagingWidget — bottom-right chat for regular users.
 * Shows a "Support" conversation with a red unread badge.
 * Admin users are excluded (they have their own inbox in /admin).
 */

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useMessaging } from '@/context/MessagingContext';
import api from '@/services/api';
import type { Message } from '@/types';

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export default function MessagingWidget() {
  const { user } = useAuth();
  const { unread, lastMessage, send, markRead } = useMessaging();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const visible = !!user && !user.is_staff && !user.is_superuser;

  // Load history when widget opens for the first time
  useEffect(() => {
    if (!visible || !open || messages.length > 0) return;
    setLoading(true);
    api.getMyMessages()
      .then(setMessages)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, visible]); // eslint-disable-line react-hooks/exhaustive-deps

  // Append real-time messages
  useEffect(() => {
    if (!visible || !lastMessage) return;
    setMessages((prev) => {
      if (prev.some((m) => m.id === lastMessage.id)) return prev;
      return [...prev, lastMessage];
    });
  }, [lastMessage, visible]);

  // Scroll to bottom
  useEffect(() => {
    if (!visible) return;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open, visible]);

  // All hooks above — conditional render below is safe
  if (!visible) return null;

  function handleOpen() {
    setOpen(true);
    markRead();
  }

  function handleClose() {
    setOpen(false);
  }

  function handleSend() {
    const content = input.trim();
    if (!content) return;
    send(content);
    setInput('');
  }

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1050 }}>
      {/* Chat panel */}
      {open && (
        <div
          className="card border-0 shadow rounded-4 d-flex flex-column"
          style={{ width: 340, height: 480, marginBottom: 12 }}
        >
          {/* Header */}
          <div
            className="d-flex align-items-center justify-content-between px-3 py-2 rounded-top-4"
            style={{ background: '#A31F34', color: '#fff', flexShrink: 0 }}
          >
            <div className="d-flex align-items-center gap-2">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.2)' }}
              >
                <i className="bi bi-headset fs-6" />
              </div>
              <div>
                <div className="fw-semibold" style={{ fontSize: '0.9rem' }}>Support</div>
                <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>ScholarAid team</div>
              </div>
            </div>
            <button
              className="btn btn-sm p-0"
              style={{ color: '#fff', opacity: 0.8 }}
              onClick={handleClose}
            >
              <i className="bi bi-x-lg" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-grow-1 overflow-auto p-3 d-flex flex-column gap-2"
            style={{ background: '#f8f9fa' }}>
            {loading ? (
              <div className="text-center text-muted small pt-4">Loading…</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-muted small pt-4">
                <i className="bi bi-chat-dots d-block fs-3 mb-2 opacity-50" />
                Send us a message — we're here to help!
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`d-flex ${m.is_mine ? 'justify-content-end' : 'justify-content-start'}`}>
                  <div
                    className="rounded-3 px-3 py-2"
                    style={{
                      maxWidth: '78%',
                      background: m.is_mine ? '#A31F34' : '#fff',
                      color: m.is_mine ? '#fff' : '#212529',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                      fontSize: '0.875rem',
                    }}
                  >
                    {!m.is_mine && (
                      <div className="fw-semibold mb-1" style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                        {m.sender_name}
                      </div>
                    )}
                    <div>{m.content}</div>
                    <div className="mt-1 text-end" style={{ fontSize: '0.62rem', opacity: 0.65 }}>
                      {fmtTime(m.created_at)}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-2 border-top d-flex gap-2" style={{ flexShrink: 0 }}>
            <input
              type="text"
              className="form-control form-control-sm rounded-pill"
              placeholder="Type a message…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button
              className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ width: 34, height: 34, background: '#A31F34', color: '#fff' }}
              onClick={handleSend}
              disabled={!input.trim()}
            >
              <i className="bi bi-send-fill" style={{ fontSize: '0.75rem' }} />
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        className="btn rounded-circle d-flex align-items-center justify-content-center shadow"
        style={{ width: 56, height: 56, background: '#A31F34', color: '#fff', position: 'relative' }}
        onClick={open ? handleClose : handleOpen}
        title="Support chat"
      >
        <i className={`bi ${open ? 'bi-x-lg' : 'bi-chat-dots-fill'} fs-5`} />
        {!open && unread > 0 && (
          <span
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning text-dark"
            style={{ fontSize: '0.65rem' }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
    </div>
  );
}
