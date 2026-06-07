import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, ShoppingBag, Euro } from 'lucide-react';

const PartsSalesStatistics = ({ sales }) => {
  const totalRevenue = sales.reduce((sum, sale) => sum + (Number(sale.sale_price) || 0), 0);
  const totalSold = sales.length;
  const avgPrice = totalSold > 0 ? totalRevenue / totalSold : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card className="bg-slate-800 border-slate-700 text-white">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-400">Ukupan Prihod (Dijelovi)</CardTitle>
          <div className="p-2 bg-green-500/20 rounded-lg">
            <Euro className="w-4 h-4 text-green-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-400">€{totalRevenue.toFixed(2)}</div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700 text-white">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-400">Prodato Dijelova</CardTitle>
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <ShoppingBag className="w-4 h-4 text-blue-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalSold} kom</div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700 text-white">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-400">Prosječna Cijena</CardTitle>
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">€{avgPrice.toFixed(2)}</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PartsSalesStatistics;