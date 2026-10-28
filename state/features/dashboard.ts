import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type WidgetConfig from "@/lib/widget";
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
} from "@/lib/widget";
import type DashboardConfig from "@/lib/dashboard";
import type { WithRequired } from "@/lib/utils";
import type { RootState } from "@/state/store";

const initialDashboardState: DashboardConfig = {
  widgetConfigs: {},
};

const slice = createSlice({
  name: "dashboard",
  initialState: initialDashboardState,
  reducers: {
    setDashboard: handleDashboardSet,
    upsertWidget: handleWidgetUpsert,
    removeWidget: handleWidgetRemoval,
  },
});

export const { setDashboard, upsertWidget, removeWidget } = slice.actions;
export default slice.reducer;

function handleDashboardSet(
  state: DashboardConfig,
  action: PayloadAction<DashboardConfig>,
) {
  return action.payload;
}

function handleWidgetUpsert(
  state: DashboardConfig,
  action: PayloadAction<WidgetUpsertPayload>,
) {
  const { itemConfig, widgetConfig } = action.payload;
  const deps = { state, widgetConfigs: state.widgetConfigs, itemConfig };

  const oldWidgetConfig = findWidgetConfig(widgetConfig.id, deps);
  validateWidgetUpdate(oldWidgetConfig, widgetConfig);

  if (hasMovedFromParent(oldWidgetConfig, widgetConfig))
    unlinkWidgetFromParent(oldWidgetConfig, deps);

  linkWidgetToParent(widgetConfig, deps);

  if (oldWidgetConfig && isTurningToSlot(oldWidgetConfig, widgetConfig))
    removeWidgetDescendants(oldWidgetConfig, deps);

  upsertWidgetToState(widgetConfig, deps);
  removeRedundantChildrenInParentOf(widgetConfig, deps);
}

interface WidgetUpsertPayload {
  widgetConfig: WidgetConfig;
  itemConfig?: ItemConfig;
}

function handleWidgetRemoval(
  state: DashboardConfig,
  action: PayloadAction<WidgetRemovalPayload>,
) {
  const { id } = action.payload;
  const deps = { state, widgetConfigs: state.widgetConfigs };

  const widgetConfig = findWidgetConfig(id, deps);
  if (!widgetConfig) return;

  removeWidgetWithDescendants(widgetConfig, deps);
}

interface WidgetRemovalPayload {
  id: WidgetConfig["id"];
}

function unlinkWidgetFromParent(
  child: WithRequired<WidgetConfig, "parentId">,
  deps: DashboardSliceDeps,
) {
  const innerDeps = { ...deps, widgetConfigs: deps.state.widgetConfigs };
  const parent = getParentConfig(child, innerDeps);
  const updatedParent = getParentConfigWithDisownedChild(parent, child);
  upsertWidgetToState(updatedParent, innerDeps);
}

function linkWidgetToParent(child: WidgetConfig, deps: LinkWidgetToParentDeps) {
  if (!hasParentId(child)) return;

  const innerDeps = { ...deps, widgetConfigs: deps.state.widgetConfigs };
  const parent = getParentConfig(child, innerDeps);
  const updatedParent = getParentConfigWithAdoptedChild(parent, child, innerDeps);
  upsertWidgetToState(updatedParent, innerDeps);
}

type LinkWidgetToParentDeps = DashboardSliceDeps &
  Pick<WidgetUpsertPayload, "itemConfig">;

function removeWidgetDescendants(widgetConfig: WidgetConfig, deps: DashboardSliceDeps) {
  const innerDeps = { ...deps, widgetConfigs: deps.state.widgetConfigs };
  const children = getChildConfigs(widgetConfig, innerDeps);
  children.forEach((child) => removeWidgetWithDescendants(child, innerDeps));
}

function upsertWidgetToState(widgetConfig: WidgetConfig, deps: DashboardSliceDeps) {
  if (!hasParentId(widgetConfig) && !isRootConfig(widgetConfig, deps))
    setWidgetAsNewRoot(widgetConfig, deps);
  else updateWidgetInState(widgetConfig, deps);
}

