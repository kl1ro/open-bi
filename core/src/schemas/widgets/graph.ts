import { z } from "zod";

import { WIDGET_ID_SCHEMA } from "@/schemas/widget-id";

export const GRAPH_CONFIG_SCHEMA = z.object({
  id: WIDGET_ID_SCHEMA,
  parentId: WIDGET_ID_SCHEMA.optional(),
  type: z.literal("graph"),
  graph: z.literal("line"),
});
