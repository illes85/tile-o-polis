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
    <ResizablePanelGroup
      direction="horizontal"
      className="h-screen w-full rounded-lg border overflow-hidden"
    >
      <ResizablePanel defaultSize={defaultLayout[0]} minSize={20} maxSize={35}>
        <div className="flex h-full flex-col p-4 bg-sidebar text-sidebar-foreground overflow-y-auto min-h-0">
          {sidebarContent}
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={defaultLayout[1]}>
        <div className="flex h-full flex-col p-4 bg-background text-foreground overflow-hidden">
          {mainContent}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default MainLayout;