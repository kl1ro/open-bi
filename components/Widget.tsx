import GraphWidget from "@/components/widgets/GraphWidget";
import LayoutWidget from "@/components/widgets/LayoutWidget";
import TitleWidget from "@/components/widgets/TitleWidget";
import MapWidget from "@/components/widgets/MapWidget";
import SlotWidget from "@/components/widgets/SlotWidget";
import type WidgetConfig from "@/lib/widget";
import { getUnexpectedWidgetTypeError } from "@/lib/widget";
import { useAppSelector } from "@/state/hooks";

export default function Widget(props: WidgetProps) {
  const state = useWidgetState(props);
  if (!state.widgetConfig) return;

  return (
    <div className="relative size-full rounded-xl animated no-scrollbar overflow-auto">
      {getWidgetByType(state)}
    </div>
  );
}

export interface WidgetProps {
  id: WidgetConfig["id"];
}

function useWidgetState(props: WidgetProps) {
  return {
    widgetConfig: useAppSelector((state) => state.dashboard.widgetConfigs[props.id]),
  };
}

function getWidgetByType(deps: GetWidgetByTypeDeps) {
  switch (deps.widgetConfig.type) {
    case "layout":
      return <LayoutWidget {...deps.widgetConfig} />;

    case "title":
      return <TitleWidget {...deps.widgetConfig} />;

    case "graph":
      return <GraphWidget {...deps.widgetConfig} />;

    case "map":
      return <MapWidget {...deps.widgetConfig} />;

    case "slot":
      return <SlotWidget {...deps.widgetConfig} />;

    default:
      handleUnexpectedWidgetType(deps.widgetConfig);
  }
}

interface GetWidgetByTypeDeps {
  widgetConfig: WidgetConfig;
}

function handleUnexpectedWidgetType(widgetConfig: never) {
  console.error(getUnexpectedWidgetTypeError(widgetConfig));
}
