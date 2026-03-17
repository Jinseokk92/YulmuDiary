# 율무일기 프로젝트

## 프로젝트 개요

- 육아 일기 공유 서비스 (모노레포 구조)
- `backend/` — Spring Boot 3.4.1, Java 17, PostgreSQL, JPA, Lombok
- `frontend/` — Next.js 15, React 19, Tailwind CSS 3, TypeScript, Zustand

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
- 미디어 저장소: Google Cloud Storage (GCS) — 버킷: `yulmudiary-media`
- 운영 프로파일: `application-prod.yml` (`SPRING_PROFILES_ACTIVE=prod`)
  - `ddl-auto: update`, `sql.init.mode: never` (data.sql 미실행)

## 환경 변수

### 백엔드 (Cloud Run 시크릿 / 로컬 .env)

| 변수명                   | 설명                                     |
| ------------------------ | ---------------------------------------- |
| `DB_URL`                 | Neon PostgreSQL JDBC URL                 |
| `DB_USERNAME`            | DB 사용자명                              |
| `DB_PASSWORD`            | DB 비밀번호                              |
| `GOOGLE_CLIENT_ID`       | Google OAuth2 클라이언트 ID              |
| `GOOGLE_CLIENT_SECRET`   | Google OAuth2 클라이언트 시크릿          |
| `KAKAO_CLIENT_ID`        | 카카오 REST API 키                       |
| `JWT_SECRET_KEY`         | HS256 서명 시크릿 (256비트 이상)         |
| `GCS_BUCKET_NAME`        | GCS 버킷 이름 (`yulmudiary-media`)       |
| `FRONTEND_URL`           | 프론트엔드 URL (CORS, OAuth2 리다이렉트) |
| `SPRING_PROFILES_ACTIVE` | `prod` (운영) / `local` (로컬)           |

### 프론트엔드 (Vercel 환경변수 / 로컬 .env.local)

| 변수명                      | 설명                                                     |
| --------------------------- | -------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`       | 백엔드 API URL (예: `https://yulmu-backend-xxx.run.app`) |
| `NEXT_PUBLIC_KAKAO_JS_KEY`  | 카카오 지도 SDK용 JavaScript 키                          |
| `NEXT_PUBLIC_KAKAO_APP_KEY` | 카카오 장소 검색 REST API 키 (`KakaoAK` 헤더)            |

## 백엔드 구조

