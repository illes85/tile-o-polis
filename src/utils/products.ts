// src/utils/products.ts

export enum ProductType {
  Potato = "potato",
  Water = "water",
  Clothes = "clothes",
  Wood = "wood",
  Brick = "brick",
  Stone = "stone",
  Hoe = "hoe",
  Tractor = "tractor",
}

export interface Product {
  type: ProductType;
  name: string;
  wholesalePrice: number; // Nagykereskedelmi ár, amennyiért a bolt berendelheti
  deliveryTimeMs: number; // Szállítási idő milliszekundumban
  baseSellPrice: number; // Alap eladási ár, amit a boltos felülírhat
  baseBuyPrice?: number; // Alap vételár, amennyiért a bolt veszi a terméket a játékostól
}

export const allProducts: Product[] = [
  { type: ProductType.Potato, name: "Burgonya", wholesalePrice: 5, deliveryTimeMs: 5000, baseSellPrice: 8 },
  { type: ProductType.Water, name: "Víz", wholesalePrice: 3, deliveryTimeMs: 3000, baseSellPrice: 5 },
  { type: ProductType.Clothes, name: "Ruha", wholesalePrice: 15, deliveryTimeMs: 10000, baseSellPrice: 25 },
  { type: ProductType.Wood, name: "Fa", wholesalePrice: 2, deliveryTimeMs: 2000, baseSellPrice: 4 },
  { type: ProductType.Brick, name: "Tégla", wholesalePrice: 4, deliveryTimeMs: 4000, baseSellPrice: 7 },
  { type: ProductType.Stone, name: "Kő", wholesalePrice: 3, deliveryTimeMs: 3500, baseSellPrice: 6 },
  { type: ProductType.Hoe, name: "Kapa", wholesalePrice: 50, deliveryTimeMs: 15000, baseSellPrice: 80, baseBuyPrice: 30 },
  { type: ProductType.Tractor, name: "Traktor", wholesalePrice: 500, deliveryTimeMs: 30000, baseSellPrice: 800, baseBuyPrice: 400 },
];

export const getProductByType = (type: ProductType) => allProducts.find(p => p.type === type);