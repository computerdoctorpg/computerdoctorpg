import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, TrendingDown, Activity, Calendar } from 'lucide-react';
const FinanceDashboard = ({
  tickets
}) => {
  const analytics = useMemo(() => {
    const completedTickets = tickets.filter(t => t.status === 'completed');

    // Initialize monthly data structure
    const monthlyData = {};
    let totalRevenue = 0;
    let totalPartsCost = 0;
    let totalLabor = 0;
    let totalEstimated = 0;
    completedTickets.forEach(ticket => {
      const date = new Date(ticket.completedAt || ticket.createdAt);
      const monthKey = date.toLocaleString('en-US', {
        month: 'long',
        year: 'numeric'
      });
      const parts = parseFloat(ticket.partsCost || 0);
      const labor = parseFloat(ticket.serviceCost || 0);
      const estimate = parseFloat(ticket.estimatedCost || 0);
      const total = parts + labor;

      // Global Totals
      totalRevenue += total;
      totalPartsCost += parts;
      totalLabor += labor;
      if (estimate > 0) totalEstimated += estimate;

      // Monthly Aggregation
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          revenue: 0,
          parts: 0,
          labor: 0,
          estimated: 0,
          count: 0,
          dateObj: date // for sorting
        };
      }
      monthlyData[monthKey].revenue += total;
      monthlyData[monthKey].parts += parts;
      monthlyData[monthKey].labor += labor;
      monthlyData[monthKey].estimated += estimate > 0 ? estimate : total; // Fallback to total if no estimate for diff calc
      monthlyData[monthKey].count += 1;
    });

    // Convert to array and sort by date descending
    const monthlyList = Object.values(monthlyData).sort((a, b) => b.dateObj - a.dateObj);
    return {
      totalRevenue,
      totalPartsCost,
      totalLabor,
      netProfit: totalRevenue - totalPartsCost,
      monthlyList,
      completedCount: completedTickets.length
    };
  }, [tickets]);
  const formatCurrency = amount => {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };
  return <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-xs text-slate-400 font-mono bg-slate-900 px-2 py-1 rounded">EUR</span>
          </div>
          <h3 className="text-slate-400 text-sm font-medium">UKUPNI PRIHODI</h3>
          <p className="text-2xl font-bold text-white mt-1">{formatCurrency(analytics.totalRevenue)}</p>
          <p className="text-xs text-slate-500 mt-1">From {analytics.completedCount} completed tickets</p>
        </motion.div>

        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.1
      }} className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <h3 className="text-slate-400 text-sm font-medium">Prihod</h3>
          <p className="text-2xl font-bold text-white mt-1">{formatCurrency(analytics.totalLabor)}</p>
          <p className="text-xs text-green-400 mt-1 flex items-center">
             {analytics.totalRevenue > 0 ? (analytics.totalLabor / analytics.totalRevenue * 100).toFixed(1) : 0}% Margin
          </p>
        </motion.div>

        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.2
      }} className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <TrendingDown className="w-5 h-5 text-orange-400" />
            </div>
          </div>
          <h3 className="text-slate-400 text-sm font-medium">Trosak djelova</h3>
          <p className="text-2xl font-bold text-white mt-1">{formatCurrency(analytics.totalPartsCost)}</p>
          <p className="text-xs text-orange-400 mt-1">Troskovi</p>
        </motion.div>

        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.3
      }} className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <h3 className="text-slate-400 text-sm font-medium">Zarada</h3>
          <p className="text-2xl font-bold text-white mt-1">{formatCurrency(analytics.netProfit)}</p>
          <p className="text-xs text-slate-500 mt-1"></p>
        </motion.div>
      </div>

      {/* Detailed Breakdown */}
      <motion.div initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} transition={{
      delay: 0.4
    }} className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            Monthly Financial Breakdown
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-900/50 text-xs uppercase text-slate-400 font-semibold">
              <tr>
                <th className="px-6 py-4">Month</th>
                <th className="px-6 py-4">Tickets</th>
                <th className="px-6 py-4 text-right text-blue-300">Est. Revenue</th>
                <th className="px-6 py-4 text-right text-green-300">Actual Revenue</th>
                <th className="px-6 py-4 text-right">Difference</th>
                <th className="px-6 py-4 text-right text-orange-300">Parts Cost</th>
                <th className="px-6 py-4 text-right text-purple-300">Net Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700 text-slate-300">
              {analytics.monthlyList.length > 0 ? analytics.monthlyList.map((month, index) => {
              const diff = month.revenue - month.estimated;
              return <tr key={index} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{month.month}</td>
                      <td className="px-6 py-4">{month.count}</td>
                      <td className="px-6 py-4 text-right font-mono text-slate-400">
                        {formatCurrency(month.estimated)}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-white">
                        {formatCurrency(month.revenue)}
                      </td>
                      <td className={`px-6 py-4 text-right font-mono font-bold ${diff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {diff > 0 ? '+' : ''}{formatCurrency(diff)}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-orange-200">
                        {formatCurrency(month.parts)}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-purple-200 font-bold">
                        {formatCurrency(month.revenue - month.parts)}
                      </td>
                    </tr>;
            }) : <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-500">
                    No financial data available yet. Complete some tickets to see analytics.
                  </td>
                </tr>}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>;
};
export default FinanceDashboard;