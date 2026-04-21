# 백엔드

## 구조

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

## 설계 원칙

- **응답**: `ApiResponse<T>` (`{data, error}`) 래핑. NotFoundException→404, ForbiddenException→403, InvalidTokenException→401
- **JWT**: Access Token 30분 (Bearer), Refresh Token 7일 (HttpOnly 쿠키 `refresh_token`)
- **OAuth2 흐름**: 소셜 로그인 → JWT 발급 → `{redirectUri}?token=...` 리다이렉트 → `/auth/callback` → `/auth/success` (2.3초) → `/diary` 또는 `/onboarding`
- **SecurityConfig**: `STATELESS` + `NullRequestCache` (Cloud Run 경로 유실 방지). 공개: `/api/health`, `/api/media/files/**`, `GET /api/users`, OAuth2 경로, `/api/auth/refresh`, Swagger
- **미디어**: `ImageStorageService.store()` → 항상 절대 URL 반환. `MediaUrlResolver`로 DB URL 형태 판별 변환
- **페이징**: Cursor(ID 역순, size+1로 hasNext 판별), N+1 방지(fetch join, `default_batch_fetch_size: 100`)
- **권한 AOP**: `@CheckFamilyAuth`(가족그룹 소속), `@RequireRole`(FamilyRole), `@RequireAdmin`(isAdmin 검증)
- **기타**: multipart 10MB/50MB, babyId=1 하드코딩 유지

## 보안 이슈

- **[DONE]** Cookie Secure: prod 시 자동 true 처리 완료
- **[MED]** FamilyGroup 접근 제어: `@CheckFamilyAuth` 일부 구현, 전체 엔드포인트 적용 여부 확인 필요
- **[MED]** 파일 업로드 검증: `getContentType()`은 위조 가능 → 바이트 매직 넘버 검증 미구현
- **[INFO]** 운영 초대 코드: data.sql 운영 미실행 → 직접 INSERT 필요
