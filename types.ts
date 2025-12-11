export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  minStockLevel: number;
  location: string;
  lastUpdated: string;
  description?: string;
  price?: number;
  // New operational fields
  batchNumber?: string;
  serialNumber?: string;
  expirationDate?: string;
  dimensions?: string; // LxWxH
  weight?: number;
}

export interface StockMovement {
  id: string;
  itemId: string;
  type: 'IN' | 'OUT';
  quantity: number;
  timestamp: string;
  reason: string;
}

export interface AiInsight {
  type: 'warning' | 'suggestion' | 'success';
  message: string;
  actionable?: boolean;
}

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'PACKED' | 'SHIPPED' | 'RECEIVED' | 'COMPLETED';

export interface OrderItem {
  itemId: string;
  sku: string; // denormalized for easier display
  name: string;
  quantity: number;
  picked?: number; // for outbound
  received?: number; // for inbound
}

export interface Order {
  id: string;
  type: 'INBOUND' | 'OUTBOUND';
  status: OrderStatus;
  partnerName: string; // Supplier or Customer
  items: OrderItem[];
  date: string;
  trackingNumber?: string;
  carrier?: string;
}

export type ViewState = 'dashboard' | 'inventory' | 'inbound' | 'outbound' | 'assistant';
