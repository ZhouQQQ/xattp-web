import { describe, expect, it } from "vitest";
import {
  buildBatchPayload,
  parseImeisText,
  validateBatchForm,
  type BatchFormData,
} from "./xiaoan-ecu-mock-batch.service";

function createForm(overrides: Partial<BatchFormData> = {}): BatchFormData {
  return {
    env: "test2",
    server: "device-test2.xiaoantech.com:9880",
    voltage_min: 50,
    voltage_max: 54,
    lat: 30.500136,
    lng: 114.434888,
    radius_m: 10000,
    mode: 1,
    num: 3,
    start_imei: "",
    imeis_text: "",
    ...overrides,
  };
}

describe("xiaoan-ecu-mock-batch.service", () => {
  it("可以解析多种分隔符的 imei 文本", () => {
    expect(parseImeisText("861, 862\n863；864 865")).toEqual([
      "861",
      "862",
      "863",
      "864",
      "865",
    ]);
  });

  it("会校验顺序模式的 start_imei", () => {
    const error = validateBatchForm(
      createForm({
        mode: 2,
        start_imei: "123",
        num: 2,
      }),
    );

    expect(error).toBe("顺序模式下 start_imei 必须是 15 位数字");
  });

  it("会校验指定模式中的非法 imei", () => {
    const error = validateBatchForm(
      createForm({
        mode: 3,
        imeis_text: "861234567890123\nabc",
      }),
    );

    expect(error).toBe("指定模式存在非法 imei: abc");
  });

  it("会限制随机模式创建数量上限", () => {
    const error = validateBatchForm(
      createForm({
        mode: 1,
        num: 10001,
      }),
    );

    expect(error).toBe("测试期间最大数量只支持 10000");
  });

  it("会限制电压上限", () => {
    const error = validateBatchForm(
      createForm({
        voltage_min: 50,
        voltage_max: 73,
      }),
    );

    expect(error).toBe("电压范围不能超过 72V");
  });

  it("会按指定模式构造 payload", () => {
    const payload = buildBatchPayload(
      createForm({
        mode: 3,
        server: " mock.example.com ",
        imeis_text: "861234567890123\n861234567890124",
      }),
    );

    expect(payload).toEqual({
      env: "test2",
      mode: 3,
      server: "mock.example.com",
      voltage_min: 50,
      voltage_max: 54,
      lat: 30.500136,
      lng: 114.434888,
      radius_m: 10000,
      imeis: ["861234567890123", "861234567890124"],
    });
  });
});