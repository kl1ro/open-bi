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
import { selectWidgetConfig } from "@/state/features/dashboard";
import { useAppSelector } from "@/state/hooks";

export default function Widget(props: WidgetProps) {
  return (
    <WidgetErrorBoundary>
      <WidgetContent {...props} />
    </WidgetErrorBoundary>
  );
}

export interface WidgetProps {
  id: WidgetConfig["id"];
}

function WidgetErrorBoundary(props: WidgetErrorBoundaryProps) {
  return (
    <ErrorBoundary FallbackComponent={BrokenWidget} onError={reportWidgetRenderError}>
      {props.children}
    </ErrorBoundary>
  );
}

interface WidgetErrorBoundaryProps {
  children: ReactNode;
}

function WidgetContent(props: WidgetContentProps) {
  const state = useWidgetContentState(props);
  if (!state.widgetConfig) return;

  return (
    <div className="relative size-full rounded-xl animated no-scrollbar overflow-auto">
      {getWidgetByType(state.widgetConfig)}
    </div>
  );
}

type WidgetContentProps = WidgetProps;

function reportWidgetRenderError(error: unknown) {
  console.error(error);
  toast.error("Не удалось отобразить виджет");
}

function useWidgetContentState(props: WidgetContentProps) {
  return {
    widgetConfig: useAppSelector((state) => selectWidgetConfig(state, props.id)),
  };
}

function getWidgetByType(widgetConfig: WidgetConfig) {
  switch (widgetConfig.type) {
    case "layout":
      return <LayoutWidget {...widgetConfig} />;

    case "title":
      return <TitleWidget {...widgetConfig} />;

    case "graph":
      return <GraphWidget {...widgetConfig} />;

    case "map":
      return <MapWidget {...widgetConfig} />;

    case "slot":
      return <SlotWidget {...widgetConfig} />;

    default:
      throw getUnexpectedWidgetTypeError(widgetConfig);
  }
}
