import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";
import type { ReactNode } from "react";

import BrokenWidget from "@/components/BrokenWidget";
import GraphWidget from "@/components/widgets/GraphWidget";
import LayoutWidget from "@/components/widgets/LayoutWidget";
import TitleWidget from "@/components/widgets/TitleWidget";
import MapWidget from "@/components/widgets/MapWidget";
import SlotWidget from "@/components/widgets/SlotWidget";
import type WidgetConfig from "@/lib/widget";
import { getUnexpectedWidgetTypeError } from "@/lib/widget";
import { useAppSelector } from "@/state/hooks";

export default function Widget(props: WidgetProps) {
  return (
    <WidgetErrorBoundary>
      <WidgetContent {...props} />
    </WidgetErrorBoundary>
  );
}

interface WidgetProps {
  id: WidgetConfig["id"];
}

function WidgetContent(props: WidgetContentProps) {
  const state = useWidgetContentState(props);
  if (!state.widgetConfig) return;

  return (
    <div className="relative size-full rounded-xl animated no-scrollbar overflow-auto">
      {getWidgetByType(state)}
    </div>
  );
}

type WidgetContentProps = WidgetProps;

function useWidgetContentState(props: WidgetContentProps) {
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
      throw getUnexpectedWidgetTypeError(deps.widgetConfig);
  }
}

interface GetWidgetByTypeDeps {
  widgetConfig: WidgetConfig;
}

function WidgetErrorBoundary(props: WidgetErrorBoundaryProps) {
  return (
    <ErrorBoundary FallbackComponent={BrokenWidget} onError={reportWidgetRenderError}>
      {props.children}
    </ErrorBoundary>
  );
}

export interface WidgetErrorBoundaryProps {
  children?: ReactNode;
}

function reportWidgetRenderError(error: unknown) {
  console.error(error);
  toast.error("Не удалось отобразить виджет");
}
