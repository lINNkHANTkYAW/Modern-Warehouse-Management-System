import { InventoryItem, StockMovement, Order } from './types';

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: '1',
    sku: 'TECH-001',
    name: 'Wireless Ergonomic Mouse',
    category: 'Electronics',
    quantity: 45,
    minStockLevel: 20,
    location: 'A-12-01',
    lastUpdated: new Date().toISOString(),
    price: 59.99,
    description: 'High precision wireless mouse with 2 year battery life.',
    batchNumber: 'B-2023-001',
    weight: 0.2
  },
  {
    id: '2',
    sku: 'FUR-105',
    name: 'Mesh Office Chair',
    category: 'Furniture',
    quantity: 8,
    minStockLevel: 10,
    location: 'B-05-02',
    lastUpdated: new Date().toISOString(),
    price: 129.50,
    description: 'Breathable mesh back support office chair.',
    dimensions: '60x60x100 cm',
    weight: 12.5
  },
  {
    id: '3',
    sku: 'OFF-202',
    name: 'A4 Printer Paper (500 sheets)',
    category: 'Office Supplies',
    quantity: 120,
    minStockLevel: 50,
    location: 'C-01-05',
    lastUpdated: new Date().toISOString(),
    price: 5.99,
    description: 'Premium bright white paper.',
    batchNumber: 'P-9982',
    weight: 2.5
  },
  {
    id: '4',
    sku: 'TECH-009',
    name: 'USB-C Docking Station',
    category: 'Electronics',
    quantity: 15,
    minStockLevel: 15,
    location: 'A-12-04',
    lastUpdated: new Date().toISOString(),
    price: 199.99,
    description: 'Dual 4K monitor support docking station.',
    serialNumber: 'SN-99283-X',
    weight: 0.8
  }
];

export const INITIAL_MOVEMENTS: StockMovement[] = [
  {
    id: 'm1',
    itemId: '1',
    type: 'IN',
    quantity: 50,
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    reason: 'Initial Restock'
  },
  {
    id: 'm2',
    itemId: '2',
    type: 'OUT',
    quantity: 2,
    timestamp: new Date(Date.now() - 86400000 * 1).toISOString(),
    reason: 'Sales Order #1001'
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'PO-2024-001',
    type: 'INBOUND',
    status: 'PENDING',
    partnerName: 'Tech Supplies Inc.',
    date: new Date().toISOString(),
    items: [
      { itemId: '1', sku: 'TECH-001', name: 'Wireless Ergonomic Mouse', quantity: 20, received: 0 },
      { itemId: '4', sku: 'TECH-009', name: 'USB-C Docking Station', quantity: 5, received: 0 }
    ]
  },
  {
    id: 'SO-2024-101',
    type: 'OUTBOUND',
    status: 'PENDING',
    partnerName: 'Acme Corp HQ',
    date: new Date().toISOString(),
    items: [
      { itemId: '2', sku: 'FUR-105', name: 'Mesh Office Chair', quantity: 2, picked: 0 },
      { itemId: '3', sku: 'OFF-202', name: 'A4 Printer Paper', quantity: 10, picked: 0 }
    ]
  },
  {
    id: 'SO-2024-102',
    type: 'OUTBOUND',
    status: 'PROCESSING',
    partnerName: 'Startup Hub',
    date: new Date(Date.now() - 3600000).toISOString(),
    items: [
      { itemId: '1', sku: 'TECH-001', name: 'Wireless Ergonomic Mouse', quantity: 5, picked: 0 }
    ]
  }
];

export const CATEGORIES = ['Electronics', 'Furniture', 'Office Supplies', 'Apparel', 'Industrial', 'Other'];
