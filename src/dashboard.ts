import type WidgetConfig from "@/widget";
import {
  findWidgetConfig,
  getChildConfigs,
  getDescendantConfigs,
  getParentConfig,
  getParentConfigWithAdoptedChild,
  getParentConfigWithDisownedChild,
  hasMovedFromParent,
  hasParentId,
  isRedundant,
  isTurningToSlot,
  validateWidgetUpdate,
  widgetsHaveSameId,
  type ItemConfig,
  type WidgetConfigsById,
} from "@/widget";

export default interface DashboardConfig {
  widgetConfigs: WidgetConfigsById;
  rootId?: WidgetConfig["id"];
}

export function getDashboardWithAppliedWidget(
  dashboard: DashboardConfig,
  widgetConfig: WidgetConfig,
  itemConfig?: ItemConfig,
): DashboardConfig {
  const oldWidgetConfig = findWidgetConfig(widgetConfig.id, dashboard);
  validateWidgetUpdate(oldWidgetConfig, widgetConfig);

  let updated = dashboard;

  if (hasMovedFromParent(oldWidgetConfig, widgetConfig))
    updated = getDashboardWithUnlinkedWidget(updated, oldWidgetConfig);

  updated = getDashboardWithLinkedWidget(updated, widgetConfig, itemConfig);

  if (oldWidgetConfig && isTurningToSlot(oldWidgetConfig, widgetConfig))
    updated = getDashboardWithoutChildren(updated, oldWidgetConfig);

  if (!hasParentId(widgetConfig) && !isRootConfig(widgetConfig, updated))
    updated = getDashboardWithNewRoot(updated, widgetConfig);
  else updated = getDashboardWithUpsertedWidget(updated, widgetConfig);

  updated = getDashboardWithoutRedundantSiblings(updated, widgetConfig);
  return updated;
}

export function getDashboardWithRemovedWidget(
  dashboard: DashboardConfig,
  id: WidgetConfig["id"],
): DashboardConfig {
  const widgetConfig = findWidgetConfig(id, dashboard);
  if (!widgetConfig) return dashboard;
  return getDashboardWithoutBranch(dashboard, widgetConfig);
}

function getDashboardWithUnlinkedWidget(
  dashboard: DashboardConfig,
  child: WidgetConfig | undefined,
): DashboardConfig {
  if (!child || !hasParentId(child)) return dashboard;
  const parent = getParentConfig(child, dashboard);
  const updatedParent = getParentConfigWithDisownedChild(parent, child);
  return getDashboardWithUpsertedWidget(dashboard, updatedParent);
}

function getDashboardWithLinkedWidget(
  dashboard: DashboardConfig,
  child: WidgetConfig,
  itemConfig?: ItemConfig,
): DashboardConfig {
  if (!hasParentId(child)) return dashboard;
  const parent = getParentConfig(child, dashboard);
  const deps = { itemConfig };
  const updatedParent = getParentConfigWithAdoptedChild(parent, child, deps);
  return getDashboardWithUpsertedWidget(dashboard, updatedParent);
}

function getDashboardWithoutChildren(
  dashboard: DashboardConfig,
  widgetConfig: WidgetConfig,
): DashboardConfig {
  const children = getChildConfigs(widgetConfig, dashboard);

  const withoutChildren = children.reduce(
    (prev, child) => getDashboardWithoutBranch(prev, child),
    dashboard,
  );

  return withoutChildren;
}

export function isRootConfig(widgetConfig: WidgetConfig, deps: IsRootConfigDeps) {
  const root = findRootConfig(deps);
  return widgetsHaveSameId(widgetConfig, root);
}

export interface IsRootConfigDeps {
  widgetConfigs: WidgetConfigsById;
  rootId?: WidgetConfig["id"];
}

function getDashboardWithNewRoot(
  dashboard: DashboardConfig,
  widgetConfig: WidgetConfig,
): DashboardConfig {
  const descendants = getDescendantConfigs(widgetConfig, dashboard);
  const widgetConfigs = { ...descendants, [widgetConfig.id]: { ...widgetConfig } };
  return { widgetConfigs, rootId: widgetConfig.id };
}

function getDashboardWithUpsertedWidget(
  dashboard: DashboardConfig,
  widgetConfig: WidgetConfig,
): DashboardConfig {
  const widgetConfigs = {
    ...dashboard.widgetConfigs,
    [widgetConfig.id]: { ...widgetConfig },
  };

  return { ...dashboard, widgetConfigs };
}

function getDashboardWithoutRedundantSiblings(
  dashboard: DashboardConfig,
  oneOfChildren: WidgetConfig,
): DashboardConfig {
  if (!hasParentId(oneOfChildren)) return dashboard;
  const parent = getParentConfig(oneOfChildren, dashboard);
  return getDashboardWithoutRedundantChildren(dashboard, parent);
}

function getDashboardWithoutBranch(
  dashboard: DashboardConfig,
  widgetConfig: WidgetConfig,
): DashboardConfig {
  const unlinked = getDashboardWithUnlinkedWidget(dashboard, widgetConfig);
  const withoutDescendants = getDashboardWithoutDescendants(unlinked, widgetConfig);
  return getDashboardWithoutWidget(withoutDescendants, widgetConfig);
}

export function findRootConfig(deps: FindRootConfigDeps): WidgetConfig | undefined {
  if (!deps.rootId) return;
  return findWidgetConfig(deps.rootId, deps);
}

export interface FindRootConfigDeps {
  widgetConfigs: WidgetConfigsById;
  rootId?: WidgetConfig["id"];
}

function getDashboardWithoutRedundantChildren(
  dashboard: DashboardConfig,
  parent: WidgetConfig,
): DashboardConfig {
  const children = getChildConfigs(parent, dashboard);
  const redundant = children.filter((child) => isRedundant(child, dashboard));

  const withoutRedundant = redundant.reduce(
    (prev, child) => getDashboardWithoutBranch(prev, child),
    dashboard,
  );

  return withoutRedundant;
}

function getDashboardWithoutDescendants(
  dashboard: DashboardConfig,
  widgetConfig: WidgetConfig,
): DashboardConfig {
  const descendants = Object.values(getDescendantConfigs(widgetConfig, dashboard));

  const withoutDescendants = descendants.reduce(
    (prev, descendant) => getDashboardWithoutWidget(prev, descendant),
    dashboard,
  );

  return withoutDescendants;
}

function getDashboardWithoutWidget(
  dashboard: DashboardConfig,
  widgetConfig: WidgetConfig,
): DashboardConfig {
  const rootId = isRootConfig(widgetConfig, dashboard) ? undefined : dashboard.rootId;
  const widgetConfigs = { ...dashboard.widgetConfigs };
  delete widgetConfigs[widgetConfig.id];
  return { widgetConfigs, rootId };
}
