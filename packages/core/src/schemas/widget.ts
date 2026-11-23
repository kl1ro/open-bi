import { z } from "zod";

import { GRAPH_CONFIG_SCHEMA } from "@/schemas/widgets/graph";
import { LAYOUT_CONFIG_SCHEMA } from "@/schemas/widgets/layout";
import { MAP_CONFIG_SCHEMA } from "@/schemas/widgets/map";
import { SLOT_CONFIG_SCHEMA } from "@/schemas/widgets/slot";
import { TITLE_CONFIG_SCHEMA } from "@/schemas/widgets/title";

export const WIDGET_CONFIG_SCHEMA = z.discriminatedUnion("type", [
  LAYOUT_CONFIG_SCHEMA,
  TITLE_CONFIG_SCHEMA,
  GRAPH_CONFIG_SCHEMA,
  MAP_CONFIG_SCHEMA,
  SLOT_CONFIG_SCHEMA,
]);
