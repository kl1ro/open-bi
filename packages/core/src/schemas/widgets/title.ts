import { z } from "zod";

import { WIDGET_ID_SCHEMA } from "@/schemas/widget-id";

export const TITLE_CONFIG_SCHEMA = z.object({
  id: WIDGET_ID_SCHEMA,
  parentId: WIDGET_ID_SCHEMA.optional(),
  type: z.literal("title"),
  text: z.string(),
});
