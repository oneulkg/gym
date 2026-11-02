// 포즈 특징 추출 (앱과 학습 스크립트가 같은 코드 사용). lm: MediaPipe 33점 [x,y,z,vis] (정규화), W/H: 이미지 크기
(function(root){
const ang=(a,b,c)=>{const u=[a[0]-b[0],a[1]-b[1]],v=[c[0]-b[0],c[1]-b[1]];const d=(u[0]*v[0]+u[1]*v[1])/((Math.hypot(...u)*Math.hypot(...v))||1);return Math.acos(Math.max(-1,Math.min(1,d)))*180/Math.PI};
const NAMES=['elbowMin','elbowMax','abdMin','abdMax','wristHiMin','wristHiMax','wristHeadMin','wristHipMin','shoulderW','hipW','noseVis','faceSide','facing','kneeMin','kneeMax','stance','shoulderTilt','armAsym','wristFront','ankleCross','hipSigned','shZ','hipZ','kneeDy','ankleDy','headTurn','hipShift'];
function feats(lm,W,H){const r=W/H,P=i=>[lm[i][0]*r,lm[i][1],lm[i][2],lm[i][3]];
 const [no,lEar,rEar,lS,rS,lE,rE,lW,rW,lH,rH,lK,rK,lA,rA]=[0,7,8,11,12,13,14,15,16,23,24,25,26,27,28].map(P);
 const mS=[(lS[0]+rS[0])/2,(lS[1]+rS[1])/2],mH=[(lH[0]+rH[0])/2,(lH[1]+rH[1])/2],T=Math.hypot(mS[0]-mH[0],mS[1]-mH[1])||1e-3;
 const eL=ang(lS,lE,lW),eR=ang(rS,rE,rW),aL=ang(lH,lS,lE),aR=ang(rH,rS,rE);
 const hiL=(lS[1]-lW[1])/T,hiR=(rS[1]-rW[1])/T; // 손목이 어깨보다 위면 +
 const dh=w=>Math.hypot(w[0]-no[0],w[1]-no[1])/T,dp=(w,h)=>Math.hypot(w[0]-h[0],w[1]-h[1])/T;
 const kL=ang(lH,lK,lA),kR=ang(rH,rK,rA);
 return [Math.min(eL,eR),Math.max(eL,eR),Math.min(aL,aR),Math.max(aL,aR),Math.min(hiL,hiR),Math.max(hiL,hiR),Math.min(dh(lW),dh(rW)),Math.min(dp(lW,lH),dp(rW,rH)),
  Math.hypot(lS[0]-rS[0],lS[1]-rS[1])/T,Math.hypot(lH[0]-rH[0],lH[1]-rH[1])/T,no[3],Math.abs(lEar[3]-rEar[3]),
  (lS[0]-rS[0])/T, // 정면이면 + (피사체 왼어깨가 화면 오른쪽), 뒷면이면 −, 측면이면 ~0
  Math.min(kL,kR),Math.max(kL,kR),Math.abs(lA[0]-rA[0])/T,Math.abs(lS[1]-rS[1])/T,Math.abs(eL-eR)/180+Math.abs(aL-aR)/180,
  ((lW[2]+rW[2])/2-(lS[2]+rS[2])/2),
  (lA[0]-rA[0])*Math.sign((lH[0]-rH[0])||1)/T, // 발목이 엇갈리면 − (모델 워킹·크로스 스텝)
  (lH[0]-rH[0])/T,lS[2]-rS[2],lH[2]-rH[2],Math.abs(lK[1]-rK[1])/T,Math.abs(lA[1]-rA[1])/T,
  (no[0]-mS[0])/T,Math.abs(mH[0]-(lA[0]+rA[0])/2)/T]}
function sym(lm,W,H){const f=feats(lm,W,H);return Math.max(0,Math.min(1,1-f[17]-f[16]))}
function frame(lm){const xs=lm.map(q=>q[0]),ys=lm.map(q=>q[1]);const mnx=Math.min(...xs),mxx=Math.max(...xs),mny=Math.min(...ys),mxy=Math.max(...ys),h=mxy-mny;
 const inside=mnx>0.02&&mxx<0.98&&mny>0.01&&mxy<0.99;const c=v=>Math.max(0,Math.min(1,v));return c((inside?0.6:0.2)+c(1-Math.abs(h-0.82)/0.3)*0.25+c(1-Math.abs((mnx+mxx)/2-0.5)/0.4)*0.15)}
const api={NAMES,feats,sym,frame};if(typeof module!=='undefined')module.exports=api;else root.PoseFeat=api})(this);
