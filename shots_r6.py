#!/usr/bin/env python3
"""Round 6 visual + sanity screenshots: first-person hands, ammo HUD, third person, tools."""
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
    srv=subprocess.Popen(['node','server.js'],env=dict(os.environ,RR_FAST='1',PORT='3316'),cwd=HERE,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
    time.sleep(0.9); B='http://127.0.0.1:3316'
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
        await host.screenshot(path=OUT+'round6-host-lobby.png')
        pc=await br.new_context(viewport={'width':1280,'height':720}); pg=await pc.new_page(); watch(pg,'omar')
        await pg.goto(B+'/?code='+code)
        await pg.fill('#nick','Omar')
        await pg.click('#joinBtn')
        await pg.wait_for_selector('#wait.on')
        print('how text sample', await pg.evaluate("document.querySelector('#how1')&&$('#how1').innerText.slice(0,180)"))
        await pg.screenshot(path=OUT+'round6-wait-how.png')
        await host.evaluate("send({t:'start',duration:120})")
        await pg.wait_for_selector('#hud.on',timeout=8000)
        # settle into first person
        await pg.wait_for_timeout(700)
        build=await pg.evaluate("({build:window.RR_BUILD,fp:!!firstPerson,vm:!!(VM&&VM.g&&VM.g.visible),ammo:!!document.getElementById('ammo'),hands:!!(VM&&VM.g),stats:window.RR_STATS})")
        print('play state',build)
        # look slightly down so hands fill the frame, force first person
        await pg.evaluate("""()=>{firstPerson=true;pitch=0.12;yaw=0.5;if(typeof selTool==='function')selTool(0);const lp=document.getElementById('lockp');if(lp)lp.style.display='none'}""")
        await pg.wait_for_timeout(250)
        await pg.screenshot(path=OUT+'round6-fp-blaster.png')
        await pg.evaluate("selTool(1)")
        await pg.wait_for_timeout(350)  # draw anim
        await pg.screenshot(path=OUT+'round6-fp-fist.png')
        await pg.evaluate("selTool(2)")
        await pg.wait_for_timeout(350)
        await pg.screenshot(path=OUT+'round6-fp-shield.png')
        # cycle with wheel
        await pg.mouse.wheel(0,180)
        await pg.wait_for_timeout(200)
        tool1=await pg.evaluate('myTool')
        await pg.mouse.wheel(0,180)
        await pg.wait_for_timeout(200)
        tool2=await pg.evaluate('myTool')
        print('wheel cycle',tool1,tool2)
        await pg.keyboard.press('KeyR')
        await pg.wait_for_timeout(200)
        await pg.evaluate("selTool(0);firstPerson=true;pitch=0.25")
        await pg.wait_for_timeout(200)
        await pg.screenshot(path=OUT+'round6-fp-ammo-hud.png')
        # third person
        await pg.keyboard.press('KeyC')
        await pg.wait_for_timeout(300)
        tp=await pg.evaluate("({fp:firstPerson,hint:document.getElementById('camHint')&&document.getElementById('camHint').textContent,astro:!!(G3&&G3.astros.get(myId)&&G3.astros.get(myId).g.visible),camY:+camera.position.y.toFixed(2),vm:!!(VM&&VM.g.visible)})")
        print('third person',tp)
        await pg.screenshot(path=OUT+'round6-third-person.png')
        await pg.keyboard.press('KeyC')
        await pg.wait_for_timeout(250)
        await pg.screenshot(path=OUT+'round6-fp-again.png')
        # host view
        await host.evaluate("send({t:'bots',n:3})"); await host.wait_for_timeout(600)
        await host.screenshot(path=OUT+'round6-host-play.png')
        await br.close()
    srv.terminate()
    print('errors',len(errs))
    for e in errs[:20]: print(' ERR',e)
    print('shots',sorted(f for f in os.listdir(OUT) if f.startswith('round6-')))

asyncio.run(main())
