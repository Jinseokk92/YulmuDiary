# YulmuDiary Agents Guide

이 파일은 이 저장소에서 작업하는 에이전트용 운영 가이드입니다.  
상세 배경은 `CLAUDE.md`를 기준으로 하되, 실무에 필요한 규칙을 우선 정리합니다.

## 1) 기본 원칙

- 응답과 커뮤니케이션은 한국어로 한다.
- 모노레포 구조를 유지한다: `backend/`(Spring Boot), `frontend/`(Next.js).
- 요청 범위를 넘는 리팩터링은 하지 않는다.
- 변경 전 원인 파악(파일/스타일 적용 위치 확인) 후 수정한다.

## 2) 중요 안전 규칙

- 아래 파일/유형은 사용자 확인 없이 생성/수정/삭제하지 않는다.
  - `.env*`
  - `*.yml`, `*.yaml`, `*.properties`
  - 특히 `backend/src/main/resources/application.yml`
  - 특히 `backend/src/main/resources/application-local.yml`
  - 특히 `backend/src/main/resources/application-prod.yml`
- 기존 사용자 변경사항은 절대 임의로 되돌리지 않는다.

## 3) 프로젝트 핵심 정보

- Backend: Spring Boot 3.4.x, Java 17, PostgreSQL, JPA
- Frontend: Next.js 15, React 19, Tailwind CSS 3, TypeScript, Zustand
- 개발 OS: Windows 11

## 4) 자주 쓰는 실행 명령

- 프론트 개발 서버: `cd frontend && npm run dev`
- 프론트 타입체크: `cd frontend && npx tsc --noEmit`
- 백엔드 실행: `cd backend && gradle bootRun`
- 백엔드 테스트: `cd backend && gradle test`

## 5) 프론트엔드 UI/레이아웃 작업 규칙

- `fixed` UI(드로어/시트/모달)는 부모 레이아웃 영향 여부를 먼저 점검한다.
  - `transform`, `filter`, `perspective`, `overflow`, `stacking context` 확인
- 오버레이 계층 UI는 필요 시 `createPortal(..., document.body)`를 우선 고려한다.
- 모바일 높이는 `100vh`보다 `100dvh`/`svh`를 우선 검토한다.
- 오버레이 오픈 중 배경 스크롤/포인터 이벤트를 명시적으로 제어한다.

## 6) 최근 반영된 중요 이슈(기억용)

### 햄버거 메뉴 floating 이슈 대응 (완료)

- 원인 요약
  - `SideDrawer`가 레이아웃 트리 내부에서 렌더되어 부모 합성 레이어 영향 가능성이 있었음
  - 단순 `overflow: hidden`만으로는 모바일에서 배경 미세 이동이 남을 수 있었음

- 반영 내용
  - `frontend/src/components/layout/SideDrawer.tsx`
    - `createPortal`로 `document.body`에 렌더
    - 최상위 레이어 `fixed inset-0 z-[1100]`
    - drawer 패널 높이 `100dvh`
    - body scroll lock: `position: fixed + top` 방식
    - `#app-shell`에 `inert` + `pointer-events: none` 적용/해제
  - `frontend/src/app/(main)/layout.tsx`
    - 앱 셸 루트에 `id="app-shell"` 추가

- 후속 작업 시 주의
  - 드로어 관련 회귀가 보이면 먼저 portal 유지 여부와 `#app-shell` 적용 상태를 확인한다.

## 7) 보안 TODO (요약)

- `refresh_token` 쿠키 `Secure=false` 이슈 점검 필요
- 가족 그룹 접근 제어 AOP 적용 누락 엔드포인트 재검토 필요

## 8) 참고 문서

- 전체 상세 문서: `CLAUDE.md`
