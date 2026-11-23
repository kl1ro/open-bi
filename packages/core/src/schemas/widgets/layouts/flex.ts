import { z } from "zod";

import { WIDGET_ID_SCHEMA } from "@/schemas/widget-id";

export const FLEX_CONFIG_SCHEMA = z.object({
  id: WIDGET_ID_SCHEMA,
  parentId: WIDGET_ID_SCHEMA.optional(),
  type: z.literal("layout"),
  layout: z.literal("flex"),
  direction: z.enum(["row", "column"]),
  justify: z.enum(["start", "end", "center", "between", "around", "evenly"]).optional(),
  alignItems: z.enum(["stretch", "start", "end", "center", "baseline"]).optional(),
  gap: z.number().optional(),
  children: z.array(WIDGET_ID_SCHEMA).optional(),
});
