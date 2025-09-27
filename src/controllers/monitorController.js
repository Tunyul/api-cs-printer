const os = require('os');

const promClient = require('prom-client');

// init Prometheus metrics (singleton)
let metricsInitialized = false;
let gaugeSocketCount, gaugeNotifCount, collectDefault;

function initMetrics() {
  if (metricsInitialized) return;
  collectDefault = promClient.collectDefaultMetrics({ timeout: 5000 });
  gaugeSocketCount = new promClient.Gauge({ name: 'cukong_socket_connected_count', help: 'Number of connected sockets (this instance)' });
  gaugeNotifCount = new promClient.Gauge({ name: 'cukong_notifications_count', help: 'Number of notifications (latest snapshot)' });
  metricsInitialized = true;
}

async function getSnapshot(app) {
  const io = app.get && app.get('io');
  const models = app.get && app.get('models');

  const proc = {
    pid: process.pid,
    uptime_s: Math.floor(process.uptime()),
    memory: process.memoryUsage(),
    platform: process.platform,
    node_version: process.version,
    env: {
      PORT: process.env.PORT || null,
      NODE_ENV: process.env.NODE_ENV || null,
      APP_URL: process.env.APP_URL || null
    }
  };

  const sockets = {
    enabled: !!io,
    connected_count: 0,
    rooms: []
  };
  if (io) {
    try {
      const socketsMap = io.sockets && io.sockets.sockets;
      sockets.connected_count = socketsMap ? (socketsMap.size || Object.keys(socketsMap).length) : 0;

      const adapter = io.of && io.of('/').adapter;
      if (adapter && adapter.rooms) {
        for (const [room, setLike] of adapter.rooms.entries()) {
          if (socketsMap && (socketsMap.get ? socketsMap.get(room) : socketsMap[room])) continue;
          const size = setLike && (setLike.size || (Array.isArray(setLike) ? setLike.length : Object.keys(setLike).length)) || 0;
          sockets.rooms.push({ room, size });
        }
      }
    } catch (e) {
      // ignore
    }
  }

  let notifications = [];
  try {
    if (models && models.Notification && models.Notification.findAll) {
      const rows = await models.Notification.findAll({ limit: 10, order: [['created_at', 'DESC']] });
      notifications = rows.map(r => r.toJSON ? r.toJSON() : r);
    }
  } catch (e) {}

  // update Prometheus gauges if initialized
  try {
    initMetrics();
    if (gaugeSocketCount) gaugeSocketCount.set(sockets.connected_count || 0);
    if (gaugeNotifCount) gaugeNotifCount.set(notifications.length || 0);
  } catch (e) {}

  const server_ts = new Date().toISOString();

  return { proc, sockets, notifications, server_ts };
}

async function monitor(req, res) {
  try {
    const snapshot = await getSnapshot(req.app);
    return res.json(snapshot);
  } catch (err) {
    return res.status(500).json({ error: err && err.message ? err.message : String(err) });
  }
}

// SSE stream: sends JSON snapshots periodically until client disconnects
function sseStream(req, res) {
  // headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders && res.flushHeaders();

  let isClosed = false;
  const sendSnapshot = async () => {
    try {
      const snapshot = await getSnapshot(req.app);
      const payload = JSON.stringify(snapshot);
      res.write(`data: ${payload}\n\n`);
    } catch (e) {
      try { res.write(`event: error\ndata: ${JSON.stringify({ error: String(e) })}\n\n`); } catch (er) {}
    }
  };

  // send initial snapshot immediately
  sendSnapshot();
  const iv = setInterval(() => { if (!isClosed) sendSnapshot(); }, 2000);

  req.on('close', () => {
    isClosed = true;
    clearInterval(iv);
  });
}

// expose metrics as text/plain for Prometheus
async function metricsHandler(req, res) {
  try {
    initMetrics();
    const metrics = await promClient.register.metrics();
    res.setHeader('Content-Type', promClient.register.contentType);
    res.send(metrics);
  } catch (e) {
    res.status(500).send('metrics error: ' + String(e));
  }
}

