"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import MainLayout from "@/components/layout/MainLayout";
import PlayerInfo from "@/components/PlayerInfo";
import { MadeWithDyad } from "@/components/made-with-dyad";
import Map, { BuildingData } from "@/components/Map";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import BuildMenu, { BuildingOption } from "@/components/BuildMenu";
import MusicPlayer from "@/components/MusicPlayer";
import SfxPlayer, { SfxPlayerRef } from "@/components/SfxPlayer";
import { musicTracks } from "@/utils/musicFiles";
import { sfxUrls } from "@/utils/sfxFiles";
import PlayerSettings from "@/components/PlayerSettings";
import { RotateCw, ChevronLeft, ChevronRight, Sprout, Coins, Building as BuildingIcon, Route, Wrench, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { allProducts, ProductType, getProductByType } from "@/utils/products";
import FarmlandActionDialog from "@/components/FarmlandActionDialog";
import { CropType, FarmlandTile } from "@/components/Building";
import ShopMenu from "@/components/ShopMenu";

import { useNavigate, useLocation } from "react-router-dom";
import MoneyHistory, { Transaction } from "@/components/MoneyHistory";

// ... (konstansok, interfészek, elérhető épületek - változatlanok) ...

const Game = () => {
  // ... (state változók - változatlanok) ...

  // ... (useEffect, segédfüggvények - változatlanok) ...

  // ... (handler függvények - változatlanok) ...

  const mainContent = (
    <div
      ref={mainContentRef}
      className="flex flex-col h-full items-center justify-center relative overflow-hidden"
    >
      {/* Navigációs gombok a térkép szélein */}
      
      {/* Felső gomb - Teljes szélességű */}
      <Button
        variant="outline"
        className="absolute top-0 left-0 right-0 z-10 bg-white/80 hover:bg-white rounded-none h-8" // rounded-none, h-8, top-0, left-0, right-0
        onClick={() => moveViewport(0, 1)} // Fel (pozitív Y eltolás)
        aria-label="Térkép mozgatása felfelé"
      >
        <ChevronUp className="h-5 w-5" />
      </Button>
      
      {/* Alsó gomb - Teljes szélességű */}
      <Button
        variant="outline"
        className="absolute bottom-0 left-0 right-0 z-10 bg-white/80 hover:bg-white rounded-none h-8" // rounded-none, h-8, bottom-0, left-0, right-0
        onClick={() => moveViewport(0, -1)} // Le (negatív Y eltolás)
        aria-label="Térkép mozgatása lefelé"
      >
        <ChevronDown className="h-5 w-5" />
      </Button>
      
      {/* Bal gomb - Teljes magasságú */}
      <Button
        variant="outline"
        className="absolute left-0 top-0 bottom-0 z-10 bg-white/80 hover:bg-white rounded-none w-8" // rounded-none, w-8, left-0, top-0, bottom-0
        onClick={() => moveViewport(1, 0)} // Balra (pozitív X eltolás)
        aria-label="Térkép mozgatása balra"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      
      {/* Jobb gomb - Teljes magasságú */}
      <Button
        variant="outline"
        className="absolute right-0 top-0 bottom-0 z-10 bg-white/80 hover:bg-white rounded-none w-8" // rounded-none, w-8, right-0, top-0, bottom-0
        onClick={() => moveViewport(-1, 0)} // Jobbra (negatív X eltolás)
        aria-label="Térkép mozgatása jobbra"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>

      <div className="flex-grow flex items-center justify-center">
        <Map
          buildings={buildings}
          gridSize={MAP_GRID_SIZE}
          cellSizePx={CELL_SIZE_PX}
          onBuildingClick={handleBuildingClick}
          isPlacingBuilding={isPlacingBuilding}
          buildingToPlace={buildingToPlace}
          ghostBuildingCoords={ghostBuildingCoords}
          onGridMouseMove={handleGridMouseMove}
          onMapClick={handleMapClick}
          currentPlayerId={currentPlayerId}
          currentBuildingRotation={currentBuildingRotation}
          isPlacingFarmland={isPlacingFarmland}
          selectedFarmId={selectedFarmId}
          onFarmlandClick={handleFarmlandClick}
          ghostFarmlandTiles={ghostFarmlandTiles}
          isPlacingRoad={isPlacingRoad}
          ghostRoadTiles={ghostRoadTiles}
          isDemolishingRoad={isDemolishingRoad}
          mapOffsetX={mapOffsetX}
          mapOffsetY={mapOffsetY}
          isPlacementMode={isPlacementMode}
        />
      </div>

      {/* ... (dialógusok - változatlanok) ... */}

    </div>
  );

  return <MainLayout sidebarContent={sidebarContent} mainContent={mainContent} />;
};

export default Game;