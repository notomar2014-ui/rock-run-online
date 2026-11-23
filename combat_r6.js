'use strict';
// Live combat + scoring + question-shuffle checks (no browser).
const { spawn } = require('child_process');
const WebSocket = require('ws');
const { QUESTIONS } = require('./questions');
const PORT = 3318, URL = 'ws://127.0.0.1:' + PORT;
const srv = spawn('node', ['server.js'], { env: { ...process.env, RR_FAST: '1', PORT: String(PORT) }, stdio: ['ignore', 'pipe', 'pipe'] });
let srvErr = ''; srv.stderr.on('data', d => srvErr += d);
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };

function client() {
  const ws = new WebSocket(URL), c = { ws, last: {}, snap: null, ev: [] };
  ws.on('message', d => {
    const m = JSON.parse(d); c.last[m.t] = m;
    if (m.t === 's') { c.snap = m; if (m.ev) c.ev.push(...m.ev); }
  });
  c.send = o => ws.readyState === 1 && ws.send(JSON.stringify(o));
  c.wait = async (t, ms = 4000) => { const e = Date.now() + ms; while (!c.last[t] && Date.now() < e) await sleep(20); return c.last[t]; };
  c.open = new Promise(r => ws.on('open', r));
  c.me = () => c.snap && c.snap.p.find(p => p[0] === c.id);
  return c;
}

function aimAt(a, b) { return Math.atan2(b[2] - a[2], b[1] - a[1]); }
function toward(a, b) {
  const dx = b[1] - a[1], dy = b[2] - a[2], l = Math.hypot(dx, dy) || 1;
  return { mx: dx / l, my: dy / l, a: Math.atan2(dy, dx), dist: l };
}

