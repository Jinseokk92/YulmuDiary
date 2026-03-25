"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { ArrowLeft, Eye, EyeOff, Copy, Check, RefreshCw, Shield, CalendarDays, Trophy } from "lucide-react";
import DatePickerSheet from "@/components/ui/DatePickerSheet";
import { useAuthStore } from "@/stores/authStore";
import { useRequireAdmin } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import ConfirmModal from "@/components/ui/ConfirmModal";
import UserAvatar from "@/components/ui/UserAvatar";
import type { AdminInviteCodesResponse, AdminMemberResponse, AdminAppSettingsResponse, BestPhotoStatusResponse } from "@/types";

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

  // ── E. 베스트 포토 관리 ──────────────────────────────────────────────
  const [bestPhotoStatus, setBestPhotoStatus] = useState<BestPhotoStatusResponse | null>(null);
  const [bestPhotoLoading, setBestPhotoLoading] = useState(true);
  const [bestPhotoActing, setBestPhotoActing] = useState(false);

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

    api.get<BestPhotoStatusResponse>("/api/best-photo/status")
      .then(setBestPhotoStatus)
      .catch(() => {})
      .finally(() => setBestPhotoLoading(false));
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

  // ── 베스트 포토 단계 제어 ──────────────────────────────────────────
  const handleBestPhotoAction = useCallback(async (action: "start" | "start-vote" | "end-vote") => {
    if (bestPhotoActing) return;
    setBestPhotoActing(true);
    const endpoints: Record<string, string> = {
      "start": "/api/best-photo/rounds",
      "start-vote": "/api/best-photo/rounds/start-vote",
      "end-vote": "/api/best-photo/rounds/end-vote",
    };
    try {
      await api.post<void>(endpoints[action], {});
      const updated = await api.get<BestPhotoStatusResponse>("/api/best-photo/status");
      // 두 상태를 동일 렌더 배치에 적용 — 중간 상태(status 갱신됐는데 acting=true)로
      // 새 버튼에 "처리 중..." 텍스트가 순간 노출되는 현상을 방지한다.
      setBestPhotoStatus(updated);
      setBestPhotoActing(false);
    } catch {
      alert("베스트 포토 작업에 실패했습니다.");
      setBestPhotoActing(false);
    }
  }, [bestPhotoActing]);

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
        ) : (() => {
          const sorted = (role: string) =>
            members
              .filter((m) => m.role === role)
              .sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime());
          const parents   = sorted("PARENT");
          const relatives = sorted("RELATIVE");

          const MemberRow = ({ member }: { member: AdminMemberResponse }) => {
            const isMe = member.userId === user?.id;
            return (
              <div
                key={member.userId}
                className="flex items-center gap-3 px-3 py-2.5"
                style={{ borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"}` }}
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
                  <span className="text-[10px]" style={{ color: subText }}>
                    {formatDate(member.joinedAt)}
                  </span>
                </div>
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
          };

          return (
            <div className="space-y-4">
              {/* 부모 섹션 */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-bold" style={{ color: text }}>부모</span>
                </div>
                <div
                  className="rounded-xl overflow-hidden"
                  style={{
                    border: `2px solid ${isDark ? "#c2410c" : "#f97316"}`,
                  }}
                >
                  {parents.length === 0
                    ? <p className="text-xs text-center py-3" style={{ color: subText }}>부모 멤버 없음</p>
                    : parents.map((m) => <MemberRow key={m.userId} member={m} />)
                  }
                </div>
              </div>

              {/* 가족 섹션 */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-bold" style={{ color: text }}>가족</span>
                  <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{
                      background: isDark ? "rgba(100,116,139,0.2)" : "#f1f5f9",
                      color: isDark ? "#94a3b8" : "#64748b",
                    }}>
                    {relatives.length}명
                  </span>
                </div>
                <div
                  className="rounded-xl overflow-hidden"
                  style={{ border: `1px solid ${isDark ? "#334155" : "#e5e7eb"}` }}
                >
                  {relatives.length === 0
                    ? <p className="text-xs text-center py-3" style={{ color: subText }}>가족 멤버 없음</p>
                    : relatives.map((m) => <MemberRow key={m.userId} member={m} />)
                  }
                </div>
              </div>
            </div>
          );
        })()}
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

      {/* ── E. 베스트 포토 관리 ── */}
      <Card isDark={isDark}>
        <SectionTitle title="베스트 포토 관리" isDark={isDark} />

        {bestPhotoLoading ? (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {/* 현재 상태 배지 */}
            <div className="flex items-center gap-2">
              <Trophy size={15} className="text-amber-500" />
              <span className="text-sm font-semibold" style={{ color: text }}>
                현재 상태:
              </span>
              <span className="text-sm px-2 py-0.5 rounded-full font-medium"
                style={{
                  background: bestPhotoStatus?.status === "NONE" || !bestPhotoStatus
                    ? (isDark ? "rgba(100,116,139,0.2)" : "#f1f5f9")
                    : bestPhotoStatus.status === "NOMINATING"
                    ? (isDark ? "rgba(245,158,11,0.15)" : "#fef3c7")
                    : bestPhotoStatus.status === "VOTING"
                    ? (isDark ? "rgba(59,130,246,0.15)" : "#eff6ff")
                    : (isDark ? "rgba(34,197,94,0.15)" : "#f0fdf4"),
                  color: bestPhotoStatus?.status === "NONE" || !bestPhotoStatus
                    ? (isDark ? "#94a3b8" : "#64748b")
                    : bestPhotoStatus.status === "NOMINATING"
                    ? (isDark ? "#fbbf24" : "#d97706")
                    : bestPhotoStatus.status === "VOTING"
                    ? (isDark ? "#60a5fa" : "#2563eb")
                    : (isDark ? "#4ade80" : "#16a34a"),
                }}>
                {!bestPhotoStatus || bestPhotoStatus.status === "NONE"
                  ? "비활성"
                  : bestPhotoStatus.status === "NOMINATING"
                  ? `추천 중 (${bestPhotoStatus.totalNominations}장)`
                  : bestPhotoStatus.status === "VOTING"
                  ? "투표 중"
                  : "결과 공개"}
              </span>
            </div>

            {/* 액션 버튼들 */}
            <div className="flex flex-col gap-2">
              {(!bestPhotoStatus || bestPhotoStatus.status === "NONE") && (
                <button
                  onClick={() => handleBestPhotoAction("start")}
                  disabled={bestPhotoActing}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                  style={{ background: "#e4701e", color: "#ffffff" }}
                >
                  {bestPhotoActing ? "처리 중..." : "새 라운드 시작 (추천 단계)"}
                </button>
              )}

              {bestPhotoStatus?.status === "NOMINATING" && (
                <button
                  onClick={() => handleBestPhotoAction("start-vote")}
                  disabled={bestPhotoActing}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                  style={{ background: "#2563eb", color: "#ffffff" }}
                >
                  {bestPhotoActing ? "처리 중..." : "투표 단계 시작"}
                </button>
              )}

              {bestPhotoStatus?.status === "VOTING" && (
                <button
                  onClick={() => handleBestPhotoAction("end-vote")}
                  disabled={bestPhotoActing}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                  style={{ background: "#16a34a", color: "#ffffff" }}
                >
                  {bestPhotoActing ? "처리 중..." : "투표 종료 & 결과 확정"}
                </button>
              )}

              {bestPhotoStatus?.status === "RESULT" && (
                <button
                  onClick={() => handleBestPhotoAction("start")}
                  disabled={bestPhotoActing}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                  style={{ background: "#e4701e", color: "#ffffff" }}
                >
                  {bestPhotoActing ? "처리 중..." : "다음 라운드 시작"}
                </button>
              )}
            </div>

            <p className="text-xs leading-relaxed" style={{ color: subText }}>
              추천 단계 → 투표 단계 → 결과 확정 순으로 진행돼요. 결과 확정 후 다음 라운드를 시작할 수 있어요.
            </p>
          </div>
        )}
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
