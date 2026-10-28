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

// ---- v9
eq('doneSets: 체크한 것만',L.doneSets([{reps:10,done:true},{reps:8},{reps:9,done:true}]),[{reps:10},{reps:9}]);
eq('doneSets: 체크 없음→전부(호환)',L.doneSets([{reps:10},{reps:8}]),[{reps:10},{reps:8}]);
eq('doneSets: 0회 제외',L.doneSets([{reps:0},{reps:5}]),[{reps:5}]);
{const a={ex:'벤치프레스',date:'2026-10-01',weight:60,sets:[{reps:10}]},b={ex:'벤치프레스',date:'2026-10-03',weight:62.5,sets:[{reps:8}]},c={ex:'벤치프레스',date:'2026-10-05',weight:60,sets:[{reps:8}]},d={ex:'벤치프레스',date:'2026-10-07',weight:60,sets:[{reps:14}]};const lg=[a,b,c,d];
eq('PR 첫 기록 아님',L.pr(lg,a),null);eq('PR 무게(e1RM은 미달)',L.pr(lg,b),{weight:true,e1rm:false});eq('PR 아님',L.pr(lg,c),null);eq('PR e1RM만',L.pr(lg,d),{weight:false,e1rm:true});}
eq('sortLog 날짜순·안정',L.sortLog([{date:'2026-10-02',i:1},{date:'2026-10-01',i:2},{date:'2026-10-02',i:3}]).map(x=>x.i),[2,1,3]);
{const cur={log:[{ex:'스쿼트',date:'2026-10-01',weight:100,sets:[{reps:5}]}],rest:{'스쿼트':180},custom:[]};
 const inc={log:[{ex:'스쿼트',date:'2026-10-01',weight:100,sets:[{reps:5}]},{ex:'스쿼트',date:'2026-09-20',weight:95,sets:[{reps:5}]},{ex:'x',date:'bad',weight:1,sets:[]}],rest:{'스쿼트':120,'딥스':90},notes:{'딥스':'n'}};
 const r=L.importData(cur,inc);eq('import 중복제거·검증',r.added,1);eq('import 정렬',r.state.log.map(x=>x.date),['2026-09-20','2026-10-01']);eq('import 기존 설정 우선',[r.state.rest['스쿼트'],r.state.rest['딥스'],r.state.notes['딥스']],[180,90,'n']);
 let th=0;try{L.importData(cur,{foo:1})}catch(e){th=1}eq('import 잘못된 파일 거부',th,1);
 eq('import 후 원본 불변',cur.log.length,1);}
eq('CSV',L.toCSV([{ex:'a,b',date:'2026-10-01',weight:100,sets:[{reps:5},{reps:4}]}],'kg'),'date,exercise,weight_kg,set,reps\n2026-10-01,"a,b",100,1,5\n2026-10-01,"a,b",100,2,4');
eq('CSV lb',L.toCSV([{ex:'a',date:'2026-10-01',weight:100,sets:[{reps:5}]}],'lb').split('\n')[1],'2026-10-01,a,220.5,1,5');
eq('backupDue 적은 기록',L.backupDue({log:[1,2]},'2026-10-27'),false);
eq('backupDue 백업없음',L.backupDue({log:[1,2,3]},'2026-10-27'),true);
eq('backupDue 14일',[L.backupDue({log:[1,2,3],lastBackup:'2026-10-20'},'2026-10-27'),L.backupDue({log:[1,2,3],lastBackup:'2026-10-13'},'2026-10-27')],[false,true]);
eq('warmup 100kg/20',L.warmup(100,20),[{w:20,reps:10},{w:40,reps:8},{w:60,reps:5},{w:80,reps:3}]);
eq('warmup 225lb/45',L.warmup(225,45,'lb').map(x=>x.w),[45,90,135,180]);
eq('warmup 가벼움 30/20',L.warmup(30,20).map(x=>x.w),[20,25]);
eq('warmup 바 이하',L.warmup(20,20),[]);
eq('left: 잠금 후에도 종료시각 기준',[L.left(10000,0),L.left(10000,9001),L.left(10000,20000)],[10,1,0]);
eq('기존 기록 형식 호환(필드 추가 없음)',Object.keys(L.importData({log:[]},{log:[{ex:'a',date:'2026-01-01',weight:1,sets:[{reps:1}]}]}).state.log[0]),['ex','date','weight','sets']);
for(const k of ['same','allDone','pr','imp','csv','wu','note','bkDue'])eq('i18n '+k,[!!I18N.ko[k],!!I18N.en[k]],[true,true]);
// v10
eq('템플릿 5개',L.TPL.length,5);
for(const x of L.TPL){const r=L.tpl(x.id);eq('템플릿 '+x.id+' 운동 3개 이상',r.items.length>=3,true);eq('템플릿 '+x.id+' 시간 내',L.routine(x.mins,x.parts).est<=x.mins,true);eq('템플릿 '+x.id+' 부위만',r.items.every(i=>x.parts.includes(L.EX.find(e=>e.n===i.n).p)),true);
 for(const k of ['t_','d_'])eq('i18n '+k+x.id,[!!I18N.ko[k+x.id],!!I18N.en[k+x.id]],[true,true])}
