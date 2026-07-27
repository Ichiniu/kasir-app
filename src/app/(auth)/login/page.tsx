'use client'

import { useState, Suspense } from 'react'
import { signIn } from "@/lib/auth-client"
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AlertCircle, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { loginSchema } from '@/utils/validation'

type LoginFormValues = z.infer<typeof loginSchema>

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true)
    setError(null)

    try {
      await signIn.email({
        email: data.email,
        password: data.password,
        callbackURL: callbackUrl,
      }, {
        onSuccess: () => {
          router.push(callbackUrl)
          router.refresh()
        },
        onError: (ctx) => {
          setError(ctx.error.message || 'Email atau password salah')
          setIsLoading(false)
        }
      })
    } catch (error) {
      setError('Terjadi kesalahan sistem')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex w-full font-sans bg-white">
      {/* Kiri - Form Login */}
      <div className="w-full md:w-[480px] lg:w-[550px] bg-white p-8 md:p-16 flex flex-col justify-center shrink-0 z-10 relative">
        {/* Logo & Judul */}
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-[#a3b38c] p-2 rounded-lg">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Casir+</h1>
            <p className="text-xs font-medium text-gray-500">Modern POS System</p>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mb-8 leading-relaxed pr-10">
          Selamat datang kembali! Silakan masukkan email dan password untuk masuk ke dashboard.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {error && (
            <Alert variant="destructive" className="bg-red-50 text-red-600 border-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-1">
            <Input
              id="email"
              type="email"
              placeholder="Email Address"
              className="h-12 bg-[#F7F9FA] border-0 focus-visible:ring-1 focus-visible:ring-[#a3b38c] rounded-md text-gray-800 placeholder:text-gray-400"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-[10px] text-red-500 ml-1">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Input
              id="password"
              type="password"
              placeholder="Password"
              className="h-12 bg-[#F7F9FA] border-0 focus-visible:ring-1 focus-visible:ring-[#a3b38c] rounded-md text-gray-800 placeholder:text-gray-400"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-[10px] text-red-500 ml-1">{errors.password.message}</p>
            )}
          </div>

          {/* Remember Me */}
          <div className="flex items-center gap-2 pt-2 pb-4">
            <input 
              type="checkbox" 
              id="remember" 
              className="w-4 h-4 rounded border-gray-300 text-[#a3b38c] focus:ring-[#a3b38c]"
            />
            <label htmlFor="remember" className="text-sm font-medium text-gray-700 cursor-pointer">
              Ingat Saya
            </label>
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-[#a3b38c] hover:bg-[#8e9d77] text-white font-bold text-sm rounded-md transition-colors"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              'MASUK'
            )}
          </Button>
        </form>
      </div>

      {/* Kanan - Image Carousel */}
      <div className="hidden md:block flex-1 relative bg-gray-100 overflow-hidden">
        {/* Gunakan gambar background cafe-bg.png atau default image lainnya */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
          style={{ backgroundImage: "url('/cafe-bg.png')" }}
        />
        
        {/* Gradient Overlay tipis agar tidak terlalu flat */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

        {/* Carousel Text overlay */}
        <div className="absolute bottom-16 left-12 right-12 text-white">
          <h2 className="text-3xl font-bold mb-3">Kelola Kasir Lebih Mudah</h2>
          <p className="text-white/80 text-sm leading-relaxed max-w-lg">
            Pantau penjualan, stok barang, dan laporan keuangan dalam satu dashboard yang modern dan mudah digunakan.
          </p>
        </div>

        {/* Indicators */}
        <div className="absolute bottom-8 left-12 flex gap-2">
          <span className="w-2 h-2 rounded-full bg-white" />
          <span className="w-2 h-2 rounded-full bg-white/40" />
          <span className="w-2 h-2 rounded-full bg-white/40" />
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white text-gray-800 font-sans">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#a3b38c]" />
          <span className="text-sm font-medium tracking-wide">Memuat halaman masuk...</span>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
