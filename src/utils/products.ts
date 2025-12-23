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
  WheatSeed = "wheat_seed",
  Wheat = "wheat", // Hozzáadva a búza is, ha még nem volt
  Flour = "flour", // Hozzáadva a liszt is, ha még nem volt
  Corn = "corn", // ÚJ: Kukorica
  CornFlour = "corn_flour", // ÚJ: Kukoricaliszt
  Popcorn = "popcorn", // ÚJ: Popcorn
}

export interface Product {
  type: ProductType;
  name: string;
  wholesalePrice: number;
  deliveryTimeMs: number;
  baseSellPrice: number;
  baseBuyPrice?: number;
}

export const allProducts: Product[] = [
  { type: ProductType.Potato, name: "Burgonya", wholesalePrice: 5, deliveryTimeMs: 5000, baseSellPrice: 8 },
  { type: ProductType.Water, name: "Víz", wholesalePrice: 3, deliveryTimeMs: 3000, baseSellPrice: 5 },
  { type: ProductType.Clothes, name: "Ruha", wholesalePrice: 15, deliveryTimeMs: 10000, baseSellPrice: 25 },
  { type: ProductType.Wood, name: "Fa", wholesalePrice: 2, deliveryTimeMs: 2000, baseSellPrice: 4 },
  { type: ProductType.Brick, name: "Tégla", wholesalePrice: 4, deliveryTimeMs: 4000, baseSellPrice: 7 },
  { type: ProductType.Stone, name: "Kő", wholesalePrice: 3, deliveryTimeMs: 3500, baseSellPrice: 6 },
  { type: ProductType.Hoe, name: "Kapa", wholesalePrice: 50, deliveryTimeMs: 15000, baseSellPrice: 80 },
  { type: ProductType.Tractor, name: "Traktor", wholesalePrice: 500, deliveryTimeMs: 30000, baseSellPrice: 800 },
  { type: ProductType.WheatSeed, name: "Búza vetőmag", wholesalePrice: 2, deliveryTimeMs: 3000, baseSellPrice: 4 },
  { type: ProductType.Wheat, name: "Búza", wholesalePrice: 4, deliveryTimeMs: 4000, baseSellPrice: 7 },
  { type: ProductType.Flour, name: "Liszt", wholesalePrice: 8, deliveryTimeMs: 6000, baseSellPrice: 12 },
  { type: ProductType.Corn, name: "Kukorica", wholesalePrice: 5, deliveryTimeMs: 5000, baseSellPrice: 9 }, // ÚJ
  { type: ProductType.CornFlour, name: "Kukoricaliszt", wholesalePrice: 10, deliveryTimeMs: 7000, baseSellPrice: 15 }, // ÚJ
  { type: ProductType.Popcorn, name: "Popcorn", wholesalePrice: 12, deliveryTimeMs: 8000, baseSellPrice: 20 }, // ÚJ
];

export const getProductByType = (type: ProductType) => allProducts.find(p => p.type === type);