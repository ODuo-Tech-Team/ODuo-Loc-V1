export type Role = "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "OPERATOR" | "VIEWER"

type Permission =
  | "CREATE_USER"
  | "EDIT_USER"
  | "DELETE_USER"
  | "CREATE_EQUIPMENT"
  | "EDIT_EQUIPMENT"
  | "DELETE_EQUIPMENT"
  | "CREATE_BOOKING"
  | "EDIT_BOOKING"
  | "DELETE_BOOKING"
  | "CREATE_CUSTOMER"
  | "EDIT_CUSTOMER"
  | "DELETE_CUSTOMER"
  | "VIEW_REPORTS"
  | "MANAGE_INTEGRATIONS"
  | "MANAGE_SETTINGS"
  // Permissões fiscais (NFS-e)
  | "VIEW_INVOICES"
  | "CREATE_INVOICES"
  | "CANCEL_INVOICES"
  | "MANAGE_FISCAL_CONFIG"

const rolePermissions: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    "CREATE_USER",
    "EDIT_USER",
    "DELETE_USER",
    "CREATE_EQUIPMENT",
    "EDIT_EQUIPMENT",
    "DELETE_EQUIPMENT",
    "CREATE_BOOKING",
    "EDIT_BOOKING",
    "DELETE_BOOKING",
    "CREATE_CUSTOMER",
    "EDIT_CUSTOMER",
    "DELETE_CUSTOMER",
    "VIEW_REPORTS",
    "MANAGE_INTEGRATIONS",
    "MANAGE_SETTINGS",
    "VIEW_INVOICES",
    "CREATE_INVOICES",
    "CANCEL_INVOICES",
    "MANAGE_FISCAL_CONFIG",
  ],
  ADMIN: [
    "CREATE_USER",
    "EDIT_USER",
    "DELETE_USER",
    "CREATE_EQUIPMENT",
    "EDIT_EQUIPMENT",
    "DELETE_EQUIPMENT",
    "CREATE_BOOKING",
    "EDIT_BOOKING",
    "DELETE_BOOKING",
    "CREATE_CUSTOMER",
    "EDIT_CUSTOMER",
    "DELETE_CUSTOMER",
    "VIEW_REPORTS",
    "MANAGE_INTEGRATIONS",
    "MANAGE_SETTINGS",
    "VIEW_INVOICES",
    "CREATE_INVOICES",
    "CANCEL_INVOICES",
    "MANAGE_FISCAL_CONFIG",
  ],
  MANAGER: [
    "CREATE_EQUIPMENT",
    "EDIT_EQUIPMENT",
    "CREATE_BOOKING",
    "EDIT_BOOKING",
    "CREATE_CUSTOMER",
    "EDIT_CUSTOMER",
    "VIEW_REPORTS",
    "VIEW_INVOICES",
    "CREATE_INVOICES",
  ],
  OPERATOR: ["CREATE_BOOKING", "EDIT_BOOKING", "CREATE_CUSTOMER", "VIEW_REPORTS", "VIEW_INVOICES"],
  VIEWER: ["VIEW_REPORTS", "VIEW_INVOICES"],
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) || false
}

export function canManageUsers(role: Role): boolean {
  return hasPermission(role, "CREATE_USER")
}

export function canManageEquipment(role: Role): boolean {
  return hasPermission(role, "CREATE_EQUIPMENT")
}

export function canManageBookings(role: Role): boolean {
  return hasPermission(role, "CREATE_BOOKING")
}

export function canManageCustomers(role: Role): boolean {
  return hasPermission(role, "CREATE_CUSTOMER")
}

export function canViewInvoices(role: Role): boolean {
  return hasPermission(role, "VIEW_INVOICES")
}

export function canCreateInvoices(role: Role): boolean {
  return hasPermission(role, "CREATE_INVOICES")
}

export function canManageFiscalConfig(role: Role): boolean {
  return hasPermission(role, "MANAGE_FISCAL_CONFIG")
}
