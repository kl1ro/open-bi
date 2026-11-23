import type YandexMaps from "yandex-maps";

declare global {
  interface Window {
    ymaps?: typeof YandexMaps;
  }
}

declare module "react" {
  interface CSSProperties {
    [key: `--${string}`]: string | number;
  }
}
