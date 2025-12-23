"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductType, allProducts, getProductByType } from "@/utils/products";
import { showSuccess, showError } from "@/utils/toast";
import { Coins, Package, Truck, Clock, ArrowUpCircle } from "lucide-react";

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

interface ShopInventoryProps {
  shopItems: ShopItem[];
  shopLevel: number;
  onAddItem: (item: Omit<ShopItem, 'stock' | 'orderedStock' | 'isDelivering'>) => void;
  onOrderStock: (type: ProductType, quantity: number) => void;
  onUpdatePrice: (type: ProductType, newPrice: number) => void;
  onUpgrade: () => void;
}

const ShopInventory: React.FC<ShopInventoryProps> = ({
  shopItems,
  shopLevel,
  onAddItem,
  onOrderStock,
  onUpdatePrice,
  onUpgrade,
}) => {
  const [selectedProductType, setSelectedProductType] = useState<ProductType | "">("");
  const [initialSellPrice, setInitialSellPrice] = useState<number>(0);
  const [now, setNow] = useState(Date.now());
  const [orderQuantity, setOrderQuantity] = useState<number>(1);
  const [newPrices, setNewPrices] = useState<Record<string, number>>({});
  const [currentShopLevel, setCurrentShopLevel] = useState(shopLevel); // Új állapot a bolt szintjének követésére

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setCurrentShopLevel(shopLevel); // Frissítjük a bolt szintjét amikor a prop változik
  }, [shopLevel]);

  const getSlotLimit = (level: number) => {
    if (level === 1) return 2;
    if (level === 2) return 4;
    return 7;
  };

  const getUpgradeCost = (level: number) => {
    if (level === 1) return 1500;
    if (level === 2) return 4000;
    return 0;
  };

  const slotLimit = getSlotLimit(currentShopLevel);
  const upgradeCost = getUpgradeCost(currentShopLevel);

  const handleAddNewItem = () => {
    if (shopItems.length >= slotLimit) {
      showError(`A bolt megtelt! Fejleszd a boltot több helyért (Max: ${slotLimit}).`);
      return;
    }
    if (!selectedProductType) return;

    const product = getProductByType(selectedProductType as ProductType);
    if (!product) return;

    onAddItem({
      type: product.type,
      name: product.name,
      wholesalePrice: product.wholesalePrice,
      deliveryTimeMs: product.deliveryTimeMs,
      sellPrice: initialSellPrice > 0 ? initialSellPrice : product.baseSellPrice,
    });

    setSelectedProductType("");
    setInitialSellPrice(0);
  };

  const handleUpgradeShop = () => {
    onUpgrade();
    // Frissítjük a bolt szintjét az UI-n
    setCurrentShopLevel(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-md flex justify-between items-center">
            <span>Boltszint: {currentShopLevel}</span>
            <span className="text-sm font-normal">Termékhelyek: {shopItems.length} / {slotLimit}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upgradeCost > 0 ? (
            <Button onClick={handleUpgradeShop} variant="outline" className="w-full border-blue-400 text-blue-600 hover:bg-blue-100">
              <ArrowUpCircle className="h-4 w-4 mr-2" />
              Fejlesztés {currentShopLevel+1}. szintre ({upgradeCost} <Coins className="h-3 w-3 inline ml-1" />)
            </Button>
          ) : (
            <p className="text-sm text-center text-muted-foreground italic text-blue-600">Maximális boltszint elérve!</p>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Új termék felvétele</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Termék</Label>
              <Select onValueChange={(v) => setSelectedProductType(v as ProductType)} value={selectedProductType}>
                <SelectTrigger>
                  <SelectValue placeholder="Válassz..." />
                </SelectTrigger>
                <SelectContent>
                  {allProducts.map(p => (
                    <SelectItem key={p.type} value={p.type} disabled={shopItems.some(si => si.type === p.type)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Eladási ár</Label>
              <Input type="number" value={initialSellPrice} onChange={e => setInitialSellPrice(Number(e.target.value))} />
            </div>
          </div>
          <Button onClick={handleAddNewItem} className="w-full" disabled={!selectedProductType || shopItems.length >= slotLimit}>
            Hozzáadás ({shopItems.length}/{slotLimit})
          </Button>
        </CardContent>
      </Card>
      
      <div className="grid gap-4">
        {shopItems.map(item => {
          const timeLeft = item.deliveryEta ? Math.max(0, Math.ceil((item.deliveryEta - now) / 1000)) : 0;
          return (
            <Card key={item.type}>
              <CardHeader className="pb-2">
                <CardTitle className="text-md flex justify-between">
                  <span>{item.name}</span>
                  <span className="text-sm font-normal text-muted-foreground">Készlet: {item.stock} db</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex justify-between items-center bg-muted p-2 rounded">
                  <div className="flex items-center">
                    <Truck className="h-4 w-4 mr-2" />
                    <span>Nagyker: <strong>{item.wholesalePrice}</strong></span>
                  </div>
                  {item.isDelivering ? (
                    <div className="flex items-center text-blue-600 animate-pulse">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{timeLeft}mp ({item.orderedStock} db)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input type="number" className="w-16 h-8" defaultValue={1} onChange={(e) => setOrderQuantity(Number(e.target.value))} />
                      <Button size="sm" onClick={() => onOrderStock(item.type, orderQuantity)}>Rendelés</Button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Eladási ár</Label>
                    <div className="flex gap-2">
                      <Input 
                        type="number" 
                        className="h-8" 
                        placeholder={item.sellPrice.toString()} 
                        onChange={(e) => setNewPrices({...newPrices, [item.type]: Number(e.target.value)})} 
                      />
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => onUpdatePrice(item.type, newPrices[item.type] || item.sellPrice)}
                      >
                        OK
                      </Button>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold flex items-center justify-end">
                      <Coins className="h-3 w-3 mr-1 text-green-500" />
                      {item.sellPrice}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ShopInventory;