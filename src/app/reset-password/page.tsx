
'use client'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function ResetPassword() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    // Log the URL as soon as the component mounts on the client
    console.log('Current URL on mount:', window.location.href);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true)
      }
      if (event === 'USER_UPDATED') {
        router.replace('/')
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, router])

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div style={{ width: '320px' }}>
        {sessionReady ? (
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            view="update_password"
            providers={[]}
          />
        ) : (
          <p style={{ textAlign: 'center' }}>Loading...</p>
        )}
      </div>
    </div>
  )
}
