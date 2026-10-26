import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type WidgetConfig from "@/lib/widget";
import {
  findWidgetConfig,
  getChildren,
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
} from "@/lib/widget";
import type { WithRequired } from "@/lib/utils";

const initialDashboardState: DashboardState = {
  widgetConfigs: {},
};

export interface DashboardState {
  widgetConfigs: WidgetConfigsById;
  rootId?: WidgetConfig["id"];
}

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
  state: DashboardState,
  action: PayloadAction<DashboardState>,
) {
  return action.payload;
}

function handleWidgetUpsert(
  state: DashboardState,
  action: PayloadAction<WidgetUpsertPayload>,
) {
  const { itemConfig, widgetConfig } = action.payload;
  const deps = { state, widgetConfigs: state.widgetConfigs };

  const oldWidgetConfig = findWidgetConfig(widgetConfig.id, deps);
  validateWidgetUpdate(oldWidgetConfig, widgetConfig);

  if (hasMovedFromParent(oldWidgetConfig, widgetConfig))
    unlinkWidgetFromParent(oldWidgetConfig, deps);

  linkWidgetToParent(widgetConfig, itemConfig, deps);

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
  state: DashboardState,
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
  const widgetConfigsDeps = { widgetConfigs: deps.state.widgetConfigs };
  const parent = getParentConfig(child, widgetConfigsDeps);
  const updatedParent = getParentConfigWithDisownedChild(parent, child);
  upsertWidgetToState(updatedParent, deps);
}

function linkWidgetToParent(
  child: WidgetConfig,
  itemConfig: ItemConfig | undefined,
  deps: DashboardSliceDeps,
) {
  if (!hasParentId(child)) return;

  const widgetConfigsDeps = { widgetConfigs: deps.state.widgetConfigs };
  const parent = getParentConfig(child, widgetConfigsDeps);
  const updatedParent = getParentConfigWithAdoptedChild(parent, child, itemConfig);
  upsertWidgetToState(updatedParent, deps);
}

function removeWidgetDescendants(widgetConfig: WidgetConfig, deps: DashboardSliceDeps) {
  const widgetConfigsDeps = { widgetConfigs: deps.state.widgetConfigs };
  const children = getChildren(widgetConfig, widgetConfigsDeps);
  children.forEach((child) => removeWidgetWithDescendants(child, deps));
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
  const widgetConfigsDeps = { widgetConfigs: deps.state.widgetConfigs };
  const parent = getParentConfig(oneOfChildren, widgetConfigsDeps);
  removeRedundantChildren(parent, deps);
}

function removeWidgetWithDescendants(
  widgetConfig: WidgetConfig,
  deps: DashboardSliceDeps,
) {
  if (hasParentId(widgetConfig)) unlinkWidgetFromParent(widgetConfig, deps);
  removeDescendantsFromState(widgetConfig, deps);
  removeWidgetFromState(widgetConfig, deps);
}

function removeDescendantsFromState(
  widgetConfig: WidgetConfig,
  deps: DashboardSliceDeps,
) {
  const widgetConfigsDeps = { widgetConfigs: deps.state.widgetConfigs };

  const descendants = Object.values(
    getDescendantConfigs(widgetConfig, widgetConfigsDeps),
  );

  descendants.forEach((descendant) => removeWidgetFromState(descendant, deps));
}

function removeWidgetFromState(widgetConfig: WidgetConfig, deps: DashboardSliceDeps) {
  if (isRootConfig(widgetConfig, deps)) updateRootId(undefined, deps);
  delete deps.state.widgetConfigs[widgetConfig.id];
}

function isRootConfig(widgetConfig: WidgetConfig, deps: DashboardSliceDeps) {
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
  const widgetConfigsDeps = { widgetConfigs: deps.state.widgetConfigs };
  const children = getChildren(parent, widgetConfigsDeps);
  const redundant = children.filter((child) => isRedundant(child, widgetConfigsDeps));
  redundant.forEach((child) => removeWidgetWithDescendants(child, deps));
}

function updateRootId(newId: WidgetConfig["id"] | undefined, deps: DashboardSliceDeps) {
  deps.state.rootId = newId;
}

export function findRootConfig(deps: DashboardSliceDeps) {
  if (!deps.state.rootId) return;
  const widgetConfigsDeps = { widgetConfigs: deps.state.widgetConfigs };
  return findWidgetConfig(deps.state.rootId, widgetConfigsDeps);
}

function removeWidgetsOutsideSubtree(
  subtreeRoot: WidgetConfig,
  deps: DashboardSliceDeps,
) {
  const widgetConfigsDeps = { widgetConfigs: deps.state.widgetConfigs };

  const descendants = getDescendantConfigs(subtreeRoot, widgetConfigsDeps);
  const keptIds = new Set([subtreeRoot.id, ...Object.keys(descendants)]);

  Object.values(deps.state.widgetConfigs)
    .filter((config) => !keptIds.has(config.id))
    .forEach((config) => removeWidgetFromState(config, deps));
}

export interface DashboardSliceDeps {
  state: DashboardState;
}
