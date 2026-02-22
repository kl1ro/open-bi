import { useEffect, useRef } from "react";

import type Map from "@/lib/widgets/map";

export default function Map() {
  const map = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void window.ymaps.ready(() => {
      if (!map.current) return;

      new window.ymaps.Map(map.current, {
        center: [55.751244, 37.618423],
        zoom: 13,
        type: "yandex#hybrid",
      });
    });
  }, []);

  return <div ref={map} className="w-full h-full" />;
}
