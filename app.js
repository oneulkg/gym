const SHOW_PRO = false; // true로 바꾸면 PRO 탭/섹션 다시 표시
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const st=JSON.parse(localStorage.getItem('gym')||'{}');st.log??=[];st.plates??={25:1,20:1,15:1,10:1,5:1,2.5:1,1.25:1};st.platesLb??={45:1,35:1,25:1,10:1,5:1,2.5:1};st.rest??={};st.custom??=[];
st.lang??=((navigator.language||'ko').toLowerCase().startsWith('ko')?'ko':'en');st.unit??=(st.lang==='en'&&/^en-(us|lr|mm)/i.test(navigator.language||'')?'lb':'kg');
const save=()=>localStorage.setItem('gym',JSON.stringify(st));
const t=(k,p={})=>{let s=I18N[st.lang][k]??I18N.ko[k]??k;for(const x in p)s=s.split('{'+x+'}').join(p[x]);return s};
const nm=n=>st.lang==='en'?(L.EN[n]||n):n;
const U=()=>st.unit,UL=()=>st.unit==='lb'?'lb':'kg',W=v=>Math.round(v*100)/100+' '+UL();
const plateSet=()=>st.unit==='lb'?st.platesLb:st.plates;
function show(tab){$$('nav button').forEach(x=>x.classList.toggle('on',x.dataset.t===tab));$$('section').forEach(s=>s.classList.toggle('on',s.id===tab));scrollTo(0,0)}
$$('nav button').forEach(b=>b.onclick=()=>show(b.dataset.t));
const exDef=n=>{const e=L.EX.find(x=>x.n===n)||{n,min:8,max:12,t:'compound'};const c=st.custom.find(x=>x.n===n);return{...e,sets:3,...(c||{})}};
function fillEx(sel){const v=sel.value;sel.innerHTML=L.EX.map(e=>`<option value="${e.n}">${nm(e.n)}</option>`).join('');if(v)sel.value=v}
function applyLang(){document.documentElement.lang=st.lang;$$('[data-i]').forEach(e=>e.textContent=t(e.dataset.i));$$('[data-h]').forEach(e=>e.innerHTML=t(e.dataset.h));
 document.title=st.lang==='en'?"오늘 몇 kg · Today's Lift":'오늘 몇 kg';$('#today').textContent=new Date().toLocaleDateString(st.lang==='en'?'en-US':'ko-KR',{month:'short',day:'numeric',weekday:'short'});
 $$('#langChips button').forEach(c=>c.classList.toggle('on',c.dataset.l===st.lang));$$('#unitChips button').forEach(c=>c.classList.toggle('on',c.dataset.u===st.unit));
 const lb=st.unit==='lb';$('#rules').innerHTML=`<b>${t('ruleH')}</b><br>· ${t('rule1',{up:lb?'5 lb':'2.5kg',lo:lb?'10 lb':'5kg'})}<br>· ${t('rule2')}<br>· ${t('rule3')}`;
 $('#wLbl').textContent=`${t('weight')} (${UL()})`;$('#ptLbl').textContent=`${t('target')} (${UL()})`;$('#pcLbl').textContent=`${t('collar')} (${UL()})`;$('#newPl').placeholder=`${t('addPl')} (${UL()})`;
 fillEx($('#exSel'));fillEx($('#rEx'));renderLog();renderPlate();loadRest();chips();renderRt()}
$$('#langChips button').forEach(c=>c.onclick=()=>{st.lang=c.dataset.l;save();applyLang()});
$$('#unitChips button').forEach(c=>c.onclick=()=>{const nu=c.dataset.u;if(nu===st.unit)return;
 const conv=v=>{const kg=L.toKg(+v,st.unit);return Math.round(L.toU(kg,nu)*2)/2};
 const pt=$('#pt').value,pc=$('#pc').value;st.unit=nu;$('#pt').value=pt?L.rnd(+conv(pt),nu==='lb'?5:2.5):'';$('#pb').value=nu==='lb'?45:20;$('#pc').value=pc?conv(pc):0;sess=[];save();applyLang()});
