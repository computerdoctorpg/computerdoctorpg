import { supabase } from '@/lib/customSupabaseClient';
import {
  clearLocalRecycleBin,
  filterOutLocallyDeleted,
  getLocalRecycleBinTickets,
  getLocallyDeletedIds,
  markTicketDeletedLocally,
  mergeRecycleBinTickets,
  removeFromLocalRecycleBin,
  restoreTicketLocally,
} from '@/lib/recycleBinLocal';
import {
  cloudMarkDeleted,
  cloudRemoveDeleted,
  cloudRestoreDeleted,
  fetchCloudDeletedIds,
  fetchCloudRecycleBinTickets,
  getRecycleBinMode,
  probeCloudRecycleBin,
  syncTicketsToCloudRecycleBin,
} from '@/lib/recycleBinCloud';

export { getRecycleBinMode };

let softDeleteDbSupported = null;

export const probeSoftDeleteSupport = async () => {
  if (softDeleteDbSupported !== null) return softDeleteDbSupported;

  try {
    const { error } = await supabase.from('tickets').select('deleted_at').limit(1);
    softDeleteDbSupported = !(error && isMissingColumnError(error));
  } catch {
    softDeleteDbSupported = false;
  }

  return softDeleteDbSupported;
};

export const isSoftDeleteDbSupported = () => softDeleteDbSupported;

const filterOutDeletedTickets = async (tickets) => {
  const dbSupported = await probeSoftDeleteSupport();

  if (dbSupported) {
    return filterOutLocallyDeleted(tickets);
  }

  const hiddenIds = new Set(getLocallyDeletedIds());
  try {
    const cloudIds = await fetchCloudDeletedIds();
    cloudIds.forEach((id) => hiddenIds.add(id));
  } catch {
    // Cloud korpa nije dostupna — koristi lokalne ID-eve
  }

  if (hiddenIds.size === 0) return tickets;
  return tickets.filter((ticket) => !hiddenIds.has(ticket.id));
};

export const syncLocalRecycleBinToCloud = async () => {
  const localTickets = getLocalRecycleBinTickets();
  if (!localTickets.length) return 0;

  const cloudOk = await probeCloudRecycleBin();
  if (!cloudOk) return 0;

  await syncTicketsToCloudRecycleBin(localTickets);
  clearLocalRecycleBin();
  return localTickets.length;
};

