"use client";

import { ReactNode } from "react";
import { TreeProvider } from "@/contexts/TreeContext";
import Header from "@/components/Header";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <TreeProvider>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </TreeProvider>
  );
}
