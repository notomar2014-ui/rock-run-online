# Real-browser check: join by TYPING in the form, start, hold W with real key presses -> the player must move;
# right-drag turns the camera; scroll zooms; W moves toward where the camera faces. Usage: python3 camtest.py [base_url]
import asyncio, sys, subprocess, os, time, math
from playwright.async_api import async_playwright
B=sys.argv[1] if len(sys.argv)>1 else None
OUT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'screenshots')+'/'
async def main():
    global B
    srv=None
    if not B:
        srv=subprocess.Popen(['node','server.js'],env=dict(os.environ,PORT='3313'),stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1.2); B='http://localhost:3313'
    fails=0
    def ok(c,m):
        nonlocal fails; print(('PASS ' if c else 'FAIL ')+m); fails+= (not c)
    async with async_playwright() as p:
        br=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-sandbox']) if os.path.exists('/usr/bin/google-chrome') else await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        errs=[]
        host=await (await br.new_context(viewport={'width':1280,'height':720})).new_page(); host.on('pageerror',lambda e: errs.append(str(e)))
        await host.goto(B+'/host'); await host.wait_for_function("document.querySelector('#bigCode').textContent.length===4"); code=await host.text_content('#bigCode')
        pg=await (await br.new_context(viewport={'width':1280,'height':720})).new_page(); pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.goto(B+'/'); await pg.click('#code') if await pg.locator('#code').count() else None
        if await pg.locator('#code').count(): await pg.fill('#code',code)
        await pg.click('#nick'); await pg.keyboard.type('Omar'); await pg.keyboard.press('Enter')
        await pg.wait_for_selector('#wait.on',timeout=8000)
        await host.evaluate("send({t:'start',duration:120})"); await pg.wait_for_selector('#hud.on'); await pg.wait_for_timeout(2500)
        ok(await pg.evaluate("!!disp.get(myId)"),'player sees itself in the game state (no overhead fallback)')
        p0=await pg.evaluate("(()=>{const d=disp.get(myId);return [d.x,d.y,yaw]})()")
        await pg.keyboard.down('KeyW'); await pg.wait_for_timeout(1500); await pg.keyboard.up('KeyW'); await pg.wait_for_timeout(300)
        p1=await pg.evaluate("(()=>{const d=disp.get(myId);return [d.x,d.y]})()")
        dx,dy=p1[0]-p0[0],p1[1]-p0[1]; moved=math.hypot(dx,dy)
        ok(moved>150,f'holding W (typed-in join, focus left in the form) moves the player: {moved:.0f} units')
        if moved>1: ok(math.cos(math.atan2(dy,dx)-p0[2])>0.8,'W moves toward where the camera faces')
        Y="yaw"
        # mouse lock: first click only locks (no shot), raw movementX/Y turn the camera while locked, Esc/unlock shows the hint
        await pg.evaluate("(()=>{window.lockCalls=0;const o=cv.requestPointerLock.bind(cv);cv.requestPointerLock=(...a)=>{lockCalls++;return o(...a)};window.shots0=0;const oe=onEvent;onEvent=e=>{if(e.id===myId&&e.k==='shot')shots0++;oe(e)};return 0})()")
        ok(await pg.evaluate("getComputedStyle(document.querySelector('#lockp')).display!=='none'"),'"Click to lock the mouse" hint shows while unlocked')
        await pg.mouse.move(640,360); await pg.mouse.move(900,200,steps=8)
        ok(abs(await pg.evaluate(Y)-p0[2])<1e-6,'plain mouse moves do not turn the camera while unlocked')
        await pg.mouse.click(640,360); await pg.wait_for_timeout(500)
        lc,pl,sh=await pg.evaluate("[lockCalls,!!document.pointerLockElement,shots0]")
        ok(lc>=1,f'clicking the game requests pointer lock (calls {lc}, browser granted: {pl})'); ok(sh==0,'that first click does not fire')
        await pg.evaluate("document.exitPointerLock()"); await pg.wait_for_timeout(300)
        bb=await pg.locator('#lockp').bounding_box(); await pg.mouse.click(bb['x']+bb['width']/2,bb['y']+bb['height']/2); await pg.wait_for_timeout(400)
        ok(await pg.evaluate("!!document.pointerLockElement&&locked"),'a real click ON the HUD hint overlay locks the mouse (document.pointerLockElement set)')
        pl=await pg.evaluate("!!document.pointerLockElement")
        if not pl: await pg.evaluate("locked=true")  # headless may refuse real lock; test the locked code path directly
        ya=await pg.evaluate(Y); pa=await pg.evaluate('pitch')
        await pg.evaluate("document.dispatchEvent(new MouseEvent('mousemove',{movementX:200,movementY:-50}))")
        yb2,pb=await pg.evaluate("[yaw,pitch]"); ok(abs((yb2-ya)-0.44)<0.01 and abs((pb-pa)+0.11)<0.01,f'locked: raw mouse turns the camera at 0.0022 rad/px (yaw +{yb2-ya:.2f}, pitch {pb-pa:+.2f})')
        await pg.keyboard.down('KeyD'); await pg.wait_for_timeout(500); await pg.keyboard.up('KeyD'); await pg.wait_for_timeout(200)
        f2,y4=await pg.evaluate("[myFace,yaw]"); ok(abs(f2-y4)<1e-6,'locked: character faces the camera direction while strafing with D')
        await pg.mouse.down(); await pg.wait_for_timeout(500); await pg.mouse.up(); await pg.wait_for_timeout(600)
        ok(await pg.evaluate('shots0')>=2,f"locked: left click uses the tool ({await pg.evaluate('shots0')} shots)")
        await pg.evaluate("document.exitPointerLock&&document.exitPointerLock();locked=false"); await pg.wait_for_timeout(300)
        ok(await pg.evaluate("getComputedStyle(document.querySelector('#lockp')).display!=='none'"),'after unlocking (Esc) the hint is back')
        lc1=await pg.evaluate('lockCalls'); await pg.mouse.click(640,360); await pg.wait_for_timeout(300); ok(await pg.evaluate('lockCalls')>lc1,'clicking again re-requests the lock')
        await pg.evaluate("document.exitPointerLock&&document.exitPointerLock();locked=false"); await pg.wait_for_timeout(200)
        p0=[0,0,await pg.evaluate(Y)]
        y0=await pg.evaluate(Y); await pg.mouse.move(640,360); await pg.mouse.down(button='right'); await pg.mouse.move(840,330,steps=8)
        y1=await pg.evaluate(Y); await pg.mouse.up(button='right'); await pg.mouse.move(300,500,steps=8); y2=await pg.evaluate(Y)
        ok(abs(y1-y0)>0.4,f'right-drag turns the camera (yaw {y0:.2f} -> {y1:.2f})'); ok(abs(y2-y1)<1e-6,'releasing right mouse stops the turning')
        await pg.keyboard.down('ArrowRight'); await pg.wait_for_timeout(400); await pg.keyboard.up('ArrowRight'); y3=await pg.evaluate(Y); ok(y3-y2>0.08,f'right arrow turns the camera ({y3-y2:.2f} rad)')
        z0=await pg.evaluate('zoomT')
        for _ in range(3): await pg.mouse.wheel(0,200); await pg.wait_for_timeout(60)
        z1=await pg.evaluate('zoomT'); await pg.wait_for_timeout(400); d=await pg.evaluate('camera.position.distanceTo(W3(disp.get(myId).x,disp.get(myId).y,disp.get(myId).h))')
        ok(z1>z0*1.3,f'scroll zooms out ({z0:.1f} -> {z1:.1f}, camera {d:.1f} away)')
        for _ in range(3): await pg.mouse.wheel(0,-200); await pg.wait_for_timeout(60)
        await pg.keyboard.down('KeyW'); await pg.wait_for_timeout(300); await pg.evaluate("dispatchEvent(new Event('blur'))"); await pg.wait_for_timeout(500)
        q1=await pg.evaluate("[disp.get(myId).x,disp.get(myId).y,!!keys.KeyW]"); await pg.wait_for_timeout(700); q2=await pg.evaluate("[disp.get(myId).x,disp.get(myId).y]"); await pg.keyboard.up('KeyW')
        ok(not q1[2] and math.hypot(q2[0]-q1[0],q2[1]-q1[1])<25,f'window blur clears held W and the player stops (drift {math.hypot(q2[0]-q1[0],q2[1]-q1[1]):.0f})')
        # strafe right with D: character faces its walking direction (camera yaw + 90°), camera does not swing behind
        yb=await pg.evaluate(Y); await pg.keyboard.down('KeyD'); await pg.wait_for_timeout(700); await pg.keyboard.up('KeyD'); await pg.wait_for_timeout(250)
        face,sv,ya=await pg.evaluate("[myFace,snap.p.find(q=>q[0]===myId)[3],yaw]")
        ok(math.cos(face-(yb+math.pi/2))>0.95 and math.cos(sv-(yb+math.pi/2))>0.9,f'character faces the move direction (face {face:.2f}, server {sv:.2f}, want {yb+math.pi/2:.2f})')
        ok(abs(ya-yb)<1e-6,'camera does not auto-rotate behind the player')
        await pg.mouse.click(640,360); await pg.wait_for_timeout(200)
        await pg.evaluate("(()=>{window.shots=[];window.swings=[];window.bsp=0;const o=onEvent;onEvent=e=>{if(e.id===myId&&e.k==='shot')shots.push(performance.now());if(e.id===myId&&e.k==='swing')swings.push(performance.now());o(e)};setInterval(()=>{for(const b of snap.b)bsp=Math.max(bsp,Math.hypot(b[2],b[3]))},30);return 0})()")
        await pg.keyboard.press('Digit1'); await pg.mouse.move(640,360); await pg.mouse.down(); await pg.wait_for_timeout(1000); await pg.mouse.up(); await pg.wait_for_timeout(200)
        n,sp=await pg.evaluate("[shots.length,bsp]"); ok(n>=6,f'blaster fires {n} shots in 1 s (was ~3)'); ok(sp>1600,f'blaster shot speed {sp:.0f} (was 760)')
        await pg.wait_for_timeout(1700); await pg.keyboard.press('Digit2'); await pg.mouse.down(); await pg.wait_for_timeout(1000); await pg.mouse.up(); await pg.wait_for_timeout(200)
        m=await pg.evaluate("swings.length"); ok(m>=4,f'punch swings {m} times in 1 s (was ~2.6)')
        heat=await pg.evaluate("snap.p.find(q=>q[0]===myId)[15]"); await pg.keyboard.press('Digit1')
        await pg.keyboard.press('KeyQ'); await pg.wait_for_timeout(150)
        # wait for a question; answer meteors should be spread in different directions
        await pg.wait_for_function("curQ&&snap.a.length===4",timeout=30000,polling=200)
        spread=await pg.evaluate("(()=>{const c=[cfg.W/2,cfg.H/2];const A=snap.a.map(a=>Math.atan2(a[2]-c[1],a[1]-c[0])).sort((a,b)=>a-b);let g=[];for(let i=0;i<4;i++)g.push(((A[(i+1)%4]-A[i])+Math.PI*4)%(Math.PI*2));return Math.min(...g)})()")
        ok(spread>0.8,f'answer meteors are in 4 different directions (smallest gap {math.degrees(spread):.0f}°)')
        await pg.wait_for_function("curQ&&snap.a.length===4&&snap.a.every(a=>a[4]===0)",timeout=15000,polling=100)
        # face the nearest answer for the screenshot
        await pg.evaluate("(()=>{const me=disp.get(myId);let g=null,b=1e9;for(const a of snap.a){const d=Math.hypot(a[1]-me.x,a[2]-me.y);if(d<b){b=d;g=a}}yaw=Math.atan2(g[2]-me.y,g[1]-me.x);pitch=.22})()")
        await pg.wait_for_timeout(600); await pg.screenshot(path=OUT+'3d-camera.png')
        ok(not errs,'no page errors '+(';'.join(errs)[:200]))
        await br.close()
    if srv: srv.terminate()
    print('CAMERA/INPUT TESTS:', 'all passed' if not fails else f'{fails} failed'); sys.exit(1 if fails else 0)
asyncio.run(main())
