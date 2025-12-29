"use client";

import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import React from "react";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  sidebarContent: React.ReactNode;
  mainContent: React.ReactNode;
  defaultLayout?: number[];
}

const MainLayout: React.FC<MainLayoutProps> = ({
  sidebarContent,
  mainContent,
  defaultLayout = [25, 75],
}) => {
  return (
    <div className="h-screen w-full flex overflow-hidden">
      <aside className="w-[320px] min-w-[280px] max-w-[400px] flex flex-col p-4 bg-sidebar text-sidebar-foreground border-r overflow-y-auto">
        {sidebarContent}
      </aside>
      <main className="flex-1 h-full overflow-y-auto">
        {mainContent}
      </main>
    </div>
  );
};

export default MainLayout;