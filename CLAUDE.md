# 율무일기 프로젝트

## 프로젝트 개요
- 육아 일기 공유 서비스 (모노레포 구조)
- `backend/` — Spring Boot 3.4.1, Java 17, PostgreSQL, JPA, Lombok
- `frontend/` — Next.js 15, React 19, Tailwind CSS 3, TypeScript

## 개발 환경
- OS: Windows 11
- IDE: IntelliJ (백엔드), VS Code (프론트엔드)
- DB: Docker로 PostgreSQL 16 실행 (로컬)
  ```bash
  docker run -d --name yulmudiary-db -p 5432:5432 -e POSTGRES_DB=yulmudiary -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres postgres:16
  ```
- Gradle: 시스템 설치 (scoop), gradlew 없음 → `gradle` 명령어 사용
- Node: npm 사용
- 언어: 한국어로 응답

## 배포 환경
- 백엔드: Google Cloud Run (`yulmu-backend`, `asia-northeast3`)
  - 이미지: Artifact Registry (`asia-northeast3-docker.pkg.dev/project-e40f8456-38b6-457a-97a/docker-repo/backend-api`)
  - 수동 배포: `cd backend` → `docker build` → `docker push` → `gcloud run deploy`
- 프론트엔드: Vercel (git push → 자동 배포)
- DB: Neon PostgreSQL (운영), Docker PostgreSQL 16 (로컬)
  - Neon 무료 플랜: `maximum-pool-size: 5`
- 운영 프로파일: `application-prod.yml` (`SPRING_PROFILES_ACTIVE=prod`)
  - `ddl-auto: update`, `sql.init.mode: never` (data.sql 미실행)

## 백엔드 구조
```
backend/
├── Dockerfile
├── build.gradle
├── src/main/java/com/yulmudiary/
│   ├── YulmuDiaryApplication.java
│   ├── domain/
│   │   ├── baby/
│   │   │   ├── entity/ (Baby, Gender)
│   │   │   ├── dto/ (BabyResponse)
│   │   │   ├── service/ (BabyService)
│   │   │   ├── controller/ (BabyController)
│   │   │   └── repository/ (BabyRepository)
│   │   ├── diary/
│   │   │   ├── entity/ (DiaryPost, Comment, Reaction, Media, MediaType)
│   │   │   ├── repository/ (DiaryPostRepository, CommentRepository, ReactionRepository)
│   │   │   ├── dto/ (DiaryPostRequest/Response/PageResponse, CommentRequest/Response, ReactionRequest/Response)
│   │   │   ├── service/ (DiaryPostService, CommentService, ReactionService)
│   │   │   └── controller/ (DiaryPostController, CommentController, ReactionController)
│   │   ├── family/
│   │   │   ├── entity/ (FamilyGroup, FamilyMembership, FamilyRole)
│   │   │   ├── dto/ (FamilyJoinRequest, FamilyJoinResponse)
│   │   │   ├── repository/ (FamilyGroupRepository, FamilyMembershipRepository)
│   │   │   ├── service/ (FamilyService)
│   │   │   └── controller/ (FamilyController)
│   │   ├── health/
│   │   │   └── HealthController.java
│   │   ├── media/
│   │   │   ├── controller/ (MediaController)
│   │   │   ├── dto/ (MediaUploadResponse, ImagePaths)
│   │   │   └── service/ (ImageStorageService, LocalImageStorageServiceImpl)
│   │   ├── schedule/
│   │   │   ├── entity/ (Schedule)
│   │   │   ├── dto/ (ScheduleRequest, ScheduleResponse)
│   │   │   ├── repository/ (ScheduleRepository)
│   │   │   ├── service/ (ScheduleService)
│   │   │   └── controller/ (ScheduleController)
│   │   └── user/
│   │       ├── entity/ (User, Role)
│   │       ├── repository/ (UserRepository)
│   │       ├── dto/ (UserResponse)
│   │       └── controller/ (UserController)
│   └── global/
│       ├── auth/
│       │   ├── JwtProvider.java               — JWT 생성/검증 (HS256, subject=userId)
│       │   ├── JwtAuthenticationFilter.java   — Bearer 토큰 파싱 → SecurityContext 설정
│       │   ├── CustomOAuth2UserService.java   — Google/Kakao 사용자 정보 로드 및 DB upsert
│       │   ├── CustomOAuth2User.java
│       │   ├── OAuth2Attributes.java          — provider별 속성 정규화
│       │   ├── OAuth2AuthenticationSuccessHandler.java — 로그인 성공 시 JWT 발급 + 리다이렉트
│       │   ├── AuthController.java            — /api/auth/me, /api/auth/refresh
│       │   ├── AuthService.java
│       │   ├── AuthTarget.java
│       │   ├── CheckFamilyAuth.java           — 가족 그룹 접근 제어 어노테이션
│       │   ├── FamilyAuthAspect.java          — AOP 기반 가족 그룹 검증
│       │   ├── InvalidTokenException.java
│       │   └── dto/ (AuthMeResponse, TokenRefreshResponse)
│       ├── config/ (CorsConfig, JpaAuditingConfig, SecurityConfig, SwaggerConfig)
│       ├── entity/ (BaseTimeEntity)
│       ├── exception/ (GlobalExceptionHandler, AlreadyMemberException, FamilyAuthorizationException)
│       └── response/ (ApiResponse)
└── src/main/resources/
    ├── application.yml          — 공통 설정 (JWT, multipart, Tomcat)
    ├── application-local.yml    — 로컬 DB, ddl-auto: create-drop
    ├── application-prod.yml     — Neon DB 환경변수, ddl-auto: update
    └── data.sql                 — 시드 데이터 (로컬 전용, 운영 미실행)
```

