// Rock Run Online: Rocks in Space. Server-authoritative arena + answer-asteroid quiz (Node + ws).
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const { WebSocketServer } = require('ws');
const QRCode = require('qrcode');
const { QUESTIONS, FACTS, DYK } = require('./questions');
const BUILD = 'r7';

const PORT = process.env.PORT || 3000;
const FAST = !!process.env.RR_FAST; // test mode: first question comes sooner, short rounds allowed
const TICK = 40, SNAP_EVERY = 2;      // 40 Hz physics, 20 Hz snapshots (smoother, still light)
const W = 4800, H = 3000; // ~1.5× arena (still light for school laptops)
const CERES = { x: 1575, y: 1500, r: 160, gm: 160 * 160 * 5 };
const VESTA = { x: 3255, y: 1470, r: 130, gm: 130 * 130 * 3.5 }; // less mass -> weaker pull, lumpy
// Raised plateaus (h in game units) with a ramp on one side; pillars are solid cover.
const PLATS = [
  { x: 1050, y: 700, w: 520, d: 360, h: 90, ramp: { dir: 's', len: 220 } },
  { x: 3850, y: 2350, w: 480, d: 340, h: 80, ramp: { dir: 'n', len: 200 } },
];
const PILLARS = [
  { x: 1500, y: 1050, r: 46, h: 240 }, { x: 1820, y: 1050, r: 46, h: 240 },
  { x: 3300, y: 1900, r: 58, h: 280 },
  { x: 800, y: 2100, r: 50, h: 220 },
  { x: 4100, y: 800, r: 54, h: 250 },
  { x: 2400, y: 500, r: 42, h: 200 },
  { x: 2000, y: 2600, r: 48, h: 210 },
  { x: 3000, y: 700, r: 44, h: 190 },
];
const OCCATOR = { x: 1700, y: 2300, r: 340 };
function floorAt(x, y) {
  let fl = 0;
  for (const p of PLATS) {
    const dx = x - p.x, dy = y - p.y;
    if (Math.abs(dx) <= p.w / 2 && Math.abs(dy) <= p.d / 2) fl = Math.max(fl, p.h);
    if (p.ramp) {
      const L = p.ramp.len, dir = p.ramp.dir;
      let t = -1;
      if (dir === 's' && dy > p.d / 2 && dy < p.d / 2 + L && Math.abs(dx) <= p.w / 2) t = 1 - (dy - p.d / 2) / L;
      if (dir === 'n' && dy < -p.d / 2 && dy > -p.d / 2 - L && Math.abs(dx) <= p.w / 2) t = 1 - (-p.d / 2 - dy) / L;
      if (dir === 'e' && dx > p.w / 2 && dx < p.w / 2 + L && Math.abs(dy) <= p.d / 2) t = 1 - (dx - p.w / 2) / L;
      if (dir === 'w' && dx < -p.w / 2 && dx > -p.w / 2 - L && Math.abs(dy) <= p.d / 2) t = 1 - (-p.w / 2 - dx) / L;
      if (t >= 0) fl = Math.max(fl, p.h * Math.max(0, Math.min(1, t)));
    }
  }
  return fl;
}
function worldCfg() { return { W, H, plats: PLATS, pillars: PILLARS, occator: OCCATOR }; }
const Q_TIME = 25, REVEAL_TIME = 4, BREAK_TIME = 15, FIRST_BREAK = FAST ? 5 : 10;
const PTS_RIGHT = 200, PTS_WRONG = 50, PTS_KO = 100, PTS_DIE = 50, PTS_METEOR = 50; // Omar: +200 right, +100 KO, -50 wrong / meteor / death (never below 0)
const HP = 100, REGEN_DELAY = 4, REGEN = 12, DASH_CD = 2.55, DASH_V = 1480, DASH_UP = 640, IFRAME = 0.34;
const MAX_PLAYERS = 40;
const COLORS = ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#38d9a9', '#4dabf7', '#9775fa', '#f783ac'];
// exactly 3 tools: 0 ranged blaster, 1 melee punch, 2 blocker shield
const TOOLS = [
  { name: 'Blaster', cd: 0.16, speed: 3180, life: 0.85, r: 8, dmg: 55, mag: 10, reload: 1.55 }, // +41% vs r6d 2260; range ~2700 stays sensible; 2 hits = KO
  { name: 'Punch', cd: 0.18, reach: 143, arc: 1.5, dmg: [34, 34, 40], combo: 0.9, slamDmg: 120, slamCd: 7 }, // 3-hit KO; reach +30%; air slam is a 1-hit KO
  { name: 'Shield', cd: 0, drain: 30, regen: 18, min: 12 },                                // hold to block from the front, uses energy
];
const SPEED = 300, SPRINT = 450, JUMP_V = 560, GRAV = 900; // low gravity on Ceres: floaty jumps (+ double jump)
const ANSWER_SPOTS = [[780, 630], [2415, 540], [4140, 630], [780, 2370], [2415, 2460], [4140, 2370], [2415, 1500], [495, 1500], [4425, 1500]];
const SPAWN_SAFE = 3;
// bot difficulty: think = reaction time (s), aim = aim error (rad), fire = chance to shoot per think, fight = chance to be in a fighting mood,
// range = how far they will chase, selfDefense = always fight back this close, humanAvoid = >1 means they pick on bots before kids,
// smart = chance to go for the RIGHT answer, pick = delay before heading to an answer (s)
const BOT_LEVELS = {
  easy: { think: 0.45, aim: 0.6, fire: 0.13, fight: 0.2, range: 400, selfDefense: 110, humanAvoid: 1.8, smart: 0.3, pick: [7, 14], sprint: 0, shield: 0.15, dash: 0.03, slam: 0 },
  medium: { think: 0.28, aim: 0.32, fire: 0.3, fight: 0.45, range: 550, selfDefense: 140, humanAvoid: 1.25, smart: 0.55, pick: [3.5, 9], sprint: 1, shield: 0.3, dash: 0.12, slam: 0.1 },
  hard: { think: 0.12, aim: 0.2, fire: 0.55, fight: 0.8, range: 650, selfDefense: 200, humanAvoid: 1, smart: 0.65, pick: [1.5, 7], sprint: 1, shield: 0.55, dash: 0.3, slam: 0.25 },
};
const BOT_NAMES = ['Bot Ceres', 'Bot Vesta', 'Bot Pallas', 'Bot Juno', 'Bot Hygiea', 'Bot Psyche', 'Bot Eros', 'Bot Ida', 'Bot Gaspra', 'Bot Lutetia'];

