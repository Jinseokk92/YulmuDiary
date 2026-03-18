# 율무일기 프로젝트

## 프로젝트 개요

- 육아 일기 공유 서비스 (모노레포)
- `backend/` — Spring Boot 3.4.1, Java 17, PostgreSQL, JPA, Lombok
- `frontend/` — Next.js 15, React 19, Tailwind CSS 3, TypeScript, Zustand

## 개발 환경

- OS: Windows 11 / Gradle: 시스템 설치(scoop), gradlew 없음 → `gradle` 명령어 사용
- DB 로컬: `docker run -d --name yulmudiary-db -p 5432:5432 -e POSTGRES_DB=yulmudiary -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres postgres:16`

## 배포 환경

- 백엔드: Google Cloud Run (`yulmu-backend`, `asia-northeast3`) — 수동 배포 (docker build → push → gcloud run deploy)
- 프론트엔드: Vercel (git push → 자동 배포)
- DB: Neon PostgreSQL (운영, `maximum-pool-size: 5`) / Docker PostgreSQL 16 (로컬)
- 미디어: GCS 버킷 `yulmudiary-media`
- 운영 프로파일: `SPRING_PROFILES_ACTIVE=prod` → `ddl-auto: update`, data.sql 미실행

## 환경 변수

| 변수명 | 설명 |
|--------|------|
| `DB_URL` / `DB_USERNAME` / `DB_PASSWORD` | Neon PostgreSQL |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth2 |
| `KAKAO_CLIENT_ID` | 카카오 REST API 키 |
| `JWT_SECRET_KEY` | HS256 시크릿 (256비트 이상) |
| `GCS_BUCKET_NAME` | `yulmudiary-media` |
| `FRONTEND_URL` | CORS, OAuth2 리다이렉트용 |
| `NEXT_PUBLIC_API_URL` | 백엔드 API URL |
| `NEXT_PUBLIC_KAKAO_JS_KEY` | 카카오 지도 SDK JS 키 |
| `NEXT_PUBLIC_KAKAO_APP_KEY` | 카카오 장소 검색 REST API 키 |

## 백엔드 구조

```
src/main/java/com/yulmudiary/
├── domain/
│   ├── baby/          — Baby, Gender, BabyService, BabyController
│   ├── diary/         — DiaryPost, Comment, Reaction, Media(MediaType)
│   │                    DiaryPostService, CommentService, ReactionService + Controllers
│   ├── family/        — FamilyGroup, FamilyMembership(FamilyRole), FamilyService, FamilyController
│   ├── health/        — HealthController
│   ├── media/         — ImageStorageService(인터페이스)
│   │                    LocalImageStorageServiceImpl(@Profile("local"))
│   │                    GcsImageStorageServiceImpl(@Profile("prod"))
│   │                    MediaUrlResolver(환경별 절대 URL 변환)
│   ├── milestone/     — Milestone, MilestoneService, MilestoneController
│   ├── notification/  — Notification(COMMENT/REACTION), NotificationService, NotificationController
│   ├── album/         — AlbumPhoto, AlbumPhotoFavorite, AlbumPhotoService, AlbumPhotoController
│   ├── schedule/      — Schedule, ScheduleService, ScheduleController
│   └── user/          — User(isAdmin, commentNotificationEnabled, reactionNotificationEnabled)
│                        UserController
└── global/
    ├── admin/         — AdminController, AdminService (초대코드 재발급, 멤버관리, 앱설정)
    ├── auth/          — JwtProvider, JwtAuthenticationFilter, CustomOAuth2UserService
    │                    OAuth2AuthenticationSuccessHandler, AuthController, AuthService
    │                    CheckFamilyAuth+FamilyAuthAspect (AOP 가족그룹 검증)
    │                    annotation/RequireRole + aspect/RequireRoleAspect
    │                    annotation/RequireAdmin + aspect/RequireAdminAspect
    ├── config/        — CorsConfig, JpaAuditingConfig, SecurityConfig, SwaggerConfig
    ├── exception/     — GlobalExceptionHandler, NotFoundException, ForbiddenException 등
    └── response/      — ApiResponse<T>
```

설정 파일: `application.yml` (공통) / `application-local.yml` (로컬 DB, create-drop) / `application-prod.yml` (Neon DB, GCS)

## 프론트엔드 구조

