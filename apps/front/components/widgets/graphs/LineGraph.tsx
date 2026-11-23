import type { ApexOptions } from "apexcharts";
import { AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

import CurtainOverlay from "@/components/CurtainOverlay";

const ApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export default function LineGraph() {
  const state = useLineGraphState();

  return (
    <div className="relative size-full grid bg-medium">
      <ApexChart
        options={state.options}
        series={LINE_GRAPH_SERIES}
        type="line"
        height="100%"
      />

      <AnimatePresence>{!state.isGraphReady.value && <CurtainOverlay />}</AnimatePresence>
    </div>
  );
}

function useLineGraphState() {
  const deps = { isGraphReady: useIsGraphReady() };
  return { ...deps, options: useLineGraphOptions(deps) };
}

function useIsGraphReady() {
  const [value, set] = useState(false);
  return { value, set };
}

type IsGraphReadyState = ReturnType<typeof useIsGraphReady>;

function useLineGraphOptions(deps: UseLineGraphOptionsDeps) {
  return useMemo(() => getLineGraphOptions(deps), []);
}

interface UseLineGraphOptionsDeps {
  isGraphReady: IsGraphReadyState;
}

function getLineGraphOptions(deps: GetLineGraphOptionsDeps): ApexOptions {
  return {
    ...LINE_GRAPH_OPTIONS,

    chart: {
      ...LINE_GRAPH_OPTIONS.chart,
      events: { mounted: () => deps.isGraphReady.set(true) },
    },
  };
}

interface GetLineGraphOptionsDeps {
  isGraphReady: IsGraphReadyState;
}

const LINE_GRAPH_OPTIONS: ApexOptions = {
  chart: {
    id: "line-chart",

    toolbar: {
      show: true,

      tools: {
        download: false,
        selection: false,
        zoom: false,
        zoomin: false,
        zoomout: false,
        pan: false,
        reset: false,
      },
    },
  },

  stroke: { curve: "smooth" },

  xaxis: {
    categories: ["Jan", "Feb", "Mar", "Apr", "May"],
  },
};

const LINE_GRAPH_SERIES = [
  {
    name: "Sales",
    data: [30, 40, 35, 50, 49],
  },
];
