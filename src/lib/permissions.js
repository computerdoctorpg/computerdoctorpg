export const canManageUsers = (isAdmin) => !!isAdmin;

export const canViewFinances = (isAdmin) => !!isAdmin;

export const canDeleteTickets = (isAdmin) => !!isAdmin;

export const canEditDocuments = (isAdmin) => !!isAdmin;

export const canCreateTickets = () => true;

export const canWriteDeliveryNotes = () => true;
