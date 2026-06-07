import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import PartsManagement from './PartsManagement';
import PartsSearch from './PartsSearch';
import PartsSalesDialog from './PartsSalesDialog';
import { fetchAllParts, fetchAllPartCategories } from '@/lib/db';
import { Loader2, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PartsPage = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [parts, setParts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredParts, setFilteredParts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Sale dialog state
  const [selectedPartForSale, setSelectedPartForSale] = useState(null);

  useEffect(() => {
    // Admin component loads its own data
    if (!isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const p = await fetchAllParts();
      const c = await fetchAllPartCategories();
      setParts(p);
      setCategories(c);
      applyFilters(p, searchQuery, selectedCategory);
    } catch (error) {
      console.error("Error loading parts:", error);
      toast({ 
        variant: 'destructive', 
        title: 'Greška', 
        description: 'Neuspešno učitavanje podataka o dijelovima.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = (partsList, query, catId) => {
    let result = partsList;
    if (catId && catId !== 'all') {
      result = result.filter(p => p.category_id === catId);
    }
    if (query) {
      const lowerQ = query.toLowerCase();
      result = result.filter(p =>
        (p.name && p.name.toLowerCase().includes(lowerQ)) ||
        (p.part_number && p.part_number.toLowerCase().includes(lowerQ)) ||
        (p.manufacturer && p.manufacturer.toLowerCase().includes(lowerQ))
      );
    }
    setFilteredParts(result);
  };

  const handleSearch = (q) => {
    setSearchQuery(q);
    applyFilters(parts, q, selectedCategory);
  };

  const handleCategoryFilter = (cId) => {
    setSelectedCategory(cId);
    applyFilters(parts, searchQuery, cId);
  };

  const handlePartClick = (part) => {
    setSelectedPartForSale(part);
  };

  if (isAdmin) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <PartsManagement />
        </div>
      </div>
    );
  }

  // Read-only Operater View
  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-500" />
              Polovni Dijelovi
            </h2>
            <p className="text-slate-400">Pregled dostupnih polovnih dijelova i komponenti. Kliknite na red za prodaju.</p>
          </div>
        </div>

        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
          <div className="mb-6">
            <PartsSearch 
              onSearch={handleSearch} 
              onCategoryChange={handleCategoryFilter} 
              categories={categories} 
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-700">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-400 uppercase bg-slate-900">
                  <tr>
                    <th className="px-4 py-3">Naziv</th>
                    <th className="px-4 py-3">Brend</th>
                    <th className="px-4 py-3">Part Number</th>
                    <th className="px-4 py-3">Kategorija</th>
                    <th className="px-4 py-3">Opis</th>
                    <th className="px-4 py-3">Cijena</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParts.length > 0 ? filteredParts.map((p) => (
                    <tr 
                      key={p.id} 
                      onClick={() => handlePartClick(p)}
                      className="border-b border-slate-700 hover:bg-slate-700/80 cursor-pointer text-slate-300 transition-colors"
                      title="Kliknite za evidenciju prodaje"
                    >
                      <td className="px-4 py-3 font-medium text-white">{p.name}</td>
                      <td className="px-4 py-3">{p.manufacturer || '-'}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs bg-slate-900 px-2 py-1 rounded inline-block">
                          {p.part_number}
                        </span>
                      </td>
                      <td className="px-4 py-3">{p.parts_categories?.name || '-'}</td>
                      <td className="px-4 py-3 max-w-[200px] truncate" title={p.description}>
                        {p.description || '-'}
                      </td>
                      <td className="px-4 py-3 font-semibold text-green-400">
                        {p.price ? `€${p.price}` : '-'}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="6" className="text-center py-6 text-slate-500">
                        Nema pronađenih dijelova za zadati kriterijum.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <PartsSalesDialog
        part={selectedPartForSale}
        isOpen={!!selectedPartForSale}
        onClose={() => setSelectedPartForSale(null)}
        onSuccess={() => {
          loadData(); // Refresh the list if needed, or update stats
        }}
      />
    </div>
  );
};

export default PartsPage;