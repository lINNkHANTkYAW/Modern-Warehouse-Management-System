import React, { useState } from 'react';
import { Truck, CheckSquare, ClipboardCheck, ArrowRight, MapPin, AlertCircle } from 'lucide-react';
import { Order, InventoryItem } from '../types';
import { suggestPutawayLocation } from '../services/geminiService';

interface InboundProps {
  orders: Order[];
  onReceive: (orderId: string, itemId: string, qty: number, location: string) => void;
  inventory: InventoryItem[];
}

const Inbound: React.FC<InboundProps> = ({ orders, onReceive, inventory }) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [receivingItem, setReceivingItem] = useState<{itemId: string, name: string, qty: number} | null>(null);
  const [qualityPassed, setQualityPassed] = useState(true);
  const [suggestedLocation, setSuggestedLocation] = useState('');
  const [isGettingAiSuggestion, setIsGettingAiSuggestion] = useState(false);
  const [manualLocation, setManualLocation] = useState('');

  const inboundOrders = orders.filter(o => o.type === 'INBOUND' && o.status !== 'COMPLETED');

  const handleStartReceive = (order: Order) => {
    setSelectedOrder(order);
  };

  const openReceiveModal = async (item: {itemId: string, name: string, quantity: number, received?: number}) => {
    const remaining = item.quantity - (item.received || 0);
    if (remaining <= 0) return;

    setReceivingItem({ itemId: item.itemId, name: item.name, qty: remaining });
    setQualityPassed(true);
    setManualLocation('');
    setSuggestedLocation('');
    setIsGettingAiSuggestion(true);

    // AI Directed Putaway
    try {
      const invItem = inventory.find(i => i.id === item.itemId);
      const existingLocs = inventory.map(i => i.location);
      const existingCats = Array.from(new Set(inventory.map(i => i.category))) as string[];
      
      const loc = await suggestPutawayLocation(
        { name: item.name, category: invItem?.category || 'Unknown' },
        existingCats,
        existingLocs
      );
      setSuggestedLocation(loc);
    } catch (e) {
      setSuggestedLocation('A-00-00');
    } finally {
      setIsGettingAiSuggestion(false);
    }
  };

  const confirmReceive = () => {
    if (!selectedOrder || !receivingItem) return;
    const finalLocation = manualLocation || suggestedLocation;
    
    onReceive(selectedOrder.id, receivingItem.itemId, receivingItem.qty, finalLocation);
    setReceivingItem(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Order List */}
        <div className="md:col-span-1 space-y-4">
          <h3 className="font-semibold text-slate-700 flex items-center gap-2">
            <Truck className="w-5 h-5 text-indigo-600" />
            Expected Arrivals (ASNs)
          </h3>
          <div className="space-y-3">
            {inboundOrders.length === 0 ? (
              <div className="p-4 bg-white rounded-xl border border-slate-100 text-slate-400 text-sm text-center">
                No pending inbound orders.
              </div>
            ) : (
              inboundOrders.map(order => (
                <div 
                  key={order.id}
                  onClick={() => handleStartReceive(order)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedOrder?.id === order.id 
                      ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200' 
                      : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-slate-800">{order.id}</span>
                    <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full font-medium">
                      {order.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mb-2">{order.partnerName}</p>
                  <div className="text-xs text-slate-400">
                    {order.items.length} Items • {new Date(order.date).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Receiving Workspace */}
        <div className="md:col-span-2">
          {selectedOrder ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 h-full">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Receiving: {selectedOrder.id}</h2>
                  <p className="text-sm text-slate-500">From: {selectedOrder.partnerName}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-slate-600">Progress</div>
                  <div className="text-2xl font-bold text-indigo-600">
                    {Math.round((selectedOrder.items.reduce((acc, i) => acc + (i.received || 0), 0) / selectedOrder.items.reduce((acc, i) => acc + i.quantity, 0)) * 100)}%
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {selectedOrder.items.map((item, idx) => {
                  const received = item.received || 0;
                  const isComplete = received >= item.quantity;
                  
                  return (
                    <div key={idx} className={`flex items-center justify-between p-4 rounded-lg border ${isComplete ? 'bg-green-50 border-green-100' : 'bg-slate-50 border-slate-100'}`}>
                      <div className="flex-1">
                        <div className="font-medium text-slate-800">{item.name}</div>
                        <div className="text-xs text-slate-500 font-mono">{item.sku}</div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-sm">
                          <span className="font-medium">{received}</span>
                          <span className="text-slate-400"> / {item.quantity}</span>
                        </div>
                        {!isComplete && (
                          <button 
                            onClick={() => openReceiveModal(item)}
                            className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
                          >
                            Receive
                          </button>
                        )}
                        {isComplete && <CheckSquare className="w-5 h-5 text-green-600" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200 p-12">
              <ClipboardCheck className="w-12 h-12 mb-4 text-slate-300" />
              <p>Select an order to start receiving inventory</p>
            </div>
          )}
        </div>
      </div>

      {/* Receiving Modal */}
      {receivingItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Receive Item</h3>
              <p className="text-sm text-slate-500">{receivingItem.name}</p>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Quality Check */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Quality Inspection</label>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setQualityPassed(true)}
                    className={`flex-1 py-3 px-4 rounded-lg border flex items-center justify-center gap-2 transition ${
                      qualityPassed ? 'bg-green-50 border-green-200 text-green-700 ring-1 ring-green-200' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CheckSquare className="w-4 h-4" /> Pass
                  </button>
                  <button 
                    onClick={() => setQualityPassed(false)}
                    className={`flex-1 py-3 px-4 rounded-lg border flex items-center justify-center gap-2 transition ${
                      !qualityPassed ? 'bg-red-50 border-red-200 text-red-700 ring-1 ring-red-200' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4" /> Fail / Damage
                  </button>
                </div>
              </div>

              {/* Putaway Logic */}
              {qualityPassed && (
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-2">Directed Putaway</label>
                   <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                      <div className="flex items-start gap-3">
                         <div className="mt-1">
                            {isGettingAiSuggestion ? (
                              <div className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin"></div>
                            ) : (
                              <MapPin className="w-5 h-5 text-indigo-600" />
                            )}
                         </div>
                         <div className="flex-1">
                           <p className="text-xs font-semibold text-indigo-800 uppercase tracking-wide">AI Suggested Location</p>
                           <p className="text-lg font-bold text-indigo-900 mt-1">
                             {isGettingAiSuggestion ? "Analyzing optimal placement..." : suggestedLocation}
                           </p>
                           {!isGettingAiSuggestion && (
                              <p className="text-xs text-indigo-600 mt-1">Based on item category and velocity.</p>
                           )}
                         </div>
                      </div>
                   </div>
                   
                   <div className="mt-4">
                     <label className="text-xs text-slate-500 mb-1 block">Override Location (Optional)</label>
                     <input 
                      type="text"
                      placeholder="Scan or enter location code"
                      value={manualLocation}
                      onChange={(e) => setManualLocation(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                     />
                   </div>
                </div>
              )}

              {!qualityPassed && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                  Item marked for Quarantine area. Inventory will be flagged as Damaged.
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setReceivingItem(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition text-sm font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={confirmReceive}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm text-sm font-medium flex items-center gap-2"
              >
                Confirm Receipt <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inbound;