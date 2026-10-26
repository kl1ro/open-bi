import type { RefObject } from "react";
import { useEffect, useRef } from "react";

import type MapConfig from "@/lib/widgets/map";
import type { MapView } from "@/lib/widgets/map";

export default function MapWidget(props: MapConfig) {
  const state = useMapWidgetState(props);
  useMapWidgetEffects(state);
  return <div ref={state.container} className="size-full" />;
}

function useMapWidgetState(props: MapConfig) {
  return {
    container: useRef<HTMLDivElement>(null),
    config: props,
  };
}

function useMapWidgetEffects(deps: UseMapWidgetEffectsDeps) {
  useMountMapEffect(deps);
}

export interface UseMapWidgetEffectsDeps {
  container: RefObject<HTMLDivElement | null>;
  config: MapConfig;
}

function useMountMapEffect(deps: UseMountMapEffectDeps) {
  useEffect(
    () => mountMapIntoContainer(deps.container, deps),
    [
      deps.config.center.latitude,
      deps.config.center.longitude,
      deps.config.zoom,
      deps.config.view,
    ],
  );
}

export interface UseMountMapEffectDeps {
  container: RefObject<HTMLDivElement | null>;
  config: MapConfig;
}

function mountMapIntoContainer(
  container: RefObject<HTMLDivElement | null>,
  deps: MountMapIntoContainerDeps,
) {
  let map: ymaps.Map | undefined;
  let isUnmounted = false;

  const resizeObserver = new ResizeObserver(() => fitMapToContainer(map));

  void window.ymaps.ready(() => {
    if (isUnmounted || !container.current) return;
    map = createMap(container.current, deps.config);
    resizeObserver.observe(container.current);
  });

  return () => {
    isUnmounted = true;
    resizeObserver.disconnect();
    map?.destroy();
  };
}

export interface MountMapIntoContainerDeps {
  config: MapConfig;
}

function fitMapToContainer(map: ymaps.Map | undefined) {
  map?.container.fitToViewport();
}

function createMap(container: HTMLDivElement, config: MapConfig) {
  return new window.ymaps.Map(container, {
    center: [config.center.latitude, config.center.longitude],
    zoom: config.zoom,
    type: YANDEX_MAP_TYPE[config.view],
  });
}

const YANDEX_MAP_TYPE = {
  scheme: "yandex#map",
  satellite: "yandex#satellite",
  hybrid: "yandex#hybrid",
} as const satisfies { [View in MapView]: string };
