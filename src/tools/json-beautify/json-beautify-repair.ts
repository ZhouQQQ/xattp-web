import JSON5 from "json5";

export interface JsonRepairHint {
  code: string;
  message: string;
}

export interface JsonRepairResult {
  repaired: string | null;
  hints: JsonRepairHint[];
  error: string | null;
}

type RepairStep = {
  code: string;
  message: string;
  apply: (text: string) => string;
};

function tryParseJson5(text: string): unknown | null {
  try {
    return JSON5.parse(text);
  } catch {
    return null;
  }
}

function pushHint(hints: JsonRepairHint[], code: string, message: string) {
  if (!hints.some((h) => h.code === code)) {
    hints.push({ code, message });
  }
}

/** 仅在字符串外的代码段上执行替换 */
function replaceOutsideStrings(
  source: string,
  replacer: (segment: string) => string
): string {
  let out = "";
  let i = 0;

  while (i < source.length) {
    const ch = source[i];

    if (ch === '"' || ch === "'") {
      const quote = ch;
      let j = i + 1;
      let escaped = false;
      while (j < source.length) {
        const c = source[j];
        if (escaped) {
          escaped = false;
          j++;
          continue;
        }
        if (c === "\\") {
          escaped = true;
          j++;
          continue;
        }
        if (c === quote) {
          j++;
          break;
        }
        j++;
      }
      out += source.slice(i, j);
      i = j;
      continue;
    }

    if (ch === "/" && source[i + 1] === "/") {
      let j = i + 2;
      while (j < source.length && source[j] !== "\n") j++;
      out += replacer(source.slice(i, j));
      i = j;
      continue;
    }

    if (ch === "/" && source[i + 1] === "*") {
      const end = source.indexOf("*/", i + 2);
      const j = end === -1 ? source.length : end + 2;
      out += replacer(source.slice(i, j));
      i = j;
      continue;
    }

    let j = i;
    while (j < source.length) {
      const c = source[j];
      if (c === '"' || c === "'") break;
      if (c === "/" && source[j + 1] === "/") break;
      if (c === "/" && source[j + 1] === "*") break;
      j++;
    }
    out += replacer(source.slice(i, j));
    i = j;
  }

  return out;
}

function removeComments(text: string): string {
  return replaceOutsideStrings(text, (segment) => {
    if (segment.startsWith("//") || segment.startsWith("/*")) {
      return segment.includes("\n") ? "\n" : " ";
    }
    return segment;
  });
}

function normalizeBooleanNullCase(text: string): string {
  return replaceOutsideStrings(text, (segment) =>
    segment
      .replace(/\bTRUE\b/g, "true")
      .replace(/\bFALSE\b/g, "false")
      .replace(/\bNULL\b/g, "null")
  );
}

function removeTrailingCommas(text: string): string {
  return replaceOutsideStrings(text, (segment) =>
    segment.replace(/,(\s*[}\]])/g, "$1")
  );
}

/** 中文逗号、连续逗号（如 ,， / ,,）统一为单个英文逗号 */
function normalizeCommas(text: string): string {
  return replaceOutsideStrings(text, (segment) =>
    segment.replace(/[,，](\s*[,，])+/g, ",")
  );
}

function quoteUnquotedKeys(text: string): string {
  return replaceOutsideStrings(text, (segment) =>
    segment.replace(
      /([{,]\s*)([A-Za-z_$][\w$.-]*)(\s*:)/g,
      '$1"$2"$3'
    )
  );
}

function convertSingleQuotedStrings(text: string): string {
  return replaceOutsideStrings(text, (segment) =>
    segment.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (_, inner: string) => {
      const escaped = inner.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      return `"${escaped}"`;
    })
  );
}

