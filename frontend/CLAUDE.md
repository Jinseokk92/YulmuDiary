# 프론트엔드

## 핵심 파일 역할

- `middleware.ts` — Edge 라우트 가드: 토큰 없음→/login, 가족그룹 없음→/onboarding
- `UserContext.tsx` — 레거시, 제거하지 말 것 (Providers에서 유지 중)
- `FontSizeContext.tsx` — 돋보기 모드 ("normal"|"large"), `<html>.font-large` 토글
- `api.ts` — fetch 래퍼, Authorization 헤더 자동 주입
- `bgmAudio.ts` — HTMLAudioElement 싱글톤, 트랙 메타데이터
- `demoData.ts` — 체험판 가상데이터 (sessionStorage 기반)
- `BgmPlayer.tsx` — 전역 오디오 로직 (UI 없음, 렌더 없음)
- `BgmMiniPlayer.tsx` — 홈 전용, hero anchor 기반 위치
- `BgmFloatingPlayer.tsx` — 비홈 페이지 우하단 고정

## 설계 원칙

- **다크모드**: `darkMode: "class"` + next-themes. `dark:` prefix 대신 `isDark = mounted && resolvedTheme === "dark"` 분기 사용 (Tailwind dark: prefix는 dev 재시작 전 미반영)
- **이미지**: `next/image` + `remotePatterns`(GCS + localhost:8080). `getMediaUrl()`로 상대→절대 변환
- **Optimistic UI**: 리액션 토글, 댓글 작성/삭제 (실패 시 롤백)
- **카카오맵**: `useEffect`에서 `window.kakao?.maps` 존재 확인 (SPA 재방문 시 onLoad 미재실행 대응)
- **BGM**: `BgmPlayer.tsx`(전역 오디오, UI 없음) + `BgmMiniPlayer`(홈, hero anchor 기반 위치) + `BgmFloatingPlayer`(비홈 우하단). 스크롤 중 좌표 재계산 금지. **재생은 유저가 음표 토큰을 직접 터치해야만 시작** (`bgmStore.toggle → audio.play()`). 자동재생·unlock 리스너 없음 — OAuth 리다이렉트 중 제스처 소비로 인한 재생 버그 방지
- **체험판**: sessionStorage 기반 가상 데이터. blob URL 무효화 → native Image probe로 감지 → 가이드 흐름(demoGuideStep 0→1→2). `demo_mode` 쿠키 유효성은 `sessionStorage.demoMode === "true"`와 교차 검증 필수 (브라우저 세션 복원으로 쿠키만 남고 sessionStorage는 비워지면 stale 처리 → 쿠키 제거 후 일반 인증 흐름)
- **이미지 다운로드**: 3분기 처리. 데스크톱 → blob `<a download>`, 모바일(iOS·Android Chrome/PWA) → Web Share API, Android 인앱(카카오톡 등) → 백엔드 프록시 `Content-Disposition: attachment`. 인앱 감지는 userAgent 기반(`KAKAOTALK|NAVER` 등). 체험판에서는 다운로드 버튼 비활성화
- **관리자**: `useRequireAdmin()` → 비관리자면 즉시 "/" 리다이렉트
- **알림**: `/notifications` 무한스크롤(IntersectionObserver), 시간 그룹화, 탭 시 `/diary?highlightId=` 이동

## 바텀시트/모달 필수 규칙

모든 바텀시트/모달/오버레이 컴포넌트를 새로 만들거나 수정할 때 반드시 적용할 것.

**body 스크롤 차단** (열릴 때 scrollY 저장 → body position:fixed + top:-scrollY + overflow:hidden, 닫힐 때 스타일 원복 → window.scrollTo(0, scrollY))

- 드래그 핸들이 있으면 touchmove 차단은 `addEventListener('touchmove', fn, { passive: false })`로 등록 (JSX onTouchMove는 passive:true라 preventDefault 불가)

적용 컴포넌트: FilterBottomSheet, CommentBottomSheet, MilestoneDetailModal, MilestoneRecordSheet, DatePickerBottomSheet, **앞으로 새로 만드는 모든 바텀시트/모달**

### 바텀시트 내 텍스트 입력 + 키보드 대응

바텀시트 안에 textarea/input이 있을 때 두 가지를 함께 적용할 것:

**① visualViewport 기반 시트 높이·위치 조정** — `window.visualViewport`의 resize/scroll 이벤트로 keyboardHeight(= innerHeight - vv.height - vv.offsetTop)와 sheetMaxHeight(= vv.height \* 0.96)를 계산해 시트 motion.div의 `bottom`과 `maxHeight`에 적용

**② 입력란 포커스 시 scrollIntoView** — `onFocus`에서 320ms 딜레이 후 `inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })` 호출 (키보드 애니메이션 대기, body fixed 상태에서도 시트 내부 overflow-y-auto 스크롤은 정상 작동)
