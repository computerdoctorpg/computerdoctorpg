import React, { useState } from 'react';
import { Laptop } from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  DEVICE_BRANDS,
  OTHER_BRAND_LABEL,
  getBrandLogoUrl,
} from '@/lib/deviceBrands';

const BrandLogo = ({ brand, className = 'w-7 h-7' }) => {
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

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-slate-300 text-xs">Brend *</Label>
        <div className="flex gap-2 overflow-x-auto pb-1 mt-2 md:grid md:grid-cols-6 md:overflow-visible md:pb-0">
          {DEVICE_BRANDS.map((item) => {
            const selected = brand === item.label;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onBrandChange(item.label)}
                className={`shrink-0 flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors min-w-[4.5rem] md:min-w-0 ${
                  selected
                    ? 'border-blue-500 bg-blue-500/20 ring-1 ring-blue-500/50'
                    : 'border-slate-600 bg-slate-900/40 hover:border-slate-500'
                }`}
                title={item.label}
              >
                <BrandLogo brand={item.label} className="w-7 h-7" />
                <span className="text-[10px] text-slate-300 font-medium truncate w-full text-center">
                  {item.label}
                </span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => onBrandChange(OTHER_BRAND_LABEL)}
            className={`shrink-0 flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors min-w-[4.5rem] md:min-w-0 ${
              isOther
                ? 'border-blue-500 bg-blue-500/20 ring-1 ring-blue-500/50'
                : 'border-slate-600 bg-slate-900/40 hover:border-slate-500'
            }`}
          >
            <span className="w-7 h-7 flex items-center justify-center text-xs font-bold text-slate-400">…</span>
            <span className="text-[10px] text-slate-300 font-medium">{OTHER_BRAND_LABEL}</span>
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