// ---- 1 기록
let sess=[];
const lastOf=n=>st.log.filter(x=>x.ex===n).slice(-1)[0];
const best=x=>Math.max(...x.sets.map(s=>L.e1rm(L.toU(x.weight,U()),s.reps)));
function renderLog(){const n=$('#exSel').value,ex=exDef(n),last=lastOf(n),s=L.suggest(ex,last,U());
 const why=s.code==='first'?t('first',{n:ex.min}):s.code==='up'?t('up',{max:ex.max,min:ex.min,inc:s.inc+' '+UL()}):s.code==='down'?t('down'):t('reps',{m:s.minR});
 $('#sug').innerHTML=`<div class="muted">${t('todayT',{a:ex.min,b:ex.max})}</div><div class="big">${s.weight==null?'—':W(s.weight)} × ${t('xReps',{n:s.reps})} × ${t('xSets',{n:s.sets})}</div><div class="muted">${why}</div>`+(last?`<div class="muted">${t('last',{d:last.date,w:L.fmtW(last.weight,U())+' '+UL(),r:last.sets.map(x=>x.reps).join('/')})}</div>`:'');
 if(!sess.length){$('#w').value=s.weight??'';sess=Array.from({length:s.sets},()=>({reps:s.reps}))}
 $('#sets').innerHTML=sess.map((x,i)=>`<div class="setrow"><b>${t('setN',{n:i+1})}</b><input type="number" inputmode="numeric" value="${x.reps}" data-k="${i}"><span class="muted">${t('repsU')}</span><button class="chip" data-d="${i}">✕</button></div>`).join('');
 $$('#sets input').forEach(i=>i.oninput=()=>sess[i.dataset.k].reps=+i.value);$$('#sets [data-d]').forEach(b=>b.onclick=()=>{sess.splice(b.dataset.d,1);renderLog()});
 const h=st.log.filter(x=>x.ex===n);$('#hist').innerHTML=h.length?`<table><tr><th>${t('hDate')}</th><th>${t('hW')}</th><th>${t('hR')}</th><th>e1RM</th></tr>${h.slice(-8).reverse().map(x=>`<tr><td>${x.date}</td><td>${L.fmtW(x.weight,U())}</td><td>${x.sets.map(s=>s.reps).join('/')}</td><td>${Math.round(best(x)*10)/10}</td></tr>`).join('')}</table>`:`<p class="muted">${t('noHist')}</p>`;chart(h)}
function chart(h){const c=$('#chart'),g=c.getContext('2d');g.clearRect(0,0,600,300);g.fillStyle='#666';g.font='22px sans-serif';
 if(h.length<2){g.fillText(t('chart2'),90,150);return}
 const v=h.map(x=>Math.round(best(x)*10)/10),mn=Math.min(...v)*.95,mx=Math.max(...v)*1.05,X=i=>40+i*(540/(v.length-1)),Y=y=>270-(y-mn)/(mx-mn||1)*240;
 g.strokeStyle='#c6ff3d';g.lineWidth=4;g.beginPath();v.forEach((y,i)=>i?g.lineTo(X(i),Y(y)):g.moveTo(X(i),Y(y)));g.stroke();
 g.fillStyle='#c6ff3d';v.forEach((y,i)=>{g.beginPath();g.arc(X(i),Y(y),6,0,7);g.fill()});g.fillStyle='#aaa';g.fillText(W(v[v.length-1]),X(v.length-1)-100,Y(v[v.length-1])-14)}
$('#exSel').onchange=()=>{sess=[];renderLog()};$('#addSet').onclick=()=>{sess.push({reps:sess.length?sess[sess.length-1].reps:8});renderLog()};
$('#save').onclick=()=>{const w=+$('#w').value;if(!w||!sess.length)return alert(t('needW'));st.log.push({ex:$('#exSel').value,date:new Date().toISOString().slice(0,10),weight:Math.round(L.toKg(w,U())*10000)/10000,sets:sess.map(s=>({reps:+s.reps}))});save();sess=[];
 const q=st.queue||[],i=q.indexOf($('#exSel').value);if(i>=0&&q[i+1])$('#exSel').value=q[i+1];renderLog()};
