// Automated edge-case checks against a real server (no browser): node edgetest.js
'use strict';
const { spawn } = require('child_process'), WebSocket = require('ws');
const PORT = 3312, URL = 'ws://localhost:' + PORT;
const srv = spawn('node', ['server.js'], { env: { ...process.env, RR_FAST: '1', PORT }, stdio: ['ignore', 'pipe', 'pipe'] });
let srvErr = ''; srv.stderr.on('data', d => srvErr += d);
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
function client() {
  const ws = new WebSocket(URL), c = { ws, msgs: [], last: {}, snap: null };
  ws.on('message', d => { const m = JSON.parse(d); c.last[m.t] = m; if (m.t === 's') c.snap = m; else c.msgs.push(m); });
  c.send = o => ws.readyState === 1 && ws.send(JSON.stringify(o));
  c.wait = async (t, ms = 3000) => { const e = Date.now() + ms; while (!c.last[t] && Date.now() < e) await sleep(20); return c.last[t]; };
  c.open = new Promise(r => ws.on('open', r)); return c;
}
const finiteSnap = s => s && s.p.every(p => p.every(v => Number.isFinite(v))) && s.b.every(b => b.every(Number.isFinite));
(async () => {
  await sleep(900);
  // empty room: start with 0 players must not crash
  const h0 = client(); await h0.open; h0.send({ t: 'host', origin: 'x' }); await h0.wait('hosted'); h0.send({ t: 'start', duration: 20 }); await sleep(600);
  ok(h0.last.start && !srvErr, 'start a round with 0 players');
  const h = client(); await h.open; h.send({ t: 'host', origin: 'x' }); const hosted = await h.wait('hosted'); const code = hosted.code;
  // wrong code
  const bad = client(); await bad.open; bad.send({ t: 'join', code: 'ZZZZ', name: 'x' }); ok((await bad.wait('error')) !== undefined, 'wrong code gives a friendly error');
  // long / html name
  const L = client(); await L.open; L.send({ t: 'join', code, name: '<b>Supercalifragilisticexpialidocious</b>"&' }); const lj = await L.wait('joined');
  ok(lj && lj.name.length <= 14 && !/[<>&"]/.test(lj.name), 'very long / HTML name is cleaned and cut: "' + (lj && lj.name) + '"');
  // duplicate names (more than 10 must not hang)
  const dups = []; for (let i = 0; i < 12; i++) { const c = client(); await c.open; c.send({ t: 'join', code, name: 'Omar' }); dups.push(c); }
  const names = []; for (const c of dups) { const j = await c.wait('joined'); names.push(j && j.name); }
  ok(new Set(names).size === 12 && names.every(Boolean), '12 players named "Omar" all get unique names: ' + names.join(','));
  // host refresh keeps the room
  const h2 = client(); await h2.open; h2.send({ t: 'host', origin: 'x', code, key: hosted.key }); const re = await h2.wait('hosted'); ok(re && re.code === code, 'host refresh reconnects to the same room');
  // many players: 30 bots
  for (let i = 0; i < 3; i++) h2.send({ t: 'bots', n: 10 }); h2.send({ t: 'botlevel', v: 'hard' }); await sleep(300);
  h2.send({ t: 'start', duration: 60 }); await sleep(1500);
  ok(h2.snap && h2.snap.p.length >= 40, 'room holds ' + (h2.snap && h2.snap.p.length) + ' players (13 kids + bots; the cap is 40)');
  // garbage input from a player
  const g = dups[0]; const gid = g.last.joined.id;
  g.send({ t: 'in', mx: 'x', my: null, a: 'NaN', f: 1, tool: 99, q: 1, d: 1 }); await sleep(200); g.send({ t: 'in', mx: 1e309, my: -1e309, a: 1e309, f: 1, tool: -5 }); await sleep(200);
  g.send({ t: 'in', mx: 1, my: 1, a: 0.5, f: 1, tool: 0, s: 1 }); for (let i = 0; i < 200; i++) g.send({ t: 'in', mx: 1, my: 0 }); // flood
  // watch combat for a few seconds
  let hits = 0, hpOk = true, finite = true, bounds = true, t0 = Date.now(), snaps = 0, gaps = 0, lastT = Date.now();
  while (Date.now() - t0 < 6000) { const s = h2.snap; h2.snap = null; if (s) { snaps++; const now = Date.now(); gaps = Math.max(gaps, now - lastT); lastT = now;
      hits += s.ev.filter(e => e.k === 'hit').length; finite = finite && finiteSnap(s);
      for (const p of s.p) { if (p[14] < 0 || p[14] > 100) hpOk = false; if (p[1] < 0 || p[1] > 3200 || p[2] < 0 || p[2] > 2000) bounds = false; } } await sleep(10); }
  ok(finite, 'all positions/numbers stay finite after NaN / Infinity / garbage input');
  ok(bounds, 'everyone stays inside the arena');
  ok(hpOk, 'health always between 0 and 100');
  ok(hits > 0, 'bots fight with the new health system (' + hits + ' hits in 6 s)');
  ok(snaps > 70 && gaps < 400, `server keeps up with 40+ players: ${snaps} snapshots in 6 s, worst gap ${gaps} ms`);
  // leave mid-round and rejoin with token
  const tok = L.last.joined.token, lid = L.last.joined.id; L.ws.close(); await sleep(800);
  const gone = h2.last.roster.players.find(p => p.id === lid), sp = h2.snap || (await sleep(200), h2.snap);
  ok(gone && gone.on === false, 'player who leaves is marked offline');
  ok(sp && !(sp.p.find(p => p[0] === lid)[4] & 1), 'offline player is removed from the arena (not a free target)');
  const L2 = client(); await L2.open; L2.send({ t: 'join', code, name: 'whatever', token: tok }); const rj = await L2.wait('joined'); await sleep(600);
  const sp2 = h2.snap; ok(rj && rj.id === lid && sp2 && (sp2.p.find(p => p[0] === lid)[4] & 1), 'rejoining with the same tab gets the same player back, alive');
  // kicked player keeps sending input
  h2.send({ t: 'kick', id: dups[1].last.joined.id }); await sleep(100); dups[1].send({ t: 'in', mx: 1, my: 1, a: 0, f: 1 }); await sleep(200);
  ok(!srvErr, 'kicked player sending input does not crash the server');
  // end + lobby + restart
  h2.send({ t: 'endnow' }); await sleep(300); h2.send({ t: 'lobby' }); await sleep(200); h2.send({ t: 'clearbots' }); h2.send({ t: 'start', duration: 20 }); await sleep(800);
  ok(h2.snap && finiteSnap(h2.snap) && !srvErr, 'end → lobby → clear bots → start again works');
  ok(!srvErr, 'no server errors' + (srvErr ? ': ' + srvErr.slice(0, 300) : ''));
  console.log(fails ? `EDGE TESTS: ${fails} FAILED` : 'EDGE TESTS: all passed');
  srv.kill(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('FAIL exception', e); srv.kill(); process.exit(1); });
