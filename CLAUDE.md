# 율무일기 프로젝트

## 프로젝트 개요
- 육아 일기 공유 서비스 (모노레포 구조)
- `backend/` — Spring Boot 3.4.1, Java 17, PostgreSQL, JPA, Lombok
- `frontend/` — Next.js 15, React 19, Tailwind CSS 3, TypeScript

## 개발 환경
- OS: Windows 11
- IDE: IntelliJ (백엔드), VS Code (프론트엔드)
- DB: Docker로 PostgreSQL 16 실행
  ```bash
  docker run -d --name yulmudiary-db -p 5432:5432 -e POSTGRES_DB=yulmudiary -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres postgres:16
  ```
- Gradle: 시스템 설치 (scoop), gradlew 없음 → `gradle` 명령어 사용
- Node: npm 사용
- 언어: 한국어로 응답

## 백엔드 구조
```
backend/
├── build.gradle
├── src/main/java/com/yulmudiary/
│   ├── YulmuDiaryApplication.java
│   ├── domain/
│   │   ├── baby/
│   │   │   ├── entity/ (Baby, Gender)
│   │   │   └── repository/ (BabyRepository)
│   │   ├── diary/
│   │   │   ├── entity/ (DiaryPost, Comment, Reaction, Media, MediaType)
│   │   │   ├── repository/ (DiaryPostRepository, CommentRepository, ReactionRepository)
│   │   │   ├── dto/ (DiaryPostRequest/Response/PageResponse, CommentRequest/Response, ReactionRequest/Response)
│   │   │   ├── service/ (DiaryPostService, CommentService, ReactionService)
│   │   │   └── controller/ (DiaryPostController, CommentController, ReactionController)
│   │   ├── family/
│   │   │   └── entity/ (FamilyGroup, FamilyMembership, FamilyRole)
│   │   ├── health/
│   │   │   └── HealthController.java
│   │   ├── media/
│   │   │   ├── controller/ (MediaController)
│   │   │   ├── dto/ (MediaUploadResponse)
│   │   │   └── service/ (MediaStorageService)
│   │   └── user/
│   │       ├── entity/ (User)
│   │       ├── repository/ (UserRepository)
│   │       ├── dto/ (UserResponse)
│   │       └── controller/ (UserController)
│   └── global/
│       ├── config/ (CorsConfig, JpaAuditingConfig, SecurityConfig, SwaggerConfig)
│       ├── entity/ (BaseTimeEntity)
│       ├── exception/ (GlobalExceptionHandler)
│       └── response/ (ApiResponse)
└── src/main/resources/
    ├── application.yml
    ├── application-local.yml
    └── data.sql              — 시드 데이터 (사용자 3명, 가족그룹, 아기)
```

## 프론트엔드 구조
```
frontend/
├── package.json              — next 15, react 19, react-intersection-observer
├── next.config.ts            — PWA 설정
├── tailwind.config.ts        — primary 컬러 (#e4701e 계열), Pretendard 폰트
├── tsconfig.json             — @/* → ./src/* 경로 별칭
└── src/
    ├── types/index.ts        — API 타입 (ApiResponse, UserResponse, DiaryPostResponse 등)
    ├── lib/
    │   ├── api.ts            — fetch 래퍼 (X-USER-ID 자동 주입, FormData 분기, 에러 처리)
    │   └── utils.ts          — formatRelativeTime(), getMediaUrl()
    ├── contexts/
    │   └── UserContext.tsx   — 사용자 선택/관리 (localStorage 기반)
    ├── components/
    │   ├── layout/
    │   │   ├── Header.tsx    — 로고 + 유저 선택 드롭다운
    │   │   └── BottomNav.tsx — 3탭: 홈(/), 일기장(/diary), 새 글(/new)
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
    │       └── CommentSection.tsx    — 댓글 목록 순수 표시 컴포넌트 (props만 받아 렌더)
    └── app/
        ├── layout.tsx            — 루트: UserProvider
        ├── error.tsx             — 전역 에러 바운더리
        ├── (main)/               — Route Group: Header + BottomNav 포함
        │   ├── layout.tsx        — 공통 셸 (max-w-lg mx-auto)
        │   ├── page.tsx          — "/" 홈 대시보드 (D-day, 퀵메뉴)
        │   ├── loading.tsx
        │   └── diary/
        │       ├── page.tsx      — "/diary" 일기 피드
        │       ├── loading.tsx
        │       └── error.tsx
        │   └── schedule/
        │       └── page.tsx      — "/schedule" 일정 캘린더 (월간 뷰, 날짜 클릭 바텀 시트)
        └── new/
            └── page.tsx          — "/new" 글 작성 (독립 레이아웃, Header/BottomNav 없음)
```

