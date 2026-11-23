import { z } from "zod";

import { WIDGET_ID_SCHEMA } from "@/schemas/widget-id";

export const ABSOLUTE_ITEM_CONFIG_SCHEMA = z.object({
  parentType: z.literal("absolute"),

  position: z.object({
    top: z.number().optional(),
    right: z.number().optional(),
    bottom: z.number().optional(),
    left: z.number().optional(),
  }),

  size: z.object({
    width: z.number().optional(),
    height: z.number().optional(),
  }),
});

export const ABSOLUTE_CONFIG_SCHEMA = z.object({
  id: WIDGET_ID_SCHEMA,
  parentId: WIDGET_ID_SCHEMA.optional(),
  type: z.literal("layout"),
  layout: z.literal("absolute"),
  children: z.array(WIDGET_ID_SCHEMA).optional(),
  arrangement: z.record(WIDGET_ID_SCHEMA, ABSOLUTE_ITEM_CONFIG_SCHEMA).optional(),
});
