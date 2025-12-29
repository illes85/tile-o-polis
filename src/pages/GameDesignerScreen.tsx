import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { showSuccess } from "@/utils/toast";

const GameDesignerScreen = () => {
  const navigate = useNavigate();
  const [cycleTime, setCycleTime] = useState(30);
  const [winMoney, setWinMoney] = useState(0);
  const [winCompanies, setWinCompanies] = useState(0);
  const [loseInsolvencyCycles, setLoseInsolvencyCycles] = useState(0);

  useEffect(() => {
    const savedCycleTime = localStorage.getItem("gameRules_cycleTime");
    const savedWinMoney = localStorage.getItem("gameRules_winMoney");
    const savedWinCompanies = localStorage.getItem("gameRules_winCompanies");
    const savedLoseInsolvencyCycles = localStorage.getItem("gameRules_loseInsolvencyCycles");

    if (savedCycleTime) setCycleTime(parseInt(savedCycleTime, 10) / 1000); // Convert ms to s
    if (savedWinMoney) setWinMoney(parseInt(savedWinMoney, 10));
    if (savedWinCompanies) setWinCompanies(parseInt(savedWinCompanies, 10));
    if (savedLoseInsolvencyCycles) setLoseInsolvencyCycles(parseInt(savedLoseInsolvencyCycles, 10));
  }, []);

  const handleSave = () => {
    localStorage.setItem("gameRules_cycleTime", (cycleTime * 1000).toString());
    localStorage.setItem("gameRules_winMoney", winMoney.toString());
    localStorage.setItem("gameRules_winCompanies", winCompanies.toString());
    localStorage.setItem("gameRules_loseInsolvencyCycles", loseInsolvencyCycles.toString());
    showSuccess("Játékszabályok mentve!");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <Button variant="ghost" onClick={() => navigate("/")} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Vissza a menübe
      </Button>
      
      <div className="max-w-2xl mx-auto">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-2xl text-cyan-400">Játéktervező</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="space-y-2">
              <Label className="text-slate-200">Gazdasági ciklus ideje (másodperc)</Label>
              <Input 
                type="number" 
                value={cycleTime} 
                onChange={(e) => setCycleTime(parseInt(e.target.value) || 0)} 
                className="bg-slate-800 border-slate-700 text-white"
              />
              <p className="text-xs text-gray-400">Milyen gyakran kelljen bért/fizetést fizetni.</p>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-200">Győzelmi feltétel: Pénzösszeg</Label>
              <Input 
                type="number" 
                value={winMoney} 
                onChange={(e) => setWinMoney(parseInt(e.target.value) || 0)} 
                className="bg-slate-800 border-slate-700 text-white"
              />
              <p className="text-xs text-gray-400">Ha 0, nincs ilyen feltétel.</p>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-200">Győzelmi feltétel: Vállalatok száma</Label>
              <Input 
                type="number" 
                value={winCompanies} 
                onChange={(e) => setWinCompanies(parseInt(e.target.value) || 0)} 
                className="bg-slate-800 border-slate-700 text-white"
              />
              <p className="text-xs text-gray-400">Ha 0, nincs ilyen feltétel.</p>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-200">Vereség feltétel: Fizetésképtelenség (ciklusok száma)</Label>
              <Input 
                type="number" 
                value={loseInsolvencyCycles} 
                onChange={(e) => setLoseInsolvencyCycles(parseInt(e.target.value) || 0)} 
                className="bg-slate-800 border-slate-700 text-white"
              />
              <p className="text-xs text-gray-400">Hány ciklus után veszít a játékos, ha mínuszban van az egyenlege. Ha 0, nincs vereség.</p>
            </div>

            <Button onClick={handleSave} className="w-full bg-cyan-600 hover:bg-cyan-700 mt-4">
              <Save className="mr-2 h-4 w-4" /> Mentés
            </Button>

          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GameDesignerScreen;
