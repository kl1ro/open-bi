import type YandexMaps from "yandex-maps";

const YANDEX_MAPS_API_URL = "https://api-maps.yandex.ru/2.1/?lang=en_US";

let yandexMapsLoading: Promise<typeof YandexMaps> | undefined;

export function loadYandexMaps(): Promise<typeof YandexMaps> {
  yandexMapsLoading ??= startYandexMapsLoading();
  return yandexMapsLoading;
}

function startYandexMapsLoading(): Promise<typeof YandexMaps> {
  const loading = appendYandexMapsScript().then(waitForYandexMapsReady);
  void loading.catch(forgetYandexMapsLoading);
  return loading;
}

function appendYandexMapsScript() {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = YANDEX_MAPS_API_URL;
    script.addEventListener("load", () => resolve());

    script.addEventListener("error", (event) => {
      script.remove();
      reject(new YandexMapsNotLoadedError({ cause: event }));
    });

    document.head.append(script);
  });
}

export class YandexMapsNotLoadedError extends Error {
  public name = YandexMapsNotLoadedError.name;

  public constructor(options?: ErrorOptions) {
    super("Yandex Maps API is not loaded", options);
  }
}

async function waitForYandexMapsReady() {
  const yandexMaps = getYandexMapsApi();

  try {
    await yandexMaps.ready();
  } catch (error) {
    throw new YandexMapsNotLoadedError({ cause: error });
  }

  return yandexMaps;
}

function forgetYandexMapsLoading() {
  yandexMapsLoading = undefined;
}

function getYandexMapsApi() {
  const yandexMaps = window.ymaps;
  if (!yandexMaps) throw new YandexMapsNotLoadedError();
  return yandexMaps;
}
