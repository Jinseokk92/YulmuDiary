# 👶 프로젝트 개발 로드맵 (To-Do List)

## Step 1: 프로젝트 초기화 및 환경 설정
- **기술 스택 확립**: Next.js, Spring Boot, PostgreSQL, Vercel, Cloud Run, S3/GCS
- **디렉토리 구조 설계**: 모노레포 (최상단에 `frontend`, `backend` 폴더 분리)
- **초기 세팅**: Spring Boot (`build.gradle` 포함) 및 Next.js 프로젝트 생성
- **공통 규약 정의**: RESTful API 공통 응답 포맷(`{ "data": ..., "error": null }`) 설정

## Step 2: 핵심 도메인 및 DB 스키마 설계
- **핵심 엔티티 도출**: `User`, `Baby`, `DiaryPost`, `Comment`, `Reaction`
- **권한 설계**: `FamilyGroup`을 도입하여 부모(쓰기/읽기)와 친척(읽기/댓글) 권한 분리
- **미디어 처리**: 사진/영상은 스토리지 URL만 DB에 저장하도록 설계
- **JPA 설정**: Entity 클래스 작성 및 연관관계(OneToMany, ManyToOne) 매핑
- **성능 최적화**: N+1 문제 방지를 위해 모든 연관관계 `FetchType.LAZY` 적용

## Step 3: 비즈니스 로직 및 API 개발
- **게시물 API**: `DiaryPost` CRUD 구현 (사진 URL 포함)
- **페이징 최적화**: `DiaryPost` 목록 조회 시 No-Offset 또는 Cursor 기반 페이징 적용
- **소셜 기능 API**: `Comment` 및 `Reaction` 추가/삭제 로직 구현
- **아키텍처**: 비즈니스 로직을 `Service` 계층에 집중
- **예외 처리**: `GlobalExceptionHandler`를 구현하여 공통 응답 포맷으로 에러 반환
- **API 문서화**: `springdoc-openapi-ui` (Swagger) 설정 및 컨트롤러 어노테이션 적용

## Step 4: 프론트엔드 UI 및 API 연동
- **UI 컴포넌트 개발**: 모바일 환경에 최적화된 타임라인 뷰 (Tailwind CSS 활용)
- **데이터 연동**: Swagger API 명세를 기반으로 Next.js App Router (Server Component)에서 데이터 페칭
- **작성 폼 구현**: 새 일기 작성 페이지 및 멀티파트(Multipart) 폼 데이터 이미지 업로드 구현
- **UX 개선**: 시맨틱 HTML 태그 사용, Skeleton UI(로딩 상태) 및 에러 상태 처리 적용

## Step 5: 인프라 세팅 및 배포 준비
- **컨테이너화**: Spring Boot 최적화 Dockerfile 작성 (멀티 스테이지 빌드, JRE 경량 이미지 활용으로 Cold Start 최소화)
- **프론트엔드 설정**: Vercel 배포를 위한 환경 변수(`.env.example`) 템플릿 작성
- **CORS 처리**: 백엔드 `WebMvcConfigurer`에 Vercel 도메인 허용 설정 추가

---

## 💡 사수(Senior)의 핵심 코드 리뷰 포인트
- JPA 연관관계 매핑 및 쿼리 발생량 (N+1 문제 검증)
- 트랜잭션 경계 설정 및 예외 롤백 처리
- Fetch Join 등 성능을 고려한 DB 쿼리 최적화 여부