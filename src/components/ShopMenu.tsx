"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, ShoppingCart, Package, Pickaxe, Drill } from "lucide-react"; // Pickaxe a kapához, Drill a traktorhoz
import { Product, ProductType, allProducts } from "@/utils/products";
import { showSuccess, showError } from "@/utils/toast";

interface ShopMenuProps {
  isOpen: boolean;
  onClose: () => void;
  shopOwnerId: string;
  currentPlayerId: string;
  currentPlayerMoney: number;
  currentPlayerInventory: {
    [key: string]: number;
    // Kifejezetten definiáljuk a szükséges kulcsokat is a típusosság kedvéért
    hoe?: number;
    tractor?: number;
    // ... többi termék
  };
  onBuyProduct: (productType: ProductType, quantity: number) => void;
  onSellProduct: (productType: ProductType, quantity: number) => void;
}

const ShopMenu: React.FC<ShopMenuProps> = ({
  isOpen,
  onClose,
  shopOwnerId,
  currentPlayerId,
  currentPlayerMoney,
  currentPlayerInventory,
  onBuyProduct,
  onSellProduct,
}) => {
  const isOwner = currentPlayerId === shopOwnerId;

  // Szűrjük le a termékeket, amiket a bolt támogat (pl. csak eszközök)
  const shopProducts = allProducts.filter(p => 
    p.type === ProductType.Hoe || p.type === ProductType.Tractor
  );

  const handleBuy = (product: Product) => {
    if (currentPlayerMoney < product.baseSellPrice!) {
      showError(`Nincs elég pénzed ${product.name} vásárlásához! Szükséges: ${product.baseSellPrice} pénz.`);
      return;
    }
    onBuyProduct(product.type, 1);
    showSuccess(`Sikeresen vásároltál 1 ${product.name}!`);
    onClose();
  };

  const handleSell = (product: Product) => {
    const inventoryKey = product.type;
    const quantityInInventory = currentPlayerInventory[inventoryKey] || 0;
    
    if (quantityInInventory <= 0) {
      showError(`Nincs ${product.name} a készletedben!`);
      return;
    }
    
    if (!product.baseBuyPrice) {
        showError(`Ez a termék nem eladható a boltban.`);
        return;
    }

    onSellProduct(product.type, 1);
    showSuccess(`Sikeresen eladtál 1 ${product.name}! Jóváírva: ${product.baseBuyPrice} pénz.`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Bolt</DialogTitle>
          <DialogDescription>
            Vásárolj vagy adj el termékeket.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4 max-h-[400px] overflow-y-auto">
          {shopProducts.length === 0 ? (
            <p className="text-center text-muted-foreground">Nincsenek elérhető termékek.</p>
          ) : (
            shopProducts.map((product) => {
              const inventoryKey = product.type;
              const quantityInInventory = currentPlayerInventory[inventoryKey] || 0;
              const canAfford = currentPlayerMoney >= (product.baseSellPrice || 0);
              const hasInInventory = quantityInInventory > 0;
              
              let productIcon = <Package className="h-5 w-5" />;
              if (product.type === ProductType.Hoe) {
                  productIcon = <Pickaxe className="h-5 w-5" />;
              } else if (product.type === ProductType.Tractor) {
                  productIcon = <Drill className="h-5 w-5" />;
              }

              return (
                <Card key={product.type} className="w-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      {productIcon}
                      <span className="ml-2">{product.name}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Ár:</span>
                      <span className="flex items-center">
                        <Coins className="h-4 w-4 text-green-500 mr-1" />
                        {product.baseSellPrice} (vétel)
                      </span>
                    </div>
                    {product.baseBuyPrice !== undefined && (
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Eladási ár:</span>
                        <span className="flex items-center">
                          <Coins className="h-4 w-4 text-green-500 mr-1" />
                          {product.baseBuyPrice} (eladás)
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm font-medium">Készleteden:</span>
                      <span>{quantityInInventory} db</span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleBuy(product)}
                        disabled={!canAfford}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" /> Vásárlás
                      </Button>
                      
                      {product.baseBuyPrice !== undefined && (
                        <Button
                          onClick={() => handleSell(product)}
                          disabled={!hasInInventory}
                          className="flex-1 bg-red-600 hover:bg-red-700"
                        >
                          Eladás
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShopMenu;