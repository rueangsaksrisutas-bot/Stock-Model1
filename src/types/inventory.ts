export type LiquorCategory =
  | 'Whisky'
  | 'Brandy/Cognac'
  | 'Vodka'
  | 'Gin'
  | 'Rum'
  | 'Tequila'
  | 'Wine'
  | 'Beer'
  | 'Liqueur'
  | 'Thai Spirits'
  | 'Other';

export interface LiquorItem {
  id: string;
  code: string; // e.g. JW-BLK-750
  name: string;
  brand: string;
  category: LiquorCategory;
  volumeMl: number; // e.g. 700, 750, 1000
  bottlesPerCase: number; // typically 12 or 6
  unitCost: number; // Cost price per bottle (THB)
  sellingPrice?: number; // Retail / bar price per bottle
  minStockLevel: number; // Alert threshold in bottles
  initialStock: number; // Baseline count
  currentStock: number; // Current calculated bottles
  location?: string; // Main Bar, Cellar A, VIP Bar, etc.
  notes?: string;
  imageUrl?: string;
}

export type TransactionType = 'IN' | 'OUT' | 'ADJUST';

export interface StockTransaction {
  id: string;
  timestamp: string; // ISO date string
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  type: TransactionType;
  liquorId: string;
  liquorName: string;
  category: LiquorCategory;
  quantity: number; // Number of bottles (positive integer)
  unitCost: number; // Cost at transaction time
  totalValue: number; // quantity * unitCost
  referenceNo?: string; // PO number, Table number, Bill number, etc.
  destination?: string; // Bar 1, Table 08, Kitchen, Banquet, Storage, etc.
  operator: string; // Name of staff / bartender
  reason: string; // Purchase, Sale, Cocktail prep, Breakage, Event, Audit diff
  notes?: string;
}

export interface InventoryStats {
  totalItems: number;
  totalBottles: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  todayInCount: number;
  todayInValue: number;
  todayOutCount: number;
  todayOutValue: number;
}
