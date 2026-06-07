import React, { useState } from 'react';
import { Laptop } from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  DEVICE_BRANDS,
  OTHER_BRAND_LABEL,
  getBrandLogoUrl,
} from '@/lib/deviceBrands';

const BrandLogo = ({ brand, className = 'w-5 h-5' }) => {
  const [failed, setFailed] = useState(false);
  const logoUrl = getBrandLogoUrl(brand);

  if (!logoUrl || failed) {
    return <Laptop className={`${className} text-cyan-400`} />;
  }

  return (
    <img
      src={logoUrl}
      alt=""
      className={`${className} object-contain`}
      onError={() => setFailed(true)}
    />
  );
};

const DeviceBrandFields = ({
  brand,
  model,
  customBrand = '',
  onBrandChange,
  onModelChange,
  onCustomBrandChange,
  brandError,
  modelError,
  inputClass,
}) => {
  const isOther = brand === OTHER_BRAND_LABEL || (brand && !DEVICE_BRANDS.some((b) => b.label === brand));
  const selectedBrand = isOther ? customBrand : brand;

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-slate-300 text-xs">Brend *</Label>

        {/* Desktop: kompaktan select + mali logo */}
        <div className="hidden md:flex items-center gap-3 mt-1">
          {selectedBrand && (
            <div className="w-8 h-8 rounded-md bg-slate-950 border border-slate-600 flex items-center justify-center shrink-0 p-1">
              <BrandLogo brand={selectedBrand} className="w-5 h-5" />
            </div>
          )}
          <select
            value={brand || ''}
            onChange={(e) => onBrandChange(e.target.value)}
            className={`${inputClass} mt-0 flex-1`}
          >
            <option value="">Izaberite brend...</option>
            {DEVICE_BRANDS.map((item) => (
              <option key={item.id} value={item.label}>{item.label}</option>
            ))}
            <option value={OTHER_BRAND_LABEL}>{OTHER_BRAND_LABEL}</option>
          </select>
        </div>

        {/* Mobil: horizontalni scroll — male ikonice */}
        <div className="flex md:hidden gap-1.5 overflow-x-auto pb-1 mt-2">
          {DEVICE_BRANDS.map((item) => {
            const selected = brand === item.label;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onBrandChange(item.label)}
                className={`shrink-0 flex flex-col items-center gap-0.5 p-1.5 rounded-md border transition-colors min-w-[3.25rem] ${
                  selected
                    ? 'border-blue-500 bg-blue-500/20'
                    : 'border-slate-600 bg-slate-900/40'
                }`}
                title={item.label}
              >
                <BrandLogo brand={item.label} className="w-5 h-5" />
                <span className="text-[9px] text-slate-400 truncate w-full text-center">{item.label}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => onBrandChange(OTHER_BRAND_LABEL)}
            className={`shrink-0 flex flex-col items-center gap-0.5 p-1.5 rounded-md border min-w-[3.25rem] ${
              isOther ? 'border-blue-500 bg-blue-500/20' : 'border-slate-600 bg-slate-900/40'
            }`}
          >
            <span className="w-5 h-5 flex items-center justify-center text-[10px] text-slate-400">…</span>
            <span className="text-[9px] text-slate-400">{OTHER_BRAND_LABEL}</span>
          </button>
        </div>

        {brandError && <p className="text-red-400 text-xs mt-1">{brandError}</p>}
      </div>

      {isOther && (
        <div>
          <Label className="text-slate-300 text-xs">Naziv brenda *</Label>
          <input
            type="text"
            value={customBrand}
            onChange={(e) => onCustomBrandChange(e.target.value)}
            placeholder="npr. Compaq, Packard Bell..."
            className={inputClass}
          />
        </div>
      )}

      <div>
        <Label className="text-slate-300 text-xs">Model laptopa *</Label>
        <input
          type="text"
          value={model}
          onChange={(e) => onModelChange(e.target.value)}
          placeholder="npr. G771J, XPS 15, ProBook 450 G8..."
          className={`${inputClass} ${modelError ? 'border-red-500' : ''}`}
        />
        {modelError && <p className="text-red-400 text-xs mt-1">{modelError}</p>}
      </div>
    </div>
  );
};

export { BrandLogo, DeviceBrandFields };
