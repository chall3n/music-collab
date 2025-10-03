'use client'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'

//need to add explanation of what App is/does for demo
//few slides showing capabilites and what's it's good for

const carouselImages = [
  {
    src: "/Screenshot 2025-10-02 at 9.15.53 PM.png",
    alt: "The main whiteboard interface of the application, showing audio tracks and a canvas."
  },
  {
    src: "/Screenshot 2025-10-02 at 9.17.04 PM.png",
    alt: "A close-up of the waveform player with controls for playback and download."
  },
  {
    src: "/Screenshot 2025-10-02 at 9.20.34 PM.png",
    alt: "The project sidebar, allowing users to switch between different collaboration projects."
  },
  {
    src: "/Screenshot 2025-10-02 at 9.22.22 PM.png",
    alt: "The user management view, showing how to add collaborators to a project."
  }
];

export default function Login() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [redirectTo, setRedirectTo] = useState('')

  const [emblaRef] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000, stopOnInteraction: false })])

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
    <div className="flex flex-row items-center justify-center min-h-screen p-8">
      <div className="w-full max-w-3xl shadow-md mr-12">
        <div className="embla rounded-lg border-0 bg-card text-card-foreground shadow-sm overflow-hidden">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {carouselImages.map((img, index) => (
                <div className="relative flex-[0_0_100%] aspect-video" key={index}>
                  <Image
                    src={img.src}
                    alt={img.alt}
                    layout="fill"
                    objectFit="cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="w-full max-w-md flex flex-col space-y-8 border-l border-gray-200 pl-8">
        <h1 className="text-3xl font-extrabold text-center">
          Collab.e
        </h1>
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
