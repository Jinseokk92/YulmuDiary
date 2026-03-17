"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { ArrowLeft, Eye, EyeOff, Copy, Check, RefreshCw, Shield, CalendarDays } from "lucide-react";
import DatePickerSheet from "@/components/ui/DatePickerSheet";
import { useAuthStore } from "@/stores/authStore";
import { useRequireAdmin } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import ConfirmModal from "@/components/ui/ConfirmModal";
import UserAvatar from "@/components/ui/UserAvatar";
import type { AdminInviteCodesResponse, AdminMemberResponse, AdminAppSettingsResponse } from "@/types";

// ─── 헬퍼 ─────────────────────────────────────────────────────────────────────
const maskCode = (code: string) => code.slice(0, 3) + "***";

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
};

// ─── 카드 래퍼 ────────────────────────────────────────────────────────────────
function Card({ children, isDark }: { children: React.ReactNode; isDark: boolean }) {
  return (
    <div
      className="rounded-2xl p-5 mb-4"
      style={{
        background: isDark ? "rgba(30,41,59,0.7)" : "rgba(255,255,255,0.95)",
        border: `1px solid ${isDark ? "#334155" : "#f3f4f6"}`,
        boxShadow: isDark ? "none" : "0 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ title, isDark }: { title: string; isDark: boolean }) {
  return (
    <p className="text-xs font-bold uppercase tracking-wider mb-4"
      style={{ color: isDark ? "#94a3b8" : "#9ca3af" }}>
      {title}
    </p>
  );
}

// ─── 메인 페이지 ──────────────────────────────────────────────────────────────
export default function FamilyManagePage() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const { user } = useAuthStore();
  const { isAdmin, isLoading } = useRequireAdmin("/");
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const isDark = mounted && resolvedTheme === "dark";

  // ── A. 초대 코드 ────────────────────────────────────────────────────
  const [codes, setCodes] = useState<AdminInviteCodesResponse | null>(null);
  const [codesLoading, setCodesLoading] = useState(true);
  const [showCode, setShowCode] = useState<{ relative: boolean; parent: boolean }>({ relative: false, parent: false });
  const [copied, setCopied] = useState<"relative" | "parent" | null>(null);
  const [regenConfirm, setRegenConfirm] = useState<"RELATIVE" | "PARENT" | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  // ── B. 멤버 ─────────────────────────────────────────────────────────
  const [members, setMembers] = useState<AdminMemberResponse[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [kickTarget, setKickTarget] = useState<AdminMemberResponse | null>(null);
  const [kicking, setKicking] = useState(false);

  // ── D. 앱 설정 ──────────────────────────────────────────────────────
  const [settings, setSettings] = useState<{ babyName: string; dueDate: string } | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // ── 초기 데이터 로드 ────────────────────────────────────────────────
  useEffect(() => {
    if (!isAdmin) return;
    api.get<AdminInviteCodesResponse>("/api/admin/invite-codes")
      .then(setCodes)
      .catch(() => {})
      .finally(() => setCodesLoading(false));

    api.get<AdminMemberResponse[]>("/api/admin/family-group/members")
      .then(setMembers)
      .catch(() => {})
      .finally(() => setMembersLoading(false));

    api.get<AdminAppSettingsResponse>("/api/admin/app-settings")
      .then((s) => setSettings({ babyName: s.babyName, dueDate: s.dueDate }))
      .catch(() => {})
      .finally(() => setSettingsLoading(false));
  }, [isAdmin]);

  // ── 코드 복사 ──────────────────────────────────────────────────────
  const handleCopy = useCallback((type: "relative" | "parent") => {
    const code = type === "relative" ? codes?.relativeCode : codes?.parentCode;
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(type);
      setTimeout(() => setCopied(null), 1500);
    });
  }, [codes]);

  // ── 코드 재발급 ────────────────────────────────────────────────────
  const handleRegenerate = useCallback(async () => {
    if (!regenConfirm) return;
    setRegenerating(true);
    try {
      const res = await api.post<{ role: string; inviteCode: string }>(
        "/api/admin/invite-codes/regenerate",
        { role: regenConfirm }
      );
      setCodes((prev) => {
        if (!prev) return prev;
        return regenConfirm === "PARENT"
          ? { ...prev, parentCode: res.inviteCode }
          : { ...prev, relativeCode: res.inviteCode };
      });
      // 새 코드 발급 후 마스킹 상태로 리셋
      setShowCode((prev) => ({
        ...prev,
        [regenConfirm === "PARENT" ? "parent" : "relative"]: false,
      }));
    } catch {
      alert("코드 재발급에 실패했습니다.");
    } finally {
      setRegenerating(false);
      setRegenConfirm(null);
    }
  }, [regenConfirm]);

  // ── 멤버 내보내기 ──────────────────────────────────────────────────
  const handleKick = useCallback(async () => {
    if (!kickTarget) return;
    setKicking(true);
    try {
      await api.delete(`/api/admin/family-group/members/${kickTarget.userId}`);
      setMembers((prev) => prev.filter((m) => m.userId !== kickTarget.userId));
    } catch {
      alert("멤버 내보내기에 실패했습니다.");
    } finally {
      setKicking(false);
      setKickTarget(null);
    }
  }, [kickTarget]);

  // ── 앱 설정 저장 ───────────────────────────────────────────────────
  const handleSaveSettings = useCallback(async () => {
    if (!settings) return;
    setSavingSettings(true);
    try {
      const updated = await api.patch<AdminAppSettingsResponse>("/api/admin/app-settings", {
        babyName: settings.babyName,
        dueDate: settings.dueDate,
      });
      setSettings({ babyName: updated.babyName, dueDate: updated.dueDate });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2000);
    } catch {
      alert("설정 저장에 실패했습니다.");
    } finally {
      setSavingSettings(false);
    }
  }, [settings]);

  if (!mounted || isLoading || !isAdmin) return null;

  // ── 색상 토큰 ────────────────────────────────────────────────────
  const text      = isDark ? "#f1f5f9" : "#111827";
  const subText   = isDark ? "#94a3b8" : "#6b7280";
  const inputBg   = isDark ? "#1e293b" : "#f9fafb";
  const inputBorder = isDark ? "#334155" : "#e5e7eb";

  return (
    <div className="px-4 pt-3 pb-20">

      {/* ── 페이지 헤더 ── */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center w-8 h-8 rounded-xl transition-colors"
          style={{ color: subText }}
          aria-label="뒤로가기"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-primary-500" />
          <h1 className="text-lg font-bold" style={{ color: text }}>가족 관리</h1>
        </div>
      </div>

      {/* ── A. 초대 코드 관리 ── */}
      <Card isDark={isDark}>
        <SectionTitle title="초대 코드 관리" isDark={isDark} />

        {codesLoading ? (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {(["parent", "relative"] as const).map((type) => {
              const code = type === "parent" ? codes?.parentCode : codes?.relativeCode;
              const label = type === "parent" ? "부모 초대 코드" : "가족 초대 코드";
              const role = type === "parent" ? "PARENT" : "RELATIVE";
              const isVisible = showCode[type];
              const isCopied = copied === type;

              return (
                <div key={type} className="mb-4 last:mb-0">
                  <p className="text-xs font-semibold mb-2" style={{ color: subText }}>{label}</p>
                  <div className="flex items-center gap-2">
                    {/* 코드 표시 */}
                    <div
                      className="flex-1 flex items-center justify-between rounded-xl px-3 py-2.5"
                      style={{ background: inputBg, border: `1px solid ${inputBorder}` }}
                    >
                      <span className="font-mono text-sm font-semibold tracking-widest" style={{ color: text }}>
                        {code ? (isVisible ? code : maskCode(code)) : "—"}
                      </span>
                      <button
                        onClick={() => setShowCode((prev) => ({ ...prev, [type]: !prev[type] }))}
                        className="ml-2 shrink-0"
                        style={{ color: subText }}
                        aria-label={isVisible ? "숨기기" : "코드 보기"}
                      >
                        {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>

                    {/* 복사 */}
                    <button
                      onClick={() => handleCopy(type)}
                      disabled={!code}
                      className="flex items-center justify-center w-9 h-9 rounded-xl transition-colors disabled:opacity-40"
                      style={{
                        background: isCopied ? "#22c55e22" : (isDark ? "#1e293b" : "#f3f4f6"),
                        color: isCopied ? "#22c55e" : subText,
                        border: `1px solid ${inputBorder}`,
                      }}
                      aria-label="복사"
                    >
                      {isCopied ? <Check size={14} /> : <Copy size={14} />}
                    </button>

                    {/* 재발급 */}
                    <button
                      onClick={() => setRegenConfirm(role)}
                      disabled={!code}
                      className="flex items-center justify-center w-9 h-9 rounded-xl transition-colors disabled:opacity-40"
                      style={{
                        background: isDark ? "#1e293b" : "#fff1f2",
                        color: "#ef4444",
                        border: `1px solid ${isDark ? "#334155" : "#fecaca"}`,
                      }}
                      aria-label="새 코드 발급"
                    >
                      <RefreshCw size={14} />
                    </button>
                  </div>
                </div>
              );
            })}

            <p className="mt-4 text-xs leading-relaxed" style={{ color: subText }}>
              새 코드를 발급하면 기존 코드는 사용할 수 없어요. 이미 가입한 가족은 영향 없어요.
            </p>
          </>
        )}
      </Card>

      {/* ── B. 가족 멤버 관리 ── */}
      <Card isDark={isDark}>
        <SectionTitle title="가족 멤버" isDark={isDark} />

        {membersLoading ? (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : members.length === 0 ? (
          <p className="text-sm text-center py-3" style={{ color: subText }}>멤버가 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {members.map((member) => {
              const isMe = member.userId === user?.id;
              return (
                <div
                  key={member.userId}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                  style={{ background: isDark ? "rgba(255,255,255,0.04)" : "#f9fafb" }}
                >
                  <UserAvatar
                    nickname={member.name}
                    profileImageUrl={member.profileImageUrl}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold truncate" style={{ color: text }}>
                        {member.name}
                      </span>
                      {isMe && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{ background: "#fff7ed", color: "#ea580c" }}>
                          나
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                        style={{
                          background: member.role === "PARENT"
                            ? (isDark ? "rgba(234,88,12,0.2)" : "#fff7ed")
                            : (isDark ? "rgba(100,116,139,0.2)" : "#f1f5f9"),
                          color: member.role === "PARENT" ? "#ea580c" : (isDark ? "#94a3b8" : "#64748b"),
                        }}>
                        {member.role === "PARENT" ? "부모" : "가족"}
                      </span>
                      <span className="text-[10px]" style={{ color: subText }}>
                        {formatDate(member.joinedAt)}
                      </span>
                    </div>
                  </div>

                  {/* 내보내기 — 본인 제외 */}
                  {!isMe && (
                    <button
                      onClick={() => setKickTarget(member)}
                      className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors"
                      style={{
                        color: "#ef4444",
                        background: isDark ? "rgba(239,68,68,0.1)" : "#fff1f2",
                        border: "1px solid #fecaca",
                      }}
                    >
                      내보내기
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ── C. 전체 게시글 관리 ── */}
      <Card isDark={isDark}>
        <SectionTitle title="전체 게시글 관리" isDark={isDark} />
        <div
          className="flex items-start gap-2.5 rounded-xl px-4 py-3"
          style={{ background: isDark ? "rgba(234,88,12,0.08)" : "#fff7ed", border: "1px solid #fed7aa" }}
        >
          <Shield size={14} className="text-primary-500 shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed" style={{ color: isDark ? "#fb923c" : "#c2410c" }}>
            관리자는 일기 피드에서 모든 게시글을 삭제할 수 있어요.
          </p>
        </div>
      </Card>

      {/* ── D. 앱 설정 ── */}
      <Card isDark={isDark}>
        <SectionTitle title="앱 설정" isDark={isDark} />

        {settingsLoading ? (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : settings && (
          <div className="space-y-4">
            {/* 아기 이름 */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: subText }}>
                아기 이름
              </label>
              <input
                type="text"
                value={settings.babyName}
                onChange={(e) => setSettings((prev) => prev ? { ...prev, babyName: e.target.value } : prev)}
                maxLength={30}
                className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-colors"
                style={{
                  background: inputBg,
                  border: `1px solid ${inputBorder}`,
                  color: text,
                }}
              />
            </div>

            {/* 출산 예정일 */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: subText }}>
                출산 예정일
              </label>
              <button
                type="button"
                onClick={() => setShowDatePicker(true)}
                className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors text-left"
                style={{
                  background: inputBg,
                  border: `1px solid ${inputBorder}`,
                  color: settings.dueDate ? text : subText,
                }}
              >
                <span>{settings.dueDate ? formatDate(settings.dueDate) : "날짜 선택"}</span>
                <CalendarDays size={16} style={{ color: subText }} />
              </button>
            </div>

            {/* 저장 버튼 */}
            <button
              onClick={handleSaveSettings}
              disabled={savingSettings || !settings.babyName.trim()}
              className="w-full rounded-xl py-2.5 text-sm font-semibold transition-all disabled:opacity-50"
              style={{
                background: settingsSaved ? "#22c55e" : "#e4701e",
                color: "#ffffff",
              }}
            >
              {savingSettings ? "저장 중..." : settingsSaved ? "저장됨!" : "저장"}
            </button>
          </div>
        )}
      </Card>

      {/* ── 초대 코드 재발급 확인 ── */}
      <ConfirmModal
        open={regenConfirm !== null}
        title={`${regenConfirm === "PARENT" ? "부모" : "가족"} 초대 코드를 재발급할까요?`}
        description="기존 코드는 즉시 무효화되고 새 코드가 발급돼요. 이미 가입한 멤버는 영향 없어요."
        confirmLabel="재발급"
        onConfirm={handleRegenerate}
        onCancel={() => setRegenConfirm(null)}
        loading={regenerating}
      />

      {/* ── 날짜 피커 ── */}
      {showDatePicker && settings && (
        <DatePickerSheet
          value={settings.dueDate}
          onChange={(date) => setSettings((prev) => prev ? { ...prev, dueDate: date } : prev)}
          onClose={() => setShowDatePicker(false)}
          isDark={isDark}
        />
      )}

      {/* ── 멤버 내보내기 확인 ── */}
      <ConfirmModal
        open={kickTarget !== null}
        title={`${kickTarget?.name ?? ""}님을 가족에서 내보낼까요?`}
        description="내보내면 해당 멤버는 일기장에 접근할 수 없어요."
        confirmLabel="내보내기"
        onConfirm={handleKick}
        onCancel={() => setKickTarget(null)}
        loading={kicking}
      />
    </div>
  );
}
