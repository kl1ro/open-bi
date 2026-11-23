import type YandexMaps from "yandex-maps";

import { type RetryOptions, retry } from "@/lib/retry";
import { loadScript } from "@/lib/scripts";

const YANDEX_MAPS_API_URL = "https://api-maps.yandex.ru/2.1/?lang=en_US";
const YANDEX_MAPS_LOADING_RETRY_OPTIONS: RetryOptions = { attempts: 3, baseDelay: 500 };

export function loadYandexMaps(): Promise<typeof YandexMaps> {
  const deps = { options: YANDEX_MAPS_LOADING_RETRY_OPTIONS };
  return retry(loadYandexMapsOnce, deps);
}

async function loadYandexMapsOnce(): Promise<typeof YandexMaps> {
  await loadYandexMapsScript();
  const yandexMaps = getYandexMapsApi();
  await waitForYandexMapsReady(yandexMaps);
  return yandexMaps;
}

async function loadYandexMapsScript() {
  try {
    await loadScript(YANDEX_MAPS_API_URL);
  } catch (error) {
    throw new YandexMapsNotLoadedError({ cause: error });
  }
}

export class YandexMapsNotLoadedError extends Error {
  public name = YandexMapsNotLoadedError.name;

  public constructor(options?: ErrorOptions) {
    super("Yandex Maps API is not loaded", options);
  }
}

function getYandexMapsApi() {
  const yandexMaps = window.ymaps;
  if (!yandexMaps) throw new YandexMapsNotLoadedError();
  return yandexMaps;
}

async function waitForYandexMapsReady(yandexMaps: typeof YandexMaps) {
  try {
    await yandexMaps.ready();
  } catch (error) {
    throw new YandexMapsNotLoadedError({ cause: error });
  }
}