## API 구현 상태

### DiaryPost CRUD
- `POST /api/diary-posts` — 생성 (X-USER-ID 헤더)
- `GET /api/diary-posts/{id}` — 단건 조회 (fetch join: author + mediaList)
- `GET /api/diary-posts?babyId=&cursor=&size=` — 목록 (Cursor 페이징, fetch join: author + baby)
- `PUT /api/diary-posts/{id}` — 수정 (작성자 검증)
- `DELETE /api/diary-posts/{id}` — 삭제 (작성자 검증)

### Comment
- `GET /api/diary-posts/{postId}/comments` — 댓글 목록 (fetch join: author)
- `POST /api/diary-posts/{postId}/comments` — 댓글 작성
- `DELETE /api/diary-posts/{postId}/comments/{commentId}` — 댓글 삭제 (작성자 검증)

### Reaction
- `POST /api/diary-posts/{postId}/reactions` — 토글 (있으면 삭제, 없으면 추가)

### User
- `GET /api/users` — 사용자 목록 조회

### Media
- `POST /api/media/upload` — 파일 업로드 (MultipartFile, UUID 파일명 로컬 저장)
- `GET /api/media/files/{filename}` — 저장된 파일 서빙

## 설계 원칙

### 백엔드
- 모든 응답: `ApiResponse<T>` 래핑
- 인증 미구현 → `X-USER-ID` 헤더로 임시 사용자 식별
- EntityNotFoundException → 404, IllegalArgumentException → 400
- Cursor 페이징: ID 역순, size+1 조회로 hasNext 판별
- N+1 방지: fetch join (목록: author+baby, 단건: author+mediaList), `default_batch_fetch_size: 100`
- DiaryPostResponse에 commentCount, reactions 포함 (프론트 피드용)
- Swagger: springdoc-openapi-starter-webmvc-ui:2.8.4 → `http://localhost:8080/swagger-ui/index.html`
- SecurityConfig: `anyRequest().permitAll()` (인증 미구현)
- application-local.yml: PostgreSQL localhost:5432/yulmudiary, `ddl-auto: create-drop`
- data.sql: 시드 데이터 (사용자 3명, 가족그룹 1개, 아기 1명 "율무")
- multipart: max-file-size 10MB, max-request-size 50MB
- 미디어 저장: `./uploads` 로컬 디렉토리

### 프론트엔드
- Next.js App Router (Route Group 활용)
  - `(main)` 그룹: Header + BottomNav 공통 셸 (홈, 일기장), `max-w-lg mx-auto` 레이아웃
  - `/new`: 독립 레이아웃 (자체 헤더)
- api.ts: fetch 기반, ApiError 클래스로 통일된 예외 처리
  - `api.get/post/put/delete` — 클라이언트 (X-USER-ID 자동 주입)
  - `api.upload` — FormData (Content-Type 자동 제외)
  - `api.server.get` — Server Component 전용 (localStorage 없이)
- 사용자 관리: UserContext + localStorage에 선택된 userId 저장
- babyId=1 하드코딩 (향후 Baby 선택 UI 추가 예정)
- 리렌더링 최적화:
  - DiaryCard: `memo` — posts append 시 기존 카드 리렌더 스킵
  - 좋아요(Reaction): DiaryCard 내부 로컬 state → 해당 카드만 리렌더
