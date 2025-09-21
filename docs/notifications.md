Notifications in api-cs-printer

Overview
--------
This document describes realtime notification events (Socket.IO) and persisted Notification rows used by the admin UI and other consumers.

Where to find notification logic
- Realtime emits and persistence are implemented across controllers in `src/controllers/*`.
- Persisted notifications are stored using `src/models/notification.js` and created via `Notification.create(...)`.
- Socket.IO instance is stored in Express `app` and accessed via `req.app.get('io')` in controllers.

Events emitted (and payload shapes)
-----------------------------------
1) customer.created
- Emitted in: `src/controllers/customerController.js` (createCustomer)
- Emitted to rooms: `user:{id_customer}`, `role:admin`
- Payload:
  {
    id_customer: number,
    nama: string,
    no_hp: string,
    timestamp: ISOString
  }
- Persisted: Notification rows for both user and admin with title 'Customer created'.

2) customer.updated
- Emitted in: `src/controllers/customerController.js` (updateCustomer)
- Emitted to rooms: `user:{id_customer}`, `role:admin`
- Payload: same as customer.created
- Persisted: Notification rows for both user and admin with title 'Customer updated'.

3) order.created
- Emitted in: `src/controllers/orderController.js` (createOrder)
- Emitted to rooms: `user:{id_customer}`, `role:admin`
- Payload:
  {
    id_order: number,
    no_transaksi: string,
    id_customer: number,
    total_bayar: number,
    status_bot: string,
    timestamp: ISOString
  }
- Persisted: Notification rows for both user and admin with title 'Order created'.

4) order.updated
- Emitted in: `src/controllers/orderController.js` (updateOrder and updateOrderByNoTransaksi)
- Emitted to rooms: `user:{id_customer}`, `role:admin`
- Payload: same as order.created (with updated totals)
- Persisted: Notification rows for both user and admin with title 'Order updated'.

5) order.status_bot.updated
- Emitted in: `src/controllers/orderController.js` (updateStatusBotByNoTransaksi)
- Emitted to rooms: `user:{id_customer}`, `role:admin`
- Payload:
  {
    id_order: number,
    no_transaksi: string,
    id_customer: number,
    status_bot: string,
    timestamp: ISOString
  }
- Persisted: Notification rows for both user and admin with title 'Order bot status updated'.

6) payment.created / payment.updated
- Emitted via helper: `src/controllers/paymentController.js` function `emitPaymentEvent(app, payment, event)`.
- Emitted to rooms: `user:{customerId}`, `role:admin`
- Payload:
  {
    id_payment: number,
    no_transaksi: string,
    nominal: number,
    status: string,
    timestamp: ISOString
  }
- Persisted: Notification rows for both user and admin with title `Payment ${event}`.

7) invoice.notify
- Emitted after `sendInvoiceWebhook` succeeds (paymentController)
- Emitted to rooms: `user:{id_customer}`, `role:admin`
- Payload: { no_transaksi, invoice_url, status: 'sent', timestamp }
- Persisted: Notification rows with title 'Invoice sent'.

Implementation notes & recommendations
--------------------------------------
- Socket rooms convention: `user:{id}` for targeting a single customer's sockets; `role:admin` for admin users.
- Controllers use try/catch to avoid failing main workflows if notification persistence fails.
- Notification creation is non-blocking (errors are swallowed). Consider centralized logging or queueing (e.g., job queue) if notifications are critical.
- For any new endpoints that change customer/order/payment state, call the same emit + Notification.create pattern.

How to listen (frontend)
------------------------
- Connect to Socket.IO and join rooms on the server side based on authenticated user and role.
- Listen for the events above, e.g. `socket.on('payment.created', handler)`.

Files modified during the notification sweep
- `src/controllers/customerController.js` — added emit + Notification on customer update
- `src/controllers/orderController.js` — added emit + Notification on update-by-no_transaksi and status_bot update

If you want
-----------
- I can make a small helper `notify(app, recipientType, recipientId, event, payload, title)` to avoid duplication across controllers.
- Add unit/smoke tests that simulate emits using a mocked `req.app.get('io')` and check `Notification.create` calls.

"Done" checklist
- [x] Add emits for customer.update
- [x] Add emits for order.updateByNoTransaksi and order.status_bot update
- [x] Documented events + payloads in this file

Quick start (for Frontend / other consumers)
-------------------------------------------
Goal: connect a Socket.IO client and receive realtime events, and optionally read persisted notifications via HTTP API.

