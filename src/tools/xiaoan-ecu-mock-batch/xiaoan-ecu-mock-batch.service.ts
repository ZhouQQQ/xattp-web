export type BatchCreateMode = 1 | 2 | 3;
export type CoordMode = "scatter" | "fixed";
export type CreateMode = 1 | 2;

export interface BatchFormData {
  env: string;
  server: string;
  tenant_id: string;
  business_type: 1 | 2 | 3 | null;
  voltage_min: number | null;
  voltage_max: number | null;
  lat: number | null;
  lng: number | null;
  radius_m: number | null;
  coord_mode: CoordMode;
  mode: BatchCreateMode;
  create_mode: CreateMode;
  serial_interval_ms: number;
  num: number | null;
  start_imei: string;
  imeis_text: string;
  coordinates_text: string;
}

export interface BatchPayload {
  env: string;
  server?: string;
  tenant_id?: string;
  business_type?: 1 | 2 | 3;
  voltage_min?: number;
  voltage_max?: number;
  lat?: number;
  lng?: number;
  radius_m?: number;
  coord_mode?: CoordMode;
  coordinates?: Array<{ lat: number; lng: number }>;
  mode: BatchCreateMode;
  create_mode?: CreateMode;
  serial_interval_ms?: number;
  num?: number;
  start_imei?: string;
  imeis?: string[];
}

export function parseImeisText(input: string): string[] {
  return String(input ?? "")
    .split(/[\s,，;；]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function isFifteenDigitImei(input: string): boolean {
  return /^\d{15}$/.test(String(input ?? "").trim());
}

export function parseCoordinatesText(input: string): Array<{ lat: number; lng: number }> {
  const lines = String(input ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) {
    throw new Error("请先填写经纬度列表（每行一个，格式：lng,lat 经度在前、纬度在后）");
  }
  const points: Array<{ lat: number; lng: number }> = [];
  lines.forEach((line, idx) => {
    const parts = line.split(/[\s,，]+/).filter(Boolean);
    if (parts.length !== 2) {
      throw new Error(`coordinates[${idx}] 必须是一行一个经纬度，格式如：114.434888,30.500136（经度,纬度）`);
    }
    const pointLng = Number(parts[0]);
    const pointLat = Number(parts[1]);
    if (!Number.isFinite(pointLat) || !Number.isFinite(pointLng)) {
      throw new Error(`coordinates[${idx}] 的经度、纬度必须是数字`);
    }
    points.push({ lat: pointLat, lng: pointLng });
  });
  return points;
}

export interface CsvImeiLngLatRow {
  imei: string;
  lng: number;
  lat: number;
}

export function parseImeiLngLatCsv(input: string): CsvImeiLngLatRow[] {
  const lines = String(input ?? "")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) {
    throw new Error("CSV 至少需要包含表头和一行数据");
  }
  const header = lines[0].split(",").map((item) => item.trim().toLowerCase());
  const imeiIdx = header.findIndex((item) => item === "imei");
  const lngIdx = header.findIndex((item) => item === "lng" || item === "lon" || item === "longitude");
  const latIdx = header.findIndex((item) => item === "lat" || item === "latitude");
  if (imeiIdx < 0 || lngIdx < 0 || latIdx < 0) {
    throw new Error("CSV 表头必须包含 imei,lng,lat 字段");
  }

  const rows: CsvImeiLngLatRow[] = [];
  lines.slice(1).forEach((line, idx) => {
    const cols = line.split(",").map((item) => item.trim());
    const rowNo = idx + 2;
    const imei = cols[imeiIdx] ?? "";
    const lngRaw = cols[lngIdx] ?? "";
    const latRaw = cols[latIdx] ?? "";
    if (!isFifteenDigitImei(imei)) {
      throw new Error(`CSV 第 ${rowNo} 行 IMEI 非法，必须是 15 位数字`);
    }
    const lng = Number(lngRaw);
    const lat = Number(latRaw);
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
      throw new Error(`CSV 第 ${rowNo} 行经纬度非法，必须是数字`);
    }
    rows.push({ imei, lng, lat });
  });
  if (rows.length === 0) {
    throw new Error("CSV 未包含有效数据行");
  }
  return rows;
}

