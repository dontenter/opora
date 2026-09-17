import {trainingData,archiveWorkout,previousWorkout,formatSet} from './data.js';
'use strict';
const exercise=(name,sets,reps,tip,side=false,unit='reps')=>({name,sets,reps,tip,side,unit});
const plans={
 A:{title:'Chest, rows & scapula',items:[
 exercise('Chest-supported row',3,'10–12','Keep your chest on the pad. Let your shoulder blades move along your ribs without forcing them together or shrugging.'),
 exercise('Incline dumbbell press',3,'8–12','Keep your back supported. Use a moderate incline and comfortable depth without excessive arching.'),
 exercise('Single-arm seated cable row',3,'10–12','Keep your torso still instead of rotating with your arm. Use the same load on both sides.',true),
 exercise('Machine chest press',3,'10–12','Adjust the seat to fit. Keep your back supported and your shoulders away from your ears.'),
 exercise('Rope face pull',3,'12–15','Use a light load. Pull the rope toward your face without tilting your head back or jerking.'),
 exercise('Reverse fly',2,'12–15','Use a machine or cables. Move smoothly without forcing your shoulder blades together.'),
 exercise('Pallof press',3,'10–12','Resist rotation from the cable. Breathe out as you extend your arms.',true),
 exercise('Dumbbell curl',2,'10–15','Keep your elbows near your sides and avoid swinging. The original plan allows 2–3 sets; start with 2.'),
 exercise('Cable triceps pushdown',2,'10–15','Keep your elbows at your sides. Do not lean your body over the handle. Start with 2 of the original 2–3 sets.') ]},
 B:{title:'Legs, core & shoulders',items:[
 exercise('Goblet squat',3,'8–12','Hold a light weight at your chest and use a comfortable depth. Hack squats are an alternative from the plan. Stop if symptoms appear and discuss a suitable option with your clinician.'),
 exercise('Bulgarian split squat',3,'8–10','Hold a rack with one hand for balance. Control the movement without chasing extra depth.',true),
 exercise('Hip thrust',3,'10–12','Lift through your glutes without overextending your lower back. Start with a comfortable load.'),
 exercise('Leg curl',3,'10–15','Seated or lying. Adjust the pad and machine axis, and keep your hips on the support.'),
 exercise('Seated dumbbell shoulder press',3,'8–12','Use a backrest and a moderate load. Avoid compensating by arching your back. Stop if it hurts.'),
 exercise('Lateral raise',3,'12–20','Raise within a comfortable range without jerking or shrugging.'),
 exercise('Cable Y-raise',2,'12–15','Use a light load and lift your arms diagonally into a Y. Start with 2 of the original 2–3 sets.'),
 exercise('Dead bug',3,'6–10','Slowly lower the opposite arm and leg. Shorten the range if you lose control of your trunk.',true),
 exercise('Side plank',2,'20–40','Breathe steadily and do not sink into your shoulder. A bent-knee variation is fine. Start with 2 of the original 2–3 sets.',true,'sec') ]},
 C:{title:'Back, chest & arms',items:[
 exercise('Neutral-grip lat pulldown',3,'8–12','Pull in front of you toward your upper chest without jerking or leaning far back.'),
 exercise('Single-arm lat pulldown',3,'10–12','Keep your pelvis and ribs stable. Do not lean sideways.',true),
 exercise('Flat dumbbell press',3,'8–12','Keep your feet stable and your back supported. Use a comfortable range without stretching through pain.'),
 exercise('Seated cable row',3,'10–12','Use chest support if available. Keep your torso stable without rocking.'),
 exercise('Cable fly',2,'12–15','Keep a slight bend in your elbows. Avoid taking your arms too far behind you or stretching through pain.'),
 exercise('Face pull',2,'15','Use a light load and smooth movement. Cable external rotation is an alternative from the plan.'),
 exercise('Lateral raise',2,'15–20','Keep your shoulders away from your ears. Start with 2 of the original 2–3 sets.'),
 exercise('Biceps curl',3,'10–15','Use dumbbells or a cable. Keep your torso still and lower the weight with control.'),
 exercise('Cable triceps pushdown',3,'10–15','Extend your elbows without moving your upper arms or leaning your whole body forward.'),
 exercise('Bird dog',2,'6–8','Reach with opposite arm and leg without rotating your pelvis. Start with 2 of the original 2–3 sets.',true) ]}
};
// Keep original storage keys and historical names when removing an exercise.
for(const plan of Object.values(plans))plan.items.forEach((exercise,key)=>exercise.key=key);
const historyPlans=Object.fromEntries(Object.entries(plans).map(([id,plan])=>[id,{...plan,items:[...plan.items]}]));
plans.B.items=plans.B.items.filter(exercise=>exercise.key!==4);
const GUEST_KEY='opora-training-v1';
let KEY=GUEST_KEY;
const fresh=()=>({version:1,active:'A',sessions:{},history:[],sync:{revision:0,dirty:false,seq:0},timer:{duration:90,remaining:90,end:null}});
let state=fresh(),storageOK=true;
try{const raw=JSON.parse(localStorage.getItem(KEY));if(raw?.version===1&&plans[raw.active]&&raw.sessions&&typeof raw.sessions==='object'){state=raw;if(!state.timer||!Number.isFinite(state.timer.duration))state.timer=fresh().timer;}}catch{storageOK=false;}
const $=id=>document.getElementById(id);
function save(notify=true){if(notify){state.sync ||= {revision:0,dirty:false,seq:0};state.sync.seq++;state.sync.dirty=true;}try{localStorage.setItem(KEY,JSON.stringify(state));storageOK=true;}catch{storageOK=false;}$('saved').textContent=storageOK?'Saved on this device':'Unable to save on this device';if(notify)window.dispatchEvent(new Event('opora:changed'));}
function session(){if(!state.sessions[state.active]||typeof state.sessions[state.active]!=='object')state.sessions[state.active]={};const s=state.sessions[state.active];if(!s.exercises||typeof s.exercises!=='object')s.exercises={};if(state.active==='B')delete s.exercises[4];s.startedAt ||= new Date().toISOString();return s;}
function record(i){const s=session();if(!s.exercises[i]||!Array.isArray(s.exercises[i].sets))s.exercises[i]={sets:[],note:''};return s.exercises[i];}
function setRecord(i,j){const r=record(i);if(!r.sets[j]||typeof r.sets[j]!=='object')r.sets[j]={weight:'',reps:'',left:'',right:'',done:false};return r.sets[j];}
function numberInput(value,label,field,i,j,max=999){const input=document.createElement('input');input.type='number';input.min='0';input.max=String(max);input.step=field==='weight'?'0.5':'1';input.inputMode=field==='weight'?'decimal':'numeric';input.placeholder=field==='weight'?'kg':'0';input.value=typeof value==='string'||typeof value==='number'?value:'';input.setAttribute('aria-label',label);input.addEventListener('input',()=>{if(input.validity.valid){setRecord(i,j)[field]=input.value;save();}});return input;}
function render(){const p=plans[state.active];$('workout-label').textContent=`WORKOUT ${state.active}`;$('workout-title').textContent=p.title;document.querySelectorAll('[data-workout]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.workout===state.active)));const list=$('exercises');list.replaceChildren();p.items.forEach((e,position)=>{const i=e.key;const r=record(i),card=document.createElement('article');card.className='card exercise';card.innerHTML=`<div class="exercise-top"><span class="exercise-num">${String(position+1).padStart(2,'0')}</span><div class="exercise-title"><h3>${e.name}</h3><div class="prescription">${e.sets} × ${e.reps} ${e.unit}${e.side?' per side':''}</div></div><span class="exercise-count" id="count-${i}"></span></div><p class="technique">${e.tip}</p><div class="sets"><div class="set-head"><span>Set</span><span>Weight, kg</span><span>${e.side?'L / R, ':''}${e.unit}</span><span>Done</span></div></div>`;const rows=card.querySelector('.sets');const illustration=exerciseIllustration(i);if(illustration)card.insertBefore(illustration,rows);card.insertBefore(previousPanel(e,i),rows);for(let j=0;j<e.sets;j++){const s=setRecord(i,j),row=document.createElement('div');row.className='set-row'+(s.done?' done':'');const num=document.createElement('span');num.textContent=j+1;row.append(num,numberInput(s.weight,`${e.name}, set ${j+1}, weight in kg`,'weight',i,j));if(e.side){const sides=document.createElement('div');sides.style.cssText='display:flex;gap:5px';sides.append(numberInput(s.left,`${e.name}, set ${j+1}, left side, ${e.unit}`,'left',i,j),numberInput(s.right,`${e.name}, set ${j+1}, right side, ${e.unit}`,'right',i,j));row.append(sides);}else row.append(numberInput(s.reps,`${e.name}, set ${j+1}, reps`,'reps',i,j));const check=document.createElement('input');check.type='checkbox';check.checked=!!s.done;check.setAttribute('aria-label',`${e.name}, set ${j+1} completed${e.side?' on both sides':''}`);check.addEventListener('change',()=>{s.done=check.checked;row.classList.toggle('done',s.done);save();updateProgress();});row.append(check);rows.append(row);}const details=document.createElement('details'),summary=document.createElement('summary'),note=document.createElement('textarea');summary.textContent='Technique or pain note';note.placeholder='How it felt, machine settings, technique…';note.setAttribute('aria-label',`Note: ${e.name}`);note.value=typeof r.note==='string'?r.note:'';note.maxLength=4000;note.addEventListener('input',()=>{r.note=note.value;save();});details.append(summary,note);card.append(details);list.append(card);});const s=session();$('pain-before').value=s.before??'';$('pain-after').value=s.after??'';$('session-notes').value=s.note??'';updateProgress();renderHistory();}
function updateProgress(){let done=0,total=0;plans[state.active].items.forEach(e=>{const i=e.key;const count=record(i).sets.slice(0,e.sets).filter(s=>s?.done).length;done+=count;total+=e.sets;$(`count-${i}`).textContent=`${count}/${e.sets}`;});const percentage=Math.round(done/total*100);$('progress-label').textContent=done===total?'All sets checked. Time to recover.':`${done} of ${total} sets completed`;$('percent').textContent=`${percentage}%`;$('progress').value=percentage;}
document.querySelectorAll('[data-workout]').forEach(b=>b.addEventListener('click',()=>{state.active=b.dataset.workout;save(false);render();}));
[['pain-before','before'],['pain-after','after'],['session-notes','note']].forEach(([id,key])=>$(id).addEventListener('input',()=>{if($(id).validity.valid){session()[key]=$(id).value;save();}}));
$('new-session').addEventListener('click',()=>$('reset-dialog').showModal());$('cancel-reset').addEventListener('click',()=>$('reset-dialog').close());$('confirm-reset').addEventListener('click',()=>{const next=archiveWorkout(state,state.active,new Date().toISOString(),crypto.randomUUID());state.sessions=next.sessions;state.history=next.history;save();render();$('reset-dialog').close();});
function tick(){const t=state.timer;if(t.end){t.remaining=Math.max(0,Math.ceil((t.end-Date.now())/1000));if(t.remaining===0){t.end=null;$('timer-message').textContent='Rest complete';if(navigator.vibrate)navigator.vibrate([150,100,150]);save(false);}}const left=Number.isFinite(t.remaining)?t.remaining:t.duration;$('clock').textContent=`${String(Math.floor(left/60)).padStart(2,'0')}:${String(left%60).padStart(2,'0')}`;$('timer-toggle').textContent=t.end?'Pause':left===0?'Again':'Start';document.querySelectorAll('[data-seconds]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.seconds)===t.duration)));}
$('timer-toggle').addEventListener('click',()=>{const t=state.timer;if(t.end){t.remaining=Math.max(0,Math.ceil((t.end-Date.now())/1000));t.end=null;}else{if(!t.remaining)t.remaining=t.duration;t.end=Date.now()+t.remaining*1000;$('timer-message').textContent='Timer started';}save(false);tick();});$('timer-reset').addEventListener('click',()=>{state.timer.end=null;state.timer.remaining=state.timer.duration;save(false);tick();});document.querySelectorAll('[data-seconds]').forEach(b=>b.addEventListener('click',()=>{const seconds=Number(b.dataset.seconds);state.timer={duration:seconds,remaining:seconds,end:null};save(false);tick();}));
render();tick();setInterval(tick,250);document.addEventListener('visibilitychange',tick);if(!storageOK)$('saved').textContent='Storage unavailable';

function dateLabel(value){
  const date=new Date(value);
  return Number.isFinite(date.getTime())?date.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):'Date unavailable';
}
function previousPanel(exercise,index){
  const panel=document.createElement('section');panel.className='previous-performance';
  panel.setAttribute('aria-label',`Previous results for ${exercise.name}`);
  const previous=previousWorkout(state.history,state.active);
  const title=document.createElement('div');title.className='previous-title';
  const label=document.createElement('b');label.textContent='LAST TIME';title.append(label);panel.append(title);
  if(!previous){const empty=document.createElement('p');empty.textContent='No previous workout yet. Finish and save a session to compare next time.';panel.append(empty);return panel;}
  const date=document.createElement('span');date.textContent=dateLabel(previous.finishedAt);title.append(date);
  const old=previous.session?.exercises?.[index];
  const completed=(old?.sets || []).map((set,i)=>({set,i})).filter(({set})=>set.done);
  if(!completed.length){const empty=document.createElement('p');empty.textContent='No completed sets recorded for this exercise last time.';panel.append(empty);}
  for(const {set,i} of completed){const line=document.createElement('div');line.className='previous-set';const number=document.createElement('span');number.textContent=`Set ${i+1}`;const value=document.createElement('strong');value.textContent=formatSet(set,exercise);line.append(number,value);panel.append(line);}
  if(old?.note){const note=document.createElement('p');note.className='previous-note';note.textContent=`Note: ${old.note}`;panel.append(note);}
  return panel;
}
function renderHistory(){
  const list=$('history-list');list.replaceChildren();
  const selected=$('history-filter').value;
  const history=(Array.isArray(state.history)?state.history:[]).filter(item=>selected==='all'||item.workout===selected).slice().sort((a,b)=>Date.parse(b.finishedAt)-Date.parse(a.finishedAt));
  $('history-count').textContent=history.length;
  if(!history.length){list.textContent='No saved workouts yet. Use “Finish & save workout” after your session.';return;}
  for(const item of history){
    const details=document.createElement('details'),summary=document.createElement('summary');
    const count=Object.values(item.session?.exercises || {}).reduce((n,e)=>n+(e.sets || []).filter(s=>s.done).length,0);
    summary.textContent=`${dateLabel(item.finishedAt)} · ${item.workout}: ${plans[item.workout]?.title || 'Workout'} · ${count} completed sets${item.imported?' · saved copy':''}`;
    details.append(summary);
    const note=document.createElement('p');note.textContent=`Pain before: ${item.session?.before ?? 'not recorded'}. After: ${item.session?.after ?? 'not recorded'}. ${item.session?.note || ''}`.replaceAll(': .',': not recorded.');details.append(note);
    for(const [i,e] of Object.entries(item.session?.exercises || {})){
      const exercise=historyPlans[item.workout]?.items[i] || {name:'Exercise',unit:'reps'};
      const heading=document.createElement('h4');heading.textContent=exercise.name;details.append(heading);
      for(const [j,set] of (e.sets || []).entries()){
        const line=document.createElement('p');line.className='history-set';
        line.textContent=`Set ${j+1}: ${set.done?formatSet(set,exercise)+' · completed':'not completed'}`;
        details.append(line);
      }
      if(e.note){const line=document.createElement('p');line.textContent=`Note: ${e.note}`;details.append(line);}
    }
    list.append(details);
  }
}
$('history-filter').addEventListener('change',renderHistory);
window.opora={
  data:()=>trainingData(state),
  meta:()=>({...state.sync,revision:state.sync?.revision || 0,seq:state.sync?.seq || 0}),
  setMeta:meta=>{state.sync={...state.sync,...meta};save(false);},
  apply:data=>{state.sessions=data.sessions || {};state.history=data.history || [];save(false);render();},
  guest:()=>{try{return trainingData(JSON.parse(localStorage.getItem(GUEST_KEY)) || {});}catch{return {sessions:{},history:[]};}},
  switchAccount:id=>{
    KEY=id?`opora-account-${id}`:GUEST_KEY;
    try{state=JSON.parse(localStorage.getItem(KEY)) || fresh();}catch{state=fresh();}
    if(!plans[state.active]||!state.sessions)state=fresh();
    state.timer ||= fresh().timer;state.sync ||= {revision:0,dirty:false,seq:0};
    render();tick();
  },
  storageAvailable:()=>storageOK
};
window.dispatchEvent(new Event('opora:ready'));

function exerciseIllustration(index){
  if(!((state.active==='B'&&index<4)||(state.active==='C'&&index<2)))return null;
  const figure=document.createElement('figure');figure.className='exercise-illustration';
  const img=document.createElement('img');img.src=['images/goblet-squat.png','images/bulgarian-split-squat.png','images/hip-thrust.png','images/lying-leg-curl.png'][index];
  img.alt=index===0?'Goblet squat: standing with a dumbbell at chest height, then lowering into a squat with heels grounded.':'Supported Bulgarian split squat: rear foot on a bench, front foot grounded, one hand holding a rack; top and lowered positions.';
  if(index===2)img.alt='Unweighted hip thrust: upper back supported on a bench, feet grounded; hips lowered, then lifted in line with shoulders and knees.';
  if(index===3)img.alt='Lying leg curl: thighs supported on the bench, roller against the back of the ankles; legs extended, then knees bent to lift the heels.';
  if(state.active==='C'){img.src=['images/neutral-grip-lat-pulldown.png','images/single-arm-lat-pulldown.png'][index];img.alt=index===0?'Neutral-grip lat pulldown: arms extended overhead, then the parallel handle pulled toward the upper chest.':'Single-arm lat pulldown: one hand holding an overhead cable handle, then the elbow pulled down alongside the ribs; the other hand rests on the thigh.';}
  img.width=1536;img.height=1024;img.loading='lazy';img.decoding='async';
  const caption=document.createElement('figcaption');
  const start=document.createElement('span');start.textContent='1 · Start';
  const lower=document.createElement('span');lower.textContent=state.active==='C'?'2 · Pull down with control':index===2?'2 · Lift your hips':index===3?'2 · Curl your legs':'2 · Lower with control';
  caption.append(start,lower);figure.append(img,caption);
  return figure;
}
