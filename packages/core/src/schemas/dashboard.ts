import { z } from "zod";

import type DashboardConfig from "@/dashboard";
import { WIDGET_ID_SCHEMA } from "@/schemas/widget-id";
import { WIDGET_CONFIG_SCHEMA } from "@/schemas/widget";

export const DASHBOARD_CONFIG_SCHEMA = z.object({
  widgetConfigs: z.record(WIDGET_ID_SCHEMA, WIDGET_CONFIG_SCHEMA),
  rootId: WIDGET_ID_SCHEMA.optional(),
}) satisfies z.ZodType<DashboardConfig>;
