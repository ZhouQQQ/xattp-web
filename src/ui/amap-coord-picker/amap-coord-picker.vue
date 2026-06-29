<script lang="ts" setup>
import { computed, nextTick, ref, watch } from "vue";
import { createDiscreteApi } from "naive-ui";
import { loadAmapApi } from "@/utils/amap-loader";

const SEARCH_TIMEOUT_MS = 10000;
const SUGGEST_DEBOUNCE_MS = 300;

interface SuggestOption {
  label: string;
  value: string;
  location?: unknown;
}

const props = withDefaults(
  defineProps<{
    show: boolean;
    lng?: number | null;
    lat?: number | null;
  }>(),
  {
    lng: null,
    lat: null,
  },
);

const emit = defineEmits<{
  "update:show": [value: boolean];
  confirm: [payload: { lng: number; lat: number }];
}>();

const { message } = createDiscreteApi(["message"]);

const mapContainerRef = ref<HTMLElement | null>(null);
const searchKeyword = ref("");
const suggestOptions = ref<SuggestOption[]>([]);
const pickedLng = ref<number | null>(null);
const pickedLat = ref<number | null>(null);
const mapLoading = ref(false);
const searchLoading = ref(false);
const suggestLoading = ref(false);
const locateLoading = ref(false);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mapInstance: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let markerInstance: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let placeSearchInstance: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let geocoderInstance: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let autoCompleteInstance: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let geolocationInstance: any = null;
let suggestTimer: ReturnType<typeof window.setTimeout> | null = null;

const coordPreview = computed(() => {
  if (pickedLng.value == null || pickedLat.value == null) return "请在地图上点击或搜索选取坐标";
  return `经度 ${pickedLng.value}，纬度 ${pickedLat.value}`;
});

function resolveInitialCenter(): [number, number] {
  const lng = Number(props.lng);
  const lat = Number(props.lat);
  if (Number.isFinite(lng) && Number.isFinite(lat)) {
    return [lng, lat];
  }
  return [114.434888, 30.500136];
}

function parseAmapLocation(location: unknown): { lng: number; lat: number } | null {
  if (!location) return null;
  if (typeof location === "string") {
    const [lng, lat] = location.split(",").map((item) => Number(item.trim()));
    if (Number.isFinite(lng) && Number.isFinite(lat)) return { lng, lat };
    return null;
  }
  if (typeof location === "object") {
    const obj = location as {
      getLng?: () => number;
      getLat?: () => number;
      lng?: number;
      lat?: number;
    };
    if (typeof obj.getLng === "function" && typeof obj.getLat === "function") {
      const lng = obj.getLng();
      const lat = obj.getLat();
      if (Number.isFinite(lng) && Number.isFinite(lat)) return { lng, lat };
    }
    if (Number.isFinite(Number(obj.lng)) && Number.isFinite(Number(obj.lat))) {
      return { lng: Number(obj.lng), lat: Number(obj.lat) };
    }
  }
  return null;
}

function extractPoisFromPlaceResult(result: Record<string, unknown>): Array<{ location?: unknown }> {
  const poiList = result.poiList as Record<string, unknown> | undefined;
  const fromPoiList = poiList?.pois ?? poiList?.POIs;
  if (Array.isArray(fromPoiList)) return filterPoiItems(fromPoiList);
  if (Array.isArray(result.pois)) return filterPoiItems(result.pois);
  return [];
}

function filterPoiItems(pois: unknown[]): Array<{ location?: unknown }> {
  return pois.filter((item) => item && typeof item === "object") as Array<{ location?: unknown }>;
}

function mapAmapErrorMessage(info: unknown): string {
  const text = String(info ?? "").trim();
  if (!text || text === "OK") return "搜索失败";
  if (text === "USERKEY_PLAT_NOMATCH") {
    return "高德 Key 与平台不匹配，请检查控制台 Web 端 Key 及安全密钥配置";
  }
  return text;
}

