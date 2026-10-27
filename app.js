const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const st=JSON.parse(localStorage.getItem('gym')||'{}');st.log??=[];st.plates??={25:1,20:1,15:1,10:1,5:1,2.5:1,1.25:1};st.rest??={};st.custom??=[];
const save=()=>localStorage.setItem('gym',JSON.stringify(st));
$('#today').textContent=new Date().toLocaleDateString('ko-KR',{month:'long',day:'numeric',weekday:'short'});
$$('nav button').forEach(b=>b.onclick=()=>show(b.dataset.t));
function show(t){$$('nav button').forEach(x=>x.classList.toggle('on',x.dataset.t===t));$$('section').forEach(s=>s.classList.toggle('on',s.id===t));scrollTo(0,0)}
const exDef=n=>{const e=L.EX.find(x=>x.n===n)||{n,min:8,max:12,t:'compound'};const c=st.custom.find(x=>x.n===n);return{...e,sets:3,...(c||{})}};
// ---- 1 기록
let sess=[];
function fillEx(sel,v){sel.innerHTML=L.EX.map(e=>`<option ${e.n===v?'selected':''}>${e.n}</option>`).join('')}
fillEx($('#exSel'));fillEx($('#rEx'));
const lastOf=n=>st.log.filter(x=>x.ex===n).slice(-1)[0];
function renderLog(){const n=$('#exSel').value,ex=exDef(n),last=lastOf(n),s=L.suggest(ex,last);
 $('#sug').innerHTML=`<div class="muted">오늘 목표 (${ex.min}~${ex.max}회 범위)</div><div class="big">${s.weight==null?'—':s.weight+'kg'} × ${s.reps}회 × ${s.sets}세트</div><div class="muted">${s.why}</div>`+(last?`<div class="muted">지난번 ${last.date}: ${last.weight}kg · ${last.sets.map(x=>x.reps).join('/')}회</div>`:'');
 if(!sess.length){$('#w').value=s.weight??'';sess=Array.from({length:s.sets},()=>({reps:s.reps}))}
 $('#sets').innerHTML=sess.map((x,i)=>`<div class="setrow"><b>${i+1}세트</b><input type="number" inputmode="numeric" value="${x.reps}" data-i="${i}"><span class="muted">회</span><button class="chip" data-d="${i}">✕</button></div>`).join('');
 $$('#sets input').forEach(i=>i.oninput=()=>sess[i.dataset.i].reps=+i.value);$$('#sets [data-d]').forEach(b=>b.onclick=()=>{sess.splice(b.dataset.d,1);renderLog()});
 const h=st.log.filter(x=>x.ex===n);$('#hist').innerHTML=h.length?`<table><tr><th>날짜</th><th>무게</th><th>횟수</th><th>e1RM</th></tr>${h.slice(-8).reverse().map(x=>`<tr><td>${x.date}</td><td>${x.weight}</td><td>${x.sets.map(s=>s.reps).join('/')}</td><td>${best(x)}</td></tr>`).join('')}</table>`:'<p class="muted">아직 기록이 없어요.</p>';chart(h)}
const best=x=>Math.max(...x.sets.map(s=>L.e1rm(x.weight,s.reps)));
function chart(h){const c=$('#chart'),g=c.getContext('2d');g.clearRect(0,0,600,300);g.fillStyle='#666';g.font='22px sans-serif';
 if(h.length<2){g.fillText('기록 2개 이상이면 그래프가 나와요',90,150);return}
 const v=h.map(best),mn=Math.min(...v)*.95,mx=Math.max(...v)*1.05,X=i=>40+i*(540/(v.length-1)),Y=y=>270-(y-mn)/(mx-mn||1)*240;
 g.strokeStyle='#c6ff3d';g.lineWidth=4;g.beginPath();v.forEach((y,i)=>i?g.lineTo(X(i),Y(y)):g.moveTo(X(i),Y(y)));g.stroke();
 g.fillStyle='#c6ff3d';v.forEach((y,i)=>{g.beginPath();g.arc(X(i),Y(y),6,0,7);g.fill()});g.fillStyle='#aaa';g.fillText(v[v.length-1]+'kg',X(v.length-1)-80,Y(v[v.length-1])-14)}
$('#exSel').onchange=()=>{sess=[];renderLog()};$('#addSet').onclick=()=>{sess.push({reps:sess.length?sess[sess.length-1].reps:8});renderLog()};
$('#save').onclick=()=>{const w=+$('#w').value;if(!w||!sess.length)return alert('무게와 세트를 입력하세요');st.log.push({ex:$('#exSel').value,date:new Date().toISOString().slice(0,10),weight:w,sets:sess.map(s=>({reps:+s.reps}))});save();sess=[];renderLog();
 const q=st.queue||[];if(q.length){const i=q.indexOf($('#exSel').value);if(i>=0&&q[i+1]){$('#exSel').value=q[i+1];sess=[];renderLog()}}};