```
backend/
├── Dockerfile
├── build.gradle
└── src/main/java/com/yulmudiary/
    ├── YulmuDiaryApplication.java
    ├── domain/
    │   ├── baby/
    │   │   ├── entity/ (Baby, Gender)
    │   │   ├── dto/ (BabyResponse)
    │   │   ├── service/ (BabyService)
    │   │   ├── controller/ (BabyController)
    │   │   └── repository/ (BabyRepository)
    │   ├── diary/
    │   │   ├── entity/ (DiaryPost, Comment, Reaction, Media, MediaType)
    │   │   ├── repository/ (DiaryPostRepository, CommentRepository, ReactionRepository)
    │   │   ├── dto/ (DiaryPostRequest/Response/PageResponse, CommentRequest/Response, ReactionRequest/Response)
    │   │   ├── service/ (DiaryPostService, CommentService, ReactionService)
    │   │   └── controller/ (DiaryPostController, CommentController, ReactionController)
    │   ├── family/
    │   │   ├── entity/ (FamilyGroup, FamilyMembership, FamilyRole)
    │   │   ├── dto/ (FamilyCreateRequest, FamilyJoinRequest, FamilyJoinResponse, FamilyGroupResponse, FamilyMembershipResponse)
    │   │   ├── repository/ (FamilyGroupRepository, FamilyMembershipRepository)
    │   │   ├── service/ (FamilyService)
    │   │   └── controller/ (FamilyController)
    │   ├── health/
    │   │   └── HealthController.java
    │   ├── media/
    │   │   ├── controller/ (MediaController)
    │   │   ├── dto/ (MediaUploadResponse, ImagePaths)
    │   │   └── service/
    │   │       ├── ImageStorageService.java          — 업로드 인터페이스 (store)
    │   │       ├── LocalImageStorageServiceImpl.java — @Profile("local"), 로컬 파일 저장
    │   │       ├── GcsImageStorageServiceImpl.java   — @Profile("prod"), GCS 스트리밍 업로드
    │   │       └── MediaUrlResolver.java             — 환경별 절대 URL 변환
    │   ├── schedule/
    │   │   ├── entity/ (Schedule)
    │   │   ├── dto/ (ScheduleRequest, ScheduleResponse)
    │   │   ├── repository/ (ScheduleRepository)
    │   │   ├── service/ (ScheduleService)
    │   │   └── controller/ (ScheduleController)
    │   └── user/
    │       ├── entity/ (User, Role)
    │       ├── repository/ (UserRepository)
    │       ├── dto/ (UserResponse)
    │       └── controller/ (UserController)
    └── global/
        ├── auth/
        │   ├── JwtProvider.java                      — JWT 생성/검증 (HS256, subject=userId)
        │   ├── JwtAuthenticationFilter.java          — Bearer 토큰 파싱 → SecurityContext 설정
        │   ├── CustomOAuth2UserService.java          — Google/Kakao 사용자 정보 로드 및 DB upsert
        │   ├── CustomOAuth2User.java
        │   ├── OAuth2Attributes.java                 — provider별 속성 정규화
        │   ├── OAuth2AuthenticationSuccessHandler.java — JWT 발급 + 리다이렉트 + refresh cookie
        │   ├── AuthController.java                   — /api/auth/me, /api/auth/refresh
        │   ├── AuthService.java
        │   ├── AuthTarget.java
        │   ├── CheckFamilyAuth.java                  — 가족 그룹 접근 제어 어노테이션
        │   ├── FamilyAuthAspect.java                 — AOP 기반 가족 그룹 검증
        │   ├── InvalidTokenException.java
        │   ├── annotation/RequireRole.java           — FamilyRole 기반 권한 어노테이션
        │   ├── aspect/RequireRoleAspect.java         — @RequireRole AOP 처리
        │   └── dto/ (AuthMeResponse, TokenRefreshResponse)
        ├── config/ (CorsConfig, JpaAuditingConfig, SecurityConfig, SwaggerConfig)
        ├── entity/ (BaseTimeEntity)
        ├── exception/
        │   ├── GlobalExceptionHandler.java           — 전역 예외 처리
        │   ├── AlreadyMemberException.java
        │   ├── FamilyAuthorizationException.java
        │   ├── ForbiddenException.java
        │   └── NotFoundException.java
        └── response/ (ApiResponse)
```

### 설정 파일

```
backend/src/main/resources/
├── application.yml          — 공통 (JWT, multipart, Tomcat, base-url 로컬 기본값)
├── application-local.yml    — 로컬 DB, ddl-auto: create-drop, data.sql 실행
├── application-prod.yml     — Neon DB 환경변수, ddl-auto: update, GCS base-url
└── data.sql                 — 시드 데이터 (로컬 전용, 운영 미실행)
```

## 프론트엔드 구조