eq('없는 템플릿',L.tpl('x'),null);
eq('전신 템플릿: 하체·가슴·등 모두',['하체','가슴','등'].every(p=>L.tpl('full3').items.some(i=>L.EX.find(e=>e.n===i.n).p===p)),true);
for(const k of ['gLog','gPlate','gRest','gRt','tplH','noHist2','rtEmpty2','q_e1rm','q_prog','q_deload','q_wu','q_rr','tourT1','tourB3','tourAgain'])eq('i18n '+k,[!!I18N.ko[k],!!I18N.en[k]],[true,true]);
eq('ko/en 키 동일',Object.keys(I18N.ko).filter(k=>!(k in I18N.en)),[]);
{const fs=require('fs'),a=fs.readFileSync(__dirname+'/app.js','utf8'),w=fs.readFileSync(__dirname+'/sw.js','utf8');
eq('v12 방문자: 기본 비공개',/const SHOW_VISITORS=false;/.test(a),true);
eq('v13 SW: 외부 API 캐시 안함',/origin!==location\.origin\)return/.test(w)&&w.includes("gym-v16"),true);}

// v13 공유 텍스트
{const B='벤치프레스',lg=[{ex:B,date:'2026-10-20',weight:67.5,sets:[{reps:6},{reps:6},{reps:6}]},{ex:'스쿼트',date:'2026-10-22',weight:100,sets:[{reps:5}]},{ex:B,date:'2026-10-28',weight:70,sets:[{reps:6},{reps:6},{reps:6}]}];
 const s1=L.shareSummary(lg,'2026-10-28');
 eq('share 요약: diff·볼륨·날수·PR',[s1.items[0].diff,s1.vol,s1.days,s1.pr],[2.5,1260,3,true]);
 eq('share 한 줄 1종목',L.shareText(s1),'오운완 ✅ 벤치프레스 70kg×6×3 ✅✅✅ · 지난번보다 +2.5kg · 볼륨 1,260kg · 기록 3일째 🏆 · 오늘 몇 kg oneulkg.github.io/gym #오운완 #헬스기록');
 eq('share 미완료 세트 ⬜',L.checks(2,3),'✅✅⬜');
 const l2=[...lg.slice(0,2),{...lg[2],weight:60,sets:[{reps:8},{reps:7}],n:3}],s2=L.shareSummary(l2,'2026-10-28');
 eq('share 세트 다름·감소·PR 없음',L.shareText(s2),'오운완 ✅ 벤치프레스 60kg×8/7 ✅✅⬜ · 지난번보다 -7.5kg · 볼륨 900kg · 기록 3일째 · 오늘 몇 kg oneulkg.github.io/gym #오운완 #헬스기록');
 const l3=[...lg,{ex:'스쿼트',date:'2026-10-28',weight:100,sets:[{reps:5},{reps:5}]},{ex:'랫풀다운',date:'2026-10-28',weight:50,sets:[{reps:10}]},{ex:'딥스',date:'2026-10-28',weight:0,sets:[{reps:10}]}],s3=L.shareSummary(l3,'2026-10-28');
 eq('share 여러 종목: 3개+외 N개·총 볼륨',L.shareText(s3),'오운완 ✅ 벤치프레스 70kg×6×3🏆 / 스쿼트 100kg×5×2 / 랫풀다운 50kg×10 외 1개 · 총 볼륨 2,760kg · 기록 3일째 · 오늘 몇 kg oneulkg.github.io/gym #오운완 #헬스기록');
 eq('share 같은 무게',L.shareText(L.shareSummary([lg[0],{...lg[0],date:'2026-10-21'}],'2026-10-21')).includes('지난번과 같은 무게'),true);
 eq('share EN lb',L.shareText(s1,{u:'lb',lang:'en',name:n=>L.EN[n]}),"Workout done ✅ Bench Press 154.3lb×6×3 ✅✅✅ · vs last +5.5lb · vol 2,778lb · day 3 🏆 · 오늘 몇 kg oneulkg.github.io/gym");
 eq('share 첫 기록: diff 없음',L.shareText(L.shareSummary([lg[0]],'2026-10-20')),'오운완 ✅ 벤치프레스 67.5kg×6×3 ✅✅✅ · 볼륨 1,215kg · 기록 1일째 · 오늘 몇 kg oneulkg.github.io/gym #오운완 #헬스기록');
 eq('share 빈 날',L.shareText(L.shareSummary(lg,'2026-01-01')),'');
 eq('share: 같은 날 같은 종목은 마지막',L.shareSummary([lg[0],{...lg[0],weight:70}],'2026-10-20').items.map(i=>i.weight),[70]);
 for(const k of ['shBtn','shCopy','shImg','shCopied','shToday'])eq('i18n '+k,[!!I18N.ko[k],!!I18N.en[k]],[true,true]);}
eq('fb 빈칸',L.fbCheck('  ',0,1e6),'empty');eq('fb 500자 초과',L.fbCheck('a'.repeat(501),0,1e6),'long');eq('fb 30초 제한',L.fbCheck('hi',1e6,1e6+29999),'wait');eq('fb OK',L.fbCheck('hi',1e6,1e6+30000),'');
eq('fb body',L.fbBody(' 덤벨 ','기능요청','',"ko",'v16'),'[기능요청] 덤벨\n(ko · v16)');eq('fb ntfy 주소',/^https:\/\/ntfy\.sh\/oneulkg-fb-[0-9a-f]{24}$/.test(L.FB_URL),true);
for(const k of ['fbH','fbNote','fbSend','fbOk','fbPh'])eq('i18n '+k,[!!I18N.ko[k],!!I18N.en[k]],[true,true]);
console.log(`${ok} pass, ${f} fail`);process.exit(f?1:0);