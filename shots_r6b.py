#!/usr/bin/env python3
"""Round 6b visual review: clean HUD, FP weapons, larger map."""
import asyncio, os, subprocess, time
from playwright.async_api import async_playwright
HERE=os.path.dirname(os.path.abspath(__file__))
OUT=os.path.join(HERE,'screenshots')+'/'
os.makedirs(OUT,exist_ok=True)
errs=[]
CHROME='/usr/bin/google-chrome'
ARGS=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-sandbox']

async def main():
    subprocess.run(['pkill','-f','node server.js'],capture_output=True)
    time.sleep(0.3)
    srv=subprocess.Popen(['node','server.js'],env=dict(os.environ,RR_FAST='1',PORT='3317'),cwd=HERE,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
    time.sleep(0.9); B='http://127.0.0.1:3317'
    def watch(pg,name):
        pg.on('console',lambda m: m.type=='error' and errs.append(f'{name}: {m.text}'))
        pg.on('pageerror',lambda e: errs.append(f'{name} PAGEERROR: {e}'))
    async with async_playwright() as p:
        launch=dict(args=ARGS)
        if os.path.exists(CHROME): launch['executable_path']=CHROME
        br=await p.chromium.launch(**launch)
        hc=await br.new_context(viewport={'width':1280,'height':720}); host=await hc.new_page(); watch(host,'host')
        await host.goto(B+'/host'); await host.wait_for_function("document.querySelector('#bigCode').textContent.length===4")
        code=await host.text_content('#bigCode')
        print('code',code,'hostBuild',await host.evaluate('window.RR_BUILD'))
        await host.screenshot(path=OUT+'round6b-host-lobby.png')
        pc=await br.new_context(viewport={'width':1280,'height':720}); pg=await pc.new_page(); watch(pg,'omar')
        await pg.goto(B+'/?code='+code)
        await pg.fill('#nick','Omar')
        await pg.click('#joinBtn')
        await pg.wait_for_selector('#wait.on')
        await pg.screenshot(path=OUT+'round6b-lobby-how.png')
        await host.evaluate("send({t:'start',duration:180})")
        await pg.wait_for_selector('#hud.on',timeout=8000)
        await pg.wait_for_function("phase==='play'&&disp&&disp.get(myId)&&camera&&camera.position.y<10",timeout=8000)
        await pg.wait_for_timeout(300)
        st=await pg.evaluate("""()=>{firstPerson=true;pitch=0.12;yaw=0.55;if(typeof selTool==='function')selTool(0);
          return {build:window.RR_BUILD,fp:!!firstPerson,vm:!!(VM&&VM.g&&VM.g.visible),camY:+camera.position.y.toFixed(2),
            lockp:getComputedStyle(document.getElementById('lockp')).display,
            tip:getComputedStyle(document.getElementById('tip')).display,
            clutter:!!document.getElementById('camHint')||!!document.getElementById('lookSet'),
            pause:!!document.getElementById('pause'),
            W:(cfg&&cfg.W),H:(cfg&&cfg.H)} }""")
        print('play state',st)
        await pg.wait_for_timeout(250)
        await pg.screenshot(path=OUT+'round6b-fp-blaster.png')
        await pg.evaluate("selTool(1)")
        await pg.wait_for_timeout(400)
        await pg.screenshot(path=OUT+'round6b-fp-fist.png')
        await pg.evaluate("selTool(2)")
        await pg.wait_for_timeout(400)
        await pg.screenshot(path=OUT+'round6b-fp-shield.png')
        await pg.evaluate("selTool(0);firstPerson=true")
        # wait for a question banner
        try:
            await pg.wait_for_function("!!(curQ&&document.getElementById('qban').classList.contains('on'))",timeout=12000)
            await pg.wait_for_timeout(400)
            await pg.screenshot(path=OUT+'round6b-fp-question.png')
        except Exception as e:
            print('question wait',e)
            await pg.screenshot(path=OUT+'round6b-fp-question.png')
        # third person then a high overview
        await pg.evaluate("firstPerson=false;pitch=0.45;zoomT=8;camD=8")
        await pg.wait_for_timeout(400)
        await pg.screenshot(path=OUT+'round6b-third.png')
        # host overview of the bigger map
        await host.evaluate("""()=>{if(camera){camera.position.set(8,38,42);camera.lookAt(0,0,0);camera.fov=50;camera.updateProjectionMatrix()}}""")
        await host.wait_for_timeout(200)
        await host.screenshot(path=OUT+'round6b-map-overview.png')
        # pause menu
        await pg.keyboard.press('Escape')
        await pg.wait_for_timeout(200)
        pause=await pg.evaluate("!!(document.getElementById('pause')&&pause.classList.contains('on'))")
        print('pause open',pause)
        await pg.screenshot(path=OUT+'round6b-pause.png')
        await br.close()
    srv.terminate()
    print('errors',len(errs))
    for e in errs[:20]: print(' ERR',e)
    print('shots',sorted(f for f in os.listdir(OUT) if f.startswith('round6b-')))

asyncio.run(main())
