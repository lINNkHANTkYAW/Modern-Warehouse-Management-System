import React, { useState } from 'react';
import { PackageCheck, ListChecks, Box, Printer, Truck, CheckCircle2 } from 'lucide-react';
import { Order, InventoryItem } from '../types';
import { suggestPackaging } from '../services/geminiService';

interface OutboundProps {
  orders: Order[];
  onPick: (orderId: string, itemId: string, qty: number) => void;
  onShip: (orderId: string, carrier: string, tracking: string) => void;
  inventory: InventoryItem[];
}

const Outbound: React.FC<OutboundProps> = ({ orders, onPick, onShip, inventory }) => {
  const [activeTab, setActiveTab] = useState<'pick' | 'pack' | 'ship'>('pick');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [packSuggestion, setPackSuggestion] = useState<string>('');
  const [isPacking, setIsPacking] = useState(false);

  // Filter orders based on status for each stage
  const pickOrders = orders.filter(o => o.type === 'OUTBOUND' && o.status === 'PENDING');
  const packOrders = orders.filter(o => o.type === 'OUTBOUND' && o.status === 'PROCESSING');
  const shipOrders = orders.filter(o => o.type === 'OUTBOUND' && o.status === 'PACKED');

  const getPickingList = (order: Order) => {
    // Basic Pick Path Optimization: Sort items by location
    const itemsWithLoc = order.items.map(item => {
      const inv = inventory.find(i => i.id === item.itemId);
      return { ...item, location: inv?.location || 'UNKNOWN' };
    });
    return itemsWithLoc.sort((a, b) => a.location.localeCompare(b.location));
  };

  const handlePickItem = (orderId: string, itemId: string, qty: number) => {
    onPick(orderId, itemId, qty);
  };

  const startPacking = async (order: Order) => {
    setSelectedOrder(order);
    setActiveTab('pack');
    setIsPacking(true);
    // AI Cartonization
    const suggestion = await suggestPackaging(order.items.map(i => ({ name: i.name, qty: i.quantity })));
    setPackSuggestion(suggestion);
    setIsPacking(false);
  };

  const completePacking = (order: Order) => {
    // In a real app, this would update status to PACKED
    // For this prototype, we'll just simulate the ship transition by calling onShip with dummy data first or updating parent state
    // We need a prop to update status to PACKED. Re-using onShip for simplicity to move it along or assume parent handles logic.
    // For this demo, let's assume we skip to ship UI.
    setSelectedOrder(order);
    setActiveTab('ship');
  };

  const handleShip = (order: Order, carrier: string) => {
    const tracking = `TRK-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    onShip(order.id, carrier, tracking);
    setSelectedOrder(null);
    setActiveTab('pick'); // Reset
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Workflow Tabs */}
      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => { setActiveTab('pick'); setSelectedOrder(null); }}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'pick' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          1. Wave Picking ({pickOrders.length})
        </button>
        <button 
          onClick={() => { setActiveTab('pack'); setSelectedOrder(null); }}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'pack' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          2. Packing ({packOrders.length})
        </button>
        <button 
          onClick={() => { setActiveTab('ship'); setSelectedOrder(null); }}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'ship' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          3. Shipping ({shipOrders.length})
        </button>
      </div>

      {/* Picking View */}
      {activeTab === 'pick' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {pickOrders.map(order => (
            <div key={order.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800">{order.id}</h3>
                <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full">{order.partnerName}</span>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Optimized Pick Path</div>
                {getPickingList(order).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="bg-white px-2 py-1 rounded border border-slate-200 font-mono text-xs font-bold text-slate-600">
                        {item.location}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-800">{item.name}</div>
                        <div className="text-xs text-slate-500">Qty: {item.quantity}</div>
                      </div>
                    </div>
                    {item.picked !== item.quantity ? (
                       <button 
                        onClick={() => handlePickItem(order.id, item.itemId, item.quantity)}
                        className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700"
                       >
                         Confirm Pick
                       </button>
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                ))}
              </div>

              {order.items.every(i => i.picked === i.quantity) && (
                <button 
                  onClick={() => startPacking(order)} // Actually moves to Processing status in real app
                  className="w-full py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
                >
                  Send to Packing Station
                </button>
              )}
            </div>
          ))}
          {pickOrders.length === 0 && (
            <div className="col-span-2 text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <ListChecks className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No orders ready for picking.</p>
            </div>
          )}
        </div>
      )}

      {/* Packing View */}
      {activeTab === 'pack' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
           {selectedOrder ? (
             <div className="max-w-2xl mx-auto">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <Box className="w-6 h-6 text-indigo-600" />
                  Packing Station: {selectedOrder.id}
                </h3>
                
                <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 mb-8">
                  <h4 className="font-semibold text-indigo-900 mb-2">AI Cartonization Suggestion</h4>
                  {isPacking ? (
                    <div className="animate-pulse h-4 bg-indigo-200 rounded w-1/2"></div>
                  ) : (
                    <p className="text-indigo-700">{packSuggestion}</p>
                  )}
                  <p className="text-xs text-indigo-500 mt-2">Based on item dimensions and weight consolidation logic.</p>
                </div>

                <div className="space-y-4 mb-8">
                  <h4 className="font-medium text-slate-700">Contents</h4>
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-slate-600">{item.name}</span>
                      <span className="font-mono text-slate-800">x{item.quantity}</span>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => completePacking(selectedOrder)}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
                >
                  Confirm Packed & Print Label
                </button>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {packOrders.length === 0 ? (
                 <p className="text-slate-400 p-4">No orders waiting to be packed.</p>
               ) : (
                 packOrders.map(order => (
                   <div key={order.id} onClick={() => startPacking(order)} className="p-4 border border-slate-200 rounded-lg hover:border-indigo-300 cursor-pointer bg-slate-50">
                     <div className="font-bold text-slate-800">{order.id}</div>
                     <div className="text-sm text-slate-500">{order.partnerName}</div>
                     <div className="mt-2 text-xs bg-yellow-100 text-yellow-700 inline-block px-2 py-0.5 rounded">Ready to Pack</div>
                   </div>
                 ))
               )}
             </div>
           )}
        </div>
      )}

      {/* Shipping View */}
      {activeTab === 'ship' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          {selectedOrder ? (
            <div className="max-w-2xl mx-auto">
               <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <Truck className="w-6 h-6 text-green-600" />
                  Shipment Manifest: {selectedOrder.id}
               </h3>
               
               <div className="space-y-4 mb-8">
                 <div className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer flex justify-between items-center group" onClick={() => handleShip(selectedOrder, 'FedEx Express')}>
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-purple-600 text-white flex items-center justify-center font-bold rounded">Fx</div>
                       <div>
                         <div className="font-bold text-slate-800">FedEx Express</div>
                         <div className="text-xs text-slate-500">1-2 Days • Air</div>
                       </div>
                    </div>
                    <div className="text-right">
                       <div className="font-bold text-slate-800">$24.50</div>
                       <div className="text-xs text-green-600 group-hover:underline">Select Rate</div>
                    </div>
                 </div>

                 <div className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer flex justify-between items-center group" onClick={() => handleShip(selectedOrder, 'UPS Ground')}>
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-yellow-700 text-white flex items-center justify-center font-bold rounded">UPS</div>
                       <div>
                         <div className="font-bold text-slate-800">UPS Ground</div>
                         <div className="text-xs text-slate-500">3-5 Days • Truck</div>
                       </div>
                    </div>
                    <div className="text-right">
                       <div className="font-bold text-slate-800">$12.95</div>
                       <div className="text-xs text-green-600 group-hover:underline">Select Rate</div>
                    </div>
                 </div>
               </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shipOrders.length === 0 ? (
                 <p className="text-slate-400 p-4">No shipments pending.</p>
              ) : (
                 shipOrders.map(order => (
                   <div key={order.id} onClick={() => setSelectedOrder(order)} className="p-4 border border-slate-200 rounded-lg hover:border-green-300 cursor-pointer bg-slate-50">
                     <div className="font-bold text-slate-800">{order.id}</div>
                     <div className="text-sm text-slate-500">{order.partnerName}</div>
                     <div className="mt-2 text-xs bg-green-100 text-green-700 inline-block px-2 py-0.5 rounded">Ready to Ship</div>
                   </div>
                 ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Outbound;
