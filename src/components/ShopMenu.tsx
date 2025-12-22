"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, ShoppingCart, Package, Pickaxe, Drill, User, Truck } from "lucide-react";
import { ProductType, allProducts, getProductByType } from "@/utils/products";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
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
  onRestock: (type: ProductType, quantity: number) => void;
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
  onRestock,
  onBuyProduct,
}) => {
  const isOwner = currentPlayerId === shopOwnerId;
  const [activeTab, setActiveTab] = useState<"shop" | "inventory">("shop");

  // Szállítási időzítő
  useEffect(() => {
    const deliveryTimer = setInterval(() => {
      shopItems.forEach(item => {
        if (item.isDelivering && item.deliveryEta && Date.now() >= item.deliveryEta) {
          // Szállítás befejezve
          onRestock(item.type, item.orderedStock);
          showSuccess(`Szállítás befejezve: ${item.orderedStock} db ${item.name} érkezett!`);
        }
      });
    }, 1000);

    return () => clearInterval(deliveryTimer);
  }, [shopItems, onRestock]);

  const handleBuy = (productType: ProductType) => {
    const item = shopItems.find(i => i.type === productType);
    if (!item) {
      showError("Ez a termék jelenleg nem elérhető.");
      return;
    }
    
    if (item.stock <= 0) {
      showError("Ez a termék jelenleg nincs készleten.");
      return;
    }
    
    if (currentPlayerMoney < item.sellPrice) {
      showError(`Nincs elég pénzed ${item.name} vásárlásához! Szükséges: ${item.sellPrice} pénz.`);
      return;
    }
    
    onBuyProduct(productType, 1);
    showSuccess(`Sikeresen vásároltál 1 ${item.name}!`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bolt</DialogTitle>
          <DialogDescription>
            {isOwner ? "Tulajdonosként kezelheted a bolt készletét." : "Vásárolj termékeket a boltból."}
          </DialogDescription>
        </DialogHeader>
        
        {isOwner ? (
          <div className="space-y-4">
            <div className="flex border-b">
              <Button
                variant={activeTab === "shop" ? "default" : "ghost"}
                className="rounded-none"
                onClick={() => setActiveTab("shop")}
              >
                <ShoppingCart className="h-4 w-4 mr-2" /> Bolt
              </Button>
              <Button
                variant={activeTab === "inventory" ? "default" : "ghost"}
                className="rounded-none"
                onClick={() => setActiveTab("inventory")}
              >
                <Package className="h-4 w-4 mr-2" /> Készlet
              </Button>
            </div>
            
            {activeTab === "shop" ? (
              <div className="space-y-4">
                <h3 className="font-semibold">Elérhető termékek a vásárláshoz</h3>
                {shopItems.filter(item => item.stock > 0).length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Nincs elérhető termék a vásárláshoz.</p>
                ) : (
                  shopItems.filter(item => item.stock > 0).map((item) => (
                    <Card key={item.type} className="w-full">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center">
                          <Package className="h-5 w-5 mr-2" />
                          {item.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Ár:</span>
                          <span className="flex items-center">
                            <Coins className="h-4 w-4 text-green-500 mr-1" />
                            {item.sellPrice}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-sm font-medium">Készleten:</span>
                          <span>{item.stock} db</span>
                        </div>
                        <Button
                          onClick={() => handleBuy(item.type)}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" /> Vásárlás
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            ) : (
              <ShopInventory
                shopItems={shopItems}
                onAddItem={onAddItem}
                onOrderStock={onOrderStock}
                onUpdatePrice={onUpdatePrice}
                onRestock={onRestock}
              />
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="font-semibold">Elérhető termékek</h3>
            {shopItems.filter(item => item.stock > 0).length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Nincs elérhető termék a boltban.</p>
            ) : (
              shopItems.filter(item => item.stock > 0).map((item) => (
                <Card key={item.type} className="w-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <Package className="h-5 w-5 mr-2" />
                      {item.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Ár:</span>
                      <span className="flex items-center">
                        <Coins className="h-4 w-4 text-green-500 mr-1" />
                        {item.sellPrice}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm font-medium">Készleten:</span>
                      <span>{item.stock} db</span>
                    </div>
                    <Button
                      onClick={() => handleBuy(item.type)}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" /> Vásárlás
                    </Button>
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