```
frontend/
├── Dockerfile                — Next.js standalone 빌드 (Cloud Run 대응)
├── package.json              — next 15, react 19, framer-motion, react-kakao-maps-sdk, zustand, js-cookie, next-themes, next-pwa
├── next.config.ts            — PWA 설정, images.remotePatterns (GCS + localhost:8080)
├── tailwind.config.ts        — darkMode: "class", primary 컬러 (#e4701e 계열), Pretendard 폰트
├── tsconfig.json             — @/* → ./src/* 경로 별칭
└── src/
    ├── middleware.ts         — Edge 미들웨어: 쿠키 기반 라우트 가드
    ├── types/index.ts        — API 타입 (ApiResponse, UserResponse, DiaryPostResponse, NotificationResponse 등)
    ├── stores/
    │   ├── authStore.ts      — Zustand: token/user/familyGroupId 전역 상태 (Cookies 기반)
    │   ├── bgmStore.ts       — Zustand: BGM 재생 상태, 시간, 볼륨, 홈 anchorPos
    │   └── uiStore.ts        — Zustand: SideDrawer / 댓글 시트 / 이미지 뷰어 / 체험판 가이드 단계 전역 UI 상태
    ├── contexts/
    │   ├── UserContext.tsx   — (레거시) useAuthStore로 대체됨, Providers에서 유지
    │   └── FontSizeContext.tsx — 돋보기(글자 확대) 모드 관리, `<html>.font-large` 클래스 토글
    ├── lib/
    │   ├── api.ts            — fetch 래퍼 (Authorization 헤더 자동 주입, ApiError 통일)
    │   ├── bgmAudio.ts       — 전역 Audio 싱글톤 + 트랙 메타데이터 + formatTime()
    │   ├── utils.ts          — formatRelativeTime(), getMediaUrl(), calcDday() 등
    │   ├── kakao.ts          — 카카오맵 SDK 초기화 유틸
    │   └── demoData.ts       — 체험판 가상 데이터 생성/초기화 (sessionStorage 기반)
    ├── hooks/
    │   ├── useAuth.ts            — 인증 상태 훅
    │   └── usePullToRefresh.ts   — 당겨서 새로고침 훅 (threshold, onRefresh, disabled)
    ├── components/
    │   ├── Providers.tsx         — ThemeProvider(next-themes) + UserProvider + FontSizeProvider 래핑
    │   ├── MainBackground.tsx    — 다크(별 30개) / 라이트(구름 2개) 애니메이션 배경
    │   ├── LoginBackground.tsx   — 로그인 페이지 전용 배경
    │   ├── FloatingYulmu.tsx     — 캐릭터 플로팅 컴포넌트
    │   ├── DemoBanner.tsx        — 체험판 모드 진행 중 상단 배너
    │   ├── BgmPlayer.tsx         — 전역 오디오 로직 전담 (autoplay + 첫 제스처 fallback + DOM 이벤트 동기화)
    │   ├── BgmPlayerUI.tsx       — 홈/비홈 공용 축소 토큰 UI + 앨범아트/아이콘/유리판 스타일
    │   ├── BgmMiniPlayer.tsx     — 홈 전용 BGM 플레이어 (hero anchor 기반 collapsed 토큰 + expanded 플레이어)
    │   ├── BgmFloatingPlayer.tsx — 비홈 전용 우하단 플레이어 (collapsed 토큰 + expanded 플레이어)
    │   ├── layout/
    │   │   ├── Header.tsx    — 로고 + 유저 아바타/닉네임 + 햄버거 메뉴
    │   │   │                   가이드 말풍선 + 돋보기 버튼(FontSizeContext 연동)
    │   │   │                   체험판 Step 1 가이드: 오렌지 펄스링 + 툴팁 + 다크 오버레이 포털(z-[25]) + 건너뛰기 다이얼로그
    │   │   ├── BottomNav.tsx — 4탭: 홈(/), 일기장(/diary), 일정(/schedule), 새 글(/new)
    │   │   └── SideDrawer.tsx — 우측 슬라이드 드로어: 다크모드 토글 + 로그아웃
    │   │                        체험판 초기화 버튼(푸터) + Step 2 가이드: 오렌지 펄스링 + 위쪽 툴팁
    │   ├── ui/
    │   │   ├── Skeleton.tsx
    │   │   ├── EmptyState.tsx
    │   │   ├── ConfirmModal.tsx          — 삭제 확인 등 범용 모달
    │   │   ├── UserAvatar.tsx           — 프로필 이미지 / 이니셜 폴백
    │   │   └── PullToRefreshIndicator.tsx — 당겨서 새로고침 스피너 UI
    │   ├── activity/
    │   │   ├── PostDetailModal.tsx      — 게시글 상세 모달 (my-posts 등에서 사용)
    │   │   └── SquareThumbnailCell.tsx  — 정사각 썸네일 셀 (앨범/활동 그리드용)
    │   ├── album/
    │   │   └── AlbumGrid.tsx            — 앨범 이미지 그리드
    │   └── diary/
    │       ├── DiaryFeed.tsx         — 페이지네이션 피드 + 당겨서 새로고침 (usePullToRefresh)
    │       ├── DiaryCard.tsx         — 일기 카드 (memo), 좋아요·삭제 인라인 처리
    │       │                           highlight prop: 알림에서 이동 시 오렌지 flash + scrollIntoView
    │       ├── DiaryPostSkeleton.tsx
    │       ├── FilterBar.tsx         — 일기 피드 필터 (범위: 전체/사용자별/날짜범위, 정렬: 최신/오래된순)
    │       │                           바텀시트 UI, 모바일 스크롤 잠금(position:fixed + touchmove 차단)
    │       ├── Pagination.tsx        — 페이지 번호 네비게이션
    │       ├── ImageCarousel.tsx     — Framer Motion 스와이프, next/image, per-index 에러 폴백
    │       │                           마운트 시 native Image probe로 blob URL 유효성 검사 → 체험판 가이드 트리거
    │       ├── ImageViewer.tsx       — 전체화면 이미지 뷰어 (createPortal)
    │       │                           핀치줌(최대 5x), 패닝, 더블탭 하트, 아래 스와이프 닫기
    │       │                           좌우 30% 탭 존(onPointerDown): 핀치줌 후에도 이미지 이동 보장
    │       │                           touchstart passive:false + 2터치 preventDefault → iOS 브라우저 자체 줌 차단
    │       ├── ImagePreview.tsx      — 작성 시 썸네일 프리뷰
    │       ├── ReactionBar.tsx       — 이모지 리액션 표시 바
    │       ├── StickerPicker.tsx     — 이모지 스티커 선택 UI
    │       ├── CommentBottomSheet.tsx — 댓글 바텀 시트 (상태·로직·레이아웃 전담)
    │       └── CommentSection.tsx    — 댓글 목록 순수 표시 컴포넌트
    └── app/
        ├── layout.tsx            — 루트: Providers + BgmPlayer 전역 마운트
        ├── error.tsx             — 전역 에러 바운더리
        ├── login/
        │   └── page.tsx          — 소셜 로그인 페이지 (카카오 → Google → 체험하기 full-width 버튼 3개)
        │                           체험하기 버튼: 베이지 배경(#FFF3E8) + 점선 오렌지 테두리, 로그인 없이 진입
        ├── auth/
        │   ├── callback/page.tsx — OAuth2 콜백: URL 쿼리파라미터 token → 쿠키 저장 → /auth/success 이동
        │   └── success/page.tsx  — 로그인 성공 축하 화면 (체크마크 + 스파클 애니메이션, 2.3초 후 이동)
        ├── onboarding/
        │   └── page.tsx          — 가족 그룹 합류 안내 (초대 코드 미보유 시 표시)
        ├── new/
        │   └── page.tsx          — "/new" 글 작성 (독립 레이아웃)
        └── (main)/               — Route Group: Header + BottomNav 포함
            ├── layout.tsx        — 인증/familyGroup 가드 + MainBackground + 홈/비홈 BGM UI 마운트
            ├── page.tsx          — "/" 홈 대시보드 (D-day, 퀵메뉴, hero anchor 기반 BGM 토큰 위치 계산)
            ├── loading.tsx
            ├── about/
            │   └── page.tsx      — "/about" 앱 소개 페이지
            ├── album/
            │   ├── page.tsx      — "/album" 앨범 (가족 사진 모아보기)
            │   ├── favorites/page.tsx — "/album/favorites" 즐겨찾기 사진
            │   └── [id]/page.tsx — "/album/:id" 앨범 상세
            ├── diary/
            │   ├── page.tsx      — "/diary" 일기 피드 (FilterBar + DiaryFeed + 페이지네이션)
            │   │                   ?highlightId=: 알림에서 이동 시 해당 카드 flash 처리
            │   ├── loading.tsx
            │   └── error.tsx
            ├── my-posts/
            │   └── page.tsx      — "/my-posts" 내가 쓴 일기 목록
            ├── my-comments/
            │   └── page.tsx      — "/my-comments" 내가 쓴 댓글 목록
            ├── my-reactions/
            │   └── page.tsx      — "/my-reactions" 내가 누른 리액션 목록
            ├── notifications/
            │   └── page.tsx      — "/notifications" 알림 목록 (무한스크롤)
            │                       알림 탭 → /diary?highlightId={diaryPostId} 이동
            ├── settings/
            │   └── notifications/page.tsx — "/settings/notifications" 알림 설정
            ├── schedule/
            │   └── page.tsx      — "/schedule" 일정 캘린더 + 카카오맵 장소 검색
            └── join/
                └── page.tsx      — "/join" 초대 코드 입력 페이지
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
- `PUT /api/users/me` — 닉네임·한 줄 소개 수정 (JWT 필요)
- `PUT /api/users/me/profile-image` — 프로필 사진 변경 (multipart, JWT 필요)
- `GET /api/users/me/stats` — 내 활동 통계 (게시글 수, 사진 수, 반응 수)
- `GET /api/users/me/comments` — 내 댓글 목록 (Cursor 페이징)
- `GET /api/users/me/reactions` — 내 반응 목록 (Cursor 페이징)

### Media

- `POST /api/media/upload` — 파일 업로드 (MultipartFile 다건, UUID 파일명)
  - 로컬: 파일 저장 → `http://localhost:8080/api/media/files/originals/{filename}` 반환
  - 운영: GCS 스트리밍 업로드 → `https://storage.googleapis.com/{bucket}/originals/{filename}` 반환
