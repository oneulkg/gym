// 순수 계산 로직 (테스트 가능)
const L={};
L.e1rm=(w,r)=>r<=0?0:(r===1?w:Math.round(w*(1+r/30)*10)/10);
// 이중 점진 과부하: 모든 세트가 상단 횟수 달성 -> 무게 증가(상체 2.5, 하체 5), 아니면 횟수 +1
L.KG=0.45359237;
L.toU=(kg,u)=>u==='lb'?kg/L.KG:kg; L.toKg=(v,u)=>u==='lb'?v*L.KG:v;
L.rnd=(x,step)=>Math.round(x/step)*step;
L.fmtW=(kg,u)=>{const v=L.toU(kg,u);return String(Math.round(v*10)/10)};
// 이중 점진 과부하. last.weight는 kg 저장, 결과 weight는 표시 단위(u)
// 상체 +2.5kg / 하체 +5kg (lb: +5 / +10)
L.suggest=(ex,last,u='kg')=>{
  if(!last)return{weight:null,reps:ex.min,sets:ex.sets,code:'first'};
  const lb=u==='lb',inc=lb?(ex.lower?10:5):(ex.lower?5:2.5),step=lb?2.5:1.25;
  const w=L.rnd(L.toU(last.weight,u),lb?0.5:0.25);
  if(last.sets.every(s=>s.reps>=ex.max))return{weight:L.rnd(w+inc,step),reps:ex.min,sets:ex.sets,code:'up',inc};
  const minR=Math.min(...last.sets.map(s=>s.reps));
  if(minR<ex.min-2)return{weight:Math.max(0,L.rnd(w*0.9,lb?5:2.5)),reps:ex.min,sets:ex.sets,code:'down'};
  return{weight:w,reps:Math.min(ex.max,minR+1),sets:ex.sets,code:'reps',minR};
};
// 원판: 한쪽 무게 기준 탐욕 + 개수 제한, 정확하지 않으면 가장 가까운 값
// 원판: 한쪽 조합. 정확하면 exact, 아니면 가장 가까운 아래(lower)/위(higher) 무게
L.plates=(target,bar,plates,pairs=null)=>{
  const ps=[...plates].filter(p=>p>0).sort((a,b)=>b-a),U=100,R=x=>Math.round(x*100)/100;
  if(target<=bar+1e-9)return{total:bar,side:[],exact:Math.abs(target-bar)<1e-9,below:target<bar-1e-9,lower:null,higher:{total:bar,side:[]}};
  const per=(target-bar)/2;
  {let rem=per,g=[],c={};for(const p of ps){const n=pairs&&pairs[p]!=null?pairs[p]:99;while(rem>=p-1e-9&&(c[p]||0)<n){rem-=p;g.push(p);c[p]=(c[p]||0)+1}}if(Math.abs(rem)<1e-9)return{total:R(target),side:g,exact:true,below:false,lower:null,higher:null}}
  const t=Math.round(per*U),cap=t+Math.round((ps[0]||0)*U);
  // dp[s] = 무게 s를 만드는 원판 목록 (큰 원판 우선, 최소 개수)
  const dp=new Array(cap+1).fill(null);dp[0]=[];
  for(const p of ps){const v=Math.round(p*U),n=pairs&&pairs[p]!=null?pairs[p]:99;
    for(let k=0;k<n;k++){let ch=false;for(let x=cap;x>=v;x--){const prev=dp[x-v];if(prev&&prev.filter(y=>y===p).length===k&&(!dp[x]||dp[x].length>prev.length+1)){dp[x]=[...prev,p];ch=true}}if(!ch)break}}
  const mk=x=>({total:R(bar+2*x/U),side:[...dp[x]].sort((a,b)=>b-a)});
  if(dp[t])return{...mk(t),exact:true,below:false,lower:null,higher:null};
  let lo=t;while(lo>0&&!dp[lo])lo--;let hi=t;while(hi<=cap&&!dp[hi])hi++;
  const lower=mk(lo),higher=hi<=cap?mk(hi):null;
  const pick=!higher||(t-lo)<=(hi-t)?lower:higher;
  return{...pick,exact:false,below:false,lower,higher};
};
L.restDefault=t=>t==='compound'?150:t==='iso'?75:90;
L.EN={'벤치프레스':'Bench Press','인클라인 덤벨프레스':'Incline DB Press','체스트 프레스 머신':'Chest Press Machine','케이블 플라이':'Cable Fly','딥스':'Dips','오버헤드 프레스':'Overhead Press','덤벨 숄더프레스':'DB Shoulder Press','프론트 레이즈':'Front Raise','사이드 레터럴 레이즈':'Lateral Raise','리어 델트 플라이':'Rear Delt Fly','랫풀다운':'Lat Pulldown','바벨 로우':'Barbell Row','시티드 케이블 로우':'Seated Cable Row','풀업':'Pull-up','스쿼트':'Squat','레그프레스':'Leg Press','루마니안 데드리프트':'Romanian Deadlift','레그 익스텐션':'Leg Extension','레그 컬':'Leg Curl','바벨 컬':'Barbell Curl','트라이셉스 푸시다운':'Triceps Pushdown','해머 컬':'Hammer Curl','크런치':'Crunch','행잉 레그레이즈':'Hanging Leg Raise','가슴':'Chest','전면 삼각근':'Front Delts','측면 삼각근':'Side Delts','후면 삼각근':'Rear Delts','등':'Back','하체':'Legs','팔':'Arms','복근':'Abs'};
L.EX=[
 {n:'벤치프레스',p:'가슴',t:'compound',min:6,max:10},{n:'인클라인 덤벨프레스',p:'가슴',t:'compound',min:8,max:12},{n:'체스트 프레스 머신',p:'가슴',t:'compound',min:8,max:12},{n:'케이블 플라이',p:'가슴',t:'iso',min:10,max:15},{n:'딥스',p:'가슴',t:'compound',min:6,max:12},
 {n:'오버헤드 프레스',p:'전면 삼각근',t:'compound',min:6,max:10},{n:'덤벨 숄더프레스',p:'전면 삼각근',t:'compound',min:8,max:12},{n:'프론트 레이즈',p:'전면 삼각근',t:'iso',min:10,max:15},
 {n:'사이드 레터럴 레이즈',p:'측면 삼각근',t:'iso',min:12,max:20},{n:'리어 델트 플라이',p:'후면 삼각근',t:'iso',min:12,max:20},
 {n:'랫풀다운',p:'등',t:'compound',min:8,max:12},{n:'바벨 로우',p:'등',t:'compound',min:6,max:10},{n:'시티드 케이블 로우',p:'등',t:'compound',min:8,max:12},{n:'풀업',p:'등',t:'compound',min:5,max:10},
 {n:'스쿼트',p:'하체',t:'compound',min:5,max:8,lower:1},{n:'레그프레스',p:'하체',t:'compound',min:8,max:12,lower:1},{n:'루마니안 데드리프트',p:'하체',t:'compound',min:6,max:10,lower:1},{n:'레그 익스텐션',p:'하체',t:'iso',min:10,max:15,lower:1},{n:'레그 컬',p:'하체',t:'iso',min:10,max:15,lower:1},
 {n:'바벨 컬',p:'팔',t:'iso',min:8,max:12},{n:'트라이셉스 푸시다운',p:'팔',t:'iso',min:10,max:15},{n:'해머 컬',p:'팔',t:'iso',min:10,max:15},
 {n:'크런치',p:'복근',t:'iso',min:12,max:20},{n:'행잉 레그레이즈',p:'복근',t:'iso',min:8,max:15}];
