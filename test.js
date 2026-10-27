const L=require('./logic.js');let ok=0,f=0;const eq=(n,a,b)=>{const p=JSON.stringify(a)===JSON.stringify(b);p?ok++:f++;console.log((p?'PASS ':'FAIL ')+n+' => '+JSON.stringify(a)+(p?'':' expected '+JSON.stringify(b)))};
let r=L.plates(100,20,[25,20,15,10,5,2.5,1.25]);eq('100kg/20kg바',[r.total,r.side,r.exact],[100,[25,15],true]);
r=L.plates(62.5,20,[25,20,15,10,5,2.5,1.25]);eq('62.5kg',[r.total,r.side],[62.5,[20,1.25]]);
r=L.plates(61,20,[25,20,15,10,5,2.5,1.25]);eq('61kg 불가→근사',[r.total,r.exact],[60,false]);
r=L.plates(60,15,[20,10,5,2.5]);eq('15kg바 60 → 20+2.5 (사용자 사례)',[r.total,r.side,r.exact],[60,[20,2.5],true]);
r=L.plates(80,20,[20,10],{20:1,10:2});eq('개수제한 20x1,10x2',[r.total,r.side],[80,[20,10]]);
r=L.plates(15,20,[5]);eq('바보다 가벼움',r.total,20);
const ex={sets:3,min:8,max:12};
eq('첫기록',L.suggest(ex,null).weight,null);
eq('상체 전세트12→+2.5',L.suggest(ex,{weight:60,sets:[{reps:12},{reps:12},{reps:12}]}).weight,62.5);
eq('하체 +5',L.suggest({...ex,lower:1},{weight:100,sets:[{reps:12},{reps:12},{reps:13}]}).weight,105);
let s=L.suggest(ex,{weight:60,sets:[{reps:12},{reps:10},{reps:9}]});eq('미달→같은무게 10회',[s.weight,s.reps],[60,10]);
s=L.suggest(ex,{weight:60,sets:[{reps:5},{reps:4},{reps:4}]});eq('크게 미달→-10%',s.weight,55);
eq('Epley 100x5',L.e1rm(100,5),116.7);
for(const m of [30,45,60]){const R=L.routine(m,['가슴','전면 삼각근']);eq(m+'분 루틴 시간내',R.est<=m,true);console.log('  ',R.est+'분',R.items.map(i=>i.n+' '+i.sets+'x'+i.min+'-'+i.max).join(', '))}

// ---- lbs
const exU={sets:3,min:8,max:12};
eq('lb 상체 +5lb (60kg≈132.5lb→137.5)',L.suggest(exU,{weight:60,sets:[{reps:12},{reps:12},{reps:12}]},'lb').weight,137.5);
eq('lb 하체 +10lb (225lb 기록→235)',L.suggest({...exU,lower:1},{weight:225*L.KG,sets:[{reps:12},{reps:12},{reps:12}]},'lb').weight,235);
eq('lb 미달→같은무게',L.suggest(exU,{weight:135*L.KG,sets:[{reps:10},{reps:9},{reps:9}]},'lb').weight,135);
eq('lb 크게미달 -10% 5lb단위 (135→120)',L.suggest(exU,{weight:135*L.KG,sets:[{reps:4},{reps:4},{reps:4}]},'lb').weight,120);
eq('code up',L.suggest(exU,{weight:60,sets:[{reps:12},{reps:12},{reps:12}]}).code,'up');
eq('kg 저장↔lb 표시 왕복 225lb',L.fmtW(Math.round(L.toKg(225,'lb')*1e4)/1e4,'lb'),'225');
eq('100kg = 220.5lb',L.fmtW(100,'lb'),'220.5');
const LB=[45,35,25,10,5,2.5];
r=L.plates(225,45,LB);eq('225lb/45바 → 45+45',[r.total,r.side,r.exact],[225,[45,45],true]);
r=L.plates(185,45,LB);eq('185lb → 45+25',[r.side],[[45,25]]);
r=L.plates(137.5,45,LB);eq('137.5lb 불가 → 135 또는 140',[r.exact,[135,140].includes(r.total)],[false,true]);
r=L.plates(95,25,LB);eq('EZ 25lb 95 → 35',r.side,[35]);
r=L.plates(100,35,LB);eq('여성바35 100 → 25+5+2.5',[r.total,r.side],[100,[25,5,2.5]]);

// ---- 원판 추가: 바 아래, 근사 아래/위, 모든 프리셋
r=L.plates(10,20,[25,20]);eq('바보다 낮음 → below, 20',[r.below,r.total,r.side],[true,20,[]]);
r=L.plates(20,20,[25]);eq('바 무게 그대로',[r.exact,r.total],[true,20]);
r=L.plates(61,20,[25,20,15,10,5,2.5,1.25]);eq('61 → 아래 60 / 위 62.5',[r.lower.total,r.higher.total],[60,62.5]);
r=L.plates(63,20,[25,20,15,10,5,2.5,1.25]);eq('63 → 가까운 62.5',r.total,62.5);
const KGP=[25,20,15,10,5,2.5,1.25];
for(const bar of [20,15,10,7]){let bad=0;for(let tg=bar;tg<=bar+150;tg+=2.5){const r=L.plates(tg,bar,KGP);const sum=bar+2*r.side.reduce((a,b)=>a+b,0);if(!r.exact||Math.abs(sum-tg)>1e-9)bad++}eq(`kg 바 ${bar}: ${bar}~${bar+150} 2.5단위 전부 정확·합 일치`,bad,0)}
for(const bar of [45,35,25]){let bad=0;for(let tg=bar;tg<=bar+300;tg+=5){const r=L.plates(tg,bar,LB);const sum=bar+2*r.side.reduce((a,b)=>a+b,0);if(!r.exact||Math.abs(sum-tg)>1e-9)bad++}eq(`lb 바 ${bar}: ${bar}~${bar+300} 5단위 전부 정확·합 일치`,bad,0)}
for(const bar of [20,45]){let bad=0;for(let tg=bar+0.5;tg<bar+60;tg+=1.7){const r=L.plates(tg,bar,bar===20?KGP:LB);if(r.exact)continue;if(!(r.lower.total<tg&&(!r.higher||r.higher.total>tg)))bad++}eq(`바 ${bar} 불가 값 → 아래<목표<위`,bad,0)}
// ---- English
global.I18N=undefined;eval(require('fs').readFileSync(__dirname+'/i18n.js','utf8').replace('const I18N','global.I18N'));
const miss=Object.keys(I18N.ko).filter(k=>!(k in I18N.en)&&k!=='bars');eq('EN 키 누락 없음',miss,[]);
eq('EN 운동명 전부',L.EX.filter(e=>!L.EN[e.n]).map(e=>e.n),[]);eq('EN 부위명 전부',L.PARTS.filter(p=>!L.EN[p]),[]);
eq('EN 문구 치환',I18N.en.up.replace('{max}',12).replace('{inc}','5 lb').replace('{min}',8),'Hit 12 reps on all sets last time → +5 lb, start at 8 reps');
console.log(`${ok} pass, ${f} fail`);process.exit(f?1:0);
