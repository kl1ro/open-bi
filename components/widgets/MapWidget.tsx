import { type RefObject, useEffect, useRef } from "react";

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
  useMapMountEffect(deps);
}

interface UseMapWidgetEffectsDeps {
  config: MapConfig;
  container: RefObject<HTMLDivElement | null>;
}

function useMapMountEffect(deps: UseMapMountEffectDeps) {
  useEffect(
    () => mountMapIntoContainer(deps.config, deps.container),
    [
      deps.config.center.latitude,
      deps.config.center.longitude,
      deps.config.zoom,
      deps.config.view,
    ],
  );
}

interface UseMapMountEffectDeps {
  config: MapConfig;
  container: RefObject<HTMLDivElement | null>;
}

function mountMapIntoContainer(
  config: MapConfig,
  container: RefObject<HTMLDivElement | null>,
) {
  let map: ymaps.Map | undefined;
  let isUnmounted = false;

  const resizeObserver = new ResizeObserver(() => fitMapToContainer(map));

  void window.ymaps.ready(() => {
    if (isUnmounted || !container.current) return;
    map = createMapInContainer(config, container.current);
    resizeObserver.observe(container.current);
  });

  return () => {
    isUnmounted = true;
    resizeObserver.disconnect();
    map?.destroy();
  };
}

function fitMapToContainer(map: ymaps.Map | undefined) {
  map?.container.fitToViewport();
}

function createMapInContainer(config: MapConfig, container: HTMLDivElement) {
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
