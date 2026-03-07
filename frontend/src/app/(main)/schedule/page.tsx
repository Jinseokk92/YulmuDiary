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
    setPlace(null);
    setView("form");
  };

  const backToList = () => {
    setView("list");
    setSelectedItem(null);
  };

  const handleCreate = async () => {
    if (!title.trim() || !selectedDate) return;
    setSaving(true);
    try {
      const body: ScheduleRequest = {
        title: title.trim(),
        memo: memo.trim() || undefined,
        eventDate: selectedDate,
        isAllDay,
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
    setSaving(true);
    try {
      const body: ScheduleRequest = {
        title: title.trim(),
        memo: memo.trim() || undefined,
        eventDate: selectedItem.eventDate,
        isAllDay,
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
              <div className={`flex items-center gap-2 ${isParent ? "cursor-pointer" : "cursor-default"}`}>
                <input
                  type="checkbox"
                  checked={isAllDay}
                  onChange={isParent ? (e) => setIsAllDay(e.target.checked) : undefined}
                  readOnly={!isParent}
                  className="w-4 h-4 accent-primary-500"
                />
                <span className="text-sm text-gray-600">하루 종일</span>
              </div>
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
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

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
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else { setMonth((m) => m - 1); }
  };
  const nextMonth = () => {
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else { setMonth((m) => m + 1); }
  };

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
                      // 오늘: 주황 은은한 배경 + 주황 텍스트
                      ? { backgroundColor: "rgba(249,115,22,0.15)", color: "#fb923c" }
                      // 일반: 요일별 색 분기
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
      )}

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
