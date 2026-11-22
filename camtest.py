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
        br=await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
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
        # right-drag orbit
        y0=await pg.evaluate('yaw'); await pg.mouse.move(640,360); await pg.mouse.down(button='right'); await pg.mouse.move(840,360,steps=8); await pg.mouse.up(button='right')
        y1=await pg.evaluate('yaw'); ok(abs(y1-y0)>0.2,f'right-drag turns the camera (yaw {y0:.2f} -> {y1:.2f})')
        await pg.mouse.move(640,360)
        for _ in range(3): await pg.mouse.wheel(0,200); await pg.wait_for_timeout(60)
        z=await pg.evaluate('camZoom'); ok(z>1.1,f'scroll zooms out (zoom x{z:.2f})')
        for _ in range(3): await pg.mouse.wheel(0,-200); await pg.wait_for_timeout(60)
        # Space jump, Q dash, tools via real keys
        await pg.evaluate("(()=>{window.mh=0;setInterval(()=>{const q=snap.p.find(q=>q[0]===myId);mh=Math.max(mh,q[13]||0)},30);window.dsent=0;const o=ws.send.bind(ws);ws.send=m=>{if(String(m).includes('d\":1'))dsent++;o(m)};return 0})()")
        await pg.keyboard.press('Space'); await pg.wait_for_timeout(700); h=await pg.evaluate("mh"); pass; ok(h>5,f'Space jumps (height {h:.0f})')
        for k,t in (('Digit2',1),('Digit3',2),('Digit1',0)): await pg.keyboard.press(k); ok(await pg.evaluate('myTool')==t,f'{k} picks tool {t}')
        await pg.mouse.click(640,360); await pg.wait_for_timeout(200)
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