/** 根据 object/array 上下文补全缺失的 : 或 , */
function insertMissingSeparators(text: string): string {
  const result: string[] = [];
  const stack: Array<"object" | "array"> = [];
  let i = 0;
  let inString = false;
  let quote: '"' | "'" | null = null;
  let escaped = false;
  let objectExpectColon = false;
  let afterValue = false;

  const isValueStart = (ch: string) =>
    ch === '"' ||
    ch === "'" ||
    ch === "{" ||
    ch === "[" ||
    /[0-9-]/.test(ch) ||
    text.startsWith("true", i) ||
    text.startsWith("false", i) ||
    text.startsWith("null", i);

  while (i < text.length) {
    const ch = text[i];

    if (inString) {
      result.push(ch);
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === quote) {
        inString = false;
        quote = null;
        const ctx = stack[stack.length - 1];
        if (ctx === "object" && !objectExpectColon && !afterValue) {
          objectExpectColon = true;
        } else if (ctx) {
          afterValue = true;
        }
      }
      i++;
      continue;
    }

    if (/\s/.test(ch)) {
      result.push(ch);
      i++;
      continue;
    }

    if (ch === "{") {
      stack.push("object");
      objectExpectColon = false;
      afterValue = false;
      result.push(ch);
      i++;
      continue;
    }

    if (ch === "[") {
      stack.push("array");
      objectExpectColon = false;
      afterValue = false;
      result.push(ch);
      i++;
      continue;
    }

    if (ch === "}") {
      stack.pop();
      objectExpectColon = false;
      afterValue = false;
      result.push(ch);
      i++;
      continue;
    }

    if (ch === "]") {
      stack.pop();
      objectExpectColon = false;
      afterValue = false;
      result.push(ch);
      i++;
      continue;
    }

    const ctx = stack[stack.length - 1];

    if (objectExpectColon && ctx === "object" && isValueStart(ch)) {
      result.push(": ");
      objectExpectColon = false;
      afterValue = false;
      continue;
    }

    if (afterValue && ctx && isValueStart(ch)) {
      result.push(", ");
      afterValue = false;
      objectExpectColon = false;
      continue;
    }

    if (ch === ":") {
      objectExpectColon = false;
      afterValue = false;
      result.push(ch);
      i++;
      continue;
    }

    if (ch === ",") {
      objectExpectColon = false;
      afterValue = false;
      result.push(ch);
      i++;
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = true;
      quote = ch;
      result.push(ch);
      i++;
      continue;
    }

    if (/[0-9-]/.test(ch)) {
      let j = i + 1;
      while (j < text.length && /[0-9.eE+\-]/.test(text[j])) j++;
      result.push(text.slice(i, j));
      i = j;
      afterValue = true;
      objectExpectColon = false;
      continue;
    }

    if (text.startsWith("true", i)) {
      result.push("true");
      i += 4;
      afterValue = true;
      objectExpectColon = false;
      continue;
    }
    if (text.startsWith("false", i)) {
      result.push("false");
      i += 5;
      afterValue = true;
      objectExpectColon = false;
      continue;
    }
    if (text.startsWith("null", i)) {
      result.push("null");
      i += 4;
      afterValue = true;
      objectExpectColon = false;
      continue;
    }

    result.push(ch);
    i++;
  }

  return result.join("");
}

function fillMissingValues(text: string): string {
  let result = "";
  let i = 0;
  let inString = false;
  let quote: '"' | "'" | null = null;
  let escaped = false;

  while (i < text.length) {
    const ch = text[i];

    if (inString) {
      result += ch;
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === quote) {
        inString = false;
        quote = null;
      }
      i++;
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = true;
      quote = ch;
      result += ch;
      i++;
      continue;
    }

    if (ch === ":") {
      let j = i + 1;
      while (j < text.length && /\s/.test(text[j])) j++;
      const next = text[j];
      if (next === "," || next === "}" || next === "]") {
        result += ": null";
        i++;
        continue;
      }
    }

    result += ch;
    i++;
  }

  return result;
}

function fixUnclosedQuotes(text: string): string {
  let inString = false;
  let quote: '"' | "'" | null = null;
  let escaped = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        continue;
      }
      if (ch === quote) {
        inString = false;
        quote = null;
      }
      continue;
    }
    if (ch === '"' || ch === "'") {
      inString = true;
      quote = ch;
    }
  }

  if (inString) {
    return text + (quote ?? '"');
  }
  return text;
}