L.PARTS=['가슴','전면 삼각근','측면 삼각근','후면 삼각근','등','하체','팔','복근'];
// 루틴: 세트당 시간 = 수행 45초 + 휴식, 워밍업 5분
L.routine=(min,parts)=>{
  const pool=L.EX.filter(e=>parts.includes(e.p)).sort((a,b)=>(a.t==='compound'?0:1)-(b.t==='compound'?0:1));
  const budget=(min-5)*60,out=[];let used=0;const per={};
  const order=[];parts.forEach(p=>pool.filter(e=>e.p===p).forEach((e,i)=>order.push([i,e])));order.sort((a,b)=>a[0]-b[0]);
  for(const [,e] of order){const sets=e.t==='compound'?(min>=60?4:3):3;const rest=L.restDefault(e.t);const c=sets*(45+rest);
    if(used+c<=budget){out.push({n:e.n,sets,min:e.min,max:e.max,rest,lower:!!e.lower});used+=c}}
  return{items:out,est:Math.round((used/60)+5)};
};

// ---- v9
// 저장할 세트: 체크된 세트가 있으면 그것만, 하나도 없으면 전부(기존 동작 유지)
L.doneSets=sess=>{const d=sess.filter(s=>s.done);return(d.length?d:sess).map(s=>({reps:+s.reps||0})).filter(s=>s.reps>0)};
// PR: 같은 종목 이전 기록 대비 최고 무게 또는 최고 e1RM 갱신 (kg 기준)
L.bestE=x=>Math.max(0,...x.sets.map(s=>L.e1rm(x.weight,s.reps)));
L.pr=(log,entry)=>{const prev=log.filter(x=>x!==entry&&x.ex===entry.ex&&(x.date<entry.date||(x.date===entry.date&&log.indexOf(x)<log.indexOf(entry))));
  if(!prev.length)return null;const mw=Math.max(...prev.map(x=>x.weight)),me=Math.max(...prev.map(L.bestE));
  const w=entry.weight>mw+1e-9,e=L.bestE(entry)>me+1e-9;return w||e?{weight:w,e1rm:e}:null};
