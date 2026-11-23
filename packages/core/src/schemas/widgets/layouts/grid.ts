import { z } from "zod";

import { WIDGET_ID_SCHEMA } from "@/schemas/widget-id";

export const GRID_ITEM_CONFIG_SCHEMA = z.object({
  parentType: z.literal("grid"),

  position: z.object({
    row: z.int().positive(),
    column: z.int().positive(),
  }),

  size: z.object({
    rowSpan: z.int().nonnegative(),
    colSpan: z.int().nonnegative(),
  }),
});

export const GRID_CONFIG_SCHEMA = z.object({
  id: WIDGET_ID_SCHEMA,
  parentId: WIDGET_ID_SCHEMA.optional(),
  type: z.literal("layout"),
  layout: z.literal("grid"),
  rows: z.int().positive(),
  columns: z.int().positive(),
  children: z.array(WIDGET_ID_SCHEMA).optional(),
  arrangement: z.record(WIDGET_ID_SCHEMA, GRID_ITEM_CONFIG_SCHEMA).optional(),
});