$('#restBtn').onclick=()=>{$('#rEx').value=$('#exSel').value;loadRest();show('t-rest');startT()};
// ---- 2 원판
const COL={25:'#e5484d',20:'#3e7bfa',15:'#f5c518',10:'#46a758',5:'#eee',2.5:'#e5484d',1.25:'#bbb'};
const BARS=[['올림픽 20',20],['여성 15',15],['10',10],['EZ바 7',7],['스미스 직접',null]];
$('#barChips').innerHTML=BARS.map(([n,v])=>`<button class="chip" data-b="${v??''}">${n}</button>`).join('');
$$('#barChips .chip').forEach(b=>b.onclick=()=>{if(b.dataset.b)$('#pb').value=b.dataset.b;else $('#pb').focus();plate()});
function plate(){const ks=Object.keys(st.plates).map(Number).sort((a,b)=>b-a);
 $('#plChips').innerHTML=ks.map(k=>`<button class="chip ${st.plates[k]?'on':''}" data-p="${k}">${k}kg</button>`).join('');
 $$('#plChips .chip').forEach(b=>b.onclick=()=>{st.plates[b.dataset.p]=st.plates[b.dataset.p]?0:1;save();plate()});
 $$('#barChips .chip').forEach(b=>b.classList.toggle('on',b.dataset.b===$('#pb').value));
 const t=+$('#pt').value,bar=+$('#pb').value,col=+$('#pc').value||0,av=ks.filter(k=>st.plates[k]);
 if(!t||!av.length){$('#pres').textContent='목표 무게와 원판을 선택하세요';$('#barViz').innerHTML='';return}
 const r=L.plates(t,bar,av,col);
 $('#pres').innerHTML=`<div class="muted">한쪽에</div><div class="big">${r.side.length?r.side.join(' + ')+' kg':'원판 없음'}</div>`+(r.exact?`<div>✅ 정확히 ${r.total}kg</div>`:`<div style="color:#ffb224">⚠ ${t}kg은 불가능 → 가장 가까운 무게 <b>${r.total}kg</b></div>`)+`<div class="muted">바 ${bar}kg${col?` + 칼라 ${col}×2`:''}</div>`;
 const pv=p=>`<div class="pl" style="background:${COL[p]||'#9b8afb'};height:${50+p*3.6}px;width:${p>=10?22:14}px">${p}</div>`;
 $('#barViz').innerHTML=[...r.side].reverse().map(pv).join('')+'<div class="sleeve"></div><div class="shaft"></div><div class="sleeve"></div>'+r.side.map(pv).join('')}
['#pt','#pb','#pc'].forEach(s=>$(s).oninput=plate);
$('#addPl').onclick=()=>{const v=+$('#newPl').value;if(v>0){st.plates[v]=1;save();$('#newPl').value='';plate()}};
// ---- 3 휴식
let end=0,tick=null,ac;
const fmt=s=>Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
function loadRest(){const n=$('#rEx').value;$('#rSec').value=st.rest[n]??L.restDefault(exDef(n).t);if(!end)$('#tm').textContent=fmt(+$('#rSec').value)}
$('#rEx').onchange=loadRest;$('#rSec').oninput=()=>{st.rest[$('#rEx').value]=+$('#rSec').value;save();if(!end)$('#tm').textContent=fmt(+$('#rSec').value)};
$$('#t-rest [data-s]').forEach(b=>b.onclick=()=>{$('#rSec').value=b.dataset.s;$('#rSec').oninput()});
function beep(){try{ac??=new AudioContext();[0,.35,.7].forEach(d=>{const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=880;o.connect(g);g.connect(ac.destination);g.gain.setValueAtTime(.4,ac.currentTime+d);o.start(ac.currentTime+d);o.stop(ac.currentTime+d+.25)})}catch(e){}}
function startT(){try{ac??=new AudioContext();ac.resume()}catch(e){}end=Date.now()+(+$('#rSec').value)*1000;localStorage.setItem('gymEnd',end);$('#tm').classList.remove('done');clearInterval(tick);tick=setInterval(upd,250);upd()}
function upd(){if(!end)return;const left=Math.max(0,Math.ceil((end-Date.now())/1000));$('#tm').textContent=fmt(left);document.title=left?fmt(left)+' · 오늘 몇 kg':'⏰ 휴식 끝!';
 if(!left){clearInterval(tick);end=0;localStorage.removeItem('gymEnd');$('#tm').classList.add('done');$('#tm').textContent='끝!';navigator.vibrate?.([400,200,400,200,400]);beep();
  if(Notification?.permission==='granted'&&document.hidden)new Notification('휴식 끝! 다음 세트 가요 💪')}}