function fixLeadingZerosInNumbers(text: string): string {
  return replaceOutsideStrings(text, (segment) =>
    segment.replace(/:(\s*)0+([1-9]\d*)(?![\d.eE])/g, ":$1$2").replace(/([\[,]\s*)0+([1-9]\d*)(?![\d.eE])/g, "$1$2")
  );
}

function removeInvalidNumberTokens(text: string): string {
  return replaceOutsideStrings(text, (segment) =>
    segment.replace(
      /:\s*(NaN|Infinity|-Infinity|undefined)\b/gi,
      ": null"
    )
  );
}

function balanceBrackets(text: string): string {
  const stack: Array<"{" | "["> = [];
  let inString = false;
  let quote: '"' | "'" | null = null;
  let escaped = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        continue;
      }
      if (ch === quote) {
        inString = false;
        quote = null;
      }
      continue;
    }
    if (ch === '"' || ch === "'") {
      inString = true;
      quote = ch;
      continue;
    }
    if (ch === "{") stack.push("{");
    else if (ch === "[") stack.push("[");
    else if (ch === "}") {
      if (stack.length && stack[stack.length - 1] === "{") stack.pop();
    } else if (ch === "]") {
      if (stack.length && stack[stack.length - 1] === "[") stack.pop();
    }
  }

  if (!stack.length) return text;

  let suffix = "";
  for (let i = stack.length - 1; i >= 0; i--) {
    suffix += stack[i] === "{" ? "}" : "]";
  }
  return text + suffix;
}

const REPAIR_STEPS: RepairStep[] = [
  { code: "comments", message: "已移除 // 与 /* */ 注释", apply: removeComments },
  {
    code: "boolean-null-case",
    message: "已将 TRUE/FALSE/NULL 转为小写",
    apply: normalizeBooleanNullCase,
  },
  {
    code: "normalize-commas",
    message: "已修正中文逗号或连续重复逗号",
    apply: normalizeCommas,
  },
  {
    code: "trailing-comma",
    message: "已移除对象/数组末尾多余逗号",
    apply: removeTrailingCommas,
  },
  {
    code: "unquoted-keys",
    message: "已为未加引号的键名补上双引号",
    apply: quoteUnquotedKeys,
  },
  {
    code: "single-quotes",
    message: "已将单引号字符串转为双引号",
    apply: convertSingleQuotedStrings,
  },
  {
    code: "missing-separator",
    message: "已补全缺失的冒号或逗号",
    apply: insertMissingSeparators,
  },
  {
    code: "missing-value",
    message: "已为缺失的 value 填充 null",
    apply: fillMissingValues,
  },
  {
    code: "unclosed-quote",
    message: "已尝试闭合未结束的字符串引号",
    apply: fixUnclosedQuotes,
  },
  {
    code: "leading-zero",
    message: "已修正整数前导零等非法数字写法",
    apply: fixLeadingZerosInNumbers,
  },
  {
    code: "invalid-number",
    message: "已将 NaN/Infinity 等非标准数值替换为 null",
    apply: removeInvalidNumberTokens,
  },
  {
    code: "brackets",
    message: "已补全缺失的 } 或 ] 闭合符号",
    apply: balanceBrackets,
  },
];

function runRepairSteps(text: string, hints: JsonRepairHint[]): string {
  let current = text;
  for (const step of REPAIR_STEPS) {
    const next = step.apply(current);
    if (next !== current) {
      pushHint(hints, step.code, step.message);
      current = next;
    }
  }
  return current;
}

/** 智能修复常见非标准 JSON，输出标准格式化 JSON */
export function repairJsonText(raw: string, indentSize = 2): JsonRepairResult {
  const hints: JsonRepairHint[] = [];
  const input = raw.trim();

  if (!input) {
    return { repaired: null, hints, error: "请输入 JSON 内容" };
  }

  const alreadyParsed = tryParseJson5(input);
  if (alreadyParsed !== null) {
    const formatted = JSON.stringify(alreadyParsed, null, indentSize);
    if (formatted !== input) {
      pushHint(hints, "normalize", "JSON 格式正确，已标准化为规范格式");
    }
    return { repaired: formatted, hints, error: null };
  }

  let working = input;
  working = runRepairSteps(working, hints);

  let parsed = tryParseJson5(working);
  if (parsed === null) {
    working = balanceBrackets(working);
    if (working !== input) {
      pushHint(hints, "brackets-retry", "已再次尝试补全括号");
    }
    parsed = tryParseJson5(working);
  }

  if (parsed === null) {
    return {
      repaired: null,
      hints,
      error: "无法自动修复，请检查 JSON 结构是否严重损坏",
    };
  }

  return {
    repaired: JSON.stringify(parsed, null, indentSize),
    hints,
    error: null,
  };
}
