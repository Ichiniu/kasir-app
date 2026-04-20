// Common TypeScript Types for the application

export type UserRole = 'ADMIN' | 'CASHIER'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Category {
  id: string
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
}

export interface Product {
  id: string
  sku: string
  name: string
  description?: string
  price: number
  cost: number
  stock: number
  minStock: number
  imageUrl?: string
  isActive: boolean
  categoryId?: string
  category?: Category
  createdAt: Date
  updatedAt: Date
}

export type PaymentMethod = 
  | 'CASH' 
  | 'DEBIT_CARD' 
  | 'CREDIT_CARD' 
  | 'E_WALLET' 
  | 'BANK_TRANSFER'

export type PaymentStatus = 
  | 'PENDING' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'REFUNDED'

export interface Transaction {
  id: string
  invoiceNumber: string
  totalAmount: number
  discountAmount: number
  taxAmount: number
  finalAmount: number
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  cashReceived?: number
  changeAmount?: number
  notes?: string
  userId: string
  user?: User
  transactionItems?: TransactionItem[]
  createdAt: Date
  updatedAt: Date
}

export interface TransactionItem {
  id: string
  transactionId: string
  productId: string
  productName: string
  quantity: number
  price: number
  subtotal: number
  product?: Product
  createdAt: Date
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface Setting {
  id: string
  key: string
  value: string
  createdAt: Date
  updatedAt: Date
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Form Types
export interface LoginFormData {
  email: string
  password: string
}

export interface ProductFormData {
  sku: string
  name: string
  description?: string
  price: number
  cost: number
  stock: number
  minStock: number
  categoryId?: string
  imageUrl?: string
}

export interface TransactionFormData {
  items: CartItem[]
  paymentMethod: PaymentMethod
  cashReceived?: number
  discountAmount?: number
  notes?: string
}

// Filter & Sort Types
export interface ProductFilter {
  search?: string
  categoryId?: string
  isActive?: boolean
  minPrice?: number
  maxPrice?: number
}

export interface TransactionFilter {
  startDate?: Date
  endDate?: Date
  paymentMethod?: PaymentMethod
  paymentStatus?: PaymentStatus
  userId?: string
}

export interface SortOption {
  field: string
  order: 'asc' | 'desc'
}
