import {trainingData,archiveWorkout} from './data.js';
'use strict';
const exercise=(name,sets,reps,tip,side=false,unit='повт.')=>({name,sets,reps,tip,side,unit});
const plans={
 A:{title:'Грудь, тяга и лопатка',items:[
 exercise('Тяга с упором грудью',3,'10–12','Грудь остаётся на опоре. Лопатки свободно движутся по рёбрам, без силового сведения и подъёма плеч.'),
 exercise('Жим гантелей на наклонной',3,'8–12','Опирайся спиной на скамью. Умеренный наклон, комфортная глубина, без чрезмерного прогиба.'),
 exercise('Тяга блока одной рукой сидя',3,'10–12','Не разворачивай корпус вслед за рукой. Одинаковая нагрузка справа и слева.',true),
 exercise('Жим в тренажёре на грудь',3,'10–12','Настрой сиденье под себя. Спина на опоре, плечи не поднимай к ушам.'),
 exercise('Face pull с канатом',3,'12–15','Лёгкий вес. Тяни канат к лицу без запрокидывания головы и рывков.'),
 exercise('Обратная разводка',2,'12–15','Тренажёр или блоки. Двигай руками плавно, без силового сведения лопаток.'),
 exercise('Pallof press',3,'10–12','Не позволяй блоку разворачивать корпус. Выдыхай при выпрямлении рук.',true),
 exercise('Бицепс с гантелями',2,'10–15','Без раскачивания корпуса. Локти остаются у тела. В исходном плане 2–3 подхода; здесь выбран нижний объём.'),
 exercise('Трицепс на блоке',2,'10–15','Локти рядом с корпусом. Не нависай над рукоятью. В исходном плане 2–3 подхода; здесь выбран нижний объём.') ]},
 B:{title:'Ноги, корпус и плечи',items:[
 exercise('Goblet squat',3,'8–12','Небольшой вес у груди, комфортная глубина. Альтернатива из плана: hack squat. При симптомах не продолжай; вариант подбери со специалистом.'),
 exercise('Болгарский сплит-присед',3,'8–10','Держись рукой за стойку для устойчивости. Контролируй движение, не гонись за глубиной.',true),
 exercise('Ягодичный мост / hip thrust',3,'10–12','Поднимай таз за счёт ягодиц, не переразгибай поясницу. Начни с комфортной нагрузки.'),
 exercise('Сгибание ног в тренажёре',3,'10–15','Сидя или лёжа. Настрой валик и ось тренажёра, не отрывай таз.'),
 exercise('Жим гантелей сидя со спинкой',3,'8–12','Умеренный вес и опора спины. Не компенсируй движение прогибом. При боли прекрати упражнение.'),
 exercise('Подъём гантелей в стороны',3,'12–20','Поднимай в комфортном диапазоне, без рывков и пожимания плечами.'),
 exercise('Y-raise на блоке',2,'12–15','Лёгкая нагрузка, руки движутся по диагонали буквой Y. В исходном плане 2–3 подхода.'),
 exercise('Dead bug',3,'6–10','Медленно опускай противоположные руку и ногу. Сократи амплитуду, если теряешь контроль корпуса.',true),
 exercise('Боковая планка',2,'20–40','Дыши спокойно, не проваливайся в плече. Вариант с колен допустим. В исходном плане 2–3 подхода.',true,'сек') ]},
 C:{title:'Спина, грудь и руки',items:[
 exercise('Верхний блок нейтральным хватом',3,'8–12','Тяни перед собой к верхней части груди. Без рывка и сильного отклонения назад.'),
 exercise('Тяга верхнего блока одной рукой',3,'10–12','Сохраняй устойчивое положение таза и рёбер. Не заваливайся в сторону.',true),
 exercise('Жим гантелей лёжа',3,'8–12','Стопы устойчивы, спина на скамье. Комфортная амплитуда без глубокого растяжения через боль.'),
 exercise('Горизонтальная тяга сидя',3,'10–12','По возможности используй упор. Корпус стабилен, не раскачивайся.'),
 exercise('Сведение рук на блоках',2,'12–15','Мягко согни локти. Не уводи руки далеко назад и не растягивай плечи через боль.'),
 exercise('Face pull',2,'15','Лёгкий вес, плавное движение. Альтернатива из плана: наружная ротация плеча на блоке.'),
 exercise('Подъём гантелей в стороны',2,'15–20','Не поднимай плечи к ушам. В исходном плане 2–3 подхода.'),
 exercise('Бицепс',3,'10–15','Гантели или блок. Держи корпус спокойно, опускай вес под контролем.'),
 exercise('Трицепс на блоке',3,'10–15','Разгибай локти без движения плечом и наклона всего корпуса.'),
 exercise('Bird dog',2,'6–8','Тяни противоположные руку и ногу, не разворачивая таз. В исходном плане 2–3 подхода.',true) ]}
};
const GUEST_KEY='opora-training-v1';
let KEY=GUEST_KEY;
const fresh=()=>({version:1,active:'A',sessions:{},history:[],sync:{revision:0,dirty:false,seq:0},timer:{duration:90,remaining:90,end:null}});
let state=fresh(),storageOK=true;
try{const raw=JSON.parse(localStorage.getItem(KEY));if(raw?.version===1&&plans[raw.active]&&raw.sessions&&typeof raw.sessions==='object'){state=raw;if(!state.timer||!Number.isFinite(state.timer.duration))state.timer=fresh().timer;}}catch{storageOK=false;}
const $=id=>document.getElementById(id);
function save(notify=true){if(notify){state.sync ||= {revision:0,dirty:false,seq:0};state.sync.seq++;state.sync.dirty=true;}try{localStorage.setItem(KEY,JSON.stringify(state));storageOK=true;}catch{storageOK=false;}$('saved').textContent=storageOK?'Сохранено на устройстве':'Не удалось сохранить данные';if(notify)window.dispatchEvent(new Event('opora:changed'));}
function session(){if(!state.sessions[state.active]||typeof state.sessions[state.active]!=='object')state.sessions[state.active]={};const s=state.sessions[state.active];if(!s.exercises||typeof s.exercises!=='object')s.exercises={};s.startedAt ||= new Date().toISOString();return s;}
function record(i){const s=session();if(!s.exercises[i]||!Array.isArray(s.exercises[i].sets))s.exercises[i]={sets:[],note:''};return s.exercises[i];}
function setRecord(i,j){const r=record(i);if(!r.sets[j]||typeof r.sets[j]!=='object')r.sets[j]={weight:'',reps:'',left:'',right:'',done:false};return r.sets[j];}
function numberInput(value,label,field,i,j,max=999){const input=document.createElement('input');input.type='number';input.min='0';input.max=String(max);input.step=field==='weight'?'0.5':'1';input.inputMode=field==='weight'?'decimal':'numeric';input.placeholder=field==='weight'?'кг':'0';input.value=typeof value==='string'||typeof value==='number'?value:'';input.setAttribute('aria-label',label);input.addEventListener('input',()=>{if(input.validity.valid){setRecord(i,j)[field]=input.value;save();}});return input;}
function render(){const p=plans[state.active];$('workout-label').textContent=`ТРЕНИРОВКА ${state.active}`;$('workout-title').textContent=p.title;document.querySelectorAll('[data-workout]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.workout===state.active)));const list=$('exercises');list.replaceChildren();p.items.forEach((e,i)=>{const r=record(i),card=document.createElement('article');card.className='card exercise';card.innerHTML=`<div class="exercise-top"><span class="exercise-num">${String(i+1).padStart(2,'0')}</span><div class="exercise-title"><h3>${e.name}</h3><div class="prescription">${e.sets} × ${e.reps} ${e.unit}${e.side?' на сторону':''}</div></div><span class="exercise-count" id="count-${i}"></span></div><p class="technique">${e.tip}</p><div class="sets"><div class="set-head"><span>Сет</span><span>Вес, кг</span><span>${e.side?'Л / П, ':''}${e.unit}</span><span>Готово</span></div></div>`;const rows=card.querySelector('.sets');for(let j=0;j<e.sets;j++){const s=setRecord(i,j),row=document.createElement('div');row.className='set-row'+(s.done?' done':'');const num=document.createElement('span');num.textContent=j+1;row.append(num,numberInput(s.weight,`${e.name}, подход ${j+1}, вес в кг`,'weight',i,j));if(e.side){const sides=document.createElement('div');sides.style.cssText='display:flex;gap:5px';sides.append(numberInput(s.left,`${e.name}, подход ${j+1}, левая сторона, ${e.unit}`,'left',i,j),numberInput(s.right,`${e.name}, подход ${j+1}, правая сторона, ${e.unit}`,'right',i,j));row.append(sides);}else row.append(numberInput(s.reps,`${e.name}, подход ${j+1}, повторы`,'reps',i,j));const check=document.createElement('input');check.type='checkbox';check.checked=!!s.done;check.setAttribute('aria-label',`${e.name}, подход ${j+1} выполнен${e.side?' с обеих сторон':''}`);check.addEventListener('change',()=>{s.done=check.checked;row.classList.toggle('done',s.done);save();updateProgress();});row.append(check);rows.append(row);}const details=document.createElement('details'),summary=document.createElement('summary'),note=document.createElement('textarea');summary.textContent='Заметка по технике или боли';note.placeholder='Ощущения, настройка тренажёра, техника…';note.setAttribute('aria-label',`Заметка: ${e.name}`);note.value=typeof r.note==='string'?r.note:'';note.maxLength=4000;note.addEventListener('input',()=>{r.note=note.value;save();});details.append(summary,note);card.append(details);list.append(card);});const s=session();$('pain-before').value=s.before??'';$('pain-after').value=s.after??'';$('session-notes').value=s.note??'';updateProgress();renderHistory();}
function updateProgress(){let done=0,total=0;plans[state.active].items.forEach((e,i)=>{const count=record(i).sets.slice(0,e.sets).filter(s=>s?.done).length;done+=count;total+=e.sets;$(`count-${i}`).textContent=`${count}/${e.sets}`;});const percentage=Math.round(done/total*100);$('progress-label').textContent=done===total?'Все подходы отмечены. Время восстановиться.':`Выполнено ${done} из ${total} подходов`;$('percent').textContent=`${percentage}%`;$('progress').value=percentage;}
document.querySelectorAll('[data-workout]').forEach(b=>b.addEventListener('click',()=>{state.active=b.dataset.workout;save(false);render();}));
[['pain-before','before'],['pain-after','after'],['session-notes','note']].forEach(([id,key])=>$(id).addEventListener('input',()=>{if($(id).validity.valid){session()[key]=$(id).value;save();}}));
$('new-session').addEventListener('click',()=>$('reset-dialog').showModal());$('cancel-reset').addEventListener('click',()=>$('reset-dialog').close());$('confirm-reset').addEventListener('click',()=>{const next=archiveWorkout(state,state.active,new Date().toISOString(),crypto.randomUUID());state.sessions=next.sessions;state.history=next.history;save();render();$('reset-dialog').close();});
function tick(){const t=state.timer;if(t.end){t.remaining=Math.max(0,Math.ceil((t.end-Date.now())/1000));if(t.remaining===0){t.end=null;$('timer-message').textContent='Отдых завершён';if(navigator.vibrate)navigator.vibrate([150,100,150]);save(false);}}const left=Number.isFinite(t.remaining)?t.remaining:t.duration;$('clock').textContent=`${String(Math.floor(left/60)).padStart(2,'0')}:${String(left%60).padStart(2,'0')}`;$('timer-toggle').textContent=t.end?'Пауза':left===0?'Ещё раз':'Старт';document.querySelectorAll('[data-seconds]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.seconds)===t.duration)));}
$('timer-toggle').addEventListener('click',()=>{const t=state.timer;if(t.end){t.remaining=Math.max(0,Math.ceil((t.end-Date.now())/1000));t.end=null;}else{if(!t.remaining)t.remaining=t.duration;t.end=Date.now()+t.remaining*1000;$('timer-message').textContent='Таймер запущен';}save(false);tick();});$('timer-reset').addEventListener('click',()=>{state.timer.end=null;state.timer.remaining=state.timer.duration;save(false);tick();});document.querySelectorAll('[data-seconds]').forEach(b=>b.addEventListener('click',()=>{const seconds=Number(b.dataset.seconds);state.timer={duration:seconds,remaining:seconds,end:null};save(false);tick();}));
render();tick();setInterval(tick,250);document.addEventListener('visibilitychange',tick);if(!storageOK)$('saved').textContent='Хранилище недоступно';

function renderHistory(){
  const list=$('history-list');list.replaceChildren();
  const history=Array.isArray(state.history)?state.history:[];
  $('history-count').textContent=history.length;
  if(!history.length){list.textContent='Завершённые тренировки появятся здесь.';return;}
  for(const item of history){
    const details=document.createElement('details'),summary=document.createElement('summary');
    const date=new Date(item.finishedAt).toLocaleString('ru-RU',{dateStyle:'medium',timeStyle:'short'});
    summary.textContent=`${date} · ${item.workout}${item.imported?' · сохранённая копия':''}`;
    details.append(summary);
    const note=document.createElement('p');note.textContent=`Боль до: ${item.session?.before || 'не указана'}. После: ${item.session?.after || 'не указана'}. ${item.session?.note || ''}`;details.append(note);
    for(const [i,e] of Object.entries(item.session?.exercises || {})){
      const line=document.createElement('p');
      line.textContent=`${plans[item.workout]?.items[i]?.name || 'Упражнение'}: ${(e.sets || []).map(r=>`${r.done?'✓':'○'} ${r.weight || '0'} кг × ${r.left || r.right?`${r.left || '0'}/${r.right || '0'}`:r.reps || '0'}`).join('; ')}${e.note?'. '+e.note:''}`;
      details.append(line);
    }
    list.append(details);
  }
}
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
