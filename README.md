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
| Look (Roblox camera) | hold **right mouse** + drag to orbit (mouse is never locked) · **← →** arrows turn the camera · **scroll = zoom** | drag on the right half of the screen |
| Move | W A S D / ↑ ↓ (relative to the camera; your astronaut turns to face where it walks) · Shift sprint · Space jump (press again in the air = double jump, low gravity!) · Q dodge dash | joystick · JUMP · DASH buttons |
| Tools | 1 / 2 / 3 to pick, left-click to use, aim with the crosshair | tap a tool button (auto-aims) |

- **Answer meteors:** about every 15 s of fighting, a question appears as a banner at the top and 4 glowing lettered meteors (A red, B blue, C yellow, D green, answer written above) crash down onto Ceres. Play keeps going. Run into one to choose it (one pick per question). Right = +300 (+200 more if you're first), wrong = -100 (never below 0). Off-screen arrows and minimap squares show where they are. Then the answer is revealed with a slide fact, and 15 s of fighting follow.
- Bots: pick Easy (default), Medium or Hard in the host lobby. Easy bots mostly go for answers, aim badly and only sometimes fight, so a kid who knows the answer beats them.
- After respawning you get 3 s of spawn protection (gold bubble); it ends early if you attack. You respawn far from other players.
- One hit = KO (BONK!) = +100 (+25 per streak, up to +200). Respawn after 3 s with 2.5 s of safety.
- Camera is third person behind the player (W always walks the way the camera faces). The 4 answer meteors land in 4 different directions around the arena, so turn around to find them. You can see Vesta, the Sun and Jupiter in the sky, and Ceres' bright salt spots.

## The 3 tools (cartoon knockouts, no blood)
Everyone has 100 health (bar above heads). Health comes back after 4 s without being hit. KO = +50 (+10 per streak) for the attacker, and the player who gets knocked out loses 30 (never below 0); a right answer is +300, so answering matters most.
| Slot | Tool | What it does |
|---|---|---|
| 1 🔫 | Blaster | fast glowing shots (~6.7 per second, very quick bullets), 26 damage (4 hits = KO), fired toward the crosshair. Heat meter: ~10 quick shots overheat it; it cools fast. Sprinting spreads your aim |
| 2 👊 | Punch | near-instant punches (0.18 s), lunge + wide swing, combo 20/20/32 damage (3rd hit launches people into the air). Punch while in the air = GROUND SLAM shockwave |
| 3 🛡️ | Shield | hold click to block from the front; reflects blaster shots back at the shooter. Uses energy (blue bar), you move slower |
| Q 💨 | Dodge dash | quick dash, can't be hit during it, 2.2 s cooldown |

## Chaos events
Meteoroid swarm (jump to dodge!), and Vesta impact (chunks spray from the south-pole crater). An "Earth view" then shows a Vesta chunk become a meteor streak, then a tiny meteorite.

## Test
`node verify_public.js wss://<host> [secs]` checks a public URL (host + 5 players + fresh joins over time + start + movement). `python3 camtest.py [url]` checks real keyboard/mouse input, camera orbit/zoom and answer spread. `python3 test3d.py` (3D) or `python3 test.py` (2D), Playwright: host + 5 players (one on a phone) + 3 bots; saves screenshots to `screenshots/`. `python3 fairtest.py` plays 3 kids who know the answers against 3 Easy bots.