## 프론트엔드 구조
```
frontend/
├── Dockerfile                — Next.js standalone 빌드 (Cloud Run 대응)
├── package.json              — next 15, react 19, react-kakao-maps-sdk, zustand
├── next.config.ts            — PWA 설정
├── tailwind.config.ts        — primary 컬러 (#e4701e 계열), Pretendard 폰트
├── tsconfig.json             — @/* → ./src/* 경로 별칭
└── src/
    ├── types/index.ts        — API 타입 (ApiResponse, UserResponse, DiaryPostResponse 등)
    ├── lib/
    │   ├── api.ts            — fetch 래퍼 (Authorization 헤더 자동 주입, ApiError 통일)
    │   └── utils.ts          — formatRelativeTime(), getMediaUrl()
    ├── contexts/
    │   └── UserContext.tsx   — 로그인 사용자 상태 관리 (JWT 기반)
    ├── components/
    │   ├── layout/
    │   │   ├── Header.tsx    — 로고 + 유저 선택 드롭다운
    │   │   └── BottomNav.tsx — 4탭: 홈(/), 일기장(/diary), 일정(/schedule), 새 글(/new)
    │   ├── ui/
    │   │   ├── Skeleton.tsx
    │   │   ├── EmptyState.tsx
    │   │   └── ConfirmModal.tsx  — 삭제 확인 등 범용 모달
    │   └── diary/
    │       ├── DiaryFeed.tsx         — 무한스크롤 피드 (IntersectionObserver sentinel)
    │       ├── DiaryCard.tsx         — 일기 카드 (memo), 좋아요·삭제 인라인 처리
    │       ├── DiaryPostSkeleton.tsx
    │       ├── ImageCarousel.tsx     — CSS scroll-snap 스와이프
    │       ├── ImagePreview.tsx      — 작성 시 썸네일 프리뷰
    │       ├── CommentBottomSheet.tsx — 댓글 바텀 시트 (상태·로직·레이아웃 전담)
    │       └── CommentSection.tsx    — 댓글 목록 순수 표시 컴포넌트
    └── app/
        ├── layout.tsx            — 루트: UserProvider
        ├── error.tsx             — 전역 에러 바운더리
        ├── login/
        │   └── page.tsx          — 소셜 로그인 페이지 (Google, Kakao)
        ├── auth/
        │   └── callback/page.tsx — OAuth2 콜백: URL 쿼리파라미터 token → localStorage 저장
        ├── (main)/               — Route Group: Header + BottomNav 포함
        │   ├── layout.tsx        — 공통 셸 (max-w-lg mx-auto)
        │   ├── page.tsx          — "/" 홈 대시보드 (D-day, 퀵메뉴)
        │   ├── loading.tsx
        │   ├── diary/
        │   │   ├── page.tsx      — "/diary" 일기 피드
        │   │   ├── loading.tsx
        │   │   └── error.tsx
        │   └── schedule/
        │       └── page.tsx      — "/schedule" 일정 캘린더 + 카카오맵 장소 검색
        └── new/
            └── page.tsx          — "/new" 글 작성 (독립 레이아웃)
```

