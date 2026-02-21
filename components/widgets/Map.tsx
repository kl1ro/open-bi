import { useEffect, useRef } from "react";

import type Map from "@/lib/widgets/map";

export default function Map() {
  const map = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ymaps.ready(() => {
      const smth = new ymaps.Map(map.current, {
        center: [55.751244, 37.618423],
        zoom: 13,
        type: "yandex#hybrid",
      });
    });
  }, []);

  return <div ref={map} className="w-full h-full" />;
}
