import { z } from "zod";

import { WIDGET_ID_SCHEMA } from "@/schemas/widget-id";
import { MAP_VIEWS } from "@/widgets/map";

export const MAP_CONFIG_SCHEMA = z.object({
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