const rnd = (a, b) => a + Math.random() * (b - a), clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const closestDist = (x0, y0, x1, y1, px, py) => { const dx = x1 - x0, dy = y1 - y0, l2 = dx * dx + dy * dy; const t = l2 <= 1e-8 ? 0 : Math.max(0, Math.min(1, ((px - x0) * dx + (py - y0) * dy) / l2)); return Math.hypot(px - (x0 + dx * t), py - (y0 + dy * t)); };
const angDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
function vestaRadius(th) {
  let r = VESTA.r * (1 + 0.16 * Math.sin(3 * th + 1.1) + 0.09 * Math.sin(5 * th + 0.4) + 0.05 * Math.sin(8 * th + 2));
  let d = Math.atan2(Math.sin(th - Math.PI / 2), Math.cos(th - Math.PI / 2));
  if (Math.abs(d) < 0.9) r -= 26 * Math.cos(d / 0.9 * Math.PI / 2) ** 2; // giant south-pole crater
  return r;
}
const surface = (body, th) => body === VESTA ? vestaRadius(th) : body.r;
let nid = 1; const id = () => nid++;
const rooms = new Map();
function makeCode() { const A = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; let c; do { c = ''; for (let i = 0; i < 4; i++) c += A[Math.random() * A.length | 0]; } while (rooms.has(c)); return c; }

class Room {
  constructor(origin) {
    this.code = makeCode(); this.key = crypto.randomBytes(8).toString('hex'); this.origin = origin;
    this.hosts = new Set(); this.players = new Map(); this.phase = 'lobby'; this.duration = 360; this.botLevel = 'easy';
    this.lastActive = Date.now(); this.tickN = 0; this.reset();
  }
  reset() {
    this.rocks = []; this.bullets = []; this.meteors = []; this.falls = []; this.events = []; this.time = 0;
    this.q = { stage: 'break', until: FIRST_BREAK, qid: -1, n: 0, ans: [], firstRight: false, picks: new Map() };
    this.nextChaos = FAST ? 3 : 30; this.qOrder = shuffle([...QUESTIONS.keys()]); this.qi = 0;
    this.rockDirty = true; this.rockSnap = null;
    for (let i = 0; i < 32; i++) this.spawnRock();
  }
  freeSpot(margin = 160) {
    for (let k = 0; k < 40; k++) {
      const p = { x: rnd(120, W - 120), y: rnd(120, H - 120) };
      if (dist(p, CERES) < CERES.r + margin || dist(p, VESTA) < VESTA.r + 40 + margin) continue;
      if (this.rocks.some(r => dist(p, r) < r.r + 60) || this.q && this.q.ans.some(a => dist(p, a) < 160)) continue;
      return p;
    }
    return { x: rnd(200, W - 200), y: rnd(150, 350) };
  }
  spawnRock(x, y, r, vx, vy) {
    const p = x === undefined ? this.freeSpot(80) : { x, y }; r = r || rnd(24, 54);
    this.rocks.push({ id: id(), x: p.x, y: p.y, r, vx: vx ?? 0, vy: vy ?? 0, rot: rnd(0, 6.28), spin: rnd(-1, 1), hp: Math.ceil(r / 22) });
    this.rockDirty = true;
  }
  ev(e) { this.events.push(e); }
  send(ws, msg) { if (ws && ws.readyState === 1) ws.send(JSON.stringify(msg)); }
  toAll(msg) { const s = JSON.stringify(msg); for (const p of this.players.values()) if (p.ws && p.ws.readyState === 1) p.ws.send(s); for (const h of this.hosts) if (h.readyState === 1) h.send(s); }
  fact(p, text) { if (!p.bot) this.send(p.ws, { t: 'fact', text }); }
  addPlayer(name, color, ws, bot = false) {
    const p = { id: id(), token: crypto.randomBytes(8).toString('hex'), name, color, ws, bot, x: 0, y: 0, vx: 0, vy: 0, a: 0,
      alive: false, respawnAt: 0, inv: 0, block: 0, cds: [0, 0, 0], dashCd: 0, h: 0, vh: 0, jumps: 2, jPrev: 0, tool: 0, swing: 0, score: 0, kos: 0, deaths: 0,
      streak: 0, correct: 0, input: { mx: 0, my: 0, a: 0, f: 0, tool: 0, dash: 0, sprint: 0, q: 0, rl: 0 },
      hp: HP, heat: 0, over: 0, en: 100, ammo: 10, reloading: 0, slamCd: 0, inSeq: 0, combo: 0, comboT: -9, kbx: 0, kby: 0, iframe: 0, lastHit: -9, slam: 0, qPrev: 0, rlPrev: 0, seenWell: {}, connected: true, botT: 0, botPickAt: 0 };
    this.players.set(p.id, p);
    if (this.phase === 'play') this.respawn(p);
    this.roster(); return p;
  }
  safeSpot(p) { // spawn far from enemies: best of several free spots
    let best = null, bd = -1;
    for (let k = 0; k < 12; k++) { const s = this.freeSpot(); let d = 1e9; for (const o of this.players.values()) if (o !== p && o.alive) d = Math.min(d, dist(o, s)); if (d > bd) { bd = d; best = s; } }
    return best;
  }
  respawn(p) { const s = this.safeSpot(p); Object.assign(p, { x: s.x, y: s.y, vx: 0, vy: 0, h: 0, vh: 0, alive: true, inv: SPAWN_SAFE, block: 0, hp: HP, heat: 0, over: 0, en: 100, ammo: 10, reloading: 0, kbx: 0, kby: 0, slam: 0, iframe: 0, dashCd: 0 }); }
  roster() {
    const list = [...this.players.values()].map(p => ({ id: p.id, name: p.name, color: p.color, score: p.score, kos: p.kos, deaths: p.deaths, correct: p.correct, bot: p.bot, on: p.connected || p.bot }));
    this.toAll({ t: 'roster', players: list, phase: this.phase, duration: this.duration });
  }
  start(duration) {
    this.duration = clamp(duration | 0 || 360, FAST ? 20 : 120, 900); this.reset(); this.phase = 'play';
    for (const p of this.players.values()) { Object.assign(p, { score: 0, kos: 0, deaths: 0, streak: 0, correct: 0, cds: [0, 0, 0], dashCd: 0, ammo: 10, reloading: 0, slamCd: 0 }); this.respawn(p); }
    this.toAll({ t: 'start', duration: this.duration, build: BUILD, world: worldCfg() }); this.roster();
  }
  end() {
    this.phase = 'end';
    const ranks = [...this.players.values()].sort((a, b) => b.score - a.score).map(p => ({ id: p.id, name: p.name, color: p.color, score: p.score, kos: p.kos, correct: p.correct, bot: p.bot }));
    this.toAll({ t: 'end', ranks }); this.roster();
  }

