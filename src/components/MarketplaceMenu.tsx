"use client";
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Coins, Package, PlusCircle, ShoppingBag } from "lucide-react";
import { ProductType, allProducts, getProductByType } from "@/utils/products";
import { MarketOffer } from "@/pages/Game";
import MarketplaceOffer from "./MarketplaceOffer";
import { showSuccess, showError } from "@/utils/toast";

interface Player {
  id: string;
  name: string;
  money: number;
  inventory: Record<string, number>;
}

interface MarketplaceMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlayer: Player;
  allPlayers: Player[];
  marketOffers: MarketOffer[];
  onAddOffer: (offer: Omit<MarketOffer, 'id' | 'sellerName'>) => boolean;
  onAcceptOffer: (offerId: string) => void;
  onCancelOffer: (offerId: string) => void;
}

const MarketplaceMenu: React.FC<MarketplaceMenuProps> = ({
  isOpen,
  onClose,
  currentPlayer,
  marketOffers,
  onAddOffer,
  onAcceptOffer,
  onCancelOffer,
}) => {
  const [activeTab, setActiveTab] = useState<"browse" | "create">("browse");
  const [sellingType, setSellingType] = useState<ProductType | ''>('');
  const [sellingQuantity, setSellingQuantity] = useState<number>(1);
  const [buyingType, setBuyingType] = useState<ProductType | 'money'>('money');
  const [buyingQuantity, setBuyingQuantity] = useState<number>(1);

  const availableSellingItems = allProducts.filter(p => (currentPlayer.inventory[p.type] || 0) > 0);
  const availableBuyingItems = allProducts;

  const handleCreateOffer = () => {
    if (!sellingType || !buyingType || sellingQuantity <= 0 || buyingQuantity <= 0) {
      showError("Kérlek töltsd ki az összes mezőt érvényes értékekkel.");
      return;
    }
    
    if (sellingType === buyingType) {
        showError("Nem cserélhetsz egy terméket önmagára!");
        return;
    }

    const success = onAddOffer({
      sellerId: currentPlayer.id,
      sellingType: sellingType as ProductType,
      sellingQuantity,
      buyingType,
      buyingQuantity,
    });

    if (success) {
      setSellingType('');
      setSellingQuantity(1);
      setBuyingType('money');
      setBuyingQuantity(1);
      setActiveTab('browse');
    }
  };

  const getResourceName = (type: ProductType | 'money') => {
    if (type === 'money') return 'Pénz';
    return allProducts.find(p => p.type === type)?.name || type;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" /> Piac
          </DialogTitle>
          <DialogDescription>
            Cserélj termékeket más játékosokkal.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "browse" | "create")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="browse">Ajánlatok böngészése</TabsTrigger>
            <TabsTrigger value="create">Ajánlat létrehozása</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-4 pt-4">
            {marketOffers.length === 0 ? (
              <p className="text-center text-muted-foreground italic py-8">Jelenleg nincsenek aktív ajánlatok.</p>
            ) : (
              <div className="space-y-3">
                {marketOffers.map(offer => (
                  <MarketplaceOffer
                    key={offer.id}
                    offer={offer}
                    currentPlayerId={currentPlayer.id}
                    currentPlayerInventory={currentPlayer.inventory}
                    currentPlayerMoney={currentPlayer.money}
                    onAccept={onAcceptOffer}
                    onCancel={onCancelOffer}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="create" className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Eladni kívánt termék */}
              <Card className="p-4 border-indigo-500/50">
                <CardTitle className="text-md mb-3 flex items-center text-indigo-700 dark:text-indigo-300">
                  <Package className="h-4 w-4 mr-2" /> Eladni kívánt termék (Neked van)
                </CardTitle>
                <div className="space-y-3">
                  <Label>Termék</Label>
                  <Select onValueChange={(v) => setSellingType(v as ProductType)} value={sellingType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Válassz terméket" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSellingItems.map(p => (
                        <SelectItem key={p.type} value={p.type}>
                          {p.name} (Készlet: {currentPlayer.inventory[p.type] || 0})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Label>Mennyiség (Max: {currentPlayer.inventory[sellingType] || 0})</Label>
                  <Input 
                    type="number" 
                    min={1} 
                    max={currentPlayer.inventory[sellingType] || 0}
                    value={sellingQuantity} 
                    onChange={e => setSellingQuantity(Number(e.target.value))} 
                  />
                </div>
              </Card>

              {/* Kért termék/pénz */}
              <Card className="p-4 border-green-500/50">
                <CardTitle className="text-md mb-3 flex items-center text-green-700 dark:text-green-300">
                  <Coins className="h-4 w-4 mr-2" /> Kért fizetőeszköz/termék
                </CardTitle>
                <div className="space-y-3">
                  <Label>Fizetőeszköz</Label>
                  <Select onValueChange={(v) => setBuyingType(v as ProductType | 'money')} value={buyingType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Válassz fizetőeszközt" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="money">Pénz (Készlet: {currentPlayer.money})</SelectItem>
                      {availableBuyingItems.map(p => (
                        <SelectItem key={p.type} value={p.type}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Label>Kért mennyiség</Label>
                  <Input 
                    type="number" 
                    min={1} 
                    value={buyingQuantity} 
                    onChange={e => setBuyingQuantity(Number(e.target.value))} 
                  />
                </div>
              </Card>
            </div>

            <Button onClick={handleCreateOffer} className="w-full mt-4" disabled={!sellingType || !buyingType || sellingQuantity <= 0 || buyingQuantity <= 0}>
              <PlusCircle className="h-4 w-4 mr-2" /> Ajánlat kiírása
            </Button>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Bezárás</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MarketplaceMenu;