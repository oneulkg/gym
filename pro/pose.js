// 온디바이스 포즈 분류 (MediaPipe Pose Landmarker lite, ./mp 번들 → 오프라인).
// 데이터 보정: Wikimedia Commons 공개 라이선스 사진에서 뽑은 관절 특징(pose_templates.js, 사진 미포함) 기반 랜덤포레스트(120 트리).
// 인스타그램·무단 대회 사진 사용 안 함. 출처: pose_credits.json
let lm=null,loading=null;
async function load(){if(lm)return lm;loading??=(async()=>{const v=await import('./mp/vision_bundle.mjs');const fs=await v.FilesetResolver.forVisionTasks('./mp/wasm');
 lm=await v.PoseLandmarker.createFromOptions(fs,{baseOptions:{modelAssetPath:'./mp/pose_landmarker_lite.task',delegate:'CPU'},runningMode:'IMAGE',numPoses:1,minPoseDetectionConfidence:0.3,minPosePresenceConfidence:0.3});return lm})();return loading}
const NAMES={fdb:'프론트 더블 바이셉스',sc:'사이드 체스트',fr:'프론트 스탠스 (쿼터턴 프론트)',side:'쿼터턴 사이드',back:'쿼터턴 백 / 백 포즈',free:'프리포즈: 헤어 터치 / 팔 올린 포즈',bdb:'백 더블 바이셉스',fls:'프론트 랫 스프레드',bls:'백 랫 스프레드',mm:'모스트 머스큘러',at:'앱도미널 앤 사이'};
const VAR={hip:'프리포즈: 한 손 허리 (핸드 온 힙)',look:'프리포즈: 오버숄더 백 룩'};
const DIV={fdb:'보디빌딩·피지크·여자 피지크',sc:'보디빌딩·클래식',fr:'비키니·피규어·웰니스·스포츠모델 / 남자 피지크',side:'비키니·피규어·웰니스·스포츠모델',back:'비키니·피규어·웰니스 / 보디빌딩 백',free:'스포츠모델·비키니 프리포즈',bdb:'보디빌딩·클래식·여자 피지크',fls:'보디빌딩·클래식',bls:'보디빌딩·클래식',mm:'보디빌딩',at:'보디빌딩·클래식'};
const TIP={fdb:'팔꿈치를 어깨 높이로, 팔꿈치 각도는 90도 가까이',sc:'앞쪽 팔을 90도로 굽히고 가슴을 들어 보세요',fr:'한 손은 허리, 한 다리는 옆으로 살짝 빼고 어깨를 펴 보세요',side:'상체를 심사위원(카메라) 쪽으로 살짝 돌려 보세요',back:'어깨를 펴고 등과 둔근 라인이 보이게 서 보세요',free:'팔 라인을 길게 뻗고 골반을 살짝 틀어 S라인을 만들어 보세요',bdb:'팔꿈치를 어깨 높이로 올리고 등을 넓게 펴 보세요',fls:'주먹을 허리에 두고 광배를 옆으로 펼쳐 보세요',bls:'등을 보인 채 광배를 최대한 넓혀 보세요',mm:'어깨를 앞으로 모으고 승모·가슴에 힘을 주세요',at:'손을 머리 뒤에 두고 복근에 힘을 주세요',hip:'허리 손은 골반 위에 가볍게, 팔꿈치는 뒤로 빼 보세요',look:'어깨 너머로 고개만 돌리고 골반 라인을 유지하세요'};
const cl=v=>Math.max(0,Math.min(1,v));
function classify(raw,W,H){const T=window.POSE_T,F=window.PoseFeat;const L=raw.map(q=>[q.x,q.y,q.z||0,q.visibility??1]);const x=F.feats(L,W,H);
 const v={};for(const t of T.trees){let n=0;while(t.l[n]!==-1)n=x[t.f[n]]<=t.t[n]?t.l[n]:t.r[n];v[t.v[n]]=(v[t.v[n]]||0)+1}
 const bi=Object.keys(v).sort((p,q)=>v[q]-v[p])[0],k=T.classes[bi],m=cl(v[bi]/T.trees.length);const fem=T.female_share[k]??0.5;
 let variant=null;const sb=T.sub&&T.sub[k];if(sb){const w={};for(const t of sb.trees){let n=0;while(t.l[n]!==-1)n=x[t.f[n]]<=t.t[n]?t.l[n]:t.r[n];w[t.v[n]]=(w[t.v[n]]||0)+1}const vi=sb.classes.indexOf(sb.var);if((w[vi]||0)/sb.trees.length>=0.7)variant=sb.var}
 const sym=k==='side'||k==='sc'?0.7:F.sym(L,W,H),frame=F.frame(L);
 const ys=L.map(q=>q[1]),mnY=Math.min(...ys),mxY=Math.max(...ys);const tips=[];
 if(m<0.6)tips.push(TIP[k]);if(variant&&m>=0.6)tips.push(TIP[variant]);if(sym<0.7)tips.push('좌우 팔 높이와 각도를 맞춰 보세요');
 if(mnY<=0.01||mxY>=0.99)tips.push('머리부터 발끝까지 화면에 들어오게 찍어 보세요');else if(mxY-mnY<0.55)tips.push('조금 더 가까이서 찍어 보세요');
 if(!tips.length)tips.push('자세 좋아요! 👍');
 return{key:k,variant,name:variant?VAR[variant]:NAMES[k],division:DIV[k],femaleLike:+fem.toFixed(2),match:+m.toFixed(2),sym:+sym.toFixed(2),frame:+frame.toFixed(2),score:Math.round((m*0.5+sym*0.3+frame*0.2)*100),tips}}

