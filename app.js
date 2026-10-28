const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const st=JSON.parse(localStorage.getItem('gym')||'{}');st.log??=[];st.plates??={25:1,20:1,15:1,10:1,5:1,2.5:1,1.25:1};st.platesLb??={45:1,35:1,25:1,10:1,5:1,2.5:1};st.rest??={};st.custom??=[];st.notes??={};delete st.collar;st.barSel??='std';
st.lang??=((navigator.language||'ko').toLowerCase().startsWith('ko')?'ko':'en');st.unit??=(st.lang==='en'&&/^en-(us|lr|mm)/i.test(navigator.language||'')?'lb':'kg');
const save=()=>localStorage.setItem('gym',JSON.stringify(st));
const esc=x=>String(x).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
// v11: 문장 단위로 줄바꿈 — 한 줄에 안 들어가는 문장은 통째로 다음 줄로
const sent=x=>String(x).replace(/([’”'")])(?=[가-힣])/g,'$1\u2060').split('\n').map(l=>l.split(/(?<=[.!?。]|[요다]\.?)\s+(?=[^\s·])/u).map(p=>`<span class="sn">${esc(p)}</span>`).join(' ')).join('<br>');
const SENT_KEYS=/^(g[A-Z]|tplNote$)/;
const t=(k,p={})=>{let s=I18N[st.lang][k]??I18N.ko[k]??k;for(const x in p)s=s.split('{'+x+'}').join(p[x]);return s};
const nm=n=>st.lang==='en'?(L.EN[n]||n):n;
const U=()=>st.unit,UL=()=>st.unit==='lb'?'lb':'kg',W=v=>Math.round(v*100)/100+' '+UL();
const plateSet=()=>st.unit==='lb'?st.platesLb:st.plates;
function show(tab){$$('nav button').forEach(x=>x.classList.toggle('on',x.dataset.t===tab));$$('section').forEach(s=>s.classList.toggle('on',s.id===tab));scrollTo(0,0)}
$$('nav button').forEach(b=>b.onclick=()=>show(b.dataset.t));
const exDef=n=>{const e=L.EX.find(x=>x.n===n)||{n,min:8,max:12,t:'compound'};const c=st.custom.find(x=>x.n===n);return{...e,sets:3,...(c||{})}};
function fillEx(sel){const v=sel.value;sel.innerHTML=L.EX.map(e=>`<option value="${e.n}">${nm(e.n)}</option>`).join('');if(v)sel.value=v}
function applyLang(){document.documentElement.lang=st.lang;$$('[data-i]').forEach(e=>SENT_KEYS.test(e.dataset.i)?e.innerHTML=sent(t(e.dataset.i)):e.textContent=t(e.dataset.i));$$('[data-h]').forEach(e=>e.innerHTML=t(e.dataset.h));
 document.title=st.lang==='en'?"오늘 몇 kg · Today's Lift":'오늘 몇 kg';$('#today').textContent=new Date().toLocaleDateString(st.lang==='en'?'en-US':'ko-KR',{month:'short',day:'numeric',weekday:'short'});
 $$('#langChips button').forEach(c=>c.classList.toggle('on',c.dataset.l===st.lang));$$('#unitChips button').forEach(c=>c.classList.toggle('on',c.dataset.u===st.unit));
 const lb=st.unit==='lb';$('#rules').innerHTML=`· ${t('rule1',{up:lb?'5 lb':'2.5kg',lo:lb?'10 lb':'5kg'})}<br>· ${t('rule2')}<br>· ${t('rule3')}`;
 $('#wLbl').textContent=`${t('weight')} (${UL()})`;$('#ptLbl').textContent=`${t('target')} (${UL()})`;$('#pbLbl').textContent=`${t('customBar')} (${UL()})`;$('#newPl').placeholder=`${t('addPl')} (${UL()})`;
 fillEx($('#exSel'));fillEx($('#rEx'));renderLog();renderPlate();loadRest();chips();renderRt();renderTpl();if(!$('#tour').hidden)tourShow()}
$$('#langChips button').forEach(c=>c.onclick=()=>{st.lang=c.dataset.l;save();applyLang()});
$$('#unitChips button').forEach(c=>c.onclick=()=>{const nu=c.dataset.u;if(nu===st.unit)return;
 const conv=v=>{const kg=L.toKg(+v,st.unit);return Math.round(L.toU(kg,nu)*2)/2};
 const pt=$('#pt').value,npt=pt?L.rnd(+conv(pt),nu==='lb'?5:2.5):'';st.unit=nu;$('#pt').value=npt;st.barSel='std';$('#pb').value=nu==='lb'?45:20;sess=[];save();applyLang()});
// ---- 1 기록
let sess=[],editIdx=null;
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
let toastT;const toast=m=>{const e=$('#toast');e.textContent=m;e.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>e.hidden=true,2600)};
const lastOf=n=>st.log.filter((x,i)=>x.ex===n&&i!==editIdx).slice(-1)[0];
const best=x=>Math.max(...x.sets.map(s=>L.e1rm(L.toU(x.weight,U()),s.reps)));
function renderLog(){const n=$('#exSel').value,ex=exDef(n),last=lastOf(n),s=L.suggest(ex,last,U());
 const why=s.code==='first'?t('first',{n:ex.min}):s.code==='up'?t('up',{max:ex.max,min:ex.min,inc:s.inc+' '+UL()}):s.code==='down'?t('down'):t('reps',{m:s.minR});
 $('#sug').innerHTML=`<div class="muted">${t('todayT',{a:ex.min,b:ex.max})}</div><div class="big">${s.weight==null?'—':W(s.weight)} × ${t('xReps',{n:s.reps})} × ${t('xSets',{n:s.sets})}</div><div class="muted">${why}</div>`+(last?`<div class="muted">${t('last',{d:last.date,w:L.fmtW(last.weight,U())+' '+UL(),r:last.sets.map(x=>x.reps).join('/')})}</div>`:'');
 if(!sess.length){$('#w').value=s.weight??'';sess=Array.from({length:s.sets},()=>({reps:s.reps}))}
 $('#sets').innerHTML=`<div class="setrow muted" style="margin:10px 0 0;font-size:12px"><div>${t('cSet')}</div><div></div><div class="ctr">${t('cR')}</div><div></div><div></div></div>`+sess.map((x,i)=>{const g=last&&last.sets[i]?`${t('lastT')} ${last.sets[i].reps}`:'';return`<div class="setrow${x.done?' done':''}"><button class="n${x.done?' on':''}" data-c="${i}" aria-pressed="${!!x.done}" aria-label="${t('setN',{n:i+1})} ✓">${x.done?'✓':i+1}</button><button class="sb" data-r="${i}" data-v="-1" aria-label="-">−</button><div class="rc"><input type="number" inputmode="numeric" value="${x.reps}" data-k="${i}" aria-label="${t('setN',{n:i+1})}"><span class="gh">${g}</span></div><button class="sb" data-r="${i}" data-v="1" aria-label="+">+</button><button class="x" data-d="${i}" aria-label="delete">✕</button></div>`}).join('');
 $$('#sets [data-c]').forEach(b=>b.onclick=()=>{const o=sess[b.dataset.c];o.done=!o.done;if(o.done)restAuto();renderLog()});
 $('#note').value=st.notes[n]||'';if(!$('#dt').value)$('#dt').value=today();
 $('#edBar').hidden=editIdx==null;if(editIdx!=null)$('#edTxt').textContent=t('editing',{d:st.log[editIdx].date});$('#save').textContent=t(editIdx==null?'save':'upd');
 $('#bk').hidden=!L.backupDue(st,today());shareBar();
 $$('#sets input').forEach(i=>i.oninput=()=>sess[i.dataset.k].reps=+i.value);$$('#sets [data-d]').forEach(b=>b.onclick=()=>{sess.splice(b.dataset.d,1);renderLog()});
 $$('#sets [data-r]').forEach(b=>b.onclick=()=>{const o=sess[b.dataset.r];o.reps=Math.max(0,(+o.reps||0)+ +b.dataset.v);renderLog()});
 const h=st.log.filter(x=>x.ex===n);$('#hist').innerHTML=h.length?`<table><tr><th>${t('hDate')}</th><th>${t('hW')}</th><th>${t('hR')}</th><th>e1RM</th><th></th></tr>${h.slice(-8).reverse().map(x=>{const j=st.log.indexOf(x);return`<tr><td>${x.date.slice(5)}${L.pr(st.log,x)?' 🏆':''}</td><td>${L.fmtW(x.weight,U())}</td><td>${x.sets.map(s=>s.reps).join('/')}</td><td>${Math.round(best(x)*10)/10}</td><td style="white-space:nowrap"><button class="ia" data-e="${j}" aria-label="${t('edit')}">✏</button><button class="ia" data-del="${j}" aria-label="${t('del')}">✕</button></td></tr>`}).join('')}</table>`:`<p class="empty">${sent(t('noHist2'))}</p>`;chart(h);
 $$('#hist [data-e]').forEach(b=>b.onclick=()=>{editIdx=+b.dataset.e;const x=st.log[editIdx];$('#w').value=L.fmtW(x.weight,U());$('#dt').value=x.date;sess=x.sets.map(s=>({reps:s.reps,done:true}));renderLog();scrollTo(0,0)});
 $$('#hist [data-del]').forEach(b=>b.onclick=()=>{if(!confirm(t('delQ')))return;st.log.splice(+b.dataset.del,1);editIdx=null;save();sess=[];renderLog()})}
function chart(h){const c=$('#chart'),g=c.getContext('2d');g.clearRect(0,0,600,300);g.fillStyle='#666';g.font='22px sans-serif';
 if(h.length<2){g.fillText(t('chart2'),90,150);return}
 const v=h.map(x=>Math.round(best(x)*10)/10),mn=Math.min(...v)*.95,mx=Math.max(...v)*1.05,X=i=>40+i*(540/(v.length-1)),Y=y=>270-(y-mn)/(mx-mn||1)*240;
 g.strokeStyle='#c6ff3d';g.lineWidth=4;g.beginPath();v.forEach((y,i)=>i?g.lineTo(X(i),Y(y)):g.moveTo(X(i),Y(y)));g.stroke();
 g.fillStyle='#c6ff3d';v.forEach((y,i)=>{g.beginPath();g.arc(X(i),Y(y),6,0,7);g.fill()});g.fillStyle='#aaa';g.fillText(W(v[v.length-1]),X(v.length-1)-100,Y(v[v.length-1])-14)}
const endEdit=()=>{editIdx=null;sess=[];$('#dt').value=today()};$('#edCancel').onclick=()=>{endEdit();renderLog()};
$('#exSel').onchange=()=>{endEdit();renderLog()};$('#note').oninput=()=>{const v=$('#note').value.trim();if(v)st.notes[$('#exSel').value]=v;else delete st.notes[$('#exSel').value];save()};
$('#allDone').onclick=()=>{const any=sess.some(s=>!s.done);sess.forEach(s=>s.done=any);renderLog()};
$('#same').onclick=()=>{const l=lastOf($('#exSel').value);if(!l)return toast(t('noHist'));$('#w').value=L.fmtW(l.weight,U());sess=l.sets.map(s=>({reps:s.reps}));renderLog()};$('#addSet').onclick=()=>{sess.push({reps:sess.length?sess[sess.length-1].reps:8});renderLog()};
$('#save').onclick=()=>{const w=+$('#w').value,sets=L.doneSets(sess);if(!w||!sets.length)return alert(t('needW'));
 const e={ex:$('#exSel').value,date:$('#dt').value||today(),weight:Math.round(L.toKg(w,U())*10000)/10000,sets};if(sess.length>sets.length)e.n=sess.length;const was=editIdx;
 if(was!=null)st.log[was]=e;else st.log.push(e);st.log=L.sortLog(st.log);save();
 if(was==null)shareFlash=1;if(was==null){const p=L.pr(st.log,e);if(p){toast(t('pr',{k:[p.weight&&t('prW'),p.e1rm&&t('prE')].filter(Boolean).join(' · ')}));navigator.vibrate?.(120)}}
 endEdit();if(was!=null){renderLog();return}
 const q=st.queue||[],i=q.indexOf($('#exSel').value);if(i>=0&&q[i+1])$('#exSel').value=q[i+1];renderLog()};
$('#restBtn').onclick=()=>{$('#rEx').value=$('#exSel').value;loadRest();show('t-rest');startT()};
// ---- 2 원판 (표시 단위로 계산)
const COL={25:'#e5484d',20:'#3e7bfa',15:'#f5c518',10:'#46a758',5:'#eee',2.5:'#e5484d',1.25:'#bbb'},COLB={45:'#3e7bfa',35:'#f5c518',25:'#46a758',10:'#eee',5:'#e5484d',2.5:'#bbb'};
const BARS={kg:[['std',20],['w',15],['b10',10],['ez',7],['cus',null]],lb:[['std',45],['w',35],['ez',25],['cus',null]]};
if(!$('#pb').value){$('#pb').value=U()==='lb'?45:20;$('#pt').value=U()==='lb'?135:60}
function renderPlate(){quick();const ps=plateSet(),ks=Object.keys(ps).map(Number).sort((a,b)=>b-a),bn=I18N[st.lang].bars,bars=BARS[U()];
 if(!bars.some(b=>b[0]===st.barSel))st.barSel='std';
 const cur=bars.find(b=>b[0]===st.barSel);if(cur[1]!=null)$('#pb').value=cur[1];$('#pbWrap').hidden=cur[1]!=null;
 $('#barChips').innerHTML=bars.map(([k,v])=>`<button class="chip ${k===st.barSel?'on':''}" data-k="${k}">${v==null?bn[k]:(bn[k]?bn[k]+' ':'')+v}</button>`).join('');
 $$('#barChips .chip').forEach(b=>b.onclick=()=>{st.barSel=b.dataset.k;save();renderPlate();if(st.barSel==='cus')$('#pb').focus()});
 $('#plChips').innerHTML=ks.map(k=>`<button class="chip ${ps[k]?'on':''}" data-p="${k}">${k} ${UL()}</button>`).join('');
 $$('#plChips .chip').forEach(b=>b.onclick=()=>{ps[b.dataset.p]=ps[b.dataset.p]?0:1;save();renderPlate()});
 const tg=+$('#pt').value,bar=+$('#pb').value||0,av=ks.filter(k=>ps[k]);
 if(!tg||!av.length){$('#pres').textContent=t('pickT');$('#barViz').innerHTML='';$('#wu').innerHTML=`<p class="muted">${t('wuEmpty')}</p>`;return}
 const r=L.plates(tg,bar,av),n=v=>Math.round(v*100)/100;
 const line=x=>x.side.length?t('fx',{t:W(x.total),b:n(bar),s:x.side.join(', ')}):t('fxBar',{t:W(x.total),b:n(bar)});
 let html='';
 if(r.below)html=`<div style="color:#ffb224">${t('below',{b:W(bar)})}</div><div class="fx">${line(r)}</div>`;
 else if(r.exact)html=`<div class="fx">${line(r)}</div><div>${t('exactOk')}</div>`;
 else html=`<div style="color:#ffb224">${t('notPos',{t:W(tg)})}</div><div class="chips" style="margin-top:8px">${r.lower?`<button class="chip" data-go="${r.lower.total}">${t('lowerB',{w:W(r.lower.total)})}</button>`:''}${r.higher?`<button class="chip" data-go="${r.higher.total}">${t('higherB',{w:W(r.higher.total)})}</button>`:''}</div><div class="fx muted" style="margin-top:8px">${line(r)}</div>`;
 $('#pres').innerHTML=html;$$('#pres [data-go]').forEach(b=>b.onclick=()=>{$('#pt').value=b.dataset.go;renderPlate()});
 const max=Math.max(...ks),pv=p=>`<div class="pl" style="background:${(U()==='lb'?COLB:COL)[p]||'#9b8afb'};height:${50+p/max*90}px;width:${p/max>=.4?22:14}px">${p}</div>`;
 $('#barViz').innerHTML=[...r.side].reverse().map(pv).join('')+'<div class="sleeve"></div><div class="shaft"></div><div class="sleeve"></div>'+r.side.map(pv).join('');renderWu(tg,bar,av)}
function renderWu(tg,bar,av){const w=L.warmup(tg,bar,U());$('#wu').innerHTML=w.length?w.map(x=>{const r=L.plates(x.w,bar,av);return`<div class="wu"><b>${W(r.total)} × ${x.reps}</b><span class="muted">${r.side.length?r.side.join(' + '):t('bar')}</span></div>`}).join('')+`<div class="wu"><b>${W(tg)}</b><span class="muted">→</span></div>`:`<p class="muted">${t('wuEmpty')}</p>`}
['#pt','#pb'].forEach(s=>$(s).oninput=renderPlate);
$('#addPl').onclick=()=>{const v=+$('#newPl').value;if(v>0){plateSet()[v]=1;save();$('#newPl').value='';renderPlate()}};
$$('[data-st]').forEach(b=>b.onclick=()=>{const i=$('#'+b.dataset.st),inc=U()==='lb'?5:2.5,v=Math.max(0,Math.round(((+i.value||0)+ +b.dataset.d*inc)*100)/100);i.value=v;i.dispatchEvent(new Event('input'))});
const QT={kg:[40,60,80,100,120,140],lb:[95,135,185,225,275,315]};
function quick(){$('#qChips').innerHTML=QT[U()].map(v=>`<button class="chip" data-q="${v}">${v}</button>`).join('');$$('#qChips [data-q]').forEach(b=>b.onclick=()=>{$('#pt').value=b.dataset.q;renderPlate()})}
// ---- 3 휴식
let end=0,tick=null,ac;
const fmt=s=>Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
function loadRest(){const n=$('#rEx').value;$('#rSec').value=st.rest[n]??L.restDefault(exDef(n).t);if(!end)$('#tm').textContent=fmt(+$('#rSec').value);$('#rFor').textContent=nm(n)}
$('#rEx').onchange=loadRest;$('#rSec').oninput=()=>{st.rest[$('#rEx').value]=+$('#rSec').value;save();if(!end)$('#tm').textContent=fmt(+$('#rSec').value)};
$$('#t-rest [data-s]').forEach(b=>b.onclick=()=>{$('#rSec').value=b.dataset.s;$('#rSec').oninput()});
function beep(){try{ac??=new AudioContext();[0,.35,.7].forEach(d=>{const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=880;o.connect(g);g.connect(ac.destination);g.gain.setValueAtTime(.4,ac.currentTime+d);o.start(ac.currentTime+d);o.stop(ac.currentTime+d+.25)})}catch(e){}}
let wl=null;const lockOn=async()=>{try{wl=await navigator.wakeLock?.request('screen')}catch(e){}},lockOff=()=>{try{wl?.release()}catch(e){}wl=null};
function restAuto(){$('#rEx').value=$('#exSel').value;loadRest();startT()}
function mini(left){const m=$('#mini');m.hidden=!end;if(end)m.textContent=`⏱ ${t('restLeft')} ${fmt(left)} · ${nm($('#rEx').value)}`}
function startT(){try{ac??=new AudioContext();ac.resume()}catch(e){}lockOn();end=Date.now()+(+$('#rSec').value)*1000;localStorage.setItem('gymEnd',end);$('#tm').classList.remove('done');clearInterval(tick);tick=setInterval(upd,250);upd()}
function upd(){if(!end){mini(0);return}const left=L.left(end,Date.now());$('#tm').textContent=fmt(left);mini(left);document.title=left?fmt(left)+' · 오늘 몇 kg':t('doneT');
 if(!left){clearInterval(tick);end=0;mini(0);lockOff();toast(t('done'));localStorage.removeItem('gymEnd');$('#tm').classList.add('done');$('#tm').textContent=t('done');navigator.vibrate?.([400,200,400,200,400]);beep();
  if(window.Notification&&Notification.permission==='granted'&&document.hidden)new Notification(t('notif'))}}
$('#tStart').onclick=()=>{if(window.Notification&&Notification.permission==='default')Notification.requestPermission();startT()};
const bump=d=>{if(end){end+=d*1000;localStorage.setItem('gymEnd',end);upd()}else{$('#rSec').value=Math.max(5,+$('#rSec').value+d);$('#rSec').oninput()}};$('#tPlus').onclick=()=>bump(15);$('#tMinus').onclick=()=>bump(-15);
$('#mini').onclick=()=>show('t-rest');
$('#tStop').onclick=()=>{clearInterval(tick);end=0;mini(0);lockOff();localStorage.removeItem('gymEnd');document.title='오늘 몇 kg';loadRest()};
document.addEventListener('visibilitychange',()=>{upd();if(end&&!document.hidden)lockOn()});
{const e=+localStorage.getItem('gymEnd');if(e>Date.now()){end=e;tick=setInterval(upd,250)}}
// ---- 4 루틴
let mins=st.mins||45,parts=st.parts||['가슴','전면 삼각근'],rt=null;
function chips(){$('#minChips').innerHTML=[30,45,60].map(m=>`<button class="chip ${m===mins?'on':''}" data-m="${m}">${t('min',{n:m})}</button>`).join('');
 $('#partChips').innerHTML=L.PARTS.map(p=>`<button class="chip ${parts.includes(p)?'on':''}" data-p="${p}">${nm(p)}</button>`).join('');
 $$('#minChips .chip').forEach(b=>b.onclick=()=>{mins=+b.dataset.m;chips()});
 $$('#partChips .chip').forEach(b=>b.onclick=()=>{const p=b.dataset.p;parts=parts.includes(p)?parts.filter(x=>x!==p):[...parts,p];chips()})}
const est=()=>Math.round(5+rt.reduce((a,i)=>a+i.sets*(45+i.rest),0)/60);
function renderRt(){if(!rt){$('#rtOut').innerHTML=`<p class="empty">${sent(t('rtEmpty2'))}</p>`;return}
 $('#rtOut').innerHTML=`<b>${t('est',{e:est()})}</b> <span class="muted">${t('estOf',{m:mins})}</span><div class="ri muted"><div>${t('cEx')}</div><div>${t('cS')}</div><div>${t('cR')}<button class="q" data-q="rr">?</button></div><div>${t('cRest')}</div><div></div></div>`+
 rt.map((i,k)=>`<div class="ri"><div>${nm(i.n)}</div><input type="number" value="${i.sets}" data-k="${k}" data-f="sets"><input value="${i.min}-${i.max}" data-k="${k}" data-f="rr"><input type="number" value="${i.rest}" data-k="${k}" data-f="rest"><button class="chip" data-x="${k}">✕</button></div>`).join('')+
 `<div class="row"><select id="addEx">${L.EX.filter(e=>parts.includes(e.p)).map(e=>`<option value="${e.n}">${nm(e.n)}</option>`).join('')}</select><button class="btn s" id="addRt" style="flex:0">${t('add')}</button></div><button class="btn p" id="go">${t('go')}</button>`;
 $$('#rtOut input').forEach(i=>i.onchange=()=>{const o=rt[i.dataset.k];if(i.dataset.f==='rr'){const[a,b]=i.value.split('-').map(Number);if(a&&b){o.min=a;o.max=b}}else o[i.dataset.f]=+i.value;renderRt()});
 $$('#rtOut [data-x]').forEach(b=>b.onclick=()=>{rt.splice(b.dataset.x,1);renderRt()});
 $('#addRt').onclick=()=>{const e=L.EX.find(x=>x.n===$('#addEx').value);rt.push({n:e.n,sets:3,min:e.min,max:e.max,rest:L.restDefault(e.t),lower:!!e.lower});renderRt()};
 $('#go').onclick=()=>{rt.forEach(i=>{st.custom=st.custom.filter(c=>c.n!==i.n);st.custom.push({n:i.n,sets:i.sets,min:i.min,max:i.max});st.rest[i.n]=i.rest});st.queue=rt.map(i=>i.n);save();$('#exSel').value=rt[0].n;sess=[];renderLog();show('t-log')}}
$('#gen').onclick=()=>{if(!parts.length)return alert(t('pickP'));st.mins=mins;st.parts=parts;save();rt=L.routine(mins,parts).items;renderRt()};
$('#exp').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(st,null,1)],{type:'application/json'}));a.download='gym-backup-'+today()+'.json';a.click();st.lastBackup=today();save();renderLog()};
$('#bkNow').onclick=()=>$('#exp').click();
$('#csv').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+L.toCSV(st.log,U(),nm)],{type:'text/csv'}));a.download='gym-'+today()+'.csv';a.click()};
$('#imp').onclick=()=>$('#impF').click();
$('#impF').onchange=async()=>{const f=$('#impF').files[0];if(!f)return;try{const r=L.importData(st,JSON.parse(await f.text()));Object.assign(st,r.state);save();sess=[];applyLang();toast(t('impOk',{n:r.added}))}catch(e){alert(t('impBad'))}$('#impF').value=''};
$('#wipe').onclick=()=>{if(confirm(t('wipeQ'))){localStorage.removeItem('gym');location.reload()}};
$('#gearBtn').onclick=e=>{e.stopPropagation();$('#gearMenu').hidden=!$('#gearMenu').hidden};
document.addEventListener('click',e=>{if(!$('#gearMenu').hidden&&!e.target.closest('#gearMenu'))$('#gearMenu').hidden=true});
applyLang();save();
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js');

