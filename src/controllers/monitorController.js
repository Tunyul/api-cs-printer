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
  // Capture monitor_key from query so the page can prefill it (we'll store it in sessionStorage)
  const monitorKeyFromQuery = req.query && req.query.monitor_key ? req.query.monitor_key : '';

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

  // --- Lightweight inline canvas chart (no external deps) ---
  const chartCard = document.createElement('div'); chartCard.className='card'; chartCard.style.marginTop='12px';
  chartCard.innerHTML = '<h3>Live chart</h3><div style="height:180px;background:linear-gradient(180deg, rgba(255,255,255,0.01), rgba(255,255,255,0.00));padding:6px;border-radius:6px"><canvas id="liveChart" style="width:100%;height:180px;display:block"></canvas></div>';
  // insert at the top of the left column so it's immediately visible
  const leftCol = document.querySelector('section');
  if (leftCol && leftCol.firstChild) leftCol.insertBefore(chartCard, leftCol.firstChild);
  else if (leftCol) leftCol.appendChild(chartCard);

  const maxPoints = 30;
  const sockData = Array.from({length: maxPoints}, () => null);
  const notifData = Array.from({length: maxPoints}, () => null);
  const timeLabels = Array.from({length: maxPoints}, () => '');
  const canvas = document.getElementById('liveChart');
  const ctx = canvas.getContext && canvas.getContext('2d');
  if (canvas && canvas.style) canvas.style.border = '1px solid rgba(255,255,255,0.06)';
  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(300, Math.floor(rect.width));
    canvas.height = Math.max(120, Math.floor(rect.height));
  }
  function drawChart() {
    if (!ctx) return;
    resizeCanvas();
    // clear
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // background grid
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    const w = canvas.width, h = canvas.height;
    const pad = 8;
    const innerW = w - pad*2;
    const innerH = h - pad*2;
    // compute ranges
    const merged = sockData.concat(notifData).filter(v => typeof v === 'number');
    const maxV = merged.length ? Math.max(...merged) : 1;
    const scale = maxV > 0 ? innerH / maxV : 1;

    function plotLine(data, color) {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      let started = false;
      for (let i=0;i<data.length;i++) {
        const v = data[i];
        const x = pad + (i/(maxPoints-1)) * innerW;
        const y = pad + innerH - ((typeof v === 'number' ? v : 0) * scale);
        if (!started) { ctx.moveTo(x,y); started = true; } else { ctx.lineTo(x,y); }
      }
      ctx.stroke();
    }

    // grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let i=0;i<=4;i++){
      const yy = pad + (i/4)*innerH;
      ctx.beginPath(); ctx.moveTo(pad, yy); ctx.lineTo(pad+innerW, yy); ctx.stroke();
    }

    // draw notif (green) then sockets (cyan) so sockets on top
    plotLine(notifData, '#10b981');
    plotLine(sockData, '#06b6d4');

    // legend
    ctx.fillStyle = '#94a3b8'; ctx.font = '12px sans-serif';
    ctx.fillText('Sockets', pad+4, pad+12); ctx.fillStyle='#06b6d4'; ctx.fillRect(pad, pad+4, 10,6);
    ctx.fillStyle = '#94a3b8'; ctx.fillText('Notifications', pad+80, pad+12); ctx.fillStyle='#10b981'; ctx.fillRect(pad+72, pad+4, 10,6);
  }

  // expose small update function
  function updateChart(sockCount, notifCount) {
    timeLabels.push(new Date().toLocaleTimeString());
    timeLabels.splice(0, timeLabels.length - maxPoints);
    sockData.push(sockCount); if (sockData.length>maxPoints) sockData.shift();
    notifData.push(notifCount); if (notifData.length>maxPoints) notifData.shift();
    drawChart();
  }

  // initial draw so the canvas is visible even before first SSE update
  try { drawChart(); } catch (e) { /* ignore */ }

      function humanBytes(n){ if(!n && n!==0) return '-'; const units=['B','KB','MB','GB']; let i=0; let v=n; while(v>=1024 && i<units.length-1){ v/=1024;i++; } return Math.round(v*10)/10 + units[i]; }

  function renderRooms(rooms){ const tb=document.querySelector('#roomsTable tbody'); tb.innerHTML=''; if(!rooms || rooms.length===0){ tb.innerHTML='<tr><td colspan="2" class="small">no rooms</td></tr>'; return; } for(const r of rooms){ const tr=document.createElement('tr'); tr.innerHTML = '<td>' + r.room + '</td><td>' + r.size + '</td>'; tb.appendChild(tr); } }

  function renderNotifs(notifs){ const tb=document.querySelector('#notifTable tbody'); tb.innerHTML=''; if(!notifs || notifs.length===0){ tb.innerHTML='<tr><td colspan="5" class="small">no notifications</td></tr>'; return; } for(const n of notifs){ const tr=document.createElement('tr'); const t=(n.created_at||n.updated_at||''); tr.innerHTML = '<td>' + (n.id_notification||'') + '</td><td>' + t + '</td><td>' + (n.title||'') + '</td><td>' + (n.recipient_id||'') + '</td><td><details><summary style="cursor:pointer">preview</summary><pre style="margin:6px;background:#021124;color:#dbeafe;padding:6px;border-radius:6px">' + (JSON.stringify(n.data||n.body||{},null,2)) + '</pre></details></td>'; tb.appendChild(tr); } }

      // SSE connection with auto-reconnect and client-side login
      let es;
      let connected = false;

      // We'll use server-side session auth. Check auth on load, POST /login to authenticate,
      // then open SSE without sending the key in query params.
      function start() {
        const url = '/internal/monitor/sse';
        try {
          es = new EventSource(url, { withCredentials: true });
        } catch(e){ console.error(e); setStatus(false); showLogin(); return; }
        setStatus(true);
        connected = true;
        btnConnect.textContent = 'Disconnect';
        es.onmessage = function(e){ try { const d = JSON.parse(e.data);
          pidEl.textContent = d.proc.pid || '-';
          portEl.textContent = (d.proc.env && d.proc.env.PORT) || '-';
          uptimeEl.textContent = d.proc.uptime_s || '-';
          rssEl.textContent = humanBytes(d.proc.memory && d.proc.memory.rss);
          nodeverEl.textContent = d.proc.node_version || '-';
          renderRooms(d.sockets && d.sockets.rooms);
          renderNotifs(d.notifications);
          preview.textContent = JSON.stringify(d, null, 2);
          lastUpdate.textContent = new Date().toLocaleString();
          if(d.server_ts){ const serverTs=new Date(d.server_ts).getTime(); const now=Date.now(); latencyEl.textContent = 'Latency: '+(now-serverTs)+' ms'; }
          // update inline chart
          try {
            const sockCount = (d.sockets && d.sockets.connected_count) || 0;
            const notifCount = (d.notifications && d.notifications.length) || 0;
            updateChart(sockCount, notifCount);
          } catch (chartErr) { console.warn('chart update failed', chartErr); }
        } catch(err){ console.error(err); } };
        es.onerror = function(err){ console.error('SSE error', err); setStatus(false); connected=false; try{ es.close && es.close(); }catch(e){}; setTimeout(()=>{ start(); }, 2000); };
      }

      function stop(){ if(es){ try{ es.close(); }catch(e){} es=null; } connected=false; setStatus(false); btnConnect.textContent='Connect'; }

      function setStatus(ok){ if(ok){ conn.classList.remove('off'); conn.classList.add('ok'); conn.textContent='LIVE'; } else { conn.classList.remove('ok'); conn.classList.add('off'); conn.textContent='DISCONNECTED'; } }

      // Login overlay
      const loginOverlay = document.createElement('div'); loginOverlay.style.position='fixed'; loginOverlay.style.inset='0'; loginOverlay.style.background='rgba(2,6,23,0.7)'; loginOverlay.style.display='flex'; loginOverlay.style.alignItems='center'; loginOverlay.style.justifyContent='center'; loginOverlay.style.zIndex='9999';
  loginOverlay.innerHTML = '<div style="background:#031124;padding:18px;border-radius:8px;min-width:320px;color:#dbeafe"><h3 style="margin:0 0 8px 0">Enter monitor key</h3><div style="margin-bottom:8px"><input id="monitorKeyInput" placeholder="monitor key" style="width:100%;padding:8px;border-radius:6px;border:1px solid rgba(255,255,255,0.05);background:#021124;color:#dbeafe"/></div><div style="display:flex;gap:8px;justify-content:flex-end"><button id="monitorKeySave" style="padding:8px 10px;border-radius:6px">Save</button><button id="monitorKeyCancel" style="padding:8px 10px;border-radius:6px">Close</button></div><div class="small" style="margin-top:8px;color:#94a3b8">Key is stored in sessionStorage for this tab only.</div></div>';
      document.body.appendChild(loginOverlay);
      const monitorKeyInput = loginOverlay.querySelector('#monitorKeyInput');
      const monitorKeySave = loginOverlay.querySelector('#monitorKeySave');
      const monitorKeyCancel = loginOverlay.querySelector('#monitorKeyCancel');

      function showLogin(prefill){ monitorKeyInput.value = prefill || ''; loginOverlay.style.display='flex'; }
      function hideLogin(){ loginOverlay.style.display='none'; }

      // when user saves key, POST to /internal/monitor/login to create server session
      monitorKeySave.onclick = async ()=>{
        const v = monitorKeyInput.value && monitorKeyInput.value.trim();
        if(!v) return alert('Please enter the key');
        try{
          const r = await fetch('/internal/monitor/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ monitor_key: v }) });
          if (!r.ok) { const t = await r.json().catch(()=>({})); return alert('Login failed: ' + (t && t.error ? t.error : r.status)); }
          hideLogin();
          // start SSE using session cookie
          start();
        }catch(e){ alert('Login request failed: ' + e); }
      };
      monitorKeyCancel.onclick = ()=>{ hideLogin(); };

      // Controls: connect/disconnect and metrics viewer
      const btnConnect = document.createElement('button'); btnConnect.textContent='Connect'; btnConnect.style.marginLeft='8px'; btnConnect.onclick = ()=>{ if(connected) stop(); else start(); };
      document.querySelector('.meta').appendChild(btnConnect);

      const btnMetrics = document.createElement('button'); btnMetrics.textContent='Metrics'; btnMetrics.style.marginLeft='8px';
      const metricsBox = document.createElement('pre'); metricsBox.className='json'; metricsBox.style.maxHeight='180px'; metricsBox.style.marginTop='8px'; metricsBox.style.display='none';
      document.querySelector('aside .card').appendChild(btnMetrics);
      document.querySelector('aside .card').appendChild(metricsBox);
      btnMetrics.onclick = async ()=>{
        try{
          metricsBox.style.display='block';
          const r = await fetch('/internal/monitor/metrics', { credentials: 'same-origin' });
          if(!r.ok){ if(r.status===403){ showLogin(); return; } metricsBox.textContent = 'metrics fetch failed: '+r.status; return; }
          const txt = await r.text();
          metricsBox.textContent = txt;
        }catch(e){ metricsBox.textContent = 'metrics fetch error: '+e; }
      };

      document.getElementById('btnCopy').onclick = ()=>{ try{ navigator.clipboard.writeText(preview.textContent); alert('JSON copied to clipboard'); }catch(e){ alert('Copy failed: '+e); }};
      document.getElementById('btnClear').onclick = ()=>{ preview.textContent='-'; document.querySelector('#roomsTable tbody').innerHTML='<tr><td colspan="2" class="small">-</td></tr>'; document.querySelector('#notifTable tbody').innerHTML='<tr><td colspan="5" class="small">-</td></tr>'; };

      start();
    </script>
  </body>
  </html>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
}

// Session login handler
async function login(req, res) {
  try {
    const key = process.env.MONITOR_KEY;
    if (!key) return res.status(400).json({ error: 'Monitor key not configured' });
    // Accept key from JSON body, form body, query param, or x-monitor-key header.
  const bodyKey = req.body && (req.body.monitor_key || req.body.key || req.body.password);
  const headerKey = req.headers && (req.headers['x-monitor-key'] || req.headers['x_monitor_key']);
  const queryKey = req.query && req.query.monitor_key;
  const provided = bodyKey || headerKey || queryKey;
  // debug logging to help diagnose mismatches
  try { console.debug('monitor login check', { envKey: key, provided, bodyKey, headerKey, queryKey }); } catch (e) {}
  if (!provided || provided !== key) return res.status(403).json({ error: 'Forbidden' });
    // mark session as authenticated
    if (req.session) req.session.monitor_authenticated = true;
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}

// Logout handler
async function logout(req, res) {
  try {
    if (req.session) req.session.monitor_authenticated = false;
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}

// export public handlers
module.exports = { monitor, sseStream, livePage, metricsHandler, login, logout };
