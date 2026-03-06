"use client";

import { ThemeProvider } from "next-themes";
import { UserProvider } from "@/contexts/UserContext";
import { FontSizeProvider } from "@/contexts/FontSizeContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <FontSizeProvider>
        <UserProvider>{children}</UserProvider>
      </FontSizeProvider>
    </ThemeProvider>
  );
}
