import { LayoutGridAdd } from "@vicons/tabler";
import { defineTool } from "../tool";

export const tool = defineTool({
  name: "批量中控模拟",
  path: "/xiaoan-ecu-mock-batch",
  description: "批量创建并启动小安共享协议中控，支持随机、顺序、指定 IMEI 三种模式。",
  tag: "内测",
  notice: "内测中，可能会出现连接中断/不存在/数据异常等问题，不保证长期在线可用",
  keywords: ["xiaoan", "ecu", "mock", "batch", "imei"],
  component: () => import("./xiaoan-ecu-mock-batch.vue"),
  icon: LayoutGridAdd,
  createdAt: new Date("2026-04-16"),
});