# Rock Run Online: Rocks in Space 🚀☄️

A class game for the "Rocks in Space" project by Omar, Adil, Haniya, Ayesha and Bardia.
Everyone joins one online room from their own laptop or phone, runs around as a 3D astronaut on the
surface of the dwarf planet Ceres, fights, and answers science questions from the slides by
touching answer meteors that fall from the sky. Most points wins.

- `/` and `/host` = **3D version** (Three.js, included offline in `public/vendor/`)
- `/classic` and `/classic/host` = the older 2D version

## Play online (hosting)
The game keeps every room in the memory of ONE running server, so it needs a host that runs a single process.
**Main host: Render free web service** (WebSockets work). `render.yaml` sets it up: build `npm ci --omit=dev`,
start `node server.js`, `SINGLE_PROCESS=1`, health check `/healthz`; the server listens on `$PORT`.
- Players: `https://<service>.onrender.com/` · Big screen: `https://<service>.onrender.com/host`
- Free plan sleeps after ~15 min with nobody connected; the first visit then takes ~1 min to wake. Open `/host` a few minutes before class.
- Every push to the GitHub repo redeploys automatically.

**Why not Vercel?** `https://rock-run-online-notomar2014-1642.vercel.app` runs several copies of the server and cuts
sockets every 5 minutes, so students can land on a copy without the host's room ("No game with that code", players who
can't move). Set `REDIRECT_TO=https://<service>.onrender.com` on that Vercel project and it forwards visitors there
(only once the target's `/healthz` answers `ok single-process`).

## Run it on your computer
```
npm install
npm start            # http://localhost:3000
```
- Teacher / big screen: `http://localhost:3000/host`; students: `http://localhost:3000` (other devices need your network address, e.g. `http://192.168.1.20:3000`).

## How to play
| | Laptop | Phone |
|---|---|---|
| Look | click the game to lock the mouse, then move it to look (Esc unlocks) · **C** toggles third person · Look slider at the bottom-right | drag on the right half of the screen |
| Move | W A S D / ↑ ↓ (relative to the camera) · Shift sprint · Space jump (press again in the air = double jump, low gravity!) · Q dodge dash | joystick · JUMP · DASH buttons |
| Tools | 1 / 2 / 3 or **scroll wheel** to switch · left-click to use · **R** reloads the blaster | tap a tool button (auto-aims) |

- **Answer meteors:** about every 15 s of fighting, a question appears as a banner at the top and 4 glowing lettered meteors (A red, B blue, C yellow, D green, answer written above) crash down onto Ceres. Play keeps going. Run into one to choose it (one pick per question). Right = **+200**, wrong = **−50** (never below 0). Off-screen arrows and minimap squares show where they are. Then the answer is revealed with a slide fact (and a short “Did you know?”), and 15 s of fighting follow. Questions and answer letters are shuffled each time, from a pool of 60 accurate Rocks in Space questions, with no repeats until the pool wraps.
- Bots: pick Easy (default), Medium or Hard in the host lobby. Easy bots mostly go for answers, aim badly and only sometimes fight, so a kid who knows the answer beats them.
- After respawning you get 3 s of spawn protection (gold bubble); it ends early if you attack. You respawn far from other players.
- Camera is **first person by default** (you see your hands and the current tool; they animate when you switch, fire, or reload). Press **C** for third person behind your astronaut.
- Scoring: right answer **+200**, KO someone **+100**, getting KO’d **−50**, meteor hit **−50**, wrong answer **−50** (score never goes below 0). Changes pop up as floating text.

## The 3 tools (cartoon knockouts, no blood)
Everyone has 100 health (bar above heads and on your HUD). Health comes back after 4 s without being hit.
| Slot | Tool | What it does |
|---|---|---|
| 1 🔫 | Blaster | 2 shots = KO (55 damage), 10-round magazine, then a reload. Press **R** to reload early. Ammo is on the HUD. |
| 2 👊 | Punch | 3-hit combo = KO. Jump and click in the air for a **slam**, a 1-hit KO, then a cooldown shown on the HUD. |
| 3 🛡️ | Shield | hold to block from the front, uses energy, bounces blaster shots back |

## Chaos events
Meteoroid swarm (jump to dodge!), and Vesta impact (chunks spray from the south-pole crater). An "Earth view" then shows a Vesta chunk become a meteor streak, then a tiny meteorite.

## Test
`node verify_public.js wss://<host> [secs]` checks a public URL (host + 5 players + fresh joins over time + start + movement). `python3 camtest.py [url]` checks real keyboard/mouse input, camera orbit/zoom and answer spread. `python3 test3d.py` (3D) or `python3 test.py` (2D), Playwright: host + 5 players (one on a phone) + 3 bots; saves screenshots to `screenshots/`. `python3 fairtest.py` plays 3 kids who know the answers against 3 Easy bots.