- `GET /api/media/files/{subdir}/{filename}` — 파일 서빙 (로컬 전용, prod에서는 404)
- `GET /api/media/files/{filename}` — 하위호환 서빙 (originals 경로로 위임)

## 설계 원칙

### 백엔드

#### 응답 / 예외

- 모든 응답: `ApiResponse<T>` 래핑 (`{data, error}`)
- `EntityNotFoundException` / `NotFoundException` → 404
- `IllegalArgumentException` → 400
- `ForbiddenException` → 403
- `InvalidTokenException` → 401
- `NoResourceFoundException` → 404 JSON (Spring Boot 3+ 명시적 처리)

#### 인증

- JWT Bearer Token (`Authorization: Bearer {accessToken}`)
  - Access Token: 30분, Refresh Token: 7일 (HttpOnly 쿠키 `refresh_token`)
  - `JwtAuthenticationFilter`: `validateToken()` try-catch → 실패 시 즉시 401 반환
- OAuth2 로그인 흐름:
  1. 소셜 로그인 → `OAuth2AuthenticationSuccessHandler`
  2. JWT 발급 → `{redirectUri}?token={accessToken}` 리다이렉트 (비회원이면 `&onboarding=true` 추가)
  3. `refresh_token` HttpOnly 쿠키 설정
  4. 프론트 `/auth/callback` → 쿠키 저장 → `/auth/success` → (2.3초) → `/diary` 또는 `/onboarding`

