# 👶 율무일기

> **가족과 함께 기록하는 소중한 육아 일기 서비스**

우리 아이의 소중한 순간을 사진과 함께 기록하고, 가족 구성원과 실시간으로 공유하는 모바일 최적화 PWA입니다.

---

## ✨ 주요 기능

- **육아 일기 작성** — 텍스트, 사진, 영상을 함께 기록
- **가족 그룹 관리** — 부모(쓰기/읽기)와 친척(읽기/댓글) 역할 분리
- **소셜 기능** — 일기 댓글 및 리액션(이모지 반응)
- **소셜 로그인** — OAuth2 기반 구글 로그인
- **PWA 지원** — 모바일 홈 화면 추가 및 오프라인 캐싱
- **미디어 업로드** — 이미지 자동 리사이즈 및 클라우드 스토리지 저장

---

## 🛠 기술 스택

### Frontend
| 기술 | 버전 | 역할 |
|---|---|---|
| Next.js | 15 | App Router 기반 SSR 프레임워크 |
| React | 19 | UI 컴포넌트 |
| TypeScript | latest | 타입 안전성 |
| Tailwind CSS | 3 | 모바일 최적화 스타일링 |
| PWA | - | Service Worker, 홈 화면 추가 |

### Backend
| 기술 | 버전 | 역할 |
|---|---|---|
| Spring Boot | 3.4.1 | REST API 서버 |
| Java | 17 | 런타임 |
| Spring Security | - | JWT 인증 + OAuth2 로그인 |
| Spring Data JPA | - | ORM |
| PostgreSQL | 16 | 메인 데이터베이스 |
| Thumbnailator | 0.4.20 | 이미지 리사이징 |
| springdoc-openapi | 2.8.4 | Swagger API 문서 |

### Infrastructure
| 구성 요소 | 서비스 |
|---|---|
| 프론트엔드 배포 | Vercel |
| 백엔드 배포 | Google Cloud Run |
| 미디어 스토리지 | S3 / GCS |
| 데이터베이스 | PostgreSQL (Cloud) |

---

## 📁 프로젝트 구조

```
yulmudiary/
├── frontend/                   # Next.js 15 앱
│   ├── app/                    # App Router 페이지
│   ├── components/             # 재사용 UI 컴포넌트
│   └── public/                 # PWA 아이콘, manifest
│
└── backend/                    # Spring Boot 앱
    └── src/main/java/com/yulmudiary/
        ├── domain/
        │   ├── baby/           # 아기 정보 도메인
        │   ├── diary/          # 일기, 댓글, 리액션, 미디어
        │   ├── family/         # 가족 그룹 & 권한
        │   ├── media/          # 미디어 업로드
        │   └── user/           # 사용자 정보
        └── global/
            ├── auth/           # JWT 필터, OAuth2 핸들러
            ├── config/         # Security, CORS, Swagger 설정
            ├── exception/      # 전역 예외 처리
            └── response/       # 공통 API 응답 포맷
```

---

## ⚙️ 로컬 개발 환경 설정

### 사전 준비
- Java 17+
- Node.js 18+
- Docker
- Gradle (시스템 설치)

### 1. 데이터베이스 실행 (Docker)

```bash
docker run -d \
  --name yulmudiary-db \
  -p 5432:5432 \
  -e POSTGRES_DB=yulmudiary \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  postgres:16
```

### 2. 백엔드 실행

```bash
cd backend

# 환경 변수 설정 (application-local.yml 참고)
cp src/main/resources/application-local.yml.example src/main/resources/application-local.yml

# 실행 (local 프로파일 적용)
gradle bootRun --args='--spring.profiles.active=local'
```

백엔드 서버: `http://localhost:8080`
Swagger UI: `http://localhost:8080/swagger-ui.html`

### 3. 프론트엔드 실행

```bash
cd frontend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
# .env.local에서 NEXT_PUBLIC_API_URL=http://localhost:8080 설정

# 개발 서버 실행
npm run dev
```

프론트엔드: `http://localhost:3000`

---

## 🔐 인증 흐름

```
1. 구글 OAuth2 로그인 요청
2. 백엔드에서 사용자 정보 처리 후 JWT 발급
   - Access Token (헤더 응답)
   - Refresh Token (HttpOnly 쿠키)
3. 이후 모든 API 요청 시 Authorization: Bearer {accessToken} 헤더 포함
4. Access Token 만료 시 /api/auth/refresh 로 재발급
```

---

## 📡 API 응답 포맷

모든 API 응답은 아래 공통 포맷을 따릅니다.

```json
// 성공
{
  "data": { ... },
  "error": null
}

// 실패
{
  "data": null,
  "error": {
    "code": "DIARY_NOT_FOUND",
    "message": "해당 일기를 찾을 수 없습니다."
  }
}
```

---

## 👨‍👩‍👧 가족 권한 구조

| 역할 | 일기 조회 | 일기 작성/수정/삭제 | 댓글/리액션 |
|---|---|---|---|
| **부모 (PARENT)** | ✅ | ✅ | ✅ |
| **친척 (RELATIVE)** | ✅ | ❌ | ✅ |

---

## 📋 개발 로드맵

- [x] Step 1: 프로젝트 초기화 및 환경 설정
- [x] Step 2: 핵심 도메인 및 DB 스키마 설계
- [ ] Step 3: 비즈니스 로직 및 API 개발
- [ ] Step 4: 프론트엔드 UI 및 API 연동
- [ ] Step 5: 인프라 세팅 및 배포

---

## 📄 라이선스

이 프로젝트는 개인 학습 및 가족 사용 목적으로 제작되었습니다.
