// Helper: notify(app, recipientType, recipientId, event, payload, title)
// recipientType: 'user' | 'role'
// recipientId: string or number
module.exports = async function notify(app, recipientType, recipientId, event, payload, title) {
  try {
    if (!app || !recipientType || !recipientId || !event) return false;
    const io = app.get && app.get('io');
    // Per configuration: customer notifications are disabled — skip any user-targeted notifs
    if (recipientType === 'user') {
      console.log(`notify: skipping customer notification for id=${recipientId} (customer notifications are disabled)`);
      return true;
    }
    // emit via socket.io if available
    try {
      if (io) {
        // Standardize room naming: 'customer:<id>' for customers, 'internal:<id>' for internal users, 'role:<id>' for roles
        let room;
        if (recipientType === 'user') {
          // decide namespace: if recipientId looks like a number assume customer namespace
          // callers should pass numeric id for customers and internal users; prefer explicit use of 'customer'/'internal' where possible
          // here we treat recipientId as numeric customer id by default
          room = `customer:${recipientId}`;
        } else {
          room = `role:${recipientId}`;
        }
        try {
          // emit
          io.to && io.to(room) && io.to(room).emit && io.to(room).emit(event, payload);
          // report how many sockets are in the room (socket.io v4)
          try {
            const clients = await io.in(room).allSockets();
            console.log(`notify: emitted event=${event} to=${room} clients=${clients ? clients.size : 0}`);
          } catch (countErr) {
            console.log(`notify: emitted event=${event} to=${room}`);
          }
        } catch (emitErr) {
          console.error('notify emit error', emitErr && emitErr.message ? emitErr.message : emitErr);
        }
      }
    } catch (e) {
      console.error('notify emit outer error', e && e.message ? e.message : e);
    }

    // persist notification row if models available
    try {
      const models = (app.get && app.get('models')) || require('../models');
      const Notification = models.Notification;
      if (Notification && Notification.create) {
        const now = new Date();
        // Persist recipient_id as namespaced string for clarity (e.g., 'customer:123' or 'internal:45' or 'role:admin')
        let persistedRecipientId = recipientType === 'user' ? `customer:${recipientId}` : String(recipientId);
        if (recipientType !== 'user' && typeof recipientId === 'string') persistedRecipientId = recipientId; // role:admin remains 'admin'
        await Notification.create({ recipient_type: recipientType, recipient_id: String(persistedRecipientId), title: title || event, body: JSON.stringify(payload), data: payload, read: false, created_at: now, updated_at: now });
      }
    } catch (e) {
      console.error('notify persist error', e && e.message ? e.message : e);
    }

    return true;
  } catch (err) {
    console.error('notify error', err && err.message ? err.message : err);
    return false;
  }
};
