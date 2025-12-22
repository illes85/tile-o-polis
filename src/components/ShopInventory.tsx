"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductType, allProducts, getProductByType } from "@/utils/products";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { Coins, Package, ShoppingCart, Truck } from "lucide-react";

interface ShopItem {
  type: ProductType;
  name: string;
  wholesalePrice: number;
  deliveryTimeMs: number;
  sellPrice: number; // Eladási ár, amit a tulajdonos állít be
  stock: number; // Elérhető készlet
  orderedStock: number; // Rendelés alatt lévő készlet
  isDelivering: boolean; // Jelenleg szállítás alatt van-e
  deliveryEta?: number; // Szállítás befejezésének ideje (timestamp)
}

interface ShopInventoryProps {
  shopItems: ShopItem[];
  onAddItem: (item: Omit<ShopItem, 'stock' | 'orderedStock' | 'isDelivering'>) => void;
  onOrderStock: (type: ProductType, quantity: number) => void;
  onUpdatePrice: (type: ProductType, newPrice: number) => void;
  onRestock: (type: ProductType, quantity: number) => void;
}

const ShopInventory: React.FC<ShopInventoryProps> = ({
  shopItems,
  onAddItem,
  onOrderStock,
  onUpdatePrice,
  onRestock,
}) => {
  const [selectedProductType, setSelectedProductType] = useState<ProductType | "">("");
  const [sellPrice, setSellPrice] = useState<number>(0);
  const [orderQuantity, setOrderQuantity] = useState<number>(1);
  const [selectedItemType, setSelectedItemType] = useState<ProductType | "">("");
  const [restockQuantity, setRestockQuantity] = useState<number>(1);
  const [newPrice, setNewPrice] = useState<number>(0);

  const handleAddNewItem = () => {
    if (!selectedProductType) {
      showError("Válassz egy terméktípust!");
      return;
    }
    
    const existingItem = shopItems.find(item => item.type === selectedProductType);
    if (existingItem) {
      showError("Ez a termék már hozzá van adva a bolt készletéhez!");
      return;
    }
    
    const product = getProductByType(selectedProductType);
    if (!product) {
      showError("Ismeretlen termék!");
      return;
    }
    
    onAddItem({
      type: selectedProductType,
      name: product.name,
      wholesalePrice: product.wholesalePrice,
      deliveryTimeMs: product.deliveryTimeMs,
      sellPrice: sellPrice > 0 ? sellPrice : product.baseSellPrice,
    });
    
    showSuccess(`Új termék hozzáadva: ${product.name}`);
    setSelectedProductType("");
    setSellPrice(0);
  };

  const handleOrderStock = () => {
    if (!selectedItemType) {
      showError("Válassz egy terméket a rendeléshez!");
      return;
    }
    
    if (orderQuantity <= 0) {
      showError("A rendelési mennyiségnek pozitív számnak kell lennie!");
      return;
    }
    
    onOrderStock(selectedItemType, orderQuantity);
    setSelectedItemType("");
    setOrderQuantity(1);
  };

  const handleUpdatePrice = () => {
    if (!selectedItemType) {
      showError("Válassz egy terméket az ár módosításához!");
      return;
    }
    
    if (newPrice <= 0) {
      showError("Az eladási árnak pozitív számnak kell lennie!");
      return;
    }
    
    onUpdatePrice(selectedItemType, newPrice);
    setSelectedItemType("");
    setNewPrice(0);
  };

  const handleRestock = () => {
    if (!selectedItemType) {
      showError("Válassz egy terméket a feltöltéshez!");
      return;
    }
    
    if (restockQuantity <= 0) {
      showError("A feltöltési mennyiségnek pozitív számnak kell lennie!");
      return;
    }
    
    onRestock(selectedItemType, restockQuantity);
    setSelectedItemType("");
    setRestockQuantity(1);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Új termék hozzáadása</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="product-type">Termék típusa</Label>
            <Select onValueChange={(value) => setSelectedProductType(value as ProductType)} value={selectedProductType}>
              <SelectTrigger id="product-type">
                <SelectValue placeholder="Válassz terméket" />
              </SelectTrigger>
              <SelectContent>
                {allProducts.map((product) => (
                  <SelectItem key={product.type} value={product.type}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="sell-price">Eladási ár</Label>
            <div className="relative">
              <Coins className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                id="sell-price"
                type="number"
                value={sellPrice}
                onChange={(e) => setSellPrice(Number(e.target.value))}
                className="pl-8"
                placeholder="Add meg az eladási árat"
              />
            </div>
          </div>
          
          <Button onClick={handleAddNewItem} className="w-full">
            <Package className="h-4 w-4 mr-2" /> Termék hozzáadása
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Készletkezelés</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="item-type">Termék kiválasztása</Label>
            <Select onValueChange={(value) => setSelectedItemType(value as ProductType)} value={selectedItemType}>
              <SelectTrigger id="item-type">
                <SelectValue placeholder="Válassz terméket" />
              </SelectTrigger>
              <SelectContent>
                {shopItems.map((item) => (
                  <SelectItem key={item.type} value={item.type}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="order-quantity">Rendelési mennyiség</Label>
              <Input
                id="order-quantity"
                type="number"
                value={orderQuantity}
                onChange={(e) => setOrderQuantity(Math.max(1, Number(e.target.value)))}
                min="1"
              />
            </div>
            <Button onClick={handleOrderStock} className="mt-5">
              <Truck className="h-4 w-4 mr-2" /> Rendelés
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="restock-quantity">Feltöltési mennyiség</Label>
              <Input
                id="restock-quantity"
                type="number"
                value={restockQuantity}
                onChange={(e) => setRestockQuantity(Math.max(1, Number(e.target.value)))}
                min="1"
              />
            </div>
            <Button onClick={handleRestock} className="mt-5">
              <ShoppingCart className="h-4 w-4 mr-2" /> Feltöltés
            </Button>
          </div>
          
          <div>
            <Label htmlFor="new-price">Új eladási ár</Label>
            <div className="relative">
              <Coins className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                id="new-price"
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(Number(e.target.value))}
                className="pl-8"
                placeholder="Add meg az új árat"
              />
            </div>
          </div>
          <Button onClick={handleUpdatePrice} className="w-full">
            Ár frissítése
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Aktuális készlet</CardTitle>
        </CardHeader>
        <CardContent>
          {shopItems.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nincs termék a boltban.</p>
          ) : (
            <div className="space-y-3">
              {shopItems.map((item) => (
                <div key={item.type} className="border rounded-md p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Eladási ár: <span className="font-semibold">{item.sellPrice} pénz</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Készlet: <span className="font-semibold">{item.stock} db</span>
                      </p>
                      {item.orderedStock > 0 && (
                        <p className="text-sm text-muted-foreground">
                          Rendelés alatt: <span className="font-semibold">{item.orderedStock} db</span>
                        </p>
                      )}
                      {item.isDelivering && item.deliveryEta && (
                        <p className="text-sm text-blue-600">
                          Szállítás alatt, várható érkezés: {new Date(item.deliveryEta).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ShopInventory;