import { z } from 'zod'

/**
 * Validation schemas using Zod
 */

// Auth Schemas
export const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
})

export const registerSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password tidak sama',
  path: ['confirmPassword'],
})

// Product Schemas
export const productSchema = z.object({
  sku: z.string().min(1, 'SKU wajib diisi'),
  name: z.string().min(3, 'Nama produk minimal 3 karakter'),
  description: z.string().optional(),
  price: z.number().min(0, 'Harga harus lebih dari 0'),
  cost: z.number().min(0, 'Harga modal harus lebih dari 0'),
  stock: z.number().int().min(0, 'Stock tidak boleh negatif'),
  minStock: z.number().int().min(0, 'Minimum stock tidak boleh negatif').default(5),
  categoryId: z.string().optional(),
  imageUrl: z.string().url('URL gambar tidak valid').optional().or(z.literal('')),
  isActive: z.boolean().default(true),
})

// Category Schema
export const categorySchema = z.object({
  name: z.string().min(3, 'Nama kategori minimal 3 karakter'),
  description: z.string().optional(),
})

// Transaction Schemas
export const transactionItemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  quantity: z.number().int().min(1, 'Jumlah minimal 1'),
  price: z.number().min(0),
  subtotal: z.number().min(0),
})

export const transactionSchema = z.object({
  items: z.array(transactionItemSchema).min(1, 'Minimal 1 item'),
  paymentMethod: z.enum(['CASH', 'DEBIT_CARD', 'CREDIT_CARD', 'E_WALLET', 'BANK_TRANSFER']),
  cashReceived: z.number().min(0).optional(),
  discountAmount: z.number().min(0).default(0),
  taxAmount: z.number().min(0).default(0),
  notes: z.string().optional(),
}).refine((data) => {
  if (data.paymentMethod === 'CASH') {
    return data.cashReceived !== undefined && data.cashReceived > 0
  }
  return true
}, {
  message: 'Jumlah uang yang diterima wajib diisi untuk pembayaran cash',
  path: ['cashReceived'],
})

// User Schema
export const userSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter').optional(),
  role: z.enum(['ADMIN', 'CASHIER']),
  isActive: z.boolean().default(true),
})

// Settings Schema
export const settingSchema = z.object({
  key: z.string().min(1, 'Key wajib diisi'),
  value: z.string().min(1, 'Value wajib diisi'),
})

// Types from schemas
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ProductInput = z.infer<typeof productSchema>
export type CategoryInput = z.infer<typeof categorySchema>
export type TransactionInput = z.infer<typeof transactionSchema>
export type TransactionItemInput = z.infer<typeof transactionItemSchema>
export type UserInput = z.infer<typeof userSchema>
export type SettingInput = z.infer<typeof settingSchema>
