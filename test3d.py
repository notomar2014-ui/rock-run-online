# Headless Playwright test for Rock Run 3D: host + 5 players (1 phone) + 3 bots.
import asyncio, random, subprocess, os, time
from playwright.async_api import async_playwright
OUT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'screenshots')+'/'
os.makedirs(OUT,exist_ok=True)
errors=[]
import json
KEY=json.loads(subprocess.run(['node','-e',"const {QUESTIONS}=require('./questions.js');console.log(JSON.stringify(Object.fromEntries(QUESTIONS.map(q=>[q.q,q.opts[q.a]]))))"],capture_output=True,text=True,cwd=os.path.dirname(os.path.abspath(__file__))).stdout)
# scripted kids who KNOW the answer: run to the right (landed) answer meteor
STEER="""(stop)=>{const me=disp.get(myId);if(!me||!snap)return 1e9;let goal=null,b=1e9;
 if(curQ&&myPick<0&&snap.a.length){const k=window.KEY[curQ.q];for(const a of snap.a){const tx=(curQ.opts||[])[a[0]];if(tx===k||a[0]===k){goal=a;break}}}
 if(goal){let dx=goal[1]-me.x,dy=goal[2]-me.y;const l=Math.hypot(dx,dy);dx/=l;dy/=l;for(const o of snap.a){if(o===goal)continue;const ox=me.x-o[1],oy=me.y-o[2],od=Math.hypot(ox,oy);if(od<330){dx+=ox/od*2.2*(330-od)/330*2;dy+=oy/od*2.2*(330-od)/330*2}}const n=Math.hypot(dx,dy)||1;dx=dx/n*l;dy=dy/n*l;yaw=Math.atan2(dy,dx);window.testMove=l>stop?[dx/l,dy/l]:[0,0];return l}
 const a=Math.random()*6.28;window.testMove=[Math.cos(a),Math.sin(a)];return 1e9}"""
