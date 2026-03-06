"use client";

import FloatingYulmu from "@/components/FloatingYulmu";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

function KakaoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 3C5.58 3 2 5.8 2 9.25c0 2.22 1.48 4.17 3.7 5.27-.16.6-.59 2.17-.67 2.51-.1.42.15.41.32.3.13-.09 2.1-1.43 2.95-2.01.54.08 1.1.12 1.7.12 4.42 0 8-2.8 8-6.19C18 5.8 14.42 3 10 3z"
        fill="currentColor"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20">
      <path
        d="M19.6 10.23c0-.68-.06-1.36-.18-2.02H10v3.83h5.38a4.6 4.6 0 01-2 3.02v2.5h3.24c1.89-1.74 2.98-4.3 2.98-7.33z"
        fill="#4285F4"
      />
      <path
        d="M10 20c2.7 0 4.96-.9 6.62-2.44l-3.24-2.5c-.9.6-2.04.95-3.38.95-2.6 0-4.8-1.76-5.58-4.12H1.08v2.58A9.99 9.99 0 0010 20z"
        fill="#34A853"
      />
      <path
        d="M4.42 11.89A6.01 6.01 0 014.1 10c0-.66.12-1.3.32-1.89V5.53H1.08A9.99 9.99 0 000 10c0 1.61.39 3.14 1.08 4.47l3.34-2.58z"
        fill="#FBBC05"
      />
      <path
        d="M10 3.96c1.47 0 2.78.5 3.82 1.5l2.86-2.87C14.96.99 12.7 0 10 0A9.99 9.99 0 001.08 5.53l3.34 2.58C5.2 5.72 7.4 3.96 10 3.96z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function LoginPage() {
  const handleKakaoLogin = () => {
    window.location.href = `${API_BASE_URL}/oauth2/authorization/kakao`;
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/oauth2/authorization/google`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      {/* 캐릭터 영역 */}
      <FloatingYulmu />

      {/* 로고 영역 */}
      <div className="mt-2 mb-8 text-center">
        <h1 className="text-4xl font-bold text-primary-600 mb-2">율무일기</h1>
        <p className="text-gray-500 text-sm">
          우리 아이의 소중한 순간을 가족과 함께
        </p>
      </div>

      {/* 로그인 버튼 */}
      <div className="w-full max-w-sm space-y-3">
        <button
          onClick={handleKakaoLogin}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl
                     bg-[#FEE500] text-[#191919] font-medium text-sm
                     hover:brightness-95 transition-all active:scale-[0.98]"
        >
          <KakaoIcon />
          카카오로 시작하기
        </button>

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl
                     bg-white text-gray-700 font-medium text-sm
                     border border-gray-300
                     hover:bg-gray-50 transition-all active:scale-[0.98]"
        >
          <GoogleIcon />
          Google로 시작하기
        </button>
      </div>

      <p className="mt-8 text-xs text-gray-400">
        로그인 시 서비스 이용약관에 동의하게 됩니다.
      </p>
    </div>
  );
}
