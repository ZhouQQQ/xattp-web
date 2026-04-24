import { describe, expect, it } from "vitest";
import {
  buildBatchPayload,
  parseCoordinatesText,
  parseImeisText,
  validateBatchForm,
  type BatchFormData,
} from "./xiaoan-ecu-mock-batch.service";

function createForm(overrides: Partial<BatchFormData> = {}): BatchFormData {
  return {
    env: "test2",
    server: "device-test2.xiaoantech.com:9880",
    tenant_id: "",
    business_type: null,
    voltage_min: 50,
    voltage_max: 54,
    lat: 30.500136,
    lng: 114.434888,
    radius_m: 10000,
    coord_mode: "scatter",
    mode: 1,
    create_mode: 1,
    serial_interval_ms: 10,
    num: 3,
    start_imei: "",
    imeis_text: "",
    coordinates_text: "",
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

  it("随机模式允许大于 10000 的创建数量", () => {
    const error = validateBatchForm(
      createForm({
        mode: 1,
        num: 10001,
      }),
    );

    expect(error).toBeNull();
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
      create_mode: 1,
      serial_interval_ms: 10,
      server: "mock.example.com",
      voltage_min: 50,
      voltage_max: 54,
      lat: 30.500136,
      lng: 114.434888,
      coord_mode: "scatter",
      radius_m: 10000,
      num: 2,
      imeis: ["861234567890123", "861234567890124"],
    });
  });

  it("指定经纬度模式会按数量补齐 coordinates", () => {
    const payload = buildBatchPayload(
      createForm({
        mode: 2,
        num: 3,
        start_imei: "861234567890123",
        coord_mode: "fixed",
        coordinates_text: "114.456,30.123\n114.457,30.124\n114.458,30.125",
      }),
    );

    expect(payload.coordinates).toEqual([
      { lat: 30.123, lng: 114.456 },
      { lat: 30.124, lng: 114.457 },
      { lat: 30.125, lng: 114.458 },
    ]);
    expect(payload.num).toBe(3);
    expect(payload.radius_m).toBe(0);
  });

  it("指定经纬度模式在数量与创建数不一致时仍可通过校验（原样提交 coordinates，由后端处理）", () => {
    const error = validateBatchForm(
      createForm({
        mode: 1,
        num: 2,
        coord_mode: "fixed",
        coordinates_text: "114.456,30.123",
      }),
    );
    expect(error).toBeNull();
  });

  it("指定经纬度数量与创建数不一致时仍原样提交 coordinates", () => {
    const payload = buildBatchPayload(
      createForm({
        mode: 1,
        num: 3,
        coord_mode: "fixed",
        coordinates_text: "114.0,30.0\n116.0,32.0",
        radius_m: 0,
      }),
    );
    expect(payload.coord_mode).toBe("fixed");
    expect(payload.radius_m).toBe(0);
    expect(payload.num).toBe(3);
    expect(payload.coordinates).toEqual([
      { lat: 30.0, lng: 114.0 },
      { lat: 32.0, lng: 116.0 },
    ]);
  });

  it("可以按每行经纬度解析 coordinates 文本", () => {
    const points = parseCoordinatesText("114.2,30.1");
    expect(points).toEqual([{ lat: 30.1, lng: 114.2 }]);
  });

  it("串行模式会写入 create_mode 与串行间隔", () => {
    const payload = buildBatchPayload(
      createForm({
        mode: 1,
        num: 2,
        create_mode: 2,
        serial_interval_ms: 25.9,
      }),
    );
    expect(payload.create_mode).toBe(2);
    expect(payload.serial_interval_ms).toBe(25);
  });
});