#### SecurityConfig 핵심 설정

- `SessionCreationPolicy.STATELESS` + `NullRequestCache` — Cloud Run RequestCache 경로 유실 방지
- 인증 실패 → 401 JSON, 권한 없음 → 403 JSON (OAuth2 리다이렉트 방지)
- 공개 엔드포인트: `/api/health`, `/api/media/files/**`, `GET /api/users`, `/oauth2/**`, `/login/oauth2/**`, `/api/auth/refresh`, `/swagger-ui/**`, `/v3/api-docs/**`
- 나머지 `/api/**`: `.authenticated()`

#### 미디어 서빙 아키텍처

- **업로드**: `ImageStorageService.store()` → 항상 완전한 절대 URL 반환
  - 로컬(`@Profile("local")`): `./uploads/originals/`에 저장, `http://localhost:8080/api/media/files/originals/{filename}` 반환
  - 운영(`@Profile("prod")`): GCS InputStream 스트리밍 업로드, `https://storage.googleapis.com/{bucket}/originals/{filename}` 반환
- **조회**: `MediaUrlResolver`가 DB의 URL 형태를 판별해 절대 경로로 변환
  - 이미 `http://` / `https://` → 그대로 통과
  - 상대 경로(`/api/media/files/...`) → `${app.media.base-url}` + 파일명
- **DTO**: `DiaryPostResponse.from(post, mediaUrlResolver)` → `MediaUrlResolver` 필수 파라미터

