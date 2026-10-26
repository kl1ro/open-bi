import GraphWidget from "@/components/widgets/GraphWidget";
import LayoutWidget from "@/components/widgets/LayoutWidget";
import TitleWidget from "@/components/widgets/TitleWidget";
import MapWidget from "@/components/widgets/MapWidget";
import SlotWidget from "@/components/widgets/SlotWidget";
import type WidgetConfig from "@/lib/widget";
import { useAppSelector } from "@/state/hooks";
import type { ItemConfig } from "@/lib/widget";

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
  itemConfig?: ItemConfig;
}

function useWidgetState(props: WidgetProps) {
  return {
    widgetConfig: useAppSelector((state) => state.dashboard.widgetConfigs[props.id]),
    itemConfig: props.itemConfig,
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
      return <SlotWidget itemConfig={deps.itemConfig} {...deps.widgetConfig} />;

    default:
      handleUnexpectedWidgetType(deps.widgetConfig);
  }
}

interface GetWidgetByTypeDeps {
  widgetConfig: WidgetConfig;
  itemConfig?: ItemConfig;
}

function handleUnexpectedWidgetType(widgetConfig: never) {
  const type = (widgetConfig as { type?: unknown })?.type;
  const error = type ? new UnexpectedWidgetTypeError({ type }) : new NoWidgetTypeError();
  console.error(error);
}

export class NoWidgetTypeError extends Error {
  public name = NoWidgetTypeError.name;

  public constructor(options?: ErrorOptions) {
    super(`Error while trying to handle the widget with no type`, options);
  }
}

export class UnexpectedWidgetTypeError extends Error {
  public name = UnexpectedWidgetTypeError.name;
  public type: unknown;

  public constructor(options: ErrorOptions & { type: unknown }) {
    super(
      `Error while trying to handle the widget: type ${options.type as string} is unexpected`,
      options,
    );

    this.type = options.type;
  }
}
