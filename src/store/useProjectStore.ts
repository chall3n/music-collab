
import { create } from 'zustand';
import { TLEditorSnapshot } from 'tldraw';

interface Project {
  id: string;
  created_at: string;
  name: string;
  tldraw_snapshot: TLEditorSnapshot | null;
}

interface ProjectState {
  projects: Project[];
  activeProjectId: string | null;
  fetchProjects: () => Promise<boolean>; // Returns true on success, false on failure
  createProject: (name: string) => Promise<boolean>; // Returns true on success, false on failure
  setActiveProject: (projectId: string | null) => void;
  clearProjects: () => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  activeProjectId: null,

  fetchProjects: async () => {
    try {
      const response = await fetch('/api/projects');
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error fetching projects: ${response.status} - ${errorText}`);
        set({ projects: [] }); // Clear projects on error
        return false;
      }
      const data: Project[] = await response.json();

      // Basic runtime type-checking
      if (!Array.isArray(data) || !data.every(item => 
        typeof item.id === 'string' && 
        typeof item.created_at === 'string' && 
        typeof item.name === 'string'
      )) {
        console.error('API response for projects is not in expected format.', data);
        set({ projects: [] });
        return false;
      }

      set({ projects: data });
      // Set the first project as active if none is active
      if (data.length > 0 && !get().activeProjectId) {
        set({ activeProjectId: data[0].id });
      }
      return true;
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      set({ projects: [] }); // Clear projects on unexpected error
      return false;
    }
  },

  createProject: async (name: string) => {
    // Client-side check for duplicate project names
    if (get().projects.some(project => project.name === name)) {
      console.warn(`Project with name "${name}" already exists.`);
      return false;
    }

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error creating project: ${response.status} - ${errorText}`);
        return false;
      }
      const newProject: Project = await response.json();

      // Basic runtime type-checking for new project
      if (!(typeof newProject.id === 'string' && 
            typeof newProject.created_at === 'string' && 
            typeof newProject.name === 'string' &&
            (newProject.tldraw_snapshot === null || typeof newProject.tldraw_snapshot === 'object'))) { // Check for null or object type
        console.error('API response for new project is not in expected format.', newProject);
        return false;
      }

      set((state) => ({
        projects: [...state.projects, newProject],
        activeProjectId: newProject.id, // Set newly created project as active
      }));
      return true;
    } catch (error) {
      console.error('Failed to create project:', error);
      return false;
    }
  },

  setActiveProject: (projectId: string | null) => {
    set({ activeProjectId: projectId });
  },

  clearProjects: () => {
    set({ projects: [], activeProjectId: null });
  },
}));
