"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, ArrowRight, XCircle } from "lucide-react";
import { ProductType, allProducts } from "@/utils/products";
import { MarketOffer } from "@/pages/Game";
import { showSuccess, showError } from "@/utils/toast";

interface MarketplaceOfferProps {
  offer: MarketOffer;
  currentPlayerId: string;
  currentPlayerInventory: Record<string, number>;
  currentPlayerMoney: number;
  onAccept: (offerId: string) => void;
  onCancel: (offerId: string) => void;
}

const getResourceName = (type: ProductType | 'money') => {
  if (type === 'money') return 'Pénz';
  return allProducts.find(p => p.type === type)?.name || type;
};

const getResourceIcon = (type: ProductType | 'money') => {
  if (type === 'money') return <Coins className="h-4 w-4 text-green-500 mr-1" />;
  
  // Egyszerű ikonok a termékekhez (a PlayerInfo-ban használt emojik alapján)
  switch (type) {
    case ProductType.Wheat: return <span className="mr-1">🌾</span>;
    case ProductType.WheatSeed: return <span className="mr-1">🌱</span>;
    case ProductType.Wood: return <span className="mr-1">🌳</span>;
    case ProductType.Brick: return <span className="mr-1">🧱</span>;
    case ProductType.Stone: return <span className="mr-1">💎</span>;
    case ProductType.Flour: return <span className="mr-1">🍚</span>;
    default: return <span className="mr-1">📦</span>;
  }
};

const MarketplaceOffer: React.FC<MarketplaceOfferProps> = ({
  offer,
  currentPlayerId,
  currentPlayerInventory,
  currentPlayerMoney,
  onAccept,
  onCancel,
}) => {
  const isSeller = offer.sellerId === currentPlayerId;

  // Ellenőrizzük, hogy a vevő meg tudja-e venni/cserélni
  let canAfford = true;
  if (!isSeller) {
    if (offer.buyingType === 'money') {
      canAfford = currentPlayerMoney >= offer.buyingQuantity;
    } else {
      canAfford = (currentPlayerInventory[offer.buyingType as ProductType] || 0) >= offer.buyingQuantity;
    }
  }

  return (
    <Card className="p-4 flex flex-col sm:flex-row items-center justify-between border-2 border-indigo-300/50">
      <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full">
        {/* Eladott termék */}
        <div className="flex items-center text-lg font-semibold text-indigo-700 dark:text-indigo-300">
          {getResourceIcon(offer.sellingType)}
          {offer.sellingQuantity} {getResourceName(offer.sellingType)}
        </div>

        <ArrowRight className="h-5 w-5 text-gray-500 shrink-0" />

        {/* Kért termék/pénz */}
        <div className="flex items-center text-lg font-semibold text-green-700 dark:text-green-300">
          {getResourceIcon(offer.buyingType)}
          {offer.buyingQuantity} {getResourceName(offer.buyingType)}
        </div>
        
        <div className="text-sm text-muted-foreground ml-auto">
          Eladó: {isSeller ? 'Te' : offer.sellerName}
        </div>
      </div>

      <div className="mt-3 sm:mt-0 sm:ml-4 shrink-0">
        {isSeller ? (
          <Button variant="destructive" size="sm" onClick={() => onCancel(offer.id)}>
            <XCircle className="h-4 w-4 mr-2" /> Visszavonás
          </Button>
        ) : (
          <Button 
            size="sm" 
            onClick={() => onAccept(offer.id)}
            disabled={!canAfford}
          >
            Csere
          </Button>
        )}
      </div>
      {!canAfford && !isSeller && (
        <p className="text-xs text-red-500 mt-2 sm:mt-0 sm:ml-4">Nincs elég fizetőeszközöd!</p>
      )}
    </Card>
  );
};

export default MarketplaceOffer;