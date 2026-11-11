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
  const deps = { widgetConfigs: dashboard.widgetConfigs };
  const oldWidgetConfig = findWidgetConfig(widgetConfig.id, deps);
  validateWidgetUpdate(oldWidgetConfig, widgetConfig);

  let updated = dashboard;

  if (hasMovedFromParent(oldWidgetConfig, widgetConfig))
    updated = getDashboardWithWidgetUnlinkedFromParent(updated, oldWidgetConfig);

  updated = getDashboardWithWidgetLinkedToParent(updated, widgetConfig, itemConfig);

  if (oldWidgetConfig && isTurningToSlot(oldWidgetConfig, widgetConfig))
    updated = getDashboardWithoutWidgetChildren(updated, oldWidgetConfig);

  const innerDeps = { dashboard: updated };

  if (!hasParentId(widgetConfig) && !isRootConfig(widgetConfig, innerDeps))
    updated = getDashboardWithNewRoot(updated, widgetConfig);
  else updated = getDashboardWithUpsertedWidget(updated, widgetConfig);

  updated = getDashboardWithoutWidgetRedundantSiblings(updated, widgetConfig);
  return updated;
}

export function getDashboardWithoutWidgetBranch(
  dashboard: DashboardConfig,
  widgetConfig: WidgetConfig,
): DashboardConfig {
  const unlinked = getDashboardWithWidgetUnlinkedFromParent(dashboard, widgetConfig);
  const withoutDescendants = getDashboardWithoutWidgetDescendants(unlinked, widgetConfig);
  return getDashboardWithRemovedWidget(withoutDescendants, widgetConfig);
}

function getDashboardWithWidgetUnlinkedFromParent(
  dashboard: DashboardConfig,
  child: WidgetConfig | undefined,
): DashboardConfig {
  if (!child || !hasParentId(child)) return dashboard;
  const deps = { widgetConfigs: dashboard.widgetConfigs };
  const parent = getParentConfig(child, deps);
  const updatedParent = getParentConfigWithDisownedChild(parent, child);
  return getDashboardWithUpsertedWidget(dashboard, updatedParent);
}

function getDashboardWithWidgetLinkedToParent(
  dashboard: DashboardConfig,
  child: WidgetConfig,
  itemConfig?: ItemConfig,
): DashboardConfig {
  if (!hasParentId(child)) return dashboard;
  const deps = { widgetConfigs: dashboard.widgetConfigs, itemConfig };
  const parent = getParentConfig(child, deps);
  const updatedParent = getParentConfigWithAdoptedChild(parent, child, deps);
  return getDashboardWithUpsertedWidget(dashboard, updatedParent);
}

function getDashboardWithoutWidgetChildren(
  dashboard: DashboardConfig,
  widgetConfig: WidgetConfig,
): DashboardConfig {
  const deps = { widgetConfigs: dashboard.widgetConfigs };
  const children = getChildConfigs(widgetConfig, deps);

  const withoutChildren = children.reduce(
    (prev, child) => getDashboardWithoutWidgetBranch(prev, child),
    dashboard,
  );

  return withoutChildren;
}

export function isRootConfig(widgetConfig: WidgetConfig, deps: IsRootConfigDeps) {
  const root = findRootConfig(deps);
  return widgetsHaveSameId(widgetConfig, root);
}

export interface IsRootConfigDeps {
  dashboard: DashboardConfig;
}

function getDashboardWithNewRoot(
  dashboard: DashboardConfig,
  widgetConfig: WidgetConfig,
): DashboardConfig {
  const deps = { widgetConfigs: dashboard.widgetConfigs };
  const descendants = getDescendantConfigs(widgetConfig, deps);
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

function getDashboardWithoutWidgetRedundantSiblings(
  dashboard: DashboardConfig,
  oneOfChildren: WidgetConfig,
): DashboardConfig {
  if (!hasParentId(oneOfChildren)) return dashboard;
  const deps = { widgetConfigs: dashboard.widgetConfigs };
  const parent = getParentConfig(oneOfChildren, deps);
  return getDashboardWithoutWidgetRedundantChildren(dashboard, parent);
}

function getDashboardWithoutWidgetDescendants(
  dashboard: DashboardConfig,
  widgetConfig: WidgetConfig,
): DashboardConfig {
  const deps = { widgetConfigs: dashboard.widgetConfigs };
  const descendants = Object.values(getDescendantConfigs(widgetConfig, deps));

  const withoutDescendants = descendants.reduce(
    (prev, descendant) => getDashboardWithRemovedWidget(prev, descendant),
    dashboard,
  );

  return withoutDescendants;
}

function getDashboardWithRemovedWidget(
  dashboard: DashboardConfig,
  widgetConfig: WidgetConfig,
): DashboardConfig {
  const deps = { dashboard };
  const rootId = isRootConfig(widgetConfig, deps) ? undefined : dashboard.rootId;
  const widgetConfigs = { ...dashboard.widgetConfigs };
  delete widgetConfigs[widgetConfig.id];
  return { widgetConfigs, rootId };
}

export function findRootConfig(deps: FindRootConfigDeps): WidgetConfig | undefined {
  if (!deps.dashboard.rootId) return;
  const innerDeps = { ...deps, widgetConfigs: deps.dashboard.widgetConfigs };
  return findWidgetConfig(deps.dashboard.rootId, innerDeps);
}

export interface FindRootConfigDeps {
  dashboard: DashboardConfig;
}

function getDashboardWithoutWidgetRedundantChildren(
  dashboard: DashboardConfig,
  parent: WidgetConfig,
): DashboardConfig {
  const deps = { widgetConfigs: dashboard.widgetConfigs };
  const children = getChildConfigs(parent, deps);
  const redundant = children.filter((child) => isRedundant(child, deps));

  const withoutRedundant = redundant.reduce(
    (prev, child) => getDashboardWithoutWidgetBranch(prev, child),
    dashboard,
  );

  return withoutRedundant;
}