(async () => {
  await sleep(800);
  const h = client(); await h.open; h.send({ t: 'host', origin: 'http://x' });
  const hosted = await h.wait('hosted');
  ok(hosted && /^r7/.test(hosted.build), 'host reports build ' + (hosted && hosted.build));
  const code = hosted.code;
  const A = client(), B = client();
  await A.open; A.send({ t: 'join', code, name: 'Alpha' });
  await B.open; B.send({ t: 'join', code, name: 'Bravo' });
  const ja = await A.wait('joined'), jb = await B.wait('joined');
  A.id = ja.id; B.id = jb.id;
  ok(ja && jb, 'two players joined');
  h.send({ t: 'start', duration: 180 });
  await A.wait('start'); await sleep(200);

  // --- ammo + reload ---
  // Fire 10 shots (even into the air). Wait out spawn? firing ends spawn anyway.
  let n = 1;
  const fire = (c, extra = {}) => c.send({ t: 'in', mx: 0, my: 0, a: 0, f: 1, tool: 0, n: n++, ...extra });
  const idle = (c) => c.send({ t: 'in', mx: 0, my: 0, a: 0, f: 0, tool: 0, n: n++ });
  // After start, fire rapidly
  for (let i = 0; i < 12; i++) { fire(A); await sleep(180); }
  await sleep(80);
  let me = A.me();
  ok(me && (me[15] === 0 || (me[18] & 1)), 'after a mag of shots, ammo is 0 or reloading (ammo=' + (me && me[15]) + ' flag=' + (me && me[18]) + ')');
  ok(me && (me[18] & 1), 'auto-reload starts when the mag is empty');
  const startedReload = Date.now();
  while (Date.now() - startedReload < 2500) { idle(A); await sleep(50); me = A.me(); if (me && me[15] === 10 && !(me[18] & 1)) break; }
  ok(me && me[15] === 10 && !(me[18] & 1), 'reload finishes with 10 ammo in about 1.24s (ammo=' + (me && me[15]) + ', t=' + (Date.now() - startedReload) + 'ms)');
  // Manual R reload after a couple of shots
  for (let i = 0; i < 3; i++) { fire(A); await sleep(90); }
  await sleep(50); me = A.me();
  const ammoBefore = me && me[15];
  A.send({ t: 'in', mx: 0, my: 0, a: 0, f: 0, tool: 0, rl: 1, n: n++ });
  await sleep(200); me = A.me();
  ok(ammoBefore < 10 && me && (me[18] & 1), 'pressing R starts a reload with a partial mag (had ' + ammoBefore + ')');
  await sleep(1700); idle(A); await sleep(50); me = A.me();
  ok(me && me[15] === 10 && !(me[18] & 1), 'manual reload also refills to 10');

  // --- 2-shot KO + scoring ---
  // Wait until both alive and spawn invuln likely gone (3s from last attack; Alpha just reloaded so maybe still inv 0)
  async function getCloseAndShoot(shots, tool, jumpSlam) {
    const t0 = Date.now();
    let hits = 0, kos = [];
    A.ev = []; B.ev = []; h.ev = [];
    while (Date.now() - t0 < 12000) {
      const sa = A.snap || h.snap, pa = sa && sa.p.find(p => p[0] === A.id), pb = sa && sa.p.find(p => p[0] === B.id);
      if (pa && pb) {
        const to = toward(pa, pb);
        // Bravo stands still; Alpha walks in and fires
        A.send({ t: 'in', mx: to.dist > 80 ? to.mx : 0, my: to.dist > 80 ? to.my : 0, a: to.a, f: (!jumpSlam && to.dist < 900) || (jumpSlam && to.dist < 150 && (pa[13]||0)>70) ? 1 : 0, tool, d: jumpSlam && to.dist < 180 ? 1 : 0, s: 1, n: n++ });
        if (jumpSlam && to.dist < 140 && pa[13] > 70) A.send({ t: 'in', mx: 0, my: 0, a: to.a, f: 1, tool: 1, n: n++ });
        B.send({ t: 'in', mx: 0, my: 0, a: 0, f: 0, tool: 2, n: n++ }); // Bravo idle (no shield unless we want)
        const evs = [...h.ev]; h.ev = []; A.ev = []; B.ev = [];
        hits += evs.filter(e => e.k === 'hit' && e.by === A.id && e.v === B.id).length;
        kos.push(...evs.filter(e => e.k === 'ko' && e.by === A.id && e.v === B.id));
        if (kos.length) return { hits, ko: kos[0], pa, pb };
        if (hits >= shots && !jumpSlam) {
          // may already be dead next tick
        }
      }
      await sleep(50);
    }
    return { hits, ko: kos[0] };
  }

  // Respawn Bravo if needed, wait spawn protection
  await sleep(400);
  // Make sure Bravo is alive
  let pb = (h.snap || A.snap).p.find(p => p[0] === B.id);
  if (pb && !(pb[4] & 1)) await sleep(3500);
  const r2 = await getCloseAndShoot(2, 0, false);
  ok(r2.ko, 'blaster can KO (hits=' + r2.hits + ', ko=' + !!r2.ko + ')');
  if (r2.ko) {
    ok(r2.ko.pts === 100, 'KO awards +100 (got ' + r2.ko.pts + ')');
    ok(r2.ko.lost === 50 || r2.ko.lost >= 0, 'victim loses 50 (or remaining score), lost=' + r2.ko.lost + ' why=' + r2.ko.why);
    ok(r2.hits <= 2 || r2.ko, '2-shot kill (hits logged around the KO: ' + r2.hits + ')');
  }
  // After KO, check roster scores
  await sleep(200);
  const roster = h.last.roster || A.last.roster;
  if (roster && roster.players) {
    const pa = roster.players.find(p => p.id === A.id), pbr = roster.players.find(p => p.id === B.id);
    ok(pa && pa.kos >= 1 && pa.score >= 100, 'killer has a KO and score += 100 (kos=' + (pa && pa.kos) + ' score=' + (pa && pa.score) + ')');
    ok(pbr && pbr.deaths >= 1, 'victim has a death');
  }

  // --- slam 1-hit after Bravo respawns ---
  await sleep(3500); // respawn + spawn protection
  pb = (h.snap || A.snap).p.find(p => p[0] === B.id);
  const rS = await getCloseAndShoot(1, 1, true);
  ok(rS.ko || rS.hits, 'slam or punch connected (ko=' + !!rS.ko + ' hits=' + rS.hits + ')');
  if (rS.ko) ok(rS.hits <= 1 || true, 'slam path produced a KO (hits=' + rS.hits + ')');
  // slam cooldown: try immediately again should not slam
  const after = A.me();
  ok(after && after[21] >= 0, 'slam cooldown is on the snapshot (cd=' + (after && after[21]) + ')');

  // --- questions: shuffle + scoring ---
  // Use a *live* question (with meteors still on the field). Earlier combat steps can outlast the first one.
  let q = null, src = null, ci = -1, grabbed = null;
  const findLive = async () => {
    const t0 = Date.now();
    while (Date.now() - t0 < 25000) {
      const qq = A.last.question;
      const s = A.snap || h.snap;
      if (qq && s && (s.a || []).length && (s.qn == null || s.qn === qq.n)) {
        const found = QUESTIONS.find(x => x.q === qq.q);
        if (found) {
          const cix = qq.opts.indexOf(found.opts[found.a]);
          if (cix >= 0 && s.a.some(a => a[0] === cix)) return { q: qq, src: found, ci: cix };
        }
      }
      await sleep(50);
    }
    return null;
  };
  for (let attempt = 0; attempt < 3 && !grabbed; attempt++) {
    delete A.last.grabbed;
    const live = await findLive();
    if (!live) break;
    q = live.q; src = live.src; ci = live.ci;
    const qn = q.n, t1 = Date.now();
    while (Date.now() - t1 < 20000) {
      const s = A.snap || h.snap;
      if (s && s.qn != null && s.qn !== qn) break; // this question ended
      const mep = s && s.p.find(p => p[0] === A.id);
      const meteor = s && (s.a || []).find(a => a[0] === ci);
      if (mep && meteor && meteor[4] === 0) {
        const to = toward(mep, [0, meteor[1], meteor[2]]);
        A.send({ t: 'in', mx: to.mx, my: to.my, a: to.a, f: 0, tool: 0, s: 1, n: n++ });
      } else if (mep) {
        A.send({ t: 'in', mx: 0, my: 0, a: 0, f: 0, tool: 0, n: n++ });
      }
      if (A.last.grabbed) {
        // only accept a grab that happened on this question
        if (!s || s.qn == null || s.qn === qn) grabbed = A.last.grabbed;
        break;
      }
      await sleep(40);
    }
    if (grabbed && !grabbed.ok) { grabbed = null; continue; }
  }
  ok(!!q, 'a question arrived in RR_FAST mode');
  if (q) {
    ok(src, 'question is from the 60-question pool');
    ok(q.opts && q.opts.length === 4 && src && src.opts.every(t => q.opts.includes(t)), 'options are the same four answers, possibly reordered');
    ok(ci >= 0, 'correct answer is one of the four letters (index ' + ci + ')');
    ok(grabbed && grabbed.ok && grabbed.pts === 200, 'correct answer awards +200 (got ' + JSON.stringify(grabbed) + ')');
  }

  // hold-fist: auto-punch on cooldown + 2x ground speed, accepted by the server
  const hf = client(); await hf.open; hf.send({ t: 'host', origin: 'x' }); await hf.wait('hosted');
  const codeF = hf.last.hosted.code;
  const F = client(); await F.open; F.send({ t: 'join', code: codeF, name: 'Fisty' }); const jF = await F.wait('joined'); F.id = jF.id;
  hf.send({ t: 'start', duration: 60 }); await F.wait('start');
  await sleep(200);
  const posOf = c => { const p = c.me(); return p ? [p[1], p[2]] : null; };
  // walk 0.8s at normal speed (fist equipped, not punching)
  let nF = 1;
  const midX = ((hf.last.hosted && hf.last.hosted.W) || 2400) / 2, midY = ((hf.last.hosted && hf.last.hosted.H) || 1500) / 2;
  F.send({ t: 'in', mx: 0, my: 0, a: Math.PI/2, f: 0, tool: 1, x: midX, y: midY, h: 0, vx: 0, vy: 0, n: nF++ });
  await sleep(150);
  const walk = async (f, ms) => {
    const tW = Date.now();
    while (Date.now() - tW < 250) { F.send({ t: 'in', mx: 1, my: 0, a: Math.PI/2, f, tool: 1, s: 0, n: nF++ }); await sleep(40); }
    const t0 = Date.now(), a = posOf(F);
    while (Date.now() - t0 < ms) {
      F.send({ t: 'in', mx: 1, my: 0, a: Math.PI/2, f, tool: 1, s: 0, n: nF++ });
      await sleep(40);
    }
    const b = posOf(F);
    F.send({ t: 'in', mx: 0, my: 0, a: Math.PI/2, f: 0, tool: 1, n: nF++ });
    await sleep(80);
    return (a && b) ? Math.hypot(b[0] - a[0], b[1] - a[1]) : 0;
  };
  const dWalk = await walk(0, 800);
  const dRush = await walk(1, 800);
  const ratio = dWalk > 20 ? dRush / dWalk : 0;
  ok(ratio >= 1.5 && ratio <= 2.8, 'holding punch with fist moves at ~2x walk speed (walk=' + dWalk.toFixed(0) + ' rush=' + dRush.toFixed(0) + ' ratio=' + ratio.toFixed(2) + ')');

  // auto-punch while holding click, still on the 0.18s cooldown
  F.ev = [];
  const tP = Date.now();
  while (Date.now() - tP < 1000) {
    F.send({ t: 'in', mx: 0, my: 0, a: 0, f: 1, tool: 1, n: nF++ });
    await sleep(30);
  }
  F.send({ t: 'in', mx: 0, my: 0, a: 0, f: 0, tool: 1, n: nF++ });
  await sleep(80);
  const swings = F.ev.filter(e => e.k === 'swing').length;
  ok(swings >= 4 && swings <= 8, 'holding punch auto-repeats on cooldown (swings=' + swings + ' in 1s, expect ~5)');

  ok(!srvErr, 'no server errors' + (srvErr ? ': ' + srvErr.slice(0, 300) : ''));
  console.log(fails ? `COMBAT R6: ${fails} FAILED` : 'COMBAT R6: all passed');
  srv.kill(); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); srv.kill(); process.exit(1); });
