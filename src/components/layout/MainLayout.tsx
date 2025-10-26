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
  defaultLayout = [20, 80],
}) => {
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="min-h-screen w-full rounded-lg border"
    >
      <ResizablePanel defaultSize={defaultLayout[0]} minSize={15} maxSize={30}>
        <div className="flex h-full flex-col p-4 bg-sidebar text-sidebar-foreground">
          {sidebarContent}
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={defaultLayout[1]}>
        <div className="flex h-full flex-col p-4 bg-background text-foreground">
          {mainContent}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default MainLayout;