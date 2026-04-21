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

| 변수명                                      | 설명                         |
| ------------------------------------------- | ---------------------------- |
| `DB_URL` / `DB_USERNAME` / `DB_PASSWORD`    | Neon PostgreSQL              |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth2                |
| `KAKAO_CLIENT_ID`                           | 카카오 REST API 키           |
| `JWT_SECRET_KEY`                            | HS256 시크릿 (256비트 이상)  |
| `GCS_BUCKET_NAME`                           | `yulmudiary-media`           |
| `FRONTEND_URL`                              | CORS, OAuth2 리다이렉트용    |
| `NEXT_PUBLIC_API_URL`                       | 백엔드 API URL               |
| `NEXT_PUBLIC_KAKAO_JS_KEY`                  | 카카오 지도 SDK JS 키        |
| `NEXT_PUBLIC_KAKAO_APP_KEY`                 | 카카오 장소 검색 REST API 키 |

## 주의사항 (Claude 필독)

- `application-prod.yml`, `application-local.yml`, `application.yml` 등 환경 설정 파일은 절대 자의적으로 삭제하거나 덮어쓰지 말 것.
- 설정 파일 수정이 필요한 경우 반드시 사용자에게 먼저 확인 후 진행할 것.
- `.env`, `*.yml`, `*.yaml`, `*.properties` 등 설정/시크릿 관련 파일은 생성·수정·삭제 전 항상 사용자 승인을 받을 것.

## GitHub Actions CI/CD

- 워크플로우: `backend/**` 변경 시 main 브랜치 푸시 → 자동 배포
- Registry: `asia-northeast3-docker.pkg.dev/yulmu-project/docker-repo`
- Cloud Run 서비스명: `backend-api`
- 리전: `asia-northeast3`

### GitHub Secrets

| 키               | 설명             |
| ---------------- | ---------------- |
| `GCP_PROJECT_ID` | `yulmu-project`  |
| `GCP_SA_KEY`     | 서비스 계정 JSON |

### 서비스 계정

- `github-actions-deploy-311@yulmu-project.iam.gserviceaccount.com`
- 필요 권한 3개: Cloud Run 관리자, Artifact Registry 관리자, 서비스 계정 사용자(iam.serviceAccountUser)

## 향후 구현 예정

| 항목                       | 설명                                                                           |
| -------------------------- | ------------------------------------------------------------------------------ |
| FCM 기기 푸시 알림         | 인앱 알림은 구현됨. 기기 푸시는 미구현 (Firebase SDK, 디바이스 토큰 등록 필요) |
| 파일 업로드 매직 넘버 검증 | 이미지 바이트 검증 로직 추가 필요                                              |
