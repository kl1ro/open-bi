import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

import {
  DELAYED_FADE_OUT_ANIMATION,
  FADE_IN_OUT_ANIMATION,
  FADE_OUT_ANIMATION,
} from "@/lib/animation";

export default function LoadingOverlay() {
  const state = useLoadingWidgetState();
  useLoadingWidgetEffects(state);

  return (
    <motion.div
      {...DELAYED_FADE_OUT_ANIMATION}
      className="absolute inset-0 overflow-hidden rounded-xl bg-white/5 ring-1 ring-inset ring-white/10 backdrop-blur-xl"
    >
      <div className="relative size-full flex justify-center items-center text-center">
        <motion.div {...FADE_OUT_ANIMATION} className="absolute inset-0 bg-medium" />
        <div className="absolute inset-y-0 left-0 w-1/3 -skew-x-20 bg-linear-to-r from-transparent via-white/15 to-transparent motion-safe:animate-glare-sweep" />

        <AnimatePresence>
          {state.isTakingLong.value && (
            <motion.p
              {...FADE_IN_OUT_ANIMATION}
              className="relative text-sm text-muted-foreground"
            >
              Загружается дольше обычного…
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
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