function removeRedundantChildrenInParentOf(
  oneOfChildren: WidgetConfig,
  deps: DashboardSliceDeps,
) {
  if (!hasParentId(oneOfChildren)) return;
  const innerDeps = { ...deps, widgetConfigs: deps.state.widgetConfigs };
  const parent = getParentConfig(oneOfChildren, innerDeps);
  removeRedundantChildren(parent, innerDeps);
}

function removeWidgetWithDescendants(
  widgetConfig: WidgetConfig,
  deps: DashboardSliceDeps,
) {
  if (hasParentId(widgetConfig)) unlinkWidgetFromParent(widgetConfig, deps);
  removeDescendantsFromState(widgetConfig, deps);
  removeWidgetFromState(widgetConfig, deps);
}

export function isRootConfig(widgetConfig: WidgetConfig, deps: DashboardSliceDeps) {
  const root = findRootConfig(deps);
  return widgetsHaveSameId(widgetConfig, root);
}

function setWidgetAsNewRoot(widgetConfig: WidgetConfig, deps: DashboardSliceDeps) {
  removeWidgetsOutsideSubtree(widgetConfig, deps);
  updateWidgetInState(widgetConfig, deps);
  updateRootId(widgetConfig.id, deps);
}

function updateWidgetInState(widgetConfig: WidgetConfig, deps: DashboardSliceDeps) {
  deps.state.widgetConfigs[widgetConfig.id] = { ...widgetConfig };
}

function removeRedundantChildren(parent: WidgetConfig, deps: DashboardSliceDeps) {
  const innerDeps = { ...deps, widgetConfigs: deps.state.widgetConfigs };
  const children = getChildConfigs(parent, innerDeps);
  const redundant = children.filter((child) => isRedundant(child, innerDeps));
  redundant.forEach((child) => removeWidgetWithDescendants(child, innerDeps));
}

function removeDescendantsFromState(
  widgetConfig: WidgetConfig,
  deps: DashboardSliceDeps,
) {
  const innerDeps = { ...deps, widgetConfigs: deps.state.widgetConfigs };

  const descendants = Object.values(getDescendantConfigs(widgetConfig, innerDeps));

  descendants.forEach((descendant) => removeWidgetFromState(descendant, innerDeps));
}

function removeWidgetFromState(widgetConfig: WidgetConfig, deps: DashboardSliceDeps) {
  if (isRootConfig(widgetConfig, deps)) updateRootId(undefined, deps);
  delete deps.state.widgetConfigs[widgetConfig.id];
}

function findRootConfig(deps: DashboardSliceDeps): WidgetConfig | undefined {
  if (!deps.state.rootId) return;
  const innerDeps = { ...deps, widgetConfigs: deps.state.widgetConfigs };
  return findWidgetConfig(deps.state.rootId, innerDeps);
}

function removeWidgetsOutsideSubtree(
  subtreeRoot: WidgetConfig,
  deps: DashboardSliceDeps,
) {
  const innerDeps = { ...deps, widgetConfigs: deps.state.widgetConfigs };

  const descendants = getDescendantConfigs(subtreeRoot, innerDeps);
  const keptIds = new Set([subtreeRoot.id, ...Object.keys(descendants)]);

  Object.values(deps.state.widgetConfigs)
    .filter((config) => !keptIds.has(config.id))
    .forEach((config) => removeWidgetFromState(config, innerDeps));
}

function updateRootId(newId: WidgetConfig["id"] | undefined, deps: DashboardSliceDeps) {
  deps.state.rootId = newId;
}

export interface DashboardSliceDeps {
  state: DashboardConfig;
}

export function selectRootConfig(state: RootState): WidgetConfig | undefined {
  const deps = { state: state.dashboard };
  return findRootConfig(deps);
}

export function selectWidgetConfig(
  state: RootState,
  id: WidgetConfig["id"],
): WidgetConfig | undefined {
  const deps = { widgetConfigs: state.dashboard.widgetConfigs };
  return findWidgetConfig(id, deps);
}
