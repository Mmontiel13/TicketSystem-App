"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { SidebarNav } from "@/components/sidebar/SidebarNav";
import { SidebarFooter } from "@/components/sidebar/SidebarFooter";

function AsiatechMark({ isDark }: { isDark: boolean }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Image
      src="/logodark.svg"
      alt="asiatech logo"
      width={100}
      height={40}
      className="object-contain mx-auto"
      style={{
        filter: isDark ? "brightness(0) invert(1)" : "none",
      }}
    />
  );
}

export function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const { resolvedTheme } = useTheme();
  const isDark = (resolvedTheme ?? "dark") === "dark";

  return (
    <div className="flex flex-col h-full">
      <div className="h-16 flex items-center justify-center px-5 border-b border-border/50 text-foreground">
        <AsiatechMark isDark={isDark} />
      </div>

      <SidebarNav onNavClick={onNavClick} />
      {/* ✅ Footer sin props */}
      <SidebarFooter />
    </div>
  );
}