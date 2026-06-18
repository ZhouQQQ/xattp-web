/** CMD82 (BMS_INFO_V4) 协议表单辅助 */

/** CMD82 协议在线文档（BIN_ALL） */
export const BIN82_PROTOCOL_DOC_URL =
  "https://xc-res.oss-cn-shenzhen.aliyuncs.com/protocol/sharing_bak%40%23%40%24/%E5%B0%8F%E5%AE%89%E7%A7%91%E6%8A%80%E5%85%B1%E4%BA%AB%E8%BD%A6%E6%9C%BA%E9%80%9A%E4%BF%A1%E5%8D%8F%E8%AE%AE(BIN_ALL).html#_cmd_bms_info_v4_%E9%80%9A%E7%94%A8bms%E4%BF%A1%E6%81%AF%E4%B8%8A%E6%8A%A5_cmd_82";

export type Bin82FieldType =
  | "u8"
  | "i8"
  | "u16"
  | "i16"
  | "u32"
  | "i32"
  | "a16"
  | "a32"
  | "bit8"
  | "bit16"
  | "bit32"
  | "enum";

export interface Bin82BitDef {
  bit: number;
  label: string;
}

export interface Bin82EnumOption {
  value: number;
  label: string;
}

export interface Bin82FieldSchema {
  key: string;
  label: string;
  type: Bin82FieldType;
  description?: string;
  unit?: string;
  bits?: Bin82BitDef[];
  enumOptions?: Bin82EnumOption[];
}

export interface Bin82ProtocolSchema {
  protocolVer: number;
  title: string;
  fields: Bin82FieldSchema[];
}

export interface Bin82FormContext {
  imei?: string;
  battery_sn?: string;
  battery_soc?: number | null;
  voltage?: number | null;
}

export function isBin82StringField(type: string): boolean {
  return type === "a16" || type === "a32";
}

export function isBin82BitField(field: Bin82FieldSchema): boolean {
  return (
    field.type === "bit8" ||
    field.type === "bit16" ||
    field.type === "bit32" ||
    (field.bits?.length ?? 0) > 0
  );
}

export function isBin82EnumField(field: Bin82FieldSchema): boolean {
  return field.type === "enum" || (field.enumOptions?.length ?? 0) > 0;
}

export function getBin82EnumOptions(field: Bin82FieldSchema) {
  return (field.enumOptions ?? []).map((opt) => ({
    label: `0x${opt.value.toString(16).toUpperCase().padStart(2, "0")} ${opt.label}`,
    value: opt.value,
  }));
}

export function getBin82BitDefs(field: Bin82FieldSchema): Bin82BitDef[] {
  if (field.bits?.length) return field.bits;
  const width = getBin82BitWidth(field);
  return Array.from({ length: width }, (_, i) => ({ bit: i, label: `BIT${i}` }));
}

export function getBin82BitWidth(field: Bin82FieldSchema): number {
  if (field.type === "bit32") return 32;
  if (field.type === "bit8") return 8;
  return 16;
}

