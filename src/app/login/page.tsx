'use client'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

//need to add explanation of what App is/does for demo
//few slides showing capabilites and what's it's good for

export default function Login() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [redirectTo, setRedirectTo] = useState('')

  useEffect(() => {
    setRedirectTo(`${window.location.origin}/auth/callback`)

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        router.push('/')
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, router])

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div style={{ width: '320px' }}>
        {redirectTo && (
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    inputBackground: 'white',
                  },
                },
              },
            }}
            providers={[]}
            redirectTo={redirectTo}
          />
        )}
      </div>
    </div>
  )
}