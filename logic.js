// 순수 계산 로직 (테스트 가능)
const L={};
L.e1rm=(w,r)=>r<=0?0:(r===1?w:Math.round(w*(1+r/30)*10)/10);
// 이중 점진 과부하: 모든 세트가 상단 횟수 달성 -> 무게 증가(상체 2.5, 하체 5), 아니면 횟수 +1
L.suggest=(ex,last)=>{
  if(!last)return{weight:null,reps:ex.min,sets:ex.sets,why:'첫 기록이에요. 편하게 '+ex.min+'회 가능한 무게로 시작하세요.'};
  const inc=ex.lower?5:2.5;
  const all=last.sets.every(s=>s.reps>=ex.max);
  if(all)return{weight:last.weight+inc,reps:ex.min,sets:ex.sets,why:`지난번 모든 세트 ${ex.max}회 달성 → +${inc}kg, ${ex.min}회부터`};
  const minR=Math.min(...last.sets.map(s=>s.reps));
  if(minR<ex.min-2)return{weight:Math.max(0,Math.round((last.weight*0.9)/2.5)*2.5),reps:ex.min,sets:ex.sets,why:'목표보다 많이 부족했어요 → 약 10% 낮춰 다시'};
  return{weight:last.weight,reps:Math.min(ex.max,minR+1),sets:ex.sets,why:`같은 무게, 가장 적었던 세트(${minR}회)보다 1회 더`};
};
// 원판: 한쪽 무게 기준 탐욕 + 개수 제한, 정확하지 않으면 가장 가까운 값
L.plates=(target,bar,plates,collar=0,pairs=null)=>{
  const ps=[...plates].sort((a,b)=>b-a);
  const best={diff:Infinity};
  // 정확도를 위해 0.01kg 단위 DP
  const per=(target-bar-2*collar)/2;
  if(per<=0)return{total:bar+2*collar,side:[],exact:Math.abs(per)<1e-9};
  {let rem=per,g=[],cnt={};for(const p of ps){const n=pairs&&pairs[p]!=null?pairs[p]:99;while(rem>=p-1e-9&&(cnt[p]||0)<n){rem-=p;g.push(p);cnt[p]=(cnt[p]||0)+1}}
   if(Math.abs(rem)<1e-9)return{total:target,side:g,exact:true};}
  const U=100,cap=Math.round(per*U)+Math.round(Math.max(...ps)*U);
  const dp=new Array(cap+1).fill(null);dp[0]=[];
  for(const p of ps){const v=Math.round(p*U);const n=pairs&&pairs[p]!=null?pairs[p]:99;
    for(let k=0;k<n;k++){let ch=false;for(let s=cap;s>=v;s--){if(dp[s]===null&&dp[s-v]!==null&&dp[s-v].filter(x=>x===p).length===k){dp[s]=[...dp[s-v],p];ch=true}}if(!ch)break}}
  const t=Math.round(per*U);let pick=null;
  for(let d=0;d<=cap;d++){ if(t-d>=0&&dp[t-d]){pick=t-d;break} if(t+d<=cap&&dp[t+d]){pick=t+d;break} }
  const side=dp[pick].sort((a,b)=>b-a);const total=Math.round((bar+2*collar+2*pick/U)*100)/100;
  return{total,side,exact:pick===t};
};
L.restDefault=t=>t==='compound'?150:t==='iso'?75:90;
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
if(typeof module!=='undefined')module.exports=L;
