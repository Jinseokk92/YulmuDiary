"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CalendarDays, Check, SlidersHorizontal } from "lucide-react";
import { api } from "@/lib/api";
import type { UserResponse } from "@/types";
import UserAvatar from "@/components/ui/UserAvatar";

export type FilterMode = "all" | "latest" | "oldest" | "date" | "user";

export interface DiaryFilters {
  mode: FilterMode;
  sort: "LATEST" | "OLDEST";
  startDate: string | null;
  endDate: string | null;
  userId: number | null;
  userName: string | null;
}

export const DEFAULT_DIARY_FILTERS: DiaryFilters = {
  mode: "all",
  sort: "LATEST",
  startDate: null,
  endDate: null,
  userId: null,
  userName: null,
};

interface FilterBarProps {
  filters: DiaryFilters;
  onChange: (filters: DiaryFilters) => void;
}

type FilterScope = "all" | "date" | "user";

const ORANGE = "#e4701e";
const TEXT = "#111827";
const MUTED = "#6b7280";
const BORDER = "rgba(15, 23, 42, 0.08)";
const SHEET_BG = "#fffdf9";

const SCOPE_OPTIONS: { key: FilterScope; label: string }[] = [
  { key: "all", label: "전체 일기" },
  { key: "user", label: "사용자별" },
  { key: "date", label: "날짜 범위" },
];

const SORT_OPTIONS: { key: DiaryFilters["sort"]; label: string }[] = [
  { key: "LATEST", label: "최신순" },
  { key: "OLDEST", label: "오래된순" },
];

const getScopeFromFilters = (filters: DiaryFilters): FilterScope => {
  if (filters.mode === "user") return "user";
  if (filters.mode === "date") return "date";
  return "all";
};

const formatMetaDate = (value: string) => value.replaceAll("-", ".");

const getMetaLabel = (filters: DiaryFilters) => {
  if (filters.mode === "user") {
    return `${filters.userName || "가족"}의 일기`;
  }

  if (filters.mode === "date") {
    if (filters.startDate && filters.endDate) {
      return `${formatMetaDate(filters.startDate)} ~ ${formatMetaDate(filters.endDate)}`;
    }
    if (filters.startDate) {
      return `${formatMetaDate(filters.startDate)} ~`;
    }
    if (filters.endDate) {
      return `~ ${formatMetaDate(filters.endDate)}`;
    }
  }

  return "전체 일기";
};

const buildFilters = ({
  scope,
  sort,
  startDate,
  endDate,
  userId,
  userName,
}: {
  scope: FilterScope;
  sort: DiaryFilters["sort"];
  startDate?: string | null;
  endDate?: string | null;
  userId?: number | null;
  userName?: string | null;
}): DiaryFilters => {
  if (scope === "user") {
    return {
      ...DEFAULT_DIARY_FILTERS,
      mode: "user",
      sort,
      userId: userId ?? null,
      userName: userName ?? null,
    };
  }

  if (scope === "date") {
    return {
      ...DEFAULT_DIARY_FILTERS,
      mode: "date",
      sort,
      startDate: startDate ?? null,
      endDate: endDate ?? null,
    };
  }

  return {
    ...DEFAULT_DIARY_FILTERS,
    mode: sort === "OLDEST" ? "oldest" : "all",
    sort,
  };
};

const normalizeDateRange = (start: string, end: string) => {
  if (start && end && start > end) {
    return { startDate: end, endDate: start };
  }

  return { startDate: start, endDate: end };
};

