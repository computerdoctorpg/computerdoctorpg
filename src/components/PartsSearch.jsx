import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

const PartsSearch = ({ onSearch, onCategoryChange, categories }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryId, setCategoryId] = useState('all');

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      onSearch(searchTerm);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, onSearch]);

  const handleCategoryChange = (e) => {
    const val = e.target.value;
    setCategoryId(val);
    onCategoryChange(val);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
        <Input
          type="text"
          placeholder="Pretraži po Part Number, Naziv ili Brend..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-slate-900 border-slate-700 text-white"
        />
      </div>
      <div className="w-full md:w-64">
        <select
          value={categoryId}
          onChange={handleCategoryChange}
          className="w-full bg-slate-900 border border-slate-700 rounded-md h-10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Sve Kategorije</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default PartsSearch;