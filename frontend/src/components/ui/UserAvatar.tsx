"use client";

import { useState } from "react";

type AvatarSize = "sm" | "md" | "lg";

interface UserAvatarProps {
  nickname: string;
  profileImageUrl?: string | null;
  size?: AvatarSize;
  className?: string;
}

const SIZE_MAP: Record<AvatarSize, { container: string; text: string; img: string }> = {
  sm: { container: "w-6 h-6",  text: "text-[10px]", img: "w-6 h-6"  },
  md: { container: "w-8 h-8",  text: "text-xs",     img: "w-8 h-8"  },
  lg: { container: "w-10 h-10", text: "text-sm",    img: "w-10 h-10" },
};

export default function UserAvatar({
  nickname,
  profileImageUrl,
  size = "md",
  className = "",
}: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const { container, text, img } = SIZE_MAP[size];

  const showImage = !!profileImageUrl && !imgError;

  if (showImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={profileImageUrl}
        alt={`${nickname} 프로필`}
        className={`${img} rounded-full object-cover shrink-0 ${className}`}
        onError={() => setImgError(true)}
      />
    );
  }

  // Fallback: 닉네임 첫 글자 텍스트 아바타
  return (
    <div
      className={`${container} rounded-full bg-gradient-to-tr from-primary-400 to-primary-200
                  flex items-center justify-center shrink-0 ${className}`}
    >
      <span className={`${text} font-bold text-white`}>
        {nickname.charAt(0)}
      </span>
    </div>
  );
}