export function validateBatchForm(form: BatchFormData): string | null {
  if (!form.env?.trim()) return "请先点击右侧「共享 / 短租 / 海外」在弹窗中选择环境并填充设备网关";
  if (!form.server?.trim()) return "请输入设备网关";

  const vmin = form.voltage_min;
  const vmax = form.voltage_max;
  if (!Number.isInteger(vmin) || !Number.isInteger(vmax)) {
    return "电压范围必须是整数";
  }
  if (vmin < 0 || vmax < 0) {
    return "电压范围不能为负数";
  }
  if (vmin > 72 || vmax > 72) {
    return "电压范围不能超过 72V";
  }
  if (vmin > vmax) {
    return "最小电压不能大于最大电压";
  }

  if (form.coord_mode === "scatter" && (!Number.isFinite(Number(form.lat)) || !Number.isFinite(Number(form.lng)))) {
    return "经纬度必须是有效数字";
  }

  if (form.mode === 1) {
    if (!Number.isInteger(form.num) || Number(form.num) <= 0) {
      return "随机模式下 num 必须是大于 0 的整数";
    }
  }

  if (form.mode === 2) {
    if (!isFifteenDigitImei(form.start_imei)) {
      return "顺序模式下 start_imei 必须是 15 位数字";
    }
    if (!Number.isInteger(form.num) || Number(form.num) <= 0) {
      return "顺序模式下 num 必须是大于 0 的整数";
    }
  }

  if (form.mode === 3) {
    const imeis = parseImeisText(form.imeis_text);
    if (imeis.length === 0) {
      return "指定模式下 imeis 必须是非空数组";
    }
    const invalid = imeis.find((item) => !isFifteenDigitImei(item));
    if (invalid) {
      return `指定模式存在非法 imei: ${invalid}`;
    }
  }

  if (form.coord_mode === "fixed") {
    try {
      parseCoordinatesText(form.coordinates_text);
    } catch (error: unknown) {
      return error instanceof Error ? error.message : "指定经纬度模式下 coordinates 无效";
    }
  }

  if (form.create_mode !== 1 && form.create_mode !== 2) {
    return "创建模式无效，仅支持：1(并行创建)、2(串行创建)";
  }
  if (!Number.isInteger(form.serial_interval_ms) || form.serial_interval_ms < 0) {
    return "串行间隔必须是大于等于 0 的整数（ms）";
  }

  return null;
}

export function buildBatchPayload(form: BatchFormData): BatchPayload {
  const payload: BatchPayload = {
    env: form.env.trim(),
    mode: form.mode,
    create_mode: form.create_mode,
    serial_interval_ms: Math.trunc(form.serial_interval_ms),
  };

  const server = form.server.trim();
  if (server) payload.server = server;
  const tenantId = form.tenant_id.trim();
  if (tenantId) payload.tenant_id = tenantId;
  if (form.business_type === 1 || form.business_type === 2 || form.business_type === 3) {
    payload.business_type = form.business_type;
  }
  if (typeof form.voltage_min === "number" && !Number.isNaN(form.voltage_min)) {
    payload.voltage_min = Math.trunc(form.voltage_min);
  }
  if (typeof form.voltage_max === "number" && !Number.isNaN(form.voltage_max)) {
    payload.voltage_max = Math.trunc(form.voltage_max);
  }
  let createdCount = 0;
  if (form.mode === 1) {
    createdCount = Number(form.num);
    payload.num = createdCount;
  } else if (form.mode === 2) {
    payload.start_imei = form.start_imei.trim();
    createdCount = Number(form.num);
    payload.num = createdCount;
  } else {
    const imeis = parseImeisText(form.imeis_text);
    payload.imeis = imeis;
    createdCount = imeis.length;
    payload.num = createdCount;
  }

  if (form.coord_mode === "scatter") {
    if (typeof form.lat === "number" && !Number.isNaN(form.lat)) payload.lat = form.lat;
    if (typeof form.lng === "number" && !Number.isNaN(form.lng)) payload.lng = form.lng;
    payload.coord_mode = "scatter";
    if (typeof form.radius_m === "number" && !Number.isNaN(form.radius_m)) payload.radius_m = form.radius_m;
  } else {
    const points = parseCoordinatesText(form.coordinates_text);
    if (typeof form.lat === "number" && !Number.isNaN(form.lat)) payload.lat = form.lat;
    if (typeof form.lng === "number" && !Number.isNaN(form.lng)) payload.lng = form.lng;
    payload.coord_mode = "fixed";
    payload.radius_m = 0;
    payload.coordinates = points;
  }

  return payload;
}
