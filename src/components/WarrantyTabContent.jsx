import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, CalendarDays, Laptop, Cpu, Shield } from 'lucide-react';
import TicketList from '@/components/TicketList';
import { Button } from '@/components/ui/button';
import {
  ticketMatchesSearch,
  ticketMatchesBrandModel,
  getClientTicketCounts,
  getDayKey,
  formatDayKeyDisplay,
  getUniqueBrands,
} from '@/lib/ticketUtils';

const formatMonthDisplay = (monthKey) => {
  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1);
  return date.toLocaleDateString('sr-RS', { month: 'long', year: 'numeric' });
};

const WarrantyTabContent = ({
  tickets,
  onNewWarranty,
  onTicketClick,
  onUpdateStatus,
  onAddNotes,
  onGenerateInvoice,
  onPrintTicket,
  onEditTicket,
  onPrintDeliveryNote,
  onDeleteClick,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterDay, setFilterDay] = useState('all');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterModel, setFilterModel] = useState('');

  const availableMonths = useMemo(() => {
    const months = new Set();
    tickets.forEach((t) => {
      if (!t.createdAt) return;
      const date = new Date(t.createdAt);
      months.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    });
    return Array.from(months).sort().reverse();
  }, [tickets]);

  const availableDays = useMemo(() => {
    if (filterMonth === 'all') return [];
    const days = new Set();
    tickets.forEach((t) => {
      if (!t.createdAt) return;
      const date = new Date(t.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (key === filterMonth) days.add(getDayKey(t.createdAt));
    });
    return Array.from(days).sort().reverse();
  }, [tickets, filterMonth]);

  const handleMonthChange = (value) => {
    setFilterMonth(value);
    setFilterDay('all');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterMonth('all');
    setFilterDay('all');
    setFilterBrand('');
    setFilterModel('');
  };

  const availableBrands = useMemo(() => getUniqueBrands(tickets), [tickets]);

  const filteredTickets = useMemo(() => tickets.filter((ticket) => {
    if (!ticket) return false;

    const matchesSearch = ticketMatchesSearch(ticket, searchTerm);
    const matchesBrandModel = ticketMatchesBrandModel(ticket, filterBrand, filterModel);

    const filterToCheck = filterStatus === 'pending' ? ['pending', 'open'] : [filterStatus];
    const matchesFilter = filterStatus === 'all' || filterToCheck.includes(ticket.status);

    let matchesMonth = true;
    if (filterMonth !== 'all' && ticket.createdAt) {
      const date = new Date(ticket.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      matchesMonth = key === filterMonth;
    } else if (filterMonth !== 'all') {
      matchesMonth = false;
    }

    let matchesDay = true;
    if (filterDay !== 'all' && ticket.createdAt) {
      matchesDay = getDayKey(ticket.createdAt) === filterDay;
    } else if (filterDay !== 'all') {
      matchesDay = false;
    }

    return matchesSearch && matchesBrandModel && matchesFilter && matchesMonth && matchesDay;
  }), [tickets, searchTerm, filterBrand, filterModel, filterStatus, filterMonth, filterDay]);

  const clientTicketCounts = useMemo(() => getClientTicketCounts(tickets), [tickets]);

  const stats = {
    total: tickets.length,
    pending: tickets.filter((t) => t?.status === 'pending' || t?.status === 'open').length,
    inProgress: tickets.filter((t) => t?.status === 'in-progress').length,
    completed: tickets.filter((t) => t?.status === 'completed').length,
  };

  return (
    <div className="space-y-8 mt-0">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: 'Garantni Nalozi', value: stats.total, color: 'from-emerald-500 to-emerald-600' },
          { label: 'Na Čekanju', value: stats.pending, color: 'from-yellow-500 to-yellow-600' },
          { label: 'U Radu', value: stats.inProgress, color: 'from-purple-500 to-purple-600' },
          { label: 'Završeno', value: stats.completed, color: 'from-green-500 to-green-600' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
            className={`bg-gradient-to-br ${stat.color} rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow`}
          >
            <p className="text-white/80 text-sm mb-1">{stat.label}</p>
            <p className="text-3xl font-bold text-white">{stat.value}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-emerald-700/40"
      >
        <div className="flex items-center gap-2 mb-4 text-emerald-300">
          <Shield className="w-5 h-5" />
          <p className="text-sm">
            Prijem uređaja u garantnom roku — isti prijemni list i otpremnica, klijenti se označavaju kao garantni.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex-1 relative min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Pretraga: ime, telefon, brend, model, serijski broj..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>
            <Button
              onClick={onNewWarranty}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-5 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 shrink-0 whitespace-nowrap w-full sm:w-auto"
            >
              <Plus className="w-5 h-5 shrink-0" />
              Novi Garantni Nalog
            </Button>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <Laptop className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
              <select
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value)}
                className="pl-10 pr-8 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all appearance-none cursor-pointer min-w-[150px] w-full lg:w-auto"
              >
                <option value="">Svi brendovi</option>
                {availableBrands.map((brand) => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>

            <div className="relative min-w-[160px]">
              <Cpu className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
              <input
                type="text"
                placeholder="Model (npr. XPS 15)"
                value={filterModel}
                onChange={(e) => setFilterModel(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
              <select
                value={filterMonth}
                onChange={(e) => handleMonthChange(e.target.value)}
                className="pl-10 pr-8 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all appearance-none cursor-pointer min-w-[180px] w-full lg:w-auto"
              >
                <option value="all">Svi Meseci</option>
                {availableMonths.map((month) => (
                  <option key={month} value={month}>
                    {formatMonthDisplay(month)}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
              <select
                value={filterDay}
                onChange={(e) => setFilterDay(e.target.value)}
                disabled={availableDays.length === 0}
                className="pl-10 pr-8 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all appearance-none cursor-pointer min-w-[200px] w-full lg:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="all">Svi Dani</option>
                {availableDays.map((day) => (
                  <option key={day} value={day}>
                    {formatDayKeyDisplay(day)}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-10 pr-8 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all appearance-none cursor-pointer min-w-[160px] w-full lg:w-auto"
              >
                <option value="all">Svi Statusi</option>
                <option value="pending">Na Čekanju / Otvoreno</option>
                <option value="in-progress">U Radu</option>
                <option value="completed">Završeno</option>
              </select>
            </div>
          </div>

          <p className="text-sm text-slate-400">
            Prikazano <span className="text-white font-semibold">{filteredTickets.length}</span> od {tickets.length} garantnih naloga
          </p>

          {(searchTerm || filterBrand || filterModel || filterStatus !== 'all' || filterMonth !== 'all' || filterDay !== 'all') && (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-400 hover:text-white h-8">
                Obriši filtere
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      <TicketList
        tickets={filteredTickets}
        onTicketClick={onTicketClick}
        onUpdateStatus={onUpdateStatus}
        onAddNotes={onAddNotes}
        onGenerateInvoice={onGenerateInvoice}
        onPrintTicket={onPrintTicket}
        onEditTicket={onEditTicket}
        onPrintDeliveryNote={onPrintDeliveryNote}
        onDeleteClick={onDeleteClick}
        clientTicketCounts={clientTicketCounts}
      />
    </div>
  );
};

export default WarrantyTabContent;