1) Authentication & handshake
- The server expects a JWT token in the Socket.IO handshake under `auth.token` (raw token string). Do NOT prefix the token with `Bearer ` when passing it in the socket auth. Example payload when creating the token:

  - For admin (receive `role:admin` events/rooms): { role: 'admin' }
  - For internal user: { id_user: 123 }
  - For customer: { id_customer: 456 }

  The server uses the same JWT secret as the REST API (`process.env.JWT_SECRET` or default `secretkey`).

2) Room and event conventions
- Rooms used by the server (so clients will automatically join on connect):
  - `customer:<id>` — sockets for a customer (when token contains `id_customer`)
  - `internal:<id>` — sockets for internal user (if your token contains `id_user`)
  - `role:admin` — admin user room (if token contains `role: 'admin'`)

- Events are emitted to either `user` rooms (customer) and `role` rooms (admin) depending on the action. Controllers call a central helper `notify(app, recipientType, recipientId, event, payload, title)` which:
  - Emits the event over Socket.IO to the room (if `app.get('io')` exists)
  - Persists a Notification row via `Notification.create(...)`

3) Minimal frontend example (browser or Node) — raw JWT in handshake

Browser (socket.io client):

```javascript
// Example using socket.io-client in browser or build tooling
import { io } from 'socket.io-client';

const token = '<JWT_RAW_TOKEN>'; // don't prefix with 'Bearer '
const socket = io('https://api.example.com', { auth: { token } });

socket.on('connect', () => console.log('connected', socket.id));
socket.on('connect_error', (err) => console.error('connect_error', err.message));

// Listen for events you care about:
socket.on('order.created', (payload) => console.log('order.created', payload));
socket.on('customer.created', (payload) => console.log('customer.created', payload));
socket.on('invoice.notify', (payload) => console.log('invoice.notify', payload));
```

Node (server-side listener or quick test):

```javascript
const { io } = require('socket.io-client');
const token = '<JWT_RAW_TOKEN>';
const socket = io('http://localhost:3000', { auth: { token } });
socket.on('connect', () => console.log('connected', socket.id));
socket.on('customer.created', console.log);
```

4) Notification REST API (read / mark read)
- GET notifications
  - Endpoint: GET /api/notifications
  - Query params: `recipient_type` and `recipient_id` OR rely on Authorization Bearer token to infer recipient
  - Examples:

    - As admin (with Authorization header containing admin JWT):
      GET /api/notifications?limit=20

    - Or explicitly for a user:
      GET /api/notifications?recipient_type=user&recipient_id=5

- Mark notification as read
  - Endpoint: PUT /api/notifications/:id/read

5) Typical event contracts (quick reference)
- customer.created
  - rooms: `customer:<id_customer>`, `role:admin`
  - payload: { id_customer, nama, no_hp, timestamp }

- customer.updated
  - rooms: same as above

- order.created / order.updated
  - rooms: `customer:<id_customer>`, `role:admin`
  - payload: { id_order, no_transaksi, id_customer, total_bayar, status_bot, timestamp }

- order.status_bot.updated
  - payload: { id_order, no_transaksi, id_customer, status_bot, timestamp }

- invoice.notify
  - payload: { no_transaksi, invoice_url, status: 'sent', timestamp }

6) How backend persists recipient_id
- Implementation note: the `notify` helper persists `recipient_id` as a namespaced string for clarity in some cases (e.g., `customer:123`), and plain strings for role (e.g., `admin`). When calling the notifications list endpoint without a token, pass the same `recipient_id` value used when persisting (or use a token so the controller infers recipient automatically).

7) Troubleshooting
- Socket handshake returns "Authentication error": ensure you send raw token in `auth.token` and token is signed with same `JWT_SECRET` as server.
- You connected but do not receive events: verify your token includes `id_customer`/`id_user`/`role` as appropriate so server will join the socket to the correct room; also check server logs (it prints `socket connected user=` and `socket rooms=` on connect).
- Notifications missing in API: check DB connection and ensure server is not running in `NODE_ENV=test` (in test mode DB sync is skipped). Check server logs for `notify persist error` messages.

8) Optional improvements (suggestions for future)
- Add a small server-side `/api/notifications/subscribe` sample that returns socket token (or socket URL) for easier FE onboarding.
- Add example client code snippets to the frontend repo and a small integration test in CI that runs the smoke test.
- Normalize `recipient_id` storage (either always numeric + type, or always namespaced string) and update read API to accept both forms.

Contact
-------
If anything unclear, ping backend team in Slack (channel #backend) or open an issue in the repo with "notifications" tag and include the token payload you used and server logs.

----

Edited: improved quickstart, handshake, example clients, APIs, and troubleshooting tips.