export default function FilterBar({ filters, onChange }: FilterBarProps) {
  const startDateInputRef = useRef<HTMLInputElement>(null);
  const endDateInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<FilterScope>(getScopeFromFilters(filters));
  const [sort, setSort] = useState<DiaryFilters["sort"]>(filters.sort);
  const [pendingStart, setPendingStart] = useState(filters.startDate ?? "");
  const [pendingEnd, setPendingEnd] = useState(filters.endDate ?? "");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(filters.userId);
  const [selectedUserName, setSelectedUserName] = useState<string | null>(filters.userName);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const usersLoadedRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    setScope(getScopeFromFilters(filters));
    setSort(filters.sort);
    setPendingStart(filters.startDate ?? "");
    setPendingEnd(filters.endDate ?? "");
    setSelectedUserId(filters.userId);
    setSelectedUserName(filters.userName);
  }, [filters, open]);

  useEffect(() => {
    if (!open) return;

    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.overflowY = "scroll";

    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflowY = "";
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  useEffect(() => {
    if (!open || scope !== "user" || usersLoadedRef.current) return;

    usersLoadedRef.current = true;
    setUsersLoading(true);

    api
      .get<UserResponse[]>("/api/users")
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]))
      .finally(() => setUsersLoading(false));
  }, [open, scope]);

  const closeSheet = () => {
    setOpen(false);
  };

  const applyScope = (nextScope: FilterScope) => {
    setScope(nextScope);

    if (nextScope === "all") {
      onChange(
        buildFilters({
          scope: "all",
          sort,
        })
      );
      closeSheet();
    }
  };

  const applySort = (nextSort: DiaryFilters["sort"]) => {
    setSort(nextSort);

    if (scope === "all") {
      onChange(
        buildFilters({
          scope: "all",
          sort: nextSort,
        })
      );
      return;
    }

    if (scope === "user" && selectedUserId) {
      onChange(
        buildFilters({
          scope: "user",
          sort: nextSort,
          userId: selectedUserId,
          userName: selectedUserName,
        })
      );
      return;
    }

    if (scope === "date" && (filters.mode === "date" || pendingStart || pendingEnd)) {
      const normalized = normalizeDateRange(pendingStart, pendingEnd);
      if (normalized.startDate || normalized.endDate) {
        onChange(
          buildFilters({
            scope: "date",
            sort: nextSort,
            startDate: normalized.startDate || null,
            endDate: normalized.endDate || null,
          })
        );
      }
    }
  };

  const applyDate = () => {
    if (!pendingStart && !pendingEnd) return;

    const normalized = normalizeDateRange(pendingStart, pendingEnd);
    onChange(
      buildFilters({
        scope: "date",
        sort,
        startDate: normalized.startDate || null,
        endDate: normalized.endDate || null,
      })
    );
    closeSheet();
  };

  const applyUser = (user: UserResponse) => {
    setSelectedUserId(user.id);
    setSelectedUserName(user.name);
    onChange(
      buildFilters({
        scope: "user",
        sort,
        userId: user.id,
        userName: user.name,
      })
    );
    closeSheet();
  };

  const openDatePicker = (input: HTMLInputElement | null) => {
    if (!input) return;

    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }

    input.click();
    input.focus();
  };

  const metaLabel = getMetaLabel(filters);
  const sortLabel = filters.sort === "OLDEST" ? "오래된순" : "최신순";
  const showDateFooter = scope === "date";

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          minHeight: 36,
        }}
      >
        <div
          style={{
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            gap: 6,
            overflow: "hidden",
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: TEXT,
            }}
          >
            {metaLabel}
          </span>
          <span
            style={{
              flexShrink: 0,
              fontSize: 12,
              color: MUTED,
            }}
          >
            ·
          </span>
          <span
            style={{
              flexShrink: 0,
              fontSize: 12,
              fontWeight: 600,
              color: filters.sort === "OLDEST" ? ORANGE : MUTED,
            }}
          >
            {sortLabel}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            minHeight: 36,
            border: "none",
            borderRadius: 999,
            background: "transparent",
            padding: "6px 4px 6px 8px",
            color: MUTED,
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          <SlidersHorizontal size={15} strokeWidth={2.1} />
          <span>필터</span>
        </button>
      </div>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <>
                <motion.button
                  key="backdrop"
                  type="button"
                  aria-label="필터 닫기"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  onClick={closeSheet}
                  style={{
                    position: "fixed",
                    inset: 0,
                    border: "none",
                    background: "rgba(15, 23, 42, 0.34)",
                    padding: 0,
                    zIndex: 90,
                  }}
                />

                <motion.div
                  key="sheet"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", stiffness: 360, damping: 34 }}
                  style={{
                    position: "fixed",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 91,
                    margin: "0 auto",
                    width: "100%",
                    maxWidth: 512,
                    maxHeight: "78vh",
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    backgroundColor: SHEET_BG,
                    boxShadow: "0 -8px 32px rgba(15, 23, 42, 0.12)",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }}
                  onClick={(event) => event.stopPropagation()}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      paddingTop: 10,
                      paddingBottom: 6,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 4,
                        borderRadius: 999,
                        backgroundColor: "rgba(107, 114, 128, 0.28)",
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0 18px 14px",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 18,
                          fontWeight: 800,
                          color: TEXT,
                          letterSpacing: "-0.03em",
                        }}
                      >
                        필터
                      </p>
                      <p
                        style={{
                          margin: "4px 0 0",
                          fontSize: 12,
                          color: MUTED,
                        }}
                      >
                        원하는 범위와 정렬로 일기를 골라보세요.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={closeSheet}
                      style={{
                        border: "none",
                        background: "transparent",
                        padding: 6,
                        color: MUTED,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      닫기
                    </button>
                  </div>

                  <div
                    style={{
                      overflowY: "auto",
                      flex: 1,
                      padding: showDateFooter
                        ? "0 16px 28px"
                        : "0 16px max(20px, env(safe-area-inset-bottom))",
                    }}
                  >
                    <section
                      style={{
                        padding: "16px 0",
                        borderTop: `1px solid ${BORDER}`,
                      }}
                    >
                      <p
                        style={{
                          margin: "0 0 10px",
                          fontSize: 13,
                          fontWeight: 700,
                          color: MUTED,
                        }}
                      >
                        범위
                      </p>

                      <div
                        style={{
                          display: "grid",
                          gap: 8,
                        }}
                      >
                        {SCOPE_OPTIONS.map((option) => {
                          const active = scope === option.key;

                          return (
                            <button
                              key={option.key}
                              type="button"
                              onClick={() => applyScope(option.key)}
                              style={{
                                width: "100%",
                                minHeight: 48,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 12,
                                border: `1px solid ${active ? "rgba(228, 112, 30, 0.22)" : BORDER}`,
                                borderRadius: 14,
                                backgroundColor: active ? "rgba(228, 112, 30, 0.08)" : "#ffffff",
                                padding: "0 14px",
                                cursor: "pointer",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 15,
                                  fontWeight: active ? 700 : 600,
                                  color: active ? ORANGE : TEXT,
                                }}
                              >
                                {option.label}
                              </span>
                              {active && <Check size={16} color={ORANGE} strokeWidth={3} />}
                            </button>
                          );
                        })}
                      </div>
                    </section>

                    <section
                      style={{
                        padding: "16px 0",
                        borderTop: `1px solid ${BORDER}`,
                      }}
                    >
                      <p
                        style={{
                          margin: "0 0 10px",
                          fontSize: 13,
                          fontWeight: 700,
                          color: MUTED,
                        }}
                      >
                        정렬
                      </p>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                          gap: 8,
                        }}
                      >
                        {SORT_OPTIONS.map((option) => {
                          const active = sort === option.key;

                          return (
                            <button
                              key={option.key}
                              type="button"
                              onClick={() => applySort(option.key)}
                              style={{
                                minHeight: 46,
                                border: `1px solid ${active ? "rgba(228, 112, 30, 0.22)" : BORDER}`,
                                borderRadius: 14,
                                backgroundColor: active ? "rgba(228, 112, 30, 0.08)" : "#ffffff",
                                color: active ? ORANGE : TEXT,
                                fontSize: 14,
                                fontWeight: active ? 700 : 600,
                                cursor: "pointer",
                              }}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </section>

                    {scope === "date" && (
                      <section
                        style={{
                          padding: "16px 0",
                          borderTop: `1px solid ${BORDER}`,
                        }}
                      >
                        <p
                          style={{
                            margin: "0 0 10px",
                            fontSize: 13,
                            fontWeight: 700,
                            color: MUTED,
                          }}
                        >
                          날짜 범위
                        </p>

                        <div
                          style={{
                            display: "grid",
                            gap: 12,
                            padding: 12,
                            border: `1px solid rgba(228, 112, 30, 0.12)`,
                            borderRadius: 18,
                            backgroundColor: "#fff7ed",
                          }}
                        >
                          <p
                            style={{
                              margin: 0,
                              fontSize: 12,
                              lineHeight: 1.5,
                              color: MUTED,
                            }}
                          >
                            보고 싶은 기간을 골라 주세요. 시작일과 종료일을 각각 눌러 선택할 수 있어요.
                          </p>

                          <div
                            style={{
                              display: "grid",
                              gap: 10,
                            }}
                          >
                            <div
                              style={{
                                position: "relative",
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => openDatePicker(startDateInputRef.current)}
                                style={{
                                  minHeight: 64,
                                  width: "100%",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 12,
                                  border: `1px solid ${BORDER}`,
                                  borderRadius: 16,
                                  backgroundColor: "#ffffff",
                                  padding: "0 14px",
                                  boxShadow: "0 6px 16px rgba(15, 23, 42, 0.04)",
                                  cursor: "pointer",
                                }}
                              >
                                <div
                                  style={{
                                    width: 38,
                                    height: 38,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    borderRadius: 12,
                                    backgroundColor: "rgba(228, 112, 30, 0.1)",
                                    color: ORANGE,
                                    flexShrink: 0,
                                  }}
                                >
                                  <CalendarDays size={18} strokeWidth={2.1} />
                                </div>
                                <div
                                  style={{
                                    flex: 1,
                                    minWidth: 0,
                                    display: "grid",
                                    gap: 2,
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: 12,
                                      fontWeight: 700,
                                      color: MUTED,
                                    }}
                                  >
                                    시작일
                                  </span>
                                  <span
                                    style={{
                                      fontSize: 15,
                                      fontWeight: pendingStart ? 700 : 600,
                                      color: pendingStart ? TEXT : "#9ca3af",
                                      letterSpacing: "-0.02em",
                                    }}
                                  >
                                    {pendingStart ? formatMetaDate(pendingStart) : "날짜 선택"}
                                  </span>
                                </div>
                              </button>
                              <input
                                ref={startDateInputRef}
                                type="date"
                                value={pendingStart}
                                onChange={(event) => setPendingStart(event.target.value)}
                                style={{
                                  position: "absolute",
                                  width: 1,
                                  height: 1,
                                  padding: 0,
                                  margin: -1,
                                  overflow: "hidden",
                                  clip: "rect(0, 0, 0, 0)",
                                  whiteSpace: "nowrap",
                                  border: 0,
                                  opacity: 0,
                                }}
                              />
                            </div>

                            <div
                              style={{
                                display: "flex",
                                justifyContent: "center",
                                color: "rgba(228, 112, 30, 0.72)",
                              }}
                            >
                              <div
                                style={{
                                  width: 32,
                                  height: 32,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  borderRadius: 999,
                                  backgroundColor: "rgba(255, 255, 255, 0.72)",
                                  border: `1px solid rgba(228, 112, 30, 0.12)`,
                                }}
                              >
                                <ArrowRight size={16} strokeWidth={2.2} />
                              </div>
                            </div>

                            <div
                              style={{
                                position: "relative",
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => openDatePicker(endDateInputRef.current)}
                                style={{
                                  minHeight: 64,
                                  width: "100%",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 12,
                                  border: `1px solid ${BORDER}`,
                                  borderRadius: 16,
                                  backgroundColor: "#ffffff",
                                  padding: "0 14px",
                                  boxShadow: "0 6px 16px rgba(15, 23, 42, 0.04)",
                                  cursor: "pointer",
                                }}
                              >
                                <div
                                  style={{
                                    width: 38,
                                    height: 38,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    borderRadius: 12,
                                    backgroundColor: "rgba(228, 112, 30, 0.1)",
                                    color: ORANGE,
                                    flexShrink: 0,
                                  }}
                                >
                                  <CalendarDays size={18} strokeWidth={2.1} />
                                </div>
                                <div
                                  style={{
                                    flex: 1,
                                    minWidth: 0,
                                    display: "grid",
                                    gap: 2,
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: 12,
                                      fontWeight: 700,
                                      color: MUTED,
                                    }}
                                  >
                                    종료일
                                  </span>
                                  <span
                                    style={{
                                      fontSize: 15,
                                      fontWeight: pendingEnd ? 700 : 600,
                                      color: pendingEnd ? TEXT : "#9ca3af",
                                      letterSpacing: "-0.02em",
                                    }}
                                  >
                                    {pendingEnd ? formatMetaDate(pendingEnd) : "날짜 선택"}
                                  </span>
                                </div>
                              </button>
                              <input
                                ref={endDateInputRef}
                                type="date"
                                value={pendingEnd}
                                onChange={(event) => setPendingEnd(event.target.value)}
                                style={{
                                  position: "absolute",
                                  width: 1,
                                  height: 1,
                                  padding: 0,
                                  margin: -1,
                                  overflow: "hidden",
                                  clip: "rect(0, 0, 0, 0)",
                                  whiteSpace: "nowrap",
                                  border: 0,
                                  opacity: 0,
                                }}
                              />
                            </div>
                          </div>
                        </div>

                      </section>
                    )}

                    {scope === "user" && (
                      <section
                        style={{
                          padding: "16px 0",
                          borderTop: `1px solid ${BORDER}`,
                        }}
                      >
                        <p
                          style={{
                            margin: "0 0 10px",
                            fontSize: 13,
                            fontWeight: 700,
                            color: MUTED,
                          }}
                        >
                          가족 구성원
                        </p>

                        <div
                          style={{
                            display: "grid",
                            gap: 8,
                          }}
                        >
                          {usersLoading ? (
                            <div
                              style={{
                                minHeight: 56,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: 14,
                                backgroundColor: "#ffffff",
                                fontSize: 13,
                                color: MUTED,
                              }}
                            >
                              가족 구성원을 불러오는 중입니다.
                            </div>
                          ) : users.length === 0 ? (
                            <div
                              style={{
                                minHeight: 56,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: 14,
                                backgroundColor: "#ffffff",
                                fontSize: 13,
                                color: MUTED,
                              }}
                            >
                              표시할 가족 구성원이 없습니다.
                            </div>
                          ) : (
                            users.map((user) => {
                              const active = filters.userId === user.id;

                              return (
                                <button
                                  key={user.id}
                                  type="button"
                                  onClick={() => applyUser(user)}
                                  style={{
                                    width: "100%",
                                    minHeight: 52,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    border: `1px solid ${active ? "rgba(228, 112, 30, 0.22)" : BORDER}`,
                                    borderRadius: 14,
                                    backgroundColor: active ? "rgba(228, 112, 30, 0.08)" : "#ffffff",
                                    padding: "0 14px",
                                    cursor: "pointer",
                                  }}
                                >
                                  <UserAvatar
                                    nickname={user.name}
                                    profileImageUrl={user.profileImageUrl}
                                    size="sm"
                                  />
                                  <span
                                    style={{
                                      flex: 1,
                                      minWidth: 0,
                                      textAlign: "left",
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      fontSize: 14,
                                      fontWeight: active ? 700 : 600,
                                      color: active ? ORANGE : TEXT,
                                    }}
                                  >
                                    {user.name}
                                  </span>
                                  {active && <Check size={16} color={ORANGE} strokeWidth={3} />}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </section>
                    )}
                  </div>

                  {showDateFooter && (
                    <div
                      style={{
                        flexShrink: 0,
                        padding: "12px 16px calc(16px + env(safe-area-inset-bottom))",
                        backgroundColor: "rgba(255, 253, 249, 0.96)",
                        backdropFilter: "blur(12px)",
                        WebkitBackdropFilter: "blur(12px)",
                        borderTop: `1px solid ${BORDER}`,
                        boxShadow: "0 -8px 20px rgba(15, 23, 42, 0.04)",
                      }}
                    >
                      <button
                        type="button"
                        onClick={applyDate}
                        disabled={!pendingStart && !pendingEnd}
                        style={{
                          width: "100%",
                          minHeight: 52,
                          border: "none",
                          borderRadius: 16,
                          backgroundColor: !pendingStart && !pendingEnd ? "#fed7aa" : ORANGE,
                          color: "#ffffff",
                          fontSize: 15,
                          fontWeight: 700,
                          cursor: !pendingStart && !pendingEnd ? "not-allowed" : "pointer",
                          opacity: !pendingStart && !pendingEnd ? 0.72 : 1,
                          boxShadow: !pendingStart && !pendingEnd
                            ? "none"
                            : "0 10px 22px rgba(228, 112, 30, 0.22)",
                        }}
                      >
                        적용
                      </button>
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
