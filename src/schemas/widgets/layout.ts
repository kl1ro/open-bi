import { z } from "zod";

import { ABSOLUTE_CONFIG_SCHEMA } from "@/schemas/widgets/layouts/absolute";
import { FLEX_CONFIG_SCHEMA } from "@/schemas/widgets/layouts/flex";
import { GRID_CONFIG_SCHEMA } from "@/schemas/widgets/layouts/grid";

export const LAYOUT_CONFIG_SCHEMA = z.discriminatedUnion("layout", [
  GRID_CONFIG_SCHEMA,
  FLEX_CONFIG_SCHEMA,
  ABSOLUTE_CONFIG_SCHEMA,
]);
