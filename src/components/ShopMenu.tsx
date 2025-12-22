"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, ShoppingCart, Package, Settings } from "lucide-react";
import { ProductType } from "@/utils/products";
import { showSuccess, showError } from "@/utils/toast";
import ShopInventory from "./ShopInventory";

interface ShopItem {
  type: ProductType;
  name: string;
  wholesalePrice: number;
  deliveryTimeMs: number;
  sellPrice: number;
  stock: number;
  orderedStock: number;
  isDelivering: boolean;
  deliveryEta?: number;
}

interface ShopMenuProps {
  isOpen: boolean;
  onClose: () => void;
  shopOwnerId: string;
  currentPlayerId: string;
  currentPlayerMoney: number;
  shopItems: ShopItem[];
  onAddItem: (item: Omit<ShopItem, 'stock' | 'orderedStock' | 'isDelivering'>) => void;
  onOrderStock: (type: ProductType, quantity: number) => void;
  onUpdatePrice: (type: ProductType, newPrice: number) => void;
  onBuyProduct: (productType: ProductType, quantity: number) => void;
}

const ShopMenu: React.FC<ShopMenuProps> = ({
  isOpen,
  onClose,
  shopOwnerId,
  currentPlayerId,
  currentPlayerMoney,
  shopItems,
  onAddItem,
  onOrderStock,
  onUpdatePrice,
  onBuyProduct,
}) => {
  const isOwner = currentPlayerId === shopOwnerId;
  const [activeTab, setActiveTab] = useState<"customer" | "owner">(isOwner ? "owner" : "customer");

  const handleBuy = (item: ShopItem) => {
    if (item.stock <= 0) {
      showError("Nincs készleten!");
      return;
    }
    if (currentPlayerMoney < item.sellPrice) {
      showError("Nincs elég pénzed!");
      return;
    }
    onBuyProduct(item.type, 1);
    showSuccess(`Vettél: 1 db ${item.name}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" /> Bolt
          </DialogTitle>
          <DialogDescription>
            {isOwner ? "Vezesd a boltodat vagy vásárolj belőle." : "Válogass a bolt kínálatából."}
          </DialogDescription>
        </DialogHeader>

        {isOwner && (
          <div className="flex gap-2 mb-4 border-b pb-2">
            <Button 
              variant={activeTab === "owner" ? "default" : "ghost"} 
              size="sm"
              onClick={() => setActiveTab("owner")}
            >
              <Settings className="h-4 w-4 mr-2" /> Boltvezetés
            </Button>
            <Button 
              variant={activeTab === "customer" ? "default" : "ghost"} 
              size="sm"
              onClick={() => setActiveTab("customer")}
            >
              <ShoppingCart className="h-4 w-4 mr-2" /> Vevői nézet
            </Button>
          </div>
        )}

        {activeTab === "owner" && isOwner ? (
          <ShopInventory 
            shopItems={shopItems}
            onAddItem={onAddItem}
            onOrderStock={onOrderStock}
            onUpdatePrice={onUpdatePrice}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {shopItems.filter(i => i.stock > 0).length === 0 ? (
              <div className="col-span-2 py-8 text-center text-muted-foreground italic">
                A bolt jelenleg üres.
              </div>
            ) : (
              shopItems.filter(i => i.stock > 0).map(item => (
                <Card key={item.type}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md">{item.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm text-muted-foreground">Ár:</span>
                      <span className="text-xl font-bold flex items-center">
                        <Coins className="h-4 w-4 mr-1 text-green-500" /> {item.sellPrice}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">Készleten: {item.stock} db</div>
                    <Button className="w-full" onClick={() => handleBuy(item)}>Vásárlás</Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ShopMenu;