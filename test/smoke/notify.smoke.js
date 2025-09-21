// Smoke test: connect as admin socket, create a customer, expect 'customer.created' event and persisted notification
const io = require('socket.io-client');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const SERVER = process.env.SERVER || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';

async function main() {
	const token = jwt.sign({ role: 'admin' }, JWT_SECRET);
	console.log('Using token (truncated):', token.slice(0, 24) + '... (raw JWT)');

	// send raw token (server code expects raw token; sending 'Bearer ' causes internal error)
	const socket = io(SERVER, { auth: { token }, reconnectionDelayMax: 10000, transports: ['websocket'] });

	let gotEvent = false;

	socket.on('connect', () => {
		console.log('Socket connected id=', socket.id);
	});

	socket.on('connect_error', (err) => {
		console.error('Socket connect_error', err && err.message ? err.message : err);
	});

	socket.on('customer.created', (payload) => {
		console.log('Received customer.created payload:', payload);
		gotEvent = true;
	});

	socket.on('order.created', (payload) => {
		console.log('Received order.created payload:', payload);
	});

	// wait for socket to connect
	await new Promise((resolve) => {
		const timeout = setTimeout(() => {
			console.warn('Socket did not connect within 5s; continuing to attempt API call');
			resolve();
		}, 5000);
		socket.on('connect', () => { clearTimeout(timeout); resolve(); });
	});

	// create a customer to trigger notify in backend
	try {
		const resp = await axios.post(`${SERVER}/api/customers`, { nama: `smoke-${Date.now()}`, no_hp: '081200000000' }, { headers: { Authorization: `Bearer ${token}` } });
		console.log('Create customer response status=', resp.status, 'data=', resp.data);
	} catch (err) {
		console.error('Failed to create customer (this still may be fine):', err && err.response ? err.response.data : err.message);
	}

	// wait up to 8s for event to arrive
	const waited = await new Promise((resolve) => {
		let waitedMs = 0;
		const interval = setInterval(() => {
			if (gotEvent) { clearInterval(interval); resolve(true); }
			waitedMs += 500;
			if (waitedMs >= 8000) { clearInterval(interval); resolve(false); }
		}, 500);
	});

	if (waited) console.log('Realtime event received.'); else console.warn('No realtime event received within timeout.');

	// Query notifications API for role:admin
	try {
		const resp = await axios.get(`${SERVER}/api/notifications?recipient_type=role&recipient_id=admin&limit=10`, { headers: { Authorization: `Bearer ${token}` } });
		console.log('Notifications API response count=', Array.isArray(resp.data.data) ? resp.data.data.length : 'unknown');
		console.log(JSON.stringify(resp.data, null, 2));
	} catch (err) {
		console.error('Failed to query notifications:', err && err.response ? err.response.data : err.message);
	}

	socket.close();
	process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });