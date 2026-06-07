import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { fetchAllParts, fetchAllPartCategories, createPart, updatePart, deletePart, createPartCategory, updatePartCategory, deletePartCategory } from '@/lib/db';
import { Edit, Trash2, Plus, Loader2, Package, Tags } from 'lucide-react';
import PartsSearch from './PartsSearch';
import PartsSalesDialog from './PartsSalesDialog';

const PartsManagement = () => {
  const [parts, setParts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredParts, setFilteredParts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { toast } = useToast();

  const [partModalOpen, setPartModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null); // { type: 'part'|'category', id: uuid }
  const [selectedPartForSale, setSelectedPartForSale] = useState(null); // Sale dialog state

  const [partForm, setPartForm] = useState({ id: null, name: '', manufacturer: '', part_number: '', description: '', price: '', category_id: '' });
  const [categoryForm, setCategoryForm] = useState({ id: null, name: '', description: '' });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const p = await fetchAllParts();
      const c = await fetchAllPartCategories();
      setParts(p);
      setCategories(c);
      applyFilters(p, searchQuery, selectedCategory);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Greška', description: 'Neuspešno učitavanje podataka.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

  const openPartModal = (part = null) => {
    if (part) {
      setPartForm({ ...part });
    } else {
      setPartForm({ id: null, name: '', manufacturer: '', part_number: '', description: '', price: '', category_id: '' });
    }
    setPartModalOpen(true);
  };

  const openCategoryModal = (cat = null) => {
    if (cat) {
      setCategoryForm({ ...cat });
    } else {
      setCategoryForm({ id: null, name: '', description: '' });
    }
    setCategoryModalOpen(true);
  };

  const confirmDelete = (type, id) => {
    setDeleteItem({ type, id });
    setDeleteAlertOpen(true);
  };

  const handleSavePart = async (e) => {
    e.preventDefault();
    if (!partForm.name || !partForm.part_number) {
      toast({ variant: 'destructive', title: 'Greška', description: 'Naziv i Part Number su obavezni.' });
      return;
    }
    try {
      if (partForm.id) {
        await updatePart(partForm.id, partForm.category_id, partForm.name, partForm.manufacturer, partForm.part_number, partForm.description, partForm.price);
        toast({ title: 'Uspešno', description: 'Deo uspešno ažuriran.' });
      } else {
        await createPart(partForm.category_id, partForm.name, partForm.manufacturer, partForm.part_number, partForm.description, partForm.price);
        toast({ title: 'Uspešno', description: 'Deo uspešno dodat.' });
      }
      setPartModalOpen(false);
      loadData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Greška', description: error.message });
    }
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name) {
      toast({ variant: 'destructive', title: 'Greška', description: 'Naziv je obavezan.' });
      return;
    }
    try {
      if (categoryForm.id) {
        await updatePartCategory(categoryForm.id, categoryForm.name, categoryForm.description);
        toast({ title: 'Uspešno', description: 'Kategorija uspešno ažurirana.' });
      } else {
        await createPartCategory(categoryForm.name, categoryForm.description);
        toast({ title: 'Uspešno', description: 'Kategorija uspešno dodata.' });
      }
      setCategoryModalOpen(false);
      loadData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Greška', description: error.message });
    }
  };

  const executeDelete = async () => {
    if (!deleteItem) return;
    try {
      if (deleteItem.type === 'part') {
        await deletePart(deleteItem.id);
        toast({ title: 'Obrisano', description: 'Deo je uspešno obrisan.' });
      } else {
        await deletePartCategory(deleteItem.id);
        toast({ title: 'Obrisano', description: 'Kategorija je uspešno obrisana.' });
      }
      loadData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Greška', description: 'Neuspešno brisanje.' });
    } finally {
      setDeleteAlertOpen(false);
      setDeleteItem(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Upravljanje Delovima</h2>
          <p className="text-slate-400">Dodavanje i izmena polovnih delova i kategorija. Kliknite na red za evidenciju prodaje.</p>
        </div>
      </div>

      <Tabs defaultValue="parts" className="w-full">
        <TabsList className="bg-slate-800/80 border border-slate-700 mb-6">
          <TabsTrigger value="parts" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Package className="w-4 h-4 mr-2" /> Delovi
          </TabsTrigger>
          <TabsTrigger value="categories" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <Tags className="w-4 h-4 mr-2" /> Kategorije
          </TabsTrigger>
        </TabsList>

        <TabsContent value="parts" className="space-y-4">
          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1 mr-4">
                <PartsSearch onSearch={handleSearch} onCategoryChange={handleCategoryFilter} categories={categories} />
              </div>
              <Button onClick={() => openPartModal()} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" /> Dodaj Dio
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-700">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-400 uppercase bg-slate-900">
                    <tr>
                      <th className="px-4 py-3">Naziv</th>
                      <th className="px-4 py-3">Brend</th>
                      <th className="px-4 py-3">Part Number</th>
                      <th className="px-4 py-3">Kategorija</th>
                      <th className="px-4 py-3">Cena</th>
                      <th className="px-4 py-3 text-right">Akcije</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredParts.length > 0 ? filteredParts.map((p) => (
                      <tr 
                        key={p.id} 
                        onClick={() => setSelectedPartForSale(p)}
                        className="border-b border-slate-700 hover:bg-slate-700/80 text-slate-300 cursor-pointer transition-colors"
                        title="Kliknite za evidenciju prodaje"
                      >
                        <td className="px-4 py-3 font-medium text-white">{p.name}</td>
                        <td className="px-4 py-3">{p.manufacturer || '-'}</td>
                        <td className="px-4 py-3 font-mono text-xs bg-slate-900 px-2 py-1 rounded inline-block mt-2">{p.part_number}</td>
                        <td className="px-4 py-3">{p.parts_categories?.name || '-'}</td>
                        <td className="px-4 py-3 font-semibold text-green-400">{p.price ? `€${p.price}` : '-'}</td>
                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" onClick={() => openPartModal(p)} className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/30">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => confirmDelete('part', p.id)} className="text-red-400 hover:text-red-300 hover:bg-red-900/30 ml-1">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan="6" className="text-center py-6 text-slate-500">Nema pronađenih delova.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
            <div className="flex justify-end mb-6">
              <Button onClick={() => openCategoryModal()} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" /> Dodaj Kategoriju
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-700">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-400 uppercase bg-slate-900">
                    <tr>
                      <th className="px-4 py-3">Naziv</th>
                      <th className="px-4 py-3">Opis</th>
                      <th className="px-4 py-3 text-right">Akcije</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.length > 0 ? categories.map((c) => (
                      <tr key={c.id} className="border-b border-slate-700 hover:bg-slate-800/50 text-slate-300">
                        <td className="px-4 py-3 font-medium text-white">{c.name}</td>
                        <td className="px-4 py-3">{c.description || '-'}</td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="icon" onClick={() => openCategoryModal(c)} className="text-purple-400 hover:text-purple-300 hover:bg-purple-900/30">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => confirmDelete('category', c.id)} className="text-red-400 hover:text-red-300 hover:bg-red-900/30 ml-1">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan="3" className="text-center py-6 text-slate-500">Nema kategorija.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Part Modal for Edit/Create */}
      <Dialog open={partModalOpen} onOpenChange={setPartModalOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{partForm.id ? 'Izmena dela' : 'Novi deo'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSavePart} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Naziv dela *</Label>
              <Input required value={partForm.name} onChange={e => setPartForm({...partForm, name: e.target.value})} className="bg-slate-900 border-slate-600" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Part Number *</Label>
                <Input required value={partForm.part_number} onChange={e => setPartForm({...partForm, part_number: e.target.value})} className="bg-slate-900 border-slate-600 font-mono" />
              </div>
              <div className="space-y-2">
                <Label>Brend / Proizvođač</Label>
                <Input value={partForm.manufacturer} onChange={e => setPartForm({...partForm, manufacturer: e.target.value})} className="bg-slate-900 border-slate-600" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kategorija</Label>
                <select value={partForm.category_id || ''} onChange={e => setPartForm({...partForm, category_id: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-md h-10 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                  <option value="">Bez Kategorije</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Cena (€)</Label>
                <Input type="number" step="0.01" value={partForm.price} onChange={e => setPartForm({...partForm, price: e.target.value})} className="bg-slate-900 border-slate-600" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Opis</Label>
              <textarea value={partForm.description} onChange={e => setPartForm({...partForm, description: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-sm min-h-[80px]" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPartModalOpen(false)} className="border-slate-600 text-slate-300">Otkaži</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Sačuvaj</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Category Modal */}
      <Dialog open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{categoryForm.id ? 'Izmjena Kategorije' : 'Nova Kategorija'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveCategory} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Naziv *</Label>
              <Input required value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} className="bg-slate-900 border-slate-600" />
            </div>
            <div className="space-y-2">
              <Label>Opis</Label>
              <textarea value={categoryForm.description} onChange={e => setCategoryForm({...categoryForm, description: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-sm min-h-[80px]" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCategoryModalOpen(false)} className="border-slate-600 text-slate-300">Otkaži</Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700">Sačuvaj</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Alert */}
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400">Potvrda Brisanja</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              Da li ste sigurni da želite da obrišete ovu stavku? Ova akcija je nepovratna.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 border-slate-600 hover:bg-slate-600 text-white">Otkaži</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-red-600 hover:bg-red-700 text-white">Obriši</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sales Dialog */}
      <PartsSalesDialog
        part={selectedPartForSale}
        isOpen={!!selectedPartForSale}
        onClose={() => setSelectedPartForSale(null)}
        onSuccess={() => {
          loadData();
        }}
      />
    </div>
  );
};

export default PartsManagement;