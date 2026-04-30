export interface TenantItem {
  domainName?: string;
  env?: string | number;
  logo?: string;
  tenantId: string;
  tenantDesc?: string;
  tenantName?: string;
}

export interface TenantGrayItem {
  beta?: boolean;
  tenantId: string;
  grayGroup?: number;
  canGray?: boolean;
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
        tenantId,
      } as TenantGrayItem;
    })
    .filter((item): item is TenantGrayItem => item != null);
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
