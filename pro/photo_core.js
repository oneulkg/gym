// 오운완 사진 — 순수 계산 (폰 안에서만, 서버·네트워크 없음). 외모 점수 아님: 선명도·노출·대비·구도만.
const P={};
P.luma=(r,g,b)=>0.299*r+0.587*g+0.114*b;
P.gray=(d,w,h)=>{const o=new Float32Array(w*h);for(let i=0;i<w*h;i++)o[i]=P.luma(d[i*4],d[i*4+1],d[i*4+2]);return o};
// 라플라시안 분산 = 선명도
P.lapVar=(g,w,h)=>{let s=0,s2=0,n=0;for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=y*w+x,v=g[i-w]+g[i+w]+g[i-1]+g[i+1]-4*g[i];s+=v;s2+=v*v;n++}if(!n)return 0;const m=s/n;return s2/n-m*m};
P.stats=g=>{let s=0,s2=0,lo=0,hi=0;for(const v of g){s+=v;s2+=v*v;if(v<16)lo++;if(v>240)hi++}const n=g.length,m=s/n;return{mean:m,std:Math.sqrt(Math.max(0,s2/n-m*m)),clipLo:lo/n,clipHi:hi/n}};
// 구도: 디테일(엣지) 무게중심이 삼분할 교점/중앙에 가까울수록 좋음
P.centroid=(g,w,h)=>{let sx=0,sy=0,t=0;for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=y*w+x,e=Math.abs(g[i+1]-g[i-1])+Math.abs(g[i+w]-g[i-w]);sx+=x*e;sy+=y*e;t+=e}return t?{x:sx/t/w,y:sy/t/h}:{x:.5,y:.5}};
const cl=v=>Math.max(0,Math.min(1,v));
P.sharpScore=lv=>cl(Math.log10(1+lv)/3.6); // lv≈4000 →1
P.exposureScore=s=>cl(1-Math.abs(s.mean-128)/128-(s.clipLo+s.clipHi)*1.5);
P.contrastScore=s=>cl(s.std/64);
P.compScore=c=>{const pts=[[1/3,1/3],[2/3,1/3],[1/3,2/3],[2/3,2/3],[.5,.5]];const d=Math.min(...pts.map(([x,y])=>Math.hypot(c.x-x,c.y-y)));return cl(1-d/0.5)};
P.W={sharp:.4,exposure:.25,contrast:.2,comp:.15};
P.score=(d,w,h)=>{const g=P.gray(d,w,h),s=P.stats(g),lv=P.lapVar(g,w,h),c=P.centroid(g,w,h);
 const parts={sharp:P.sharpScore(lv),exposure:P.exposureScore(s),contrast:P.contrastScore(s),comp:P.compScore(c)};
 const total=Object.keys(P.W).reduce((a,k)=>a+P.W[k]*parts[k],0);return{total:Math.round(total*100),parts,raw:{lapVar:lv,...s,cx:c.x,cy:c.y}}};
P.reasons=(r,lang)=>{const K=lang==='en'?{sharp:['Sharp','Blurry'],exposure:['Well exposed','Too dark/bright'],contrast:['Good contrast','Flat'],comp:['Balanced framing','Off-center']}:{sharp:['선명해요','흔들렸어요'],exposure:['밝기 적당','너무 어둡거나 밝아요'],contrast:['대비 좋아요','밋밋해요'],comp:['구도 안정적','구도가 치우쳤어요']};
 return Object.keys(K).map(k=>r.parts[k]>=.6?'👍 '+K[k][0]:r.parts[k]<.35?'⚠️ '+K[k][1]:null).filter(Boolean)};
P.rank=list=>list.map((x,i)=>({...x,i})).sort((a,b)=>b.score.total-a.score.total);
// 필터: 값 b,c,s,warm (-100~100), vig (0~100)
P.FILTERS={none:{},clean:{b:5,c:10,s:5},gym:{c:25,s:-15,warm:-10,vig:30},gold:{b:5,warm:30,s:10,vig:20},mono:{s:-100,c:20},cool:{warm:-25,c:10},punch:{c:35,s:30},fade:{c:-25,b:10,s:-20},night:{b:-10,c:30,warm:-15,vig:45}};
P.FNAME={none:['원본','Original'],clean:['클린','Clean'],gym:['아이언','Iron'],gold:['골든','Golden'],mono:['흑백','Mono'],cool:['쿨','Cool'],punch:['펀치','Punch'],fade:['페이드','Fade'],night:['나이트','Night']};
P.adj=(f,u)=>{const o={b:0,c:0,s:0,warm:0,vig:0};for(const k in o)o[k]=(f[k]||0)+(u[k]||0);o.b=Math.max(-100,Math.min(100,o.b));return o};
const c255=v=>v<0?0:v>255?255:v;
P.px=(r,g,b,a)=>{r+=a.b*1.28;g+=a.b*1.28;b+=a.b*1.28;const k=(100+a.c)/100;r=(r-128)*k+128;g=(g-128)*k+128;b=(b-128)*k+128;
 const l=P.luma(r,g,b),s=(100+a.s)/100;r=l+(r-l)*s;g=l+(g-l)*s;b=l+(b-l)*s;r+=a.warm*.4;b-=a.warm*.4;return[c255(r),c255(g),c255(b)]};
P.vigF=(x,y,w,h,v)=>{if(!v)return 1;const dx=x/w-.5,dy=y/h-.5,d=Math.sqrt(dx*dx+dy*dy)/0.7071;return 1-(v/100)*0.75*d*d};
P.apply=(d,w,h,a)=>{for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4,[r,g,b]=P.px(d[i],d[i+1],d[i+2],a),f=P.vigF(x,y,w,h,a.vig);d[i]=r*f;d[i+1]=g*f;d[i+2]=b*f}return d};
// 중앙 크롭 (비율 rw:rh)
P.crop=(w,h,rw,rh)=>{const t=rw/rh;return w/h>t?{sx:(w-h*t)/2,sy:0,sw:h*t,sh:h}:{sx:0,sy:(h-w/t)/2,sw:w,sh:w/t}};
P.RATIOS={'4:5':[1080,1350],'9:16':[1080,1920]};
// 프리미엄 게이트 스텁 — 출시 때 결제/영수증 검증으로 교체
P.isPremium=ls=>{try{return ls.getItem('gymPro')==='1'}catch(e){return false}};
if(typeof module!=='undefined')module.exports=P;
