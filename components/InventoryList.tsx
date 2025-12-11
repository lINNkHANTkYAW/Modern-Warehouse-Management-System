import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, MapPin, AlertCircle, ScanLine, RotateCw, Calendar } from 'lucide-react';
import { InventoryItem } from '../types';
import Scanner from './Scanner';

interface InventoryListProps {
  items: InventoryItem[];
  onAdd: (item: Omit<InventoryItem, 'id' | 'lastUpdated'>) => void;
  onEdit: (id: string, updates: Partial<InventoryItem>) => void;
  onDelete: (id: string) => void;
}

const InventoryList: React.FC<InventoryListProps> = ({ items, onAdd, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [cycleCountId, setCycleCountId] = useState<string | null>(null);
  const [newCount, setNewCount] = useState<number>(0);
  
  const emptyForm = {
    sku: '',
    name: '',
    category: 'Other',
    quantity: 0,
    minStockLevel: 10,
    location: '',
    price: 0,
    description: '',
    batchNumber: '',
    serialNumber: '',
    expirationDate: ''
  };

  const [formData, setFormData] = useState(emptyForm);

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
    setIsModalOpen(false);
    setFormData(emptyForm);
  };

  const handleScanComplete = (data: Partial<InventoryItem>) => {
    setFormData(prev => ({
      ...prev,
      name: data.name || prev.name,
      category: data.category || prev.category,
      price: data.price || prev.price,
      description: data.description || prev.description,
      sku: data.sku || prev.sku
    }));
    setIsScannerOpen(false);
  };
  
  const handleCycleCount = (id: string, currentQty: number) => {
    setCycleCountId(id);
    setNewCount(currentQty);
  };

  const confirmCycleCount = (id: string) => {
    onEdit(id, { quantity: newCount, lastUpdated: new Date().toISOString() });
    setCycleCountId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, SKU, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-sm text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-medium">Item Details</th>
                <th className="px-6 py-4 font-medium">Tracking</th>
                <th className="px-6 py-4 font-medium">Stock Level</th>
                <th className="px-6 py-4 font-medium">Location</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-slate-900">{item.name}</div>
                      <div className="text-xs text-slate-400">{item.sku}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                        {item.category}
                      </span>
                      {item.batchNumber && (
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          <span className="font-mono bg-indigo-50 text-indigo-700 px-1 rounded">Lot: {item.batchNumber}</span>
                        </div>
                      )}
                      {item.expirationDate && (
                        <div className="text-xs text-red-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Exp: {item.expirationDate}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {cycleCountId === item.id ? (
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          value={newCount} 
                          onChange={(e) => setNewCount(parseInt(e.target.value))}
                          className="w-16 px-2 py-1 border border-indigo-300 rounded focus:ring-1 focus:ring-indigo-500"
                        />
                        <button onClick={() => confirmCycleCount(item.id)} className="text-green-600 hover:text-green-700 font-medium text-xs">Save</button>
                        <button onClick={() => setCycleCountId(null)} className="text-slate-400 hover:text-slate-500 text-xs">X</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group">
                        <div className={`w-2 h-2 rounded-full ${item.quantity <= item.minStockLevel ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                        <span className={item.quantity <= item.minStockLevel ? 'text-red-600 font-medium' : 'text-slate-700'}>
                          {item.quantity}
                        </span>
                        {item.quantity <= item.minStockLevel && (
                          <AlertCircle className="w-3 h-3 text-red-500" />
                        )}
                        <button 
                          onClick={() => handleCycleCount(item.id, item.quantity)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 rounded transition"
                          title="Cycle Count"
                        >
                          <RotateCw className="w-3 h-3 text-indigo-600" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-slate-500">
                      <MapPin className="w-3 h-3" />
                      {item.location}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => onDelete(item.id)} className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Add New Inventory Item</h3>
              <button 
                onClick={() => setIsScannerOpen(true)}
                className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition text-sm font-medium"
              >
                <ScanLine className="w-4 h-4" />
                Auto-Fill with AI
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">SKU</label>
                <input required value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                  {['Electronics', 'Furniture', 'Office Supplies', 'Apparel', 'Industrial', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

               <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                <input placeholder="e.g. A-12-05" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Qty</label>
                <input type="number" required min="0" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
               <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Min Level</label>
                <input type="number" required min="0" value={formData.minStockLevel} onChange={e => setFormData({...formData, minStockLevel: parseInt(e.target.value)})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>

              {/* New Fields */}
              <div className="col-span-2 md:col-span-1">
                 <label className="block text-sm font-medium text-slate-700 mb-1">Batch / Lot #</label>
                 <input value={formData.batchNumber} onChange={e => setFormData({...formData, batchNumber: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="col-span-2 md:col-span-1">
                 <label className="block text-sm font-medium text-slate-700 mb-1">Expiration Date</label>
                 <input type="date" value={formData.expirationDate} onChange={e => setFormData({...formData, expirationDate: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              
              <div className="col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition text-sm font-medium">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm text-sm font-medium">Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isScannerOpen && (
        <Scanner 
          onScanComplete={handleScanComplete} 
          onClose={() => setIsScannerOpen(false)} 
        />
      )}
    </div>
  );
};

export default InventoryList;
