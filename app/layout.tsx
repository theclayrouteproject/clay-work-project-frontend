"use client";

import "./globals.css";
import Navbar from "./components/Navbar";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useRef } from "react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const touchStartRef = useRef<{ x: number; y: number; canSwipe: boolean } | null>(null);

  const swipePaths = [
    "/",
    "/ceramics101",
    "/clays",
    "/glazes",
    "/market",
    "/resources",
    "/gallery",
    "/contact",
  ];

  const activeBasePath = swipePaths.find((path) => pathname === path || pathname.startsWith(`${path}/`));
  const activeIndex = activeBasePath ? swipePaths.indexOf(activeBasePath) : -1;

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.changedTouches[0];
    const target = event.target as HTMLElement | null;
    const tagName = target?.tagName?.toLowerCase();
    const canSwipe = !tagName || !["input", "textarea", "select", "option", "button"].includes(tagName);

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      canSwipe,
    };
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current?.canSwipe || activeIndex === -1) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    const minSwipeDistance = 70;
    if (absX < minSwipeDistance || absX <= absY * 1.2) return;

    if (deltaX < 0 && activeIndex < swipePaths.length - 1) {
      router.push(swipePaths[activeIndex + 1]);
      return;
    }

    if (deltaX > 0 && activeIndex > 0) {
      router.push(swipePaths[activeIndex - 1]);
    }
  };

  return (
    <html lang="en">
      <body className="bg-[#8D9158] text-[#F2E6C8] pt-20 relative">
        <div className="relative z-10">
          <Navbar />
          <div className="mx-auto mt-4 mb-2 w-[min(92%,56rem)] rounded-xl border border-[#F2E6C8]/30 bg-[#4A2F1C]/80 px-4 py-3 text-center">
            <p className="text-sm font-semibold tracking-wide text-[#F2E6C8]">AUTO MODE ACTIVE</p>
            <p className="mt-1 text-xs text-[#F2E6C8]/85">
              Discovery and ingest are running automatically while manual review stays disabled.
            </p>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {children}
            </motion.div>
          </AnimatePresence>
          <footer className="px-4 pb-6 text-center text-xs text-[#F2E6C8]/90 flex flex-col items-center gap-2">
            <Image
              src="/TCRP%20Logo_2.png"
              alt="The Clay Route Project logo"
              width={34}
              height={34}
              className="rounded-sm logo-trim-edge"
            />
            © The Clay Rout Project 2026 All Rights Reserved
          </footer>
        </div>
      </body>
    </html>
  );
}