- Optimistic UI: 리액션 토글, 댓글 작성/삭제 (실패 시 롤백)
- 이미지 업로드: 개별 파일 병렬 업로드 (Promise.all), 최대 10장
- 삭제: ConfirmModal 확인 후 API 호출 → 피드 state에서 즉시 제거

### 댓글 바텀 시트 아키텍처
- `CommentBottomSheet` — 댓글 관련 모든 책임 보유
  - 상태: comments, nextCursor, hasNext, isLoaded, isLoading, input, isSubmitting
  - 로직: fetchComments (커서 페이징), handleSubmit (낙관적), handleDelete (낙관적)
  - 무한 스크롤: `useInView` + sentinel div (바텀 시트 스크롤 영역 하단)
  - 부모 스크롤 잠금: `isOpen` 시 `document.body.style.overflow = 'hidden'`
  - 슬라이드 애니메이션: `translate-y-0 / translate-y-full` (duration-300), 항상 마운트 유지
  - PC 너비: `max-w-lg`로 레이아웃과 동일하게 제한, `flex justify-center items-end`로 중앙 정렬
  - 레이아웃: `flex flex-col` — 헤더(shrink-0) / 댓글 목록(flex-1 overflow-y-auto) / 입력폼(shrink-0)
- `CommentSection` — 순수 표시 컴포넌트
  - Props: `comments`, `isLoading`, `currentUser`, `onDelete`
  - 상태·API·스크롤 없음, 댓글 아이템 렌더만 담당

### 일정 캘린더 아키텍처 (`/schedule`)
- `schedule/page.tsx` ("use client") — 월간 달력 UI + API 연동
  - `getDaysInMonth`, `getFirstDayOfWeek`, `toDateStr` 순수 헬퍼 함수
  - `ScheduleSheet` — 날짜별 일정 목록 + 등록 폼 내장 바텀 시트 (내부 컴포넌트)
    - 슬라이드 애니메이션: `translate-y-0 / translate-y-full`, 반투명 오버레이
    - 일정 등록: POST `/api/schedules`, 삭제: DELETE `/api/schedules/{id}`
    - `showForm` 토글로 목록 보기 ↔ 폼 입력 전환
  - 달력 그리드: `grid grid-cols-7`, `totalCells = Math.ceil((firstDow + days) / 7) * 7`
  - 날짜 dot: `scheduleMap` (날짜 → ScheduleResponse[]) 최대 3개 표시
  - 이번 달 일정 요약 리스트: 달력 하단에 날짜순 렌더
  - `BottomNav` 4탭: 홈 | 일기장 | 일정 | 새 글

### Schedule API (백엔드)
- `GET /api/schedules?year=&month=` — 월별 조회 (`X-USER-ID` 헤더)
- `POST /api/schedules` — 등록
- `PUT /api/schedules/{id}` — 수정 (작성자 검증)
- `DELETE /api/schedules/{id}` — 삭제 (작성자 검증)

## 주의사항 (Claude 필독)
- `application-prod.yml`, `application-local.yml`, `application.yml` 등 환경 설정 파일은 절대 자의적으로 삭제하거나 덮어쓰지 말 것.
- 설정 파일 수정이 필요한 경우 반드시 사용자에게 먼저 확인 후 진행할 것.
- `.env`, `*.yml`, `*.yaml`, `*.properties` 등 설정/시크릿 관련 파일은 생성·수정·삭제 전 항상 사용자 승인을 받을 것.

## 미해결 / TODO
- 인증 구현 (현재 X-USER-ID 헤더 임시 방식)
- Baby 선택 UI (현재 babyId=1 하드코딩)
- 일기 수정 기능 프론트엔드 연동
- 프로필 이미지 표시 (현재 닉네임 첫 글자 아바타)
- 일정 수정 기능 (현재 삭제만 지원)