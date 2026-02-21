"use client";

import { Provider } from "react-redux";
import { useEffect } from "react";
import { toast, Toaster } from "sonner";

import Widget from "@/components/Widget";
import type WidgetType from "@/lib/widget";
import { useAppSelector } from "@/state/hooks";
import { store } from "@/state/store";

export default function Home() {
  useEffect(() => {
    const rootWidget = localStorage.getItem("rootWidget");
    if (!rootWidget) return;

    toast.success("Дэшборд восстановлен из предыдущей сессии");
    store.dispatch({
      type: "widget/upsertWidget",
      payload: JSON.parse(rootWidget) as WidgetType,
    });
  }, []);

  return (
    <div className="w-full h-full p-4">
      <Provider store={store}>
        <Toaster />
        <RootWidget />
      </Provider>
    </div>
  );
}

function RootWidget() {
  const widget = useAppSelector((state) => state.widget.value);

  useEffect(() => {
    const keydown = (e: KeyboardEvent) => {
      if (e.key != "s" || !e.ctrlKey) return;
      e.preventDefault();
      saveWidgetToLocalStorage(widget);
      toast.success("Дэшборд сохранён между сессиями");
    };

    document.addEventListener("keydown", keydown);

    return () => document.removeEventListener("keydown", keydown);
  }, []);

  return <Widget {...widget} />;
}

function saveWidgetToLocalStorage(widget: WidgetType) {
  localStorage.setItem("rootWidget", JSON.stringify(widget));
}
