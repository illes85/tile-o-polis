import { useState, useEffect } from 'react';
import { 
  MillProcess, PopcornProcess, CustomProcess, 
  BuildingData, Player, ProductType 
} from '../types/gameTypes';
import { availableBuildingOptions } from '../utils/gameData';
import { showSuccess, showError } from '../utils/toast';

interface UseProcessLogicProps {
  buildings: BuildingData[];
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  customBuildings: any[];
  initialMillProcesses?: MillProcess[];
  initialPopcornProcesses?: PopcornProcess[];
  initialCustomProcesses?: CustomProcess[];
}

export const useProcessLogic = ({
  buildings,
  players,
  setPlayers,
  customBuildings,
  initialMillProcesses = [],
  initialPopcornProcesses = [],
  initialCustomProcesses = []
}: UseProcessLogicProps) => {
  const [millProcesses, setMillProcesses] = useState<MillProcess[]>(initialMillProcesses);
  const [popcornProcesses, setPopcornProcesses] = useState<PopcornProcess[]>(initialPopcornProcesses);
  const [customProcesses, setCustomProcesses] = useState<CustomProcess[]>(initialCustomProcesses);

  useEffect(() => {
    const processTimer = setInterval(() => {
      const startTick = performance.now();
      const now = Date.now();
      
      let nextMillProcesses = [...millProcesses];
      let nextPopcornProcesses = [...popcornProcesses];
      let nextCustomProcesses = [...customProcesses];
      
      const inventoryChanges: Record<string, Record<string, number>> = {};
      
      const getPlayerInv = (pid: string, prod: string) => {
          const p = players.find(pl => pl.id === pid);
          const base = (p?.inventory[prod as ProductType] || 0);
          const delta = inventoryChanges[pid]?.[prod] || 0;
          return base + delta;
      };
      
      const updateInv = (pid: string, prod: string, delta: number) => {
          if (!inventoryChanges[pid]) inventoryChanges[pid] = {};
          inventoryChanges[pid][prod] = (inventoryChanges[pid][prod] || 0) + delta;
      };

      // --- MILL ---
      const activeMill: MillProcess[] = [];
      const completedMill: MillProcess[] = [];
      
      nextMillProcesses.forEach(p => {
        if (p.startTime + p.duration <= now) completedMill.push(p);
        else activeMill.push(p);
      });

      if (completedMill.length > 0) {
        nextMillProcesses = activeMill;
        completedMill.forEach(p => {
            const b = buildings.find(x => x.id === p.millId);
            if (b?.ownerId) {
                updateInv(b.ownerId, ProductType.Flour, p.flourProduced);
                showSuccess(`Liszt elkészült a malomban! (+${p.flourProduced})`);
                
                // Auto-restart logic
                if (getPlayerInv(b.ownerId, ProductType.Wheat) >= MILL_WHEAT_CONSUMPTION_PER_PROCESS) {
                    updateInv(b.ownerId, ProductType.Wheat, -MILL_WHEAT_CONSUMPTION_PER_PROCESS);
                    nextMillProcesses.push({
                        id: `mill-${now}-${Math.random()}`,
                        millId: b.id,
                        productType: ProductType.Flour,
                        startTime: now,
                        duration: MILL_PROCESSING_TIME_MS,
                        wheatConsumed: MILL_WHEAT_CONSUMPTION_PER_PROCESS,
                        flourProduced: MILL_FLOUR_PRODUCTION_PER_PROCESS
                    });
                } else {
                    console.debug(`[Process] 🛑 Mill auto-restart failed: Not enough wheat (Owner: ${b.ownerId})`);
                }
            } else {
                console.debug(`[Process] ⚠️ Mill completion skipped: Building ${p.millId} not found or no owner`);
            }
        });
        setMillProcesses(nextMillProcesses);
      }
      
      // --- POPCORN ---
      const activePopcorn: PopcornProcess[] = [];
      const completedPopcorn: PopcornProcess[] = [];
      
      nextPopcornProcesses.forEach(p => {
        if (p.startTime + p.duration <= now) completedPopcorn.push(p);
        else activePopcorn.push(p);
      });

      if (completedPopcorn.length > 0) {
        nextPopcornProcesses = activePopcorn;
        completedPopcorn.forEach(p => {
            const b = buildings.find(x => x.id === p.standId);
            if (b?.ownerId) {
                updateInv(b.ownerId, ProductType.Popcorn, p.popcornProduced);
                showSuccess(`Popcorn elkészült! (+${p.popcornProduced})`);
                
                // Auto-restart
                if (getPlayerInv(b.ownerId, ProductType.Corn) >= POPCORN_CORN_CONSUMPTION) {
                    updateInv(b.ownerId, ProductType.Corn, -POPCORN_CORN_CONSUMPTION);
                    nextPopcornProcesses.push({
                        id: `popcorn-${now}-${Math.random()}`,
                        standId: b.id,
                        startTime: now,
                        duration: POPCORN_PROCESSING_TIME_MS,
                        cornConsumed: POPCORN_CORN_CONSUMPTION,
                        popcornProduced: POPCORN_PRODUCTION
                    });
                } else {
                    console.debug(`[Process] 🛑 Popcorn auto-restart failed: Not enough corn`);
                }
            }
        });
        setPopcornProcesses(nextPopcornProcesses);
      }

      // --- CUSTOM ---
      const activeCustom: CustomProcess[] = [];
      const completedCustom: CustomProcess[] = [];
      
      nextCustomProcesses.forEach(p => {
        if (p.startTime + p.duration <= now) completedCustom.push(p);
        else activeCustom.push(p);
      });

      if (completedCustom.length > 0) {
        nextCustomProcesses = activeCustom;
        completedCustom.forEach(p => {
            const b = buildings.find(x => x.id === p.buildingId);
            if (b?.ownerId) {
                updateInv(b.ownerId, p.produces, p.quantity);
                showSuccess(`Termelés kész: ${p.produces} (+${p.quantity})`);
                
                // Auto-restart
                let recipe: any = null;
                const customDef = customBuildings.find(cb => cb.name === b.name && cb.type === b.type);
                if (customDef && customDef.productionConfig) {
                    recipe = customDef.productionConfig;
                } else {
                    const def = availableBuildingOptions.find(o => o.name === b.name);
                    if (def && def.productionConfig) {
                        recipe = def.productionConfig;
                    }
                }
                
                if (recipe) {
                    const consumes = recipe.consumes;
                    const consumesQty = recipe.consumesQuantity || 0;
                    
                    if (!consumes || getPlayerInv(b.ownerId, consumes) >= consumesQty) {
                        if (consumes) {
                            updateInv(b.ownerId, consumes, -consumesQty);
                        }
                        nextCustomProcesses.push({
                            id: `custom-${now}-${Math.random()}`,
                            buildingId: b.id,
                            produces: recipe.produces,
                            quantity: recipe.quantity,
                            startTime: now,
                            duration: recipe.duration
                        });
                    } else {
                         console.debug(`[Process] 🛑 Custom process auto-restart failed: Not enough resources`);
                    }
                }
            }
        });
        setCustomProcesses(nextCustomProcesses);
      }

      // Apply inventory changes
      if (Object.keys(inventoryChanges).length > 0) {
          setPlayers(prev => prev.map(p => {
              if (inventoryChanges[p.id]) {
                  const newInv = { ...p.inventory };
                  Object.entries(inventoryChanges[p.id]).forEach(([prod, delta]) => {
                      newInv[prod as ProductType] = (newInv[prod as ProductType] || 0) + delta;
                  });
                  return { ...p, inventory: newInv };
              }
              return p;
          }));
      }

    }, 1000);
    return () => clearInterval(processTimer);
  }, [millProcesses, popcornProcesses, customProcesses, buildings, players, customBuildings, setPlayers]); 

  return {
    millProcesses, setMillProcesses,
    popcornProcesses, setPopcornProcesses,
    customProcesses, setCustomProcesses
  };
};
