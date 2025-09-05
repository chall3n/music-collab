import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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

    const emptySnapshot = {"session": {"version": 0, "isGridMode": false, "pageStates": [{"camera": {"x": 0, "y": 0, "z": 1}, "pageId": "page:page", "focusedGroupId": null, "selectedShapeIds": []}], "isDebugMode": false, "isFocusMode": false, "isToolLocked": false, "currentPageId": "page:page", "exportBackground": true}, "document": {"store": {"page:page": {"id": "page:page", "meta": {}, "name": "Page 1", "index": "a1", "typeName": "page"}, "document:document": {"id": "document:document", "meta": {}, "name": "", "gridSize": 10, "typeName": "document"}}, "schema": {"sequences": {"com.tldraw.page": 1, "com.tldraw.asset": 1, "com.tldraw.shape": 4, "com.tldraw.store": 4, "com.tldraw.camera": 1, "com.tldraw.pointer": 1, "com.tldraw.document": 2, "com.tldraw.instance": 25, "com.tldraw.shape.geo": 10, "com.tldraw.shape.draw": 2, "com.tldraw.shape.line": 5, "com.tldraw.shape.note": 9, "com.tldraw.shape.text": 3, "com.tldraw.asset.image": 5, "com.tldraw.asset.video": 5, "com.tldraw.shape.arrow": 6, "com.tldraw.shape.embed": 4, "com.tldraw.shape.frame": 1, "com.tldraw.shape.group": 0, "com.tldraw.shape.image": 5, "com.tldraw.shape.video": 4, "com.tldraw.binding.arrow": 1, "com.tldraw.asset.bookmark": 2, "com.tldraw.shape.bookmark": 2, "com.tldraw.shape.highlight": 1, "com.tldraw.instance_presence": 6, "com.tldraw.instance_page_state": 5}, "schemaVersion": 2}}};

    // 1. Create new row in projects table
    const { data: newProjectData, error: projectError } = await supabase
      .from('projects')
      .insert({ name: name, tldraw_snapshot: emptySnapshot })
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
