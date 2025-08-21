'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Auth } from '@supabase/auth-ui-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ResetPassword() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    // The password recovery link contains a URL fragment with the access token.
    // We can detect this fragment to know that we should display the update password form.
    // Example fragment: #access_token=some-access-token
    if (window.location.hash.includes('access_token')) {
      console.log('Access token found in URL, showing update form.');
      setSessionReady(true);
    }

    // We still need to listen for the USER_UPDATED event to redirect the user
    // after they have successfully updated their password.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'USER_UPDATED') {
        console.log('User password updated, redirecting...');
        router.replace('/');
      }
    });

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

