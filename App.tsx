import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Package, ArrowLeftRight, Bot, Box, Menu, X, Truck, ArrowUpRight } from 'lucide-react';
import Dashboard from './components/Dashboard';
import InventoryList from './components/InventoryList';
import Assistant from './components/Assistant';
import Inbound from './components/Inbound';
import Outbound from './components/Outbound';
import { InventoryItem, StockMovement, AiInsight, ViewState, Order } from './types';
import { INITIAL_INVENTORY, INITIAL_ORDERS } from './constants';
import { getInventoryInsights } from './services/geminiService';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // State
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('nexus_inventory');
    return saved ? JSON.parse(saved) : INITIAL_INVENTORY;
  });
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('nexus_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });
  const [insights, setInsights] = useState<AiInsight[]>([]);

  useEffect(() => {
    localStorage.setItem('nexus_inventory', JSON.stringify(inventory));
    localStorage.setItem('nexus_orders', JSON.stringify(orders));
    
    if (inventory.length > 0 && insights.length === 0) {
      getInventoryInsights(inventory).then(setInsights);
    }
  }, [inventory, orders, insights.length]);

  const handleAddItem = (item: Omit<InventoryItem, 'id' | 'lastUpdated'>) => {
    const newItem: InventoryItem = {
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      lastUpdated: new Date().toISOString()
    };
    setInventory(prev => [...prev, newItem]);
  };

  const handleEditItem = (id: string, updates: Partial<InventoryItem>) => {
    setInventory(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleDeleteItem = (id: string) => {
    setInventory(prev => prev.filter(i => i.id !== id));
  };

  // Inbound Action: Receive Item
  const handleReceiveItem = (orderId: string, itemId: string, qty: number, location: string) => {
    // 1. Update Order State
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      
      const newItems = order.items.map(i => {
        if (i.itemId === itemId) {
          return { ...i, received: (i.received || 0) + qty };
        }
        return i;
      });

      // Check if order is complete
      const isComplete = newItems.every(i => (i.received || 0) >= i.quantity);
      
      return {
        ...order,
        items: newItems,
        status: isComplete ? 'COMPLETED' : 'PROCESSING'
      };
    }));

    // 2. Update Inventory
    setInventory(prev => {
      const existing = prev.find(i => i.id === itemId);
      if (existing) {
        return prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity + qty, location, lastUpdated: new Date().toISOString() } : i);
      }
      return prev; // In real app, might create new item stub
    });
  };

  // Outbound Action: Pick Item
  const handlePickItem = (orderId: string, itemId: string, qty: number) => {
    // 1. Update Order
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      
      const newItems = order.items.map(i => {
        if (i.itemId === itemId) {
          return { ...i, picked: (i.picked || 0) + qty };
        }
        return i;
      });
      
      const isPicked = newItems.every(i => (i.picked || 0) >= i.quantity);

      return {
        ...order,
        items: newItems,
        status: isPicked ? 'PROCESSING' : 'PENDING' // Moves to Pack status (Processing)
      };
    }));

    // 2. Decrement Inventory
    setInventory(prev => prev.map(i => {
      if (i.id === itemId) {
        return { ...i, quantity: Math.max(0, i.quantity - qty), lastUpdated: new Date().toISOString() };
      }
      return i;
    }));
  };

  // Outbound Action: Ship Order
  const handleShipOrder = (orderId: string, carrier: string, tracking: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'SHIPPED', carrier, trackingNumber: tracking } : o));
  };

  const NavItem = ({ id, icon: Icon, label }: { id: ViewState, icon: any, label: string }) => (
    <button
      onClick={() => { setView(id); setIsSidebarOpen(false); }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        view === id 
          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
          : 'text-slate-600 hover:bg-slate-100 hover:text-indigo-600'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-20 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-100 px-4 py-6 flex flex-col transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center gap-3 px-4 mb-8">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <Box className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl text-slate-800 tracking-tight">Nexus<span className="text-indigo-600">WMS</span></h1>
            <p className="text-xs text-slate-400 font-medium tracking-wide">ENTERPRISE</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Overview</div>
          <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem id="inventory" icon={Package} label="Inventory" />
          
          <div className="px-4 py-2 mt-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Operations</div>
          <NavItem id="inbound" icon={Truck} label="Inbound (Receive)" />
          <NavItem id="outbound" icon={ArrowUpRight} label="Outbound (Pick)" />
          
          <div className="px-4 py-2 mt-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Intelligence</div>
          <NavItem id="assistant" icon={Bot} label="AI Assistant" />
        </nav>

        <div className="mt-auto px-4 py-4 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
               <span className="text-xs font-bold text-indigo-700">JD</span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">John Doe</p>
              <p className="text-xs text-slate-400">Warehouse Mgr</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header (Mobile Only for Menu) */}
        <header className="lg:hidden h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Box className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-800">Nexus</span>
          </div>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-600">
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 relative">
          <div className="max-w-7xl mx-auto h-full">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-800">
                {view === 'dashboard' && 'Overview'}
                {view === 'inventory' && 'Inventory Management'}
                {view === 'inbound' && 'Inbound Operations'}
                {view === 'outbound' && 'Outbound Operations'}
                {view === 'assistant' && 'AI Assistant'}
              </h2>
              <p className="text-slate-500">
                {view === 'dashboard' && 'Welcome back, here is what is happening today.'}
                {view === 'inventory' && 'Manage your stock, cycle counts, and item details.'}
                {view === 'inbound' && 'Receive shipments, inspect quality, and put away stock.'}
                {view === 'outbound' && 'Pick, pack, and ship orders efficiently.'}
                {view === 'assistant' && 'Ask Gemini about your warehouse status.'}
              </p>
            </div>

            {view === 'dashboard' && <Dashboard inventory={inventory} insights={insights} />}
            
            {view === 'inventory' && (
              <InventoryList 
                items={inventory} 
                onAdd={handleAddItem} 
                onEdit={handleEditItem} 
                onDelete={handleDeleteItem} 
              />
            )}
            
            {view === 'inbound' && (
              <Inbound 
                orders={orders} 
                inventory={inventory}
                onReceive={handleReceiveItem}
              />
            )}

            {view === 'outbound' && (
              <Outbound 
                orders={orders} 
                inventory={inventory}
                onPick={handlePickItem}
                onShip={handleShipOrder}
              />
            )}

            {view === 'assistant' && <Assistant inventory={inventory} />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