  // ---------- answer asteroids ----------
  nextQuestion() { if (this.qi >= this.qOrder.length) { this.qOrder = shuffle([...QUESTIONS.keys()]); this.qi = 0; } return this.qOrder[this.qi++]; }
  startQuestion() {
    const qid = this.nextQuestion(), Q = QUESTIONS[qid];
    // Spread the answers in 4 different directions around the arena (90° apart, random turn), at mixed distances,
    // so you have to turn the camera to find them instead of seeing all four at once.
    const turn = Math.random() * Math.PI * 2, spots = shuffle([0, 1, 2, 3]).map(k => { const ang = turn + k * Math.PI / 2 + rnd(-0.25, 0.25), f = rnd(0.62, 0.95); return [clamp(W / 2 + Math.cos(ang) * (W / 2 - 260) * f, 260, W - 260), clamp(H / 2 + Math.sin(ang) * (H / 2 - 220) * f, 220, H - 220)]; });
    const order = shuffle([0, 1, 2, 3]), opts = order.map(i => Q.opts[i]), correct = order.indexOf(Q.a);
    const q = this.q; q.stage = 'question'; q.until = this.time + Q_TIME; q.qid = qid; q.n++; q.firstRight = false; q.picks = new Map();
    q.opts = opts; q.correct = correct;
    q.ans = opts.map((text, i) => ({ i, text, x: spots[i][0] + rnd(-60, 60), y: spots[i][1] + rnd(-40, 40), vx: 0, vy: 0, r: 90, landAt: this.time + 1.8 + i * 0.25, landed: false }));
    for (const p of this.players.values()) p.botPickAt = this.time + rnd(...(BOT_LEVELS[this.botLevel] || BOT_LEVELS.easy).pick);
    this.toAll({ t: 'question', n: q.n, q: Q.q, opts, time: Q_TIME });
  }
  grab(p, a) {
    const q = this.q, Q = QUESTIONS[q.qid]; if (q.picks.has(p.id)) return;
    const ok = a.i === (q.correct ?? Q.a); let pts;
    if (ok) { pts = PTS_RIGHT; q.firstRight = true; p.correct++; }
    else pts = -Math.min(PTS_WRONG, p.score);
    p.score += pts; q.picks.set(p.id, a.i);
    this.send(p.ws, { t: 'grabbed', i: a.i, ok, pts, first: ok && !q.firstRight });
    this.ev({ k: 'grab', id: p.id, x: a.x, y: a.y, i: a.i, pts, ok: ok ? 1 : 0 });
    this.dirtyRoster = true;
    const active = [...this.players.values()].filter(x => x.connected || x.bot);
    if (active.every(x => q.picks.has(x.id))) q.until = Math.min(q.until, this.time + 1);
  }
  revealQuestion() {
    const q = this.q, Q = QUESTIONS[q.qid]; q.stage = 'reveal'; q.until = this.time + REVEAL_TIME;
    const ans = q.correct ?? Q.a; const right = [...q.picks.values()].filter(i => i === ans).length;
    this.toAll({ t: 'reveal', a: ans, fact: Q.fact, right, picked: q.picks.size });
  }

  // ---------- combat ----------
  ko(v, killer, how, force) {
    if (!v.alive || v.inv > 0 || (!force && v.iframe > 0)) return false;
    if (!force && v.block > 0) { this.ev({ k: 'blocked', x: v.x, y: v.y }); return false; }
    v.alive = false; v.hp = 0; v.slam = 0; v.respawnAt = this.time + 3; v.deaths++; v.streak = 0;
    const meteor = /meteor|vesta chunk|squashed/i.test(String(how || ''));
    const lost = Math.min(meteor ? PTS_METEOR : PTS_DIE, Math.max(0, v.score)); v.score -= lost;
    let pts = 0;
    if (killer && killer !== v) { killer.streak++; killer.kos++; pts = PTS_KO; killer.score += pts; }
    this.ev({ k: 'ko', v: v.id, by: killer && killer !== v ? killer.id : 0, how, x: v.x, y: v.y, c: v.color, pts, lost, why: meteor ? 'meteor' : 'down', streak: killer ? killer.streak : 0 });
    this.dirtyRoster = true; return true;
  }
  front(v, x, y) { return Math.abs(angDiff(Math.atan2(y - v.y, x - v.x), v.a)) < 1.3; }
  damage(v, by, dmg, how, kx = 0, ky = 0, up = 0) {
    if (!v.alive || v.inv > 0 || v.iframe > 0) return false;
    v.hp -= dmg; v.lastHit = this.time; v.kbx += kx; v.kby += ky; if (up) { v.vh = Math.max(v.vh, up); v.jumps = Math.min(v.jumps, 1); }
    this.ev({ k: 'hit', v: v.id, by: by ? by.id : 0, x: v.x, y: v.y, d: dmg, how, ko: v.hp <= 0 ? 1 : 0 });
    if (v.hp <= 0) this.ko(v, by, how, true);
    return true;
  }
  beginReload(p) {
    if (p.reloading > 0 || p.ammo >= TOOLS[0].mag) return;
    p.reloading = TOOLS[0].reload; p.over = 1; this.ev({ k: 'reload', id: p.id, x: p.x, y: p.y });
  }
  use(p) {
    const t = p.tool, T = TOOLS[t]; if (t === 2 || p.cds[t] > 0) return;
    const dx = Math.cos(p.a), dy = Math.sin(p.a);
    if (t === 0) {
      if (p.reloading > 0) return;
      if (p.ammo <= 0) { this.beginReload(p); return; }
      p.cds[0] = T.cd; p.inv = 0; p.ammo--;
      const a = p.a + (p.input.sprint ? rnd(-0.14, 0.14) : rnd(-0.025, 0.025)), ax = Math.cos(a), ay = Math.sin(a);
      this.bullets.push({ x: p.x + ax * 26, y: p.y + ay * 26, h: p.h + 55, vx: ax * T.speed, vy: ay * T.speed, owner: p.id, life: T.life, r: T.r, dmg: T.dmg });
      this.ev({ k: 'shot', x: p.x, y: p.y, id: p.id, ammo: p.ammo });
      if (p.ammo <= 0) this.beginReload(p);
    } else if (t === 1) {
      p.inv = 0;
      const flAir = floorAt(p.x, p.y);
      if ((p.h > flAir + 8 || p.vh > 80) && !p.slam) {
        if ((p.slamCd || 0) > 0) return; // slam still cooling down
        p.slam = 1; p.vh = -1100; p.cds[1] = 0.8; p.slamCd = T.slamCd; this.ev({ k: 'slamgo', id: p.id }); return;
      }
      p.cds[1] = T.cd; p.combo = this.time - p.comboT < T.combo ? (p.combo + 1) % 3 : 0; p.comboT = this.time;
      const c = p.combo; p.swing = 0.16; p.kbx += dx * (240 + c * 70); p.kby += dy * (240 + c * 70); // lunge
      for (const o of this.players.values()) {
        if (o === p || !o.alive || dist(o, p) > T.reach + 32 || Math.abs(o.h - p.h) > 130 || Math.abs(angDiff(Math.atan2(o.y - p.y, o.x - p.x), p.a)) > T.arc) continue;
        if (o.block > 0 && this.front(o, p.x, p.y)) { o.en = Math.max(0, o.en - 15); p.kbx -= dx * 420; p.kby -= dy * 420; this.ev({ k: 'blocked', x: o.x, y: o.y }); continue; }
        const kb = 380 + c * 260; this.damage(o, p, T.dmg[c], 'punch', dx * kb, dy * kb, c === 2 ? 430 : 0);
      }
      for (const r of this.rocks) if (dist(r, p) < T.reach + r.r && Math.abs(angDiff(Math.atan2(r.y - p.y, r.x - p.x), p.a)) < T.arc) { r.vx += dx * 260; r.vy += dy * 260; r.hp--; }
      this.ev({ k: 'swing', id: p.id, x: p.x, y: p.y, a: p.a, c });
    }
  }