// ---- v10 초보 안내: 용어 (?) · 추천 루틴 · 첫 실행 투어
document.addEventListener('click',ev=>{const b=ev.target.closest('.q');if(!b)return;ev.preventDefault();ev.stopPropagation();$('#tipTx').innerHTML=sent(t('q_'+b.dataset.q));$('#tip').hidden=false},true);
$('#tipX').onclick=()=>$('#tip').hidden=true;
var tplOn=null;
function renderTpl(){$('#tpl').innerHTML=L.TPL.map(x=>`<button class="tpl ${tplOn===x.id?'on':''}" data-tp="${x.id}"><b>${t('t_'+x.id)}</b><small>${sent(t('d_'+x.id))}</small></button>`).join('');
 $$('#tpl [data-tp]').forEach(b=>b.onclick=()=>{const x=L.tpl(b.dataset.tp);tplOn=x.id;mins=x.mins;parts=[...x.parts];rt=x.items;chips();renderRt();renderTpl();toast(t('tplOk',{n:t('t_'+x.id)}));$('#rtOut').scrollIntoView({behavior:'smooth',block:'start'})})}
var tStep=0;
function tourShow(){$('#tDots').innerHTML=[0,1,2].map(i=>`<i class="${i===tStep?'on':''}"></i>`).join('');$('#tT').textContent=t('tourT'+(tStep+1));$('#tB').innerHTML=sent(t('tourB'+(tStep+1)));$('#tNext').textContent=t(tStep<2?'tourNext':'tourDone');$('#tour').hidden=false}
function tourEnd(){$('#tour').hidden=true;st.tourDone=1;save()}
$('#tNext').onclick=()=>{if(tStep<2){tStep++;tourShow()}else tourEnd()};$('#tSkip').onclick=tourEnd;
$('#tourAgain').onclick=()=>{$('#gearMenu').hidden=true;tStep=0;tourShow()};
renderTpl();if(!st.tourDone&&!st.log.length){tStep=0;tourShow()}