## API 구현 상태

### Auth
- `GET /api/auth/me` — 내 정보 조회 (JWT 필요, familyGroupId 포함)
- `POST /api/auth/refresh` — Access Token 재발급 (refresh_token 쿠키)

### FamilyGroup
- `POST /api/family-group/join` — 초대 코드로 가족 그룹 합류 (JWT 필요)
  - 입력값 null 체크 → trim().toUpperCase() 정규화 → DB 조회 → 2차 비교 + 로그

### DiaryPost CRUD
- `POST /api/diary-posts` — 생성
- `GET /api/diary-posts/{id}` — 단건 조회 (fetch join: author + mediaList)
- `GET /api/diary-posts?babyId=&cursor=&size=` — 목록 (Cursor 페이징)
- `PUT /api/diary-posts/{id}` — 수정 (작성자 검증)
- `DELETE /api/diary-posts/{id}` — 삭제 (작성자 검증)

### Comment
- `GET /api/diary-posts/{postId}/comments` — 댓글 목록
- `POST /api/diary-posts/{postId}/comments` — 댓글 작성
- `DELETE /api/diary-posts/{postId}/comments/{commentId}` — 댓글 삭제

### Reaction
- `POST /api/diary-posts/{postId}/reactions` — 토글 (있으면 삭제, 없으면 추가)

### Schedule
- `GET /api/schedules?year=&month=` — 월별 조회
- `POST /api/schedules` — 등록
- `PUT /api/schedules/{id}` — 수정 (작성자 검증)
- `DELETE /api/schedules/{id}` — 삭제 (작성자 검증)

### User
- `GET /api/users` — 사용자 목록 조회 (permitAll)

### Media
- `POST /api/media/upload` — 파일 업로드 (MultipartFile, UUID 파일명)
- `GET /api/media/files/{filename}` — 파일 서빙 (permitAll)

## 설계 원칙

### 백엔드
- 모든 응답: `ApiResponse<T>` 래핑
- 인증: JWT Bearer Token (`Authorization: Bearer {accessToken}`)
  - Access Token: 30분, Refresh Token: 7일 (HttpOnly 쿠키)
  - `JwtAuthenticationFilter`: `validateToken()` try-catch로 예외 처리 → 실패 시 즉시 401 반환
- OAuth2 로그인 성공 흐름: 소셜 로그인 → `OAuth2AuthenticationSuccessHandler` → JWT 발급 → `{redirectUri}?token={accessToken}` 리다이렉트 + refresh_token 쿠키 설정
- EntityNotFoundException → 404, IllegalArgumentException → 400
- Cursor 페이징: ID 역순, size+1 조회로 hasNext 판별
- N+1 방지: fetch join, `default_batch_fetch_size: 100`
- DiaryPostResponse에 commentCount, reactions 포함 (프론트 피드용)
- Swagger: `http://localhost:8080/swagger-ui/index.html`
- multipart: max-file-size 10MB, max-request-size 50MB
- 미디어 저장: `./uploads` 로컬 디렉토리

### SecurityConfig 핵심 설정
- `SessionCreationPolicy.STATELESS` + `NullRequestCache` — Cloud Run 환경에서 RequestCache 경로 유실 방지
- `exceptionHandling`: 인증 실패 → 401 JSON, 권한 없음 → 403 JSON (OAuth2 리다이렉트 방지)
- 공개 엔드포인트: `/api/health`, `/api/media/files/**`, `GET /api/users`, `/oauth2/**`, `/login/oauth2/**`, `/api/auth/refresh`, `/swagger-ui/**`, `/v3/api-docs/**`
- 나머지 `/api/**`: `.authenticated()`

