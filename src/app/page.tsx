"use client";

// import { useEffect, useState } from "react";
// import { supabase } from "@/lib/supabase";
import Whiteboard from "../components/Whiteboard";

// interface Project {
//   id: number;
//   name: string;
//   created_at: string;
//   created_by: string;
// }

export default function Home() {
  // const [projects, setProjects] = useState<Project[]>([]);
  // const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   getProjects();
  // }, []);

  // async function getProjects() {
  //   try {
  //     console.log("Fetching projects...");
  //     // Log the exact table name we're querying
  //     console.log("Table name:", "projects");
  //     const { data, error } = await supabase.from("projects").select("*");

  //     if (error) {
  //       console.error("Supabase error:", error);
  //       throw error;
  //     }
  //     console.log("Received data:", data);
  //     setProjects(data || []);
  //   } catch (error) {
  //     console.error("Error loading projects:", error);
  //   } finally {
  //     setLoading(false);
  //   }
  // }

  // if (loading) return <div>Loading...</div>;
  return <Whiteboard />;
  // return (
  //   <main className="p-8">
  //     <h1 className="text-2xl font-bold mb-4">Music Collab Projects</h1>
  //     {projects.length === 0 ? (
  //       <p>No projects yet. Add one in your Supabase dashboard!</p>
  //     ) : (
  //       <ul>
  //         {projects.map((project) => (
  //           <li key={project.id} className="mb-2">
  //             {project.name} -{" "}
  //             {new Date(project.created_at).toLocaleDateString()}
  //           </li>
  //         ))}
  //       </ul>
  //     )}
  //   </main>
  // );
}