$('#restBtn').onclick=()=>{$('#rEx').value=$('#exSel').value;loadRest();show('t-rest');startT()};
// ---- 2 원판 (표시 단위로 계산)
const COL={25:'#e5484d',20:'#3e7bfa',15:'#f5c518',10:'#46a758',5:'#eee',2.5:'#e5484d',1.25:'#bbb'},COLB={45:'#3e7bfa',35:'#f5c518',25:'#46a758',10:'#eee',5:'#e5484d',2.5:'#bbb'};
const BARS={kg:[['std',20],['w',15],['b10',10],['ez',7],['cus',null]],lb:[['std',45],['w',35],['ez',25],['cus',null]]};
if(!$('#pb').value){$('#pb').value=U()==='lb'?45:20;$('#pt').value=U()==='lb'?135:60}
function renderPlate(){const ps=plateSet(),ks=Object.keys(ps).map(Number).sort((a,b)=>b-a),bn=I18N[st.lang].bars;
 $('#barChips').innerHTML=BARS[U()].map(([k,v])=>`<button class="chip ${String(v)===$('#pb').value?'on':''}" data-b="${v??''}">${bn[k]}</button>`).join('');
 $$('#barChips .chip').forEach(b=>b.onclick=()=>{if(b.dataset.b)$('#pb').value=b.dataset.b;else $('#pb').focus();renderPlate()});
 $('#plChips').innerHTML=ks.map(k=>`<button class="chip ${ps[k]?'on':''}" data-p="${k}">${k} ${UL()}</button>`).join('');
 $$('#plChips .chip').forEach(b=>b.onclick=()=>{ps[b.dataset.p]=ps[b.dataset.p]?0:1;save();renderPlate()});
 const tg=+$('#pt').value,bar=+$('#pb').value,col=+$('#pc').value||0,av=ks.filter(k=>ps[k]);
 if(!tg||!av.length){$('#pres').textContent=t('pickT');$('#barViz').innerHTML='';return}
 const r=L.plates(tg,bar,av,col);
 $('#pres').innerHTML=`<div class="muted">${t('side')}</div><div class="big">${r.side.length?r.side.join(' + ')+' '+UL():t('none')}</div>`+(r.exact?`<div>${t('exact',{w:W(r.total)})}</div>`:`<div style="color:#ffb224">${t('closest',{t:W(tg),w:W(r.total)})}</div>`)+`<div class="muted">${t('barL',{b:W(bar)})}${col?t('collarL',{c:col}):''}</div>`;
 const max=Math.max(...ks),pv=p=>`<div class="pl" style="background:${(U()==='lb'?COLB:COL)[p]||'#9b8afb'};height:${50+p/max*90}px;width:${p/max>=.4?22:14}px">${p}</div>`;
 $('#barViz').innerHTML=[...r.side].reverse().map(pv).join('')+'<div class="sleeve"></div><div class="shaft"></div><div class="sleeve"></div>'+r.side.map(pv).join('')}
['#pt','#pb','#pc'].forEach(s=>$(s).oninput=renderPlate);
$('#addPl').onclick=()=>{const v=+$('#newPl').value;if(v>0){plateSet()[v]=1;save();$('#newPl').value='';renderPlate()}};
// ---- 3 휴식
let end=0,tick=null,ac;
const fmt=s=>Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
function loadRest(){const n=$('#rEx').value;$('#rSec').value=st.rest[n]??L.restDefault(exDef(n).t);if(!end)$('#tm').textContent=fmt(+$('#rSec').value)}
$('#rEx').onchange=loadRest;$('#rSec').oninput=()=>{st.rest[$('#rEx').value]=+$('#rSec').value;save();if(!end)$('#tm').textContent=fmt(+$('#rSec').value)};
$$('#t-rest [data-s]').forEach(b=>b.onclick=()=>{$('#rSec').value=b.dataset.s;$('#rSec').oninput()});
function beep(){try{ac??=new AudioContext();[0,.35,.7].forEach(d=>{const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=880;o.connect(g);g.connect(ac.destination);g.gain.setValueAtTime(.4,ac.currentTime+d);o.start(ac.currentTime+d);o.stop(ac.currentTime+d+.25)})}catch(e){}}
function startT(){try{ac??=new AudioContext();ac.resume()}catch(e){}end=Date.now()+(+$('#rSec').value)*1000;localStorage.setItem('gymEnd',end);$('#tm').classList.remove('done');clearInterval(tick);tick=setInterval(upd,250);upd()}
function upd(){if(!end)return;const left=Math.max(0,Math.ceil((end-Date.now())/1000));$('#tm').textContent=fmt(left);document.title=left?fmt(left)+' · 오늘 몇 kg':t('doneT');
 if(!left){clearInterval(tick);end=0;localStorage.removeItem('gymEnd');$('#tm').classList.add('done');$('#tm').textContent=t('done');navigator.vibrate?.([400,200,400,200,400]);beep();
  if(window.Notification&&Notification.permission==='granted'&&document.hidden)new Notification(t('notif'))}}
