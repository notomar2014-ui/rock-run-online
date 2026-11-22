#!/usr/bin/env python3
"""Round 5 visual + sanity screenshots."""
import asyncio, os, subprocess, time
from playwright.async_api import async_playwright
OUT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'screenshots')+'/'
os.makedirs(OUT,exist_ok=True)
errs=[]
async def main():
    subprocess.run(['pkill','-f','node server.js'],capture_output=True)
    time.sleep(0.3)
    srv=subprocess.Popen(['node','server.js'],env=dict(os.environ,RR_FAST='1',PORT='3315'),cwd=os.path.dirname(os.path.abspath(__file__)),stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
    time.sleep(0.8); B='http://127.0.0.1:3315'
    def watch(pg,name):
        pg.on('console',lambda m: m.type=='error' and errs.append(f'{name}: {m.text}'))
        pg.on('pageerror',lambda e: errs.append(f'{name} PAGEERROR: {e}'))
    async with async_playwright() as p:
        br=await p.chromium.launch(executable_path=__import__('os').environ.get('CHROME_PATH') or '/usr/bin/google-chrome',args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-sandbox']) if __import__('os').path.exists('/usr/bin/google-chrome') else p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        hc=await br.new_context(viewport={'width':1280,'height':720}); host=await hc.new_page(); watch(host,'host')
        await host.goto(B+'/host'); await host.wait_for_function("document.querySelector('#bigCode').textContent.length===4")
        code=await host.text_content('#bigCode'); print('code',code,'build',await host.evaluate('window.RR_BUILD'))
        await host.screenshot(path=OUT+'round5-host-lobby.png')
        # join screen with hats
        jc=await br.new_context(viewport={'width':1280,'height':720}); join=await jc.new_page(); watch(join,'join')
        await join.goto(B+'/?code='+code); await join.fill('#nick','Omar')
        await join.wait_for_selector('#hats'); await join.click('#hats b[data-h="2"]')
        await join.screenshot(path=OUT+'round5-join.png')
        await join.click('#joinBtn'); await join.wait_for_selector('#wait.on')
        await join.screenshot(path=OUT+'round5-wait.png')
        # more players
        players=[join]
        for i,n in enumerate(['Adil','Haniya']):
            c=await br.new_context(viewport={'width':1280,'height':720})
            pg=await c.new_page(); watch(pg,n)
            await pg.goto(B+'/?code='+code); await pg.fill('#nick',n)
            await pg.click(f'#hats b[data-h="{i+1}"]'); await pg.click('#joinBtn'); await pg.wait_for_selector('#wait.on')
            players.append(pg)
        phone_c=await br.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True)
        phone=await phone_c.new_page(); watch(phone,'phone')
        await phone.goto(B+'/?code='+code); await phone.fill('#nick','Bardia'); await phone.click('#joinBtn'); await phone.wait_for_selector('#wait.on')
        await host.click('#addBots'); await host.wait_for_timeout(400)
        await host.screenshot(path=OUT+'round5-lobby.png')
        await host.evaluate("send({t:'start',duration:50})")
        await players[0].wait_for_selector('#hud.on',timeout=8000)
        print('three',await players[0].evaluate('!!R3'), 'build',await players[0].evaluate('window.RR_BUILD'))
        # wander toward a star / pad so the world is visible
        await players[0].evaluate("""()=>{const me=disp.get(myId);if(!me||!snap)return;let g=null,b=1e9;
          if(snap&&snap.c&&snap.c.length){for(const c of snap.c){const d=Math.hypot(c[1]-me.x,c[2]-me.y);if(d<b){b=d;g=c}}}
          if(g){const l=Math.hypot(g[1]-me.x,g[2]-me.y)||1;window.testMove=[(g[1]-me.x)/l,(g[2]-me.y)/l];yaw=Math.atan2(g[2]-me.y,g[1]-me.x);pitch=.08}
          else {window.testMove=[0.7,0.2];pitch=.12}}""")
        for pg in players[1:]:
            await pg.evaluate("()=>{window.testMove=[0.4,0.3];pitch=.1}")
        await players[0].wait_for_timeout(2500)
        await players[0].screenshot(path=OUT+'round5-play.png')
        await host.screenshot(path=OUT+'round5-host.png')
        await phone.screenshot(path=OUT+'round5-phone.png')
        # wait for a question if it comes quickly
        try:
            await players[0].wait_for_function("!!(curQ&&snap&&snap.a&&snap.a.length)",timeout=12000)
            await players[0].evaluate("""()=>{const me=disp.get(myId);let x=0,y=0;for(const a of snap.a){x+=a[1]/snap.a.length;y+=a[2]/snap.a.length}yaw=Math.atan2(y-me.y,x-me.x);pitch=.12}""")
            await players[0].wait_for_timeout(800)
            await players[0].screenshot(path=OUT+'round5-question.png')
            await host.screenshot(path=OUT+'round5-host-question.png')
        except Exception as e:
            print('no question shot',e)
        fps=await players[0].evaluate('({fps,build:window.RR_BUILD,stats:window.RR_STATS,plats:(cfg&&cfg.plats||[]).length,stars:(snap&&snap.c||[]).length,pads:(cfg&&cfg.pads||[]).length,lock:typeof canLock==="function"})')
        print('fps/state',fps)
        # end for podium
        await host.evaluate("send({t:'endnow'})")
        await host.wait_for_selector('#end.on',timeout=8000)
        await host.wait_for_timeout(800)
        await host.screenshot(path=OUT+'round5-podium.png')
        await players[0].screenshot(path=OUT+'round5-podium-player.png')
        await br.close()
    srv.terminate()
asyncio.run(main())
print('ERRORS',len(errs))
for e in errs[:20]:
    print(' ',e)
