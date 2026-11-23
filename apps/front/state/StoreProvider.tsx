"use client";

import { type ReactNode, useRef } from "react";
import { Provider } from "react-redux";

import { makeStore, type AppStore, type RootState } from "@/state/store";

export default function StoreProvider(props: StoreProviderProps) {
  const store = usePerProviderStore(props.preloadedState);
  return <Provider store={store}>{props.children}</Provider>;
}

export interface StoreProviderProps {
  preloadedState?: Partial<RootState>;
  children: ReactNode;
}

function usePerProviderStore(preloadedState?: Partial<RootState>) {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) storeRef.current = makeStore(preloadedState);
  return storeRef.current;
}
