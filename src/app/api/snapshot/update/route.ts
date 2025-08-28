import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function PATCH(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { projectId, snapshot } = await request.json();

    if (!projectId || !snapshot) {
      return new NextResponse('projectId and snapshot are required', { status: 400 });
    }

    // Verify that the user is a member of the project before allowing an update.
    const { data: projectUser, error: projectUserError } = await supabase
      .from('project_users')
      .select('user_id')
      .eq('project_id', projectId)
      .eq('user_id', session.user.id)
      .single();

    if (projectUserError || !projectUser) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Update the tldraw_snapshot for the given project
    const { data: updatedData, error: updateError } = await supabase
      .from('projects')
      .update({ tldraw_snapshot: snapshot })
      .eq('id', projectId)
      .select();

    // Log the outcome of the update operation
    console.log('Supabase update result:', { data: updatedData, error: updateError });

    if (updateError) {
      console.error('Error updating snapshot:', updateError);
      return new NextResponse('Internal Server Error', { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('An unexpected error occurred:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
