'use client'

import { useState } from 'react'
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

export default function LoginPage() {
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
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center font-sans"
      style={{ backgroundImage: "url('/cafe-bg.png')" }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-green-900/10 backdrop-blur-[2px]"></div>

      <div className="relative w-full max-w-[420px] p-4 animate-in fade-in zoom-in duration-700">
        <div className="bg-white/40 backdrop-blur-xl border border-white/30 shadow-2xl rounded-[40px] px-10 py-12">
          
          <div className="text-center mb-10">
            <h1 className="text-[44px] font-serif font-semibold text-[#374151] tracking-tight mb-2">Kasirku</h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <Alert variant="destructive" className="bg-red-50/50 border-red-200 backdrop-blur-sm">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-1">
              <Input
                id="email"
                type="email"
                placeholder="Email Address"
                className="h-12 bg-white/50 border-white/50 focus:border-green-500/50 focus:ring-0 rounded-xl placeholder:text-gray-500 text-gray-800"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-[10px] text-red-500 ml-2">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Input
                id="password"
                type="password"
                placeholder="Password"
                className="h-12 bg-white/50 border-white/50 focus:border-green-500/50 focus:ring-0 rounded-xl placeholder:text-gray-500 text-gray-800"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-[10px] text-red-500 ml-2">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-[#a3b38c] hover:bg-[#8e9d77] text-white font-medium text-lg rounded-full transition-all duration-300 shadow-lg shadow-green-900/10 active:scale-[0.98]"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-10">
            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-400/30" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                <span className="bg-transparent px-3 text-gray-500/80 font-medium italic">Or continue with</span>
              </div>
            </div>

            <div className="flex justify-center gap-6">
              <button className="w-12 h-12 rounded-full bg-white/50 flex items-center justify-center hover:bg-white/80 transition-colors shadow-sm">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.19 3.32v2.76h3.54c2.08-1.92 3.29-4.74 3.29-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.54-2.76c-.98.66-2.23 1.06-3.74 1.06-2.88 0-5.33-1.94-6.2-4.54H2.18v2.84A10.99 10.99 0 0012 23z" fill="#34A853"/>
                  <path d="M5.8 14.1a6.6 6.6 0 010-4.2V7.06H2.18a10.99 10.99 0 000 9.88l3.62-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.22 1 3.21 3.74 1.18 7.76l3.62 2.84c.87-2.6 3.32-4.54 6.2-4.54z" fill="#EA4335"/>
                </svg>
              </button>
              <button className="w-12 h-12 rounded-full bg-white/50 flex items-center justify-center hover:bg-white/80 transition-colors shadow-sm">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.152 6.896c-.548 0-1.411-.516-1.411-1.308 0-1.057.846-1.885 1.885-1.885.526 0 1.411.516 1.411 1.308 0 1.057-.846 1.885-1.885 1.885zm3.513 14.604c-1.182 0-1.911-.648-2.911-.648-1 0-1.782.648-2.911.648-1.576 0-3.754-2.231-3.754-5.347 0-3.39 2.115-5.378 4.14-5.378 1.03 0 1.821.54 2.525.54.704 0 1.396-.54 2.525-.54 1.636 0 3.279.945 3.974 2.373-3.212 1.623-2.696 5.367.437 6.442-.647 1.408-1.488 2.91-2.975 2.91z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap');
        h1 {
          font-family: 'Playfair Display', serif !important;
        }
      `}</style>
    </div>
  )
}