$('#tStart').onclick=()=>{if(window.Notification&&Notification.permission==='default')Notification.requestPermission();startT()};
$('#tStop').onclick=()=>{clearInterval(tick);end=0;localStorage.removeItem('gymEnd');document.title='오늘 몇 kg';loadRest()};
document.addEventListener('visibilitychange',upd);
{const e=+localStorage.getItem('gymEnd');if(e>Date.now()){end=e;tick=setInterval(upd,250)}}
// ---- 4 루틴
let mins=st.mins||45,parts=st.parts||['가슴','전면 삼각근'],rt=null;
function chips(){$('#minChips').innerHTML=[30,45,60].map(m=>`<button class="chip ${m===mins?'on':''}" data-m="${m}">${t('min',{n:m})}</button>`).join('');
 $('#partChips').innerHTML=L.PARTS.map(p=>`<button class="chip ${parts.includes(p)?'on':''}" data-p="${p}">${nm(p)}</button>`).join('');
 $$('#minChips .chip').forEach(b=>b.onclick=()=>{mins=+b.dataset.m;chips()});
 $$('#partChips .chip').forEach(b=>b.onclick=()=>{const p=b.dataset.p;parts=parts.includes(p)?parts.filter(x=>x!==p):[...parts,p];chips()})}
const est=()=>Math.round(5+rt.reduce((a,i)=>a+i.sets*(45+i.rest),0)/60);
function renderRt(){if(!rt){$('#rtOut').innerHTML=`<p class="muted">${t('rtEmpty')}</p>`;return}
 $('#rtOut').innerHTML=`<b>${t('est',{e:est()})}</b> <span class="muted">${t('estOf',{m:mins})}</span><div class="ri muted"><div>${t('cEx')}</div><div>${t('cS')}</div><div>${t('cR')}</div><div>${t('cRest')}</div><div></div></div>`+
 rt.map((i,k)=>`<div class="ri"><div>${nm(i.n)}</div><input type="number" value="${i.sets}" data-k="${k}" data-f="sets"><input value="${i.min}-${i.max}" data-k="${k}" data-f="rr"><input type="number" value="${i.rest}" data-k="${k}" data-f="rest"><button class="chip" data-x="${k}">✕</button></div>`).join('')+
 `<div class="row"><select id="addEx">${L.EX.filter(e=>parts.includes(e.p)).map(e=>`<option value="${e.n}">${nm(e.n)}</option>`).join('')}</select><button class="btn s" id="addRt" style="flex:0">${t('add')}</button></div><button class="btn p" id="go">${t('go')}</button>`;
 $$('#rtOut input').forEach(i=>i.onchange=()=>{const o=rt[i.dataset.k];if(i.dataset.f==='rr'){const[a,b]=i.value.split('-').map(Number);if(a&&b){o.min=a;o.max=b}}else o[i.dataset.f]=+i.value;renderRt()});
 $$('#rtOut [data-x]').forEach(b=>b.onclick=()=>{rt.splice(b.dataset.x,1);renderRt()});
 $('#addRt').onclick=()=>{const e=L.EX.find(x=>x.n===$('#addEx').value);rt.push({n:e.n,sets:3,min:e.min,max:e.max,rest:L.restDefault(e.t),lower:!!e.lower});renderRt()};
 $('#go').onclick=()=>{rt.forEach(i=>{st.custom=st.custom.filter(c=>c.n!==i.n);st.custom.push({n:i.n,sets:i.sets,min:i.min,max:i.max});st.rest[i.n]=i.rest});st.queue=rt.map(i=>i.n);save();$('#exSel').value=rt[0].n;sess=[];renderLog();show('t-log')}}
$('#gen').onclick=()=>{if(!parts.length)return alert(t('pickP'));st.mins=mins;st.parts=parts;save();rt=L.routine(mins,parts).items;renderRt()};
$('#exp').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(st,null,1)],{type:'application/json'}));a.download='gym-backup.json';a.click()};
$('#wipe').onclick=()=>{if(confirm(t('wipeQ'))){localStorage.removeItem('gym');location.reload()}};
$('#gearBtn').onclick=e=>{e.stopPropagation();$('#gearMenu').hidden=!$('#gearMenu').hidden};
document.addEventListener('click',e=>{if(!$('#gearMenu').hidden&&!e.target.closest('#gearMenu'))$('#gearMenu').hidden=true});
if(!SHOW_PRO){$('#proTab').remove();$('#t-pro').remove()}
document.getElementById('nav').style.gridTemplateColumns=`repeat(${SHOW_PRO?5:4},1fr)`;
applyLang();save();
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js');
