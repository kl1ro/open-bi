import type { AbstractLayoutConfig } from "@/lib/widgets/layout";
import type WidgetConfig from "@/lib/widget";
import { getChildrenWithAdoptedChild, getChildrenWithDisownedChild } from "@/lib/widget";

export default interface FlexConfig extends AbstractLayoutConfig {
  layout: "flex";
  direction: FlexDirection;
  justify?: FlexJustify;
  alignItems?: FlexAlignItems;
  gap?: number;
  children?: WidgetConfig["id"][];
}

export function getFlexConfigWithAdoptedChild(parent: FlexConfig, child: WidgetConfig) {
  const children = getChildrenWithAdoptedChild(parent, child);
  return { ...parent, children };
}

export function getFlexConfigWithDisownedChild(parent: FlexConfig, child: WidgetConfig) {
  const children = getChildrenWithDisownedChild(parent, child);
  return { ...parent, children };
}

export function isFlexChildRedundant(parent: FlexConfig, child: WidgetConfig) {
  return false;
}

export type FlexDirection = "row" | "column";

export type FlexJustify = "start" | "end" | "center" | "between" | "around" | "evenly";

export type FlexAlignItems = "stretch" | "start" | "end" | "center" | "baseline";
