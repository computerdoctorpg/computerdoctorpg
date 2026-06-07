import React from 'react';
import { Plus, ChevronDown, Laptop, Shield, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const NewTicketMenu = ({
  onServisniPrijem,
  onGarantniRok,
  onVhs,
  className = '',
  size = 'default',
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button
        className={`bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl flex items-center justify-center gap-2 shrink-0 whitespace-nowrap ${className}`}
        size={size}
      >
        <Plus className="w-5 h-5 shrink-0" />
        Novi Nalog
        <ChevronDown className="w-4 h-4 shrink-0 opacity-80" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent
      align="end"
      className="w-56 bg-slate-800 border-slate-700 text-white"
    >
      <DropdownMenuLabel className="text-slate-400 text-xs uppercase tracking-wider">
        Tip prijema
      </DropdownMenuLabel>
      <DropdownMenuSeparator className="bg-slate-700" />
      <DropdownMenuItem
        onClick={onServisniPrijem}
        className="cursor-pointer focus:bg-blue-600/20 focus:text-white gap-3 py-2.5"
      >
        <Laptop className="w-4 h-4 text-blue-400 shrink-0" />
        <div>
          <p className="font-semibold">Servisni prijem</p>
          <p className="text-xs text-slate-400">Računar, laptop, uređaj</p>
        </div>
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={onGarantniRok}
        className="cursor-pointer focus:bg-emerald-600/20 focus:text-white gap-3 py-2.5"
      >
        <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
        <div>
          <p className="font-semibold">Garantni rok</p>
          <p className="text-xs text-slate-400">Uređaj u garanciji</p>
        </div>
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={onVhs}
        className="cursor-pointer focus:bg-amber-600/20 focus:text-white gap-3 py-2.5"
      >
        <Film className="w-4 h-4 text-amber-400 shrink-0" />
        <div>
          <p className="font-semibold">Snimci</p>
          <p className="text-xs text-slate-400">Digitalizacija · 30 €/kaseta</p>
        </div>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

export default NewTicketMenu;
