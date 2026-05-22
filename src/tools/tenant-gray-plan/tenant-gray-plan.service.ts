import type { TenantGrayItem, TenantItem } from "../tenant-dashboard/tenant-dashboard.service";
import { resolveTenantEnvTag } from "../tenant-dashboard/tenant-dashboard.service";

export type GrayPanelKey = "gray-1" | "gray-2" | "formal";

export function grayPanelKeyForTenant(tenantId: string, grayMap: ReadonlyMap<string, TenantGrayItem>): GrayPanelKey {
  const g = grayMap.get(tenantId);
  if (g?.grayGroup === 1) return "gray-1";
  if (g?.grayGroup === 2) return "gray-2";
  return "formal";
}

/** 与租户灰度看板面板标签一致：prod-gray1 / prod-gray2 / prod / prod2 / 独立 */
export function envLabelForGrayPanel(env: TenantItem["env"], panelKey: GrayPanelKey): string {
  const base = resolveTenantEnvTag(env).text;
  if (panelKey === "gray-1") return `${base}-gray1`;
  if (panelKey === "gray-2") return `${base}-gray2`;
  return base;
}

/** 独立部署（非 prod / prod2 云环境），与租户灰度看板 env 标签「独立」一致 */
export function isStandaloneTenant(t: Pick<TenantItem, "env">): boolean {
  return resolveTenantEnvTag(t.env).text === "独立";
}

export function filterTenantsFuzzy(tenants: readonly TenantItem[], rawKeyword: string): TenantItem[] {
  const kw = rawKeyword.trim().toLowerCase();
  if (!kw) return [...tenants];
  return tenants.filter((t) => {
    const id = String(t.tenantId ?? "").toLowerCase();
    const name = String(t.tenantName ?? "").toLowerCase();
    return id.includes(kw) || name.includes(kw);
  });
}

export interface PlanRow {
  tenantId: string;
  customerName: string;
  carTotalDisplay: string;
  currentEnv: string;
  plannedGrayAt: string;
}

export function compareCarTotalAsc(a: TenantItem, b: TenantItem): number {
  const aMiss = a.carTotal == null || !Number.isFinite(Number(a.carTotal));
  const bMiss = b.carTotal == null || !Number.isFinite(Number(b.carTotal));
  if (aMiss && bMiss) return 0;
  if (aMiss) return 1;
  if (bMiss) return -1;
  return Number(a.carTotal) - Number(b.carTotal);
}

/** 车辆数降序：数值大的在前；缺失车辆数仍排在最后（不可对 compareCarTotalAsc 简单取反） */
export function compareCarTotalDesc(a: TenantItem, b: TenantItem): number {
  const aMiss = a.carTotal == null || !Number.isFinite(Number(a.carTotal));
  const bMiss = b.carTotal == null || !Number.isFinite(Number(b.carTotal));
  if (aMiss && bMiss) return 0;
  if (aMiss) return 1;
  if (bMiss) return -1;
  return Number(b.carTotal) - Number(a.carTotal);
}

/** 与 `Date#getDay()` 一致：0 周日 … 6 周六 */
const WEEKDAY_ZH = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"] as const;

/** 上午 6–12，下午 12–18，其余为晚上（含凌晨） */
function planTimeDayPeriodZh(d: Date): "上午" | "下午" | "晚上" {
  const h = d.getHours();
  if (h >= 6 && h < 12) return "上午";
  if (h >= 12 && h < 18) return "下午";
  return "晚上";
}

/**
 * 计划灰度时间（复制/导出等）：本地日期时间 + 全角括号内的星期与时段。
 * 例：2026-05-14 10:30（周二上午）
 */
export function formatPlanLocalDateTime(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  const base = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const week = WEEKDAY_ZH[d.getDay()];
  const period = planTimeDayPeriodZh(d);
  return `${base}（${week}${period}）`;
}

/** 相邻两条计划默认间隔（与看板示例一致：30 分钟一档） */
export const DEFAULT_PLAN_STEP_MS = 30 * 60 * 1000;

export function buildGrayPlanRows(
  items: Array<{ tenant: TenantItem; panelKey: GrayPanelKey }>,
  firstPlanMs: number,
  stepMs: number = DEFAULT_PLAN_STEP_MS,
): PlanRow[] {
  const sorted = [...items].sort((x, y) => compareCarTotalAsc(x.tenant, y.tenant));
  let t = firstPlanMs;
  return sorted.map(({ tenant, panelKey }) => {
    const car =
      tenant.carTotal != null && Number.isFinite(Number(tenant.carTotal)) ? String(tenant.carTotal) : "-";
    const row: PlanRow = {
      tenantId: tenant.tenantId,
      customerName: tenant.tenantName?.trim() || "-",
      carTotalDisplay: car,
      currentEnv: envLabelForGrayPanel(tenant.env, panelKey),
      plannedGrayAt: formatPlanLocalDateTime(t),
    };
    t += stepMs;
    return row;
  });
}

const TSV_HEADER = ["租户ID", "租户名称", "车辆数", "当前所在环境", "计划灰度时间"].join("\t");

