import { z } from "zod";

import type DashboardConfig from "@/lib/dashboard";
import { MAP_VIEWS } from "@/lib/widgets/map";

const WIDGET_ID_SCHEMA = z.string();

const GRID_ITEM_CONFIG_SCHEMA = z.object({
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

const ABSOLUTE_ITEM_CONFIG_SCHEMA = z.object({
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

const GRID_CONFIG_SCHEMA = z.object({
  id: WIDGET_ID_SCHEMA,
  parentId: WIDGET_ID_SCHEMA.optional(),
  type: z.literal("layout"),
  layout: z.literal("grid"),
  rows: z.int().positive(),
  columns: z.int().positive(),
  children: z.array(WIDGET_ID_SCHEMA).optional(),
  arrangement: z.record(WIDGET_ID_SCHEMA, GRID_ITEM_CONFIG_SCHEMA).optional(),
});

const FLEX_CONFIG_SCHEMA = z.object({
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

const ABSOLUTE_CONFIG_SCHEMA = z.object({
  id: WIDGET_ID_SCHEMA,
  parentId: WIDGET_ID_SCHEMA.optional(),
  type: z.literal("layout"),
  layout: z.literal("absolute"),
  children: z.array(WIDGET_ID_SCHEMA).optional(),
  arrangement: z.record(WIDGET_ID_SCHEMA, ABSOLUTE_ITEM_CONFIG_SCHEMA).optional(),
});

const LAYOUT_CONFIG_SCHEMA = z.discriminatedUnion("layout", [
  GRID_CONFIG_SCHEMA,
  FLEX_CONFIG_SCHEMA,
  ABSOLUTE_CONFIG_SCHEMA,
]);

const TITLE_CONFIG_SCHEMA = z.object({
  id: WIDGET_ID_SCHEMA,
  parentId: WIDGET_ID_SCHEMA.optional(),
  type: z.literal("title"),
  text: z.string(),
});

const GRAPH_CONFIG_SCHEMA = z.object({
  id: WIDGET_ID_SCHEMA,
  parentId: WIDGET_ID_SCHEMA.optional(),
  type: z.literal("graph"),
  graph: z.literal("line"),
});

const MAP_CONFIG_SCHEMA = z.object({
  id: WIDGET_ID_SCHEMA,
  parentId: WIDGET_ID_SCHEMA.optional(),
  type: z.literal("map"),

  center: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),

  zoom: z.number(),
  view: z.enum(MAP_VIEWS),
});

const SLOT_CONFIG_SCHEMA = z.object({
  id: WIDGET_ID_SCHEMA,
  parentId: WIDGET_ID_SCHEMA,
  type: z.literal("slot"),
});

const WIDGET_CONFIG_SCHEMA = z.discriminatedUnion("type", [
  LAYOUT_CONFIG_SCHEMA,
  TITLE_CONFIG_SCHEMA,
  GRAPH_CONFIG_SCHEMA,
  MAP_CONFIG_SCHEMA,
  SLOT_CONFIG_SCHEMA,
]);

const DASHBOARD_CONFIG_SCHEMA = z.object({
  widgetConfigs: z.record(WIDGET_ID_SCHEMA, WIDGET_CONFIG_SCHEMA),
  rootId: WIDGET_ID_SCHEMA.optional(),
}) satisfies z.ZodType<DashboardConfig>;

export default DASHBOARD_CONFIG_SCHEMA;
