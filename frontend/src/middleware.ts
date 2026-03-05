import { NextRequest, NextResponse } from "next/server";

const TOKEN_KEY = "access_token";
const FAMILY_GROUP_KEY = "family_group_id";

// 로그인 없이 접근 가능한 공개 경로
const PUBLIC_PATHS = ["/login"];

// 인증 처리 중인 경로: 토큰·그룹 쿠키 여부와 무관하게 모든 가드를 우회
// (리다이렉트 루프 방지 — 이 경로에서 직접 다음 목적지로 이동)
const AUTH_PROCESSING_PATHS = ["/auth/callback", "/auth/success"];

// 로그인은 필요하지만 가족 그룹 없이도 접근 가능한 경로
const JOIN_PATHS = ["/join", "/onboarding"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(TOKEN_KEY)?.value;
  const familyGroupId = request.cookies.get(FAMILY_GROUP_KEY)?.value;

  // 인증 처리 경로는 가드 없이 통과 (쿠키가 세팅되기 전이므로 판단 불가)
  const isAuthProcessing = AUTH_PROCESSING_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );
  if (isAuthProcessing) return NextResponse.next();

  const isPublicPath = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );
  const isJoinPath = JOIN_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );

  // 1. 토큰 없음 + 보호된 경로 → /login 리다이렉트
  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. 토큰 있음 + /login → / 리다이렉트
  if (token && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 3. 토큰 있음 + ( /join or /onboarding ) + 이미 가족 그룹 멤버 → /diary 리다이렉트
  if (token && isJoinPath && familyGroupId) {
    return NextResponse.redirect(new URL("/diary", request.url));
  }

  // 4. 토큰 있음 + 보호된 경로 + 가족 그룹 없음 → /onboarding 리다이렉트
  if (token && !isPublicPath && !isJoinPath && !familyGroupId) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 아래 경로를 제외한 모든 요청에 미들웨어 적용:
     * - _next/static  (정적 파일)
     * - _next/image   (이미지 최적화)
     * - favicon.ico
     * - public 폴더 파일 (png, svg, ico 등)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|json)).*)",
  ],
};
