"use client";

import { useRef } from "react";
import { Provider } from "react-redux";

import { makeStore, type AppStore, type RootState } from "./store";

export default function StoreProvider(props: StoreProviderProps) {
  const store = usePerProviderStore(props.preloadedState);
  return <Provider store={store}>{props.children}</Provider>;
}

function usePerProviderStore(preloadedState?: Partial<RootState>) {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) storeRef.current = makeStore(preloadedState);
  return storeRef.current;
}

type StoreProviderProps = {
  preloadedState?: Partial<RootState>;
  children: React.ReactNode;
};
