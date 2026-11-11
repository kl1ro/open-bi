import { createSlice, current, type PayloadAction } from "@reduxjs/toolkit";
import type WidgetConfig from "@kl1ro/mip-bi-core/widget";
import { findWidgetConfig, type ItemConfig } from "@kl1ro/mip-bi-core/widget";
import type DashboardConfig from "@kl1ro/mip-bi-core/dashboard";
import {
  findRootConfig,
  getDashboardWithAppliedWidget,
  getDashboardWithoutWidgetBranch,
} from "@kl1ro/mip-bi-core/dashboard";

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
  const dashboard = current(state);
  return getDashboardWithAppliedWidget(dashboard, widgetConfig, itemConfig);
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
  const dashboard = current(state);
  const widgetConfig = findWidgetConfig(id, dashboard);
  if (!widgetConfig) return;
  return getDashboardWithoutWidgetBranch(dashboard, widgetConfig);
}

interface WidgetRemovalPayload {
  id: WidgetConfig["id"];
}

export function selectRootConfig(state: RootState): WidgetConfig | undefined {
  return findRootConfig(state.dashboard);
}

export function selectWidgetConfig(
  state: RootState,
  id: WidgetConfig["id"],
): WidgetConfig | undefined {
  const deps = { widgetConfigs: state.dashboard.widgetConfigs };
  return findWidgetConfig(id, deps);
}
