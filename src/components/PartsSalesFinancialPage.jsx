import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
        variant: "destructive",
        title: "Greška",
        description: "Nije moguće učitati podatke o prodaji.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...sales];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(sale => 
        (sale.customer_name && sale.customer_name.toLowerCase().includes(q)) ||
        (sale.customer_surname && sale.customer_surname.toLowerCase().includes(q)) ||
        (sale.phone_number && sale.phone_number.includes(q)) ||
        (sale.parts?.name && sale.parts.name.toLowerCase().includes(q))
      );
    }

    if (selectedMonth) {
      result = result.filter(sale => {
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

      <Card className="bg-slate-800 border-slate-700 text-white">
        <CardHeader>
          <CardTitle>Evidencija Prodaje</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Pretraga po kupcu, telefonu ili dijelu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-900 border-slate-700 text-white"
              />
            </div>
            <div className="w-full md:w-64 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white flex-1"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-700">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 uppercase bg-slate-900">
                <tr>
                  <th className="px-4 py-3">Datum Prodaje</th>
                  <th className="px-4 py-3">Dio (Brend)</th>
                  <th className="px-4 py-3">Kupac</th>
                  <th className="px-4 py-3">Telefon</th>
                  <th className="px-4 py-3 text-right">Cijena</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.length > 0 ? filteredSales.map((sale) => (
                  <tr key={sale.id} className="border-b border-slate-700 hover:bg-slate-800/50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {new Date(sale.sale_date).toLocaleDateString('sr-RS')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{sale.parts?.name || 'Nepoznat dio'}</div>
                      <div className="text-xs text-slate-400">{sale.parts?.manufacturer}</div>
                    </td>
                    <td className="px-4 py-3">
                      {sale.customer_name} {sale.customer_surname}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300">
                      {sale.phone_number}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-green-400">
                      €{Number(sale.sale_price).toFixed(2)}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-slate-500">
                      Nema pronađenih evidencija o prodaji za izabrani period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PartsSalesFinancialPage;