// ===== 방문자 카운터 (v12) =====
// 공개 표시 스위치: true로 바꾸면 모든 사용자에게 보임. 카운트는 항상 함.
const SHOW_VISITORS=false;
(function visitors(){try{
 const API='https://abacus.jasoncameron.dev',NS='oneulkg-gym';
 const q=new URLSearchParams(location.search);if(q.has('stats')){q.get('stats')==='off'?localStorage.removeItem('gymStats'):localStorage.setItem('gymStats','1')}
 const show=SHOW_VISITORS||localStorage.getItem('gymStats')==='1';
 const day=new Date(Date.now()+9*3600e3).toISOString().slice(0,10).replace(/-/g,'');
 const first=localStorage.getItem('gymVisit')!==day;if(!first&&!show)return;
  const call=k=>fetch(`${API}/${first?'hit':'get'}/${NS}/${k}`,{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject()).then(j=>j.value??0).catch(()=>first?Promise.reject():0);
 Promise.all([call('day-'+day),call('total')]).then(([d,tt])=>{
  if(first)localStorage.setItem('gymVisit',day);
  if(!show||(!d&&!tt))return;const el=document.getElementById('vis');if(!el)return;
  const f=n=>Number(n).toLocaleString();el.innerHTML=sent(t('vis',{d:f(d),t:f(tt)}));el.hidden=false;
 }).catch(()=>{});
}catch(e){}})();

// ===== v13 결과 공유 =====
var shareFlash=0;
function shareDate(){return st.log.some(x=>x.date===today())?today():(st.log.length?st.log[st.log.length-1].date:null)}
function shareSum(){const d=shareDate();return d?L.shareSummary(st.log,d):null}
function shareTxt(){const s=shareSum();return s?L.shareText(s,{u:U(),lang:st.lang,name:nm}):''}
function shareBar(){const b=$('#shareBar');if(!b)return;const s=shareSum();b.hidden=!s;if(!s)return;
 $('#shareLbl').innerHTML=sent(t(s.date===today()?'shToday':'shLast',{d:s.date.slice(5).replace('-','/'),n:s.items.length}));
 if(shareFlash){shareFlash=0;b.classList.remove('flash');void b.offsetWidth;b.classList.add('flash')}}
async function copyTxt(x){try{await navigator.clipboard.writeText(x);return true}catch(e){const a=document.createElement('textarea');a.value=x;document.body.appendChild(a);a.select();let ok=false;try{ok=document.execCommand('copy')}catch(_){}a.remove();return ok}}
const FONT='-apple-system,"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",sans-serif';
// 캔버스 줄바꿈: 공백 단위(keep-all), 너무 긴 단어만 글자 단위
function wrapC(g,txt,max){const out=[];let line='';for(const w of String(txt).split(' ')){const tryL=line?line+' '+w:w;if(g.measureText(tryL).width<=max){line=tryL;continue}if(line)out.push(line);line=w;while(g.measureText(line).width>max){let k=line.length;while(k>1&&g.measureText(line.slice(0,k)).width>max)k--;out.push(line.slice(0,k));line=line.slice(k)}}if(line)out.push(line);return out}
function storyCanvas(){const s=shareSum(),c=document.createElement('canvas');c.width=1080;c.height=1920;const g=c.getContext('2d'),u=U(),UL2=u==='lb'?'lb':'kg',S=L.SH[st.lang]||L.SH.ko;
 const bg=g.createLinearGradient(0,0,0,1920);bg.addColorStop(0,'#16180f');bg.addColorStop(1,'#0d0d0f');g.fillStyle=bg;g.fillRect(0,0,1080,1920);
 g.fillStyle='#c6ff3d';g.fillRect(0,0,1080,14);
 g.textBaseline='alphabetic';g.fillStyle='#fff';g.font=`800 76px ${FONT}`;g.fillText('오늘 ',90,220);const w0=g.measureText('오늘 ').width;g.fillStyle='#c6ff3d';g.fillText('몇 kg',90+w0,220);
 g.fillStyle='#999';g.font=`500 40px ${FONT}`;const dd=new Date(s.date+'T00:00');g.fillText(dd.toLocaleDateString(st.lang==='en'?'en-US':'ko-KR',{year:'numeric',month:'long',day:'numeric',weekday:'short'}),90,290);
 let y=420;const it=s.items.slice(0,4),big=it.length===1;
 for(const i of it){g.fillStyle='#18181c';const h=big?520:275;g.beginPath();g.roundRect(70,y-70,940,h,36);g.fill();g.strokeStyle=i.pr?'#c6ff3d':'#2a2a30';g.lineWidth=i.pr?5:2;g.stroke();
  g.fillStyle='#eee';g.font=`700 ${big?58:46}px ${FONT}`;g.fillText(nm(i.ex)+(i.pr?'  🏆':''),110,y);
  g.fillStyle='#c6ff3d';g.font=`900 ${big?120:76}px ${FONT}`;const ln=wrapC(g,L.setStr(i.weight,i.reps,u),860);ln.forEach((l,k)=>g.fillText(l,110,y+(big?150:95)+k*(big?125:80)));const yy=y+(big?150:95)+(ln.length-1)*(big?125:80);
  g.font=`400 ${big?64:44}px ${FONT}`;g.fillText(L.checks(i.done,i.total),110,yy+(big?110:70));
  if(big){g.fillStyle='#bbb';g.font=`600 46px ${FONT}`;const dt=i.diff==null?'':(()=>{const d=Math.round(L.toU(i.diff,u)*10)/10;return d?`${S.since} ${d>0?'+':''}${d}${UL2}`:S.same})();if(dt)g.fillText(dt,110,yy+200)}
  y+=h+40}
 if(s.items.length>4){g.fillStyle='#999';g.font=`600 40px ${FONT}`;g.fillText(S.more.replace('{n}',s.items.length-4),110,y-10);y+=40}
 y=Math.max(y+30,1380);const stat=(lab,val,x)=>{g.fillStyle='#999';g.font=`600 38px ${FONT}`;g.fillText(lab,x,y);g.fillStyle='#fff';g.font=`800 64px ${FONT}`;g.fillText(val,x,y+80)};
 stat(s.items.length>1?S.tvol:S.vol,L.num(L.toU(s.vol,u))+UL2,110);stat(st.lang==='en'?'days trained':'운동한 날',S.days.replace('{n}',s.days),600);
 if(s.pr){g.fillStyle='#c6ff3d';g.beginPath();g.roundRect(90,1580,900,90,45);g.fill();g.fillStyle='#111';g.font=`800 44px ${FONT}`;g.textAlign='center';g.fillText(st.lang==='en'?'🏆 New PR today':'🏆 오늘 신기록!',540,1640);g.textAlign='left'}
 g.fillStyle='#c6ff3d';g.fillRect(0,1906,1080,14);g.textAlign='center';g.fillStyle='#eee';g.font=`700 48px ${FONT}`;g.fillText(L.SHARE_URL,540,1800);g.textAlign='left';
 return c}
const blobOf=c=>new Promise(r=>c.toBlob(r,'image/png'));
function openShare(){const x=shareTxt();if(!x)return;$('#shTxt').textContent=x;const c=storyCanvas();$('#shImg').src=c.toDataURL('image/png');$('#shSheet').hidden=false}
$('#shareBtn').onclick=openShare;$('#shX').onclick=()=>$('#shSheet').hidden=true;
$('#shSheet').onclick=e=>{if(e.target.id==='shSheet')$('#shSheet').hidden=true};
$('#shCopy').onclick=async()=>{toast(t(await copyTxt(shareTxt())?'shCopied':'shCopyFail'))};
$('#shImgBtn').onclick=async()=>{const b=await blobOf(storyCanvas()),f=new File([b],`oneulkg-${shareDate()}.png`,{type:'image/png'}),x=shareTxt();
 try{if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],text:x});return}}catch(e){if(e&&e.name==='AbortError')return}
 const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=f.name;document.body.appendChild(a);a.click();a.remove();await copyTxt(x);toast(t('shSaved'))};
shareBar();
