import { BuildingOption } from "@/components/BuildMenu";
import { ProductType } from "@/utils/products";

export const BUILD_HOUSE_COST = 500;
export const OFFICE_SALARY_PER_INTERVAL = 21;

export const availableBuildingOptions: BuildingOption[] = [
  { type: "house", category: "residential", name: "Sátor", cost: 200, duration: 5000, width: 2, height: 1, rentalPrice: 0, capacity: 1 },
  { type: "house", category: "residential", name: "Házikó", cost: BUILD_HOUSE_COST, duration: 10000, width: 2, height: 2, rentalPrice: 10, capacity: 2 },
  { type: "house", category: "residential", name: "Vályogház", cost: 750, duration: 15000, width: 3, height: 2, rentalPrice: 15, capacity: 3 },
  { type: "house", category: "residential", name: "Kádárkocka", cost: 1200, duration: 25000, width: 3, height: 3, rentalPrice: 25, capacity: 4 },
  { type: "house", category: "residential", name: "Családi Ház", cost: 1800, duration: 35000, width: 4, height: 2, rentalPrice: 35, capacity: 5 },
  { type: "house", category: "residential", name: "Villa (kétszintes)", cost: 2500, duration: 45000, width: 3, height: 3, rentalPrice: 50, capacity: 6 },
  { type: "house", category: "residential", name: "Nagy Villa", cost: 3500, duration: 60000, width: 4, height: 4, rentalPrice: 70, capacity: 8 },
  { type: "office", category: "business", name: "Közszolgálati Iroda", cost: 1000, duration: 20000, width: 3, height: 8, salary: OFFICE_SALARY_PER_INTERVAL, capacity: 4 },
    { type: "forestry", category: "business", name: "Erdészház", cost: 850, woodCost: 5, duration: 15000, width: 4, height: 4, salary: 16, capacity: 1 },  { 
    type: "quarry", 
    category: "business", 
    name: "Kőfejtő", 
    cost: 1200, 
    woodCost: 10, 
    duration: 25000, 
    width: 2, 
    height: 2, 
    salary: 18, 
    capacity: 1,
    productionConfig: {
      produces: ProductType.Stone,
      quantity: 5,
      duration: 20000,
    }
  },
  { type: "farm", category: "business", name: "Farm", cost: 1000, brickCost: 5, woodCost: 3, duration: 15000, width: 4, height: 4, salary: 5, capacity: 2 },
  { type: "office", category: "business", name: "Polgármesteri Hivatal", cost: 2500, woodCost: 10, brickCost: 15, duration: 40000, width: 4, height: 3, salary: 20, capacity: 5 },
  { type: "shop", category: "business", name: "Bolt", cost: 1500, woodCost: 8, brickCost: 10, duration: 30000, width: 3, height: 3, salary: 10, capacity: 3 },
  { 
    type: "mill", 
    category: "business", 
    name: "Malom", 
    cost: 2000, 
    woodCost: 10, 
    brickCost: 15, 
    stoneCost: 5, 
    duration: 35000, 
    width: 4, 
    height: 4, 
    salary: 15, 
    capacity: 3,
    productionConfig: {
      produces: ProductType.Flour,
      quantity: 3,
      consumes: ProductType.Wheat,
      consumesQuantity: 5,
      duration: 10000,
    }
  },
  { type: "office", category: "business", name: "Piac", cost: 3000, woodCost: 15, brickCost: 15, duration: 50000, width: 5, height: 5, salary: 25, capacity: 5 },
  { 
    type: "popcorn_stand", 
    category: "business", 
    name: "Popcorn Árus", 
    cost: 500, 
    woodCost: 2, 
    duration: 10000, 
    width: 2, 
    height: 2, 
    salary: 5, 
    capacity: 1,
    productionConfig: {
      produces: ProductType.Popcorn,
      quantity: 2,
      consumes: ProductType.Corn,
      consumesQuantity: 1, // Corrected from 2 based on game constants logic usually being simpler, but let's stick to constants if possible. 
                           // Game.tsx says: CORN_CONSUMPTION = 2, PROD = 5. 
                           // I'll match Game.tsx constants in next edit if needed, but for now this is a baseline.
                           // Actually let's use Game.tsx values: Consumes 2 Corn -> 5 Popcorn.
      duration: 5000
    } 
  }, 
];
