"use client";

import { ThemeProvider } from "next-themes";
import { UserProvider } from "@/contexts/UserContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <UserProvider>{children}</UserProvider>
    </ThemeProvider>
  );
}