  // ---------- bots ----------
  botThink(p, dt) {
    const inp = p.input; if (!p.alive) return;
    const L = BOT_LEVELS[this.botLevel] || BOT_LEVELS.easy;
    p.botT -= dt; if (p.botT > 0) return; p.botT = L.think * rnd(0.8, 1.3);
    let target = null, best = 1e9;
    for (const o of this.players.values()) if (o !== p && o.alive && o.inv <= 0) { const d = dist(o, p) * (o.bot ? 1 : L.humanAvoid); if (d < best) { best = d; target = o; } }
    if (this.time > (p.moodUntil || 0)) { p.moodUntil = this.time + rnd(3, 6); p.fighty = Math.random() < L.fight; p.wander = this.freeSpot(); }
    if (!p.fighty && best > L.selfDefense) target = null; // mostly peaceful unless someone is right next to them
    if (target && best > L.range) target = null;
    let goal = null;
    const q = this.q;
    if (q.stage === 'question' && !q.picks.has(p.id) && this.time > p.botPickAt) {
      if (p.botGoal === undefined || p.botGoalQ !== q.n) { p.botGoalQ = q.n; p.botGoal = Math.random() < L.smart ? (q.correct ?? QUESTIONS[q.qid].a) : Math.random() * q.ans.length | 0; }
      goal = q.ans[p.botGoal];
    }
    let mx = 0, my = 0;
    if (goal) { mx = goal.x - p.x; my = goal.y - p.y; }
    else if (target) { mx = target.x - p.x; my = target.y - p.y; if (best < 70) { mx = -my; my = target.x - p.x; } }
    else if (p.wander) { mx = p.wander.x - p.x; my = p.wander.y - p.y; if (Math.hypot(mx, my) < 60) p.wander = this.freeSpot(); }
    if (!goal) for (const a of q.ans) { const d = dist(a, p); if (d < a.r + 90) { mx += (p.x - a.x) / d * 2; my += (p.y - a.y) / d * 2; } } // don't pick by accident
    const l = Math.hypot(mx, my) || 1; inp.mx = mx / l; inp.my = my / l; inp.sprint = goal && L.sprint ? 1 : 0; inp.dash = Math.random() < 0.04 ? 1 : 0; inp.q = 0;
    if (target) {
      inp.a = Math.atan2(target.y + target.vy * best / 1000 - p.y, target.x + target.vx * best / 1000 - p.x) + rnd(-L.aim, L.aim);
      inp.tool = best < 120 ? 1 : 0; inp.f = Math.random() < (inp.tool ? L.fire * 1.6 : L.fire) ? 1 : 0;
      if (inp.tool === 0 && p.heat > 75) inp.f = 0; // let the blaster cool down
      if (inp.tool === 1 && best < 160 && p.h <= 0 && Math.random() < L.slam) { inp.dash = 1; } // hop, then slam on a later think
      if (inp.tool === 1 && p.h > 90 && Math.random() < 0.7) inp.f = 1;
      const inc = this.bullets.find(b => b.owner !== p.id && Math.hypot(b.x - p.x, b.y - p.y) < 220);
      if (inc && p.en > 30 && Math.random() < L.shield) { inp.tool = 2; inp.f = 1; inp.a = Math.atan2(inc.y - p.y, inc.x - p.x); }
      else if ((inc || best < 90) && p.dashCd <= 0 && Math.random() < L.dash * 3) { inp.q = 1; const s2 = Math.random() < 0.5 ? 1 : -1; inp.mx = -inp.my * s2; inp.my = inp.mx * s2 || 0.5; }
    } else { inp.f = 0; if (Math.hypot(inp.mx, inp.my)) inp.a = Math.atan2(inp.my, inp.mx); }
  }

  // ---------- chaos ----------
  chaos() {
    if (Math.random() < 0.6) {
      this.swarm = { left: 22, t: 0 };
      this.toAll({ t: 'chaos', kind: 'swarm', text: '☄️ METEOR SHOWER! Watch for red circles!', fact: pick(FACTS.meteoroid) });
    } else {
      const s = this.freeSpot(); this.falls.push({ x: s.x, y: s.y, t: 3, r: 200, big: 1 });
      this.toAll({ t: 'chaos', kind: 'vesta', text: '💥 A BIG VESTA CHUNK IS FALLING! Run!', fact: pick(FACTS.vesta) });
    }
  }
  land(f) {
    for (const p of this.players.values()) if (p.alive && p.h < 90 && Math.hypot(p.x - f.x, p.y - f.y) < f.r + 18) this.ko(p, null, f.big ? 'got squashed by a Vesta chunk' : 'got hit by a meteoroid');
    this.ev({ k: 'boom', x: f.x, y: f.y, r: f.r, big: f.big || 0 });
    if (f.big) { for (let i = 0; i < 3; i++) { const a = rnd(0, 6.28); this.spawnRock(f.x + Math.cos(a) * 120, f.y + Math.sin(a) * 120, rnd(24, 36)); }
      setTimeout(() => this.phase === 'play' && this.toAll({ t: 'chaos', kind: 'meteorite', text: '🌍 Chunks of Vesta reach Earth as METEORITES!', fact: pick(FACTS.meteorite) }), 2500); }
  }

