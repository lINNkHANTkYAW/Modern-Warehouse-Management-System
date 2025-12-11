import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie 
} from 'recharts';
import { Package, AlertTriangle, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { InventoryItem, AiInsight } from '../types';

interface DashboardProps {
  inventory: InventoryItem[];
  insights: AiInsight[];
}

const Dashboard: React.FC<DashboardProps> = ({ inventory, insights }) => {
  
  const stats = useMemo(() => {
    const totalItems = inventory.reduce((acc, item) => acc + item.quantity, 0);
    const lowStockItems = inventory.filter(item => item.quantity <= item.minStockLevel).length;
    const totalValue = inventory.reduce((acc, item) => acc + (item.quantity * (item.price || 0)), 0);
    const uniqueSKUs = inventory.length;
    
    return { totalItems, lowStockItems, totalValue, uniqueSKUs };
  }, [inventory]);

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    inventory.forEach(item => {
      counts[item.category] = (counts[item.category] || 0) + item.quantity;
    });
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  }, [inventory]);

  const lowStockData = useMemo(() => {
    return inventory
      .filter(i => i.quantity <= i.minStockLevel + 5) // Show items near low stock
      .map(i => ({ name: i.sku, quantity: i.quantity, min: i.minStockLevel }))
      .slice(0, 7);
  }, [inventory]);

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981', '#f59e0b'];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Inventory</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{stats.totalItems}</h3>
            </div>
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Package className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-green-600">
            <TrendingUp className="w-3 h-3 mr-1" />
            <span>{stats.uniqueSKUs} Unique SKUs</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Inventory Value</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">${stats.totalValue.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-emerald-50 rounded-lg">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
           <div className="mt-4 flex items-center text-xs text-slate-400">
            <span>Estimated total asset value</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Low Stock Alerts</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{stats.lowStockItems}</h3>
            </div>
            <div className="p-2 bg-amber-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-amber-600">
            <span>Requires attention</span>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-xl shadow-lg text-white relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-indigo-100 text-sm font-medium">AI Insights</p>
            <div className="mt-2 space-y-2">
              {insights.length > 0 ? (
                insights.slice(0, 2).map((insight, idx) => (
                  <div key={idx} className="text-xs bg-white/10 p-2 rounded backdrop-blur-sm border border-white/10">
                    {insight.message}
                  </div>
                ))
              ) : (
                <div className="text-xs text-indigo-200">System analyzing inventory patterns...</div>
              )}
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 lg:col-span-2">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Stock Level vs Minimum Threshold</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lowStockData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="quantity" fill="#6366f1" radius={[4, 4, 0, 0]} name="Current Stock" />
                <Bar dataKey="min" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="Min Level" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Category Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4 max-h-32 overflow-y-auto no-scrollbar">
            {categoryData.map((item, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="font-medium text-slate-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
