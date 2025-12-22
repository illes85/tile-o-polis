"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductType, allProducts, getProductByType } from "@/utils/products";
import { showSuccess, showError } from "@/utils/toast";
import { Coins, Package, Truck, Clock } from "lucide-react";

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
  onAddItem: (item: Omit<ShopItem, 'stock' | 'orderedStock' | 'isDelivering'>) => void;
  onOrderStock: (type: ProductType, quantity: number) => void;
  onUpdatePrice: (type: ProductType, newPrice: number) => void;
}

const ShopInventory: React.FC<ShopInventoryProps> = ({
  shopItems,
  onAddItem,
  onOrderStock,
  onUpdatePrice,
}) => {
  const [selectedProductType, setSelectedProductType] = useState<ProductType | "">("");
  const [initialSellPrice, setInitialSellPrice] = useState<number>(0);
  
  const [selectedItemForOrder, setSelectedItemForOrder] = useState<ProductType | "">("");
  const [orderQuantity, setOrderQuantity] = useState<number>(1);
  
  const [selectedItemForPrice, setSelectedItemForPrice] = useState<ProductType | "">("");
  const [newPrice, setNewPrice] = useState<number>(0);

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAddNewItem = () => {
    if (!selectedProductType) {
      showError("Válassz egy terméktípust!");
      return;
    }
    const product = getProductByType(selectedProductType);
    if (!product) return;

    onAddItem({
      type: selectedProductType,
      name: product.name,
      wholesalePrice: product.wholesalePrice,
      deliveryTimeMs: product.deliveryTimeMs,
      sellPrice: initialSellPrice > 0 ? initialSellPrice : product.baseSellPrice,
    });
    setSelectedProductType("");
    setInitialSellPrice(0);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Új terméktípus felvétele a boltba</CardTitle>
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
              <Label>Kezdeti eladási ár</Label>
              <Input type="number" value={initialSellPrice} onChange={e => setInitialSellPrice(Number(e.target.value))} />
            </div>
          </div>
          <Button onClick={handleAddNewItem} className="w-full" disabled={!selectedProductType}>
            Hozzáadás a katalógushoz
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
                    <span>Nagyker ár: <strong>{item.wholesalePrice}</strong></span>
                  </div>
                  {item.isDelivering ? (
                    <div className="flex items-center text-blue-600 animate-pulse">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>Érkezik: {timeLeft}mp ({item.orderedStock} db)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number" 
                        className="w-16 h-8" 
                        defaultValue={1}
                        onChange={(e) => setOrderQuantity(Number(e.target.value))} 
                      />
                      <Button size="sm" onClick={() => onOrderStock(item.type, orderQuantity)}>Rendelés</Button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Eladási ár beállítása</Label>
                    <div className="flex gap-2">
                      <Input 
                        type="number" 
                        className="h-8" 
                        placeholder={item.sellPrice.toString()}
                        onChange={(e) => setNewPrice(Number(e.target.value))}
                      />
                      <Button size="sm" variant="outline" onClick={() => onUpdatePrice(item.type, newPrice)}>OK</Button>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground block">Aktuális ár:</span>
                    <span className="font-bold flex items-center justify-end">
                      <Coins className="h-3 w-3 mr-1 text-green-500" /> {item.sellPrice}
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