function extractAmapError(result: Record<string, unknown> | null | undefined): string | null {
  if (!result) return null;
  if (String(result.status) === "0" || (result.info && String(result.info) !== "OK")) {
    return mapAmapErrorMessage(result.info);
  }
  return null;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs = SEARCH_TIMEOUT_MS): Promise<T | "timeout"> {
  return Promise.race([
    promise,
    new Promise<"timeout">((resolve) => {
      window.setTimeout(() => resolve("timeout"), timeoutMs);
    }),
  ]);
}

function updatePickedPosition(lng: number, lat: number) {
  pickedLng.value = Number(lng.toFixed(6));
  pickedLat.value = Number(lat.toFixed(6));
  markerInstance?.setPosition([pickedLng.value, pickedLat.value]);
  mapInstance?.setCenter([pickedLng.value, pickedLat.value]);
  mapInstance?.setZoom?.(16);
}

function clearSuggestTimer() {
  if (suggestTimer != null) {
    window.clearTimeout(suggestTimer);
    suggestTimer = null;
  }
}

function destroyMap() {
  clearSuggestTimer();
  markerInstance = null;
  placeSearchInstance = null;
  geocoderInstance = null;
  autoCompleteInstance = null;
  geolocationInstance = null;
  if (mapInstance) {
    mapInstance.destroy();
    mapInstance = null;
  }
}

function loadAmapPlugins(AMap: { plugin: (names: string[], cb: () => void) => void }) {
  return new Promise<void>((resolve) => {
    AMap.plugin(
      ["AMap.PlaceSearch", "AMap.Geocoder", "AMap.AutoComplete", "AMap.Geolocation"],
      () => resolve(),
    );
  });
}

async function initMap() {
  if (!mapContainerRef.value) return;
  destroyMap();
  mapLoading.value = true;
  try {
    const AMap = await loadAmapApi();
    const [lng, lat] = resolveInitialCenter();
    pickedLng.value = lng;
    pickedLat.value = lat;

    await loadAmapPlugins(AMap);

    mapInstance = new AMap.Map(mapContainerRef.value, {
      zoom: 15,
      center: [lng, lat],
      viewMode: "2D",
    });

    markerInstance = new AMap.Marker({
      position: [lng, lat],
      draggable: true,
    });
    mapInstance.add(markerInstance);

    mapInstance.on("click", (e: { lnglat: { getLng: () => number; getLat: () => number } }) => {
      updatePickedPosition(e.lnglat.getLng(), e.lnglat.getLat());
    });

    markerInstance.on("dragend", (e: { lnglat: { getLng: () => number; getLat: () => number } }) => {
      updatePickedPosition(e.lnglat.getLng(), e.lnglat.getLat());
    });

    placeSearchInstance = new AMap.PlaceSearch({
      map: mapInstance,
      pageSize: 5,
      citylimit: false,
    });

    geocoderInstance = new AMap.Geocoder({
      city: "全国",
    });

    autoCompleteInstance = new AMap.AutoComplete({
      city: "全国",
      citylimit: false,
    });

    geolocationInstance = new AMap.Geolocation({
      enableHighAccuracy: true,
      timeout: 10000,
      convert: true,
      showButton: false,
    });

    await nextTick();
    window.setTimeout(() => {
      mapInstance?.resize?.();
    }, 100);
  } catch (error) {
    message.error(error instanceof Error ? error.message : "地图加载失败");
    emit("update:show", false);
  } finally {
    mapLoading.value = false;
  }
}

function applySearchLocation(location: unknown): boolean {
  const parsed = parseAmapLocation(location);
  if (!parsed) return false;
  updatePickedPosition(parsed.lng, parsed.lat);
  return true;
}

type SearchAttemptResult = {
  found: boolean;
  error?: string;
};

function extractGeocodesFromResult(result: Record<string, unknown>): Array<{ location?: unknown }> {
  if (Array.isArray(result.geocodes)) {
    return result.geocodes.filter((item) => item && typeof item === "object") as Array<{ location?: unknown }>;
  }
  return [];
}