#### 가족 그룹 접근 제어 (AOP)

- `@CheckFamilyAuth(target = AuthTarget.BABY/POST)` + `FamilyAuthAspect` — 요청자 family_group 소속 검증
- `@RequireRole(FamilyRole.PARENT)` + `RequireRoleAspect` — 역할 기반 권한 제어

#### 기타

- Cursor 페이징: ID 역순, size+1 조회로 hasNext 판별
- N+1 방지: fetch join, `default_batch_fetch_size: 100`
- Swagger: `http://localhost:8080/swagger-ui/index.html`
- multipart: max-file-size 10MB, max-request-size 50MB
- babyId=1 하드코딩 유지 (율무 한 명, Baby 선택 UI 불필요)

### 프론트엔드

#### 인증 상태 관리

- **Zustand** (`stores/authStore.ts`): `token`, `user`, `familyGroupId`, `isAuthenticated`
- 토큰 저장: `js-cookie` (`access_token` 쿠키, 1일), `family_group_id` 쿠키 (365일)
- 로그아웃: 쿠키 전체 삭제 + 스토어 초기화
- 미들웨어(`middleware.ts`): Edge에서 쿠키 기반 라우트 가드
  - 토큰 없음 → `/login`
  - 토큰 있고 가족 그룹 없음 → `/onboarding`
  - 인증 처리 경로(`/auth/callback`, `/auth/success`) → 가드 없이 통과

#### 다크모드

- **`tailwind.config.ts`**: `darkMode: "class"` 설정
- **`next-themes`**: `ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}`
- **패턴**: `useTheme()` + `isDark = mounted && resolvedTheme === "dark"` 직접 분기
  - Tailwind `dark:` prefix는 dev 서버 재시작 전까지 반영 안 되므로 사용하지 않음
  - 모든 컴포넌트에서 `isDark`로 inline style / 직접 클래스 분기
- **`MainBackground`**: `fixed inset-0 -z-10` 애니메이션 배경
  - 다크: 별 30개 (opacity 0.08→0.5 반복) + 슬레이트 그라디언트
  - 라이트: 구름 2개 (좌→우 이동) + 하늘색 그라디언트

#### 이미지

- `next/image` (`<Image fill ...>`) + `remotePatterns`: GCS(`storage.googleapis.com`) + 로컬(`localhost:8080`)
- `ImageCarousel`: `diaryId` + `activeIndex` 키로 Framer Motion 슬라이드
- 이미지 로드 실패: `imgErrors: Record<number, boolean>` → `Images` 아이콘 플레이스홀더
- `getMediaUrl()`: 상대 경로면 `NEXT_PUBLIC_API_URL` 붙여 절대 경로 변환

#### 카카오맵 SDK

- `NEXT_PUBLIC_KAKAO_JS_KEY`: 지도 SDK용 JavaScript 키
- `NEXT_PUBLIC_KAKAO_APP_KEY`: 장소 검색 REST API 키 (`KakaoAK` 헤더)
- **주의**: `<Script strategy="afterInteractive" onLoad=...>`는 SPA 재방문 시 재실행 안 됨
  → `useEffect`에서 `window.kakao?.maps` 존재 여부 확인으로 보완
- 카카오 개발자 센터 Web 플랫폼에 Vercel 도메인 등록 필수

#### UI 패턴

- Optimistic UI: 리액션 토글, 댓글 작성/삭제 (실패 시 롤백)
- 이미지 업로드: 개별 파일 병렬 업로드 (Promise.all), 최대 10장
- 삭제: ConfirmModal 확인 후 API 호출 → 피드 state에서 즉시 제거
- `api.ts`: fetch 기반, `Authorization: Bearer {token}` 자동 주입 (쿠키에서 토큰 읽기)

#### 돋보기(글자 확대)

- `FontSizeContext.tsx`
  - 상태: `"normal" | "large"`
  - localStorage 키: `font-size-mode`
  - `<html>`에 `font-large` 클래스 토글 → rem 기반 타이포/레이아웃 확대
- `Header.tsx`
  - 돋보기 버튼으로 `toggleFontSize()` 호출
  - 홈 BGM anchor 위치 재계산 dependency 중 하나로 사용됨

