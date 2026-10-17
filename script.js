(() => {
'use strict';
const $ = id => document.getElementById(id);
const screens = ['menuScreen','levelSelect','howScreen','gameScreen'];
const canvas = $('gameCanvas'), ctx = canvas.getContext('2d');
const W = 960, H = 540;
let current = 1, activeChapter = 0, paused = false, won = false, dead = false, soundOn = true;
let keys = {left:false,right:false,jump:false}, pressed = {}, lastTime = 0, anim = 0, toastTimer = 0;
let audioCtx = null, particles = [], levelState = {}, hintStage = 0;
const chapters = ['The Basics','Think Before Jumping','Tricky Rooms','Gravity Experiments','The Room Is the Puzzle','Unexpected Controls','Break the Rules','Meta Puzzles','The Ultimate Challenge','The Final Trials'];
const titles = [
'The First Step','A Little Hop','Mind the Gap','The Door Is There','A Tiny Detour','The Tall Wall','Three Spikes','Key Thing','Button Business','A Proper Exit',
'Wait for It','The Narrow Way','Not So Fast','A Step Too Far','The Quiet Corner','A Moving Thought','The Long Jump','The Safe Spot','A Small Shortcut','Patience, Please',
'Now You See It','A Vanishing Act','The Moving Line','Switch Sides','The Sneaky Step','Two Things at Once','A Door Apart','The Hidden Route','Watch Your Head','A Different Angle',
'Upside Down','The Ceiling Walk','Heavy Thoughts','Gravity Says No','A Flip of Fate','Fall Upward','The Other Floor','A Strange Pull','Switch the World','Back to Normal?',
'The Wall Has Ideas','Door on the Move','Room for Change','The Long Way Round','A False Finish','The Wall Button','Through the Gap','The Room Shifts','A Better Route','The Whole Room',
'Click Carefully','Hold That Thought','Tap Twice','The Waiting Game','A Different Button','Keep It Pressed','One More Time','The Quiet Input','Not Quite a Jump','A Secret Gesture',
'Rules Are Wobbly','A Brief Disappearance','The Wrong Way','Blink and Move','No Easy Exit','One Step Back','A Little Rewind','Control Freak','The Floor Is Temporary','The Unexpected',
'Pause for Thought','The Menu Knows','Restart?','A Page Turn','Out of Order','A Button Apart','The Missing Page','Back to the Door','Read the Room','A Tiny Secret',
'Two Keys, One Door','Gravity and Grit','The Moving Maze','A Split Second','Everything at Once','A Narrow Escape','Switchback','The Last Key','Three Small Trials','The Big Combination',
'Final Sketch','One Last Flip','The Door Lies','A Room in Pieces','The Longest Leap','Ink and Timing','The Last Trick','All the Rules','The Way Through','The Last Doodle'
];
const hints = [
'Walk right and jump over the little gap.','Jump across the gap, then keep going.','A jump is enough to clear the middle hazard.','Try approaching the door from the floor.','The shortest route is not always the safest.','Use the raised platform to gain height.','Jump over the spikes; do not walk into them.','Touch the key before visiting the door.','Stand on the button to unlock the way.','A clean jump gets you to the exit.',
'Wait for the moving platform to come close.','Use short jumps rather than rushing.','Look for a safe moment between hazards.','You can jump farther if you hold jump briefly.','Try the lower route.','Ride the platform instead of chasing it.','Build speed, then jump at the edge.','Land on the small safe platform first.','Look for a gap in the wall.','Sometimes waiting is the right move.',
'The faint dotted platform is real.','Move quickly before the platform fades.','Watch the platform cycle.','The switch changes the nearby obstacle.','There is a hidden step near the wall.','Activate the switch before jumping.','The key and door are in different places.','Look carefully at the room edges.','Keep your jump short beneath the ceiling.','A wall can hide a route.',
'The gravity sign is a clue.','Jump to the ceiling-side path.','Change gravity, then use the new floor.','Tap the marked switch to flip gravity.','Try the opposite direction after flipping.','Falling upward can help you cross.','The safe route may be above you.','Flip gravity near the centre.','Use the switch more than once.','Return gravity to reach the door.',
'The wall button changes the room.','The door shifts after the switch is pressed.','Watch for platforms that move with the room.','The long route is safer than the short one.','The first door is not the real exit.','Press the wall switch while standing nearby.','The gap is wider than it looks, but jump.','The room changes after you cross the middle.','Try using the platform as a staircase.','Study the whole room before moving.',
'Click the small marked object.','Hold the marked button briefly.','Tap the switch twice.','Wait until the moving hazard passes.','The unusual control is shown by the doodle.','Keep the switch held until the door opens.','One interaction is not enough.','Try interacting while standing still.','This page rewards a small jump.','Use the marked control and then move.',
'The sign is deliberately misleading.','The temporary platform returns after a moment.','Try moving left when the arrow suggests right.','Wait for the obstacle to blink out.','The exit opens after the switch sequence.','Sometimes stepping back reveals the route.','Restarting resets the room—but remember what changed.','The controls may reverse in this room.','Do not linger on the fading floor.','Try the opposite of the obvious move.',
'Pause and resume to notice the changed clue.','The menu hint is part of the puzzle.','Restart after activating the switch.','The page number gives a clue.','The exit sequence is unusual but safe.','Look for a button outside the main path.','A hidden route is near the page edge.','Leave and return to reset the moving door.','Read the small note in the room.','Try the tiny object near the floor.',
'Use both switches before entering.','Flip gravity only after reaching the middle.','Move with the maze as it shifts.','Time your jump to the platform cycle.','Combine the key, switch, and moving platform.','Take the narrow safe route.','Switch direction mid-way.','Find the last key behind the platform.','Solve each small section in order.','Use every mechanic you have learned.',
'The final pages remix familiar rules.','Flip gravity near the central marker.','The first exit is a decoy; look for the real one.','Activate the room switches to rebuild the route.','Use the highest platform to make the leap.','Timing matters more than speed.','The last trick uses a familiar control in a new way.','Combine the control reversal with the switch.','Take a breath and inspect every corner.','One last jump. You have got this.'
];
const level = (id) => {
  const chapter = Math.floor((id-1)/10);
  const idx = (id-1)%10;
  const L = {id,title:titles[id-1]||`Page ${id}`,chapter,spawn:{x:58,y:444},floor:480,platforms:[],spikes:[],keys:[],buttons:[],moving:[],hazards:[],door:{x:875,y:400,w:42,h:80},mechanic:'normal',hint:hints[id-1]||'Look around and try a different approach.',goal:'Reach the door.'};
  const p=(x,y,w,h=16,kind='solid')=>L.platforms.push({x,y,w,h,kind});
  const s=(x,y,w)=>L.spikes.push({x,y,w,h:22});
  const b=(x,y,kind='switch')=>L.buttons.push({x,y,w:28,h:12,kind,active:false});
  const k=(x,y)=>L.keys.push({x,y,w:18,h:18,taken:false});
  const m=(x,y,w,axis='x',range=100,speed=1.1)=>L.moving.push({x,y,w,h:14,axis,origin:axis==='x'?x:y,range,speed,phase:id*.71});
  // Hand-authored-feeling layouts: varied room geometry plus chapter-specific mechanics.
  if(chapter===0){
    if(idx===0){L.goal='Walk to the door.';}
    if(idx===1){s(310,458,72);p(220,405,100);}
    if(idx===2){s(270,458,130);p(300,390,110);}
    if(idx===3){p(330,420,110);s(490,458,75);}
    if(idx===4){s(235,458,75);p(210,402,90);p(380,365,100);}
    if(idx===5){p(180,420,115);p(355,365,115);p(535,410,100);}
    if(idx===6){s(220,458,90);s(405,458,90);p(280,400,95);}
    if(idx===7){L.door.locked=true;k(370,420);L.goal='Find the key, then reach the door.';}
    if(idx===8){L.door.locked=true;b(420,468);p(340,425,120);L.goal='Press the floor switch to unlock the door.';}
    if(idx===9){s(300,458,100);p(260,400,100);p(440,365,100);p(600,415,100);}
  } else if(chapter===1){
    if(idx%3===0){s(250,458,90);m(360,405,115,'x',120,1.1+idx*.08);p(560,390,120);}
    if(idx%3===1){p(200,425,100);p(360,370,90);p(510,420,100);s(680,458,80);}
    if(idx%3===2){s(260,458,80);s(460,458,80);p(300,405,100);p(490,370,100);}
    if(idx===2||idx===7){L.mechanic='wait';L.goal='Wait for a safe opening, then cross.';}
    if(idx===5){L.door.x=840;L.door.y=340;p(650,390,130);}
  } else if(chapter===2){
    L.mechanic=idx%2?'invisible':'switch';
    if(idx%2===0){p(210,420,110);p(420,365,110,'16','hidden');s(320,458,65);b(515,350);p(590,410,120);}
    else {s(230,458,90);m(350,400,120,'x',100,1.4);p(520,360,90);b(610,468);}
    if(idx===0||idx===5){L.platforms.push({x:650,y:425,w:100,h:14,kind:'hidden'});}
    if(idx===7){k(475,330);L.door.locked=true;}
  } else if(chapter===3){
    L.mechanic='gravity';
    if(idx%2===0){p(210,405,120);p(420,320,120);p(620,250,120);b(480,300,'gravity');}
    else {p(230,180,120);p(430,240,120);p(630,180,120);b(470,468,'gravity');}
    L.gravityFlip=true;
    if(idx===8){s(290,458,100);p(310,400,100);b(500,468,'gravity');}
  } else if(chapter===4){
    L.mechanic='room';
    p(210,415,100);p(365,365,100);p(525,415,100);b(460,468,'room');
    if(idx%2===0){L.door.x=720;L.door.y=320;p(675,390,100);}
    if(idx===4){L.door.decoy={x:830,y:400,w:40,h:80};L.door.x=180;L.door.y=335;}
    if(idx===6){L.platforms.push({x:740,y:430,w:90,h:14,kind:'hidden'});}
  } else if(chapter===5){
    L.mechanic='click';
    if(idx%2===0){p(270,400,100);b(500,468,'click');s(370,458,70);}
    else {m(330,400,120,'y',85,1.1);b(590,468,'hold');p(650,410,110);}
    L.goal='Try the room controls, then reach the door.';
  } else if(chapter===6){
    L.mechanic='rule';
    if(idx%3===0){s(250,458,90);p(300,400,100);L.mechanic='reverse';}
    if(idx%3===1){p(220,420,100,'16','temporary');p(420,365,100);s(340,458,70);}
    if(idx%3===2){m(350,390,120,'x',130,1.6);b(580,468);}
    L.goal='The room has a rule change. Experiment carefully.';
  } else if(chapter===7){
    L.mechanic='meta';
    if(idx%3===0){b(390,468,'restart');p(310,410,120);L.goal='Activate the marked switch, then restart.';}
    else if(idx%3===1){p(250,420,100);b(480,468,'pause');s(370,458,80);L.goal='The pause clue matters here.';}
    else {k(450,390);L.door.locked=true;p(390,430,120);L.goal='Find the key tucked into the room.';}
  } else {
    L.mechanic=idx%2?'combo':'gravity';
    s(240,458,70);s(420,458,70);p(270,405,100);p(445,350,100);p(610,400,100);b(520,468,idx%2?'switch':'gravity');
    if(idx%3===0){k(500,315);L.door.locked=true;}
    if(idx%3===1){m(350,385,120,'x',115,1.7);}
    if(idx%3===2){L.platforms.push({x:690,y:410,w:90,h:14,kind:'hidden'});}
    L.goal='Combine what you have learned to reach the door.';
  }
  // Boundaries and a few chapter-specific extras.
  if(id>=11 && id<=20 && idx%4===0) {L.door.y=355; p(730,420,100);}
  if(id>=21 && id<=30 && idx%4===2) L.platforms.push({x:690,y:445,w:75,h:12,kind:'hidden'});
  if(id>=31 && id<=40 && idx%3===1) L.gravityFlip=true;
  if(id>=51 && id<=60 && idx%3===0) L.buttons.push({x:700,y:468,w:25,h:12,kind:'click',active:false});
  if(id>=71 && id<=80 && idx===9) {L.mechanic='meta';L.goal='The clue is in the room, not just the route.';}
  // keep objects within bounds and ensure floor always exists.
  L.platforms.unshift({x:0,y:500,w:960,h:40,kind:'floor'});
  L.platforms.push({x:0,y:0,w:18,h:500,kind:'wall'},{x:942,y:0,w:18,h:500,kind:'wall'});
  return L;
};
const levels = Array.from({length:100},(_,i)=>level(i+1));
let player, L, maxUnlocked=Number(localStorage.getItem('doodleUnlocked')||1), completed=new Set(JSON.parse(localStorage.getItem('doodleCompleted')||'[]'));
maxUnlocked=Math.max(1,Math.min(100,maxUnlocked));
function showScreen(id){screens.forEach(s=>$(s).classList.toggle('hidden',s!==id));}
function save(){localStorage.setItem('doodleUnlocked',String(maxUnlocked));localStorage.setItem('doodleCompleted',JSON.stringify([...completed]));updateProgress();}
function updateProgress(){const n=completed.size;$('progressPill').textContent=`${n} / 100`; $('footerProgress').textContent=`${n} pages filled`; $('progressBar').style.width=`${n}%`;}
function buildLevelGrid(ch=activeChapter){
  activeChapter=ch;
  $('chapterList').innerHTML='';
  chapters.forEach((name,i)=>{const btn=document.createElement('button');btn.className='chapter-chip'+(i===ch?' active':'');btn.textContent=`${i+1}. ${name}`;btn.onclick=()=>{buildLevelGrid(i);};$('chapterList').appendChild(btn);});
  $('levelGrid').innerHTML='';
  for(let id=ch*10+1;id<=ch*10+10;id++){
    const btn=document.createElement('button');btn.className='level-cell'+(completed.has(id)?' done':'')+(id>maxUnlocked?' locked':'')+(id===current?' current':'');btn.textContent=id;
    if(completed.has(id)){const tick=document.createElement('span');tick.className='tick';tick.textContent='✓';btn.appendChild(tick);}
    btn.disabled=id>maxUnlocked;btn.title=titles[id-1];btn.onclick=()=>startLevel(id);$('levelGrid').appendChild(btn);
  }
}
function startLevel(id){if(id>maxUnlocked)return;current=id;L=levels[id-1];paused=false;won=false;dead=false;hintStage=0;levelState={doorOpen:!L.door.locked,gravity:-1,roomSwitch:false,clickCount:0,holdTime:0,pressedAt:0,temporaryTimer:0,hiddenVisible:false,decoyUsed:false};particles=[];
  player={x:L.spawn.x,y:L.spawn.y,w:24,h:42,vx:0,vy:0,onGround:false,hasKey:false,dead:false,gravitySign:1,face:1,spawn:{...L.spawn}};
  L.platforms.forEach(p=>{if(p.kind==='temporary')p.timer=0;});
  $('chapterLabel').textContent=`CHAPTER ${L.chapter+1} · ${chapters[L.chapter].toUpperCase()}`;$('levelTitle').textContent=`${String(id).padStart(2,'0')} — ${L.title}`;$('levelCounter').textContent=`LEVEL ${id} / 100`;$('objective').textContent=L.goal;$('progressBar').style.width=`${completed.size}%`;
  $('overlay').classList.add('hidden');$('toast').classList.add('hidden');showScreen('gameScreen');updateProgress();toast(`Page ${id}: ${L.title}`,1400);lastTime=performance.now();
}
function toast(msg,ms=2000){$('toast').textContent=msg;$('toast').classList.remove('hidden');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.add('hidden'),ms);}
function overlay(title,body,buttons){const ov=$('overlay');ov.innerHTML='';const card=document.createElement('div');card.className='overlay-card';const h=document.createElement('h2');h.textContent=title;card.appendChild(h);const p=document.createElement('p');p.textContent=body;card.appendChild(p);const row=document.createElement('div');row.className='overlay-buttons';buttons.forEach(([label,fn])=>{const b=document.createElement('button');b.textContent=label;b.onclick=fn;row.appendChild(b);});card.appendChild(row);ov.appendChild(card);ov.classList.remove('hidden');}
function pauseGame(){if(won||dead)return;paused=!paused;if(paused)overlay('Pencil down','Take a breath. Your page is waiting.',[['Resume',()=>{paused=false;$('overlay').classList.add('hidden');}],['Restart',()=>startLevel(current)],['Main menu',()=>showScreen('menuScreen')]]);else $('overlay').classList.add('hidden');}
function restart(){startLevel(current);playTone(260,.04);}
function hint(){hintStage++;const first=L.hint.split(/[.!?]/)[0];toast(hintStage===1?`Hint: ${first}.`:hintStage===2?`Try this: ${L.hint}`:`Solution nudge: ${L.hint}`,3300);}
function playTone(freq=440,dur=.06){if(!soundOn)return;try{audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.frequency.value=freq;o.type='sine';g.gain.setValueAtTime(.045,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+dur);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+dur);}catch(e){}}
function rectsOverlap(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
function kill(){if(dead||won)return;dead=true;playTone(130,.12);particles.push(...Array.from({length:12},()=>({x:player.x+12,y:player.y+20,vx:(Math.random()-.5)*190,vy:-Math.random()*150,life:.5})));setTimeout(()=>{if(!won){dead=false;player.x=player.spawn.x;player.y=player.spawn.y;player.vx=player.vy=0;player.hasKey=false;L.keys.forEach(k=>k.taken=false);levelState.doorOpen=!L.door.locked;toast('Scribble reset. Try again!',1000);}},450);}
function completeLevel(){if(won)return;won=true;completed.add(current);maxUnlocked=Math.max(maxUnlocked,Math.min(100,current+1));save();playTone(660,.12);playTone(880,.18);
  if(current===100){overlay('THE END — AND A NEW PAGE','You filled all 100 pages. Every little doodle salutes you.',[['Play again',()=>{completed.clear();maxUnlocked=1;save();startLevel(1);}],['Level book',()=>{buildLevelGrid(9);showScreen('levelSelect');}]]);}
  else overlay('Page complete!','A neat little solution. Ready for the next doodle?',[['Replay',()=>startLevel(current)],['Next page →',()=>startLevel(current+1)],['Level book',()=>{buildLevelGrid(Math.floor((current-1)/10));showScreen('levelSelect');}]]);
}
function activateButton(btn){
  if(btn.kind==='click'){levelState.clickCount++;if(levelState.clickCount%2===0){levelState.doorOpen=true;toast('Click-click! The door doodle changed.');}else toast('Something moved… try one more time.');}
  else if(btn.kind==='gravity'){player.gravitySign*=-1;L.gravityFlip=true;toast('Gravity flipped!');playTone(520,.07);}
  else if(btn.kind==='room'){levelState.roomSwitch=!levelState.roomSwitch;levelState.doorOpen=true;toast('The room shifts a little.');}
  else if(btn.kind==='restart'){levelState.doorOpen=true;toast('The restart mark was the key.');}
  else if(btn.kind==='pause'){levelState.doorOpen=true;toast('A pause can be a clue.');}
  else if(btn.kind==='hold'){levelState.holdTime=0;levelState.doorOpen=true;toast('Held! The lock clicked.');}
  else {levelState.doorOpen=true;toast('Switch on!');}
  btn.active=true;playTone(500,.07);
}
function update(dt){
 if(paused||won||dead||!L)return;
 anim+=dt;
 const speed=250, gravity=1250;
 const reverse=L.mechanic==='reverse'&& !levelState.roomSwitch;
 const dir=(keys.right?1:0)-(keys.left?1:0);
 player.vx=dir*speed*(reverse?-1:1);if(dir)player.face=dir*(reverse?-1:1);
 if(keys.jump&&!pressed.jump&&player.onGround){player.vy=-440*player.gravitySign;player.onGround=false;playTone(340,.04);}
 if(!keys.jump&&player.vy<-120&&player.gravitySign===1)player.vy*=.92;
 pressed.jump=keys.jump;
 player.vy+=gravity*player.gravitySign*dt;
 player.vy=Math.max(-720,Math.min(720,player.vy));
 // move and collide horizontally, then vertically
 player.x+=player.vx*dt;player.x=Math.max(18,Math.min(W-player.w-18,player.x));
 for(const p of L.platforms){if(p.kind==='hidden'&&!levelState.hiddenVisible)continue;if(p.kind==='temporary'&&p.timer>1.2)continue;
   if(rectsOverlap(player,p)){if(player.vx>0)player.x=p.x-player.w;else if(player.vx<0)player.x=p.x+p.w;}}
 player.y+=player.vy*dt;player.onGround=false;
 for(const p of L.platforms){if(p.kind==='hidden'&&!levelState.hiddenVisible)continue;if(p.kind==='temporary'&&p.timer>1.2)continue;
   if(rectsOverlap(player,p)){if(player.vy>0){player.y=p.y-player.h;player.vy=0;player.onGround=true;}else if(player.vy<0){player.y=p.y+p.h;player.vy=0;}}}
 if(player.y>H+30||player.y<-100)kill();
 // moving platforms
 for(const m of L.moving){const val=Math.sin(anim*m.speed+m.phase)*m.range;if(m.axis==='x')m.drawX=m.x+val;else m.drawY=m.y+val;
   const mx=m.drawX??m.x,my=m.drawY??m.y;
   if(rectsOverlap(player,{x:mx,y:my,w:m.w,h:m.h})&&player.vy>=0&&player.y+player.h<my+m.h+18){player.y=my-player.h;player.vy=0;player.onGround=true;if(m.axis==='x')player.x+=Math.cos(anim*m.speed+m.phase)*m.range*m.speed*dt;}}
 for(const s of L.spikes){if(rectsOverlap({x:player.x+3,y:player.y+player.h-10,w:player.w-6,h:10},{x:s.x,y:s.y,w:s.w,h:s.h}))kill();}
 for(const h of L.hazards){if(rectsOverlap(player,h))kill();}
 for(const k of L.keys){if(!k.taken&&rectsOverlap(player,k)){k.taken=true;player.hasKey=true;levelState.doorOpen=true;toast('Key acquired!');playTone(720,.08);}}
 for(const b of L.buttons){const hit=rectsOverlap(player,{x:b.x,y:b.y-6,w:b.w,h:b.h+10});if(hit&&!b.active&&b.kind!=='click'&&b.kind!=='hold')activateButton(b);}
 if(keys.jump&&L.buttons.some(b=>b.kind==='hold'&&rectsOverlap(player,{x:b.x,y:b.y-8,w:b.w,h:b.h+10}))){levelState.holdTime+=dt;if(levelState.holdTime>.7){L.buttons.filter(b=>b.kind==='hold').forEach(b=>{if(!b.active)activateButton(b);});}}
 // level mechanic: click interaction is handled by canvas pointer
 for(const p of L.platforms){if(p.kind==='temporary'&&rectsOverlap(player,p))p.timer=(p.timer||0)+dt;}
 const door=L.door;
 if(!door.locked||levelState.doorOpen||player.hasKey){
   if(rectsOverlap(player,{x:door.x,y:door.y,w:door.w,h:door.h})){
     if(door.locked&&!player.hasKey&&!levelState.doorOpen){toast('The door is locked. Find the clue.');}
     else completeLevel();
   }
 }
 if(L.mechanic==='wait'&&Math.sin(anim*1.5)>0.7)levelState.doorOpen=true;
 if(L.mechanic==='invisible'&&anim>1.4)levelState.hiddenVisible=true;
 if(L.mechanic==='room'&&levelState.roomSwitch)L.platforms.forEach(p=>{if(p.kind==='hidden')levelState.hiddenVisible=true;});
 for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=300*dt;p.life-=dt;}particles=particles.filter(p=>p.life>0);
}
function sketchLine(x1,y1,x2,y2,seed=0){ctx.beginPath();ctx.moveTo(x1,y1);const mid=(x1+x2)/2;ctx.quadraticCurveTo(mid+Math.sin(seed)*2,(y1+y2)/2+Math.cos(seed)*2,x2,y2);ctx.stroke();}
function drawPlatform(p){
 if(p.kind==='hidden'&&!levelState.hiddenVisible)return;
 if(p.kind==='temporary'&&p.timer>1.2)return;
 const x=p.x,y=p.y,w=p.w,h=p.h;
 ctx.save();ctx.lineWidth=3;ctx.strokeStyle='#292923';ctx.fillStyle='#fffdf7';
 if(p.kind==='floor'||p.kind==='wall'){ctx.fillStyle='#f1eee5';ctx.fillRect(x,y,w,h);}
 ctx.beginPath();ctx.moveTo(x,y+2);ctx.lineTo(x+w*.28,y+Math.sin(x)*1.5);ctx.lineTo(x+w*.7,y+Math.cos(y)*1.3);ctx.lineTo(x+w,y+1);ctx.stroke();
 if(p.kind!=='floor'&&p.kind!=='wall'){ctx.beginPath();ctx.moveTo(x,y+5);ctx.lineTo(x,y+h);ctx.lineTo(x+w,y+h);ctx.lineTo(x+w,y+4);ctx.stroke();}
 if(p.kind==='hidden'){ctx.setLineDash([5,7]);ctx.strokeStyle='#8c887d';ctx.strokeRect(x,y,w,h);}
 if(p.kind==='temporary'){ctx.setLineDash([3,5]);ctx.strokeRect(x,y,w,h);}
 ctx.restore();
}
function draw(){
 ctx.clearRect(0,0,W,H);ctx.fillStyle='#fffdf7';ctx.fillRect(0,0,W,H);
 // paper lines and corners
 ctx.save();ctx.strokeStyle='#e8e4da';ctx.lineWidth=1;for(let y=42;y<H;y+=42){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}ctx.restore();
 // small doodle title and level hint
 ctx.fillStyle='#8e8a7e';ctx.font='16px Patrick Hand, cursive';ctx.fillText(`PAGE ${String(current).padStart(2,'0')}`,28,28);
 // decor stars
 ctx.strokeStyle='#c9c3b7';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(885,52);ctx.lineTo(895,72);ctx.lineTo(915,76);ctx.lineTo(900,89);ctx.lineTo(904,108);ctx.lineTo(885,98);ctx.lineTo(867,108);ctx.lineTo(871,88);ctx.lineTo(857,76);ctx.lineTo(876,72);ctx.closePath();ctx.stroke();
 if(!L)return;
 L.platforms.forEach(drawPlatform);
 // spikes
 for(const s of L.spikes){ctx.save();ctx.strokeStyle='#292923';ctx.lineWidth=3;ctx.beginPath();let count=Math.max(2,Math.floor(s.w/20));for(let i=0;i<count;i++){const x=s.x+i*s.w/count;ctx.moveTo(x,s.y+s.h);ctx.lineTo(x+s.w/count/2,s.y);ctx.lineTo(x+s.w/count,s.y+s.h);}ctx.stroke();ctx.restore();}
 // moving platforms
 for(const m of L.moving){const x=m.axis==='x'?(m.drawX??m.x):m.x,y=m.axis==='y'?(m.drawY??m.y):m.y;drawPlatform({x,y,w:m.w,h:m.h,kind:'moving'});}
 // keys
 for(const k of L.keys){if(k.taken)continue;ctx.save();ctx.strokeStyle='#292923';ctx.lineWidth=3;ctx.beginPath();ctx.arc(k.x+7,k.y+7,6,0,Math.PI*2);ctx.moveTo(k.x+13,k.y+7);ctx.lineTo(k.x+22,k.y+7);ctx.lineTo(k.x+22,k.y+12);ctx.stroke();ctx.restore();}
 // switches
 for(const b of L.buttons){ctx.save();ctx.lineWidth=3;ctx.strokeStyle='#292923';ctx.fillStyle=b.active?'#d9e5d5':'#fffdf7';ctx.beginPath();ctx.roundRect(b.x,b.y,b.w,b.h,3);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(b.x+4,b.y+3);ctx.lineTo(b.x+b.w-4,b.y+3);ctx.stroke();ctx.font='13px Patrick Hand';ctx.fillStyle='#6e6b62';if(b.kind==='gravity')ctx.fillText('↕',b.x+8,b.y-7);if(b.kind==='click')ctx.fillText('tap',b.x,b.y-7);ctx.restore();}
 // door
 const d=L.door;ctx.save();ctx.lineWidth=4;ctx.strokeStyle='#292923';ctx.fillStyle=(!levelState.doorOpen&&d.locked&&!player.hasKey)?'#ece8dd':'#fffdf7';ctx.beginPath();ctx.moveTo(d.x,d.y+d.h);ctx.lineTo(d.x,d.y+18);ctx.quadraticCurveTo(d.x,d.y,d.x+18,d.y);ctx.lineTo(d.x+d.w-18,d.y);ctx.quadraticCurveTo(d.x+d.w,d.y,d.x+d.w,d.y+18);ctx.lineTo(d.x+d.w,d.y+d.h);ctx.stroke();ctx.fill();ctx.beginPath();ctx.arc(d.x+d.w-10,d.y+d.h*.53,2.5,0,Math.PI*2);ctx.fill();if(d.locked&&!levelState.doorOpen&&!player.hasKey){ctx.beginPath();ctx.arc(d.x+d.w/2,d.y+35,7,Math.PI,0);ctx.lineTo(d.x+d.w/2+7,d.y+49);ctx.lineTo(d.x+d.w/2-7,d.y+49);ctx.closePath();ctx.stroke();}ctx.restore();
 if(d.decoy){ctx.save();ctx.globalAlpha=.55;ctx.strokeStyle='#777';ctx.setLineDash([4,5]);ctx.strokeRect(d.decoy.x,d.decoy.y,d.decoy.w,d.decoy.h);ctx.restore();}
 // player stick doodle
 drawPlayer();
 // particles
 for(const p of particles){ctx.globalAlpha=Math.max(0,p.life*2);ctx.strokeStyle='#292923';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-3,p.y-6);ctx.stroke();ctx.globalAlpha=1;}
 // little instruction for odd mechanics
 if(L.mechanic==='gravity'||L.gravityFlip){ctx.fillStyle='#55534c';ctx.font='17px Patrick Hand';ctx.fillText('↕ gravity',24,65);}
 if(L.mechanic==='reverse'){ctx.fillStyle='#55534c';ctx.font='17px Patrick Hand';ctx.fillText('← means right?',24,65);}
}
function drawPlayer(){
 if(!player)return;const x=player.x+player.w/2,y=player.y;
 ctx.save();ctx.strokeStyle='#242420';ctx.lineWidth=3.5;ctx.lineCap='round';ctx.lineJoin='round';
 // head
 ctx.beginPath();ctx.ellipse(x,y+8,8,9,Math.sin(anim*8)*.05,0,Math.PI*2);ctx.stroke();
 ctx.beginPath();ctx.arc(x-2,y+7,1,0,Math.PI*2);ctx.arc(x+3,y+7,1,0,Math.PI*2);ctx.stroke();
 // body and limbs
 const step=player.onGround?Math.sin(anim*14)*4:0;
 ctx.beginPath();ctx.moveTo(x,y+17);ctx.lineTo(x+Math.sin(anim*5)*1,y+29);ctx.moveTo(x,y+21);ctx.lineTo(x-player.face*8,y+25);ctx.moveTo(x,y+21);ctx.lineTo(x+player.face*9,y+24);ctx.moveTo(x,y+29);ctx.lineTo(x-6+step,y+40);ctx.moveTo(x,y+29);ctx.lineTo(x+7-step,y+40);ctx.stroke();
 ctx.restore();
}
function loop(t){const dt=Math.min(.032,Math.max(0,(t-lastTime)/1000||0));lastTime=t;if(L&&!paused)update(dt);draw();requestAnimationFrame(loop);}
function pointerAction(e){if(!L||paused)return;const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*W/r.width,y=(e.clientY-r.top)*H/r.height;
 for(const b of L.buttons){if(b.kind==='click'&&x>=b.x-15&&x<=b.x+b.w+15&&y>=b.y-35&&y<=b.y+b.h+20)activateButton(b);}
 // click marked clue or door
 if(L.mechanic==='click'&&x>0&&x<W){levelState.clickCount++;if(levelState.clickCount>=2)levelState.doorOpen=true;toast(levelState.clickCount>=2?'The door heard you.':'Something noticed that click.');}
}
canvas.addEventListener('pointerdown',pointerAction);
document.addEventListener('keydown',e=>{
 const k=e.key.toLowerCase();if(['arrowleft','arrowright','arrowup',' ','a','d'].includes(k))e.preventDefault();
 if(k==='a'||k==='arrowleft')keys.left=true;if(k==='d'||k==='arrowright')keys.right=true;if(k===' '||k==='arrowup'||k==='w')keys.jump=true;
 if(k==='r'&&!$('gameScreen').classList.contains('hidden'))restart();
 if(k==='escape'&&!$('gameScreen').classList.contains('hidden'))pauseGame();
});
document.addEventListener('keyup',e=>{const k=e.key.toLowerCase();if(k==='a'||k==='arrowleft')keys.left=false;if(k==='d'||k==='arrowright')keys.right=false;if(k===' '||k==='arrowup'||k==='w')keys.jump=false;});
document.querySelectorAll('[data-hold]').forEach(btn=>{
 const key=btn.dataset.hold;const down=e=>{e.preventDefault();keys[key]=true;};const up=e=>{e.preventDefault();keys[key]=false;};
 btn.addEventListener('pointerdown',down);['pointerup','pointercancel','pointerleave'].forEach(ev=>btn.addEventListener(ev,up));
});
$('playBtn').onclick=()=>startLevel(Math.min(maxUnlocked,Math.max(1,current)));
$('levelsBtn').onclick=()=>{buildLevelGrid(0);showScreen('levelSelect');};
$('howBtn').onclick=()=>showScreen('howScreen');$('howBack').onclick=()=>showScreen('menuScreen');$('howPlay').onclick=()=>startLevel(maxUnlocked);
$('levelsBack').onclick=()=>showScreen('menuScreen');$('gameBack').onclick=()=>{paused=false;showScreen('menuScreen');};
$('homeBtn').onclick=()=>{paused=false;showScreen('menuScreen');};$('soundBtn').onclick=()=>{soundOn=!soundOn;$('soundBtn').textContent=soundOn?'♪':'♫̸';toast(soundOn?'Sound on':'Sound off');if(soundOn)playTone(520,.06);};
$('restartBtn').onclick=restart;$('pauseBtn').onclick=pauseGame;$('hintBtn').onclick=hint;
window.addEventListener('blur',()=>{keys.left=keys.right=keys.jump=false;});
updateProgress();requestAnimationFrame(loop);
})();