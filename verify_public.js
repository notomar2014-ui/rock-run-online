// Public-URL check: node verify_public.js wss://omarzapro-rock-run-online.hf.space [seconds=90]
// Host makes a room; 5 players join on fresh connections; then a NEW fresh connection tries the code every 10 s
// (spread over ~90 s, some in bursts of 5); the round starts; every player sends input and must move.
'use strict';
const WebSocket = require('ws'); const URL = process.argv[2], SECS = +(process.argv[3] || 90);
const sleep = ms => new Promise(r => setTimeout(r, ms)); let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
function client() { const ws = new WebSocket(URL), c = { ws, last: {}, snap: null }; ws.on('message', d => { const m = JSON.parse(d); c.last[m.t] = m; if (m.t === 's') c.snap = m; }); ws.on('error', () => {});
  c.send = o => ws.readyState === 1 && ws.send(JSON.stringify(o)); c.wait = async (ts, ms = 8000) => { const e = Date.now() + ms; while (Date.now() < e) { for (const t of ts) if (c.last[t]) return t; await sleep(20); } return 'timeout'; };
  c.open = new Promise((r, j) => { ws.on('open', r); ws.on('error', j); }); return c; }
const pos = (c, id) => { const p = c.snap && c.snap.p.find(p => p[0] === id); return p && [p[1], p[2]]; };
(async () => {
  const t0 = Date.now(); const h = client(); await h.open; h.send({ t: 'host', origin: 'verify' }); const code = (await h.wait(['hosted'], 15000)) === 'hosted' && h.last.hosted.code;
  ok(!!code, `host created room ${code} (${Date.now() - t0} ms incl. connect)`); if (!code) process.exit(1);
  const ps = []; for (let i = 0; i < 5; i++) { const p = client(); await p.open; p.send({ t: 'join', code, name: 'Player' + (i + 1) }); const r = await p.wait(['joined', 'error']); ok(r === 'joined', `player ${i + 1} joins on a fresh connection` + (r !== 'joined' ? ' -> ' + JSON.stringify(p.last.error || r) : '')); ps.push(p); }
  let tries = 0, good = 0; const end = Date.now() + SECS * 1000, extra = [];
  while (Date.now() < end) { const n = tries % 3 === 2 ? 5 : 1; const rs = await Promise.all([...Array(n)].map(async (_, k) => { const p = client(); try { await p.open; } catch { return 'connect-fail'; } p.send({ t: 'join', code, name: 'Late' + tries + k }); const r = await p.wait(['joined', 'error']); extra.push(p); return r; }));
    tries += n; good += rs.filter(r => r === 'joined').length; for (const p of extra.splice(0)) p.ws.close(); await sleep(10000); }
  ok(good === tries, `${good}/${tries} extra fresh joins over ${SECS}s succeeded (singles and bursts of 5)`);
  ok(h.ws.readyState === 1, 'host socket still open'); h.send({ t: 'start', duration: 120 });
  const st = await ps[0].wait(['start']); ok(st === 'start', 'round starts for players'); await sleep(2500);
  const before = ps.map(p => pos(p, p.last.joined.id)); for (let k = 0; k < 25; k++) { ps.forEach((p, i) => p.send({ t: 'in', mx: i % 2 ? -1 : 1, my: 0.3, a: 0, f: k % 5 === 0 ? 1 : 0, tool: 0, d: k === 3 ? 1 : 0 })); await sleep(66); }
  await sleep(300); const moved = ps.map((p, i) => { const a = before[i], b = pos(p, p.last.joined.id); return a && b ? Math.hypot(b[0] - a[0], b[1] - a[1]) : 0; });
  ok(moved.every(m => m > 150), 'all 5 players move when they send input: ' + moved.map(m => m.toFixed(0)).join(', '));
  ok(ps.every(p => p.snap && p.snap.p.length >= 5), 'every player sees all 5 players in the game state');
  console.log(fails ? `VERIFY: ${fails} failed` : 'VERIFY: all passed'); process.exit(fails ? 1 : 0);
})();
