export interface TenantItem {
  carTotal?: number | null;
  domainName?: string;
  env?: string | number;
  logo?: string;
  tenantId: string;
  tenantDesc?: string;
  tenantName?: string;
}

function pickCarTotal(row: Record<string, unknown>): number | null {
  const raw = row.car_total ?? row.carTotal;
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s || s.toLowerCase() === "none") return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  return null;
}

export interface TenantGrayItem {
  beta?: boolean;
  tenantId: string;
  grayGroup?: number;
  canGray?: boolean;
  /** 1 全量加厚 / 2 B端加灰 / 3 B端自主加灰 */
  grayType?: 1 | 2 | 3;
}

function pickGrayType(raw: unknown): 1 | 2 | 3 | undefined {
  const n = Number(raw);
  if (n === 1 || n === 2 || n === 3) return n;
  return undefined;
}

export interface TenantGrayTypeTagMeta {
  type: 1 | 2 | 3;
  text: string;
  detail: string;
  color: {
    color: string;
    textColor: string;
    borderColor: string;
  };
}

const GRAY_TYPE_TAG: Record<1 | 2 | 3, TenantGrayTypeTagMeta> = {
  1: {
    type: 1,
    text: "全量",
    detail: "全量加灰",
    color: {
      color: "#fafafa",
      textColor: "#71717a",
      borderColor: "#e4e4e7",
    },
  },
  2: {
    type: 2,
    text: "B端",
    detail: "B端加灰",
    color: {
      color: "#eff6ff",
      textColor: "#1d4ed8",
      borderColor: "#bfdbfe",
    },
  },
  3: {
    type: 3,
    text: "自主",
    detail: "B端自主加灰",
    color: {
      color: "#f0fdf4",
      textColor: "#15803d",
      borderColor: "#bbf7d0",
    },
  },
};

export function resolveGrayTypeTag(grayType?: number | string | null): TenantGrayTypeTagMeta | null {
  const n = Number(grayType);
  if (n === 1 || n === 2 || n === 3) return GRAY_TYPE_TAG[n];
  return null;
}

export interface TenantEnvTagMeta {
  text: string;
  cloud: string;
  color: {
    color: string;
    textColor: string;
    borderColor: string;
  };
}

export function normalizeTenantList(raw: unknown): TenantItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const tenantId = String(row.tenantId ?? "").trim();
      if (!tenantId) return null;
      return {
        carTotal: pickCarTotal(row),
        domainName: typeof row.domainName === "string" ? row.domainName.trim() : "",
        env: typeof row.env === "string" || typeof row.env === "number" ? row.env : "",
        logo: typeof row.logo === "string" ? row.logo.trim() : "",
        tenantId,
        tenantDesc: typeof row.tenantDesc === "string" ? row.tenantDesc.trim() : "",
        tenantName: typeof row.tenantName === "string" ? row.tenantName.trim() : "",
      } as TenantItem;
    })
    .filter((item): item is TenantItem => item != null)
    .sort((a, b) => a.tenantId.localeCompare(b.tenantId, "en", { numeric: true }));
}

export function normalizeGrayList(raw: unknown): TenantGrayItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const tenantId = String(row.tenantId ?? "").trim();
      if (!tenantId) return null;
      return {
        beta: Boolean(row.beta),
        canGray: Boolean(row.canGray),
        grayGroup: Number(row.grayGroup),
        grayType: pickGrayType(row.grayType ?? row.gray_type),
        tenantId,
      } as TenantGrayItem;
    })
    .filter((item): item is TenantGrayItem => item != null);
}

export type TenantCarLevel = "S" | "A" | "B" | "C" | "D";

export interface TenantCarLevelMeta {
  level: TenantCarLevel;
  definition: string;
  color: {
    color: string;
    textColor: string;
    borderColor: string;
  };
}

/** 租户车辆数分级（昨日上架车辆数） */
export const TENANT_CAR_LEVEL_RULES: ReadonlyArray<{
  level: TenantCarLevel;
  definition: string;
}> = [
  { level: "S", definition: "> 10000" },
  { level: "A", definition: "5000 - 10000" },
  { level: "B", definition: "2000 - 5000" },
  { level: "C", definition: "1000 - 2000" },
  { level: "D", definition: "0 - 1000" },
] as const;

const TENANT_CAR_LEVEL_COLORS: Record<TenantCarLevel, TenantCarLevelMeta["color"]> = {
  S: { color: "#fee2e2", textColor: "#b91c1c", borderColor: "#f87171" },
  A: { color: "#ffedd5", textColor: "#c2410c", borderColor: "#fb923c" },
  B: { color: "#eff6ff", textColor: "#1d4ed8", borderColor: "#93c5fd" },
  C: { color: "#ecfeff", textColor: "#0e7490", borderColor: "#67e8f9" },
  D: { color: "#f4f4f5", textColor: "#52525b", borderColor: "#d4d4d8" },
};

function tenantCarLevelMeta(level: TenantCarLevel): TenantCarLevelMeta {
  const rule = TENANT_CAR_LEVEL_RULES.find((item) => item.level === level)!;
  return {
    level,
    definition: rule.definition,
    color: TENANT_CAR_LEVEL_COLORS[level],
  };
}

/** 根据昨日上架车辆数返回租户级别；无有效数据时返回 null */
export function resolveTenantCarLevel(carTotal?: number | null): TenantCarLevelMeta | null {
  if (carTotal == null || !Number.isFinite(Number(carTotal))) return null;
  const n = Number(carTotal);
  if (n > 10000) return tenantCarLevelMeta("S");
  if (n >= 5000) return tenantCarLevelMeta("A");
  if (n >= 2000) return tenantCarLevelMeta("B");
  if (n >= 1000) return tenantCarLevelMeta("C");
  if (n >= 0) return tenantCarLevelMeta("D");
  return null;
}

export function resolveTenantEnvTag(env?: string | number): TenantEnvTagMeta {
  const key = String(env ?? "").trim().toLowerCase();
  if (key === "1") {
    return {
      text: "prod",
      cloud: "华为云",
      color: {
        color: "#fff1f0",
        textColor: "#cf1322",
        borderColor: "#ffa39e",
      },
    };
  }
  if (key === "2") {
    return {
      text: "prod2",
      cloud: "阿里云",
      color: {
        color: "#fff7e6",
        textColor: "#d46b08",
        borderColor: "#ffd591",
      },
    };
  }
  return {
    text: "独立",
    cloud: "",
    color: {
      color: "#f5f5f5",
      textColor: "#595959",
      borderColor: "#d9d9d9",
    },
  };
}
