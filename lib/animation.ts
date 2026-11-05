import type { MotionProps } from "framer-motion";

const BEZIER_EASE = [0.16, 1, 0.3, 1] as const;

const BEZIER_TRANSITION = {
  opacity: { duration: 0.35, ease: BEZIER_EASE },
  scale: { duration: 0.35, ease: BEZIER_EASE },
};

export const FADE_IN_OUT_ANIMATION = {
  initial: "hidden",
  animate: "visible",
  exit: "exit",

  variants: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9, pointerEvents: "none" },
  },

  transition: BEZIER_TRANSITION,
} as const satisfies MotionProps;

export const FADE_OUT_ANIMATION = {
  initial: "visible",
  animate: "visible",
  exit: "exit",

  variants: {
    visible: { opacity: 1 },
    exit: { opacity: 0, pointerEvents: "none" },
  },

  transition: BEZIER_TRANSITION,
} as const satisfies MotionProps;

export const DELAYED_FADE_OUT_ANIMATION = {
  ...FADE_OUT_ANIMATION,
  transition: { opacity: { ...BEZIER_TRANSITION.opacity, delay: 0.7 } },
} as const satisfies MotionProps;

export const SPRING_RESIZE_ANIMATION = {
  layout: true,
  transition: { layout: { type: "spring", stiffness: 200, damping: 20 } },
} as const satisfies MotionProps;

export const SOFT_RESIZE_ANIMATION = {
  layout: true,
  transition: BEZIER_TRANSITION,
} as const satisfies MotionProps;

export function combineAnimations(animations?: readonly MotionProps[]): MotionProps {
  if (!animations?.length) return {};

  const combinedAnimation = animations.reduce<MotionProps>(
    (prev, cur) => ({
      ...prev,
      ...cur,
      transition: { ...prev.transition, ...cur.transition },
    }),
    {},
  );

  return combinedAnimation;
}
