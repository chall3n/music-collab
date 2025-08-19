"use client";

import { useProjectStore } from "@/store/useProjectStore";
import { useState } from "react";

export default function ProjectSidebar() {
  const {
    projects,
    activeProjectId,
    setActiveProject,
    createProject,
  } = useProjectStore();
  
  const [newProjectName, setNewProjectName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    setIsCreating(true);
    const success = await createProject(newProjectName.trim());
    if (success) {
      setNewProjectName("");
    }
    setIsCreating(false);
  };

  return (
    <div className="absolute top-0 left-0 h-full w-64 bg-gray-800 text-white p-4 z-50 flex flex-col">
      <h2 className="text-lg font-bold mb-4">Projects</h2>
      <div className="flex-1 overflow-y-auto">
        <ul>
          {projects.map((project) => (
            <li key={project.id} className="mb-2">
              <button
                onClick={() => setActiveProject(project.id)}
                className={`w-full text-left px-2 py-1 rounded ${
                  project.id === activeProjectId
                    ? "bg-blue-500"
                    : "hover:bg-gray-700"
                }`}
              >
                {project.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-4">
        <input
          type="text"
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          placeholder="New project name..."
          className="w-full px-2 py-1 rounded bg-gray-700 text-white"
        />
        <button
          onClick={handleCreateProject}
          disabled={isCreating || !newProjectName.trim()}
          className="w-full mt-2 px-2 py-1 rounded bg-green-600 hover:bg-green-700 disabled:bg-gray-500"
        >
          {isCreating ? "Creating..." : "Create Project"}
        </button>
      </div>
    </div>
  );
}