"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import * as SimpleIcons from "simple-icons";

export default function Footer() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Wait for client-side hydration to avoid flash
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <footer className="relative border-t border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-xl mt-16">
      {/* Gradient accent */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Branding */}
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <div className="relative w-7 h-7">
                {/* Show both logos, use CSS to toggle visibility */}
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
              </div>
              <span className="text-lg font-bold text-foreground">
                Runners List
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              Your comprehensive guide to running events across Malaysia.
            </p>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            <Link
              href="https://github.com/aniqaqill"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-muted-foreground hover:text-foreground hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
              aria-label="GitHub"
            >
              <svg
                role="img"
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d={SimpleIcons.siGithub.path} />
              </svg>
            </Link>
            <Link
              href="https://twitter.com/fmt_aniq"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-muted-foreground hover:text-foreground hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
              aria-label="Twitter"
            >
              <svg
                role="img"
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d={SimpleIcons.siX.path} />
              </svg>
            </Link>
            <Link
              href="mailto:scriptaniq@gmail.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-muted-foreground hover:text-foreground hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
              aria-label="Email"
            >
              <svg
                role="img"
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d={SimpleIcons.siGmail.path} />
              </svg>
            </Link>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Runners List. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Data sourced from{" "}
            <a
              href="https://pm1.blogspot.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-500 hover:underline"
            >
              PM1 Blog
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}