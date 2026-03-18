# 👶 율무일기

> 가족과 함께 기록하는 소중한 육아 일기 서비스

---

## 📸 서비스 화면

| 홈 | 글자 확대 모드 | 일기 피드 | 일기 작성 |
|:---:|:---:|:---:|:---:|
| <img src="screenshots/Yulmudiary_01.png" width="180"/> | <img src="screenshots/Yulmudiary_02.png" width="180"/> | <img src="screenshots/Yulmudiary_03.png" width="180"/> | <img src="screenshots/Yulmudiary_04.png" width="180"/> |

> 📱 [체험판 바로가기](https://yulmu-diary.vercel.app/) — 로그인 없이 둘러보실 수 있습니다.
---

## 💡 기획 의도

아이의 소중한 순간을 가족 모두가 함께 기록하고 나눌 수 있는 공간이 필요했습니다.

특히 **스마트폰 사용이 익숙하지 않은 고령 가족**도 불편함 없이 쓸 수 있도록,
글자 확대 모드, 단순한 UI 구조, 모바일 최적화 PWA를 중심으로 설계했습니다.

---

율무일기는 사진, 영상, 댓글, 리액션을 중심으로 아이의 순간을 기록하고 가족과 공유하는 모바일 최적화 육아 일기 서비스입니다.  
프론트엔드는 Next.js App Router 기반 PWA이고, 백엔드는 Spring Boot REST API로 구성된 모노레포입니다.

---

## ✨ 주요 기능

- 육아 일기 작성: 텍스트, 이미지, 영상 업로드
- 가족 그룹 관리: 부모 / 친척 역할 기반 접근 제어
- 소셜 기능: 댓글, 이모지 리액션
- 소셜 로그인: Google / Kakao OAuth2 로그인
- 일정 관리: 월별 캘린더, 카카오 장소 검색 연동
- PWA 지원: 홈 화면 추가, 모바일 사용성 최적화
- 접근성 확대 모드: 헤더 돋보기 버튼으로 글자 확대
- 배경음악 플레이어:
  - 전역 오디오 싱글톤
  - 홈 hero 옆 고정 토큰
  - 비홈 우하단 floating 플레이어
  - 긴 곡명 marquee 표시

---

## 🛠 기술 스택

### Frontend

| 기술 | 버전 | 역할 |
| --- | --- | --- |
| Next.js | 15 | App Router 기반 프레임워크 |
| React | 19 | UI 컴포넌트 |
| TypeScript | 5.x | 타입 안전성 |
| Tailwind CSS | 3 | 스타일링 |
| Zustand | 5 | 전역 상태 관리 |
| next-themes | 0.4.x | 다크모드 |
| framer-motion | 12.x | 애니메이션 |
| react-kakao-maps-sdk | 1.2.x | 카카오맵 연동 |
| next-pwa | 5.6.x | PWA 설정 |

### Backend

| 기술 | 버전 | 역할 |
| --- | --- | --- |
| Spring Boot | 3.4.1 | REST API 서버 |
| Java | 17 | 런타임 |
| Spring Security | - | JWT 인증 + OAuth2 로그인 |
| Spring Data JPA | - | ORM |
| PostgreSQL | 16 | 메인 데이터베이스 |
| Thumbnailator | 0.4.20 | 이미지 리사이징 |
| springdoc-openapi | 2.8.4 | Swagger 문서 |
| Google Cloud Storage SDK | 2.43.1 | 운영 미디어 저장 |

### Infrastructure

| 구성 요소 | 서비스 |
| --- | --- |
| 프론트엔드 배포 | Vercel |
| 백엔드 배포 | Google Cloud Run |
| 운영 DB | Neon PostgreSQL |
| 로컬 DB | Docker PostgreSQL 16 |
| 미디어 스토리지 | Google Cloud Storage |

---

## 📁 프로젝트 구조

```text
YulmuDiary/
├── backend/
│   ├── build.gradle
│   └── src/main/java/com/yulmudiary/
│       ├── domain/
│       │   ├── baby/
│       │   ├── diary/
│       │   ├── family/
│       │   ├── media/
│       │   ├── schedule/
│       │   └── user/
│       └── global/
│           ├── auth/
│           ├── config/
│           ├── exception/
│           └── response/
├── frontend/
│   ├── public/
│   │   └── bgms/
│   └── src/
│       ├── app/
│       ├── components/
│       │   ├── BgmPlayer.tsx
│       │   ├── BgmMiniPlayer.tsx
│       │   ├── BgmFloatingPlayer.tsx
│       │   ├── BgmPlayerUI.tsx
│       │   └── layout/
│       ├── contexts/
│       │   └── FontSizeContext.tsx
│       ├── lib/
│       │   ├── api.ts
│       │   ├── bgmAudio.ts
│       │   └── kakao.ts
│       └── stores/
│           ├── authStore.ts
│           ├── bgmStore.ts
│           └── uiStore.ts
├── AGENTS.md
├── CLAUDE.md
└── README.md
```

---

## ⚙️ 로컬 개발

### 사전 준비

- Java 17+
- Node.js 18+
- Docker
- Gradle

### 1. PostgreSQL 실행

```bash
docker run -d --name yulmudiary-db -p 5432:5432 -e POSTGRES_DB=yulmudiary -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres postgres:16
```

### 2. 백엔드 실행

`backend/src/main/resources/application-local.yml` 기준으로 로컬 설정을 확인한 뒤 실행합니다.

```bash
cd backend
gradle bootRun
```

- 백엔드: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/swagger-ui/index.html`

### 3. 프론트엔드 실행

`frontend/.env.local`에 필요한 값을 설정한 뒤 실행합니다.

필수 확인 항목:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_KAKAO_JS_KEY`
- `NEXT_PUBLIC_KAKAO_APP_KEY`

```bash
cd frontend
npm install
npm run dev
```

- 프론트엔드: `http://localhost:3000`

---

## 🔐 인증 흐름

```text
1. Google 또는 Kakao OAuth2 로그인 요청
2. 백엔드에서 사용자 정보 upsert 후 JWT 발급
3. Access Token은 프론트에서 쿠키 기반 저장
4. Refresh Token은 HttpOnly 쿠키(refresh_token)로 관리
5. API 요청 시 Authorization: Bearer {accessToken}
6. 만료 시 /api/auth/refresh 로 재발급
```

추가로:

- 미들웨어에서 인증 및 가족 그룹 상태를 검사합니다.
- 가족 그룹이 없으면 `/onboarding` 또는 `/join` 흐름으로 이동합니다.

---

## 📡 API 응답 포맷

모든 API 응답은 공통적으로 `ApiResponse<T>` 형식을 사용합니다.

```json
{
  "data": {
    "id": 1
  },
  "error": null
}
```

```json
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
| --- | --- | --- | --- |
| 부모 (PARENT) | ✅ | ✅ | ✅ |
| 친척 (RELATIVE) | ✅ | ❌ | ✅ |

백엔드에서는 AOP 기반으로 가족 그룹 접근 제어와 역할 권한 검증을 처리합니다.

---

## 🎵 배경음악 플레이어 메모

- 전역 오디오는 `HTMLAudioElement` 싱글톤으로 관리합니다.
- 자동재생이 막히면 첫 유저 제스처에서 fallback 재생을 시도합니다.
- 홈에서는 hero 옆에 고정된 작은 기울어진 토큰으로 표시됩니다.
- 비홈에서는 우하단 floating 토큰과 확장 미니 플레이어가 표시됩니다.
- 비홈 확장 플레이어에서는 곡명이 길 경우 재생 중에만 marquee가 동작합니다.

### 음원 출처

- 현재 기본 BGM은 **SUNO** 무료 플랜으로 제작한 음원입니다.
- 현재 프로젝트에서는 **비상업적 목적**으로만 사용합니다.

---

## 📌 참고 문서

- [CLAUDE.md](./CLAUDE.md): 상세 개발 메모 및 구조 문서
- [AGENTS.md](./AGENTS.md): 이 저장소에서 작업하는 에이전트용 운영 가이드

---

## 📄 라이선스 / 사용 목적

이 프로젝트는 개인 학습 및 가족 사용 목적의 비상업 프로젝트입니다.
