"use client";

import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { BuildingOption } from "./BuildMenu";
import buildingTileset32 from "@/assets/vectoraith_tileset_farming_sim_essentials/32x32/Tilesets (Modular)/vectoraith_tileset_farmingsims_buildings_32x32.png";
import detailsTileset32 from "@/assets/vectoraith_tileset_farming_sim_essentials/32x32/Tilesets (Modular)/vectoraith_tileset_farmingsims_details_summer_32x32.png";
import buildingTileset48 from "@/assets/vectoraith_tileset_farming_sim_essentials/48x48/Tilesets (Modular)/vectoraith_tileset_farmingsims_buildings_48x48.png";
import detailsTileset48 from "@/assets/vectoraith_tileset_farming_sim_essentials/48x48/Tilesets (Modular)/vectoraith_tileset_farmingsims_details_summer_48x48.png";
import { ProductType, allProducts } from "@/utils/products";

// Tileset definitions
const TILESETS = [
  { id: "buildings_32", name: "Épületek (32x32)", src: buildingTileset32, tileSize: 32 },
  { id: "details_32", name: "Részletek (32x32)", src: detailsTileset32, tileSize: 32 },
  { id: "buildings_48", name: "Épületek (48x48)", src: buildingTileset48, tileSize: 48 },
  { id: "details_48", name: "Részletek (48x48)", src: detailsTileset48, tileSize: 48 },
];

interface BuildingDesignerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (building: BuildingOption) => void;
  initialData?: BuildingOption;
}

