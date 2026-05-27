import JSON5 from "json5";

export class JsonBeautifyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JsonBeautifyError";
  }
}

function parseJsonText(raw: string): unknown {
  const text = raw.trim();
  if (!text) {
    throw new JsonBeautifyError("请输入 JSON 内容");
  }
  try {
    return JSON5.parse(text);
  } catch {
    throw new JsonBeautifyError("JSON 格式无效");
  }
}

/** 格式化 JSON，支持 JSON5 语法 */
export function formatJsonText(raw: string, indentSize = 2): string {
  const parsed = parseJsonText(raw);
  return JSON.stringify(parsed, null, indentSize);
}

/** 压缩 JSON 为单行 */
export function minifyJsonText(raw: string): string {
  const parsed = parseJsonText(raw);
  return JSON.stringify(parsed);
}

/** 将文本转义为 JSON 字符串字面量 */
export function escapeJsonText(raw: string): string {
  if (!raw) {
    throw new JsonBeautifyError("请输入 JSON 内容");
  }
  return JSON.stringify(raw);
}

/** 去除 JSON 字符串转义，还原为原始文本 */
export function unescapeJsonText(raw: string): string {
  const text = raw.trim();
  if (!text) {
    throw new JsonBeautifyError("请输入 JSON 内容");
  }

  try {
    const parsed = JSON.parse(text);
    if (typeof parsed === "string") {
      return parsed;
    }
    return JSON.stringify(parsed, null, 2);
  } catch {
    // 非标准 JSON 字符串，尝试按转义字符还原
  }

  const slashUnescaped = text
    .replace(/\\\\/g, "\u0000")
    .replace(/\\"/g, '"')
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\r/g, "\r")
    .replace(/\u0000/g, "\\");

  try {
    JSON5.parse(slashUnescaped);
    return slashUnescaped;
  } catch {
    throw new JsonBeautifyError("无法去除转义，请检查输入");
  }
}

export function isValidJsonText(raw: string): boolean {
  if (!raw.trim()) return true;
  try {
    JSON5.parse(raw);
    return true;
  } catch {
    return false;
  }
}

/** 尝试解析 JSON，失败返回 null */
export function tryParseJsonText(raw: string): unknown | null {
  const text = raw.trim();
  if (!text) return null;
  try {
    return JSON5.parse(text);
  } catch {
    return null;
  }
}

/** 尝试格式化 JSON，失败返回 null */
export function tryFormatJsonText(raw: string, indentSize = 2): string | null {
  const text = raw.trim();
  if (!text) return "";
  try {
    return formatJsonText(raw, indentSize);
  } catch {
    return null;
  }
}

export type PrettyJsonSourceKind = "json" | "string" | "invalid";

/** 解析右侧展示用的 JSON 源：转义后的字符串会尝试还原内部 JSON */
export function resolvePrettyJsonSource(raw: string): {
  source: string | null;
  kind: PrettyJsonSourceKind;
} {
  const text = raw.trim();
  if (!text) return { source: "", kind: "json" };

  const parsed = tryParseJsonText(raw);
  if (parsed === null) return { source: null, kind: "invalid" };

  if (typeof parsed === "string") {
    const inner = parsed.trim();
    if (!inner) return { source: "", kind: "string" };
    if (tryParseJsonText(inner) !== null) {
      return { source: inner, kind: "json" };
    }
    return { source: null, kind: "string" };
  }

  return { source: raw, kind: "json" };
}

function isExpandable(value: unknown): value is Record<string, unknown> | unknown[] {
  return value !== null && typeof value === "object";
}

function formatPrimitive(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  return String(value);
}

export interface JsonFieldNode {
  key: string;
  name: string;
  type: "object" | "array" | "primitive";
  preview?: string;
  collapsedPreview?: string;
  children?: JsonFieldNode[];
}

function buildFieldNode(value: unknown, name: string, path: string): JsonFieldNode {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return { key: path, name, type: "array", preview: "[]" };
    }
    return {
      key: path,
      name,
      type: "array",
      collapsedPreview: `[${value.length}]`,
      children: value.map((item, index) =>
        buildFieldNode(item, `[${index}]`, `${path}[${index}]`)
      ),
    };
  }

  if (isExpandable(value)) {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      return { key: path, name, type: "object", preview: "{}" };
    }
    return {
      key: path,
      name,
      type: "object",
      collapsedPreview: `{${entries.length}}`,
      children: entries.map(([entryKey, entryValue]) =>
        buildFieldNode(entryValue, entryKey, `${path}.${entryKey}`)
      ),
    };
  }

  return {
    key: path,
    name,
    type: "primitive",
    preview: formatPrimitive(value),
  };
}

/** 将 JSON 转为可按字段折叠的节点（顶层即各字段） */
export function buildJsonFieldNodes(raw: string): JsonFieldNode[] | null {
  const parsed = tryParseJsonText(raw);
  if (parsed === null) return null;
  if (!raw.trim()) return [];

  if (Array.isArray(parsed)) {
    return parsed.map((item, index) =>
      buildFieldNode(item, `[${index}]`, `[${index}]`)
    );
  }

  if (isExpandable(parsed)) {
    return Object.entries(parsed).map(([entryKey, entryValue]) =>
      buildFieldNode(entryValue, entryKey, entryKey)
    );
  }

  return [buildFieldNode(parsed, "value", "value")];
}

/** 收集所有可折叠节点 key */
export function collectJsonFieldKeys(nodes: JsonFieldNode[]): string[] {
  const keys: string[] = [];
  const walk = (items: JsonFieldNode[]) => {
    for (const item of items) {
      if (item.children?.length) {
        keys.push(item.key);
        walk(item.children);
      }
    }
  };
  walk(nodes);
  return keys;
}

/** 收集顶层可折叠节点 key，默认展开第一层字段 */
export function collectTopLevelFieldKeys(nodes: JsonFieldNode[]): string[] {
  return nodes.filter((node) => node.children?.length).map((node) => node.key);
}

export { repairJsonText } from "./json-beautify-repair";
export type { JsonRepairHint, JsonRepairResult } from "./json-beautify-repair";
