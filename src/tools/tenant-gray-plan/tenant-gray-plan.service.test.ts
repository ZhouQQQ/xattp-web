import { describe, expect, it } from "vitest";
import type { TenantGrayItem, TenantItem } from "../tenant-dashboard/tenant-dashboard.service";
import {
  buildGrayPlanRows,
  compareCarTotalAsc,
  compareCarTotalDesc,
  dedupeImportedPlanLinesLastWins,
  DEFAULT_PLAN_STEP_MS,
  envLabelForGrayPanel,
  filterTenantsFuzzy,
  formatPlanLocalDateTime,
  grayPanelKeyForTenant,
  isStandaloneTenant,
  parseImportedPlanTimeCell,
  parseImportedPlanTsvText,
  planRowsToTsv,
} from "./tenant-gray-plan.service";

function tenant(partial: Partial<TenantItem> & Pick<TenantItem, "tenantId">): TenantItem {
  return {
    tenantId: partial.tenantId,
    tenantName: partial.tenantName,
    carTotal: partial.carTotal ?? null,
    env: partial.env ?? "1",
    domainName: partial.domainName,
    logo: partial.logo,
    tenantDesc: partial.tenantDesc,
  };
}

describe("tenant-gray-plan.service", () => {
  it("filterTenantsFuzzy matches id or name", () => {
    const list = [tenant({ tenantId: "2429", tenantName: "A公司" }), tenant({ tenantId: "999", tenantName: "其它" })];
    expect(filterTenantsFuzzy(list, "2429").map((t) => t.tenantId)).toEqual(["2429"]);
    expect(filterTenantsFuzzy(list, "公司").map((t) => t.tenantId)).toEqual(["2429"]);
  });

  it("grayPanelKeyForTenant respects gray group", () => {
    const map = new Map<string, TenantGrayItem>([
      ["a", { tenantId: "a", grayGroup: 1 }],
      ["b", { tenantId: "b", grayGroup: 2 }],
    ]);
    expect(grayPanelKeyForTenant("a", map)).toBe("gray-1");
    expect(grayPanelKeyForTenant("b", map)).toBe("gray-2");
    expect(grayPanelKeyForTenant("c", map)).toBe("formal");
  });

  it("envLabelForGrayPanel matches dashboard wording", () => {
    expect(envLabelForGrayPanel("1", "gray-1")).toBe("prod-gray1");
    expect(envLabelForGrayPanel("2", "gray-2")).toBe("prod2-gray2");
    expect(envLabelForGrayPanel("1", "formal")).toBe("prod");
  });

  it("isStandaloneTenant is true only for non prod/prod2 env", () => {
    expect(isStandaloneTenant(tenant({ tenantId: "1", env: "1" }))).toBe(false);
    expect(isStandaloneTenant(tenant({ tenantId: "2", env: "2" }))).toBe(false);
    expect(isStandaloneTenant(tenant({ tenantId: "3", env: "yunjiang" }))).toBe(true);
    expect(isStandaloneTenant(tenant({ tenantId: "4", env: "" }))).toBe(true);
  });

  it("compareCarTotalAsc puts missing car last", () => {
    const a = tenant({ tenantId: "1", carTotal: 100 });
    const b = tenant({ tenantId: "2", carTotal: null });
    expect([a, b].sort(compareCarTotalAsc).map((t) => t.tenantId)).toEqual(["1", "2"]);
  });

  it("compareCarTotalDesc puts missing car last", () => {
    const hi = tenant({ tenantId: "1", carTotal: 5000 });
    const lo = tenant({ tenantId: "2", carTotal: 100 });
    const miss = tenant({ tenantId: "3", carTotal: null });
    expect([hi, lo, miss].sort(compareCarTotalDesc).map((t) => t.tenantId)).toEqual(["1", "2", "3"]);
  });

  it("buildGrayPlanRows sorts by car and steps time", () => {
    const base = new Date("2026-05-14T10:00:00").getTime();
    const rows = buildGrayPlanRows(
      [
        { tenant: tenant({ tenantId: "d", carTotal: 5000, env: "2" }), panelKey: "formal" },
        { tenant: tenant({ tenantId: "a", carTotal: 100, env: "1" }), panelKey: "gray-2" },
        { tenant: tenant({ tenantId: "b", carTotal: 200, env: "1" }), panelKey: "gray-1" },
      ],
      base,
      DEFAULT_PLAN_STEP_MS,
    );
    expect(rows.map((r) => r.tenantId)).toEqual(["a", "b", "d"]);
    expect(rows[0].plannedGrayAt).toBe(formatPlanLocalDateTime(base));
    expect(rows[1].plannedGrayAt).toBe(formatPlanLocalDateTime(base + DEFAULT_PLAN_STEP_MS));
    expect(rows[2].plannedGrayAt).toBe(formatPlanLocalDateTime(base + DEFAULT_PLAN_STEP_MS * 2));
  });

  it("planRowsToTsv omits header by default", () => {
    const at = formatPlanLocalDateTime(new Date("2026-05-14T10:00:00").getTime());
    const tsv = planRowsToTsv([
      {
        tenantId: "1",
        customerName: "X",
        carTotalDisplay: "10",
        currentEnv: "prod",
        plannedGrayAt: at,
      },
    ]);
    expect(tsv.split("\n")[0]).not.toContain("租户ID");
    expect(tsv).toBe(`1\tX\t10\tprod\t${at}`);
  });

  it("planRowsToTsv includes header when includeHeader is true", () => {
    const at = formatPlanLocalDateTime(new Date("2026-05-14T10:00:00").getTime());
    const tsv = planRowsToTsv(
      [
        {
          tenantId: "1",
          customerName: "X",
          carTotalDisplay: "10",
          currentEnv: "prod",
          plannedGrayAt: at,
        },
      ],
      { includeHeader: true },
    );
    expect(tsv.split("\n")[0]).toContain("租户ID");
    expect(tsv).toContain(`1\tX\t10\tprod\t${at}`);
  });

  it("parseImportedPlanTimeCell parses new and old suffix formats", () => {
    const msNew = parseImportedPlanTimeCell("2026-05-01 10:38（周五上午）");
    expect(msNew).toBe(new Date(2026, 4, 1, 10, 38, 0, 0).getTime());
    expect(parseImportedPlanTimeCell("2026-05-02 10:39")).toBe(new Date(2026, 4, 2, 10, 39, 0, 0).getTime());
    const msOld = parseImportedPlanTimeCell("（周六上午）2026-05-02 10:39");
    expect(msOld).toBe(new Date(2026, 4, 2, 10, 39, 0, 0).getTime());
    expect(parseImportedPlanTimeCell("bad")).toBeNull();
  });

  it("parseImportedPlanTsvText parses sample lines and skips header", () => {
    const line =
      "3161\t佛铁电单车+\t177\tprod2-gray1\t2026-05-01 10:38（周五上午）";
    const header = "租户ID\t租户名称\t车辆数\t当前所在环境\t计划灰度时间";
    const { rows, lineErrors } = parseImportedPlanTsvText(`${header}\n${line}\n`);
    expect(lineErrors).toHaveLength(0);
    expect(rows).toHaveLength(1);
    expect(rows[0].tenantId).toBe("3161");
    expect(rows[0].customerName).toBe("佛铁电单车+");
    expect(rows[0].plannedAtMs).toBe(new Date(2026, 4, 1, 10, 38, 0, 0).getTime());
  });

  it("dedupeImportedPlanLinesLastWins keeps last row per tenant", () => {
    const a = {
      tenantId: "1",
      customerName: "a",
      carTotalDisplay: "1",
      currentEnv: "prod",
      plannedGrayAtRaw: "2026-01-01 10:00（周四上午）",
      plannedAtMs: parseImportedPlanTimeCell("2026-01-01 10:00（周四上午）"),
    };
    const b = {
      tenantId: "1",
      customerName: "b",
      carTotalDisplay: "2",
      currentEnv: "prod",
      plannedGrayAtRaw: "2026-01-02 11:00（周五上午）",
      plannedAtMs: parseImportedPlanTimeCell("2026-01-02 11:00（周五上午）"),
    };
    const out = dedupeImportedPlanLinesLastWins([a, b]);
    expect(out).toHaveLength(1);
    expect(out[0].customerName).toBe("b");
    expect(out[0].plannedAtMs).toBe(b.plannedAtMs);
  });
});
