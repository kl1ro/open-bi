import { useMemo } from "react";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

import { type LineGraph } from "@/lib/widgets/graphs/line-graph";

const ApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export default function LineGraph() {
  const options: ApexOptions = useMemo(
    () => ({
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
    }),
    [],
  );

  const series = [
    {
      name: "Sales",
      data: [30, 40, 35, 50, 49],
    },
  ];

  return (
    <div className="h-full w-full grid bg-medium">
      <ApexChart options={options} series={series} type="line" height="100%" />
    </div>
  );
}