// Serve a minimal live HTML page that consumes the SSE stream
function livePage(req, res) {
  // Capture monitor_key from query so we can wire it into the EventSource URL
  const monitorKeyParam = req.query && req.query.monitor_key ? '?monitor_key=' + encodeURIComponent(req.query.monitor_key) : '';

  const html = `<!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <title>Cukong API Monitor - Live</title>
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <style>
      :root{--bg:#0f1720;--card:#0b1220;--muted:#94a3b8;--accent:#06b6d4;--ok:#10b981;--bad:#ef4444}
      html,body{height:100%;margin:0;font-family:Inter,system-ui,Segoe UI,Arial,sans-serif;background:linear-gradient(180deg,#071124 0%, #071622 100%);color:#e6eef6}
      .wrap{max-width:1100px;margin:18px auto;padding:18px}
      header{display:flex;align-items:center;justify-content:space-between}
      h1{font-size:18px;margin:0}
      .meta{display:flex;gap:12px;align-items:center}
      .badge{background:var(--card);padding:6px 10px;border-radius:8px;color:var(--muted);font-size:13px}
      .status{display:inline-block;padding:6px 10px;border-radius:999px;color:#042322;font-weight:600}
      .status.ok{background:var(--ok)}
      .status.off{background:var(--bad)}
      main{display:grid;grid-template-columns:1fr 420px;gap:16px;margin-top:16px}
      .card{background:rgba(255,255,255,0.03);padding:12px;border-radius:8px}
      .card h3{margin:0 0 8px 0;font-size:14px;color:var(--muted)}
      table{width:100%;border-collapse:collapse;font-size:13px}
      th,td{padding:8px;border-bottom:1px solid rgba(255,255,255,0.03);text-align:left}
      th{color:var(--muted);font-weight:600}
      pre.json{background:#021124;color:#dbeafe;padding:10px;border-radius:6px;overflow:auto;max-height:260px}
      .small{font-size:12px;color:var(--muted)}
      footer{margin-top:14px;color:var(--muted);font-size:13px}
      .tools{display:flex;gap:8px}
      button{background:transparent;border:1px solid rgba(255,255,255,0.04);color:var(--muted);padding:6px 8px;border-radius:6px;cursor:pointer}
    </style>
  </head>
  <body>
    <div class="wrap">
      <header>
        <div>
          <h1>Cukong API — Live Monitor</h1>
          <div class="small">Real-time snapshot of process, Socket.IO and recent notifications</div>
        </div>
        <div class="meta">
          <div class="badge">Port <span id="port">-</span></div>
          <div class="badge">PID <span id="pid">-</span></div>
          <div id="connStatus" class="status off">OFF</div>
        </div>
      </header>

      <main>
        <section>
          <div class="card">
            <h3>Process</h3>
            <div>Uptime: <strong id="uptime">-</strong>s</div>
            <div>Memory RSS: <strong id="rss">-</strong></div>
            <div class="small">Node: <span id="nodever">-</span></div>
          </div>

          <div class="card" style="margin-top:12px">
            <h3>Rooms</h3>
            <table id="roomsTable">
              <thead><tr><th>Room</th><th>Size</th></tr></thead>
              <tbody><tr><td colspan="2" class="small">-</td></tr></tbody>
            </table>
          </div>

          <div class="card" style="margin-top:12px">
            <h3>Recent Notifications</h3>
            <table id="notifTable">
              <thead><tr><th>ID</th><th>Time</th><th>Title</th><th>Recipient</th><th>Data</th></tr></thead>
              <tbody><tr><td colspan="5" class="small">-</td></tr></tbody>
            </table>
          </div>
        </section>

        <aside>
          <div class="card">
            <h3>Live JSON Preview</h3>
            <div class="small">Last update: <span id="lastUpdate">-</span></div>
            <pre id="jsonPreview" class="json">-</pre>
            <div style="margin-top:8px" class="tools">
              <button id="btnCopy">Copy JSON</button>
              <button id="btnClear">Clear</button>
            </div>
          </div>
        </aside>
      </main>

      <footer>
        Tip: use SSH tunnel for secure remote access. Close this page to stop live stream.
      </footer>
    </div>

    <script>
  const preview = document.getElementById('jsonPreview');
      const pidEl = document.getElementById('pid');
      const portEl = document.getElementById('port');
      const uptimeEl = document.getElementById('uptime');
      const rssEl = document.getElementById('rss');
      const nodeverEl = document.getElementById('nodever');
      const conn = document.getElementById('connStatus');
      const lastUpdate = document.getElementById('lastUpdate');
  // latency display
  const latencyEl = document.createElement('div'); latencyEl.className='small'; latencyEl.style.marginTop='8px'; document.querySelector('.card').appendChild(latencyEl);

      function humanBytes(n){ if(!n && n!==0) return '-'; const units=['B','KB','MB','GB']; let i=0; let v=n; while(v>=1024 && i<units.length-1){ v/=1024;i++; } return Math.round(v*10)/10 + units[i]; }

  function renderRooms(rooms){ const tb=document.querySelector('#roomsTable tbody'); tb.innerHTML=''; if(!rooms || rooms.length===0){ tb.innerHTML='<tr><td colspan="2" class="small">no rooms</td></tr>'; return; } for(const r of rooms){ const tr=document.createElement('tr'); tr.innerHTML = '<td>' + r.room + '</td><td>' + r.size + '</td>'; tb.appendChild(tr); } }

  function renderNotifs(notifs){ const tb=document.querySelector('#notifTable tbody'); tb.innerHTML=''; if(!notifs || notifs.length===0){ tb.innerHTML='<tr><td colspan="5" class="small">no notifications</td></tr>'; return; } for(const n of notifs){ const tr=document.createElement('tr'); const t=(n.created_at||n.updated_at||''); tr.innerHTML = '<td>' + (n.id_notification||'') + '</td><td>' + t + '</td><td>' + (n.title||'') + '</td><td>' + (n.recipient_id||'') + '</td><td><details><summary style="cursor:pointer">preview</summary><pre style="margin:6px;background:#021124;color:#dbeafe;padding:6px;border-radius:6px">' + (JSON.stringify(n.data||n.body||{},null,2)) + '</pre></details></td>'; tb.appendChild(tr); } }

      // SSE connection with auto-reconnect
      let es;
      function start() {
        try {
          // include monitor_key query param when provided by the server-side page
          es = new EventSource('/internal/monitor/sse${monitorKeyParam}');
        } catch(e){ console.error(e); setStatus(false); return; }
  setStatus(true);
  es.onmessage = function(e){ try { const d = JSON.parse(e.data); pidEl.textContent = d.proc.pid || '-'; portEl.textContent = (d.proc.env && d.proc.env.PORT) || '-'; uptimeEl.textContent = d.proc.uptime_s || '-'; rssEl.textContent = humanBytes(d.proc.memory && d.proc.memory.rss); nodeverEl.textContent = d.proc.node_version || '-'; renderRooms(d.sockets && d.sockets.rooms); renderNotifs(d.notifications); preview.textContent = JSON.stringify(d, null, 2); lastUpdate.textContent = new Date().toLocaleString(); if(d.server_ts){ const serverTs=new Date(d.server_ts).getTime(); const now=Date.now(); latencyEl.textContent = 'Latency: '+(now-serverTs)+' ms'; } } catch(err){ console.error(err); } };
        es.onerror = function(err){ console.error('SSE error', err); setStatus(false); try{ es.close && es.close(); }catch(e){}; setTimeout(()=>{ start(); }, 2000); };
      }

      function setStatus(ok){ if(ok){ conn.classList.remove('off'); conn.classList.add('ok'); conn.textContent='LIVE'; } else { conn.classList.remove('ok'); conn.classList.add('off'); conn.textContent='DISCONNECTED'; } }

      document.getElementById('btnCopy').onclick = ()=>{ try{ navigator.clipboard.writeText(preview.textContent); alert('JSON copied to clipboard'); }catch(e){ alert('Copy failed: '+e); }};
      document.getElementById('btnClear').onclick = ()=>{ preview.textContent='-'; document.querySelector('#roomsTable tbody').innerHTML='<tr><td colspan="2" class="small">-</td></tr>'; document.querySelector('#notifTable tbody').innerHTML='<tr><td colspan="5" class="small">-</td></tr>'; };

      start();
    </script>
  </body>
  </html>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
}

module.exports = { monitor, sseStream, livePage, metricsHandler };
