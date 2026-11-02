/**
 * insta_evaluator.js
 * AI 베스트샷 TOP 3 사진 정밀 분석 & 평가 엔진
 * 
 * 남녀 체형 생체역학 각도(V-Taper, WHR, Flex Angle, Pelvis Tilt)와 
 * 조명·선명도·프레임 점유율 벤치마크를 대조 평가합니다.
 */

(function(root) {
  // AI 픽 TOP 3 벤치마크 기준치 (남성 / 여성)
  const BENCHMARKS = {
    male: {
      targetTaper: 1.60,      // 어깨-허리 비율 (1.55~1.70)
      targetFlex: 88,         // 이두 굴곡각 (82°~95°)
      targetFill: 0.78,       // 프레임 채움 (70%~85%)
      targetSharpness: 1800,  // 라플라시안 선명도 (>1500)
      targetContrast: 0.82,   // 조명 명암비 (>0.75)
      archetypes: [
        { name: "래트 스프레드 (V-Taper)", tip: "가슴 높이에서 로우앵글로 찍어 광배근과 어깨 프레임 극대화" },
        { name: "원암 바이셉 덤벨 플렉스", tip: "팔꿈치 90도 직각 수축으로 이두 피크 강조 및 45도 측면광" },
        { name: "식스팩 복근 바디체크", tip: "숨을 완전히 내뱉은 상태에서 직하향 조명으로 복직근 음영 강조" },
        { name: "측면 흉근 & 삼두 말발굽", tip: "가슴을 들어 올리고 삼두근을 압박하여 입체적인 두께감 표현" },
        { name: "등판 오버숄더 백 포즈", tip: "고개를 살짝 돌리고 광배를 최대로 펼친 날개 실루엣" }
      ]
    },
    female: {
      targetWHR: 0.69,        // 허리-골반 비율 (0.67~0.72)
      targetPelvisTilt: 20,   // 골반 트위스트 각도 (15°~25°)
      targetStanceCross: 0.18,// 다리 교차/크로스 스탠스
      targetFill: 0.75,       // 프레임 채움
      targetSharpness: 1600,  // 부드러우면서 선명한 라인
      targetContrast: 0.68,   // 부드러운 웜톤 조명
      archetypes: [
        { name: "골반 20도 트위스트 S라인", tip: "골반을 거울 쪽으로 20도 틀고 체중을 뒷다리에 실어 WHR 0.69 완성" },
        { name: "쿼터턴 11자 복근 & 허리핏", tip: "한 손을 가볍게 허리에 올리고 배에 텐션을 주어 11자 복근 강조" },
        { name: "전신 거울 크로스레그 슬림핏", tip: "앞다리를 살짝 교차해 다리 길이를 극대화하고 폰을 턱 밑에 위치" },
        { name: "뒤태 둔근 익스텐션 & 백 룩", tip: "골반을 뒤로 빼면서 둔근 볼륨 강조, 어깨를 내려 등 라인 정돈" },
        { name: "측면 레깅스 힙 & 햄스트링", tip: "90도 측면에서 대퇴사두와 둔근 경계선 강조" }
      ]
    }
  };

  /**
   * 사진의 이미지 지표(photo_core)와 포즈 지표(pose_features)를 받아
   * 인스타 1,000+ 좋아요 기준 확률과 피드백을 계산
   */
  function evaluateInstaAppeal(photoScore, poseData, genderMode = 'male') {
    const isMale = genderMode === 'male';
    const bench = isMale ? BENCHMARKS.male : BENCHMARKS.female;
    
    let poseScore = 70;
    let visualScore = 70;
    let feedback = [];
    let matchedArchetype = bench.archetypes[0];

    // 1. 이미지 시각 품질 분석 (선명도, 조명, 구도)
    const raw = photoScore.raw || {};
    const lapVar = raw.lapVar || 1200;
    const std = raw.std || 45;
    
    // 선명도 점수 (1,000+ 피드는 흔들림이 전혀 없음)
    const sharpNorm = Math.min(100, Math.round((lapVar / bench.targetSharpness) * 100));
    // 조명 명암비 (그림자 세퍼레이션)
    const contrastNorm = Math.min(100, Math.round((std / 64) * 90));
    visualScore = Math.round(sharpNorm * 0.55 + contrastNorm * 0.45);

    // 2. 포즈 생체역학 분석
    if (poseData && !poseData.error) {
      if (isMale) {
        // 남성: V-Taper (어깨-허리), 팔꿈치 굴곡, 프레임 채움
        const taper = poseData.taper || 1.35;
        const flex = poseData.flexAngle || 120;
        const fill = parseFloat(poseData.fill || 0.65);
        
        // V-Taper 정규화
        const taperScore = Math.min(100, Math.max(30, Math.round((taper / bench.targetTaper) * 100)));
        // 팔 각도 점수 (88도 근처가 만점)
        const flexDiff = Math.abs(flex - bench.targetFlex);
        const flexScore = Math.min(100, Math.max(40, 100 - flexDiff * 1.5));
        // 프레임 채움
        const fillScore = Math.min(100, Math.round((fill / bench.targetFill) * 100));

        poseScore = Math.round(taperScore * 0.45 + flexScore * 0.35 + fillScore * 0.20);

        // 맞춤형 피드백 생성
        if (taper < 1.45) {
          feedback.push("카메라를 가슴~명치 높이로 5cm 낮추면 역삼각형 어깨 프레임이 더 커 보여요");
        } else {
          feedback.push("어깨-허리 V-Taper 비율이 황금비율 상위 수준이에요 🔥");
        }

        if (flex > 105) {
          feedback.push("팔꿈치를 88° 안팎으로 더 접으면 이두근 피크가 선명해져요");
        } else if (flex >= 80 && flex <= 100) {
          feedback.push("이두근 수축 각도(88°)가 완벽해서 근육 볼륨감이 극대화됐어요 👍");
        }

        if (poseData.key === 'u_back') matchedArchetype = bench.archetypes[4];
        else if (poseData.key === 'u_dbl') matchedArchetype = bench.archetypes[0];
        else if (poseData.key === 'u_one') matchedArchetype = bench.archetypes[1];
        else matchedArchetype = bench.archetypes[0];

      } else {
        // 여성: WHR (허리-골반), 골반 턴, S라인
        const appeal = poseData.appeal || {};
        const curve = appeal.curve || 0.65;
        const femBonus = appeal.femBonus || 5;
        const fill = parseFloat(poseData.fill || 0.68);

        // S라인 & WHR 스코어
        const curveScore = Math.min(100, Math.round(curve * 110));
        const fillScore = Math.min(100, Math.round((fill / bench.targetFill) * 100));
        const bonusScore = Math.min(100, 60 + femBonus * 4);

        poseScore = Math.round(curveScore * 0.50 + bonusScore * 0.35 + fillScore * 0.15);

        if (curve < 0.7) {
          feedback.push("골반을 카메라 방향으로 15~20° 살짝 틀면 허리-골반 S라인이 즉시 살아나요");
        } else {
          feedback.push("골반 트위스트 각도와 WHR 비율이 황금비율 기준에 딱 맞아요 ✨");
        }

        feedback.push("체중을 뒤쪽 다리에 70% 싣고 앞다리를 살짝 뻗으면 다리 비율이 길어 보여요");

        if (/힙|백/.test(poseData.name || '')) matchedArchetype = bench.archetypes[0];
        else if (/프론트/.test(poseData.name || '')) matchedArchetype = bench.archetypes[1];
        else matchedArchetype = bench.archetypes[2];
      }
    } else {
      feedback.push("전신 또는 상체가 선명하게 보이도록 거울에서 1.5m 거리를 유지해 보세요");
    }

    // 최종 AI 베스트샷 종합 지수 계산
    const totalInstaScore = Math.round(poseScore * 0.55 + visualScore * 0.45);
    const topScore = Math.min(99, Math.max(35, Math.round(totalInstaScore * 0.98)));

    return {
      totalScore: totalInstaScore,
      scoreRate: topScore, // 적합도 점수 (%)
      matchedArchetype: matchedArchetype.name,
      poseScore: poseScore,
      visualScore: visualScore,
      feedback: feedback,
      benchmarkTip: matchedArchetype.tip
    };
  }

  root.InstaEvaluator = {
    BENCHMARKS,
    evaluateInstaAppeal
  };

})(typeof window !== 'undefined' ? window : this);