function fetchSuggestions(keyword: string) {
  if (!autoCompleteInstance) return;
  suggestLoading.value = true;
  autoCompleteInstance.search(keyword, (status: string, result: Record<string, unknown>) => {
    suggestLoading.value = false;
    const tips = Array.isArray(result.tips) ? result.tips : [];
    if (status !== "complete" || tips.length === 0) {
      suggestOptions.value = [];
      return;
    }
    suggestOptions.value = tips
      .filter((tip) => tip && typeof tip === "object" && (tip as { name?: string }).name)
      .map((tip) => {
        const item = tip as { name: string; district?: string; location?: unknown };
        return {
          label: item.district ? `${item.name}（${item.district}）` : item.name,
          value: item.name,
          location: item.location,
        };
      });
  });
}

function onSearchKeywordUpdate(value: string | null) {
  const keyword = String(value ?? "").trim();
  searchKeyword.value = keyword;
  clearSuggestTimer();
  if (!keyword) {
    suggestOptions.value = [];
    return;
  }
  suggestTimer = window.setTimeout(() => fetchSuggestions(keyword), SUGGEST_DEBOUNCE_MS);
}

function onSuggestSelect(value: string) {
  searchKeyword.value = value;
  const option = suggestOptions.value.find((item) => item.value === value);
  if (option?.location && applySearchLocation(option.location)) {
    return;
  }
  void handleSearch();
}

function searchByGeocoder(keyword: string): Promise<SearchAttemptResult> {
  if (!geocoderInstance) return Promise.resolve({ found: false });
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: SearchAttemptResult) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    try {
      geocoderInstance.getLocation(keyword, (status: string, result: Record<string, unknown>) => {
        const apiError = extractAmapError(result);
        if (apiError) {
          finish({ found: false, error: apiError });
          return;
        }
        const geocodes = extractGeocodesFromResult(result);
        if (status === "complete" && geocodes.length > 0 && applySearchLocation(geocodes[0].location)) {
          finish({ found: true });
          return;
        }
        finish({ found: false });
      });
    } catch (error) {
      finish({
        found: false,
        error: error instanceof Error ? error.message : "地理编码失败",
      });
    }
  });
}

function searchByPlaceSearch(keyword: string): Promise<SearchAttemptResult> {
  if (!placeSearchInstance) return Promise.resolve({ found: false });
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: SearchAttemptResult) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    try {
      placeSearchInstance.search(keyword, (status: string, result: Record<string, unknown>) => {
        const apiError = extractAmapError(result);
        if (apiError) {
          finish({ found: false, error: apiError });
          return;
        }
        const pois = extractPoisFromPlaceResult(result);
        if ((status === "complete" || status === "OK") && pois.length > 0 && applySearchLocation(pois[0].location)) {
          finish({ found: true });
          return;
        }
        finish({ found: false });
      });
    } catch (error) {
      finish({
        found: false,
        error: error instanceof Error ? error.message : "地图搜索失败",
      });
    }
  });
}

async function handleSearch() {
  const keyword = searchKeyword.value.trim();
  if (!keyword) {
    message.warning("请输入搜索关键词");
    return;
  }
  if (!placeSearchInstance && !mapInstance) {
    message.warning("地图尚未就绪");
    return;
  }

  searchLoading.value = true;
  let lastError = "";

  try {
    const geocodeResult = await withTimeout(searchByGeocoder(keyword));
    if (geocodeResult === "timeout") {
      lastError = "搜索超时，请稍后重试";
    } else if (geocodeResult.found) {
      return;
    } else if (geocodeResult.error) {
      lastError = geocodeResult.error;
    }

    const sdkResult = await withTimeout(searchByPlaceSearch(keyword));
    if (sdkResult === "timeout") {
      lastError = lastError || "地图搜索超时，请稍后重试";
    } else if (sdkResult.found) {
      return;
    } else if (sdkResult.error) {
      lastError = sdkResult.error;
    }

    message.warning(lastError || "未找到相关地点，请换个关键词试试");
  } finally {
    searchLoading.value = false;
  }
}

function locateByBrowser(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updatePickedPosition(pos.coords.longitude, pos.coords.latitude);
        resolve(true);
      },
      () => resolve(false),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  });
}