#### BGM 플레이어

- 전역 오디오
  - `BgmPlayer.tsx`가 UI 없이 전역 오디오만 관리
  - `sessionStorage` 키 `bgm_autoplay_attempted`로 자동재생 중복 시도 차단
  - autoplay 차단 시 첫 유저 제스처(`click` / `touchstart` / `keydown`)에서 fallback 재생
  - `loadedmetadata`, `timeupdate`, `volumechange` 이벤트를 `bgmStore`에 동기화
- 오디오/상태 구조
  - `lib/bgmAudio.ts`: `HTMLAudioElement` 싱글톤, 루프 재생, 기본 볼륨, 곡 메타데이터
  - `stores/bgmStore.ts`: `isPlaying`, `isMuted`, `volume`, `currentTime`, `duration`, `anchorPos`
- 홈(`/`) 축소 토큰
  - `BgmMiniPlayer.tsx`는 `createPortal(document.body)` + `position: fixed` 유지
  - collapsed 토큰은 `BgmPlayerUI.tsx`의 공용 `CollapsedMusicToken` 사용
  - 위치는 홈 hero의 고정 프레임(`heroFrameRef`) `getBoundingClientRect()` + offset으로 계산
  - 좌표 재계산 허용 시점:
    - 홈 최초 진입 후 레이아웃 안정 시점(double `requestAnimationFrame`)
    - `resize`
    - `orientationchange`
    - 돋보기 상태(`fontSizeMode`) 변경
    - `visualViewport.resize`
  - **스크롤 중에는 절대 재계산하지 않음**
  - `anchorPos`가 준비되기 전에는 홈 축소 토큰을 렌더하지 않아 fallback → 실제 좌표 점프를 방지
- 비홈 축소 토큰
  - `BgmFloatingPlayer.tsx`가 동일한 `CollapsedMusicToken`을 우하단에 고정 렌더
  - 홈/비홈 모두 작은 기울어진 음악 토큰 디자인, 같은 그림자/펄스 규칙 사용
- 확장 플레이어 UI
  - 홈/비홈 모두 같은 spacing 기준 적용
  - 정보 영역과 컨트롤 영역을 분리하고, 컨트롤은
    1. 음소거 + 볼륨 슬라이더
    2. 재생/일시정지 버튼
    로 그룹화
  - 재생 버튼은 오른쪽 끝의 메인 액션으로 단독 배치
- 비홈 곡명 marquee
  - 비홈 확장 플레이어에서만 적용
  - 곡명이 영역보다 길 때만 `ResizeObserver` 기반 overflow 측정 후 marquee 활성화
  - 재생 중일 때만 움직이고, 일시정지 시 `animationPlayState: paused`
  - 초기 정지 구간과 느린 속도를 둬서 전체 곡명을 읽을 수 있게 함

#### BGM 음원 출처 / 사용 메모

- 현재 기본 배경음악 `little-village-morning.mp3`는 **SUNO**에서 무료 플랜으로 제작
- 프로젝트 내 사용 목적은 **비상업적(non-commercial)** 용도
- 현 시점 기준 내부 메모상 별도 상업 라이선스 이슈 없음
- 음원 파일 위치: `frontend/public/bgms/`

#### 체험판(Demo) 모드

- **진입**: 로그인 페이지 "👀 로그인 없이 체험해보기" 버튼 → `authStore.activateDemo()` → `/`
- **감지**: `sessionStorage("demoMode") === "true"` + Zustand `isDemoMode`
- **데이터**: `lib/demoData.ts`의 `ensureDemoDataInitialized()` — sessionStorage에 가상 일기/댓글/리액션 생성
- **초기화**: `resetDemoData()` — 모든 STORAGE_KEYS 클리어 후 `ensureDemoDataInitialized()` 재실행 → `/`로 이동

##### blob URL 이미지 깨짐 감지 → 가이드 흐름

체험판에서 이미지를 첨부한 후 새로고침하면 blob URL이 무효화됨. `next/image`의 `onError`는 blob URL 실패에 신뢰할 수 없으므로 native `Image` probe 사용.