export function planRowsToTsv(rows: readonly PlanRow[], options?: { includeHeader?: boolean }): string {
  const includeHeader = options?.includeHeader === true;
  const dataLines = rows.map((r) =>
    [r.tenantId, r.customerName, r.carTotalDisplay, r.currentEnv, r.plannedGrayAt].join("\t"),
  );
  const lines = includeHeader ? [TSV_HEADER, ...dataLines] : dataLines;
  return lines.join("\n");
}

export function csvEscapeCell(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function planRowsToCsv(rows: readonly PlanRow[]): string {
  const header = ["租户ID", "租户名称", "车辆数", "当前所在环境", "计划灰度时间"].map(csvEscapeCell).join(",");
  const body = rows
    .map((r) =>
      [r.tenantId, r.customerName, r.carTotalDisplay, r.currentEnv, r.plannedGrayAt].map(csvEscapeCell).join(","),
    )
    .join("\r\n");
  return `${header}\r\n${body}`;
}

export function nextHourLocalMs(from = Date.now()): number {
  const d = new Date(from);
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return d.getTime();
}

/** 与复制表头首列一致，用于跳过导入首行 */
export function isPlanImportHeaderRow(parts: readonly string[]): boolean {
  return parts[0]?.trim() === "租户ID";
}

/** 从「计划灰度时间」单元格解析本地时间戳；支持 `yyyy-MM-dd HH:mm（周X…）` 及仅日期时间、旧格式 `（周X…）yyyy-MM-dd HH:mm` */
export function parseImportedPlanTimeCell(raw: string): number | null {
  const s = raw.trim();
  const mNew = s.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2})/);
  if (mNew) {
    return localYmdHmToMs(Number(mNew[1]), Number(mNew[2]), Number(mNew[3]), Number(mNew[4]), Number(mNew[5]));
  }
  const mOld = s.match(/^（[^）]+）\s*(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2})/);
  if (mOld) {
    return localYmdHmToMs(Number(mOld[1]), Number(mOld[2]), Number(mOld[3]), Number(mOld[4]), Number(mOld[5]));
  }
  return null;
}

function localYmdHmToMs(y: number, mo: number, d: number, h: number, mi: number): number | null {
  if (![y, mo, d, h, mi].every((n) => Number.isFinite(n))) return null;
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h < 0 || h > 23 || mi < 0 || mi > 59) return null;
  const dt = new Date(y, mo - 1, d, h, mi, 0, 0);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return dt.getTime();
}

export interface ImportedPlanLine {
  tenantId: string;
  customerName: string;
  carTotalDisplay: string;
  currentEnv: string;
  plannedGrayAtRaw: string;
  /** 解析成功为毫秒时间戳；无法解析时间为 `null`（仍可按租户导入） */
  plannedAtMs: number | null;
}

export interface PlanImportLineError {
  lineNo: number;
  line: string;
  message: string;
}

/** 将一行按制表符拆成 5 列；名称列内若含 `\t` 则合并中间段为名称 */
export function splitPlanImportColumns(line: string): string[] | null {
  const parts = line.split("\t");
  if (parts.length < 5) return null;
  if (parts.length === 5) return parts.map((p) => p.trim());
  const id = parts[0].trim();
  const time = parts[parts.length - 1].trim();
  const env = parts[parts.length - 2].trim();
  const car = parts[parts.length - 3].trim();
  const name = parts.slice(1, parts.length - 3).join("\t").trim();
  return [id, name, car, env, time];
}

/**
 * 解析待灰度计划粘贴文本（与 `planRowsToTsv` 数据行一致：制表符分隔五列）。
 * 自动去 BOM；跳过空行；首列为 `租户ID` 的表头行会跳过。
 */
export function parseImportedPlanTsvText(raw: string): {
  rows: ImportedPlanLine[];
  lineErrors: PlanImportLineError[];
} {
  const text = raw.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows: ImportedPlanLine[] = [];
  const lineErrors: PlanImportLineError[] = [];
  const lines = text.split("\n");
  let lineNo = 0;
  for (const line of lines) {
    lineNo += 1;
    const trimmed = line.trim();
    if (!trimmed) continue;
    const cols = splitPlanImportColumns(trimmed);
    if (cols == null) {
      lineErrors.push({
        lineNo,
        line: trimmed,
        message: "列数不足（需制表符分隔的 5 列：租户ID、租户名称、车辆数、当前所在环境、计划灰度时间）",
      });
      continue;
    }
    if (isPlanImportHeaderRow(cols)) continue;
    const [tenantId, customerName, carTotalDisplay, currentEnv, plannedGrayAtRaw] = cols;
    if (!tenantId) {
      lineErrors.push({ lineNo, line: trimmed, message: "租户ID 为空" });
      continue;
    }
    const plannedAtMs = parseImportedPlanTimeCell(plannedGrayAtRaw);
    rows.push({
      tenantId,
      customerName,
      carTotalDisplay,
      currentEnv,
      plannedGrayAtRaw,
      plannedAtMs,
    });
  }
  return { rows, lineErrors };
}

/** 同租户多行时保留最后一行 */
export function dedupeImportedPlanLinesLastWins(lines: readonly ImportedPlanLine[]): ImportedPlanLine[] {
  const seen = new Set<string>();
  const out: ImportedPlanLine[] = [];
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (seen.has(line.tenantId)) continue;
    seen.add(line.tenantId);
    out.push(line);
  }
  out.reverse();
  return out;
}