// Helper to generate ticket number: 100/3, 101/3 etc. (sequence/month)
const generateTicketNumber = async () => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const suffix = `/${currentMonth}`;
  
  const { data: tickets, error } = await supabase
    .from('tickets')
    .select('ticket_number')
    .like('ticket_number', `%${suffix}`);
  
  if (error) {
    console.error('Error fetching tickets for numbering:', error);
    return `1${suffix}`;
  }
  
  let maxSeq = 0;
  tickets.forEach(t => {
    if (t.ticket_number && t.ticket_number.endsWith(suffix)) {
      const parts = t.ticket_number.split('/');
      if (parts.length === 2) {
        const seq = parseInt(parts[0], 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    }
  });

  return `${maxSeq + 1}${suffix}`;
};

// Helper to generate dispatch note number
const generateDispatchNumber = async () => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const suffix = `/${currentMonth}`;
  
  const { data: tickets, error } = await supabase
    .from('tickets')
    .select('dispatch_note_number')
    .not('dispatch_note_number', 'is', null)
    .like('dispatch_note_number', `%${suffix}`);
  
  if (error) {
    console.error('Error fetching dispatch numbers:', error);
    return `1${suffix}`;
  }
  
  let maxSeq = 0;
  tickets.forEach(t => {
    if (t.dispatch_note_number && t.dispatch_note_number.endsWith(suffix)) {
      const parts = t.dispatch_note_number.split('/');
      if (parts.length === 2) {
        const seq = parseInt(parts[0], 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    }
  });

  return `${maxSeq + 1}${suffix}`;
};

const isMissingColumnError = (error) => {
  const msg = String(error?.message || error?.details || error?.hint || '').toLowerCase();
  return msg.includes('column') || msg.includes('does not exist') || error?.code === '42703';
};

const TICKETS_WITH_CLIENTS_SELECT = `
  *,
  clients (
    id,
    first_name,
    last_name,
    email,
    phone
  )
`;

export const upsertClient = async (clientData) => {
  try {
    const payload = {
      first_name: clientData.first_name,
      last_name: clientData.last_name,
      email: clientData.email,
      phone: clientData.phone,
    };

    if (clientData.is_warranty_client === true) {
      payload.is_warranty_client = true;
    }

    let { data, error } = await supabase
      .from('clients')
      .upsert(payload, {
        onConflict: 'phone',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error && payload.is_warranty_client && isMissingColumnError(error)) {
      delete payload.is_warranty_client;
      ({ data, error } = await supabase
        .from('clients')
        .upsert(payload, {
          onConflict: 'phone',
          ignoreDuplicates: false
        })
        .select()
        .single());
    }

    if (error) throw new Error(error.message || 'Greška pri kreiranju klijenta');
    return data;
  } catch (error) {
    console.error('Error upserting client:', error);
    throw error;
  }
};

export const updateClient = async (clientId, clientData) => {
  if (!clientId) return null;

  try {
    const { data, error } = await supabase
      .from('clients')
      .update({
        first_name: clientData.first_name,
        last_name: clientData.last_name,
        email: clientData.email ?? null,
        phone: clientData.phone,
      })
      .eq('id', clientId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating client:', error);
    throw error;
  }
};

export const createTicket = async (ticketData, clientId) => {
  try {
    const ticketNumber = await generateTicketNumber();
    
    const warrantyFields = {
      is_warranty: ticketData.isWarranty || false,
      warranty_until: ticketData.warrantyUntil || null,
      warranty_invoice: ticketData.warrantyInvoice || null,
    };

    const vhsFields = {
      is_vhs: ticketData.isVhs || false,
      vhs_cassette_count: ticketData.vhsCassetteCount || null,
      vhs_cassette_condition: ticketData.vhsCassetteCondition || null,
      vhs_price_per_cassette: ticketData.vhsPricePerCassette || null,
    };

    const insertPayload = {
      ticket_number: ticketNumber,
      client_id: clientId,
      device_name: ticketData.deviceName,
      device_serial: ticketData.deviceSerial,
      charger_serial: ticketData.chargerSerial || null,
      battery_serial: ticketData.batterySerial || null,
      issue_description: ticketData.issueDescription || '',
      notes: ticketData.notes || '',
      status: 'pending',
      os_password: ticketData.osPassword || null,
      keep_data: ticketData.keepData || false,
      has_bag: ticketData.hasBag || false,
      bag_description: ticketData.bagDescription || null,
      history: ticketData.history || [],
      repair_details: ticketData.additionalDescription || '',
      parts_used: '',
      parts_cost: 0,
      service_cost: parseFloat(ticketData.serviceCost) || 0,
      estimated_cost: parseFloat(ticketData.estimatedCost) || 0,
      ...warrantyFields,
      ...vhsFields,
    };

    let { data, error } = await supabase
      .from('tickets')
      .insert(insertPayload)
      .select()
      .single();

    if (error && isMissingColumnError(error)) {
      const fallbackPayload = { ...insertPayload };
      delete fallbackPayload.is_warranty;
      delete fallbackPayload.warranty_until;
      delete fallbackPayload.warranty_invoice;
      delete fallbackPayload.is_vhs;
      delete fallbackPayload.vhs_cassette_count;
      delete fallbackPayload.vhs_cassette_condition;
      delete fallbackPayload.vhs_price_per_cassette;
      ({ data, error } = await supabase
        .from('tickets')
        .insert(fallbackPayload)
        .select()
        .single());
    }

    if (error) throw new Error(error.message || 'Greška pri kreiranju servisnog naloga u bazi');
    return data;
  } catch (error) {
    console.error('Error creating ticket in db.js:', error);
    throw error;
  }
};

export const updateTicket = async (ticketNumber, updates) => {
  try {
    const updateData = {};
    
    if (updates.status) {
      updateData.status = updates.status;
      if (updates.status === 'open' || updates.status === 'pending') {
        updateData.completed_at = null;
      }
    }
    
    if (updates.repairDetails !== undefined) updateData.repair_details = updates.repairDetails;
    if (updates.partsUsed !== undefined) updateData.parts_used = updates.partsUsed;
    if (updates.partsCost !== undefined) updateData.parts_cost = parseFloat(updates.partsCost) || 0;
    if (updates.serviceCost !== undefined) updateData.service_cost = parseFloat(updates.serviceCost) || 0;
    if (updates.estimatedCost !== undefined) updateData.estimated_cost = parseFloat(updates.estimatedCost) || 0;
    if (updates.completedAt) updateData.completed_at = updates.completedAt;
    if (updates.history) updateData.history = updates.history;
    if (updates.batterySerial !== undefined) updateData.battery_serial = updates.batterySerial;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.deviceName !== undefined) updateData.device_name = updates.deviceName;
    if (updates.deviceSerial !== undefined) updateData.device_serial = updates.deviceSerial;
    if (updates.chargerSerial !== undefined) updateData.charger_serial = updates.chargerSerial || null;
    if (updates.issueDescription !== undefined) updateData.issue_description = updates.issueDescription;
    if (updates.osPassword !== undefined) updateData.os_password = updates.osPassword || null;
    if (updates.keepData !== undefined) updateData.keep_data = updates.keepData;
    if (updates.hasBag !== undefined) updateData.has_bag = updates.hasBag;
    if (updates.bagDescription !== undefined) updateData.bag_description = updates.bagDescription || null;
    if (updates.clientId !== undefined) updateData.client_id = updates.clientId;
    if (updates.isWarranty !== undefined) updateData.is_warranty = updates.isWarranty;
    if (updates.warrantyUntil !== undefined) updateData.warranty_until = updates.warrantyUntil || null;
    if (updates.warrantyInvoice !== undefined) updateData.warranty_invoice = updates.warrantyInvoice || null;
    if (updates.isVhs !== undefined) updateData.is_vhs = updates.isVhs;
    if (updates.vhsCassetteCount !== undefined) updateData.vhs_cassette_count = updates.vhsCassetteCount;
    if (updates.vhsCassetteCondition !== undefined) updateData.vhs_cassette_condition = updates.vhsCassetteCondition || null;
    if (updates.vhsPricePerCassette !== undefined) updateData.vhs_price_per_cassette = parseFloat(updates.vhsPricePerCassette) || null;

    if (updates.status === 'completed') {
      const { data: currentTicket } = await supabase
        .from('tickets')
        .select('dispatch_note_number, history')
        .eq('ticket_number', ticketNumber)
        .single();

      if (currentTicket && !currentTicket.dispatch_note_number) {
        const dispatchNumber = await generateDispatchNumber();
        updateData.dispatch_note_number = dispatchNumber;
        
        const historyEntry = {
          date: new Date().toISOString(),
          action: 'Otpremnica Generisana',
          description: `Broj otpremnice: ${dispatchNumber}`
        };
        
        updateData.history = [...(updateData.history || currentTicket.history || []), historyEntry];
      }
    }

    let { data, error } = await supabase
      .from('tickets')
      .update(updateData)
      .eq('ticket_number', ticketNumber)
      .select()
      .maybeSingle();

    if (error && isMissingColumnError(error)) {
      const fallbackData = { ...updateData };
      delete fallbackData.is_warranty;
      delete fallbackData.warranty_until;
      delete fallbackData.warranty_invoice;
      delete fallbackData.is_vhs;
      delete fallbackData.vhs_cassette_count;
      delete fallbackData.vhs_cassette_condition;
      delete fallbackData.vhs_price_per_cassette;
      ({ data, error } = await supabase
        .from('tickets')
        .update(fallbackData)
        .eq('ticket_number', ticketNumber)
        .select()
        .maybeSingle());
    }

    if (error) throw error;
    if (!data) throw new Error('Nalog nije pronađen ili nema dozvolu za izmenu.');
    return data;
  } catch (error) {
    console.error('Error updating ticket:', error);
    throw error;
  }
};

export const deleteTicket = async (ticketNumber, isAdmin = false, ticketSnapshot = null) => {
  if (!isAdmin) {
    throw new Error('Pristup odbijen. Samo administratori mogu brisati naloge.');
  }

  try {
    const dbSupported = await probeSoftDeleteSupport();

    if (dbSupported) {
      const { data, error } = await supabase
        .from('tickets')
        .update({ deleted_at: new Date().toISOString() })
        .eq('ticket_number', ticketNumber)
        .is('deleted_at', null)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Nalog nije pronađen ili je već u korpi.');
      removeFromLocalRecycleBin(ticketNumber);
      return { mode: 'db' };
    }

    if (!ticketSnapshot) {
      throw new Error('Nalog nije moguće premjestiti u korpu bez podataka o nalogu.');
    }

    const cloudOk = await probeCloudRecycleBin();
    if (cloudOk) {
      await cloudMarkDeleted(ticketSnapshot);
      removeFromLocalRecycleBin(ticketNumber);
      return { mode: 'cloud' };
    }

    markTicketDeletedLocally(ticketSnapshot);
    return { mode: 'local' };
  } catch (error) {
    console.error('Error deleting ticket:', error);
    throw error;
  }
};

export const restoreTicket = async (ticketNumber, isAdmin = false, ticket = null) => {
  if (!isAdmin) {
    throw new Error('Pristup odbijen. Samo administratori mogu vraćati naloge.');
  }

  try {
    if (ticket?.recycleSource === 'local' || ticket?.recycleSource === 'cloud') {
      if (ticket.recycleSource === 'cloud') {
        await cloudRestoreDeleted(ticketNumber);
      }
      restoreTicketLocally(ticketNumber);
      return { mode: ticket.recycleSource };
    }

    const dbSupported = await probeSoftDeleteSupport();

    if (dbSupported) {
      const { data, error } = await supabase
        .from('tickets')
        .update({ deleted_at: null })
        .eq('ticket_number', ticketNumber)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        try {
          await cloudRestoreDeleted(ticketNumber);
        } catch {
          // ignore
        }
        restoreTicketLocally(ticketNumber);
        return { mode: 'local' };
      }

      try {
        await cloudRestoreDeleted(ticketNumber);
      } catch {
        // ignore
      }
      restoreTicketLocally(ticketNumber);
      return { mode: 'db' };
    }

    try {
      await cloudRestoreDeleted(ticketNumber);
    } catch {
      // ignore
    }
    restoreTicketLocally(ticketNumber);
    return { mode: 'local' };
  } catch (error) {
    console.error('Error restoring ticket:', error);
    throw error;
  }
};

export const permanentlyDeleteTicket = async (ticketNumber, isAdmin = false, ticket = null) => {
  if (!isAdmin) {
    throw new Error('Pristup odbijen. Samo administratori mogu trajno brisati naloge.');
  }

  try {
    removeFromLocalRecycleBin(ticketNumber);

    try {
      await cloudRemoveDeleted(ticketNumber);
    } catch {
      // Cloud korpa možda nije dostupna
    }

    if (ticket?.recycleSource === 'local' || ticket?.recycleSource === 'cloud') {
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('ticket_number', ticketNumber);
      if (error) throw error;
      return true;
    }

    const { error } = await supabase
      .from('tickets')
      .delete()
      .eq('ticket_number', ticketNumber);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error permanently deleting ticket:', error);
    throw error;
  }
};

export const fetchAllTickets = async () => {
  try {
    let { data, error } = await supabase
      .from('tickets')
      .select(TICKETS_WITH_CLIENTS_SELECT)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error && isMissingColumnError(error)) {
      ({ data, error } = await supabase
        .from('tickets')
        .select(TICKETS_WITH_CLIENTS_SELECT)
        .order('created_at', { ascending: false }));
    }

    if (error) throw error;

    const mapped = data.map(mapTicketFromDb);
    return await filterOutDeletedTickets(mapped);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    throw error;
  }
};

export const fetchDeletedTickets = async () => {
  try {
    await syncLocalRecycleBinToCloud();

    const localTickets = getLocalRecycleBinTickets();
    const dbSupported = await probeSoftDeleteSupport();
    let cloudTickets = [];

    try {
      const cloudOk = await probeCloudRecycleBin();
      if (cloudOk) {
        cloudTickets = await fetchCloudRecycleBinTickets();
      }
    } catch {
      cloudTickets = [];
    }

    if (!dbSupported) {
      return mergeRecycleBinTickets(cloudTickets, localTickets);
    }

    let { data, error } = await supabase
      .from('tickets')
      .select(TICKETS_WITH_CLIENTS_SELECT)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });

    if (error && isMissingColumnError(error)) {
      softDeleteDbSupported = false;
      return mergeRecycleBinTickets(cloudTickets, localTickets);
    }

    if (error) throw error;

    const dbTickets = (data || []).map(mapTicketFromDb);
    return mergeRecycleBinTickets(dbTickets, mergeRecycleBinTickets(cloudTickets, localTickets));
  } catch (error) {
    console.error('Error fetching deleted tickets:', error);
    try {
      const cloudTickets = await fetchCloudRecycleBinTickets();
      return mergeRecycleBinTickets(cloudTickets, getLocalRecycleBinTickets());
    } catch {
      return getLocalRecycleBinTickets();
    }
  }
};