async def main():
    subprocess.run(['pkill','-f','node server.js'])
    srv=subprocess.Popen(['node','server.js'],env=dict(os.environ,RR_FAST='1',PORT='3311'),stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
    time.sleep(1.2); B='http://localhost:3311'
    async with async_playwright() as p:
        br=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-sandbox']) if os.path.exists('/usr/bin/google-chrome') else await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        def watch(pg,name):
            pg.on('console',lambda m: m.type=='error' and errors.append(f'{name}: {m.text}'))
            pg.on('pageerror',lambda e: errors.append(f'{name} PAGEERROR: {e}'))
        hc=await br.new_context(viewport={'width':1280,'height':720}); host=await hc.new_page(); watch(host,'host')
        await host.goto(B+'/host'); await host.wait_for_function("document.querySelector('#bigCode').textContent.length===4")
        code=await host.text_content('#bigCode'); print('code',code)
        players=[]
        for i,n in enumerate(['Omar','Adil','Haniya','Ayesha','Bardia']):
            mob=i==4
            c=await br.new_context(viewport={'width':390,'height':844} if mob else {'width':1280,'height':720},has_touch=mob,is_mobile=mob)
            pg=await c.new_page(); watch(pg,n)
            await pg.goto(B+'/?code='+code); await pg.fill('#nick',n); await pg.click('#joinBtn'); await pg.wait_for_selector('#wait.on'); await pg.evaluate('k=>window.KEY=k',KEY); players.append(pg)
        await host.click('#addBots'); await host.wait_for_timeout(1200)
        await host.screenshot(path=OUT+'3d-lobby.png'); await players[0].screenshot(path=OUT+'3d-wait.png')
        await host.evaluate("send({t:'start',duration:100})")
        await players[0].wait_for_selector('#hud.on')
        print('three ok:',await players[0].evaluate('!!R3'))
        async def play(pg,i,secs,steer=True):
            end=time.time()+secs
            while time.time()<end:
                if i<4:
                    if steer and i<3: await pg.evaluate(STEER,40)
                    elif steer: await pg.evaluate("()=>{const a=Math.random()*6.28;window.testMove=[Math.cos(a),Math.sin(a)]}")
                    if random.random()<.35:
                        await pg.keyboard.press(random.choice(['Digit1','Digit1','Digit2']))
                        await pg.mouse.down(); await pg.wait_for_timeout(120); await pg.mouse.up()
                    if random.random()<.2: await pg.keyboard.press('Space')
                    await pg.wait_for_timeout(200)
                else:
                    await pg.evaluate("joy.id=1;joy.dx=Math.random()*2-1;joy.dy=Math.random()*2-1;fireTouch=true;selTool(Math.random()*3|0)")
                    await pg.wait_for_timeout(400)
        await asyncio.gather(*[play(pg,i,3) for i,pg in enumerate(players)])
        await players[1].screenshot(path=OUT+'3d-fight.png'); await players[4].screenshot(path=OUT+'3d-phone.png')
        # meteor landing: wait for question, look toward a falling answer meteor
        # wait for a fresh question whose meteors have landed while Omar is alive (Omar holds off picking so it stays open)
        bg=asyncio.ensure_future(asyncio.gather(*[play(pg,i,70) for i,pg in enumerate(players) if i>0]))
        await players[0].wait_for_function("!!(curQ&&curQ.a<0&&curQ.end-performance.now()>21500&&snap.a.length&&(snap.p.find(p=>p[0]===myId)[4]&1))",polling=100,timeout=70000)
        # 1) meteors falling in: look at the farthest still-falling one
        await players[0].evaluate("()=>{window.testMove=[0,0];const me=disp.get(myId);let b=-1,g=null;for(const a of snap.a){const d=Math.hypot(a[1]-me.x,a[2]-me.y);if((a[4]>0?1e5:0)+d>b){b=(a[4]>0?1e5:0)+d;g=a}}if(g)yaw=Math.atan2(g[2]-me.y,g[1]-me.x);pitch=-.05}")
        await players[0].wait_for_timeout(500)
        await players[0].screenshot(path=OUT+'3d-meteor.png')
        # 2) once landed: player view mid-question with the letters, facing the middle of the answers
        await players[0].wait_for_function("snap.a.every(a=>a[4]<=0)",timeout=8000); await players[0].wait_for_timeout(600)
        await players[0].evaluate("()=>{const me=disp.get(myId);let x=0,y=0;for(const a of snap.a){x+=a[1]/snap.a.length;y+=a[2]/snap.a.length}yaw=Math.atan2(y-me.y,x-me.x);pitch=.16}")
        await players[0].wait_for_timeout(700)
        await players[0].screenshot(path=OUT+'3d-player.png')
        await host.screenshot(path=OUT+'3d-host.png')
        bg.cancel()
        try: await bg
        except BaseException: pass
        await asyncio.gather(*[play(pg,i,8) for i,pg in enumerate(players)])
        await players[0].screenshot(path=OUT+'3d-reveal.png')
        # combat: Omar blasts the nearest enemy until a hit lands, then screenshot the hit marker / health bars
        AIM="""()=>{const me=disp.get(myId);if(!me)return;let b=1e9,g=null;for(const p of snap.p){if(p[0]===myId||!(p[4]&1)||(p[4]&4))continue;const d=Math.hypot(p[1]-me.x,p[2]-me.y);if(d<b){b=d;g=p}}
          if(!g)return;yaw=Math.atan2(g[2]-me.y,g[1]-me.x);pitch=.1;const l=b;window.testMove=l>380?[(g[1]-me.x)/l,(g[2]-me.y)/l]:[0,0];selTool(0);mouse.down=true}"""
        shot=False
        for _ in range(60):
            await players[0].evaluate(AIM); await players[0].wait_for_timeout(120)
            if await players[0].evaluate("hmT>0.15"):
                await players[0].screenshot(path=OUT+'3d-combat.png'); shot=True; break
        await players[0].evaluate("mouse.down=false;window.testMove=[0,0]")
        print('combat hit marker shown:',shot)
        fps={'host':await host.evaluate('fps'),'player':await players[0].evaluate('fps'),'phone':await players[4].evaluate('fps')}
        print('fps (headless software WebGL):',fps)
        async def until_end(pg,i):
            while not await host.evaluate("document.querySelector('#end').classList.contains('on')"):
                await play(pg,i,2)
        await asyncio.gather(*[until_end(pg,i) for i,pg in enumerate(players)])
        await host.wait_for_selector('#end.on',timeout=120000); await host.wait_for_timeout(2200)
        await host.screenshot(path=OUT+'3d-podium.png')
        score=await host.evaluate("[...roster.values()].map(p=>p.name+':'+p.score+'('+p.correct+' right,'+p.kos+' KO)').join(' ')"); print('scores',score)
        await br.close()
    srv.terminate()
asyncio.run(main())
print('ERRORS:',len(errors)); [print(' ',e) for e in errors[:20]]