/** 单行精简：含义 · 单位（去掉重复单位、BIT 明细、换行） */
export function formatBin82FieldSummary(field: Bin82FieldSchema): string {
  let desc = (field.description || "").trim();
  if (!desc && !field.unit) return "";

  if (field.unit) {
    desc = desc.replace(/单位[：:][^\n]*/g, "");
  }
  if (isBin82BitField(field)) {
    desc = desc
      .split("\n")
      .filter((line) => !/(?:\*?\s*)?BIT\s*\d+|bit\s*\[/i.test(line))
      .join(" ")
      .replace(/\*+/g, "")
      .trim();
    desc = desc.replace(/故障位[：:].*$/i, "故障位 0正常1故障").trim();
  } else if (isBin82EnumField(field)) {
    desc = desc.replace(/0x[0-9A-Fa-f]+[：:][^\n]*/g, "").trim();
  }

  desc = desc.split("\n")[0].replace(/\s+/g, " ").trim();
  desc = desc.replace(/[，,;；]\s*$/, "");

  const parts: string[] = [];
  if (desc) parts.push(desc);
  if (field.unit && !isBin82BitField(field)) parts.push(field.unit);
  return parts.join(" · ");
}

/** 字段填写单位提示（强调协议原始值） */
export function formatBin82UnitFillHint(field: Bin82FieldSchema): string {
  if (isBin82BitField(field) || isBin82EnumField(field) || isBin82StringField(field.type)) {
    return "";
  }
  const unit = (field.unit || "").trim();
  if (/0\.1/.test(unit)) {
    if (unit.includes("℃") || unit.includes("摄氏度")) return "填协议值：18℃ → 180";
    if (/V/i.test(unit) && !/mV/i.test(unit)) return "填协议值：54V → 540";
    if (/A/i.test(unit)) return "填协议值：10A → 100";
    if (/h/i.test(unit)) return "填协议值：实际小时×10";
    return "填协议值：实际值×10";
  }
  if (unit.includes("%")) return "直接填百分比";
  if (unit === "mV" || unit === "mAh" || unit === "Wh" || unit === "KPa" || unit === "rpm") {
    return `直接填 ${unit} 数值`;
  }
  if (unit) return `按协议单位 ${unit} 填写`;
  return "";
}

export const BIN82_FORM_UNIT_TIP =
  "填写说明：输入为协议原始值，不是直观物理量。单位含 0.1 的字段需放大 10 倍（例：Li_Temperature 表示 18℃ 时填 180，不是 18）。";

/** 将 uint 值展开为已置位的 bit 下标列表 */
export function unpackBin82Bits(value: number | null | undefined, width = 16): number[] {
  const v = Number(value) || 0;
  const bits: number[] = [];
  for (let i = 0; i < width; i += 1) {
    if ((v >> i) & 1) bits.push(i);
  }
  return bits;
}

/** 将勾选的 bit 下标合并为 uint 值（多故障 = 各 bit 对应 2^n 之和） */
export function packBin82Bits(selected: number[]): number {
  return selected.reduce((acc, bit) => acc | (1 << bit), 0);
}

/** 表单默认值：数值为 0，字符串为空 */
export function bin82FieldDefault(
  _key: string,
  type: string,
  _ctx?: Bin82FormContext,
): string | number {
  if (isBin82StringField(type)) return "";
  return 0;
}

export function buildBin82FormData(
  fields: Bin82FieldSchema[],
  _ctx?: Bin82FormContext,
): Record<string, string | number> {
  const data: Record<string, string | number> = {};
  for (const field of fields) {
    data[field.key] = bin82FieldDefault(field.key, field.type);
  }
  return data;
}

export function packBin82SubmitData(
  protocolVer: number,
  fields: Bin82FieldSchema[],
  formData: Record<string, string | number | null | undefined>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = { protocolVer };
  for (const field of fields) {
    const raw = formData[field.key];
    if (raw === null || raw === undefined || raw === "") continue;
    if (isBin82StringField(field.type)) {
      payload[field.key] = String(raw);
    } else {
      payload[field.key] = Number(raw);
    }
  }
  return payload;
}

/** 将解析结果写入表单（仅更新当前协议可见字段） */
export function applyBin82ParsedData(
  fields: Bin82FieldSchema[],
  formData: Record<string, string | number | null>,
  parsed: Record<string, unknown>,
): void {
  for (const field of fields) {
    const raw = parsed[field.key];
    if (raw === undefined || raw === null) continue;
    if (isBin82StringField(field.type)) {
      formData[field.key] = String(raw);
    } else if (typeof raw === "number") {
      formData[field.key] = raw;
    } else if (typeof raw === "string" && raw !== "") {
      const num = Number(raw);
      formData[field.key] = Number.isNaN(num) ? raw : num;
    }
  }
}
