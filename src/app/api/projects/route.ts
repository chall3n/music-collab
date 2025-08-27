import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { data: projectUsers, error: projectUsersError } = await supabase
      .from('project_users')
      .select('project_id')
      .eq('user_id', session.user.id);

    if (projectUsersError) {
      console.error('Error fetching project users:', projectUsersError);
      return new NextResponse('Internal Server Error', { status: 500 });
    }

    const projectIds = projectUsers.map((pu) => pu.project_id);

    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .in('id', projectIds);

    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
      return new NextResponse('Internal Server Error', { status: 500 });
    }

    return NextResponse.json(projects);
  } catch (error) {
    console.error('An unexpected error occurred:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { name } = await request.json();

    if (!name) {
      return new NextResponse('Project name is required', { status: 400 });
    }

    // 1. Create new row in projects table
    const { data: newProjectData, error: projectError } = await supabase
      .from('projects')
      .insert({ name: name })
      .select('id, created_at, name, tldraw_snapshot') // Select all expected columns
      .single();

    if (projectError) {
      console.error('Error creating project:', projectError);
      return new NextResponse('Internal Server Error', { status: 500 });
    }

    // 2. Associate that project with the user in project_users table
    const { error: projectUserError } = await supabase
      .from('project_users')
      .insert({ project_id: newProjectData.id, user_id: session.user.id });

    if (projectUserError) {
      console.error('Error associating user with project:', projectUserError);
      // Consider rolling back project creation here if necessary
      return new NextResponse('Internal Server Error', { status: 500 });
    }

    // 3. Return the new project data
    return NextResponse.json(newProjectData);

    if (error) {
      console.error('Error creating project:', error);
      return new NextResponse('Internal Server Error', { status: 500 });
    }

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error('An unexpected error occurred:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
