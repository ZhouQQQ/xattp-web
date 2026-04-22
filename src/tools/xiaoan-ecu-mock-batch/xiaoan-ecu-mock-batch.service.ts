export type BatchCreateMode = 1 | 2 | 3;

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
  mode: BatchCreateMode;
  num: number | null;
  start_imei: string;
  imeis_text: string;
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
  mode: BatchCreateMode;
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

  return null;
}

export function buildBatchPayload(form: BatchFormData): BatchPayload {
  const payload: BatchPayload = {
    env: form.env.trim(),
    mode: form.mode,
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
  if (typeof form.lat === "number" && !Number.isNaN(form.lat)) payload.lat = form.lat;
  if (typeof form.lng === "number" && !Number.isNaN(form.lng)) payload.lng = form.lng;
  if (typeof form.radius_m === "number" && !Number.isNaN(form.radius_m)) payload.radius_m = form.radius_m;

  if (form.mode === 1) {
    payload.num = Number(form.num);
  } else if (form.mode === 2) {
    payload.start_imei = form.start_imei.trim();
    payload.num = Number(form.num);
  } else {
    payload.imeis = parseImeisText(form.imeis_text);
  }

  return payload;
}