const BuildingDesigner: React.FC<BuildingDesignerProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [activeTab, setActiveTab] = useState("basics");

  // Basic Data
  const [name, setName] = useState("Új Épület");
  const [type, setType] = useState<"house" | "office">("house");
  const [width, setWidth] = useState(2);
  const [height, setHeight] = useState(2);
  const [cost, setCost] = useState(100);
  const [woodCost, setWoodCost] = useState(0);
  const [stoneCost, setStoneCost] = useState(0);
  const [brickCost, setBrickCost] = useState(0);
  const [capacity, setCapacity] = useState(2);
  const [constructionTime, setConstructionTime] = useState(5000);
  
  // Production Data
  const [produces, setProduces] = useState<ProductType | "none">("none");
  const [produceQuantity, setProduceQuantity] = useState(1);
  const [consumes, setConsumes] = useState<ProductType | "none">("none");
  const [consumeQuantity, setConsumeQuantity] = useState(1);
  const [productionDuration, setProductionDuration] = useState(10000);

  // Graphics selection
  const [resolution, setResolution] = useState<32 | 48>(32);
  const [selectedTilesetId, setSelectedTilesetId] = useState("buildings_32");
  const [tileX, setTileX] = useState(0);
  const [tileY, setTileY] = useState(0);
  
  // New graphics options
  const [imageSourceType, setImageSourceType] = useState<"tileset" | "url" | "file">("tileset");
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [customImageBase64, setCustomImageBase64] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load initial data
  useEffect(() => {
    if (initialData && isOpen) {
      setName(initialData.name);
      setType(initialData.customType || (initialData.category === "residential" ? "house" : "office"));
      setWidth(initialData.width);
      setHeight(initialData.height);
      setCost(initialData.cost);
      setWoodCost(initialData.woodCost || 0);
      setStoneCost(initialData.stoneCost || 0);
      setBrickCost(initialData.brickCost || 0);
      setCapacity(initialData.capacity || 0);
      setConstructionTime(initialData.duration);

      if (initialData.productionConfig) {
        setProduces(initialData.productionConfig.produces);
        setProduceQuantity(initialData.productionConfig.quantity);
        setConsumes(initialData.productionConfig.consumes || "none");
        setConsumeQuantity(initialData.productionConfig.consumesQuantity || 1);
        setProductionDuration(initialData.productionConfig.duration);
      } else {
        setProduces("none");
      }

      if (initialData.customGraphics) {
        const { tileset, x, y, customUrl, customBase64, tileSize } = initialData.customGraphics;
        
        if (tileSize === 48) setResolution(48);
        else setResolution(32);

        if (tileset === "custom_url" && customUrl) {
           setImageSourceType("url");
           setCustomImageUrl(customUrl);
        } else if (tileset === "custom_file" && customBase64) {
           setImageSourceType("file");
           setCustomImageBase64(customBase64);
        } else {
           setImageSourceType("tileset");
           setSelectedTilesetId(tileset || "buildings_32");
           setTileX(x || 0);
           setTileY(y || 0);
        }
      }
    } else if (isOpen && !initialData) {
        // Reset to defaults if opening as new
        setName("Új Épület");
        setType("house");
        setWidth(2);
        setHeight(2);
        setCost(100);
        setWoodCost(0);
        setStoneCost(0);
        setBrickCost(0);
        setCapacity(2);
        setConstructionTime(5000);
        setProduces("none");
        setImageSourceType("tileset");
        setSelectedTilesetId("buildings_32");
        setTileX(0);
        setTileY(0);
    }
  }, [initialData, isOpen]);

  // Filter tilesets by resolution and ensure selected tileset is valid
  const availableTilesets = TILESETS.filter(t => t.tileSize === resolution);
  
  useEffect(() => {
     // Reset selection if resolution changes and current selection is invalid
     if (imageSourceType === "tileset") {
        const current = TILESETS.find(t => t.id === selectedTilesetId);
        if (!current || current.tileSize !== resolution) {
            setSelectedTilesetId(availableTilesets[0]?.id || "buildings_32");
        }
     }
  }, [resolution, availableTilesets, selectedTilesetId, imageSourceType]);

  const selectedTileset = TILESETS.find(t => t.id === selectedTilesetId) || availableTilesets[0] || TILESETS[0];

  // Draw tileset for selection
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    // Determine source based on type
    if (imageSourceType === "tileset") {
        img.src = selectedTileset.src;
    } else if (imageSourceType === "url" && customImageUrl) {
        img.src = customImageUrl;
        // Enable CORS for external images if possible, though often fails without proxy
        img.crossOrigin = "Anonymous";
    } else if (imageSourceType === "file" && customImageBase64) {
        img.src = customImageBase64;
    } else {
        // Clear canvas if no valid source
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      // Draw selection rectangle
      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      
      const tileSize = imageSourceType === "tileset" ? selectedTileset.tileSize : resolution;

      ctx.strokeRect(
        tileX * tileSize, 
        tileY * tileSize, 
        width * tileSize, 
        height * tileSize
      );
    };
    
    // Handle error
    img.onerror = () => {
        // console.error("Could not load image");
    };

  }, [selectedTileset, tileX, tileY, width, height, isOpen, activeTab, imageSourceType, customImageUrl, customImageBase64, resolution]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const tileSize = imageSourceType === "tileset" ? selectedTileset.tileSize : resolution;

    const tx = Math.floor(x / tileSize);
    const ty = Math.floor(y / tileSize);
    
    setTileX(tx);
    setTileY(ty);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setCustomImageBase64(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleAutoCalculate = () => {
    // Basic heuristics
    const baseCost = width * height * 50;
    setCost(baseCost);
    setWoodCost(Math.floor(baseCost / 10));
    setStoneCost(Math.floor(baseCost / 20));
    setBrickCost(type === "office" ? Math.floor(baseCost / 15) : 0);
    setCapacity(width * height * (type === "house" ? 2 : 5));
    setConstructionTime(width * height * 2000);

    // Production heuristics
    if (type === "office") {
       setProductionDuration(width * height * 5000);
       setProduceQuantity(width * height * 2);
    }
  };

  const handleSave = () => {
    let customGraphics: BuildingOption['customGraphics'] = {
        tileset: selectedTilesetId,
        x: tileX,
        y: tileY,
        tileSize: resolution
    };

    if (imageSourceType === "url") {
        customGraphics = {
            tileset: "custom_url",
            customUrl: customImageUrl,
            x: tileX,
            y: tileY,
            tileSize: resolution
        };
    } else if (imageSourceType === "file") {
        customGraphics = {
            tileset: "custom_file",
            customBase64: customImageBase64 || undefined,
            x: tileX,
            y: tileY,
            tileSize: resolution
        };
    }

    const newBuilding: BuildingOption = {
      name,
      type: "custom",
      customType: type,
      category: type === "house" ? "residential" : "business",
      width,
      height,
      cost,
      woodCost,
      brickCost,
      stoneCost,
      capacity,
      duration: constructionTime,
      customGraphics,
      productionConfig: produces !== "none" ? {
        produces: produces as ProductType,
        quantity: produceQuantity,
        consumes: consumes !== "none" ? (consumes as ProductType) : undefined,
        consumesQuantity: consumes !== "none" ? consumeQuantity : undefined,
        duration: productionDuration,
      } : undefined
    };

    onSave(newBuilding);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 text-white border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-white">{initialData ? "Épület Módosítása" : "Új Épület Tervezése"}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800">
            <TabsTrigger value="basics" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400">Alapadatok</TabsTrigger>
            <TabsTrigger value="graphics" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400">Grafika</TabsTrigger>
            <TabsTrigger value="production" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400">Termelés</TabsTrigger>
          </TabsList>

          <TabsContent value="basics" className="space-y-4 py-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-4">
                  <div>
                    <Label className="text-slate-200">Épület Neve</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-slate-800 border-slate-700 text-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-200">Típus</Label>
                      <Select value={type} onValueChange={(v: any) => setType(v)}>
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700 text-white">
                          <SelectItem value="house">Lakóépület</SelectItem>
                          <SelectItem value="office">Munkahely</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                       <Label className="text-slate-200">Méret (Szél x Mag)</Label>
                       <div className="flex gap-2">
                         <Input type="number" min={1} max={5} value={width} onChange={e => setWidth(Number(e.target.value))} className="bg-slate-800 border-slate-700 text-white" />
                         <span className="py-2">x</span>
                         <Input type="number" min={1} max={5} value={height} onChange={e => setHeight(Number(e.target.value))} className="bg-slate-800 border-slate-700 text-white" />
                       </div>
                    </div>
                  </div>
                  <Button variant="outline" onClick={handleAutoCalculate} className="w-full border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white">
                    Költségek és Értékek Ajánlása
                  </Button>
               </div>
               <div className="grid grid-cols-2 gap-4 content-start">
                  <div>
                    <Label className="text-slate-200">Pénz Költség</Label>
                    <Input type="number" value={cost} onChange={e => setCost(Number(e.target.value))} className="bg-slate-800 border-slate-700 text-white" />
                  </div>
                  <div>
                    <Label className="text-slate-200">Építési Idő (ms)</Label>
                    <Input type="number" value={constructionTime} onChange={e => setConstructionTime(Number(e.target.value))} className="bg-slate-800 border-slate-700 text-white" />
                  </div>
                  <div>
                    <Label className="text-slate-200">Fa Költség</Label>
                    <Input type="number" value={woodCost} onChange={e => setWoodCost(Number(e.target.value))} className="bg-slate-800 border-slate-700 text-white" />
                  </div>
                  <div>
                    <Label className="text-slate-200">Kő Költség</Label>
                    <Input type="number" value={stoneCost} onChange={e => setStoneCost(Number(e.target.value))} className="bg-slate-800 border-slate-700 text-white" />
                  </div>
                  <div>
                    <Label className="text-slate-200">Tégla Költség</Label>
                    <Input type="number" value={brickCost} onChange={e => setBrickCost(Number(e.target.value))} className="bg-slate-800 border-slate-700 text-white" />
                  </div>
                  <div>
                    <Label className="text-slate-200">{type === "house" ? "Lakók Száma" : "Dolgozók Száma"}</Label>
                    <Input type="number" value={capacity} onChange={e => setCapacity(Number(e.target.value))} className="bg-slate-800 border-slate-700 text-white" />
                  </div>
               </div>
             </div>
          </TabsContent>

          <TabsContent value="graphics" className="space-y-4 py-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-4">
                  <div className="space-y-2">
                      <Label className="text-slate-200">Forrás Típusa</Label>
                      <RadioGroup value={imageSourceType} onValueChange={(v: any) => setImageSourceType(v)} className="flex gap-4">
                          <div className="flex items-center space-x-2">
                              <RadioGroupItem value="tileset" id="r-tileset" className="border-slate-400 text-white" />
                              <Label htmlFor="r-tileset" className="text-slate-200">Tileset</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                              <RadioGroupItem value="url" id="r-url" className="border-slate-400 text-white" />
                              <Label htmlFor="r-url" className="text-slate-200">Kép URL</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                              <RadioGroupItem value="file" id="r-file" className="border-slate-400 text-white" />
                              <Label htmlFor="r-file" className="text-slate-200">Fájl Feltöltés</Label>
                          </div>
                      </RadioGroup>
                  </div>

                  <div className="space-y-2">
                      <Label className="text-slate-200">Felbontás / Grid Méret</Label>
                      <Select value={String(resolution)} onValueChange={(v) => setResolution(Number(v) as 32 | 48)}>
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700 text-white">
                          <SelectItem value="32">32x32 pixel</SelectItem>
                          <SelectItem value="48">48x48 pixel</SelectItem>
                        </SelectContent>
                      </Select>
                  </div>

                  {imageSourceType === "tileset" && (
                      <div className="space-y-2">
                        <Label className="text-slate-200">Tileset Kiválasztása</Label>
                        <Select value={selectedTilesetId} onValueChange={setSelectedTilesetId}>
                            <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700 text-white">
                            {availableTilesets.map(t => (
                                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                      </div>
                  )}

                  {imageSourceType === "url" && (
                      <div className="space-y-2">
                          <Label className="text-slate-200">Kép URL címe</Label>
                          <Input value={customImageUrl} onChange={(e) => setCustomImageUrl(e.target.value)} placeholder="https://example.com/image.png" className="bg-slate-800 border-slate-700 text-white" />
                      </div>
                  )}

                  {imageSourceType === "file" && (
                      <div className="space-y-2">
                          <Label className="text-slate-200">Képfájl kiválasztása</Label>
                          <Input type="file" accept="image/*" onChange={handleFileUpload} className="bg-slate-800 border-slate-700 text-white" />
                      </div>
                  )}

                  <p className="text-sm text-slate-400 mt-4">
                    Kattints a jobb oldali képre a pozíció kiválasztásához! A piros keret jelzi a kiválasztott területet.
                    Ha saját képet használsz, akkor is ki kell jelölnöd a megfelelő területet.
                  </p>
               </div>
               <div className="border border-slate-700 rounded overflow-auto max-h-[400px] bg-slate-800 flex items-center justify-center">
                  <canvas 
                    ref={canvasRef} 
                    onClick={handleCanvasClick}
                    className="cursor-crosshair shadow-lg"
                  />
               </div>
            </div>
          </TabsContent>

          <TabsContent value="production" className="space-y-4 py-4">
            <div className="space-y-4">
              <p className="text-sm text-slate-400">
                Itt állíthatod be, hogy az épület milyen terméket állítson elő, és ehhez milyen alapanyagot használjon fel.
                Csak "Munkahely" típusú épületeknél értelmezhető.
              </p>

              {type !== "office" && (
                <div className="p-4 bg-yellow-900/30 text-yellow-200 rounded border border-yellow-900">
                  Figyelem: A termelés beállítása csak Munkahely típusú épületeknél aktív!
                </div>
              )}

              <div className={type !== "office" ? "opacity-50 pointer-events-none" : ""}>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4 border border-slate-700 p-4 rounded">
                       <h3 className="font-semibold text-white">Termelés (Kimenet)</h3>
                       <div>
                         <Label className="text-slate-200">Termelt Áru</Label>
                         <Select value={produces} onValueChange={(v: any) => setProduces(v)}>
                           <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                           <SelectContent className="bg-slate-800 border-slate-700 text-white">
                             <SelectItem value="none">Nincs termelés</SelectItem>
                             {allProducts.map(p => (
                               <SelectItem key={p.type} value={p.type}>{p.name}</SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                       </div>
                       {produces !== "none" && (
                         <div>
                           <Label className="text-slate-200">Mennyiség (per ciklus)</Label>
                           <Input type="number" min={1} value={produceQuantity} onChange={e => setProduceQuantity(Number(e.target.value))} className="bg-slate-800 border-slate-700 text-white" />
                         </div>
                       )}
                    </div>

                    <div className="space-y-4 border border-slate-700 p-4 rounded">
                       <h3 className="font-semibold text-white">Felhasználás (Bemenet) - Opcionális</h3>
                       <div>
                         <Label className="text-slate-200">Szükséges Alapanyag</Label>
                         <Select value={consumes} onValueChange={(v: any) => setConsumes(v)}>
                           <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                           <SelectContent className="bg-slate-800 border-slate-700 text-white">
                             <SelectItem value="none">Nincs szükség alapanyagra</SelectItem>
                             {allProducts.map(p => (
                               <SelectItem key={p.type} value={p.type}>{p.name}</SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                       </div>
                       {consumes !== "none" && (
                         <div>
                           <Label className="text-slate-200">Mennyiség (per ciklus)</Label>
                           <Input type="number" min={1} value={consumeQuantity} onChange={e => setConsumeQuantity(Number(e.target.value))} className="bg-slate-800 border-slate-700 text-white" />
                         </div>
                       )}
                    </div>
                 </div>

                 <div className="mt-4">
                   <Label className="text-slate-200">Gyártási Ciklus Ideje (ms)</Label>
                   <Input type="number" min={1000} step={1000} value={productionDuration} onChange={e => setProductionDuration(Number(e.target.value))} className="bg-slate-800 border-slate-700 text-white" />
                   <p className="text-xs text-slate-400 mt-1">Hány ezredmásodperc alatt készül el a termék.</p>
                 </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-slate-300 hover:text-white hover:bg-slate-800">Mégsem</Button>
          <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white">{initialData ? "Módosítások Mentése" : "Épület Létrehozása"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BuildingDesigner;
