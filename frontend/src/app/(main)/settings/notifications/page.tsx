"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { ArrowLeft, MessageCircle, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import type { NotificationSettingsResponse } from "@/types";

// ── 토글 스위치 ────────────────────────────────────────────────────────────────

function ToggleSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className={`relative h-8 w-14 shrink-0 rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-60 ${
        checked ? "bg-primary-500" : "bg-gray-300"
      }`}
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      <motion.span
        className="absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow"
        animate={{ x: checked ? 22 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
      />
    </button>
  );
}

// ── 설정 항목 카드 ─────────────────────────────────────────────────────────────

function SettingCard({
  emoji,
  title,
  description,
  checked,
  onChange,
  disabled,
  bg,
  border,
  textPrimary,
  textSecondary,
}: {
  emoji: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  bg: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
}) {
  return (
    <div
      className="rounded-2xl border px-5 py-4 flex items-center gap-4"
      style={{ backgroundColor: bg, borderColor: border }}
    >
      {/* 아이콘 영역 */}
      <div
        className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-xl"
        style={{ backgroundColor: checked ? "#fff3ec" : "#f3f4f6" }}
      >
        {emoji}
      </div>

      {/* 텍스트 */}
      <div className="flex-1 min-w-0">
        <p className="text-base font-bold" style={{ color: textPrimary }}>
          {title}
        </p>
        <p className="text-sm mt-0.5" style={{ color: textSecondary }}>
          {description}
        </p>
      </div>

      {/* 토글 — 최소 48px 터치 영역 보장 */}
      <div className="shrink-0 flex items-center justify-center min-h-[48px]">
        <ToggleSwitch checked={checked} onChange={onChange} disabled={disabled} />
      </div>
    </div>
  );
}

// ── 메인 페이지 ────────────────────────────────────────────────────────────────

export default function NotificationSettingsPage() {
  const { resolvedTheme } = useTheme();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState<NotificationSettingsResponse | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 설정 로드
  useEffect(() => {
    api
      .get<NotificationSettingsResponse>("/api/users/notification-settings")
      .then(setSettings)
      .catch(() => {
        // 실패 시 기본값
        setSettings({ commentNotificationEnabled: true, reactionNotificationEnabled: true });
      });
  }, []);

  // 토글 변경 → 즉시 PATCH
  const toggle = async (field: keyof NotificationSettingsResponse) => {
    if (!settings || saving) return;
    const next = { ...settings, [field]: !settings[field] };
    setSettings(next); // optimistic
    setSaving(true);
    try {
      const updated = await api.patch<NotificationSettingsResponse>(
        "/api/users/notification-settings",
        next
      );
      if (updated) setSettings(updated);
    } catch {
      setSettings(settings); // 롤백
    } finally {
      setSaving(false);
    }
  };

  const isDark = mounted && resolvedTheme === "dark";

  const pageBg      = isDark ? "#0f172a" : "#faf9f7";
  const cardBg      = isDark ? "#1e293b" : "#ffffff";
  const cardBorder  = isDark ? "#334155" : "#e5e7eb";
  const textPrimary = isDark ? "#e2e8f0" : "#111827";
  const textSecond  = isDark ? "#94a3b8" : "#6b7280";
  const headerBg    = isDark ? "#0f172a" : "#faf9f7";
  const headerBorder= isDark ? "#1e293b" : "#f3f4f6";

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: pageBg }}>
      {/* 헤더 */}
      <div
        className="sticky top-0 z-10 flex items-center gap-2 px-2 py-3 border-b"
        style={{ backgroundColor: headerBg, borderColor: headerBorder }}
      >
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl transition-colors active:opacity-70"
          aria-label="뒤로"
        >
          <ArrowLeft size={22} style={{ color: textPrimary }} />
        </button>
        <h1 className="text-base font-bold" style={{ color: textPrimary }}>
          알림 설정
        </h1>
      </div>

      {/* 설명 텍스트 */}
      <div className="px-4 pt-5 pb-3">
        <p className="text-sm" style={{ color: textSecond }}>
          원하는 알림만 선택해서 받을 수 있어요.
        </p>
      </div>

      {/* 설정 카드 목록 */}
      <div className="px-4 flex flex-col gap-3">
        {settings === null ? (
          // 로딩 스켈레톤
          <>
            <div
              className="rounded-2xl h-[76px] animate-pulse"
              style={{ backgroundColor: cardBg }}
            />
            <div
              className="rounded-2xl h-[76px] animate-pulse"
              style={{ backgroundColor: cardBg }}
            />
          </>
        ) : (
          <>
            <SettingCard
              emoji={<MessageCircle size={22} color="#3b82f6" />}
              title="댓글 알림"
              description="내 일기에 댓글이 달리면 알려줘요"
              checked={settings.commentNotificationEnabled}
              onChange={() => toggle("commentNotificationEnabled")}
              disabled={saving}
              bg={cardBg}
              border={cardBorder}
              textPrimary={textPrimary}
              textSecondary={textSecond}
            />
            <SettingCard
              emoji={<Heart size={22} color="#ef4444" />}
              title="반응 알림"
              description="내 일기에 반응이 달리면 알려줘요"
              checked={settings.reactionNotificationEnabled}
              onChange={() => toggle("reactionNotificationEnabled")}
              disabled={saving}
              bg={cardBg}
              border={cardBorder}
              textPrimary={textPrimary}
              textSecondary={textSecond}
            />
          </>
        )}
      </div>

      {/* 안내 문구 */}
      <div className="px-4 mt-6">
        <p
          className="text-xs leading-relaxed"
          style={{ color: textSecond }}
        >
          * 알림을 끄면 해당 유형의 알림은 더 이상 생성되지 않아요.
          <br />
          기존에 받은 알림은 그대로 유지됩니다.
        </p>
      </div>
    </div>
  );
}
