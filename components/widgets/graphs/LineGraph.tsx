import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

const ApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export default function LineGraph() {
  return (
    <div className="size-full grid bg-medium">
      <ApexChart
        options={LINE_GRAPH_OPTIONS}
        series={LINE_GRAPH_SERIES}
        type="line"
        height="100%"
      />
    </div>
  );
}

const LINE_GRAPH_OPTIONS: ApexOptions = {
  chart: {
    id: "area-chart",
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
