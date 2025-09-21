// Simple React hook + demo component for testing BE notifications
// Usage: copy this file into your React project and use <NotificationDemo token="<JWT>" />

import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export function useNotifications(token, url = (process.env.REACT_APP_API_URL || 'http://localhost:3000')) {
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!token) return;
    const socket = io(url, { auth: { token }, transports: ['websocket'] });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', (err) => console.error('socket connect_error', err));

    // register general handlers
    const handler = (eventName) => (payload) => setEvents(ev => [{ event: eventName, payload, received_at: new Date().toISOString() }, ...ev]);

    const eventsToListen = ['customer.created', 'customer.updated', 'order.created', 'order.updated', 'order.status_bot.updated', 'invoice.notify'];
    eventsToListen.forEach(e => socket.on(e, handler(e)));

    return () => {
      eventsToListen.forEach(e => socket.off(e));
      socket.disconnect();
    };
  }, [token, url]);

  return { connected, events };
}

export function NotificationDemo({ token }) {
  const { connected, events } = useNotifications(token);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 12 }}>
      <h3>Notification Demo</h3>
      <p>Socket connected: {connected ? 'Yes' : 'No'}</p>
      <p>Paste your JWT token into <code>token</code> prop when rendering this component.</p>
      <h4>Events (latest first)</h4>
      <div style={{ maxHeight: 400, overflow: 'auto', border: '1px solid #ddd', padding: 8 }}>
        {events.length === 0 && <div>No events yet</div>}
        {events.map((ev, i) => (
          <div key={i} style={{ padding: 8, borderBottom: '1px solid #eee' }}>
            <div><strong>{ev.event}</strong> <small>{ev.received_at}</small></div>
            <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify(ev.payload, null, 2)}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}
