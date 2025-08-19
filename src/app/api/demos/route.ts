
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return new NextResponse('Project ID is required', { status: 400 });
    }

    // Verify user access to the project
    const { data: projectUser, error: projectUserError } = await supabase
      .from('project_users')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', session.user.id)
      .single();

    if (projectUserError || !projectUser) {
      console.error('Error verifying project access:', projectUserError);
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Fetch demos for the given project_id
    const { data: demosData, error: demosError } = await supabase
      .from('demos')
      .select('*')
      .eq('project_id', projectId);

    if (demosError) {
      console.error('Error fetching demos:', demosError);
      return new NextResponse('Internal Server Error', { status: 500 });
    }

    // Fetch stems for the demos
    const { data: stemsData, error: stemsError } = await supabase
      .from('stems')
      .select('*');

    if (stemsError) {
      console.error('Error fetching stems:', stemsError);
      return new NextResponse('Internal Server Error', { status: 500 });
    }

    // Combine demos and stems on the server
    const combinedDemos = demosData.map((demo) => ({
      ...demo,
      stems: stemsData.filter((stem) => stem.demo_id === demo.id),
    }));

    return NextResponse.json(combinedDemos);
  } catch (error) {
    console.error('An unexpected error occurred:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