// 날짜순 정렬(안정)
L.sortLog=log=>log.map((x,i)=>[x,i]).sort((a,b)=>a[0].date<b[0].date?-1:a[0].date>b[0].date?1:a[1]-b[1]).map(a=>a[0]);
// 백업 가져오기: 형식 검증 + 기존 기록과 병합(중복 제거). 실패 시 throw
L.validEntry=x=>x&&typeof x.ex==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x.date||'')&&+x.weight>=0&&Array.isArray(x.sets)&&x.sets.every(s=>s&&isFinite(+s.reps));
L.importData=(cur,inc)=>{if(!inc||typeof inc!=='object'||!Array.isArray(inc.log))throw new Error('format');
  const key=x=>[x.ex,x.date,x.weight,x.sets.map(s=>s.reps).join('/')].join('|'),seen=new Set(cur.log.map(key)),out={...cur,log:[...cur.log]};let added=0;
  for(const x of inc.log){if(!L.validEntry(x))continue;const e={ex:x.ex,date:x.date,weight:+x.weight,sets:x.sets.map(s=>({reps:+s.reps}))};if(x.t)e.t=x.t;if(!seen.has(key(e))){seen.add(key(e));out.log.push(e);added++}}
  out.log=L.sortLog(out.log);
  for(const k of ['rest','notes'])if(inc[k]&&typeof inc[k]==='object')out[k]={...inc[k],...(cur[k]||{})};
  if(Array.isArray(inc.custom))for(const c of inc.custom)if(c&&c.n&&!(out.custom||[]).some(y=>y.n===c.n))out.custom=[...(out.custom||[]),c];
  return{state:out,added}};
