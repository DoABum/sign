// 2022 개정 수학과 교육과정 - 교과 역량 (6개)
export const COMPETENCIES: { key: string; label: string }[] = [
  { key: "problem_solving", label: "문제해결" },
  { key: "reasoning", label: "추론" },
  { key: "communication", label: "의사소통" },
  { key: "connection", label: "연결" },
  { key: "information_processing", label: "정보처리" },
  { key: "attitude_practice", label: "태도및실천" },
];

// 수학 수업 중 관찰 가능한 태도/특기사항 키워드
// key가 "novel_question"인 항목은 체크 시 질문 입력칸이 함께 열린다
export const ATTITUDES: { key: string; label: string }[] = [
  { key: "novel_question", label: "참신한 질문" },
  { key: "active_presentation", label: "적극적 발표" },
  { key: "confident_presentation", label: "자신감 있는 발표" },
  { key: "logical_explanation", label: "논리적 설명" },
  { key: "creative_approach", label: "창의적 풀이" },
  { key: "multiple_methods", label: "다양한 풀이 시도" },
  { key: "error_correction", label: "오류 수정 노력" },
  { key: "attentive_listening", label: "경청" },
  { key: "collaboration", label: "협업" },
  { key: "leadership", label: "리더십" },
  { key: "peer_mentoring", label: "또래 설명(멘토링)" },
  { key: "self_directed", label: "자기주도적 학습" },
  { key: "persistence", label: "끈기 있는 도전" },
  { key: "diligence", label: "성실한 태도" },
];

export const NOVEL_QUESTION_KEY = "novel_question";