```
src/
├── middleware.ts          — Edge: 쿠키 기반 라우트 가드 (토큰없음→/login, 그룹없음→/onboarding)
├── types/index.ts         — 전체 API 타입 정의
├── stores/
│   ├── authStore.ts       — token/user/familyGroupId (js-cookie 기반)
│   ├── bgmStore.ts        — BGM 재생상태, anchorPos
│   └── uiStore.ts         — SideDrawer / 댓글시트 / 이미지뷰어 / demoGuideStep
├── contexts/
│   ├── UserContext.tsx    — (레거시, Providers에서 유지)
│   └── FontSizeContext.tsx — 돋보기 모드 ("normal"|"large"), <html>.font-large 토글
├── lib/
│   ├── api.ts             — fetch 래퍼, Authorization 헤더 자동 주입
│   ├── bgmAudio.ts        — HTMLAudioElement 싱글톤, 트랙 메타데이터
│   ├── utils.ts           — formatRelativeTime(), getMediaUrl(), calcDday()
│   ├── kakao.ts           — 카카오맵 SDK 초기화
│   └── demoData.ts        — 체험판 가상데이터 (sessionStorage 기반)
├── hooks/
│   ├── useAuth.ts         — useRequireAdmin() 포함 (비관리자면 "/" 리다이렉트)
│   └── usePullToRefresh.ts
├── components/
│   ├── Providers.tsx / MainBackground.tsx / LoginBackground.tsx / FloatingYulmu.tsx
│   ├── DemoBanner.tsx
│   ├── BgmPlayer.tsx      — 전역 오디오 로직 (UI 없음)
│   ├── BgmPlayerUI.tsx    — CollapsedMusicToken 공용 UI
│   ├── BgmMiniPlayer.tsx  — 홈 전용 (hero anchor 기반 위치)
│   ├── BgmFloatingPlayer.tsx — 비홈 우하단 고정
│   ├── layout/            — Header, BottomNav, SideDrawer
│   ├── ui/                — Skeleton, EmptyState, ConfirmModal, UserAvatar,
│   │                        PullToRefreshIndicator, DatePickerSheet
│   ├── activity/          — PostDetailModal, SquareThumbnailCell
│   ├── album/             — AlbumGrid
│   └── diary/             — DiaryFeed, DiaryCard, FilterBar, Pagination
│                            ImageCarousel, ImageViewer, ImagePreview
│                            ReactionBar, ReactionUsersSheet, StickerPicker
│                            CommentBottomSheet, CommentSection
└── app/
    ├── layout.tsx / error.tsx
    ├── login/             — 카카오·Google·체험하기 버튼
    ├── auth/callback/ + success/
    ├── onboarding/
    ├── new/               — 글 작성 (독립 레이아웃)
    └── (main)/            — Header+BottomNav 포함 Route Group
        ├── page.tsx       — 홈 (D-day, 퀵메뉴, BGM anchor)
        ├── diary/         — 일기 피드 (?highlightId= flash 처리)
        ├── album/ + favorites/ + [id]/
        ├── milestones/    — 지하철 노선도 스타일 이정표
        ├── family-manage/ — 관리자 전용 (초대코드·멤버·앱설정)
        ├── my-posts/ + my-comments/ + my-reactions/
        ├── notifications/ — 무한스크롤, 시간 그룹화
        ├── settings/notifications/
        ├── schedule/      — 캘린더 + 카카오맵
        └── join/          — 초대코드 입력
```

## API 구현 상태

| 도메인 | 엔드포인트 | 비고 |
|--------|-----------|------|
| Auth | `GET /api/auth/me`, `POST /api/auth/refresh` | |
| FamilyGroup | `POST /api/family-group/join` | |
| DiaryPost | CRUD `/api/diary-posts`, `/api/diary-posts/{id}` | Cursor 페이징 |
| Comment | GET/POST/DELETE `/api/diary-posts/{postId}/comments/{commentId?}` | |
| Reaction | `POST /api/diary-posts/{postId}/reactions` | 토글 |
| Notification | `GET /api/notifications`, `PATCH .../read-all`, `PATCH .../{id}/read` | Cursor 무한스크롤 |
| Milestone | `GET /api/milestones`, `PATCH .../{id}/achieve`, `DELETE .../{id}/achieve` | |
| Album | `GET/POST /api/album/photos`, `GET .../favorites`, `PATCH .../{id}/favorite` | |
| Schedule | GET(월별)/POST/PUT/DELETE `/api/schedules` | |
| User | GET(목록)/PUT(정보·프로필사진)/GET(stats·comments·reactions) `/api/users/me/...` | |
| Media | `POST /api/media/upload`, `GET /api/media/files/...` | |
| Admin | `GET/POST /api/admin/invite-codes`, `GET/DELETE .../members`, `DELETE .../diary-posts/{id}`, `GET/PATCH .../app-settings` | `@RequireAdmin` |

## 설계 원칙

### 백엔드

