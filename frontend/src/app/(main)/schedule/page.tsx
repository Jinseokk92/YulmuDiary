"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { api } from "@/lib/api";
import {
  loadKakaoSdk,
  type KakaoPlace,
  type KakaoMapInstance,
  type KakaoMarker,
} from "@/lib/kakao";
import { useAuth } from "@/hooks/useAuth";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import PullToRefreshIndicator from "@/components/ui/PullToRefreshIndicator";
import { useUiStore } from "@/stores/uiStore";
import type { ScheduleRequest, ScheduleResponse } from "@/types";

// ────────────────────────────────────────────────
// 순수 헬퍼 함수
// ────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}
function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay();
}
function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
function formatEventDate(dateStr: string) {
  const [, m, d] = dateStr.split("-");
  return `${parseInt(m)}월 ${parseInt(d)}일`;
}

/** 현재 시각 기준 가장 가까운 30분 단위 문자열 반환 (예: "14:30") */
function roundToNearest30(date: Date): string {
  const mins = date.getMinutes();
  const roundedMins = Math.round(mins / 30) * 30;
  const h = roundedMins === 60 ? (date.getHours() + 1) % 24 : date.getHours();
  const m = roundedMins === 60 ? 0 : roundedMins;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** startTime에 1시간을 더한 기본 endTime 문자열 반환 */
function defaultEndTime(startStr: string): string {
  const [h, m] = startStr.split(":").map(Number);
  return `${String((h + 1) % 24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** 시간 정보 표시 문자열 반환 (목록용 24h 포맷) */
function formatTimeInfo(isAllDay: boolean, startTime: string | null, endTime: string | null): string {
  if (isAllDay) return "하루종일";
  if (startTime && endTime) return `${startTime} - ${endTime}`;
  if (startTime) return startTime;
  return "하루종일";
}

// ── 시간 휠 피커 상수 ─────────────────────────────────────────────────────────

const AMPM_LIST = ["오전", "오후"] as const;
const HOUR_LIST = ["12", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"] as const;
const MIN_LIST = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"] as const;
const WHEEL_ITEM_H = 52; // px

function to24hFromIndices(ampmIdx: number, hourIdx: number): number {
  const h12 = hourIdx === 0 ? 12 : hourIdx;
  return ampmIdx === 0 ? (h12 === 12 ? 0 : h12) : (h12 === 12 ? 12 : h12 + 12);
}
function to12hIndices(hour24: number): { ai: number; hi: number } {
  if (hour24 === 0) return { ai: 0, hi: 0 };
  if (hour24 < 12) return { ai: 0, hi: hour24 };
  if (hour24 === 12) return { ai: 1, hi: 0 };
  return { ai: 1, hi: hour24 - 12 };
}
function minuteToIndex(min: number): number {
  return Math.round(min / 5) % 12;
}
/** 버튼에 표시할 12h 포맷 — "오전 9:30" */
function formatDisplayTime(timeStr: string): string {
  if (!timeStr) return "시간 선택";
  const [h, m] = timeStr.split(":").map(Number);
  const { ai, hi } = to12hIndices(h);
  return `${AMPM_LIST[ai]} ${HOUR_LIST[hi]}:${String(m).padStart(2, "0")}`;
}

// ────────────────────────────────────────────────
// 타입
// ────────────────────────────────────────────────

type SheetView = "list" | "detail" | "form";

interface PlaceInfo {
  name: string;
  address: string;
  /** 카카오 검색 결과에서 직접 얻은 좌표 (DB 로드 시에는 undefined) */
  lat?: number;
  lng?: number;
}

// ────────────────────────────────────────────────
// KakaoMapView — 선택된 장소를 지도로 표시
// ────────────────────────────────────────────────

interface KakaoMapViewProps {
  /** 직접 좌표가 있으면 즉시 렌더 */
  lat?: number;
  lng?: number;
  /** 좌표가 없을 때 Geocoder로 검색할 주소 */
  address?: string;
}

function KakaoMapView({ lat, lng, address }: KakaoMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // 지도 인스턴스를 ref로 관리 → 중복 생성 방지
  const mapRef = useRef<KakaoMapInstance | null>(null);
  const markerRef = useRef<KakaoMarker | null>(null);

  useEffect(() => {
    let cancelled = false;

    const initMap = (latitude: number, longitude: number) => {
      if (cancelled || !containerRef.current) return;

      const { LatLng, Map: KakaoMap, Marker } = window.kakao.maps;
      const center = new LatLng(latitude, longitude);

      if (!mapRef.current) {
        // 최초 생성
        mapRef.current = new KakaoMap(containerRef.current, { center, level: 4 });
        markerRef.current = new Marker({ position: center, map: mapRef.current });
      } else {
        // 이미 생성된 경우 중심만 이동
        mapRef.current.setCenter(center);
        markerRef.current?.setPosition(center);
      }

      // 바텀 시트 슬라이드 애니메이션(300ms) 이후 레이아웃 재계산
      setTimeout(() => {
        if (!cancelled) mapRef.current?.relayout();
      }, 350);
    };

    const run = async () => {
      try {
        await loadKakaoSdk();
        if (cancelled) return;

        if (lat !== undefined && lng !== undefined) {
          // 검색 결과에서 받은 좌표 → 즉시 렌더
          initMap(lat, lng);
        } else if (address) {
          // DB에서 로드된 주소 → Geocoder로 좌표 조회
          const geocoder = new window.kakao.maps.services.Geocoder();
          geocoder.addressSearch(address, (result, status) => {
            if (
              !cancelled &&
              status === window.kakao.maps.services.Status.OK &&
              result[0]
            ) {
              initMap(parseFloat(result[0].y), parseFloat(result[0].x));
            }
          });
        }
      } catch {
        // SDK 로딩 실패 → 텍스트 정보는 이미 상위에서 보여주므로 무시
      }
    };

    run();

    return () => {
      cancelled = true;
      // 언마운트 시 ref 초기화 (다음 마운트에서 새 인스턴스 생성)
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [lat, lng, address]);

  return (
    <div
      ref={containerRef}
      className="mt-2 rounded-xl overflow-hidden border border-gray-100 shadow-sm"
      style={{ height: "200px" }}
    />
  );
}

// ────────────────────────────────────────────────
// PlaceSearchField — 장소 검색 + 선택 + 지도 표시
// ────────────────────────────────────────────────

interface PlaceSearchFieldProps {
  value: PlaceInfo | null;
  onChange: (place: PlaceInfo | null) => void;
  readOnly?: boolean;
}

function PlaceSearchField({ value, onChange, readOnly = false }: PlaceSearchFieldProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<KakaoPlace[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadKakaoSdk()
      .then(() => setSdkReady(true))
      .catch(() => setSdkReady(false));
  }, []);

  // 바깥 클릭 시 결과 닫기
  useEffect(() => {
    const handleOut = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleOut);
    return () => document.removeEventListener("mousedown", handleOut);
  }, []);

  const handleSearch = useCallback(() => {
    if (!query.trim() || !sdkReady) return;
    setIsSearching(true);
    const ps = new window.kakao.maps.services.Places();
    ps.keywordSearch(query.trim(), (result, status) => {
      setIsSearching(false);
      setResults(
        status === window.kakao.maps.services.Status.OK ? result.slice(0, 5) : []
      );
      setShowResults(true);
    });
  }, [query, sdkReady]);

  const handleSelect = (place: KakaoPlace) => {
    onChange({
      name: place.place_name,
      address: place.road_address_name || place.address_name,
      lat: parseFloat(place.y), // 검색 결과 좌표 저장 → 지도에서 즉시 사용
      lng: parseFloat(place.x),
    });
    setQuery("");
    setResults([]);
    setShowResults(false);
  };

  // ── 읽기 전용 (RELATIVE) ──
  if (readOnly) {
    if (!value) return null;
    return (
      <div>
        <div className="flex items-start gap-2 px-3 py-2.5 border border-gray-100 bg-gray-50 rounded-xl">
          <PinIcon className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-700">{value.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">{value.address}</p>
          </div>
        </div>
        <KakaoMapView lat={value.lat} lng={value.lng} address={value.address} />
      </div>
    );
  }

  // ── 편집 모드 (PARENT) ──
  return (
    <div ref={wrapperRef} className="relative">
      {value ? (
        /* 선택된 장소 카드 + 지도 */
        <div>
          <div className="flex items-start gap-2 px-3 py-2.5 border border-primary-200 bg-primary-50/40 rounded-xl">
            <PinIcon className="w-4 h-4 text-primary-500 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">{value.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{value.address}</p>
            </div>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-full shrink-0"
              aria-label="장소 삭제"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* 지도 표시 */}
          <KakaoMapView lat={value.lat} lng={value.lng} address={value.address} />
        </div>
      ) : (
        /* 검색 입력 */
        <div className="flex gap-2">
          <div className="relative flex-1">
            <PinIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); handleSearch(); }
              }}
              placeholder={sdkReady ? "장소 검색 (선택)" : "지도 로딩 중..."}
              disabled={!sdkReady}
              className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm
                placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40
                focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>
          <button
            type="button"
            onClick={handleSearch}
            disabled={!sdkReady || !query.trim() || isSearching}
            className="px-3 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-600 font-medium
              hover:bg-gray-200 disabled:opacity-40 shrink-0 transition-colors"
          >
            {isSearching ? "..." : "검색"}
          </button>
        </div>
      )}

      {/* 검색 결과 드롭다운 */}
      {showResults && !value && (
        <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {results.length > 0 ? (
            <ul>
              {results.map((place) => (
                <li key={place.id} className="border-b border-gray-100 last:border-0">
                  <button
                    type="button"
                    onClick={() => handleSelect(place)}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-800">{place.place_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {place.road_address_name || place.address_name}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">검색 결과가 없습니다.</p>
          )}
        </div>
      )}
    </div>
  );
}

// 공용 핀 아이콘
function PinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

// ────────────────────────────────────────────────
// ScrollWheelColumn — iOS 스타일 스크롤 휠 단일 열
// ────────────────────────────────────────────────

interface WheelColumnProps {
  items: readonly string[];
  initialIndex: number;
  onChange: (index: number) => void;
}

function ScrollWheelColumn({ items, initialIndex, onChange }: WheelColumnProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [displayIndex, setDisplayIndex] = useState(initialIndex);

  // 마운트 시 초기 위치로 즉시 스크롤
  useEffect(() => {
    containerRef.current?.scrollTo({ top: initialIndex * WHEEL_ITEM_H, behavior: "instant" as ScrollBehavior });
    setDisplayIndex(initialIndex);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const idx = Math.max(0, Math.min(items.length - 1, Math.round(el.scrollTop / WHEEL_ITEM_H)));
    setDisplayIndex(idx); // 즉각 시각적 반영

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      el.scrollTo({ top: idx * WHEEL_ITEM_H, behavior: "smooth" });
      onChange(idx);
    }, 100);
  }, [items.length, onChange]);

  const VISIBLE = 5;
  const PAD = Math.floor(VISIBLE / 2); // 2

  return (
    <div className="relative flex-1" style={{ height: WHEEL_ITEM_H * VISIBLE }}>
      {/* 선택 영역 하이라이트 */}
      <div
        className="absolute left-1 right-1 rounded-xl pointer-events-none z-10"
        style={{ top: PAD * WHEEL_ITEM_H, height: WHEEL_ITEM_H, background: "rgba(228,112,30,0.13)" }}
      />
      {/* 상단 페이드 마스크 */}
      <div
        className="absolute inset-x-0 top-0 pointer-events-none z-20"
        style={{ height: PAD * WHEEL_ITEM_H, background: "linear-gradient(to bottom, #FFF8F2 30%, transparent)" }}
      />
      {/* 하단 페이드 마스크 */}
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none z-20"
        style={{ height: PAD * WHEEL_ITEM_H, background: "linear-gradient(to top, #FFF8F2 30%, transparent)" }}
      />
      {/* 스크롤 컨테이너 */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{ height: "100%", overflowY: "scroll", scrollSnapType: "y mandatory", WebkitOverflowScrolling: "touch" }}
        className="[scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {/* 상단 패딩 (첫 항목이 중앙에 오도록) */}
        {Array.from({ length: PAD }).map((_, i) => (
          <div key={`tp${i}`} style={{ height: WHEEL_ITEM_H }} />
        ))}
        {items.map((item, idx) => (
          <div
            key={`${item}-${idx}`}
            onClick={() => {
              containerRef.current?.scrollTo({ top: idx * WHEEL_ITEM_H, behavior: "smooth" });
              onChange(idx);
            }}
            style={{ height: WHEEL_ITEM_H, scrollSnapAlign: "center" }}
            className={`flex items-center justify-center select-none cursor-pointer transition-all duration-150 ${
              idx === displayIndex
                ? "text-[#e4701e] font-bold text-2xl"
                : "text-gray-400 text-lg font-normal"
            }`}
          >
            {item}
          </div>
        ))}
        {/* 하단 패딩 */}
        {Array.from({ length: PAD }).map((_, i) => (
          <div key={`bp${i}`} style={{ height: WHEEL_ITEM_H }} />
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// TimeWheelPicker — 바텀 시트 형태 시간 휠 피커
// ────────────────────────────────────────────────

interface TimeWheelPickerProps {
  isOpen: boolean;
  label: string;
  value: string; // "HH:mm" 또는 ""
  onClose: () => void;
  onConfirm: (time: string) => void;
}

function TimeWheelPicker({ isOpen, label, value, onClose, onConfirm }: TimeWheelPickerProps) {
  const parseValue = (v: string) => {
    if (v && v.includes(":")) {
      const [h, m] = v.split(":").map(Number);
      return { h, m: Math.round(m / 5) * 5 % 60 };
    }
    const now = new Date();
    return { h: now.getHours(), m: Math.round(now.getMinutes() / 5) * 5 % 60 };
  };

  const [ampmIdx, setAmpmIdx] = useState(() => to12hIndices(parseValue(value).h).ai);
  const [hourIdx, setHourIdx] = useState(() => to12hIndices(parseValue(value).h).hi);
  const [minIdx, setMinIdx] = useState(() => minuteToIndex(parseValue(value).m));
  // rev가 바뀔 때마다 ScrollWheelColumn 리마운트 → 초기 스크롤 위치 재설정
  const [rev, setRev] = useState(0);

  useEffect(() => {
    if (isOpen) {
      const { h, m } = parseValue(value);
      const { ai, hi } = to12hIndices(h);
      setAmpmIdx(ai);
      setHourIdx(hi);
      setMinIdx(minuteToIndex(m));
      setRev((r) => r + 1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleConfirm = () => {
    const h24 = to24hFromIndices(ampmIdx, hourIdx);
    const m = parseInt(MIN_LIST[minIdx]);
    onConfirm(`${String(h24).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  };

  return (
    <>
      {/* 딤 오버레이 */}
      <div
        className={`fixed inset-0 z-[60] bg-black/20 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      {/* 바텀 시트 */}
      <div
        className={`fixed bottom-0 left-1/2 -translate-x-1/2 z-[60] w-full max-w-lg transform transition-transform duration-300 ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#FFF8F2", borderRadius: "24px 24px 0 0" }}
      >
        {/* 핸들 */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-orange-200" />
        </div>
        {/* 타이틀 */}
        <p className="text-center text-base font-semibold text-gray-700 pt-2 pb-3">{label}</p>

        {/* 세 개의 휠 */}
        <div
          className="flex mx-4 gap-1 rounded-2xl overflow-hidden"
          style={{ background: "#FFF8F2" }}
        >
          <ScrollWheelColumn key={`ampm-${rev}`} items={AMPM_LIST} initialIndex={ampmIdx} onChange={setAmpmIdx} />
          <ScrollWheelColumn key={`hour-${rev}`} items={HOUR_LIST} initialIndex={hourIdx} onChange={setHourIdx} />
          <ScrollWheelColumn key={`min-${rev}`} items={MIN_LIST} initialIndex={minIdx} onChange={setMinIdx} />
        </div>

        {/* 버튼 */}
        <div className="flex gap-3 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3.5 border border-gray-200 rounded-2xl text-gray-600 text-base font-medium bg-white"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-3.5 rounded-2xl text-white text-base font-semibold"
            style={{ background: "#e4701e" }}
          >
            확인
          </button>
        </div>
      </div>
    </>
  );
}

// ────────────────────────────────────────────────
// AllDayToggle — 시니어 친화적 종일 토글
// ────────────────────────────────────────────────

function AllDayToggle({ value, canEdit, onChange }: {
  value: boolean;
  canEdit: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => canEdit && onChange(!value)}
      className={`w-full flex items-center justify-between px-4 rounded-2xl transition-all active:scale-[0.99] ${
        canEdit ? "cursor-pointer" : "cursor-default opacity-70"
      }`}
      style={{ background: "#FFF3E8", minHeight: "58px" }}
    >
      <span className="text-base font-medium text-gray-700">하루 종일</span>
      <div
        className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-200 ${
          value ? "bg-[#e4701e]" : "bg-gray-300"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
            value ? "translate-x-8" : "translate-x-1"
          }`}
        />
      </div>
    </button>
  );
}

// ────────────────────────────────────────────────
// TimeRangeRow — 시작/종료 시간 탭 버튼 행
// ────────────────────────────────────────────────

function TimeRangeRow({ startTime, endTime, canEdit, onStartTap, onEndTap }: {
  startTime: string;
  endTime: string;
  canEdit: boolean;
  onStartTap: () => void;
  onEndTap: () => void;
}) {
  const btnBase =
    "flex-1 flex flex-col items-center justify-center rounded-2xl gap-1 transition-all";
  const btnActive = canEdit ? "active:scale-[0.97] cursor-pointer" : "cursor-default";

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={canEdit ? onStartTap : undefined}
        className={`${btnBase} ${btnActive}`}
        style={{ background: "#FFF3E8", minHeight: "66px" }}
      >
        <span className="text-xs text-gray-400 font-medium">시작</span>
        <span className="text-lg font-bold text-[#e4701e] leading-tight">
          {formatDisplayTime(startTime)}
        </span>
      </button>

      {/* 화살표 */}
      <div className="shrink-0">
        <svg className="w-5 h-5 text-orange-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </div>

      <button
        type="button"
        onClick={canEdit ? onEndTap : undefined}
        className={`${btnBase} ${btnActive}`}
        style={{ background: "#FFF3E8", minHeight: "66px" }}
      >
        <span className="text-xs text-gray-400 font-medium">종료</span>
        <span className="text-lg font-bold text-[#e4701e] leading-tight">
          {formatDisplayTime(endTime)}
        </span>
      </button>
    </div>
  );
}

// ────────────────────────────────────────────────
// ScheduleSheet
// ────────────────────────────────────────────────

interface ScheduleSheetProps {
  isOpen: boolean;
  selectedDate: string | null;
  schedulesOnDate: ScheduleResponse[];
  isParent: boolean;
  onClose: () => void;
  onCreated: (schedule: ScheduleResponse) => void;
  onUpdated: (schedule: ScheduleResponse) => void;
  onDeleted: (id: number) => void;
}

function ScheduleSheet({
  isOpen,
  selectedDate,
  schedulesOnDate,
  isParent,
  onClose,
  onCreated,
  onUpdated,
  onDeleted,
}: ScheduleSheetProps) {
  const [view, setView] = useState<SheetView>("list");
  const [selectedItem, setSelectedItem] = useState<ScheduleResponse | null>(null);
  const [title, setTitle] = useState("");
  const [memo, setMemo] = useState("");
  const [isAllDay, setIsAllDay] = useState(true);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [timePickerTarget, setTimePickerTarget] = useState<"start" | "end" | null>(null);
  const [place, setPlace] = useState<PlaceInfo | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setView("list");
      setSelectedItem(null);
      setTitle("");
      setMemo("");
      setIsAllDay(true);
      setStartTime("");
      setEndTime("");
      setPlace(null);
    }
  }, [isOpen, selectedDate]);

  useEffect(() => {
    if (view !== "list") {
      setTimeout(() => titleRef.current?.focus(), 50);
    }
  }, [view]);

  const openDetail = (item: ScheduleResponse) => {
    setSelectedItem(item);
    setTitle(item.title);
    setMemo(item.memo ?? "");
    setIsAllDay(item.isAllDay);
    setStartTime(item.startTime ?? "");
    setEndTime(item.endTime ?? "");
    // DB에서 로드 시 lat/lng 없음 → KakaoMapView가 Geocoder로 조회
    setPlace(
      item.placeName
        ? { name: item.placeName, address: item.placeAddress ?? "" }
        : null
    );
    setView("detail");
  };

  const openForm = () => {
    setTitle("");
    setMemo("");
    setIsAllDay(true);
    const defaultStart = roundToNearest30(new Date());
    setStartTime(defaultStart);
    setEndTime(defaultEndTime(defaultStart));
    setPlace(null);
    setView("form");
  };

  const backToList = () => {
    setView("list");
    setSelectedItem(null);
  };

  const handleCreate = async () => {
    if (!title.trim() || !selectedDate) return;
    if (!isAllDay && (!startTime || !endTime)) {
      alert("시작 시간과 종료 시간을 입력해주세요.");
      return;
    }
    setSaving(true);
    try {
      const body: ScheduleRequest = {
        title: title.trim(),
        memo: memo.trim() || undefined,
        eventDate: selectedDate,
        isAllDay,
        startTime: isAllDay ? undefined : startTime,
        endTime: isAllDay ? undefined : endTime,
        placeName: place?.name || undefined,
        placeAddress: place?.address || undefined,
      };
      const created = await api.post<ScheduleResponse>("/api/schedules", body);
      onCreated(created);
      backToList();
    } catch {
      alert("일정 등록에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedItem || !title.trim()) return;
    if (!isAllDay && (!startTime || !endTime)) {
      alert("시작 시간과 종료 시간을 입력해주세요.");
      return;
    }
    setSaving(true);
    try {
      const body: ScheduleRequest = {
        title: title.trim(),
        memo: memo.trim() || undefined,
        eventDate: selectedItem.eventDate,
        isAllDay,
        startTime: isAllDay ? undefined : startTime,
        endTime: isAllDay ? undefined : endTime,
        placeName: place?.name || undefined,
        placeAddress: place?.address || undefined,
      };
      const updated = await api.put<ScheduleResponse>(
        `/api/schedules/${selectedItem.id}`,
        body
      );
      onUpdated(updated);
      backToList();
    } catch {
      alert("일정 수정에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    setDeleting(true);
    try {
      await api.delete(`/api/schedules/${selectedItem.id}`);
      onDeleted(selectedItem.id);
      backToList();
    } catch {
      alert("일정 삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  const headerTitle =
    view === "form" ? "일정 추가"
    : view === "detail" ? (isParent ? "일정 수정" : "일정 상세")
    : selectedDate ? formatEventDate(selectedDate)
    : "일정";

  const editableInput =
    "border-gray-200 focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500";
  const readonlyInput =
    "border-gray-100 bg-gray-50 text-gray-700 cursor-default select-text";

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/30 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg bg-white
          rounded-t-3xl shadow-2xl transform transition-transform duration-300 ${
            isOpen ? "translate-y-0" : "translate-y-full"
          }`}
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: "85vh" }}
      >
        {/* 핸들 바 */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
          <div className="w-9">
            {view !== "list" && (
              <button onClick={backToList} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
          </div>
          <h2 className="text-base font-semibold text-gray-800">{headerTitle}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 스크롤 가능 콘텐츠 */}
        <div className="overflow-y-auto" style={{ maxHeight: "calc(85vh - 130px)" }}>

          {/* ── 목록 뷰 ── */}
          {view === "list" && (
            <div>
              {schedulesOnDate.length > 0 ? (
                <ul className="px-5 pt-3 pb-2 space-y-2">
                  {schedulesOnDate.map((s) => (
                    <li
                      key={s.id}
                      onClick={() => openDetail(s)}
                      className="flex items-start gap-3 p-3 rounded-xl bg-orange-50 border border-orange-100
                        cursor-pointer hover:bg-orange-100/70 active:scale-[0.99] transition-all"
                    >
                      <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{s.title}</p>
                        <p className="text-xs text-primary-500 mt-0.5">
                          {formatTimeInfo(s.isAllDay, s.startTime, s.endTime)}
                        </p>
                        {s.placeName && (
                          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-0.5">
                            <PinIcon className="w-3 h-3 shrink-0" />
                            <span className="truncate">{s.placeName}</span>
                          </p>
                        )}
                        {s.memo && <p className="text-xs text-gray-400 mt-0.5 truncate">{s.memo}</p>}
                        <p className="text-xs text-gray-400 mt-0.5">{s.userNickname}</p>
                      </div>
                      <svg className="w-4 h-4 text-gray-300 shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-sm text-gray-400 py-6">이 날의 일정이 없습니다.</p>
              )}
            </div>
          )}

          {/* ── 상세 뷰 ── */}
          {view === "detail" && selectedItem && (
            <div className="px-5 pt-4 pb-2 space-y-3">
              {!isParent && (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-gray-500">읽기 전용 모드입니다. 텍스트를 선택하여 복사할 수 있습니다.</p>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-400">작성</span>
                <span className="text-xs font-medium text-gray-600">{selectedItem.userNickname}</span>
              </div>
              <input
                ref={titleRef}
                type="text"
                value={title}
                onChange={isParent ? (e) => setTitle(e.target.value) : undefined}
                readOnly={!isParent}
                placeholder="일정 제목"
                maxLength={50}
                className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none transition-colors ${
                  isParent ? editableInput : readonlyInput
                }`}
              />
              <textarea
                value={memo}
                onChange={isParent ? (e) => setMemo(e.target.value) : undefined}
                readOnly={!isParent}
                placeholder={isParent ? "메모 (선택)" : "메모 없음"}
                rows={3}
                maxLength={200}
                className={`w-full px-3 py-2.5 border rounded-xl text-sm resize-none focus:outline-none transition-colors ${
                  isParent ? editableInput : readonlyInput
                }`}
              />
              {/* 장소 + 지도 (PARENT: 수정 가능 / RELATIVE: 읽기 전용 지도 포함) */}
              <PlaceSearchField value={place} onChange={setPlace} readOnly={!isParent} />
              {/* 종일 토글 */}
              <AllDayToggle value={isAllDay} canEdit={isParent} onChange={setIsAllDay} />
              {/* 시간 입력 (종일 아닌 경우) */}
              {!isAllDay && (
                <TimeRangeRow
                  startTime={startTime}
                  endTime={endTime}
                  canEdit={isParent}
                  onStartTap={() => setTimePickerTarget("start")}
                  onEndTap={() => setTimePickerTarget("end")}
                />
              )}
            </div>
          )}

          {/* ── 등록 폼 뷰 (PARENT 전용) ── */}
          {view === "form" && (
            <div className="px-5 pt-3 pb-2 space-y-3">
              <input
                ref={titleRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="일정 제목을 입력하세요"
                maxLength={50}
                className={`w-full px-3 py-2.5 border rounded-xl text-sm placeholder-gray-400 focus:outline-none ${editableInput}`}
                onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
              />
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="메모 (선택)"
                rows={3}
                maxLength={200}
                className={`w-full px-3 py-2.5 border rounded-xl text-sm placeholder-gray-400 resize-none focus:outline-none ${editableInput}`}
              />
              {/* 장소 검색 + 지도 */}
              <PlaceSearchField value={place} onChange={setPlace} />
              {/* 종일 토글 */}
              <AllDayToggle value={isAllDay} canEdit={true} onChange={setIsAllDay} />
              {/* 시간 입력 (종일 아닌 경우) */}
              {!isAllDay && (
                <TimeRangeRow
                  startTime={startTime}
                  endTime={endTime}
                  canEdit={true}
                  onStartTap={() => setTimePickerTarget("start")}
                  onEndTap={() => setTimePickerTarget("end")}
                />
              )}
            </div>
          )}
        </div>

        {/* 하단 액션 버튼 */}
        <div className="px-5 py-3 border-t border-gray-100 shrink-0">
          {view === "list" &&
            (isParent ? (
              <button
                onClick={openForm}
                className="w-full py-2.5 rounded-xl bg-primary-500 text-white text-sm font-semibold
                  flex items-center justify-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                일정 추가
              </button>
            ) : (
              <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 font-medium hover:bg-gray-50">
                닫기
              </button>
            ))}

          {view === "detail" &&
            (isParent ? (
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2.5 rounded-xl border border-red-100 text-red-400 text-sm font-medium hover:bg-red-50 disabled:opacity-40 shrink-0"
                >
                  {deleting ? "삭제 중..." : "삭제"}
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={!title.trim() || saving}
                  className="flex-1 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-semibold disabled:opacity-50"
                >
                  {saving ? "저장 중..." : "저장"}
                </button>
              </div>
            ) : (
              <button onClick={backToList} className="w-full py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 font-medium hover:bg-gray-50">
                닫기
              </button>
            ))}

          {view === "form" && (
            <div className="flex gap-2">
              <button onClick={backToList} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 font-medium hover:bg-gray-50">
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
          )}
        </div>
      </div>

      {/* 시간 휠 피커 — ScheduleSheet 위에 z-[60]으로 렌더 */}
      <TimeWheelPicker
        isOpen={timePickerTarget !== null}
        label={timePickerTarget === "start" ? "시작 시간" : "종료 시간"}
        value={timePickerTarget === "start" ? startTime : endTime}
        onClose={() => setTimePickerTarget(null)}
        onConfirm={(t) => {
          if (timePickerTarget === "start") setStartTime(t);
          else setEndTime(t);
          setTimePickerTarget(null);
        }}
      />
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
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [schedules, setSchedules] = useState<ScheduleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheet, setSheet] = useState<{ isOpen: boolean; selectedDate: string | null }>({
    isOpen: false,
    selectedDate: null,
  });

  const { isParent } = useAuth();
  const isDrawerOpen = useUiStore((state) => state.isDrawerOpen);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isCalendarExpanded, setIsCalendarExpanded] = useState<boolean>(false);
  useEffect(() => {
    setMounted(true);
    try {
      if (localStorage.getItem("calendarExpanded") === "true") setIsCalendarExpanded(true);
    } catch {}
  }, []);
  const isDark = mounted && resolvedTheme === "dark";
  const [collapsedWeekSunday, setCollapsedWeekSunday] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const calendarTouchStartX = useRef<number | null>(null);

  const fetchSchedules = useCallback(async (y: number, m: number) => {
    setLoading(true);
    try {
      const data = await api.get<ScheduleResponse[]>(`/api/schedules?year=${y}&month=${m}`);
      setSchedules(data ?? []);
    } catch {
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSchedules(year, month); }, [fetchSchedules, year, month]);

  const handleRefresh = useCallback(async () => {
    await fetchSchedules(year, month);
  }, [fetchSchedules, year, month]);

  const { pullY, isRefreshing, progress } = usePullToRefresh({
    threshold: 72,
    onRefresh: handleRefresh,
    // 바텀 시트가 열려 있으면 pull 감지 비활성화 (시트 내부 스크롤 충돌 방지)
    disabled: sheet.isOpen || isDrawerOpen,
  });

  const prevMonth = () => {
    const newYear = month === 1 ? year - 1 : year;
    const newMonth = month === 1 ? 12 : month - 1;
    setYear(newYear);
    setMonth(newMonth);
    const firstDay = new Date(newYear, newMonth - 1, 1);
    firstDay.setDate(firstDay.getDate() - firstDay.getDay());
    firstDay.setHours(0, 0, 0, 0);
    setCollapsedWeekSunday(firstDay);
  };
  const nextMonth = () => {
    const newYear = month === 12 ? year + 1 : year;
    const newMonth = month === 12 ? 1 : month + 1;
    setYear(newYear);
    setMonth(newMonth);
    const firstDay = new Date(newYear, newMonth - 1, 1);
    firstDay.setDate(firstDay.getDate() - firstDay.getDay());
    firstDay.setHours(0, 0, 0, 0);
    setCollapsedWeekSunday(firstDay);
  };
  const prevWeek = () => {
    const d = new Date(collapsedWeekSunday);
    d.setDate(d.getDate() - 7);
    setCollapsedWeekSunday(d);
    const mid = new Date(d);
    mid.setDate(mid.getDate() + 3);
    const ny = mid.getFullYear();
    const nm = mid.getMonth() + 1;
    if (ny !== year || nm !== month) { setYear(ny); setMonth(nm); }
  };
  const nextWeek = () => {
    const d = new Date(collapsedWeekSunday);
    d.setDate(d.getDate() + 7);
    setCollapsedWeekSunday(d);
    const mid = new Date(d);
    mid.setDate(mid.getDate() + 3);
    const ny = mid.getFullYear();
    const nm = mid.getMonth() + 1;
    if (ny !== year || nm !== month) { setYear(ny); setMonth(nm); }
  };
  const toggleCalendar = () => {
    const next = !isCalendarExpanded;
    setIsCalendarExpanded(next);
    try { localStorage.setItem("calendarExpanded", String(next)); } catch {}
  };
  const collapsedWeekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(collapsedWeekSunday);
    d.setDate(d.getDate() + i);
    return d;
  });

  const scheduleMap = schedules.reduce<Record<string, ScheduleResponse[]>>((acc, s) => {
    (acc[s.eventDate] ||= []).push(s);
    return acc;
  }, {});

  const daysInMonth = getDaysInMonth(year, month);
  const firstDow = getFirstDayOfWeek(year, month);
  const totalCells = Math.ceil((firstDow + daysInMonth) / 7) * 7;

  const handleDayClick = (day: number) =>
    setSheet({ isOpen: true, selectedDate: toDateStr(year, month, day) });

  const handleCreated = (s: ScheduleResponse) => setSchedules((prev) => [...prev, s]);
  const handleUpdated = (updated: ScheduleResponse) =>
    setSchedules((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  const handleDeleted = (id: number) =>
    setSchedules((prev) => prev.filter((s) => s.id !== id));

  const todayStr = toDateStr(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const selectedSchedules = sheet.selectedDate ? (scheduleMap[sheet.selectedDate] ?? []) : [];

  return (
    <>
    <div style={{ position: "relative" }}>
    {/* 절대 위치 스피너 — 콘텐츠가 translateY로 밀릴 때 드러나는 공간에 자연스럽게 표시 */}
    <PullToRefreshIndicator
      pullY={isDrawerOpen ? 0 : pullY}
      isRefreshing={isDrawerOpen ? false : isRefreshing}
      progress={isDrawerOpen ? 0 : progress}
    />
    <div
      style={{
        transform: isDrawerOpen ? "none" : `translateY(${pullY}px)`,
        transition: isDrawerOpen ? "none" : isRefreshing ? "transform 0.2s ease" : "none",
      }}
    >
    <div className="max-w-lg mx-auto px-4 pt-4 pb-24">
      {/* 월 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className={`p-2 rounded-full ${isDark ? "hover:bg-slate-700" : "hover:bg-gray-100"}`}
          style={{ color: isDark ? "#94a3b8" : "#4b5563" }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-base font-semibold" style={{ color: isDark ? "#e2e8f0" : "#1f2937" }}>
          {year}년 {month}월
        </h1>
        <button
          onClick={nextMonth}
          className={`p-2 rounded-full ${isDark ? "hover:bg-slate-700" : "hover:bg-gray-100"}`}
          style={{ color: isDark ? "#94a3b8" : "#4b5563" }}
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
            className="text-center text-xs font-medium py-1.5"
            style={{
              color: i === 0
                ? (isDark ? "#fca5a5" : "#f87171")   // 일: red-300/400
                : i === 6
                ? (isDark ? "#93c5fd" : "#60a5fa")   // 토: blue-300/400
                : (isDark ? "#94a3b8" : "#6b7280"),  // 평일: slate-400/gray-500
            }}
          >{d}</div>
        ))}
      </div>

      {/* 날짜 그리드 (접이식) */}
      <div
        style={{
          overflow: "hidden",
          maxHeight: isCalendarExpanded ? "420px" : "72px",
          transition: "max-height 300ms ease-in-out",
        }}
      >
        {loading ? (
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: isCalendarExpanded ? 35 : 7 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : isCalendarExpanded ? (
          /* 전체 월 그리드 */
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
                  className={`relative flex flex-col items-center justify-start pt-1.5 aspect-square rounded-xl
                    text-sm transition-colors ${
                      !isValid ? "cursor-default"
                      : isSelected ? "bg-primary-500 text-white"
                      : isToday ? "bg-orange-100 text-primary-500 font-semibold"
                      : isDark ? "hover:bg-slate-700" : "hover:bg-gray-100 text-gray-700"
                    } ${!isValid ? "" : dow === 0 ? "text-red-400" : dow === 6 ? "text-blue-400" : ""} ${
                      isSelected ? "!text-white" : ""
                    }`}
                  style={
                    !isValid || isSelected ? {} :
                    isDark ? (
                      isToday
                        ? { backgroundColor: "rgba(249,115,22,0.15)", color: "#fb923c" }
                        : { color: dow === 0 ? "#fca5a5" : dow === 6 ? "#93c5fd" : "#cbd5e1" }
                    ) : {}
                  }
                >
                  {isValid && (
                    <>
                      <span className="text-xs leading-tight font-medium">{day}</span>
                      {hasDot && (
                        <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center px-0.5">
                          {(scheduleMap[dateStr] ?? []).slice(0, 3).map((s) => (
                            <span key={s.id} className={`block w-1 h-1 rounded-full ${isSelected ? "bg-white/80" : "bg-primary-500"}`} />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          /* 접힌 상태: 현재 주 1줄 (좌우 스와이프로 주 이동) */
          <div
            className="grid grid-cols-7 gap-0.5"
            onTouchStart={(e) => { calendarTouchStartX.current = e.touches[0].clientX; }}
            onTouchEnd={(e) => {
              if (calendarTouchStartX.current === null) return;
              const dx = e.changedTouches[0].clientX - calendarTouchStartX.current;
              if (Math.abs(dx) > 40) { dx < 0 ? nextWeek() : prevWeek(); }
              calendarTouchStartX.current = null;
            }}
          >
            {collapsedWeekDays.map((d, i) => {
              const dateStr = toDateStr(d.getFullYear(), d.getMonth() + 1, d.getDate());
              const isToday = dateStr === todayStr;
              const isSelected = sheet.selectedDate === dateStr && sheet.isOpen;
              const hasDot = (scheduleMap[dateStr]?.length ?? 0) > 0;
              const dow = i;
              const isSameMonth = d.getMonth() + 1 === month && d.getFullYear() === year;
              return (
                <button
                  key={dateStr}
                  onClick={() => setSheet({ isOpen: true, selectedDate: dateStr })}
                  className={`relative flex flex-col items-center justify-start pt-1.5 aspect-square rounded-xl
                    text-sm transition-colors ${
                      isSelected ? "bg-primary-500 text-white"
                      : isToday ? "bg-orange-100 font-semibold"
                      : isDark ? "hover:bg-slate-700" : "hover:bg-gray-100"
                    } ${isSelected ? "!text-white" : ""}`}
                  style={
                    isSelected ? {} :
                    isDark ? (
                      isToday
                        ? { backgroundColor: "rgba(249,115,22,0.15)", color: "#fb923c" }
                        : { color: isSameMonth ? (dow === 0 ? "#fca5a5" : dow === 6 ? "#93c5fd" : "#cbd5e1") : "#475569" }
                    ) : {
                      color: isToday ? "#e4701e" : isSameMonth ? (dow === 0 ? "#f87171" : dow === 6 ? "#60a5fa" : "#374151") : "#d1d5db",
                    }
                  }
                >
                  <span className="text-xs leading-tight font-medium">{d.getDate()}</span>
                  {hasDot && (
                    <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center px-0.5">
                      {(scheduleMap[dateStr] ?? []).slice(0, 3).map((s) => (
                        <span key={s.id} className={`block w-1 h-1 rounded-full ${isSelected ? "bg-white/80" : "bg-primary-500"}`} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 달력 펼치기/접기 버튼 */}
      <button
        onClick={toggleCalendar}
        className="w-full flex items-center justify-center gap-1.5 mt-2 rounded-2xl"
        style={{
          color: "#e4701e",
          fontSize: "15px",
          fontWeight: 600,
          minHeight: "44px",
          background: isDark ? "rgba(228,112,30,0.08)" : "#FFF8F0",
        }}
      >
        {isCalendarExpanded ? (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
            달력 접기
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
            달력 펼치기
          </>
        )}
      </button>

      {/* 이번 달 일정 요약 */}
      {!loading && schedules.length > 0 && (
        <div className="mt-5">
          <h2
            className="text-sm font-semibold mb-2"
            style={{ color: isDark ? "#cbd5e1" : "#374151" }}
          >이번 달 일정</h2>
          <ul className="space-y-2">
            {[...schedules]
              .sort((a, b) => a.eventDate.localeCompare(b.eventDate))
              .map((s) => (
                <li
                  key={s.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white border border-gray-100 shadow-sm cursor-pointer hover:bg-gray-50"
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
                    <p className="text-xs text-primary-500 mt-0.5">
                      {formatTimeInfo(s.isAllDay, s.startTime, s.endTime)}
                    </p>
                    {s.placeName && (
                      <p className="text-xs text-gray-500 flex items-center gap-0.5 mt-0.5">
                        <PinIcon className="w-3 h-3 shrink-0" />
                        <span className="truncate">{s.placeName}</span>
                      </p>
                    )}
                    {s.memo && <p className="text-xs text-gray-400 truncate">{s.memo}</p>}
                    <p className="text-xs text-gray-400">{s.userNickname}</p>
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
        <p
          className="text-center text-sm mt-10"
          style={{ color: isDark ? "#94a3b8" : "#9ca3af" }}
        >이번 달 등록된 일정이 없습니다.</p>
      )}

    </div>
    </div>
    </div>

    {/* ScheduleSheet는 fixed 포지션 — transform/relative 컨테이너 밖에서 렌더링 */}
    <ScheduleSheet
      isOpen={sheet.isOpen}
      selectedDate={sheet.selectedDate}
      schedulesOnDate={selectedSchedules}
      isParent={isParent}
      onClose={() => setSheet((s) => ({ ...s, isOpen: false }))}
      onCreated={handleCreated}
      onUpdated={handleUpdated}
      onDeleted={handleDeleted}
    />
    </>
  );
}