1. `ImageCarousel` 마운트 시 `new window.Image()` probe로 각 blob URL 직접 검사
2. `probe.onerror` → `demoGuideStep(1)` 설정 (stale closure 방지: `useUiStore.getState()` 사용)
3. Step 1: `Header`에서 햄버거 버튼에 오렌지 펄스링 + "여기를 눌러주세요!" 툴팁 표시
   - `createPortal(document.body)`로 `z-[25]` 다크 오버레이 렌더 (Header `z-30` 아래 → 버튼 자연 클릭 가능)
   - 오버레이 탭 → 건너뛰기 다이얼로그 (`sessionStorage("demo_guide_skipped") = "true"`)
4. 햄버거 클릭 → `demoGuideStep(2)` → SideDrawer 열림
5. Step 2: `SideDrawer`에서 초기화 버튼에 오렌지 펄스링 + 위쪽 툴팁 표시
   - Drawer 닫힘 → Step 2 중이면 Step 1로 되돌림 (350ms delay)
6. 초기화 확인 → `resetDemoData()` + `demoGuideStep(0)` + 홈 이동

##### Zustand `demoGuideStep`

```typescript
// uiStore.ts
demoGuideStep: 0 | 1 | 2  // 0=비활성, 1=햄버거 안내, 2=초기화 버튼 안내
```

##### 체험판 이미지 업로드 안내

- `new/page.tsx`: 이미지 첨부 시(`images.length > 0 && isDemoMode`) "새로고침 시 이미지가 사라질 수 있어요" 안내 문구 표시

#### 댓글 바텀 시트

- `CommentBottomSheet` — 무한스크롤(`useInView`), 부모 스크롤 잠금, 슬라이드 애니메이션
- `CommentSection` — 순수 표시 컴포넌트

#### 일정 캘린더 (`/schedule`)

- `ScheduleSheet` 바텀 시트: 일정 목록 + 등록 폼 + 카카오맵 장소 검색
- 달력 그리드: `grid grid-cols-7`, dot 최대 3개 표시

## 주의사항 (Claude 필독)

- `application-prod.yml`, `application-local.yml`, `application.yml` 등 환경 설정 파일은 절대 자의적으로 삭제하거나 덮어쓰지 말 것.
- 설정 파일 수정이 필요한 경우 반드시 사용자에게 먼저 확인 후 진행할 것.
- `.env`, `*.yml`, `*.yaml`, `*.properties` 등 설정/시크릿 관련 파일은 생성·수정·삭제 전 항상 사용자 승인을 받을 것.

## 보안 이슈

- **[DONE] ~~Cookie Secure 미설정~~**: `OAuth2AuthenticationSuccessHandler.java` — `env.acceptsProfiles(Profiles.of("prod"))`로 prod 시 자동 `true` 처리 완료
- **[MED] FamilyGroup 접근 제어**: `@CheckFamilyAuth` AOP로 일부 구현됐으나, 모든 엔드포인트 적용 여부 확인 필요
- **[MED] 파일 업로드 검증 미흡**: `MediaController` 업로드 시 `file.getContentType()`은 클라이언트 전송값으로 위조 가능 → 실제 바이트 매직 넘버 검증 없음
- **[INFO] 운영 DB 시드 데이터**: 초대 코드 등 초기 데이터는 `data.sql`이 운영에서 미실행되므로 직접 INSERT 필요

## 향후 구현 예정

### 백엔드

| 항목 | 설명 |
|------|------|
| 가족 초대 코드 재발급 API | 현재 수동 DB INSERT만 가능 |
| FCM 기기 푸시 알림 | 인앱 알림(DB 저장·조회)은 구현됨. 앱이 꺼진 상태에서 기기 상단에 뜨는 푸시 알림은 미구현 (Firebase SDK, 디바이스 토큰 등록 필요) |
| 파일 업로드 매직 넘버 검증 | 이미지 파일 여부를 바이트로 확인하는 로직 추가 필요 |

### 프론트엔드

| 항목 | 설명 |
|------|------|
| 가족 초대 코드 재발급 UI | SideDrawer 또는 설정 페이지에서 접근 가능하도록 |
