'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Auth } from '@supabase/auth-ui-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthChangeEvent } from '@supabase/supabase-js';

export default function ResetPassword() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    const handleAuthChange = (event: AuthChangeEvent) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true);
      }
      if (event === 'USER_UPDATED') {
        router.replace('/');
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase, router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">Update Password</h1>
        {sessionReady ? (
          <Auth
            supabaseClient={supabase}
            view="update_password"
            providers={[]}
          />
        ) : (
          <p className="text-center">Verifying reset link...</p>
        )}
      </div>
    </div>
  );
}
