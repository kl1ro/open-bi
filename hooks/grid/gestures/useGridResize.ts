import type { PointerEvent, RefObject } from "react";
import { toast } from "sonner";

import type { CurrentGridGestureState } from "@/hooks/grid/useGridGesture";
import type { GridResizeHandleConfig } from "@/components/widgets/layouts/grid/GridResizeHandles";
import type GridConfig from "@/lib/widgets/layouts/grid";
import {
  haveSameDelta,
  occupySameCells,
  type GridItemToRender,
} from "@/lib/widgets/layouts/grid";
import { createGesture, isGestureInProgress } from "@/lib/widgets/layouts/grid/gesture";
import type GridResize from "@/lib/widgets/layouts/grid/resize";
import {
  getGridResizeDelta,
  getResizedItemConfig,
  getResizePreview,
} from "@/lib/widgets/layouts/grid/resize";
import { takeOverPointerEvent } from "@/lib/pointer";
import { bindDeps } from "@/lib/utils";
import { upsertWidget } from "@/state/features/dashboard";
import type { AppStore } from "@/state/store";

export default function useGridResize(deps: UseGridResizeDeps) {
  const resize = findOngoingResize(deps);
  const innerDeps = { ...deps, resize };

  return {
    value: resize,
    preview: getResizePreview(resize, innerDeps),
    tryStart: bindDeps(tryStartResize, innerDeps),
    continue: bindDeps(continueResize, innerDeps),
    tryFinish: bindDeps(tryFinishResize, innerDeps),
    reset: bindDeps(resetResize, innerDeps),
  };
}

export interface UseGridResizeDeps {
  grid: GridConfig;
  itemsToRender: GridItemToRender[];
  container: RefObject<HTMLDivElement | null>;
  store: AppStore;
  currentGesture: CurrentGridGestureState;
}

function findOngoingResize(deps: FindOngoingResizeDeps): GridResize | undefined {
  if (deps.currentGesture.value?.kind !== "resize") return;
  return deps.currentGesture.value;
}

type FindOngoingResizeDeps = Pick<UseGridResizeDeps, "currentGesture">;

function tryStartResize(deps: TryStartResizeDeps) {
  if (isGestureInProgress(deps.currentGesture.value)) return;

  try {
    const innerDeps = {
      ...deps,
      widgetConfigs: deps.store.getState().dashboard.widgetConfigs,
    };

    const gesture = createGesture(innerDeps);
    takeOverPointerEvent(deps.event);
    deps.currentGesture.set({ ...gesture, kind: "resize", sides: deps.handle.sides });
  } catch (error) {
    console.error(error);
    toast.error("Не удалось начать изменение размера виджета");
  }
}

type TryStartResizeDeps = Pick<
  UseGridResizeDeps,
  "currentGesture" | "store" | "grid" | "container"
> & {
  event: PointerEvent<HTMLElement>;
  handle: GridResizeHandleConfig;
  item: GridItemToRender;
};

function continueResize(deps: ContinueResizeDeps) {
  if (!deps.resize) return;
  const delta = getGridResizeDelta(deps.resize, deps);
  if (haveSameDelta(delta, deps.resize.delta)) return;
  deps.currentGesture.set({ ...deps.resize, delta });
}

type ContinueResizeDeps = Pick<UseGridResizeDeps, "currentGesture"> & {
  resize?: GridResize;
  event: PointerEvent<HTMLElement>;
};

function tryFinishResize(deps: TryFinishResizeDeps) {
  if (!deps.resize) return;

  try {
    const delta = getGridResizeDelta(deps.resize, deps);
    const updatedResize = { ...deps.resize, delta };
    applyResize(updatedResize, deps);
  } catch (error) {
    console.error(error);
    toast.error("Не удалось изменить размер виджета");
  }

  resetResize(deps);
}

type TryFinishResizeDeps = Pick<
  UseGridResizeDeps,
  "currentGesture" | "grid" | "store"
> & {
  resize?: GridResize;
  event: PointerEvent<HTMLElement>;
};

function resetResize(deps: ResetResizeDeps) {
  deps.currentGesture.set(undefined);
}

type ResetResizeDeps = Pick<UseGridResizeDeps, "currentGesture">;

function applyResize(resize: GridResize, deps: ApplyResizeDeps) {
  const itemConfig = getResizedItemConfig(resize, deps);
  if (occupySameCells(resize.owner.itemConfig, itemConfig)) return;
  deps.store.dispatch(upsertWidget({ widgetConfig: resize.owner.child, itemConfig }));
}

type ApplyResizeDeps = Pick<UseGridResizeDeps, "grid" | "store">;
