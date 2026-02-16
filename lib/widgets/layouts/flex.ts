import { AbstractLayout } from "../layout";

import Widget from "@/lib/widget";

export default interface Flex extends AbstractLayout {
  layout: "flex";
  direction: FlexDirection;
  children?: Widget[];
  gap?: number;
}

export type FlexDirection = "row" | "column";
