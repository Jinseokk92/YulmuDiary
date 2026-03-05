// ── 카카오맵 SDK 타입 선언 ──────────────────────────────

export interface KakaoPlace {
  id: string;
  place_name: string;
  address_name: string;
  road_address_name: string;
  category_name: string;
  phone: string;
  x: string; // longitude
  y: string; // latitude
  place_url: string;
}

export interface KakaoGeocoderResult {
  address_name: string;
  x: string; // longitude
  y: string; // latitude
}

export interface KakaoLatLng {
  getLat: () => number;
  getLng: () => number;
}

export interface KakaoMapInstance {
  setCenter: (latlng: KakaoLatLng) => void;
  relayout: () => void;
}

export interface KakaoMarker {
  setPosition: (latlng: KakaoLatLng) => void;
  setMap: (map: KakaoMapInstance | null) => void;
}

interface KakaoPlacesService {
  keywordSearch: (
    keyword: string,
    callback: (result: KakaoPlace[], status: string) => void
  ) => void;
}

interface KakaoGeocoderService {
  addressSearch: (
    address: string,
    callback: (result: KakaoGeocoderResult[], status: string) => void
  ) => void;
}

interface KakaoMapOptions {
  center: KakaoLatLng;
  level: number;
}

interface KakaoMapsServices {
  Places: new () => KakaoPlacesService;
  Geocoder: new () => KakaoGeocoderService;
  Status: { OK: string; ZERO_RESULT: string; ERROR: string };
}

interface KakaoMaps {
  load: (callback: () => void) => void;
  services: KakaoMapsServices;
  Map: new (container: HTMLElement, options: KakaoMapOptions) => KakaoMapInstance;
  Marker: new (options: { position: KakaoLatLng; map?: KakaoMapInstance }) => KakaoMarker;
  LatLng: new (lat: number, lng: number) => KakaoLatLng;
}

declare global {
  interface Window {
    kakao: { maps: KakaoMaps };
  }
}

// ── SDK 로딩 유틸리티 ──────────────────────────────────

let loadPromise: Promise<void> | null = null;

/**
 * 카카오맵 SDK(+ services 라이브러리)를 비동기로 로드합니다.
 * 이미 로드되었거나 로드 중이면 기존 Promise를 반환합니다.
 */
export function loadKakaoSdk(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.kakao?.maps?.services) return Promise.resolve();
  if (loadPromise) return loadPromise;

  const key = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
  if (!key) {
    return Promise.reject(
      new Error("NEXT_PUBLIC_KAKAO_JS_KEY 환경변수가 설정되지 않았습니다.")
    );
  }

  loadPromise = new Promise((resolve, reject) => {
    if (window.kakao?.maps) {
      window.kakao.maps.load(() => resolve());
      return;
    }

    const script = document.createElement("script");
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&libraries=services&autoload=false`;
    script.async = true;
    script.onload = () => window.kakao.maps.load(() => resolve());
    script.onerror = () => {
      loadPromise = null; // 실패 시 재시도 가능하도록 초기화
      reject(new Error("카카오맵 SDK 로딩에 실패했습니다."));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}