$('#tStart').onclick=()=>{if(window.Notification&&Notification.permission==='default')Notification.requestPermission();startT()};
$('#tStop').onclick=()=>{clearInterval(tick);end=0;localStorage.removeItem('gymEnd');document.title='오늘 몇 kg';loadRest()};
document.addEventListener('visibilitychange',upd);
{const e=+localStorage.getItem('gymEnd');if(e>Date.now()){end=e;tick=setInterval(upd,250)}}
// ---- 4 루틴
let mins=st.mins||45,parts=st.parts||['가슴','전면 삼각근'],rt=null;
function chips(){$('#minChips').innerHTML=[30,45,60].map(m=>`<button class="chip ${m===mins?'on':''}" data-m="${m}">${m}분</button>`).join('');
 $('#partChips').innerHTML=L.PARTS.map(p=>`<button class="chip ${parts.includes(p)?'on':''}" data-p="${p}">${p}</button>`).join('');
 $$('#minChips .chip').forEach(b=>b.onclick=()=>{mins=+b.dataset.m;chips()});
 $$('#partChips .chip').forEach(b=>b.onclick=()=>{const p=b.dataset.p;parts=parts.includes(p)?parts.filter(x=>x!==p):[...parts,p];chips()})}
const est=()=>Math.round(5+rt.reduce((a,i)=>a+i.sets*(45+i.rest),0)/60);
function renderRt(){if(!rt){$('#rtOut').innerHTML='<p class="muted">시간과 부위를 고르고 루틴을 만들어 보세요.</p>';return}
 $('#rtOut').innerHTML=`<b>예상 ${est()}분</b> <span class="muted">/ ${mins}분 (워밍업 5분 포함)</span><div class="ri muted"><div>운동</div><div>세트</div><div>횟수</div><div>휴식</div><div></div></div>`+
 rt.map((i,k)=>`<div class="ri"><div>${i.n}</div><input type="number" value="${i.sets}" data-k="${k}" data-f="sets"><input value="${i.min}-${i.max}" data-k="${k}" data-f="rr"><input type="number" value="${i.rest}" data-k="${k}" data-f="rest"><button class="chip" data-x="${k}">✕</button></div>`).join('')+
 `<div class="row"><select id="addEx">${L.EX.filter(e=>parts.includes(e.p)).map(e=>`<option>${e.n}</option>`).join('')}</select><button class="btn s" id="addRt" style="flex:0">추가</button></div><button class="btn p" id="go">이 루틴으로 운동 시작 ▶</button>`;
 $$('#rtOut input').forEach(i=>i.onchange=()=>{const o=rt[i.dataset.k];if(i.dataset.f==='rr'){const[a,b]=i.value.split('-').map(Number);if(a&&b){o.min=a;o.max=b}}else o[i.dataset.f]=+i.value;renderRt()});
 $$('#rtOut [data-x]').forEach(b=>b.onclick=()=>{rt.splice(b.dataset.x,1);renderRt()});
 $('#addRt').onclick=()=>{const e=L.EX.find(x=>x.n===$('#addEx').value);rt.push({n:e.n,sets:3,min:e.min,max:e.max,rest:L.restDefault(e.t),lower:!!e.lower});renderRt()};
 $('#go').onclick=()=>{rt.forEach(i=>{st.custom=st.custom.filter(c=>c.n!==i.n);st.custom.push({n:i.n,sets:i.sets,min:i.min,max:i.max});st.rest[i.n]=i.rest});st.queue=rt.map(i=>i.n);save();$('#exSel').value=rt[0].n;sess=[];renderLog();show('t-log')}}
$('#gen').onclick=()=>{if(!parts.length)return alert('부위를 골라 주세요');st.mins=mins;st.parts=parts;save();rt=L.routine(mins,parts).items;renderRt()};
// ---- PRO/데이터
$('#exp').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(st,null,1)],{type:'application/json'}));a.download='gym-backup.json';a.click()};
$('#wipe').onclick=()=>{if(confirm('모든 기록을 삭제할까요?')){localStorage.removeItem('gym');location.reload()}};
chips();renderRt();renderLog();plate();loadRest();
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js');
