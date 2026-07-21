# 단디 DANDI, 금융 AI 개인정보 보호 게이트웨이 데모

금융 직원이 승인된 AI 업무 화면에서 합성 상담 메모를 처리하는 과정을 보여주는 정적 브라우저 시연입니다. 실제 고객정보, 실제 금융 판단, 외부 AI 연결, 서버 API는 포함하지 않습니다.

이 저장소는 제출 자료와 화면 녹화를 위한 공개 정적 시연입니다. 제품 성능이나 운영 보안 검증 결과를 뜻하지 않습니다. 화면의 수치와 결과는 흐름을 설명하기 위한 합성 예시입니다.

- 공개 저장소: [github.com/wannahappyaroundme/privacy-gateway-demo](https://github.com/wannahappyaroundme/privacy-gateway-demo)
- 시연 화면: [wannahappyaroundme.github.io/privacy-gateway-demo](https://wannahappyaroundme.github.io/privacy-gateway-demo/)

## 바로 실행하기

필요한 버전은 Node.js `20.19.5`, npm `10.8.2`입니다.

```bash
npm ci --ignore-scripts --no-audit --no-fund
npx playwright install chromium
npm run dev
```

브라우저에서 화면에 표시된 로컬 주소를 열고 `AI 상담 요약 만들기`를 누르면 약 22초 동안 개인정보 찾기, 유형별 보호, AI 상담 요약 작성, 전체 응답 검사, 결과 공개가 자동으로 이어집니다. 화면에는 타이머나 시연용 타임라인을 표시하지 않습니다.

## 녹화 준비

```bash
npm run record:check
```

이 검사는 고정된 화면 크기, 폰트, 제품 상태 문구, 자동 진행 시간과 결과 공개 조건을 확인합니다. 통과한 뒤 macOS 화면 기록에서 브라우저 영역을 직접 녹화하면 됩니다. 영상 인코딩 파일이나 자동 업로드 기능은 저장소에 포함하지 않습니다.

브라우저 기준 이미지 8장은 `artifacts/submission`의 제출용 6장과 `artifacts/regression`의 예외 흐름 2장으로 나뉩니다. macOS에서 생성한 검토 기준 이미지와 RGBA 바이트를 완전 일치로 비교합니다. Linux 기반 GitHub Actions에서는 같은 8개 프레임의 핵심 문구, 1920×1080 크기, 오버플로, 주요 화면 경계, 빈 화면 여부를 검사합니다. 운영체제별 글꼴 래스터 차이 때문에 Linux에서 macOS 픽셀을 그대로 비교하지 않습니다.

## 전체 검증

```bash
npm run verify
```

검증 범위는 타입, 코드 규칙, 단위 테스트, 빌드, 브라우저 동작, 접근성, 기준 이미지, 녹화 흐름, 공개 파일 경계, 합성 데이터, 문구, 외부 요청 수단, 라이선스 고지입니다.

2026년 7월 22일 로컬 후보 기준으로 macOS에서 단위 테스트 1,122개, 브라우저·접근성 테스트 22개, 시각 테스트 10개가 통과했습니다. Linux 결과와 실제 Pages 주소는 아래 공개 배포 기록에서 별도로 확인합니다.

의존성 고지와 공개 후보 해시를 갱신할 때는 아래 순서로 실행합니다.

```bash
npm run release:manifest
npm run verify
```

`release-manifest.json`은 공개 승인 상태와 검토한 소스 해시를 함께 기록합니다. 소스가 달라지면 기존 승인 상태를 닫습니다.

## 공개 배포 경계

GitHub Pages 배포는 자동으로 실행되지 않습니다. 수동 워크플로는 보호된 `main`의 정확한 커밋 SHA, 별도 공개 승인 매니페스트, 같은 커밋의 전체 검증을 모두 요구합니다.

공개 이력은 내부 검토 파일이 포함된 개발 이력과 분리한 단일 커밋으로 시작합니다. 배포 상태와 검사 결과는 저장소의 Actions와 Pages에서 확인할 수 있습니다.

GitHub Pages를 사용하면 GitHub가 접속 IP 등 사용 정보를 처리할 수 있습니다. 조직의 개인정보 처리 안내와 보존 정책을 확인한 뒤 공개해야 합니다.

## 보안 범위

- 정적 파일만 제공하며 런타임 네트워크 요청 수단을 빌드 검사에서 차단합니다.
- 콘텐츠 보안 정책은 연결, 프레임, 폼 제출, 미디어, 작업자를 닫습니다.
- 데모 입력과 출력은 공개용으로 검토한 합성 사례 한 건으로 고정됩니다.
- 민감한 경로, 비밀값 형태, 실제처럼 보이는 식별번호가 소스와 빌드에 남지 않도록 검사합니다.
- 이 정적 시연은 실제 온프레미스 게이트웨이, 탐지 정확도, 데이터 복원, 운영 통제를 구현하거나 입증하지 않습니다.

## 저작권과 제3자 고지

저장소 코드는 [MIT License](LICENSE)를 따릅니다. 로컬 글꼴과 npm 의존성의 출처, 라이선스, 파일 해시는 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)에 기록합니다.
