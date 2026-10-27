import type { PointerEvent, RefObject } from "react";
import { toast } from "sonner";

import type { GridGestureState } from "@/components/widgets/layouts/GridWidget";
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
import { upsertWidget } from "@/state/features/dashboard";
import type { AppStore } from "@/state/store";

export default function useGridResize(deps: UseGridResizeDeps) {
  const resize = findOngoingResize(deps);
  const resizeDeps = { ...deps, resize };

  return {
    value: resize,
    preview: getResizePreview(resize, deps),
    tryStart: (startDeps: GridResizeStartDeps) =>
      tryStartResize({ ...deps, ...startDeps }),
    continue: (event: PointerEvent<HTMLElement>) =>
      continueResize({ ...resizeDeps, event }),
    tryFinish: (event: PointerEvent<HTMLElement>) =>
      tryFinishResize({ ...resizeDeps, event }),
    reset: () => resetResize(deps),
  };
}

export interface UseGridResizeDeps {
  grid: GridConfig;
  itemsToRender: GridItemToRender[];
  container: RefObject<HTMLDivElement | null>;
  store: AppStore;
  gesture: GridGestureState;
}

export interface GridResizeStartDeps {
  event: PointerEvent<HTMLElement>;
  handle: Pick<GridResize, "sides">;
  item: GridItemToRender;
}

function findOngoingResize(deps: FindOngoingResizeDeps): GridResize | undefined {
  if (deps.gesture.value?.kind !== "resize") return;
  return deps.gesture.value;
}

type FindOngoingResizeDeps = Pick<UseGridResizeDeps, "gesture">;

function tryStartResize(deps: TryStartResizeDeps) {
  if (isGestureInProgress(deps.gesture.value)) return;

  try {
    const creationDeps = {
      ...deps,
      widgetConfigs: deps.store.getState().dashboard.widgetConfigs,
    };

    const gesture = createGesture(creationDeps);
    takeOverPointerEvent(deps.event);
    deps.gesture.set({ ...gesture, kind: "resize", sides: deps.handle.sides });
  } catch (error) {
    console.error(error);
    toast.error("Не удалось начать изменение размера виджета");
  }
}

type TryStartResizeDeps = UseGridResizeDeps & GridResizeStartDeps;

function continueResize(deps: ContinueResizeDeps) {
  if (!deps.resize) return;
  const delta = getGridResizeDelta(deps.resize, deps);
  if (haveSameDelta(delta, deps.resize.delta)) return;
  deps.gesture.set({ ...deps.resize, delta });
}

type ContinueResizeDeps = Pick<UseGridResizeDeps, "gesture"> & {
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

type TryFinishResizeDeps = Pick<UseGridResizeDeps, "gesture" | "grid" | "store"> & {
  resize?: GridResize;
  event: PointerEvent<HTMLElement>;
};

function resetResize(deps: ResetResizeDeps) {
  deps.gesture.set(undefined);
}

type ResetResizeDeps = Pick<UseGridResizeDeps, "gesture">;

function applyResize(resize: GridResize, deps: ApplyResizeDeps) {
  const itemConfig = getResizedItemConfig(resize, deps);
  if (occupySameCells(resize.owner.itemConfig, itemConfig)) return;
  deps.store.dispatch(upsertWidget({ widgetConfig: resize.owner.child, itemConfig }));
}

type ApplyResizeDeps = Pick<UseGridResizeDeps, "grid" | "store">;
