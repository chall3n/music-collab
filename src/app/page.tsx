"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Project {
  id: number;
  name: string;
  created_at: string;
  created_by: string;
  // Add other fields from your Supabase table
}

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProjects();
  }, []);

  async function getProjects() {
    try {
      const { data, error } = await supabase.from("projects").select("*");

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error loading projects:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Music Collab Projects</h1>
      {projects.length === 0 ? (
        <p>No projects yet. Add one in your Supabase dashboard!</p>
      ) : (
        <ul>
          {projects.map((project) => (
            <li key={project.id} className="mb-2">
              {project.name} -{" "}
              {new Date(project.created_at).toLocaleDateString()}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
