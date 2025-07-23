'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { UnicornBackground } from '@/components/UnicornBackground'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { signup } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    
    const hasUpperCase = /[A-Z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    
    if (!hasUpperCase && !hasNumber) {
      setError('Password must contain at least one uppercase letter or number')
      return
    }
    
    setLoading(true)

    try {
      await signup(email, password)
      setSuccess(true)
      setLoading(false)
    } catch (err: any) {
      if (err.message.includes('already exists')) {
        setError('An account with this email already exists')
      } else {
        setError(err.message || 'Failed to create account')
      }
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative flex flex-col">
      <UnicornBackground />
      <div className="relative z-10 flex-1 flex flex-col">
        <Navbar />
        <div className="flex items-center justify-center flex-1 p-4">
          <Card className="w-full max-w-md bg-background/90 backdrop-blur-md">
            <CardHeader>
              <CardTitle>Create an account</CardTitle>
            </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <p className="text-green-600 font-medium">Account created successfully!</p>
                <p className="text-sm text-muted-foreground">
                  We've sent a verification email to {email}.
                  Please check your inbox and click the verification link.
                </p>
              </div>
              <Button 
                onClick={() => router.push('/login')}
                className="w-full"
              >
                Go to Login
              </Button>
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <p className="text-xs text-muted-foreground">
                At least 6 characters with 1 uppercase letter or number
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={confirmPassword && password !== confirmPassword ? 'border-red-500' : ''}
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
            </div>
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            <Button 
              type="submit" 
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </Button>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Already have an account?{' '}
              <Link href="/login" className="underline underline-offset-4 hover:text-primary">
                Login
              </Link>
            </p>
          </form>
          )}
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    </div>
  )
}