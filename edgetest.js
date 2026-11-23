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
const finiteSnap = s => s && s.p.every(p => p.every(v => Number.isFinite(v))) && (s.b||[]).every(b => b.every(Number.isFinite));
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
      hits += (s.ev||[]).filter(e => e.k === 'hit').length; finite = finite && finiteSnap(s);
      for (const p of s.p) { if (p[14] < 0 || p[14] > 100) hpOk = false; if (p[1] < 0 || p[1] > 4800 || p[2] < 0 || p[2] > 3000) bounds = false; } } await sleep(10); }
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
  // host sliders: exact bot count 1-10 and auto end when time runs out
  const hs = client(); await hs.open; hs.send({ t: 'host', origin: 'x' }); await hs.wait('hosted');
  const botsOf = () => (hs.last.roster && hs.last.roster.players || []).filter(p => p.bot).length;
  hs.send({ t: 'setbots', n: 1 }); await sleep(150);
  ok(botsOf() === 1, 'setbots 1 leaves exactly 1 bot (got ' + botsOf() + ')');
  hs.send({ t: 'setbots', n: 10 }); await sleep(200);
  ok(botsOf() === 10, 'setbots 10 leaves exactly 10 bots (got ' + botsOf() + ')');
  hs.send({ t: 'setbots', n: 3 }); await sleep(150);
  ok(botsOf() === 3, 'changing bots mid-lobby to 3 updates (got ' + botsOf() + ')');
  hs.send({ t: 'setbots', n: 99 }); await sleep(150);
  ok(botsOf() === 10, 'setbots clamps to 10 (got ' + botsOf() + ')');
  hs.send({ t: 'setbots', n: 0 }); await sleep(150);
  ok(botsOf() === 1, 'setbots clamps 0 up to 1 (got ' + botsOf() + ')');
  delete hs.last.start; hs.send({ t: 'start', duration: 5 });
  const stLo = await hs.wait('start');
  ok(stLo && stLo.duration === 20, 'duration below min clamps to 20s in test mode (got ' + (stLo && stLo.duration) + ')');
  const ht = client(); await ht.open; ht.send({ t: 'host', origin: 'x' }); await ht.wait('hosted');
  ht.send({ t: 'setbots', n: 1 }); delete ht.last.start; ht.send({ t: 'start', duration: 9999 });
  const stHi = await ht.wait('start');
  ok(stHi && stHi.duration === 600, 'duration above max clamps to 10 min / 600s (got ' + (stHi && stHi.duration) + ')');
  const he = client(); await he.open; he.send({ t: 'host', origin: 'x' }); await he.wait('hosted');
  he.send({ t: 'setbots', n: 2 }); delete he.last.end; he.send({ t: 'start', duration: 20 });
  const ended = await he.wait('end', 25000);
  ok(ended && Array.isArray(ended.ranks) && ended.ranks.length >= 2, 'timer ends the game with a scoreboard (ranks=' + (ended && ended.ranks && ended.ranks.length) + ')');
  // insane / normal difficulty is accepted and does not crash
  const hd = client(); await hd.open; hd.send({ t: 'host', origin: 'x' }); await hd.wait('hosted');
  hd.send({ t: 'setbots', n: 2 }); hd.send({ t: 'botlevel', v: 'insane' });
  delete hd.last.start; hd.send({ t: 'start', duration: 20 });
  ok(await hd.wait('start') && !srvErr, 'start with insane bot difficulty');
  const hn = client(); await hn.open; hn.send({ t: 'host', origin: 'x' }); await hn.wait('hosted');
  hn.send({ t: 'setbots', n: 1 }); hn.send({ t: 'botlevel', v: 'normal' });
  delete hn.last.start; hn.send({ t: 'start', duration: 20 });
  ok(await hn.wait('start') && !srvErr, 'normal aliases to medium and starts');

  // bots must keep moving WHILE a peer is mid-reconnect (unclean drop, same IP)
  const hr = client(); await hr.open; hr.send({ t: 'host', origin: 'x' }); await hr.wait('hosted');
  const codeR = hr.last.hosted.code;
  hr.send({ t: 'setbots', n: 3 }); hr.send({ t: 'botlevel', v: 'hard' });
  const pA = client(); await pA.open; pA.send({ t: 'join', code: codeR, name: 'Alice' }); const jA = await pA.wait('joined');
  const pB = client(); await pB.open; pB.send({ t: 'join', code: codeR, name: 'Bella' }); await pB.wait('joined');
  hr.send({ t: 'start', duration: 60 }); await pB.wait('start');
  const botsOfSnap = s => (s && s.p || []).filter(r => r[0] !== (jA && jA.id)).map(r => [r[0], r[1], r[2]]);
  const moved = (a, b) => a && b && b.some(p => { const q = a.find(x => x[0] === p[0]); return q && Math.hypot(q[1] - p[1], q[2] - p[2]) > 2; });
  const tWait = Date.now();
  while (Date.now() - tWait < 2000 && !(pB.snap && botsOfSnap(pB.snap).length)) await sleep(40);
  const posA = botsOfSnap(pB.snap);
  await sleep(500);
  const posB = botsOfSnap(pB.snap);
  ok(moved(posA, posB), 'bots move before a disconnect');
  let lastN = pB.snap && pB.snap.n, snapCount = 0;
  const posDrop = botsOfSnap(pB.snap);
  try { pA.ws._socket.destroy(); } catch (e) { try { pA.ws.terminate(); } catch (e2) {} }
  const tGap = Date.now();
  while (Date.now() - tGap < 900) {
    await sleep(40);
    if (pB.snap && pB.snap.n !== lastN) { snapCount++; lastN = pB.snap.n; }
  }
  const posDuring = botsOfSnap(pB.snap);
  ok(moved(posDrop, posDuring) && snapCount >= 3, 'bots keep moving and other client still gets snaps WHILE a peer reconnects (snaps=' + snapCount + ', moved=' + !!moved(posDrop, posDuring) + ')');

  // session resume: same player + immediate full snapshot; measure token-join to snap
  const tRe = Date.now();
  const pA2 = client(); await pA2.open;
  const tSend = Date.now();
  pA2.send({ t: 'join', code: codeR, name: 'Alice', token: jA.token });
  const j2 = await pA2.wait('joined', 4000);
  const tJoined = Date.now() - tSend;
  // snapshot may already be in last.s (force-sent on resume)
  const s2 = pA2.last.s || await pA2.wait('s', 2000);
  const tSnap = Date.now() - tSend;
  ok(j2 && j2.id === jA.id, 'session resume restores the same player');
  ok(s2 && Array.isArray(s2.p) && s2.p.length >= 4, 'resume gets a full state snapshot promptly (join=' + tJoined + 'ms snap=' + tSnap + 'ms players=' + (s2 && s2.p && s2.p.length) + ')');
  console.log('RECONNECT_MS open=' + (tSend - tRe) + ' join=' + tJoined + ' snap=' + tSnap + ' total=' + (Date.now() - tRe));

  ok(!srvErr, 'no server errors' + (srvErr ? ': ' + srvErr.slice(0, 300) : ''));
  console.log(fails ? `EDGE TESTS: ${fails} FAILED` : 'EDGE TESTS: all passed');
  srv.kill(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('FAIL exception', e); srv.kill(); process.exit(1); });