// ── 상체 / 거울 셀카 모드: 얼굴·골반이 없어도 실패·감점 없음 ──
const UN={u_dbl:'셀카: 프론트 플렉스 (양팔)',u_one:'셀카: 원암 바이셉 플렉스',u_cross:'셀카: 팔짱 바이셉',u_back:'셀카: 백 오버숄더',u_hip:'셀카: 핸드 온 힙',u_front:'셀카: 상체 프론트'};
const UT={u_dbl:'팔꿈치를 어깨 높이로 올리고 주먹을 귀 옆으로',u_one:'굽힌 팔의 팔꿈치를 어깨 높이로, 몸을 살짝 틀어 보세요',u_cross:'손을 반대쪽 이두 아래로 넣고 팔을 앞으로 밀어 보세요',u_back:'어깨를 내리고 등을 넓게, 폰은 어깨 위로 들어 보세요',u_hip:'허리 손 팔꿈치를 뒤로 빼면 허리가 더 잘록해 보여요',u_front:'한 팔을 굽혀 힘을 주거나 허리에 손을 올려 보세요'};
const V=(L,i,t=0.5)=>L[i][3]>=t&&L[i][0]>-0.02&&L[i][0]<1.02&&L[i][1]>-0.02&&L[i][1]<1.02;
function ang(a,b,c){const u=[a[0]-b[0],a[1]-b[1]],w=[c[0]-b[0],c[1]-b[1]];const d=Math.hypot(...u)*Math.hypot(...w)||1;return Math.acos(Math.max(-1,Math.min(1,(u[0]*w[0]+u[1]*w[1])/d)))*180/Math.PI}
function isUpper(L){const fv=Math.max(L[0][3],L[2][3],L[5][3]);return !(V(L,23)&&V(L,24)&&V(L,25,0.5)&&V(L,26,0.5)&&V(L,27,0.6)&&V(L,28,0.6)&&L[27][1]<0.98&&L[28][1]<0.98&&fv>=0.5)}
function upper(L,W,H){const a=W/H,X=i=>L[i][0]*a,Y=i=>L[i][1];
 const sw=Math.hypot(X(11)-X(12),Y(11)-Y(12))||0.1,mx=(X(11)+X(12))/2,my=(Y(11)+Y(12))/2;
 const faceVis=Math.max(L[0][3],L[2][3],L[5][3]),fx=L[0][3]>0.3?X(0):mx,fy=L[0][3]>0.3?Y(0):my-sw*0.6;
 const arm=s=>{const [S,E,Wr]=s?[11,13,15]:[12,14,16];const ok=V(L,E,0.35)&&V(L,Wr,0.3);const A=ok?ang([X(S),Y(S)],[X(E),Y(E)],[X(Wr),Y(Wr)]):180;
  const phone=ok&&Math.hypot(X(Wr)-fx,Y(Wr)-fy)<sw*0.75&&Y(Wr)<my+sw*0.2;
  const flex=ok&&!phone&&A<115&&Y(Wr)<Y(E)+sw*0.1;
  const cross=ok&&!phone&&(s?X(Wr)<mx-sw*0.05:X(Wr)>mx+sw*0.05)===(X(11)>X(12))&&Math.abs(Y(Wr)-my)<sw*1.2&&false;
  const out=ok&&(s?1:-1)*Math.sign(X(11)-X(12))*(X(E)-X(S))>sw*0.12;
  const hip=ok&&!phone&&A>45&&A<135&&Y(Wr)>Y(E)&&out;return{ok,A,phone,flex,hip,X:ok?X(Wr):0,ok2:V(L,E,0.35)}};
 const l=arm(1),r=arm(0);
 // 팔짱: 양 손목이 몸 중심선을 넘어 반대쪽에 있음
 const sgn=Math.sign(X(11)-X(12))||1,cross=l.ok&&r.ok&&!l.phone&&!r.phone&&(l.X-mx)*sgn<sw*0.1&&(r.X-mx)*sgn>-sw*0.1&&l.A<110&&r.A<110;
 // 백: 얼굴 랜드마크 신뢰도가 매우 낮고 어깨 좌우가 뒤집힘(카메라 기준)
 const back=(X(11)-X(12))<-0.02&&(L[0][2]-(L[11][2]+L[12][2])/2)>0.1&&!cross;
 let k;if(back)k='u_back';else if(cross)k='u_cross';else if(l.flex&&r.flex)k='u_dbl';else if(l.flex||r.flex)k='u_one';else if(l.hip||r.hip)k='u_hip';else k='u_front';
 const phoneArm=l.phone?'l':r.phone?'r':null;
 // 대칭: 폰 든 팔 제외, 어깨 수평만 + (양팔 다 자유면) 팔꿈치 높이
 let sym=1-Math.min(1,Math.abs(Y(11)-Y(12))/sw*1.5);if(!phoneArm&&l.ok2&&r.ok2&&(k==='u_dbl'||k==='u_front'||k==='u_back'))sym=sym*0.5+0.5*(1-Math.min(1,Math.abs(Y(13)-Y(14))/sw));
 // 화면 채움: 보이는 관절만 (얼굴 제외)
 const vis=[11,12,13,14,15,16,23,24].filter(i=>V(L,i,0.4));const ys=vis.map(Y),xs=vis.map(i=>L[i][0]);
 const fill=vis.length?cl((Math.max(...ys)-Math.min(...ys))*(Math.max(...xs)-Math.min(...xs))/0.35):0;
 const inside=vis.length/8;const frame=cl(0.5*fill+0.5*cl(inside/0.6));
 // 테이퍼: 골반이 보일 때만 어깨/허리 폭
 let taper=null;if(V(L,23,0.4)&&V(L,24,0.4)){const hw=Math.hypot(X(23)-X(24),Y(23)-Y(24))||0.01;taper=+(sw/hw).toFixed(2)}
 const flexA=Math.min(l.flex?l.A:180,r.flex?r.A:180);
 const m=k==='u_front'?0.72:k==='u_back'?0.82:0.82+(flexA<180?0.1*cl((115-flexA)/45):0.05);
 const tq=taper==null?0.6:cl((taper-1.1)/0.6);
 const score=Math.round((m*0.4+sym*0.2+frame*0.25+tq*0.15)*100);
 const tips=[];if(m<0.7)tips.push(UT[k]);else if(k!=='u_front')tips.push(UT[k]);if(sym<0.7)tips.push('어깨 높이를 수평으로 맞춰 보세요');if(fill<0.5)tips.push('거울에 조금 더 가까이 서서 상체가 화면을 채우게 찍어 보세요');
 return{key:k,upper:true,variant:null,name:UN[k],division:'헬스장 셀카 (상체)',femaleLike:0.5,match:+m.toFixed(2),sym:+sym.toFixed(2),frame:+frame.toFixed(2),fill:+fill.toFixed(2),taper,faceHidden:faceVis<0.5,phoneArm,flexAngle:flexA<180?Math.round(flexA):null,score,tips}}
