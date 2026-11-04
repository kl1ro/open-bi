import type { FallbackProps } from "react-error-boundary";

import { Button } from "@/components/ui/button";
import { NoWidgetTypeError, NonexistentWidgetTypeError } from "@/components/Widget";
import { ItemConfigNotFoundError, WidgetConfigNotFoundError } from "@/lib/widget";
import { NoLayoutTypeError, NonexistentLayoutTypeError } from "@/lib/widgets/layout";
import { NoGraphTypeError, NonexistentGraphTypeError } from "@/lib/widgets/graph";
import { YandexMapsNotLoadedError } from "@/lib/yandex-maps";

export default function BrokenWidget(props: FallbackProps) {
  return (
    <div className="size-full flex flex-col gap-3 justify-center items-center text-center rounded-xl bg-red-600/10 ring-1 ring-inset ring-red-600/40 text-red-400">
      {getBrokenWidgetMessage(props.error)}

      {isServiceLoadError(props.error) && (
        <Button onClick={props.resetErrorBoundary} className="cursor-pointer">
          Попробовать снова
        </Button>
      )}
    </div>
  );
}

function getBrokenWidgetMessage(error: unknown) {
  if (isServiceLoadError(error)) return "Не удалось загрузить внешний сервис";
  if (isCorruptedDataError(error)) return "Повреждены данные";
  return "Не удалось отобразить виджет";
}

function isServiceLoadError(error: unknown) {
  const serviceLoadErrors = [YandexMapsNotLoadedError];
  return serviceLoadErrors.some((errorClass) => error instanceof errorClass);
}

function isCorruptedDataError(error: unknown) {
  const corruptedDataErrors = [
    WidgetConfigNotFoundError,
    ItemConfigNotFoundError,
    NoWidgetTypeError,
    NonexistentWidgetTypeError,
    NoLayoutTypeError,
    NonexistentLayoutTypeError,
    NoGraphTypeError,
    NonexistentGraphTypeError,
  ];

  return corruptedDataErrors.some((errorClass) => error instanceof errorClass);
}
