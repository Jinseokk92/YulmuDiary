import { NextRequest, NextResponse } from "next/server";

const TOKEN_KEY = "access_token";
const FAMILY_GROUP_KEY = "family_group_id";

// 로그인 없이 접근 가능한 공개 경로
const PUBLIC_PATHS = ["/login", "/auth/callback"];

// 로그인은 필요하지만 가족 그룹 없이도 접근 가능한 경로
const JOIN_PATHS = ["/join"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(TOKEN_KEY)?.value;
  const familyGroupId = request.cookies.get(FAMILY_GROUP_KEY)?.value;

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

  // 3. 토큰 있음 + /join + 이미 가족 그룹 멤버 → /diary 리다이렉트
  if (token && isJoinPath && familyGroupId) {
    return NextResponse.redirect(new URL("/diary", request.url));
  }

  // 4. 토큰 있음 + 보호된 경로 + 가족 그룹 없음 → /join 리다이렉트
  if (token && !isPublicPath && !isJoinPath && !familyGroupId) {
    return NextResponse.redirect(new URL("/join", request.url));
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
