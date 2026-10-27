import type { AbstractLayoutConfig } from "@/lib/widgets/layout";
import { getRecordWithoutKey } from "@/lib/utils";
import type WidgetConfig from "@/lib/widget";
import {
  getChildrenWithAdoptedChild,
  getChildrenWithDisownedChild,
  hasChild,
  InvalidItemConfigTypeError,
  NoItemConfigError,
  type ItemConfig,
} from "@/lib/widget";

export default interface AbsoluteConfig extends AbstractLayoutConfig {
  layout: "absolute";
  children?: WidgetConfig["id"][];
  arrangement?: Record<string, AbsoluteItemConfig>;
}

export function getAbsoluteConfigWithAdoptedChild(
  parent: AbsoluteConfig,
  child: WidgetConfig,
  itemConfig?: ItemConfig,
) {
  if (hasChild(parent, child) && !itemConfig) return parent;

  const absoluteItemConfig = ensureItemConfigParentTypeIsAbsolute(itemConfig);
  const children = getChildrenWithAdoptedChild(parent, child);

  const arrangement = getArrangementWithAdoptedChild(parent, child, absoluteItemConfig);

  return { ...parent, children, arrangement };
}

function ensureItemConfigParentTypeIsAbsolute(
  itemConfig?: ItemConfig,
): AbsoluteItemConfig {
  if (!itemConfig) throw new NoItemConfigError({ requiredType: "absolute" });

  if (itemConfig.parentType !== "absolute")
    throw new InvalidItemConfigTypeError({
      requiredType: "absolute",
      gotType: itemConfig.parentType,
    });

  return itemConfig;
}

function getArrangementWithAdoptedChild(
  parent: AbsoluteConfig,
  child: WidgetConfig,
  absoluteItemConfig: AbsoluteItemConfig,
) {
  return { ...parent.arrangement, [child.id]: absoluteItemConfig };
}

export function getAbsoluteConfigWithDisownedChild(
  parent: AbsoluteConfig,
  child: WidgetConfig,
) {
  const children = getChildrenWithDisownedChild(parent, child);
  const arrangement = getRecordWithoutKey(parent.arrangement, child.id);
  return { ...parent, children, arrangement };
}

export interface AbsoluteItemConfig {
  parentType: "absolute";
  position: AbsoluteItemPosition;
  size: AbsoluteItemSize;
}

export interface AbsoluteItemPosition {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export interface AbsoluteItemSize {
  width?: number;
  height?: number;
}
