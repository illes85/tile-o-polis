import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react";
import BuildingDesigner from "@/components/BuildingDesigner";
import { BuildingOption } from "@/components/BuildMenu";
import { showSuccess } from "@/utils/toast";
import { availableBuildingOptions } from "@/utils/gameData";

const BuildingDesignerScreen: React.FC = () => {
  const navigate = useNavigate();
  const [customBuildings, setCustomBuildings] = useState<BuildingOption[]>(() => {
    const saved = localStorage.getItem("customBuildings");
    return saved ? JSON.parse(saved) : [];
  });
  
  const [isDesignerOpen, setIsDesignerOpen] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<BuildingOption | undefined>(undefined);
  const [editingIndex, setEditingIndex] = useState<number>(-1);

  useEffect(() => {
    localStorage.setItem("customBuildings", JSON.stringify(customBuildings));
  }, [customBuildings]);

  const handleCreateNew = () => {
    setEditingBuilding(undefined);
    setEditingIndex(-1);
    setIsDesignerOpen(true);
  };

  const handleEdit = (building: BuildingOption, index: number) => {
    setEditingBuilding(building);
    setEditingIndex(index);
    setIsDesignerOpen(true);
  };

  const handleDelete = (index: number) => {
    if (confirm("Biztosan törölni szeretnéd ezt az épületet?")) {
      const newBuildings = [...customBuildings];
      newBuildings.splice(index, 1);
      setCustomBuildings(newBuildings);
      showSuccess("Épület törölve!");
    }
  };

  const handleSaveBuilding = (building: BuildingOption) => {
    const newBuildings = [...customBuildings];
    if (editingIndex >= 0) {
      newBuildings[editingIndex] = building;
      showSuccess("Épület módosítva!");
    } else {
      // If editingIndex is -1 (new) or -2 (default), we create a new custom building
      newBuildings.push(building);
      showSuccess("Új egyedi épület létrehozva!");
    }
    setCustomBuildings(newBuildings);
    setIsDesignerOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-3xl font-bold">Épülettervező</h1>
          </div>
          <Button onClick={handleCreateNew} className="bg-green-600 hover:bg-green-700">
            <Plus className="mr-2 h-4 w-4" /> Új Épület
          </Button>
        </div>

        <div>
            <h2 className="text-xl font-bold mb-4 text-slate-300">Egyedi Épületek</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {customBuildings.length === 0 ? (
                <div className="col-span-full text-center py-6 text-slate-500 bg-slate-900/50 rounded-lg border border-slate-800 border-dashed">
                <p>Még nincsenek egyedi épületeid.</p>
                </div>
            ) : (
                customBuildings.map((building, index) => (
                <Card key={`custom-${index}`} className="bg-slate-900 border-slate-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium text-white">{building.name}</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-400" onClick={() => handleEdit(building, index)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400" onClick={() => handleDelete(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-slate-300 space-y-1">
                    <p>Típus: {building.category === "residential" ? "Lakóépület" : "Vállalkozás"}</p>
                    <p>Méret: {building.width}x{building.height}</p>
                        <p>Költség: {building.cost} pénz</p>
                        {building.customGraphics && (
                            <div className="mt-4 p-2 bg-slate-800 rounded flex justify-center">
                                <span className="text-xs">Grafika: {building.customGraphics.tileset === "custom_url" || building.customGraphics.tileset === "custom_file" ? "Egyedi kép" : "Tileset"}</span>
                            </div>
                        )}
                    </div>
                    </CardContent>
                </Card>
                ))
            )}
            </div>
        </div>

        <div>
            <h2 className="text-xl font-bold mb-4 text-slate-300">Alapértelmezett Épületek (Sablonként szerkeszthető)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {availableBuildingOptions.map((building, index) => (
                <Card key={`default-${index}`} className="bg-slate-900/50 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-medium">{building.name}</CardTitle>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-400" onClick={() => handleEdit(building, -2)}> {/* -2 indicates default building (new copy) */}
                        <Pencil className="h-4 w-4" />
                    </Button>
                    </CardHeader>
                    <CardContent>
                    <div className="text-sm text-slate-400 space-y-1">
                        <p>Típus: {building.category === "residential" ? "Lakóépület" : "Vállalkozás"}</p>
                        <p>Méret: {building.width}x{building.height}</p>
                        <p>Költség: {building.cost} pénz</p>
                    </div>
                    </CardContent>
                </Card>
                ))}
            </div>
        </div>

        {isDesignerOpen && (
          <BuildingDesigner
            isOpen={isDesignerOpen}
            onClose={() => setIsDesignerOpen(false)}
            onSave={handleSaveBuilding}
            initialData={editingBuilding}
          />
        )}
      </div>
    </div>
  );
};

export default BuildingDesignerScreen;
