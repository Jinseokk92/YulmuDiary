"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface FloatingYulmuProps {
  src?: string;
  width?: number;
  height?: number;
}

const animate = {
  y: [0, -20, 0],
  rotate: [-5, 5, -5],
};

const transition = {
  duration: 3.5,
  ease: "easeInOut" as const,
  repeat: Infinity,
  repeatType: "reverse" as const,
};

export default function FloatingYulmu({
  src = "/icons/Smiling_Yulmu.png",
  width = 180,
  height = 270,
}: FloatingYulmuProps) {
  return (
    <div className="relative z-50 flex items-center justify-center">
      <motion.div
        initial={{ y: 0, rotate: 0 }}
        animate={animate}
        transition={transition}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.93 }}
        className="cursor-pointer"
      >
        <Image
          src={src}
          alt="율무"
          width={width}
          height={height}
          className="object-contain drop-shadow-xl w-auto h-auto"
          priority
        />
      </motion.div>
    </div>
  );
}
