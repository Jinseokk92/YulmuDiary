"use client";

import { useUser } from "@/contexts/UserContext";
import { useRouter } from "next/navigation";
import UserAvatar from "@/components/ui/UserAvatar";

export default function Header() {
  const { currentUser, loading, logout } = useUser();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
      <div className="max-w-lg mx-auto flex items-center justify-between h-14 px-4">
        <h1 className="text-xl font-bold text-primary-600 select-none">
          율무일기
        </h1>

        {loading ? (
          <div className="h-8 w-20 rounded bg-gray-200 animate-pulse" />
        ) : currentUser ? (
          <div className="flex items-center gap-2">
            <UserAvatar
              nickname={currentUser.name}
              profileImageUrl={currentUser.profileImageUrl}
              size="sm"
            />
            <span className="text-sm text-gray-700 font-medium">
              {currentUser.name}
            </span>
            <button
              onClick={handleLogout}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              로그아웃
            </button>
          </div>
        ) : (
          <button
            onClick={() => router.push("/login")}
            className="text-sm text-primary-600 font-medium"
          >
            로그인
          </button>
        )}
      </div>
    </header>
  );
}
