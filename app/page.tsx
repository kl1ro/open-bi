"use client";

import { Provider } from "react-redux";
import { useEffect } from "react";
import { toast, Toaster } from "sonner";

import Widget from "@/components/Widget";
import type WidgetType from "@/lib/widget";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { upsertWidget } from "@/state/features/widget";
import { store } from "@/state/store";

export default function Home() {
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
  const dispatch = useAppDispatch();
  const widget = useAppSelector((state) => state.widget.value);

  useEffect(() => {
    const keydown = (e: KeyboardEvent) => {
      if (e.key != "s" || !e.ctrlKey) return;
      e.preventDefault();
      saveWidgetToLocalStorage(store.getState().widget.value);
      toast.success("Дэшборд сохранён между сессиями");
    };

    document.addEventListener("keydown", keydown);

    return () => document.removeEventListener("keydown", keydown);
  }, []);

  useEffect(() => {
    const rootWidget = localStorage.getItem("rootWidget");
    if (!rootWidget) return;

    toast.success("Дэшборд восстановлен из предыдущей сессии");
    dispatch(upsertWidget(JSON.parse(rootWidget) as WidgetType));
  }, []);

  return <Widget {...widget} />;
}

function saveWidgetToLocalStorage(widget: WidgetType) {
  localStorage.setItem("rootWidget", JSON.stringify(widget));
}