function pad(img,W,H,p){const c=document.createElement('canvas');const dx=Math.round(W*p),dy=Math.round(H*p);c.width=W+2*dx;c.height=H+2*dy;const g=c.getContext('2d');g.fillStyle='#808080';g.fillRect(0,0,c.width,c.height);g.drawImage(img,dx,dy,W,H);return{c,dx,dy}}


// 몸 영역 마스크: 관절 기반 캡슐(팔)·다각형(몸통)·타원(둔근). (MediaPipe 세그멘테이션 마스크는 CPU 모드에서 크래시 → 사용 안 함)
function lmMask(L,w,h){const M=new Float32Array(w*h),P=i=>[L[i][0]*w,L[i][1]*h],ok=i=>L[i][3]>0.3;const sw=Math.hypot(P(11)[0]-P(12)[0],P(11)[1]-P(12)[1])||w*0.2;
 const cap=(a,b,r)=>{const[x0,y0]=a,[x1,y1]=b,dx=x1-x0,dy=y1-y0,l2=dx*dx+dy*dy||1;const X0=Math.max(0,Math.min(x0,x1)-r|0),X1=Math.min(w-1,Math.max(x0,x1)+r|0),Y0=Math.max(0,Math.min(y0,y1)-r|0),Y1=Math.min(h-1,Math.max(y0,y1)+r|0);
  for(let y=Y0;y<=Y1;y++)for(let x=X0;x<=X1;x++){const t=Math.max(0,Math.min(1,((x-x0)*dx+(y-y0)*dy)/l2)),ex=x0+t*dx-x,ey=y0+t*dy-y;if(ex*ex+ey*ey<=r*r)M[y*w+x]=1}};
 for(const[a,b,r]of[[11,13,.2],[12,14,.2],[13,15,.15],[14,16,.15]])if(ok(a)&&ok(b))cap(P(a),P(b),sw*r);
 const hipOk=ok(23)&&ok(24),h1=hipOk?P(23):[P(11)[0],P(11)[1]+sw*1.5],h2=hipOk?P(24):[P(12)[0],P(12)[1]+sw*1.5];
 for(let k=0;k<=10;k++){const t=k/10,a=[P(11)[0]+(h1[0]-P(11)[0])*t,P(11)[1]+(h1[1]-P(11)[1])*t],b=[P(12)[0]+(h2[0]-P(12)[0])*t,P(12)[1]+(h2[1]-P(12)[1])*t];cap(a,b,sw*0.12)}
 if(hipOk)cap(P(23),P(24),sw*0.35);return M}
