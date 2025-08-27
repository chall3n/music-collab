import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request, { params }: { params: { projectId: string } }) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = params;
    const { email: collaboratorEmail } = await request.json();

    if (!collaboratorEmail) {
      return NextResponse.json({ message: 'Collaborator email is required' }, { status: 400 });
    }

    // Verify that the inviting user is a member of the project
    const { data: projectUser, error: projectUserError } = await supabase
      .from('project_users')
      .select('user_id')
      .eq('project_id', projectId)
      .eq('user_id', session.user.id)
      .single();

    if (projectUserError || !projectUser) {
      return NextResponse.json({ message: 'Forbidden: You are not a member of this project' }, { status: 403 });
    }

    // Use the service role key to query auth.users table
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not set.');
      return NextResponse.json({ message: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY is missing.' }, { status: 500 });
    }

    const supabaseServiceRole = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      { auth: { persistSession: false } }
    );

    const { data: { users }, error: userError } = await supabaseServiceRole.auth.admin.listUsers();

    let collaboratorUser = null;
    if (users) {
      collaboratorUser = users.find(user => user.email === collaboratorEmail);
    }

    if (userError || !collaboratorUser) {
      console.error('Error finding collaborator user:', userError, 'Email:', collaboratorEmail);
      return NextResponse.json({ message: 'Collaborator user not found. Please ensure they have signed up.' }, { status: 404 });
    }

    const collaboratorUserId = collaboratorUser.id;

    // Check if the collaborator is already a member of the project
    const { data: existingCollaborator, error: existingCollaboratorError } = await supabase
      .from('project_users')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', collaboratorUserId)
      .single();

    if (existingCollaboratorError && existingCollaboratorError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error checking existing collaborator:', existingCollaboratorError);
      return new NextResponse('Internal Server Error', { status: 500 });
    }

    if (existingCollaborator) {
      return new NextResponse('User is already a collaborator on this project.', { status: 409 });
    }

    // Add the collaborator to the project_users table
    const { error: insertError } = await supabase
      .from('project_users')
      .insert({ project_id: projectId, user_id: collaboratorUserId });

    if (insertError) {
      console.error('Error adding collaborator to project_users:', insertError);
      return new NextResponse('Internal Server Error', { status: 500 });
    }

    return NextResponse.json({ message: 'Collaborator added successfully!' });

  } catch (error) {
    console.error('An unexpected error occurred:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}