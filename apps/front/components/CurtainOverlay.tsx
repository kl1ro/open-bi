import { motion } from "framer-motion";

import { FADE_OUT_ANIMATION } from "@/lib/animation";

export default function CurtainOverlay() {
  return (
    <motion.div
      {...FADE_OUT_ANIMATION}
      className="absolute inset-0 rounded-xl bg-medium"
    />
  );
}