// 실루엣 가장자리: 주어진 행에서 몸 중심 기준 바깥쪽 최대 밝기 경사 위치
function edgeW(Z,w,h,y,cx,minD,maxD){y=Math.max(1,Math.min(h-2,Math.round(y)));const side=dir=>{let best=0,bx=minD;for(let d=minD|0;d<=maxD;d++){const x=Math.round(cx+dir*d);if(x<1||x>w-2)break;const g=Math.abs(Z[y*w+x+1]-Z[y*w+x-1])+0.5*Math.abs(Z[(y-1)*w+x+1]-Z[(y-1)*w+x-1]);if(g>best){best=g;bx=d}}return bx};return side(1)+side(-1)}
const edgeW3=(Z,w,h,y,cx,a,b,sw)=>{const v=[-0.1,0,0.1].map(k=>edgeW(Z,w,h,y+k*sw,cx,a,b)).sort((p,q)=>p-q);return v[1]}
// ── 사람 눈 기준 '멋짐/예쁨' 점수 (온디바이스, 사진 픽셀 기반) ──
// 몸 마스크 안에서만: 타일 정규화(CLAHE 유사, 어두운 사진 보정) → 근육 질감(엣지 에너지) · 명암 조각감(밴드패스 대비) · 실루엣 크기(팔/어깨 폭 vs 허리 폭)
function appeal(cv,mask,L,key){const w=cv.width,h=cv.height,d=cv.getContext('2d').getImageData(0,0,w,h).data,N=w*h;
 const Y=new Float32Array(N);for(let i=0;i<N;i++)Y[i]=(0.299*d[4*i]+0.587*d[4*i+1]+0.114*d[4*i+2])/255;
 const M=new Uint8Array(N);let mc=0,raw=0;for(let i=0;i<N;i++)if(mask[i]>0.5){M[i]=1;mc++;raw+=Y[i]}if(mc<N*0.03)return null;raw/=mc;
 // 타일 정규화 4x4 (몸 픽셀 p5..p95 → 0..1), 타일 간 보간 대신 이웃 평균
 const T=4,tw=Math.ceil(w/T),th=Math.ceil(h/T),lo=[],hi=[];for(let ty=0;ty<T;ty++)for(let tx=0;tx<T;tx++){const v=[];for(let y=ty*th;y<Math.min(h,(ty+1)*th);y++)for(let x=tx*tw;x<Math.min(w,(tx+1)*tw);x++){const i=y*w+x;if(M[i])v.push(Y[i])}
  v.sort((a,b)=>a-b);const n=v.length;lo.push(n>20?v[n*0.05|0]:null);hi.push(n>20?v[n*0.95|0]:null)}
 const gl=(()=>{const v=[];for(let i=0;i<N;i+=3)if(M[i])v.push(Y[i]);v.sort((a,b)=>a-b);return[v[v.length*0.05|0],v[v.length*0.95|0]]})();
 const Z=new Float32Array(N);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x,k=Math.min(T-1,y/th|0)*T+Math.min(T-1,x/tw|0);let a=lo[k]??gl[0],b=hi[k]??gl[1];a=(a+gl[0])/2;b=(b+gl[1])/2;Z[i]=Math.max(0,Math.min(1,(Y[i]-a)/Math.max(0.06,b-a)))}
 // 박스 블러(반경 r)로 저주파 제거 → 근육 굴곡 대비
 const blur=(S,r)=>{const o=new Float32Array(N),t=new Float32Array(N);for(let y=0;y<h;y++){let s=0;for(let x=-r;x<w;x++){if(x+r<w)s+=S[y*w+x+r];if(x-r-1>=0)s-=S[y*w+x-r-1];if(x>=0)t[y*w+x]=s/(2*r+1)}}for(let x=0;x<w;x++){let s=0;for(let y=-r;y<h;y++){if(y+r<h)s+=t[(y+r)*w+x];if(y-r-1>=0)s-=t[(y-r-1)*w+x];if(y>=0)o[y*w+x]=s/(2*r+1)}}return o};
 const r6=Math.max(3,Math.round(w/40)),B=blur(Z,r6);
 const px=i=>L[i][0]*w,py=i=>L[i][1]*h,vv=i=>L[i][3]>0.4;const sw=Math.hypot(px(11)-px(12),py(11)-py(12))||w*0.2;
 const sy=(py(11)+py(12))/2,hy=vv(23)&&vv(24)?(py(23)+py(24))/2:sy+sw*1.5,cx=(px(11)+px(12))/2;
 const regions={arm:[Math.min(px(11),px(12),px(13)||1e9,px(14)||1e9)-sw*0.3,sy-sw*0.4,Math.max(px(11),px(12),px(13)||0,px(14)||0)+sw*0.3,Math.max(py(13)||sy,py(14)||sy)+sw*0.2],
  torso:[cx-sw*0.8,sy,cx+sw*0.8,hy],glute:[cx-sw*1.0,hy-sw*0.4,cx+sw*1.0,hy+sw*0.8]};
 const stat=([x0,y0,x1,y1])=>{let n=0,g=0,bp=0,bp2=0;x0=Math.max(1,x0|0);y0=Math.max(1,y0|0);x1=Math.min(w-1,x1|0);y1=Math.min(h-1,y1|0);
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const i=y*w+x;if(!M[i]||!M[i-1]||!M[i+1]||!M[i-w]||!M[i+w])continue;n++;g+=Math.hypot(Z[i+1]-Z[i-1],Z[i+w]-Z[i-w]);const b=Z[i]-B[i];bp+=b;bp2+=b*b}
  if(n<40)return null;const mb=bp/n;return{tex:g/n,sculpt:Math.sqrt(Math.max(0,bp2/n-mb*mb))}};
 const R={arm:stat(regions.arm),torso:stat(regions.torso),glute:stat(regions.glute)};
 // 실루엣 폭: 마스크 가로 폭 (옷을 입어도 실루엣은 보임)
 const Zg=blur(Z,1);const shoulderW=Math.max(edgeW3(Zg,w,h,sy+sw*0.25,cx,sw*0.45,sw*1.3,sw),1),waistW=edgeW3(Zg,w,h,sy+(hy-sy)*0.75,cx,sw*0.25,sw*0.9,sw)||shoulderW,hipW=vv(23)&&vv(24)?edgeW3(Zg,w,h,hy+sw*0.15,cx,sw*0.3,sw*1.1,sw):0;
 const size=cl((shoulderW/Math.max(1,waistW)-1.05)/0.6);const curve=hipW&&waistW?cl((hipW/waistW-1.0)/0.35):0.5;
 const W8={u_back:{arm:.2,torso:.6,glute:.2},back:{arm:.2,torso:.4,glute:.4},u_hip:{arm:.3,torso:.3,glute:.4},free:{arm:.3,torso:.3,glute:.4},fr:{arm:.3,torso:.4,glute:.3}}[key]||{arm:.55,torso:.45,glute:0};
 let tex=0,sc=0,ws=0;for(const k in W8)if(R[k]&&W8[k]){tex+=W8[k]*R[k].tex;sc+=W8[k]*R[k].sculpt;ws+=W8[k]}if(!ws)return null;tex/=ws;sc/=ws;
 const texS=cl((tex-0.04)/0.14),scS=cl((sc-0.03)/0.09);
 // 노출: 어두운 무드 조명은 감점 안 함, 하이라이트 날림/완전 암부만 약간 감점
 const expo=raw<0.06||raw>0.92?0.5:1;
 // 여성(비키니) 모드 + 정면 포즈: 상체 볼륨(가슴 높이 폭/허리) 또는 골반(골반 폭/허리) 중 더 강한 쪽에 가산점
 const FRONT=['fr','fdb','fls','mm','at','free','u_front','u_dbl','u_one','u_hip','u_cross'];let bust=null,femB=0,femK=null;
 if((window.PoseAI?.mode||'')==='female'&&FRONT.includes(key)){const bw=edgeW3(Zg,w,h,sy+(hy-sy)*0.3,cx,sw*0.3,sw*1.0,sw);bust=cl((bw/Math.max(1,waistW)-0.95)/0.6);const hc=hipW?cl((hipW/Math.max(1,waistW)-0.95)/0.6):0;femB=Math.max(bust,hc);femK=bust>=hc?'bust':'hip'}
 const hipPose=key==='u_hip'||key==='free'||key==='back';
 const parts=hipPose?{texS:.25,scS:.3,size:.15,curve:.3}:key==='u_back'?{texS:.4,scS:.35,size:.25,curve:0}:{texS:.3,scS:.3,size:.4,curve:0};
 const v={texS,scS,size,curve};let a=0;for(const k in parts)a+=parts[k]*v[k];a=Math.min(1,a+0.15*femB);a*=expo;
 return{score:Math.round(a*100),texture:+texS.toFixed(2),sculpt:+scS.toFixed(2),size:+size.toFixed(2),curve:+curve.toFixed(2),bodyLum:+raw.toFixed(2),bust:bust==null?null:+bust.toFixed(2),femBonus:Math.round(15*femB),femKey:femK}}
