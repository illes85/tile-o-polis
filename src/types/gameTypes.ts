export enum ProductType {
  Wood = "wood",
  Stone = "stone",
  Brick = "brick",
  Wheat = "wheat",
  Flour = "flour",
  Bread = "bread",
  Corn = "corn",
  CornFlour = "corn_flour",
  Popcorn = "popcorn",
  Potato = "potato",
  Water = "water",
  Clothes = "clothes",
  Axe = "axe",
  Pickaxe = "pickaxe",
  WheatSeed = "wheat_seed",
  CornSeed = "corn_seed"
}

export interface Player {
  id: string;
  name: string;
  money: number;
  inventory: Record<string, number>;
  workplace: string;
  workplaceSalary: number;
  carryingStone?: number;
  carryingWood?: number;
  miningTarget?: { x: number; y: number; stoneIndex: number };
}

export interface Transaction {
  id: string;
  playerId: string;
  type: "income" | "expense";
  description: string;
  amount: number;
  timestamp: number;
}

export interface GameRules {
  cycleTime: number;
  winMoney: number;
  winCompanies: number;
  loseInsolvencyCycles: number;
}

export enum CropType {
  None = "none",
  Wheat = "wheat",
  Corn = "corn",
}

export interface FarmlandTile {
  x: number;
  y: number;
  ownerId: string;
  isUnderConstruction?: boolean; 
  buildProgress?: number; 
  constructionEta?: number; 
  originalDuration?: number; 
  cropType: CropType; 
  cropProgress?: number; 
}

export interface BuildingData {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: "house" | "office" | "forestry" | "farm" | "farmland" | "road" | "shop" | "mill" | "popcorn_stand" | "bank" | "custom";
  category?: "residential" | "business" | "industrial" | "decoration";
  customGraphics?: {
    tileset: string;
    x: number;
    y: number;
  };
  rentalPrice?: number;
  salary?: number;
  capacity: number;
  ownerId?: string;
  renterId?: string;
  residentIds: string[];
  employeeIds: string[];
  isUnderConstruction: boolean;
  buildProgress?: number;
  constructionEta?: number;
  originalDuration?: number;
  rotation: number;
  farmlandTiles?: FarmlandTile[];
  hasRoadNeighborTop?: boolean;
  hasRoadNeighborBottom?: boolean;
  hasRoadNeighborLeft?: boolean;
  hasRoadNeighborRight?: boolean;
  level?: number;
  millInventory?: { wheat: number; flour: number; corn?: number };
  popcornStandInventory?: { corn: number; popcorn: number };
  genericInventory?: Record<string, number>;
  productionConfig?: {
    produces: ProductType;
    quantity: number;
    duration: number;
    consumes?: ProductType;
    consumesQuantity?: number;
  };
  marketFeeType?: "percent" | "fixed";
  marketFeeValue?: number;
  activeMarketTransactions?: number;
  isDemolishing?: boolean;
  demolishProgress?: number;
  demolishEta?: number;
  demolishDuration?: number;
  houseNumber?: number;
}

export interface MillProcess {
  id: string;
  millId: string;
  startTime: number;
  duration: number;
  wheatConsumed: number;
  flourProduced: number;
  productType: ProductType;
}

export interface PopcornProcess {
  id: string;
  standId: string;
  startTime: number;
  duration: number;
  cornConsumed: number;
  popcornProduced: number;
}

export interface CustomProcess {
  id: string;
  buildingId: string;
  startTime: number;
  duration: number;
  produces: ProductType;
  quantity: number;
  consumes?: ProductType;
  consumesQuantity?: number;
}

export interface ShopItem {
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

export interface MarketOffer {
  id: string;
  sellerId: string;
  sellerName: string;
  sellingType: ProductType | 'money';
  sellingQuantity: number;
  buyingType: ProductType | 'money';
  buyingQuantity: number;
  commissionType?: 'percent' | 'fixed';
  commissionValue?: number;
}
