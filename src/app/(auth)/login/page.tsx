'use client'

import { useState, Suspense } from 'react'
import { signIn } from "@/lib/auth-client"
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AlertCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
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
          <svg width="45" height="24" viewBox="0 0 100 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 20C15 10 20 10 25 20C30 30 35 30 40 20C45 10 50 10 55 20C60 30 65 30 70 20C75 10 80 10 85 20" stroke="#000" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="85" cy="20" r="4" fill="#F97316" />
          </svg>
          <div>
            <h1 className="text-2xl font-bold text-[#EA7B2A] tracking-tight">Sistem Kepegawaian</h1>
            <p className="text-xs font-medium text-gray-500">JMC IT Consultant</p>
          </div>
        </div>
        
        <p className="text-sm text-gray-700 mb-8 leading-relaxed pr-10">
          Selamat Datang, silahkan masukkan username dan password anda!
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
              placeholder="Username / Email / NIP"
              className="h-12 bg-[#F7F9FA] border-0 focus-visible:ring-1 focus-visible:ring-[#EA7B2A] rounded-md text-gray-800 placeholder:text-gray-400"
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
              className="h-12 bg-[#F7F9FA] border-0 focus-visible:ring-1 focus-visible:ring-[#EA7B2A] rounded-md text-gray-800 placeholder:text-gray-400"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-[10px] text-red-500 ml-1">{errors.password.message}</p>
            )}
          </div>

          {/* Dummy Captcha Section */}
          <div className="space-y-4 pt-1">
            <div className="flex items-center gap-4">
              <div className="bg-[#F7F9FA] border border-gray-200 px-8 py-3 rounded-md">
                <span className="text-xl font-mono font-bold tracking-[0.3em] text-gray-800 pointer-events-none select-none">
                  NEgEk
                </span>
              </div>
              <button type="button" className="text-xs text-blue-500 hover:text-blue-700 font-medium">
                Refresh
              </button>
            </div>
            
            <Input
              type="text"
              placeholder="Ketik kode captcha di atas"
              className="h-12 bg-[#F7F9FA] border-0 focus-visible:ring-1 focus-visible:ring-[#EA7B2A] rounded-md text-gray-800 placeholder:text-gray-400"
            />
          </div>

          {/* Remember Me */}
          <div className="flex items-center gap-2 pt-2 pb-4">
            <input 
              type="checkbox" 
              id="remember" 
              className="w-4 h-4 rounded border-gray-300 text-[#EA7B2A] focus:ring-[#EA7B2A]"
            />
            <label htmlFor="remember" className="text-sm font-medium text-gray-700 cursor-pointer">
              Remember Me
            </label>
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-[#EA7B2A] hover:bg-[#d66a21] text-white font-bold text-sm rounded-md transition-colors"
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>

        {/* Carousel Controls */}
        <button className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-600 transition-transform hover:scale-110">
          <ChevronLeft className="w-12 h-12" strokeWidth={1.5} />
        </button>
        <button className="absolute right-6 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-600 transition-transform hover:scale-110">
          <ChevronRight className="w-12 h-12" strokeWidth={1.5} />
        </button>

        {/* Indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-600" />
          <span className="w-2 h-2 rounded-full bg-gray-300/80" />
          <span className="w-2 h-2 rounded-full bg-gray-300/80" />
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
          <Loader2 className="h-8 w-8 animate-spin text-[#EA7B2A]" />
          <span className="text-sm font-medium tracking-wide">Memuat halaman masuk...</span>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