async function handleLocateCurrent() {
  if (!mapInstance) {
    message.warning("地图尚未就绪");
    return;
  }
  locateLoading.value = true;
  try {
    if (geolocationInstance) {
      const located = await new Promise<boolean>((resolve) => {
        let settled = false;
        const finish = (ok: boolean) => {
          if (settled) return;
          settled = true;
          resolve(ok);
        };
        window.setTimeout(() => finish(false), 12000);
        geolocationInstance.getCurrentPosition((status: string, result: Record<string, unknown>) => {
          const position = result.position as { lng?: number; lat?: number } | undefined;
          if (status === "complete" && position && Number.isFinite(position.lng) && Number.isFinite(position.lat)) {
            updatePickedPosition(Number(position.lng), Number(position.lat));
            finish(true);
            return;
          }
          finish(false);
        });
      });
      if (located) {
        message.success("已定位到当前位置");
        return;
      }
    }

    const browserLocated = await locateByBrowser();
    if (browserLocated) {
      message.success("已定位到当前位置（浏览器定位）");
      return;
    }
    message.error("定位失败，请允许浏览器定位权限后重试");
  } finally {
    locateLoading.value = false;
  }
}

function handleClose() {
  emit("update:show", false);
}

function handleConfirm() {
  if (pickedLng.value == null || pickedLat.value == null) {
    message.warning("请先选取坐标");
    return;
  }
  emit("confirm", { lng: pickedLng.value, lat: pickedLat.value });
  emit("update:show", false);
}

watch(
  () => props.show,
  async (visible) => {
    if (!visible) {
      destroyMap();
      searchKeyword.value = "";
      suggestOptions.value = [];
      return;
    }
    await nextTick();
    await initMap();
  },
);
</script>

<template>
  <n-modal
    :show="show"
    preset="card"
    title="坐标选取"
    class="amap-coord-picker-modal"
    :mask-closable="false"
    :auto-focus="false"
    :content-style="{ overflow: 'hidden', padding: '12px 16px 8px' }"
    :style="{ width: 'min(98vw, 1400px)', maxWidth: '1400px' }"
    @update:show="emit('update:show', $event)"
  >
    <div class="amap-picker-body">
      <div class="amap-search-row">
        <n-auto-complete
          v-model:value="searchKeyword"
          class="amap-search-input"
          :options="suggestOptions"
          :loading="suggestLoading"
          placeholder="搜索地点，输入即联想，如：光谷广场"
          clearable
          size="small"
          @update:value="onSearchKeywordUpdate"
          @select="onSuggestSelect"
          @keydown.enter.prevent="handleSearch"
        />
        <n-button type="default" size="small" :loading="searchLoading" :disabled="mapLoading" @click="handleSearch">
          搜索
        </n-button>
        <n-button type="default" size="small" :loading="locateLoading" :disabled="mapLoading" @click="handleLocateCurrent">
          当前定位
        </n-button>
      </div>
      <div class="amap-coord-preview">
        {{ coordPreview }}
      </div>
      <n-spin :show="mapLoading">
        <div ref="mapContainerRef" class="amap-container" />
      </n-spin>
    </div>
    <template #footer>
      <n-space justify="end">
        <n-button size="small" @click="handleClose">
          取消
        </n-button>
        <n-button type="primary" size="small" :disabled="mapLoading" @click="handleConfirm">
          确定
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<style lang="less" scoped>
.amap-coord-picker-modal {
  :deep(.n-card) {
    max-height: calc(100vh - 40px);
    display: flex;
    flex-direction: column;
  }

  :deep(.n-card__content) {
    overflow: hidden !important;
    flex: 1;
    min-height: 0;
  }

  :deep(.n-card__footer) {
    flex-shrink: 0;
  }
}

.amap-picker-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
}

.amap-search-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.amap-search-input {
  flex: 1;
  min-width: 0;
}

.amap-container {
  width: 100%;
  height: calc(100vh - 260px);
  min-height: 380px;
  max-height: 680px;
  border-radius: 6px;
  overflow: hidden;
  background: #f3f4f6;
  flex-shrink: 0;
}

.amap-coord-preview {
  font-size: 13px;
  color: #374151;
  flex-shrink: 0;
  line-height: 1.4;
  min-height: 20px;
}
</style>
