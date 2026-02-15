"use client";

import { Provider } from "react-redux";

import Widget from "@/components/Widget";
import { useAppSelector } from "@/state/hooks";
import { store } from "@/state/store";

export default function Home() {
  return (
    <div className="w-full h-full p-4">
      <Provider store={store}>
        <RootWidget />
      </Provider>
    </div>
  );
}

function RootWidget() {
  const widget = useAppSelector((state) => state.widget.value);
  console.log(widget);
  return <Widget {...widget} />;
}
