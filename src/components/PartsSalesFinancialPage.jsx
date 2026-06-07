import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PartsSalesStatistics from './PartsSalesStatistics';

const PartsSalesFinancialPage = () => {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchSales();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [sales, searchQuery, selectedMonth]);

  const fetchSales = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('parts_sales_new')
        .select(`
          *,
          parts (
            name,
            manufacturer,
            category_id
          )
        `)
        .order('sale_date', { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (error) {
      console.error('Error fetching parts sales:', error);
      toast({
        variant: 'destructive',
        title: 'Greška',
        description: 'Nije moguće učitati podatke o prodaji.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...sales];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((sale) =>
        (sale.customer_name && sale.customer_name.toLowerCase().includes(q)) ||
        (sale.customer_surname && sale.customer_surname.toLowerCase().includes(q)) ||
        (sale.phone_number && sale.phone_number.includes(q)) ||
        (sale.parts?.name && sale.parts.name.toLowerCase().includes(q))
      );
    }

    if (selectedMonth) {
      result = result.filter((sale) => {
        if (!sale.sale_date) return false;
        const date = new Date(sale.sale_date);
        const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        return monthStr === selectedMonth;
      });
    }

    setFilteredSales(result);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PartsSalesStatistics sales={filteredSales} />

      <div className="rounded-lg border border-slate-700 bg-slate-800 text-white shadow-sm">
        <div className="p-6 pb-0">
          <h2 className="text-2xl font-semibold text-white">Evidencija Prodaje</h2>
        </div>
        <div className="p-6 pt-4">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Pretraga po kupcu, telefonu ili delu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-950 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="w-full md:w-64 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-950 border-slate-600 text-white flex-1"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-700">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-slate-900 text-slate-300">
                <tr>
                  <th className="px-4 py-3 font-semibold">Datum Prodaje</th>
                  <th className="px-4 py-3 font-semibold">Dio (Brend)</th>
                  <th className="px-4 py-3 font-semibold">Kupac</th>
                  <th className="px-4 py-3 font-semibold">Telefon</th>
                  <th className="px-4 py-3 text-right font-semibold">Cena</th>
                </tr>
              </thead>
              <tbody className="bg-slate-900/40">
                {filteredSales.length > 0 ? filteredSales.map((sale) => (
                  <tr key={sale.id} className="border-b border-slate-700 last:border-0 hover:bg-slate-800/80">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-200">
                      {sale.sale_date
                        ? new Date(sale.sale_date).toLocaleDateString('sr-RS')
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{sale.parts?.name || 'Nepoznat dio'}</div>
                      <div className="text-xs text-slate-400">{sale.parts?.manufacturer || '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-200">
                      {[sale.customer_name, sale.customer_surname].filter(Boolean).join(' ') || '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300">
                      {sale.phone_number || '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-green-400">
                      €{Number(sale.sale_price || 0).toFixed(2)}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-slate-400">
                      Nema pronađenih evidencija o prodaji za izabrani period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartsSalesFinancialPage;