// CSV (엑셀용): 날짜,운동,무게(단위),세트,횟수
L.toCSV=(log,u='kg',name=n=>n)=>{const q=v=>/[",\n]/.test(v)?'"'+String(v).replace(/"/g,'""')+'"':v;
  const rows=[['date','exercise','weight_'+u,'set','reps']];log.forEach(x=>x.sets.forEach((s,i)=>rows.push([x.date,q(name(x.ex)),L.fmtW(x.weight,u),i+1,s.reps])));return rows.map(r=>r.join(',')).join('\n')};
L.backupDue=(st,today)=>{if(!st.log||st.log.length<3)return false;if(!st.lastBackup)return true;return(new Date(today)-new Date(st.lastBackup))/864e5>=14};
// 워밍업: 목표의 40/60/80% (원판 단위로 반올림, 바 이상), 횟수 8/5/3. 목표가 바의 2배 미만이면 짧게
L.warmup=(target,bar,u='kg')=>{const step=u==='lb'?5:2.5;if(!(target>bar))return[];const out=[{w:bar,reps:10}];
  for(const [p,r] of [[.4,8],[.6,5],[.8,3]]){const w=Math.max(bar,L.rnd(target*p,step));if(w>out[out.length-1].w&&w<target)out.push({w,reps:r})}return out};
// 남은 휴식 초 (종료 시각 기준 → 화면이 잠겨도 정확)
L.left=(end,now)=>Math.max(0,Math.ceil((end-now)/1000));
if(typeof module!=='undefined')module.exports=L;

// ---- v10 초보 템플릿 (부위+시간 → 기존 L.routine 재사용)
L.TPL=[{id:'full3',mins:45,parts:['하체','가슴','등']},{id:'upper',mins:50,parts:['가슴','등','측면 삼각근','팔']},{id:'lower',mins:45,parts:['하체','복근']},
 {id:'push',mins:45,parts:['가슴','전면 삼각근','측면 삼각근','팔']},{id:'pull',mins:45,parts:['등','후면 삼각근','팔']}];
L.tpl=id=>{const x=L.TPL.find(t=>t.id===id);return x?{...x,items:L.routine(x.mins,x.parts).items}:null};

// ---- v13 결과 공유 (한 줄 텍스트)
L.SHARE_URL='oneulkg.github.io/gym';
// 그날 기록 요약: 종목별(같은 종목 여러 번이면 마지막), 이전 기록 대비 무게 차, 볼륨, PR, 운동한 날 수
L.shareSummary=(log,date)=>{const day=log.filter(x=>x.date===date),by=new Map();day.forEach(x=>by.set(x.ex,x));
  const items=[...by.values()].map(x=>{const prev=log.filter(y=>y.ex===x.ex&&y.date<date).slice(-1)[0];const reps=x.sets.map(s=>s.reps);
    return{ex:x.ex,weight:x.weight,reps,done:x.sets.length,total:Math.max(x.n||0,x.sets.length),diff:prev?Math.round((x.weight-prev.weight)*1e4)/1e4:null,vol:x.weight*reps.reduce((a,b)=>a+b,0),pr:!!L.pr(log,x)}});
  return{date,items,vol:items.reduce((a,i)=>a+i.vol,0),days:new Set(log.filter(x=>x.date<=date).map(x=>x.date)).size,pr:items.some(i=>i.pr)}};
L.setStr=(w,reps,u)=>{const ws=L.fmtW(w,u)+(u==='lb'?'lb':'kg');return reps.length===1?`${ws}×${reps[0]}`:reps.every(r=>r===reps[0])?`${ws}×${reps[0]}×${reps.length}`:`${ws}×${reps.join('/')}`};
L.checks=(d,t)=>'✅'.repeat(Math.min(d,6))+'⬜'.repeat(Math.max(0,Math.min(t,6)-Math.min(d,6)));
L.num=n=>Math.round(n).toLocaleString('en-US');
L.SH={ko:{since:'지난번보다',same:'지난번과 같은 무게',vol:'볼륨',tvol:'총 볼륨',days:'기록 {n}일째',more:'외 {n}개'},
 en:{since:'vs last',same:'same as last',vol:'vol',tvol:'total vol',days:'day {n}',more:'+{n} more'}};
// 한 줄 텍스트. 종목 1개면 자세히, 여러 개면 최대 3개를 " / "로 + 총 볼륨
L.shareText=(sum,{u='kg',lang='ko',name=n=>n}={})=>{const S=L.SH[lang]||L.SH.ko,U=u==='lb'?'lb':'kg',it=sum.items;if(!it.length)return'';
  const dif=i=>{if(i.diff==null)return'';const d=Math.round(L.toU(i.diff,u)*10)/10;return d?`${S.since} ${d>0?'+':''}${d}${U}`:S.same};
  const vol=v=>L.num(L.toU(v,u))+U,days=S.days.replace('{n}',sum.days),pr=sum.pr?' 🏆':'';
  let body;
  if(it.length===1){const i=it[0];body=[`${name(i.ex)} ${L.setStr(i.weight,i.reps,u)} ${L.checks(i.done,i.total)}`,dif(i),`${S.vol} ${vol(i.vol)}`,days+pr].filter(Boolean).join(' · ')}
  else{const top=it.slice(0,3).map(i=>`${name(i.ex)} ${L.setStr(i.weight,i.reps,u)}${i.pr?'🏆':''}`).join(' / ')+(it.length>3?' '+S.more.replace('{n}',it.length-3):'');
    body=[top,`${S.tvol} ${vol(sum.vol)}`,days].join(' · ')}
  return lang==='en'?`Workout done ✅ ${body} · 오늘 몇 kg ${L.SHARE_URL}`:`오운완 ✅ ${body} · 오늘 몇 kg ${L.SHARE_URL} #오운완 #헬스기록`};

L.FB_URL='https://ntfy.sh/oneulkg-fb-c7848989c6d65910fd8931fb';L.FB_MAX=500;L.FB_GAP=30000;
L.fbCheck=(msg,last,now)=>{const m=(msg||'').trim();if(!m)return 'empty';if(m.length>L.FB_MAX)return 'long';if(last&&now-last<L.FB_GAP)return 'wait';return ''};
L.fbBody=(msg,cat,contact,lang,ver)=>`[${cat||'etc'}] ${(msg||'').trim().slice(0,L.FB_MAX)}`+(contact&&contact.trim()?`\n연락처: ${contact.trim().slice(0,80)}`:'')+`\n(${lang} · ${ver})`;
