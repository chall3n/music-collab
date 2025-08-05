
'use client'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ResetPassword() {
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      // The PASSWORD_RECOVERY event is fired when the user successfully resets their password.
      if (event === 'PASSWORD_RECOVERY') {
        // Redirect them to the home page or a "password updated successfully" page.
        router.push('/')
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, router])

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div style={{ width: '320px' }}>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          // This is the key change: it tells the component to show the password reset form.
          view="update_password"
          // We don't need social providers on the password reset page.
          providers={[]}
        />
      </div>
    </div>
  )
}
