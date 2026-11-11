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
  deps: GetDashboardWithAppliedWidgetDeps,
): DashboardConfig {
  const oldWidgetConfig = findWidgetConfig(widgetConfig.id, dashboard);
  validateWidgetUpdate(oldWidgetConfig, widgetConfig);

  let updated = dashboard;

  if (hasMovedFromParent(oldWidgetConfig, widgetConfig))
    updated = unlinkWidgetFromParent(updated, oldWidgetConfig);

  updated = linkWidgetToParent(updated, widgetConfig, deps);

  if (oldWidgetConfig && isTurningToSlot(oldWidgetConfig, widgetConfig))
    updated = removeWidgetDescendants(updated, oldWidgetConfig);

  updated = placeWidget(updated, widgetConfig);
  updated = removeRedundantChildrenInParentOf(updated, widgetConfig);
  return updated;
}

export interface GetDashboardWithAppliedWidgetDeps {
  itemConfig?: ItemConfig;
}

export function getDashboardWithRemovedWidget(
  dashboard: DashboardConfig,
  id: WidgetConfig["id"],
): DashboardConfig {
  const widgetConfig = findWidgetConfig(id, dashboard);
  if (!widgetConfig) return dashboard;
  return removeWidgetWithDescendants(dashboard, widgetConfig);
}

function unlinkWidgetFromParent(
  dashboard: DashboardConfig,
  child: WidgetConfig | undefined,
): DashboardConfig {
  if (!child || !hasParentId(child)) return dashboard;
  const parent = getParentConfig(child, dashboard);
  const updatedParent = getParentConfigWithDisownedChild(parent, child);
  return placeWidget(dashboard, updatedParent);
}

function linkWidgetToParent(
  dashboard: DashboardConfig,
  child: WidgetConfig,
  deps: LinkWidgetToParentDeps,
): DashboardConfig {
  if (!hasParentId(child)) return dashboard;
  const parent = getParentConfig(child, dashboard);
  const updatedParent = getParentConfigWithAdoptedChild(parent, child, deps);
  return placeWidget(dashboard, updatedParent);
}

interface LinkWidgetToParentDeps {
  itemConfig?: ItemConfig;
}

function removeWidgetDescendants(
  dashboard: DashboardConfig,
  widgetConfig: WidgetConfig,
): DashboardConfig {
  const children = getChildConfigs(widgetConfig, dashboard);

  const withoutDescendants = children.reduce(
    (prev, child) => removeWidgetWithDescendants(prev, child),
    dashboard,
  );

  return withoutDescendants;
}

function placeWidget(
  dashboard: DashboardConfig,
  widgetConfig: WidgetConfig,
): DashboardConfig {
  if (!hasParentId(widgetConfig) && !isRootConfig(widgetConfig, dashboard))
    return setWidgetAsNewRoot(dashboard, widgetConfig);

  return upsertWidget(dashboard, widgetConfig);
}

function removeRedundantChildrenInParentOf(
  dashboard: DashboardConfig,
  oneOfChildren: WidgetConfig,
): DashboardConfig {
  if (!hasParentId(oneOfChildren)) return dashboard;
  const parent = getParentConfig(oneOfChildren, dashboard);
  return removeRedundantChildren(dashboard, parent);
}

function removeWidgetWithDescendants(
  dashboard: DashboardConfig,
  widgetConfig: WidgetConfig,
): DashboardConfig {
  const unlinked = unlinkWidgetFromParent(dashboard, widgetConfig);
  const withoutDescendants = removeDescendants(unlinked, widgetConfig);
  return removeWidget(withoutDescendants, widgetConfig);
}

export function isRootConfig(widgetConfig: WidgetConfig, deps: IsRootConfigDeps) {
  const root = findRootConfig(deps);
  return widgetsHaveSameId(widgetConfig, root);
}

export interface IsRootConfigDeps {
  widgetConfigs: WidgetConfigsById;
  rootId?: WidgetConfig["id"];
}

function setWidgetAsNewRoot(
  dashboard: DashboardConfig,
  widgetConfig: WidgetConfig,
): DashboardConfig {
  const pruned = removeWidgetsOutsideSubtree(dashboard, widgetConfig);
  const upserted = upsertWidget(pruned, widgetConfig);
  return updateRootId(upserted, widgetConfig.id);
}

function upsertWidget(
  dashboard: DashboardConfig,
  widgetConfig: WidgetConfig,
): DashboardConfig {
  const widgetConfigs = {
    ...dashboard.widgetConfigs,
    [widgetConfig.id]: { ...widgetConfig },
  };

  return { ...dashboard, widgetConfigs };
}

function removeRedundantChildren(
  dashboard: DashboardConfig,
  parent: WidgetConfig,
): DashboardConfig {
  const children = getChildConfigs(parent, dashboard);
  const redundant = children.filter((child) => isRedundant(child, dashboard));

  const withoutRedundant = redundant.reduce(
    (prev, child) => removeWidgetWithDescendants(prev, child),
    dashboard,
  );

  return withoutRedundant;
}

function removeDescendants(
  dashboard: DashboardConfig,
  widgetConfig: WidgetConfig,
): DashboardConfig {
  const descendants = Object.values(getDescendantConfigs(widgetConfig, dashboard));

  const withoutDescendants = descendants.reduce(
    (prev, descendant) => removeWidget(prev, descendant),
    dashboard,
  );

  return withoutDescendants;
}

function removeWidget(
  dashboard: DashboardConfig,
  widgetConfig: WidgetConfig,
): DashboardConfig {
  const rootId = isRootConfig(widgetConfig, dashboard) ? undefined : dashboard.rootId;
  const widgetConfigs = { ...dashboard.widgetConfigs };
  delete widgetConfigs[widgetConfig.id];
  return { widgetConfigs, rootId };
}

export function findRootConfig(deps: FindRootConfigDeps): WidgetConfig | undefined {
  if (!deps.rootId) return;
  return findWidgetConfig(deps.rootId, deps);
}

export interface FindRootConfigDeps {
  widgetConfigs: WidgetConfigsById;
  rootId?: WidgetConfig["id"];
}

function removeWidgetsOutsideSubtree(
  dashboard: DashboardConfig,
  subtreeRoot: WidgetConfig,
): DashboardConfig {
  const descendants = getDescendantConfigs(subtreeRoot, dashboard);
  const keptIds = new Set([subtreeRoot.id, ...Object.keys(descendants)]);

  const outside = Object.values(dashboard.widgetConfigs).filter(
    (config) => !keptIds.has(config.id),
  );

  const withoutOutside = outside.reduce(
    (prev, config) => removeWidget(prev, config),
    dashboard,
  );

  return withoutOutside;
}

function updateRootId(
  dashboard: DashboardConfig,
  newId: WidgetConfig["id"] | undefined,
): DashboardConfig {
  return { ...dashboard, rootId: newId };
}