const mapTicketFromDb = (ticket) => ({
  id: ticket.ticket_number,
  internalId: ticket.id,
  clientId: ticket.client_id || ticket.clients?.id || null,
  customerName: ticket.clients?.first_name || 'Unknown',
  customerSurname: ticket.clients?.last_name || '',
  customerEmail: ticket.clients?.email || '',
  customerPhone: ticket.clients?.phone || '',
  deviceName: ticket.device_name,
  deviceSerial: ticket.device_serial,
  chargerSerial: ticket.charger_serial,
  batterySerial: ticket.battery_serial,
  issueDescription: ticket.issue_description,
  notes: ticket.notes || '',
  status: ticket.status,
  createdAt: ticket.created_at,
  completedAt: ticket.completed_at,
  repairDetails: ticket.repair_details,
  partsUsed: ticket.parts_used,
  partsCost: ticket.parts_cost,
  serviceCost: ticket.service_cost,
  estimatedCost: ticket.estimated_cost,
  osPassword: ticket.os_password,
  keepData: ticket.keep_data,
  hasBag: ticket.has_bag,
  bagDescription: ticket.bag_description,
  history: ticket.history || [],
  dispatchNoteNumber: ticket.dispatch_note_number,
  isWarranty: ticket.is_warranty || false,
  warrantyUntil: ticket.warranty_until || null,
  warrantyInvoice: ticket.warranty_invoice || null,
  isWarrantyClient: ticket.clients?.is_warranty_client || ticket.is_warranty || false,
  isVhs: ticket.is_vhs || false,
  vhsCassetteCount: ticket.vhs_cassette_count || null,
  vhsCassetteCondition: ticket.vhs_cassette_condition || '',
  vhsPricePerCassette: ticket.vhs_price_per_cassette || 30,
  deletedAt: ticket.deleted_at || null,
});

