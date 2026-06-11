import { CalendarTime } from "@vicons/tabler";
import { defineTool } from "../tool";

export const tool = defineTool({
  name: "灰度计划制定",
  path: "/tenant-gray-plan",
  description: "进行共享租户加灰计划的管理",
  keywords: ["tenant", "gray", "plan", "灰度", "租户"],
  component: () => import("./tenant-gray-plan.vue"),
  icon: CalendarTime,
  createdAt: new Date("2026-05-14"),
});