window.PoseAI={mode:localStorage.getItem('gp_mode')||'female',NAMES,load,async analyze(img){try{const L=await load(),W0=img.naturalWidth||img.width,H0=img.naturalHeight||img.height,k=Math.min(1,320/Math.max(W0,H0)),W=Math.max(16,Math.round(W0*k)),H=Math.max(16,Math.round(H0*k));
 const cv=document.createElement('canvas');cv.width=W;cv.height=H;cv.getContext('2d').drawImage(img,0,0,W,H);
 let r=L.detect(cv),lms=r.landmarks?.[0];
 if(!lms){const p=pad(cv,W,H,0.25),r2=L.detect(p.c);const q=r2.landmarks?.[0];if(q){const cw=p.c.width,ch=p.c.height;lms=q.map(o=>({x:(o.x*cw-p.dx)/W,y:(o.y*ch-p.dy)/H,z:o.z,visibility:o.visibility}))}}
 if(!lms)return{none:true,tips:['몸을 찾지 못해 사진 품질(선명도·밝기)로만 평가했어요']};
 const raw=lms.map(q=>[q.x,q.y,q.z||0,q.visibility??1]);const out=isUpper(raw)?upper(raw,W,H):classify(lms,W,H);
 try{out.appeal=appeal(cv,lmMask(raw,W,H),raw,out.key)}catch(e){out.appeal=null}
 out.natural=+(out.sym*0.6+out.frame*0.4).toFixed(2);
 if(out.appeal){out.poseScore=out.score;out.score=Math.round(out.appeal.score*0.7+out.poseScore*0.3);const a=out.appeal;
  if(a.texture<0.35&&a.sculpt<0.35)out.tips.unshift('옆이나 위에서 오는 조명 아래서 찍으면 근육 결이 더 살아나요');if(a.bodyLum<0.12)out.tips.push('조금 더 밝은 곳이면 펌핑이 더 잘 보여요')}
 out._lm=raw.map(q=>[+q[0].toFixed(3),+q[1].toFixed(3)]);return out}catch(e){console.warn('pose model unavailable',e);return{error:true}}},_classify:classify};
window.dispatchEvent(new Event('poseai-ready'));