- **응답**: `ApiResponse<T>` (`{data, error}`) 래핑. NotFoundException→404, ForbiddenException→403, InvalidTokenException→401
- **JWT**: Access Token 30분 (Bearer), Refresh Token 7일 (HttpOnly 쿠키 `refresh_token`)
- **OAuth2 흐름**: 소셜 로그인 → JWT 발급 → `{redirectUri}?token=...` 리다이렉트 → `/auth/callback` → `/auth/success` (2.3초) → `/diary` 또는 `/onboarding`
- **SecurityConfig**: `STATELESS` + `NullRequestCache` (Cloud Run 경로 유실 방지). 공개: `/api/health`, `/api/media/files/**`, `GET /api/users`, OAuth2 경로, `/api/auth/refresh`, Swagger
- **미디어**: `ImageStorageService.store()` → 항상 절대 URL 반환. `MediaUrlResolver`로 DB URL 형태 판별 변환
- **페이징**: Cursor(ID 역순, size+1로 hasNext 판별), N+1 방지(fetch join, `default_batch_fetch_size: 100`)
- **권한 AOP**: `@CheckFamilyAuth`(가족그룹 소속), `@RequireRole`(FamilyRole), `@RequireAdmin`(isAdmin 검증)
- **기타**: multipart 10MB/50MB, babyId=1 하드코딩 유지

### 프론트엔드

- **다크모드**: `darkMode: "class"` + next-themes. `dark:` prefix 대신 `isDark = mounted && resolvedTheme === "dark"` 분기 사용 (Tailwind dark: prefix는 dev 재시작 전 미반영)
- **이미지**: `next/image` + `remotePatterns`(GCS + localhost:8080). `getMediaUrl()`로 상대→절대 변환
- **Optimistic UI**: 리액션 토글, 댓글 작성/삭제 (실패 시 롤백)
- **카카오맵**: `useEffect`에서 `window.kakao?.maps` 존재 확인 (SPA 재방문 시 onLoad 미재실행 대응)
- **BGM**: `BgmPlayer.tsx`(전역 오디오, UI 없음) + `BgmMiniPlayer`(홈, hero anchor 기반 위치) + `BgmFloatingPlayer`(비홈 우하단). 스크롤 중 좌표 재계산 금지
- **체험판**: sessionStorage 기반 가상 데이터. blob URL 무효화 → native Image probe로 감지 → 가이드 흐름(demoGuideStep 0→1→2)
- **관리자**: `useRequireAdmin()` → 비관리자면 즉시 "/" 리다이렉트
- **알림**: `/notifications` 무한스크롤(IntersectionObserver), 시간 그룹화, 탭 시 `/diary?highlightId=` 이동

## 바텀시트/모달 필수 규칙

모든 바텀시트, 모달, 오버레이 컴포넌트를 새로 만들거나 수정할 때
반드시 아래 body 스크롤 차단 로직을 포함할 것:

- 열릴 때: scrollY 저장 → body position: fixed, top: -scrollY, width: 100%
- 닫힐 때: body 스타일 원복 → window.scrollTo(0, scrollY)
- 드래그 핸들이 있는 경우: addEventListener('touchmove', handler, { passive: false })로 등록
- React의 onTouchMove JSX prop은 passive: true라서 preventDefault() 불가 → 반드시 addEventListener 사용

```typescript
useEffect(() => {
  const scrollY = window.scrollY;
  document.body.style.position = "fixed";
  document.body.style.top = `-${scrollY}px`;
  document.body.style.left = "0";
  document.body.style.right = "0";
  document.body.style.overflow = "hidden";
  const prevent = (e: TouchEvent) => e.preventDefault();
  document.addEventListener("touchmove", prevent, { passive: false });
  return () => {
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.overflow = "";
    document.removeEventListener("touchmove", prevent);
    window.scrollTo(0, scrollY);
  };
}, []);
```

이 규칙이 적용되어야 하는 컴포넌트 목록:
- FilterBottomSheet (필터)
- CommentBottomSheet (댓글)
- MilestoneDetailModal (이정표 상세)
- MilestoneRecordSheet (이정표 기록하기)
- DatePickerBottomSheet (날짜 선택)
- 앞으로 새로 만드는 모든 바텀시트/모달

## 주의사항 (Claude 필독)

- `application-prod.yml`, `application-local.yml`, `application.yml` 등 환경 설정 파일은 절대 자의적으로 삭제하거나 덮어쓰지 말 것.
- 설정 파일 수정이 필요한 경우 반드시 사용자에게 먼저 확인 후 진행할 것.
- `.env`, `*.yml`, `*.yaml`, `*.properties` 등 설정/시크릿 관련 파일은 생성·수정·삭제 전 항상 사용자 승인을 받을 것.

## 보안 이슈

- **[DONE]** Cookie Secure: prod 시 자동 true 처리 완료
- **[MED]** FamilyGroup 접근 제어: `@CheckFamilyAuth` 일부 구현, 전체 엔드포인트 적용 여부 확인 필요
- **[MED]** 파일 업로드 검증: `getContentType()`은 위조 가능 → 바이트 매직 넘버 검증 미구현
- **[INFO]** 운영 초대 코드: data.sql 운영 미실행 → 직접 INSERT 필요

## 향후 구현 예정

| 항목 | 설명 |
|------|------|
| FCM 기기 푸시 알림 | 인앱 알림은 구현됨. 기기 푸시는 미구현 (Firebase SDK, 디바이스 토큰 등록 필요) |
| 파일 업로드 매직 넘버 검증 | 이미지 바이트 검증 로직 추가 필요 |
