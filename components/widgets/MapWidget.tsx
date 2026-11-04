import { type RefObject, useEffect, useRef } from "react";
import { useErrorBoundary } from "react-error-boundary";
import type YandexMaps from "yandex-maps";

import type MapConfig from "@/lib/widgets/map";
import type { MapView } from "@/lib/widgets/map";
import { loadYandexMaps } from "@/lib/yandex-maps";

export default function MapWidget(props: MapConfig) {
  const state = useMapWidgetState(props);
  useMapWidgetEffects(state);
  return <div ref={state.container} className="size-full" />;
}

function useMapWidgetState(props: MapConfig) {
  return {
    container: useRef<HTMLDivElement>(null),
    config: props,
    showBoundary: useErrorBoundary().showBoundary,
  };
}

function useMapWidgetEffects(deps: UseMapWidgetEffectsDeps) {
  useMapMountEffect(deps);
}

interface UseMapWidgetEffectsDeps {
  config: MapConfig;
  container: RefObject<HTMLDivElement | null>;
  showBoundary: (error: unknown) => void;
}

function useMapMountEffect(deps: UseMapMountEffectDeps) {
  useEffect(
    () => mountMapIntoContainer(deps.config, deps.container, deps),
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
  showBoundary: (error: unknown) => void;
}

function mountMapIntoContainer(
  config: MapConfig,
  container: RefObject<HTMLDivElement | null>,
  deps: MountMapIntoContainerDeps,
) {
  let map: ymaps.Map | undefined;
  let isUnmounted = false;

  const resizeObserver = new ResizeObserver(() => fitMapToContainer(map));

  void loadYandexMaps()
    .then((yandexMaps) => {
      if (isUnmounted || !container.current) return;
      const innerDeps = { ...deps, yandexMaps };
      map = createMapInContainer(config, container.current, innerDeps);
      resizeObserver.observe(container.current);
    })
    .catch((error: unknown) => {
      if (!isUnmounted) deps.showBoundary(error);
    });

  return () => {
    isUnmounted = true;
    resizeObserver.disconnect();
    map?.destroy();
  };
}

interface MountMapIntoContainerDeps {
  showBoundary: (error: unknown) => void;
}

function fitMapToContainer(map: ymaps.Map | undefined) {
  map?.container.fitToViewport();
}

function createMapInContainer(
  config: MapConfig,
  container: HTMLDivElement,
  deps: CreateMapInContainerDeps,
) {
  return new deps.yandexMaps.Map(container, {
    center: [config.center.latitude, config.center.longitude],
    zoom: config.zoom,
    type: YANDEX_MAP_TYPE[config.view],
  });
}

interface CreateMapInContainerDeps {
  yandexMaps: typeof YandexMaps;
}

const YANDEX_MAP_TYPE = {
  scheme: "yandex#map",
  satellite: "yandex#satellite",
  hybrid: "yandex#hybrid",
} as const satisfies { [View in MapView]: string };