### 가족 그룹 접근 제어 (AOP)
- `@CheckFamilyAuth(target = AuthTarget.BABY/POST)` 어노테이션 + `FamilyAuthAspect`
- 일기 작성·조회 시 요청자가 해당 family_group 소속인지 검증

### 프론트엔드
- Next.js App Router (Route Group 활용)
- api.ts: fetch 기반, `Authorization: Bearer {token}` 자동 주입 (localStorage)
- 카카오맵 SDK (`react-kakao-maps-sdk`):
  - 환경변수: `NEXT_PUBLIC_KAKAO_JS_KEY` (지도 SDK용 JavaScript 키)
  - 환경변수: `NEXT_PUBLIC_KAKAO_APP_KEY` (장소 검색 REST API 키, `KakaoAK` 헤더)
  - **주의**: `<Script strategy="afterInteractive" onLoad=...>`는 SPA 재방문 시 재실행 안 됨
    → `useEffect`에서 `window.kakao?.maps` 존재 여부 확인으로 `kakaoMapReady` 초기화 보완
  - 카카오 개발자 센터 Web 플랫폼에 Vercel 도메인 등록 필수
- Optimistic UI: 리액션 토글, 댓글 작성/삭제 (실패 시 롤백)
- 이미지 업로드: 개별 파일 병렬 업로드 (Promise.all), 최대 10장
- 삭제: ConfirmModal 확인 후 API 호출 → 피드 state에서 즉시 제거

### 댓글 바텀 시트 아키텍처
- `CommentBottomSheet` — 댓글 관련 모든 책임 보유
  - 무한 스크롤: `useInView` + sentinel div
  - 부모 스크롤 잠금: `document.body.style.overflow = 'hidden'`
  - 슬라이드 애니메이션: `translate-y-0 / translate-y-full` (duration-300)
- `CommentSection` — 순수 표시 컴포넌트 (props만 받아 렌더)

### 일정 캘린더 아키텍처 (`/schedule`)
- `ScheduleSheet` 내장 바텀 시트: 일정 목록 + 등록 폼 + 카카오맵 장소 검색
  - 장소 선택 후 지도 미리보기 (`KakaoMap` + `KakaoMarker`)
  - 지도 렌더링 조건: `kakaoMapReady && selectedCoords && window.kakao?.maps`
- 달력 그리드: `grid grid-cols-7`, dot 최대 3개 표시
- BottomNav 4탭: 홈 | 일기장 | 일정 | 새 글

## 주의사항 (Claude 필독)
- `application-prod.yml`, `application-local.yml`, `application.yml` 등 환경 설정 파일은 절대 자의적으로 삭제하거나 덮어쓰지 말 것.
- 설정 파일 수정이 필요한 경우 반드시 사용자에게 먼저 확인 후 진행할 것.
- `.env`, `*.yml`, `*.yaml`, `*.properties` 등 설정/시크릿 관련 파일은 생성·수정·삭제 전 항상 사용자 승인을 받을 것.

## 미해결 / TODO
- `Cookie.setSecure(false)` → 운영 환경에서 `true`로 변경 필요 (`OAuth2AuthenticationSuccessHandler.java:48`)
- babyId=1 하드코딩 유지 (율무 한 명이므로 Baby 선택 UI 불필요)
- 운영 DB에 초대 코드 시드 데이터 직접 INSERT 필요 (`data.sql` 운영 미실행)

## 보안 이슈
- **Cookie Secure 미설정**: `OAuth2AuthenticationSuccessHandler`에서 `cookie.setSecure(false)` → HTTPS 운영 환경에서 `true`로 변경 필요
- **FamilyGroup 접근 제어**: `@CheckFamilyAuth` AOP로 일부 구현됐으나, 모든 엔드포인트 적용 여부 확인 필요
