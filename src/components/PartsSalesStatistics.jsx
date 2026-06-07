import React from 'react';
import { TrendingUp, ShoppingBag, Euro } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, iconClass, valueClass = 'text-white' }) => (
  <div className="rounded-lg border border-slate-700 bg-slate-800 p-6 text-white shadow-sm">
    <div className="flex flex-row items-center justify-between pb-2">
      <p className="text-sm font-medium text-slate-300">{title}</p>
      <div className={`p-2 rounded-lg ${iconClass}`}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
    <div className={`text-2xl font-bold ${valueClass}`}>{value}</div>
  </div>
);

const PartsSalesStatistics = ({ sales }) => {
  const totalRevenue = sales.reduce((sum, sale) => sum + (Number(sale.sale_price) || 0), 0);
  const totalSold = sales.length;
  const avgPrice = totalSold > 0 ? totalRevenue / totalSold : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <StatCard
        title="Ukupan Prihod (Dijelovi)"
        value={`€${totalRevenue.toFixed(2)}`}
        icon={Euro}
        iconClass="bg-green-500/20 text-green-400"
        valueClass="text-green-400"
      />
      <StatCard
        title="Prodato Dijelova"
        value={`${totalSold} kom`}
        icon={ShoppingBag}
        iconClass="bg-blue-500/20 text-blue-400"
        valueClass="text-blue-300"
      />
      <StatCard
        title="Prosječna Cijena"
        value={`€${avgPrice.toFixed(2)}`}
        icon={TrendingUp}
        iconClass="bg-purple-500/20 text-purple-400"
        valueClass="text-purple-300"
      />
    </div>
  );
};

export default PartsSalesStatistics;
