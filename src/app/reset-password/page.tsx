'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Auth } from '@supabase/auth-ui-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ResetPassword() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [sessionReady, setSessionReady] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const { hash } = window.location;
    const params = new URLSearchParams(hash.substring(1)); // remove '#'
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const error = params.get('error_description');

    if (error) {
      setErrorMsg(error);
      return;
    }

    const handleAuthChange = async (event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // This event fires after the user successfully resets their password.
        router.push('/login?message=Password reset successfully. Please log in.');
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);

    if (accessToken && refreshToken) {
      // Manually set the session from the URL fragment.
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).then(({ error }) => {
        if (error) {
          setErrorMsg('Failed to process password reset link.');
        } else {
          // Session is set, the <Auth> component will now show the update password form.
          setSessionReady(true);
        }
      });
    } else {
      // If there are no tokens, it's an invalid link.
      setErrorMsg('Invalid or expired password reset link.');
    }

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase, router]);

  if (errorMsg) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
            <h1 className="text-2xl font-bold text-center text-red-600">Error</h1>
            <p className="text-center">{errorMsg}</p>
            <button onClick={() => router.push('/login')} className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700">
                Back to Login
            </button>
        </div>
      </div>
    )
  }

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
