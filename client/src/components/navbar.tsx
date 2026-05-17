"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import ModeToggle from "@/components/mode-toggle";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";

export default function Navbar() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-white/20 dark:border-white/10 shadow-lg shadow-purple-500/5' 
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="container mx-auto flex justify-between items-center px-4 py-3">
        {/* Logo with hover effect */}
        <Link href="/" className="flex items-center gap-3 group">
          <motion.div 
            whileHover={{ scale: 1.05, rotate: -3 }}
            whileTap={{ scale: 0.95 }}
            className="relative w-9 h-9"
          >
            <Image
              src="/running-black.svg"
              alt="Runners List Logo"
              fill
              className={`object-contain transition-opacity duration-200 ${
                mounted && resolvedTheme === "dark" ? "opacity-0" : "opacity-100"
              }`}
            />
            <Image
              src="/running-white.svg"
              alt="Runners List Logo"
              fill
              className={`object-contain absolute inset-0 transition-opacity duration-200 ${
                mounted && resolvedTheme === "dark" ? "opacity-100" : "opacity-0"
              }`}
            />
          </motion.div>
          <div className="hidden sm:block">
            <motion.span 
              className="text-fluid-lg font-bold text-foreground block"
              whileHover={{ x: 2 }}
              transition={{ duration: 0.2 }}
            >
              Runners List
            </motion.span>
            <span className="block text-fluid-xs text-muted-foreground -mt-0.5">
              Malaysia
            </span>
          </div>
        </Link>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle with wrapper for animation */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ModeToggle />
          </motion.div>
        </div>
      </div>
    </motion.nav>
  );
}