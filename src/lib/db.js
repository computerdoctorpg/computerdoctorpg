import { supabase } from '@/lib/customSupabaseClient';

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

export const upsertClient = async (clientData) => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .upsert({
        first_name: clientData.first_name,
        last_name: clientData.last_name,
        email: clientData.email,
        phone: clientData.phone,
      }, {
        onConflict: 'phone',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) throw new Error(error.message || 'Greška pri kreiranju klijenta');
    return data;
  } catch (error) {
    console.error('Error upserting client:', error);
    throw error;
  }
};

export const createTicket = async (ticketData, clientId) => {
  try {
    const ticketNumber = await generateTicketNumber();
    
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
      service_cost: 0,
      estimated_cost: 0,
    };

    const { data, error } = await supabase
      .from('tickets')
      .insert(insertPayload)
      .select()
      .single();

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

    const { data, error } = await supabase
      .from('tickets')
      .update(updateData)
      .eq('ticket_number', ticketNumber)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating ticket:', error);
    throw error;
  }
};

export const deleteTicket = async (ticketNumber, isAdmin = false) => {
  if (!isAdmin) {
    throw new Error('Pristup odbijen. Samo administratori mogu brisati naloge.');
  }

  try {
    const { error } = await supabase
      .from('tickets')
      .delete()
      .eq('ticket_number', ticketNumber);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting ticket:', error);
    throw error;
  }
};

export const fetchAllTickets = async () => {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        clients (
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(ticket => ({
      id: ticket.ticket_number,
      internalId: ticket.id,
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
      dispatchNoteNumber: ticket.dispatch_note_number
    }));
  } catch (error) {
    console.error('Error fetching tickets:', error);
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

    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('*')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false });

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