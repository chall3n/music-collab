import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const fileUrl = searchParams.get('fileUrl')

  if (!fileUrl) {
    return new Response('Missing fileUrl parameter', { status: 400 })
  }

  try {
    // Fetch the file from the Supabase URL
    const response = await fetch(fileUrl)

    if (!response.ok) {
      return new Response('File not found', { status: 404 })
    }

    // Get the filename from the URL
    const url = new URL(fileUrl)
    const filename = url.pathname.split('/').pop() || 'download'

    // Create a new response with the file's data and headers
    // that force a download.
    return new Response(response.body, {
      headers: {
        ...response.headers,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error proxying download:', error)
    return new Response('Error processing your request', { status: 500 })
  }
}