export const fetchTicketsByClientId = async (clientId) => {
  if (!clientId) return [];

  try {
    let { data, error } = await supabase
      .from('tickets')
      .select(TICKETS_WITH_CLIENTS_SELECT)
      .eq('client_id', clientId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error && isMissingColumnError(error)) {
      ({ data, error } = await supabase
        .from('tickets')
        .select(TICKETS_WITH_CLIENTS_SELECT)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false }));
    }

    if (error) throw error;
    return (data || []).map(mapTicketFromDb);
  } catch (error) {
    console.error('Error fetching client tickets:', error);
    throw error;
  }
};

export const fetchAllClients = async () => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }
};

export const fetchFinancialData = async () => {
  try {
    const { data: partsSales, error: salesError } = await supabase
      .from('parts_sales')
      .select('*')
      .order('sold_at', { ascending: false });

    if (salesError) throw salesError;

    let { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('*')
      .eq('status', 'completed')
      .is('deleted_at', null)
      .order('completed_at', { ascending: false });

    if (ticketsError && isMissingColumnError(ticketsError)) {
      ({ data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .eq('status', 'completed')
        .order('completed_at', { ascending: false }));
    }

    if (ticketsError) throw ticketsError;

    return {
      partsSales: partsSales || [],
      tickets: tickets || []
    };
  } catch (error) {
    console.error('Error fetching financial data:', error);
    throw error;
  }
};

// Parts Categories
export const createPartCategory = async (name, description) => {
  const { data, error } = await supabase
    .from('parts_categories')
    .insert([{ name, description }])
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updatePartCategory = async (id, name, description) => {
  const { data, error } = await supabase
    .from('parts_categories')
    .update({ name, description })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deletePartCategory = async (id) => {
  const { error } = await supabase
    .from('parts_categories')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
};

export const fetchAllPartCategories = async () => {
  const { data, error } = await supabase
    .from('parts_categories')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return data || [];
};

// Parts
export const createPart = async (categoryId, name, manufacturer, partNumber, description, price) => {
  const { data, error } = await supabase
    .from('parts')
    .insert([{
      category_id: categoryId || null,
      name,
      manufacturer,
      part_number: partNumber,
      description,
      price: price ? parseFloat(price) : 0
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updatePart = async (id, categoryId, name, manufacturer, partNumber, description, price) => {
  const { data, error } = await supabase
    .from('parts')
    .update({
      category_id: categoryId || null,
      name,
      manufacturer,
      part_number: partNumber,
      description,
      price: price ? parseFloat(price) : 0,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deletePart = async (id) => {
  const { error } = await supabase
    .from('parts')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
};

export const fetchAllParts = async () => {
  const { data, error } = await supabase
    .from('parts')
    .select(`*, parts_categories(name)`)
    .order('name', { ascending: true });
  if (error) throw error;
  return data || [];
};

export const searchParts = async (query, categoryId) => {
  let queryBuilder = supabase
    .from('parts')
    .select(`*, parts_categories(name)`);

  if (query) {
    queryBuilder = queryBuilder.or(`name.ilike.%${query}%,part_number.ilike.%${query}%,manufacturer.ilike.%${query}%`);
  }

  if (categoryId && categoryId !== 'all') {
    queryBuilder = queryBuilder.eq('category_id', categoryId);
  }

  const { data, error } = await queryBuilder.order('name', { ascending: true });
  if (error) throw error;
  return data || [];
};