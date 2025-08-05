'use client'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Whiteboard from '../components/Whiteboard'
import type { User } from '@supabase/supabase-js'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    okaygetUser()
  }, [supabase])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [loading, user, router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return null // or a loading spinner, since the redirect will happen in useEffect
  }

  return (
    <div>
      <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10 }}>
        <p style={{ marginRight: '1rem', display: 'inline' }}>{user.email}</p>
        <button onClick={handleSignOut} style={{ padding: '8px 12px', cursor: 'pointer' }}>
          Sign Out
        </button>
      </div>
      <Whiteboard />
    </div>
  )
}
