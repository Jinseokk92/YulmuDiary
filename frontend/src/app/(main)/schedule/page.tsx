"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { ScheduleRequest, ScheduleResponse } from "@/types";

// ────────────────────────────────────────────────
// 헬퍼
// ────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate(); // month는 1-based
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay(); // 0=일, 6=토
}

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatEventDate(dateStr: string) {
  const [, m, d] = dateStr.split("-");
  return `${parseInt(m)}월 ${parseInt(d)}일`;
}

// ────────────────────────────────────────────────
// 타입
// ────────────────────────────────────────────────

interface ScheduleSheetState {
  isOpen: boolean;
  selectedDate: string | null; // "YYYY-MM-DD"
}

// ────────────────────────────────────────────────
// 일정 등록 Bottom Sheet
// ────────────────────────────────────────────────

interface ScheduleSheetProps {
  isOpen: boolean;
  selectedDate: string | null;
  schedulesOnDate: ScheduleResponse[];
  onClose: () => void;
  onCreated: (schedule: ScheduleResponse) => void;
  onDeleted: (id: number) => void;
}

function ScheduleSheet({
  isOpen,
  selectedDate,
  schedulesOnDate,
  onClose,
  onCreated,
  onDeleted,
}: ScheduleSheetProps) {
  const [title, setTitle] = useState("");
  const [memo, setMemo] = useState("");
  const [isAllDay, setIsAllDay] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 시트 열릴 때 폼 초기화
  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setMemo("");
      setIsAllDay(true);
      setShowForm(false);
    }
  }, [isOpen, selectedDate]);

  // 폼 표시 시 입력창 포커스
  useEffect(() => {
    if (showForm) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [showForm]);

  const handleCreate = async () => {
    if (!title.trim() || !selectedDate) return;
    setSaving(true);
    try {
      const body: ScheduleRequest = {
        title: title.trim(),
        memo: memo.trim() || undefined,
        eventDate: selectedDate,
        isAllDay,
      };
      const created = await api.post<ScheduleResponse>("/api/schedules", body);
      onCreated(created);
      setTitle("");
      setMemo("");
      setShowForm(false);
    } catch {
      alert("일정 등록에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await api.delete(`/api/schedules/${id}`);
      onDeleted(id);
    } catch {
      alert("일정 삭제에 실패했습니다.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      {/* 오버레이 */}
      <div
        className={`fixed inset-0 z-50 bg-black/30 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      {/* 시트 */}
      <div
        className={`fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg bg-white rounded-t-3xl shadow-2xl transform transition-transform duration-300 ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: "80vh" }}
      >
        {/* 핸들 */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">
            {selectedDate ? formatEventDate(selectedDate) : "일정"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="overflow-y-auto" style={{ maxHeight: "calc(80vh - 110px)" }}>
          {/* 기존 일정 목록 */}
          {schedulesOnDate.length > 0 && (
            <ul className="px-5 pt-3 space-y-2">
              {schedulesOnDate.map((s) => (
                <li
                  key={s.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-orange-50 border border-orange-100"
                >
                  <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{s.title}</p>
                    {s.memo && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{s.memo}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(s.id)}
                    disabled={deletingId === s.id}
                    className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg hover:bg-red-50 shrink-0 disabled:opacity-40"
                  >
                    {deletingId === s.id ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0a1 1 0 01-1-1V5a1 1 0 011-1h6a1 1 0 011 1v1a1 1 0 01-1 1H9z" />
                      </svg>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {schedulesOnDate.length === 0 && !showForm && (
            <p className="text-center text-sm text-gray-400 py-6">이 날의 일정이 없습니다.</p>
          )}

          {/* 등록 폼 */}
          {showForm && (
            <div className="px-5 pt-3 pb-2 space-y-3">
              <input
                ref={inputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="일정 제목을 입력하세요"
                maxLength={50}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                }}
              />
              <input
                type="text"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="메모 (선택)"
                maxLength={200}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500"
              />
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAllDay}
                  onChange={(e) => setIsAllDay(e.target.checked)}
                  className="w-4 h-4 accent-primary-500"
                />
                <span className="text-sm text-gray-600">하루 종일</span>
              </label>
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="px-5 py-3 border-t border-gray-100">
          {showForm ? (
            <div className="flex gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 font-medium hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleCreate}
                disabled={!title.trim() || saving}
                className="flex-1 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-semibold disabled:opacity-50"
              >
                {saving ? "저장 중..." : "저장"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full py-2.5 rounded-xl bg-primary-500 text-white text-sm font-semibold flex items-center justify-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              일정 추가
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// ────────────────────────────────────────────────
// 메인 페이지
// ────────────────────────────────────────────────

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default function SchedulePage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1); // 1-based
  const [schedules, setSchedules] = useState<ScheduleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheet, setSheet] = useState<ScheduleSheetState>({ isOpen: false, selectedDate: null });

  // ── API 조회 ──
  const fetchSchedules = useCallback(async (y: number, m: number) => {
    setLoading(true);
    try {
      const data = await api.get<ScheduleResponse[]>(
        `/api/schedules?year=${y}&month=${m}`
      );
      setSchedules(data ?? []);
    } catch {
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules(year, month);
  }, [fetchSchedules, year, month]);

  // ── 월 이동 ──
  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  // ── 날짜별 일정 맵 ──
  const scheduleMap = schedules.reduce<Record<string, ScheduleResponse[]>>((acc, s) => {
    (acc[s.eventDate] ||= []).push(s);
    return acc;
  }, {});

  // ── 달력 셀 계산 ──
  const daysInMonth = getDaysInMonth(year, month);
  const firstDow = getFirstDayOfWeek(year, month); // 0=일
  const totalCells = Math.ceil((firstDow + daysInMonth) / 7) * 7;

  // ── 날짜 클릭 ──
  const handleDayClick = (day: number) => {
    const dateStr = toDateStr(year, month, day);
    setSheet({ isOpen: true, selectedDate: dateStr });
  };

  // ── 시트 이벤트 ──
  const handleCreated = (schedule: ScheduleResponse) => {
    setSchedules(prev => [...prev, schedule]);
  };
  const handleDeleted = (id: number) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
  };

  const todayStr = toDateStr(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const selectedSchedules = sheet.selectedDate ? (scheduleMap[sheet.selectedDate] ?? []) : [];

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-24">
      {/* 월 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-base font-semibold text-gray-800">
          {year}년 {month}월
        </h1>
        <button
          onClick={nextMonth}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d, i) => (
          <div
            key={d}
            className={`text-center text-xs font-medium py-1.5 ${
              i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-500"
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      {loading ? (
        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: totalCells }).map((_, i) => {
            const day = i - firstDow + 1;
            const isValid = day >= 1 && day <= daysInMonth;
            const dateStr = isValid ? toDateStr(year, month, day) : "";
            const isToday = dateStr === todayStr;
            const isSelected = sheet.selectedDate === dateStr && sheet.isOpen;
            const hasDot = isValid && (scheduleMap[dateStr]?.length ?? 0) > 0;
            const dow = i % 7;

            return (
              <button
                key={i}
                disabled={!isValid}
                onClick={() => isValid && handleDayClick(day)}
                className={`relative flex flex-col items-center justify-start pt-1.5 aspect-square rounded-xl text-sm transition-colors ${
                  !isValid
                    ? "cursor-default"
                    : isSelected
                    ? "bg-primary-500 text-white"
                    : isToday
                    ? "bg-orange-100 text-primary-500 font-semibold"
                    : "hover:bg-gray-100 text-gray-700"
                } ${
                  !isValid ? "" : dow === 0 ? "text-red-400" : dow === 6 ? "text-blue-400" : ""
                } ${isSelected ? "!text-white" : ""}`}
              >
                {isValid && (
                  <>
                    <span className="text-xs leading-tight font-medium">{day}</span>
                    {hasDot && (
                      <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center px-0.5">
                        {(scheduleMap[dateStr] ?? []).slice(0, 3).map((s) => (
                          <span
                            key={s.id}
                            className={`block w-1 h-1 rounded-full ${isSelected ? "bg-white/80" : "bg-primary-500"}`}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* 이번 달 일정 요약 */}
      {!loading && schedules.length > 0 && (
        <div className="mt-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">이번 달 일정</h2>
          <ul className="space-y-2">
            {schedules
              .sort((a, b) => a.eventDate.localeCompare(b.eventDate))
              .map((s) => (
                <li
                  key={s.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white border border-gray-100 shadow-sm"
                  onClick={() => setSheet({ isOpen: true, selectedDate: s.eventDate })}
                >
                  <div className="text-center shrink-0 w-9">
                    <p className="text-xs text-gray-400">{s.eventDate.split("-")[1]}월</p>
                    <p className="text-base font-bold text-primary-500 leading-tight">
                      {parseInt(s.eventDate.split("-")[2])}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{s.title}</p>
                    {s.memo && <p className="text-xs text-gray-500 truncate">{s.memo}</p>}
                  </div>
                  <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </li>
              ))}
          </ul>
        </div>
      )}

      {!loading && schedules.length === 0 && (
        <p className="text-center text-sm text-gray-400 mt-10">이번 달 등록된 일정이 없습니다.</p>
      )}

      {/* 일정 Bottom Sheet */}
      <ScheduleSheet
        isOpen={sheet.isOpen}
        selectedDate={sheet.selectedDate}
        schedulesOnDate={selectedSchedules}
        onClose={() => setSheet((s) => ({ ...s, isOpen: false }))}
        onCreated={handleCreated}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
