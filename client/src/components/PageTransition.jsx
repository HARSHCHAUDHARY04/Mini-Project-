import React from "react";
import { motion } from "framer-motion";

export default function PageTransition({ children, keyProp }) {
  return (
    <motion.div
      key={keyProp}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
