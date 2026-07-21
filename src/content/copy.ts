export const COPY = {
  product: {
    name: '금융 AI 개인정보 보호 게이트웨이',
    introduction:
      '금융 직원의 AI 요청에서 고객정보를 내부에서 보호하고, AI 응답을 다시 검사해 확인된 업무 결과만 보여주도록 설계한 온프레미스 보호 계층 제안',
    memoryLine: '허용된 업무만, 확인된 결과만',
  },
  scope: {
    badges: ['가상 사례로 보는 작동 예시', '실제 고객정보·외부 AI 연결 없음'],
    official:
      '가상의 합성데이터로 동작 개념을 설명하는 정적 시뮬레이션입니다. 실제 AI, 금융 시스템, 고객정보에 연결되지 않으며 제품 성능과 운영 검증 결과를 뜻하지 않습니다.',
    hosting:
      '이 데모 코드는 별도 분석 도구나 사용자 입력 수집을 사용하지 않습니다. 다만 GitHub Pages 운영 과정에서 GitHub가 접속 IP 등 사용 정보를 처리할 수 있습니다.',
  },
  panels: {
    case: '합성 상담 사례',
    route: '보호 경로',
    result: '업무 결과',
    evidence: '검증 상태',
  },
  controls: {
    play: '재생',
    pause: '일시정지',
    continue: '계속 보기',
    replay: '다시보기',
    previous: '이전',
    next: '다음',
    manual: '단계별 보기',
    blockExample: '확인이 필요한 경우',
    summarize: '상담 정리',
  },
  steps: [
    '개요',
    '기존 방식의 빈틈',
    '정보 찾기',
    '유형별 보호',
    '승인 경로',
    '전체 응답 검사',
    '확인된 결과',
    '혁신과 검증 예정',
    '확인이 필요한 경우',
  ],
  sceneHeadlines: {
    overview: '상담 직원의 AI 요약, 고객정보는 내부에 남겨야 합니다',
    gap: '직접 삭제는 확인 작업이 생기고, 모두 차단하면 상담요약도 멈춥니다',
    detect: '이름·연락처·계좌가 한 문장에 섞여 있습니다',
    protect: '정보 유형에 맞게 보호합니다',
    route: '이 정적 시연에서는 외부 AI·API 경로를 사용하지 않습니다',
    inspect: '응답 전체를 확인하는 동안 결과는 열지 않습니다',
    result: '확인된 요약과 직원 확인 항목을 함께 보여줍니다',
    finish: '입력 보호에서 끝나지 않고, 결과 공개 전까지 왕복 전체를 확인합니다',
    withheld: '확인이 필요한 결과는 표시하지 않았어요',
  },
  case: {
    caseIdLabel: '사례 ID',
    classification: '처음부터 만든 가상 합성 사례',
    sourceLabel: '합성 상담 메모',
    protectedLabel: '보호된 요청',
  },
  problem: {
    manual: '직접 삭제: 확인 작업과 누락 가능성',
    blockAll: '요청 전체 차단: 상담요약 업무도 중단',
    core: '보호한 요청이 확인된 업무 결과로 끝났는지 함께 확인해야 합니다',
  },
  protection: {
    detect: '찾기',
    protectByType: '정보 유형별 보호',
    entities: [
      {type: '이름', action: '요청별 가상값으로 바꿈'},
      {type: '연락처', action: '연락처 유형 표식으로 바꿈'},
      {type: '계좌', action: '계좌 유형 표식으로 바꿈'},
    ],
    matrix: {
      eyebrow: '유형별 보호',
      title: '정보 유형별 정책 예시',
      description:
        '직접 식별자, 준식별자, 민감 정보, 비개인정보의 고위험, 중위험, 저위험 수준을 구분하고 연결 보호, 선택적 보호, 강화 보호, 일반 제공을 검토합니다.',
      methods: ['마스킹', '가명처리', '비식별화', '토큰화', '원문 제공'],
      disclaimer: '정책 시뮬레이션이며 실제 처리 성능을 뜻하지 않습니다',
    },
  },
  route: {
    external: '외부 AI·API 경로',
    externalState: '사용하지 않음',
    internal: '내부·모의 처리 경로',
    internalState: '승인된 시연 경로',
    payloadState: '외부로 이동한 요청 없음',
  },
  inspection: {
    title: '전체 응답 검사',
    waiting: '검사가 끝날 때까지 업무 결과를 열지 않습니다',
    exact: '정확히 연결됨 → 결과 공개',
    changed: '형태가 달라짐 → 결과 미공개',
    complete: '전체 응답을 확인했어요',
    checks: [
      ['정책 준수 검사', '허용된 업무 범위 내 처리 확인'],
      ['개인정보 표식 검사', '이름·연락처·계좌 표식 확인'],
      ['민감정보 패턴 검사', '거래내역·신용정보 패턴 확인'],
      ['외부 경로 검사', '외부 이동 0 확인'],
      ['응답 무결성 검사', '응답 구조와 위변조 확인'],
      ['최종 안전성 판단', '공개 또는 결과 미공개 결정'],
    ],
    fixedDemoNotice:
      '표시된 진행률과 상태 수치는 가상 시연을 위한 고정값이며 제품 성능이나 운영 검증 결과가 아닙니다.',
  },
  verifiedResult: [
    {
      label: '상담 목적',
      value: '자동이체 오류 상담',
      evidence: '합성 상담 메모',
    },
    {
      label: '고객 요청',
      value: '오류 확인과 처리 결과 안내',
      evidence: '합성 상담 메모',
    },
    {
      label: '직원이 안내한 내용',
      value: '내부 조회 후 처리 결과를 안내하기로 함',
      evidence: '입력 문장 근거 있음',
    },
    {
      label: '직원이 확인할 항목',
      value: '정확한 오류 원인과 처리 완료 여부',
      evidence: '사람이 확인할 항목',
    },
    {
      label: '다음 조치',
      value: '내부 조회 후 합성연락처-001로 안내',
      evidence: '합성 상담 메모',
    },
  ],
  resultEffect:
    '예상 업무 변화, 실측 전: 개인정보 직접 삭제와 화면 전환 감소 여부를 검증합니다',
  blocked: {
    eyebrow: '결과 미공개',
    title: '보호용 표시가 달라 결과를 열지 않았어요',
    description:
      '원래 값과 정확히 연결하기 어려워요. 이전 단계를 확인하거나 직접 작성으로 이어가세요.',
    previous: '이전 단계 확인',
    help: '직접 작성 방법 보기',
    success: '성공 흐름으로 돌아가기',
    helpSteps: ['상담 메모를 다시 확인해요', '확인된 내용만 직접 작성해요', '필요하면 담당자에게 확인해요'],
  },
  finalFlow: ['요청 정보 보호', '승인 경로', '전체 응답 검사', '확인된 결과 공개'],
  evidence: {
    externalLabel: '외부 연결',
    externalValue: '별도 AI·API 연결 없음',
    beforeInspectionLabel: '검사 전 결과',
    beforeInspectionValue: '표시하지 않음',
    operationalLabel: '제품·운영 검증',
    operationalValue: '미실시',
  },
  validation: {
    title: '검증 예정',
    people: '현업 대표 5명',
    tasks: '1인당 합성 과업 10건 이상',
    comparison: '수작업 방식과 게이트웨이 방식을 번갈아 수행',
    measures: ['개인정보 정리시간', '전체 과업시간', '누락', '과차단', '재작업'],
  },
  bootstrap: {
    loading: '합성 사례를 확인하고 있어요',
    emptyTitle: '표시할 합성 사례가 없어요',
    emptyDescription: '승인된 시연 데이터가 준비되면 같은 보호 흐름을 바로 확인할 수 있어요.',
    emptyAction: '데모 다시 확인',
    invalidTitle: '검수된 시연 데이터를 확인하지 못했어요',
    invalidDescription: '데모를 다시 시작해 주세요. 일부 데이터만 표시하지는 않아요.',
    invalidAction: '처음부터 다시 시작',
    paused: '데모가 멈춰 있어요',
    reducedMotion: '단계별로 편하게 확인할 수 있어요',
  },
} as const;

export const FORBIDDEN_RENDERED_COPY = [
  '—',
  '100% 안전',
  '완전 차단',
  '유출 0',
  '운영 완료',
  '검증 완료',
  'Zero-Knowledge',
  'Aegis AI',
  'ChatGPT',
  'OpenAI',
  'iM금융',
  'iM뱅크',
] as const;

export type VerifiedResultField = (typeof COPY.verifiedResult)[number];
