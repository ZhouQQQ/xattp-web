/** 高德地图 Web 端 Key（xattp-web） */
export const AMAP_WEB_KEY = "b0bd93b7b16488f13ce22d84600482fd";

/** 高德地图安全密钥，须在加载 JS API 脚本前设置 */
export const AMAP_SECURITY_JS_CODE = "49ff8ee4ef03b582ff17b5e047fcfd1e";

type AmapNamespace = {
  Map: new (container: HTMLElement | string, opts?: Record<string, unknown>) => AmapMap;
  Marker: new (opts?: Record<string, unknown>) => AmapMarker;
  PlaceSearch: new (opts?: Record<string, unknown>) => AmapPlaceSearch;
  plugin: (names: string | string[], cb: () => void) => void;
};

type AmapLngLat = {
  getLng: () => number;
  getLat: () => number;
};

type AmapMap = {
  on: (event: string, cb: (e: { lnglat: AmapLngLat }) => void) => void;
  setCenter: (center: [number, number] | AmapLngLat) => void;
  destroy: () => void;
  resize?: () => void;
};

type AmapMarker = {
  setPosition: (pos: [number, number] | AmapLngLat) => void;
  getPosition: () => AmapLngLat;
  setMap: (map: AmapMap | null) => void;
  on: (event: string, cb: (e: { lnglat: AmapLngLat }) => void) => void;
};

type AmapPlaceSearch = {
  search: (
    keyword: string,
    cb: (status: string, result: Record<string, unknown>) => void,
  ) => void;
};

declare global {
  interface Window {
    AMap?: AmapNamespace;
    _AMapSecurityConfig?: { securityJsCode: string };
  }
}

let loadPromise: Promise<AmapNamespace> | null = null;

function ensureAmapSecurityConfig() {
  window._AMapSecurityConfig = {
    securityJsCode: AMAP_SECURITY_JS_CODE,
  };
}

export function loadAmapApi(): Promise<AmapNamespace> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("当前环境无法加载地图"));
  }
  ensureAmapSecurityConfig();
  if (window.AMap) {
    return Promise.resolve(window.AMap);
  }
  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById("amap-jsapi-script");
    if (existing) {
      if (window.AMap) {
        resolve(window.AMap);
        return;
      }
      existing.addEventListener("load", () => {
        if (window.AMap) resolve(window.AMap);
        else reject(new Error("高德地图加载失败"));
      });
      existing.addEventListener("error", () => reject(new Error("高德地图脚本加载失败")));
      return;
    }

    const script = document.createElement("script");
    script.id = "amap-jsapi-script";
    script.type = "text/javascript";
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${AMAP_WEB_KEY}&plugin=AMap.PlaceSearch,AMap.Geocoder,AMap.AutoComplete,AMap.Geolocation`;
    script.onload = () => {
      if (window.AMap) resolve(window.AMap);
      else reject(new Error("高德地图加载失败"));
    };
    script.onerror = () => reject(new Error("高德地图脚本加载失败"));
    document.head.appendChild(script);
  });

  return loadPromise;
}
