import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

import { FADE_IN_OUT_ANIMATION, combineAnimations } from "@/lib/animation";

export default function LoadingWidget() {
  const state = useLoadingWidgetState();
  useLoadingWidgetEffects(state);

  return (
    <div className="relative size-full flex justify-center items-center text-center">
      <div className="absolute inset-0 rounded-xl bg-muted animate-pulse" />

      <AnimatePresence>
        {state.isTakingLong.value && (
          <motion.p
            {...combineAnimations([FADE_IN_OUT_ANIMATION])}
            className="relative text-sm text-muted-foreground"
          >
            Загружается дольше обычного…
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function useLoadingWidgetState() {
  return {
    isTakingLong: useIsTakingLong(),
  };
}

function useLoadingWidgetEffects(deps: UseLoadingWidgetEffectsDeps) {
  useLongLoadingNoticeEffect(deps);
}

interface UseLoadingWidgetEffectsDeps {
  isTakingLong: IsTakingLongState;
}

function useIsTakingLong() {
  const [value, set] = useState(false);
  return { value, set };
}

type IsTakingLongState = ReturnType<typeof useIsTakingLong>;

function useLongLoadingNoticeEffect(deps: UseLongLoadingNoticeEffectDeps) {
  useEffect(() => scheduleLongLoadingNotice(deps), []);
}

interface UseLongLoadingNoticeEffectDeps {
  isTakingLong: IsTakingLongState;
}

function scheduleLongLoadingNotice(deps: ScheduleLongLoadingNoticeDeps) {
  const timeout = setTimeout(() => deps.isTakingLong.set(true), LONG_LOADING_DELAY);
  return () => clearTimeout(timeout);
}

interface ScheduleLongLoadingNoticeDeps {
  isTakingLong: IsTakingLongState;
}

const LONG_LOADING_DELAY = 3000;
