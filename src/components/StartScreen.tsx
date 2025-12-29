import React from 'react';
import { Button } from "@/components/ui/button";
import { Building, Trees, Wheat } from "lucide-react";

interface StartScreenProps {
  onStart: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-green-800 to-blue-900 text-white">
      {/* Háttér minta */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[length:32px_32px]" />
      
      <div className="relative z-10 flex flex-col items-center text-center p-12 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl max-w-2xl w-full mx-4 animate-in fade-in zoom-in duration-700">
        <div className="flex gap-6 mb-8 text-yellow-400 animate-bounce delay-75 duration-1000">
          <Building className="w-16 h-16 drop-shadow-lg" />
          <Trees className="w-16 h-16 drop-shadow-lg" />
          <Wheat className="w-16 h-16 drop-shadow-lg" />
        </div>
        
        <h1 className="text-7xl font-extrabold mb-6 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-amber-500 drop-shadow-sm filter">
          Tile-o-Polis
        </h1>
        
        <p className="text-2xl text-gray-100 mb-10 max-w-lg font-light leading-relaxed">
          Építsd fel álmaid városát, gazdálkodj, kereskedj és válj a vidék leggazdagabb polgármesterévé!
        </p>

        <div className="space-y-6 w-full max-w-sm">
          <Button 
            size="lg" 
            className="w-full h-14 text-xl font-bold bg-gradient-to-r from-green-500 to-emerald-700 hover:from-green-600 hover:to-emerald-800 text-white shadow-xl transition-all hover:scale-105 border-2 border-green-400/30"
            onClick={onStart}
          >
            Játék Indítása
          </Button>
          
          <div className="pt-2 text-sm text-gray-300 italic">
            "Minden nagy város egyetlen téglával kezdődik..."
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-6 text-sm text-gray-400 font-mono">
        v1.0.0 • Tile-o-Polis
      </div>
    </div>
  );
};

export default StartScreen;
