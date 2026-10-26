import { combineReducers, configureStore } from "@reduxjs/toolkit";

import dashboard from "./features/dashboard";

const rootReducer = combineReducers({
  dashboard,
});

export function makeStore(preloadedState?: Partial<RootState>) {
  return configureStore({ reducer: rootReducer, preloadedState });
}

export type RootState = ReturnType<typeof rootReducer>;
export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore["dispatch"];
