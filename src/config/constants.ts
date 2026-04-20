/**
 * Application Constants
 */

export const APP_NAME = 'Kasir App'
export const APP_DESCRIPTION = 'Aplikasi Kasir Modern untuk Toko Anda'

// Pagination
export const DEFAULT_PAGE_SIZE = 10
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

// Payment Methods
export const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Tunai' },
  { value: 'DEBIT_CARD', label: 'Kartu Debit' },
  { value: 'CREDIT_CARD', label: 'Kartu Kredit' },
  { value: 'E_WALLET', label: 'E-Wallet' },
  { value: 'BANK_TRANSFER', label: 'Transfer Bank' },
] as const

// Payment Status
export const PAYMENT_STATUS = [
  { value: 'PENDING', label: 'Pending', color: 'yellow' },
  { value: 'COMPLETED', label: 'Selesai', color: 'green' },
  { value: 'CANCELLED', label: 'Dibatalkan', color: 'red' },
  { value: 'REFUNDED', label: 'Dikembalikan', color: 'blue' },
] as const

// User Roles
export const USER_ROLES = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'CASHIER', label: 'Kasir' },
] as const

// Date Formats
export const DATE_FORMAT = 'dd/MM/yyyy'
export const DATETIME_FORMAT = 'dd/MM/yyyy HH:mm'
export const TIME_FORMAT = 'HH:mm'

// File Upload
export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// Tax Rate (Default)
export const DEFAULT_TAX_RATE = 10 // 10%

// Stock Warning
export const LOW_STOCK_THRESHOLD = 5

// Chart Colors
export const CHART_COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
}

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  PRODUCTS: '/products',
  TRANSACTIONS: '/transactions',
  REPORTS: '/reports',
  USERS: '/users',
  SETTINGS: '/settings',
} as const

// API Routes
export const API_ROUTES = {
  AUTH: {
    LOGIN: '/api/auth/signin',
    LOGOUT: '/api/auth/signout',
    SESSION: '/api/auth/session',
  },
  PRODUCTS: {
    LIST: '/api/products',
    CREATE: '/api/products',
    UPDATE: (id: string) => `/api/products/${id}`,
    DELETE: (id: string) => `/api/products/${id}`,
  },
  TRANSACTIONS: {
    LIST: '/api/transactions',
    CREATE: '/api/transactions',
    DETAIL: (id: string) => `/api/transactions/${id}`,
  },
  USERS: {
    LIST: '/api/users',
    CREATE: '/api/users',
    UPDATE: (id: string) => `/api/users/${id}`,
    DELETE: (id: string) => `/api/users/${id}`,
  },
  REPORTS: {
    SALES: '/api/reports/sales',
    INVENTORY: '/api/reports/inventory',
  },
} as const