  tick(dt) {
    if (this.phase !== 'play') return;
    this.tickN++; this.time += dt;
    if (this.time >= this.duration) return this.end();
    const q = this.q;
    if (q.stage === 'break' && this.time >= q.until && this.duration - this.time > 12) this.startQuestion();
    else if (q.stage === 'question' && this.time >= q.until) this.revealQuestion();
    else if (q.stage === 'reveal' && this.time >= q.until) { q.stage = 'break'; q.until = this.time + BREAK_TIME; q.ans = []; this.toAll({ t: 'qend', next: BREAK_TIME, dyk: (DYK && DYK.length) ? pick(DYK) : undefined }); }
    if (this.time >= this.nextChaos && q.stage === 'break' && q.until - this.time > 7) { this.chaos(); this.nextChaos = this.time + rnd(28, 40); }
    if (this.swarm) { const w = this.swarm; w.t += dt; while (w.left > 0 && w.t > 0.28) { w.t -= 0.28; w.left--; this.falls.push({ x: rnd(100, W - 100), y: rnd(100, H - 100), t: 1.6, r: 70 }); } if (w.left <= 0) this.swarm = null; }
    for (let i = this.falls.length - 1; i >= 0; i--) { const f = this.falls[i]; f.t -= dt; if (f.t <= 0) { this.falls.splice(i, 1); this.land(f); } }
    for (const a of q.ans) if (!a.landed && this.time >= a.landAt) { a.landed = true; this.ev({ k: 'aland', x: a.x, y: a.y, i: a.i }); for (const p of this.players.values()) if (p.alive && Math.hypot(p.x - a.x, p.y - a.y) < a.r) { p.vx += (p.x - a.x) * 4; p.vy += (p.y - a.y) * 4; } }
    for (const a of q.ans) { a.x += a.vx * dt; a.y += a.vy * dt; if (a.x < 120 || a.x > W - 120) a.vx *= -1; if (a.y < 120 || a.y > H - 120) a.vy *= -1; }
    const ps = [...this.players.values()];
    for (const p of ps) {
      if (!p.bot && !p.connected) { if (p.alive) { p.savedHp = p.hp; p.alive = false; p.slam = 0; } p.dropAt = p.dropAt || Date.now(); p.respawnAt = this.time + 9999; continue; } // hide so they aren't a free target; resume restores them
      if (p.bot) this.botThink(p, dt);
      if (!p.alive) { if (this.time >= p.respawnAt) this.respawn(p); continue; }
      if (!p.bot && Date.now() - (p.inAt || 0) > 1000) Object.assign(p.input, { mx: 0, my: 0, f: 0, dash: 0, sprint: 0, q: 0 }); // no input for 1 s (tab hidden, lost keyup, dropped link) = stand still
      p.inv = Math.max(0, p.inv - dt); p.swing = Math.max(0, p.swing - dt); p.dashCd = Math.max(0, p.dashCd - dt); p.iframe = Math.max(0, p.iframe - dt);
      p.heat = Math.max(0, p.heat - (p.over ? 90 : 64) * dt);
      p.slamCd = Math.max(0, (p.slamCd || 0) - dt);
      if (p.reloading > 0) { p.reloading = Math.max(0, p.reloading - dt); if (p.reloading <= 0) { p.ammo = TOOLS[0].mag; p.over = 0; this.ev({ k: 'reloaded', id: p.id }); } }
      else { p.over = 0; }
      if (p.input.rl && !p.rlPrev) this.beginReload(p);
      p.rlPrev = p.input.rl ? 1 : 0;
      if (this.time - p.lastHit > REGEN_DELAY) p.hp = Math.min(HP, p.hp + REGEN * dt);
      for (let i = 0; i < 3; i++) p.cds[i] = Math.max(0, p.cds[i] - dt);
      const inp = p.input; p.a = Number.isFinite(+inp.a) ? +inp.a : 0; p.tool = clamp(inp.tool | 0, 0, 2);
      const shielding = p.tool === 2 && inp.f && p.en > (p.block > 0 ? 0 : TOOLS[2].min);
      if (shielding) { if (!p.block) this.ev({ k: 'shield', id: p.id, x: p.x, y: p.y }); p.block = 1; p.en = Math.max(0, p.en - TOOLS[2].drain * dt); p.inv = 0; }
      else { p.block = 0; p.en = Math.min(100, p.en + TOOLS[2].regen * dt); }
      let mx = +inp.mx || 0, my = +inp.my || 0; const l = Math.hypot(mx, my); if (l > 1) { mx /= l; my /= l; }
      // snappy Roblox-style movement: velocity eases to target quickly (little drift)
      const sp = (inp.sprint && !shielding ? SPRINT : SPEED) * (shielding ? 0.5 : 1), k = Math.min(1, dt * 11);
      if (inp.q && !p.qPrev && p.dashCd <= 0) { // dodge dash: further launch, look-up or mid-air goes up (same Q key)
        let ddx = mx, ddy = my; if (!Math.hypot(ddx, ddy)) { ddx = Math.cos(p.a); ddy = Math.sin(p.a); } const dl = Math.hypot(ddx, ddy) || 1;
        ddx /= dl; ddy /= dl;
        const pit = Number.isFinite(+inp.p) ? Math.max(-1.5, Math.min(1.5, +inp.p)) : 0; // negative pitch = look up
        const flD = floorAt(p.x, p.y), grounded = p.h <= flD + 0.6, lookUp = pit < -0.16, lookDown = pit > 0.28;
        let horiz = DASH_V, up = 160;
        if (lookUp || (!grounded && !lookDown)) {
          const t = lookUp ? Math.max(0.28, Math.min(1, -pit / 1.15)) : 0.42;
          up = DASH_UP * t; horiz = DASH_V * (lookUp ? Math.max(0.38, Math.cos(Math.min(1.2, -pit))) : 0.9);
        } else if (!grounded && lookDown) { up = -DASH_UP * Math.max(0.25, Math.min(1, pit / 1.2)); horiz = DASH_V * 0.85; }
        p.kbx += ddx * horiz; p.kby += ddy * horiz; p.vh += up; if (up > 0 && p.h <= flD + 0.6) p.h = flD + 1;
        p.iframe = IFRAME; p.dashCd = DASH_CD; this.ev({ k: 'dash', id: p.id, x: p.x, y: p.y });
      }
      p.qPrev = inp.q ? 1 : 0;
      p.vx += (mx * sp - p.vx) * k; p.vy += (my * sp - p.vy) * k;
      const fl = floorAt(p.x, p.y);
      let grounded = p.h <= fl + 0.6;
      if (grounded && p.vh <= 0) { p.h = fl; p.vh = 0; p.jumps = 2; }
      if (inp.dash && !p.jPrev && p.jumps > 0) { p.vh = p.jumps === 2 ? JUMP_V : JUMP_V * 0.85; p.jumps--; p.h = Math.max(p.h, fl + 1); this.ev({ k: 'jump', id: p.id, x: p.x, y: p.y, d: p.jumps === 0 ? 1 : 0 }); grounded = false; }
      p.jPrev = inp.dash ? 1 : 0;
      if (!grounded || p.vh > 0) { p.vh -= GRAV * dt; p.h += p.vh * dt; const fl2 = floorAt(p.x, p.y); if (p.h <= fl2 && p.vh <= 0) { p.h = fl2; p.vh = 0; } if (p.h < 0) { p.h = 0; p.vh = 0; } }
      if (p.slam && p.h <= floorAt(p.x, p.y) + 0.6) { p.slam = 0; this.ev({ k: 'slam', x: p.x, y: p.y, id: p.id }); // ground slam lands: shockwave
        for (const o of ps) if (o !== p && o.alive && o.h < 100) { const d = dist(o, p); if (d < 208) { const nx = (o.x - p.x) / (d || 1), ny = (o.y - p.y) / (d || 1); this.damage(o, p, TOOLS[1].slamDmg, 'slam', nx * 700, ny * 700, 420); } } }
      if (inp.f) this.use(p);
      if (!p.seenWell.c && this.time > 4) { p.seenWell.c = 1; this.fact(p, pick(FACTS.ceres)); }
      p.x = clamp(p.x + (p.vx + p.kbx) * dt, 20, W - 20); p.y = clamp(p.y + (p.vy + p.kby) * dt, 20, H - 20);
      const kd = Math.pow(0.012, dt); p.kbx *= kd; p.kby *= kd;
      if (!Number.isFinite(p.x + p.y + p.h + p.vh + p.vx + p.vy + p.kbx + p.kby)) { this.respawn(p); continue; } // never let a NaN escape
      for (const r of this.rocks) { const d = dist(p, r), m = r.r + 18; if (d < m && d > 0 && p.h < r.r * 1.2) { const nx = (p.x - r.x) / d, ny = (p.y - r.y) / d; p.x = r.x + nx * m; p.y = r.y + ny * m; r.vx -= nx * 20; r.vy -= ny * 20; } }
      for (const r of PILLARS) { const d = dist(p, r), m = r.r + 18; if (d < m && d > 0 && p.h < r.h) { const nx = (p.x - r.x) / d, ny = (p.y - r.y) / d; p.x = r.x + nx * m; p.y = r.y + ny * m; } }
      // Adopt a recent client pose if it is within generous sprint+dash (incl. upward) bounds of the simulated position. Huge teleports are ignored.
      if (!p.bot && p.clientPose && (Date.now() - p.clientPose.at) < 450) {
        const c = p.clientPose, dd = Math.hypot(c.x - p.x, c.y - p.y), dh = Math.abs((c.h || 0) - p.h);
        const slack = (SPRINT + DASH_V) * ((c.dtIn || 0.1) + 0.35) + 320;
        const vslack = (DASH_UP + JUMP_V) * ((c.dtIn || 0.1) + 0.35) + 240;
        if (dd <= Math.max(550, slack) && dh <= Math.max(400, vslack)) {
          p.x = c.x; p.y = c.y; p.h = c.h;
          if (Number.isFinite(c.vx)) p.vx = c.vx; if (Number.isFinite(c.vy)) p.vy = c.vy; if (Number.isFinite(c.vh)) p.vh = c.vh;
        }
      }
      if (q.stage === 'question' && !q.picks.has(p.id)) for (const a of q.ans) if (a.landed && Math.hypot(p.x - a.x, p.y - a.y) < a.r + 18) { this.grab(p, a); break; }
    }
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i], ox = b.x, oy = b.y; b.life -= dt; b.x += b.vx * dt; b.y += b.vy * dt; let dead = b.life <= 0 || b.x < 0 || b.y < 0 || b.x > W || b.y > H;
      if (!dead) for (const r of this.rocks) if (closestDist(ox, oy, b.x, b.y, r.x, r.y) < r.r + b.r && b.h < r.r * 1.6) { r.hp--; r.vx += b.vx * 0.03; r.vy += b.vy * 0.03; this.ev({ k: 'spark', x: b.x, y: b.y }); dead = true; break; }
      if (!dead) for (const r of PILLARS) if (closestDist(ox, oy, b.x, b.y, r.x, r.y) < r.r + b.r && b.h < r.h) { this.ev({ k: 'spark', x: b.x, y: b.y }); dead = true; break; }
      // light aim-assist: gentle magnetism toward a nearby enemy already close to the shot line (trackpad-friendly, still has to aim)
      if (!dead) {
        const spd = Math.hypot(b.vx, b.vy) || 1;
        let best = null, bestAng = 0.20;
        for (const p of ps) {
          if (p.id === b.owner || !p.alive) continue;
          const dx = p.x - b.x, dy = p.y - b.y, d = Math.hypot(dx, dy);
          if (d < 24 || d > 1500) continue;
          const ang = Math.acos(Math.min(1, Math.max(-1, (b.vx * dx + b.vy * dy) / (spd * d))));
          if (ang < bestAng && Math.abs((p.h + 50) - b.h) < 150) { bestAng = ang; best = p; }
        }
        if (best) {
          const dx = best.x - b.x, dy = best.y - b.y, d = Math.hypot(dx, dy) || 1, k = Math.min(1, 2.2 * dt);
          b.vx += (dx / d * spd - b.vx) * k; b.vy += (dy / d * spd - b.vy) * k;
        }
      }
      // generously sized (~1.25x) player hit radius, trackpad-friendly but not oversized
      if (!dead) for (const p of ps) if (p.id !== b.owner && p.alive && closestDist(ox, oy, b.x, b.y, p.x, p.y) < 40 + b.r && Math.abs(p.h + 50 - b.h) < 106) {
        if (p.block > 0 && this.front(p, p.x - b.vx, p.y - b.vy)) { // deflect it back toward the shooter
          const o = this.players.get(b.owner), sp = Math.hypot(b.vx, b.vy) * 1.1; let a = Math.atan2(-b.vy, -b.vx); if (o && o.alive) a = Math.atan2(o.y - b.y, o.x - b.x);
          b.vx = Math.cos(a) * sp; b.vy = Math.sin(a) * sp; b.owner = p.id; b.life = 1; b.x += Math.cos(a) * 30; b.y += Math.sin(a) * 30; p.en = Math.max(0, p.en - 8);
          this.ev({ k: 'deflect', x: b.x, y: b.y, id: p.id }); break;
        }
        if (this.damage(p, this.players.get(b.owner), b.dmg || TOOLS[0].dmg, 'blaster', b.vx * 0.2, b.vy * 0.2)) { dead = true; break; }
      }
      if (dead) this.bullets.splice(i, 1);
    }
    for (let i = this.meteors.length - 1; i >= 0; i--) {
      const m = this.meteors[i]; m.life -= dt; m.x += m.vx * dt; m.y += m.vy * dt; if (m.src === 'vesta') { m.vx *= 0.985; m.vy *= 0.985; }
      let dead = m.life <= 0 || m.x < -100 || m.x > W + 100 || m.y < -100 || m.y > H + 100;
      if (!dead) for (const p of ps) if (p.alive && Math.hypot(p.x - m.x, p.y - m.y) < 18 + m.r) { this.ko(p, null, m.src === 'vesta' ? 'got hit by a Vesta chunk' : 'got hit by a meteoroid'); dead = true; break; }
      if (!dead && m.src !== 'vesta') for (const body of [CERES, VESTA]) if (dist(m, body) < surface(body, Math.atan2(m.y - body.y, m.x - body.x))) { dead = true; this.ev({ k: 'boom', x: m.x, y: m.y, r: 60 }); }
      if (dead) this.meteors.splice(i, 1);
    }
    for (let i = this.rocks.length - 1; i >= 0; i--) {
      const r = this.rocks[i]; r.x += r.vx * dt; r.y += r.vy * dt; r.rot += r.spin * dt; r.vx *= Math.pow(0.05, dt); r.vy *= Math.pow(0.05, dt);
      if (r.x < r.r || r.x > W - r.r) r.vx = (r.x < r.r ? 1 : -1) * Math.abs(r.vx); if (r.y < r.r || r.y > H - r.r) r.vy = (r.y < r.r ? 1 : -1) * Math.abs(r.vy);
      if (r.hp <= 0) { this.rocks.splice(i, 1); this.rockDirty = true; this.ev({ k: 'rock', x: r.x, y: r.y, r: r.r }); if (r.r > 34) for (let j = 0; j < 2; j++) this.spawnRock(r.x + rnd(-10, 10), r.y + rnd(-10, 10), r.r * 0.55, rnd(-110, 110), rnd(-110, 110)); }
    }
    while (this.rocks.length < 28) this.spawnRock();
    if (this.dirtyRoster || this.tickN % TICK === 0) { this.dirtyRoster = false; this.roster(); }
    this.snapshot();
  }
  snapshot() {
    if (this.tickN % SNAP_EVERY) return;
    const R = Math.round, q = this.q, r1 = v => R(v * 10) / 10;
    const ev = this.events; this.events = [];
    const movingRock = this.rocks.some(r => Math.abs(r.vx) + Math.abs(r.vy) > 2);
    const sendRocks = this.rockDirty || movingRock || !this.rockSnap || this.tickN % (SNAP_EVERY * 10) === 0;
    if (sendRocks) { this.rockSnap = this.rocks.map(r => [r.id, R(r.x), R(r.y), R(r.r), r1(r.rot)]); this.rockDirty = false; }
    const s = { t: 's', n: this.tickN, ts: Date.now(), left: Math.max(0, R(this.duration - this.time)), qs: q.stage, ql: Math.max(0, R(q.until - this.time)), qn: q.n,
      p: [...this.players.values()].map(p => [p.id, R(p.x), R(p.y), R(p.a * 100) / 100, (p.alive ? 1 : 0) | (p.block > 0 ? 2 : 0) | (p.inv > 0 ? 4 : 0) | (q.picks.has(p.id) ? 16 : 0) | (p.swing > 0 ? 32 : 0),
        p.tool, R(p.vx), R(p.vy), R(p.respawnAt - this.time), r1(p.cds[0]), r1(p.cds[1]), r1(p.cds[2]), p.jumps, R(p.h),
        R(p.hp), p.ammo | 0, R(p.en), r1(p.dashCd), (p.reloading > 0 ? 1 : 0) | (p.iframe > 0 ? 2 : 0) | (p.slam ? 4 : 0), p.combo,
        r1(p.reloading || 0), r1(p.slamCd || 0)]),
      ev };
    if (sendRocks) s.r = this.rockSnap;
    if (this.bullets.length) s.b = this.bullets.map(b => [R(b.x), R(b.y), R(b.vx), R(b.vy), R(b.h)]);
    if (this.meteors.length) s.m = this.meteors.map(m => [R(m.x), R(m.y), R(m.vx), R(m.vy), R(m.r)]);
    if (q.ans.length) s.a = q.ans.map(a => [a.i, R(a.x), R(a.y), a.r, r1(Math.max(0, a.landAt - this.time))]);
    if (this.falls.length) s.f = this.falls.map(f => [R(f.x), R(f.y), r1(f.t), f.r, f.big || 0]);
    if (!ev.length) delete s.ev;
    for (const p of this.players.values()) if (p.ws && p.ws.readyState === 1) {
      s.ack = p.inSeq || 0;
      s.pr = [R(p.x), R(p.y), R(p.h), R(p.vx), R(p.vy), R(p.vh), p.jumps, R(p.kbx), R(p.kby)];
      p.ws.send(JSON.stringify(s));
    }
    delete s.ack; delete s.pr;
    const hostS = JSON.stringify(s);
    for (const h of this.hosts) if (h.readyState === 1) h.send(hostS);
  }
}
function segDist(px, py, x1, y1, x2, y2) { const dx = x2 - x1, dy = y2 - y1, l = dx * dx + dy * dy; let t = l ? ((px - x1) * dx + (py - y1) * dy) / l : 0; t = clamp(t, 0, 1); return Math.hypot(px - x1 - t * dx, py - y1 - t * dy); }
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }
function pick(a) { return a[Math.random() * a.length | 0]; }
const clean = s => String(s || '').replace(/<[^>]*>/g, '').replace(/[<>&"'`]/g, '').replace(/\s+/g, ' ').trim().slice(0, 14);

// ---------- HTTP ----------
const INDEX = path.join(__dirname, 'public', 'index.html'), INDEX3D = path.join(__dirname, 'public', '3d.html');
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/healthz') { res.writeHead(200, { 'content-type': 'text/plain', 'access-control-allow-origin': '*', 'cache-control': 'no-store' }); return res.end(process.env.SPACE_ID || process.env.SINGLE_PROCESS ? 'ok single-process' : 'ok'); } // SPACE_ID is set by Hugging Face Spaces
  if (url.pathname === '/favicon.ico' || url.pathname === '/apple-touch-icon.png') { res.writeHead(204); return res.end(); }
  if (url.pathname === '/qr.svg') {
    try { const svg = await QRCode.toString(String(url.searchParams.get('u') || '').slice(0, 300), { type: 'svg', margin: 1, color: { dark: '#0b0820', light: '#ffffff' } });
      res.writeHead(200, { 'content-type': 'image/svg+xml', 'cache-control': 'no-store' }); return res.end(svg); } catch { res.writeHead(400); return res.end(); }
  }
  if (url.pathname.startsWith('/vendor/') && /^\/vendor\/[\w.-]+\.js$/.test(url.pathname)) {
    const f = path.join(__dirname, 'public', url.pathname); if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'public, max-age=86400' }); return fs.createReadStream(f).pipe(res);
  }
  if (url.pathname === '/classic' || url.pathname === '/classic/host') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache' }); return fs.createReadStream(INDEX).pipe(res);
  }
  if (url.pathname === '/' || url.pathname === '/host' || url.pathname === '/index.html') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache' }); return res.end(fs.readFileSync(INDEX3D, 'utf8').replace('__REDIRECT_TO__', String(process.env.REDIRECT_TO || '').replace(/[^\w:/.\-]/g, ''))); // REDIRECT_TO (optional): forward visitors to the real single-process host
  }
  if (false) {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache' }); return fs.createReadStream(INDEX).pipe(res);
  }
  res.writeHead(404); res.end('not found');
});

// ---------- WebSocket ----------
const wss = new WebSocketServer({ server, maxPayload: 16384 });
// Keepalive: hosting proxies (e.g. Hugging Face Spaces) close sockets that go quiet; a ping every 25 s keeps lobby sockets open (browsers answer pings automatically).
setInterval(() => { for (const c of wss.clients) if (c.readyState === 1) { try { c.ping(); } catch {} } }, 15000).unref();
wss.on('connection', (ws) => {
  let room = null, me = null, isHost = false, msgs = 0;
  const rate = setInterval(() => { msgs = 0; }, 1000);
  ws.on('message', (raw) => {
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (m.t === 'ping') { try { if (ws.readyState === 1) ws.send(JSON.stringify({ t: 'pong' })); } catch {} return; }
    if (++msgs > 80) return; // simple flood guard
    if (m.t === 'host') {
      if (m.code && rooms.has(m.code) && rooms.get(m.code).key === m.key) room = rooms.get(m.code);
      else { room = new Room(String(m.origin || '').slice(0, 200)); rooms.set(room.code, room); }
      isHost = true; room.hosts.add(ws);
      room.send(ws, { t: 'hosted', code: room.code, key: room.key, phase: room.phase, W, H, ceres: CERES, vesta: VESTA, build: BUILD, world: worldCfg() }); room.roster(); return;
    }
    if (m.t === 'join') {
      const r = rooms.get(String(m.code || '').toUpperCase().trim());
      if (!r) return room === null && ws.send(JSON.stringify({ t: 'error', code: 'no_room', text: 'No game with that code. Check the code on the big screen. If it changed, the host may have started a new game.' }));
      room = r; room.lastActive = Date.now();
      let p = [...room.players.values()].find(x => x.token && x.token === m.token);
      if (p) { p.ws = ws; p.connected = true; if (!p.dropAt || Date.now() - p.dropAt < 75e3) { if (p.savedHp != null) { p.alive = true; p.hp = p.savedHp; p.respawnAt = 0; } else if (!p.alive) { p.respawnAt = Math.min(p.respawnAt || 0, room.time + 0.15); } } p.dropAt = 0; p.savedHp = null; }
      else {
        if (room.players.size >= MAX_PLAYERS) return ws.send(JSON.stringify({ t: 'error', code: 'full', text: 'This game is full.' }));
        const base = clean(m.name) || 'Explorer'; let name = base; for (let k = 2; [...room.players.values()].some(x => x.name === name); k++) name = base.slice(0, 14 - String(k).length) + k;
        p = room.addPlayer(name, COLORS.includes(m.color) ? m.color : COLORS[room.players.size % COLORS.length], ws);
      }
      me = p; room.send(ws, { t: 'joined', id: p.id, token: p.token, name: p.name, color: p.color, code: room.code, phase: room.phase, W, H, ceres: CERES, vesta: VESTA, build: BUILD, world: worldCfg() });
      if (room.phase === 'play' && room.q.stage !== 'break') { const Q = QUESTIONS[room.q.qid]; room.send(ws, { t: 'question', n: room.q.n, q: Q.q, opts: room.q.opts || Q.opts, time: Math.max(0, room.q.until - room.time) }); }
      room.roster(); return;
    }
    if (!room) return;
    if (isHost && room.hosts.has(ws)) {
      if (m.t === 'start') room.start(m.duration);
      if (m.t === 'botlevel' && BOT_LEVELS[m.v]) { room.botLevel = m.v; }
      if (m.t === 'bots') { const n = clamp(m.n | 0, 1, 10); for (let i = 0; i < n && room.players.size < MAX_PLAYERS; i++) room.addPlayer(BOT_NAMES[(room.players.size + i) % BOT_NAMES.length] + (room.players.size > 9 ? room.players.size : ''), COLORS[(room.players.size) % COLORS.length], null, true); }
      if (m.t === 'clearbots') { for (const [k, p] of room.players) if (p.bot) room.players.delete(k); room.roster(); }
      if (m.t === 'kick') { const p = room.players.get(m.id); if (p) { room.send(p.ws, { t: 'error', code: 'kicked', text: 'You were removed by the host.' }); room.players.delete(m.id); room.roster(); } }
      if (m.t === 'endnow' && room.phase === 'play') room.end();
      if (m.t === 'lobby') { room.phase = 'lobby'; room.reset(); room.toAll({ t: 'lobby' }); room.roster(); }
      return;
    }
    if (!me) return;
    if (m.t === 'in') { me.inAt = Date.now(); const i = me.input; i.mx = clamp(+m.mx || 0, -1, 1); i.my = clamp(+m.my || 0, -1, 1); i.a = +m.a || 0; i.f = m.f ? 1 : 0; i.tool = clamp(m.tool | 0, 0, 2); i.dash = m.d ? 1 : 0; i.sprint = m.s ? 1 : 0; i.q = m.q ? 1 : 0; i.rl = m.rl ? 1 : 0; i.p = Math.max(-1.5, Math.min(1.5, +m.p || 0)); if (!Number.isFinite(i.a)) i.a = 0; if (m.n != null) me.inSeq = (m.n | 0) >>> 0;
      // Client pose: trusted only if it could be reached with sprint + dash (incl. upward). Used after the physics step so we don't double-move.
      if (Number.isFinite(+m.x) && Number.isFinite(+m.y)) {
        const dtIn = Math.min(0.9, Math.max(0.05, (Date.now() - (me.poseAt || Date.now() - 80)) / 1000));
        me.poseAt = Date.now();
        me.clientPose = { x: +m.x, y: +m.y, h: Number.isFinite(+m.h) ? +m.h : me.h, vx: Number.isFinite(+m.vx) ? +m.vx : me.vx, vy: Number.isFinite(+m.vy) ? +m.vy : me.vy, vh: Number.isFinite(+m.vh) ? +m.vh : me.vh, at: Date.now(), dtIn };
      }
    }
  });
  ws.on('close', () => { clearInterval(rate); if (room) { room.hosts.delete(ws); if (me && me.ws === ws) { me.connected = false; me.input = { mx: 0, my: 0, a: me.a, f: 0, tool: 0, dash: 0, sprint: 0, q: 0 }; room.roster(); } } });
});

setInterval(() => { for (const r of rooms.values()) r.tick(1 / TICK); }, 1000 / TICK);
setInterval(() => { // remove abandoned rooms after 30 min of nobody connected
  const now = Date.now();
  for (const [c, r] of rooms) { const live = r.hosts.size || [...r.players.values()].some(p => p.connected && !p.bot); if (live) r.lastActive = now; else if (now - r.lastActive > 30 * 60e3) rooms.delete(c); }
}, 60e3);
// On Vercel the platform owns the socket: export the server (WebSockets via Fluid compute). Everywhere else (local, Docker/HF Spaces on 7860) listen.
if (process.env.VERCEL) module.exports = server;
else server.listen(PORT, () => console.log(`Rock Run Online on http://localhost:${PORT}  (host screen: /host)`));
